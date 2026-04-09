const Customer = require("../models/Customer");
const Payment = require("../models/Payment");

const calcValidTill = (baseDate, planMonths = 1) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + planMonths * 30);
  return d;
};

// ─── Mark Payment ─────────────────────────────────────────────────────────────

/**
 * POST /api/payments/mark/:customerId
 * Body: { paymentType: "FULL"|"PARTIAL", amountPaid, planMonths, notes }
 */
exports.markPayment = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { amountPaid, notes = "" } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (!amountPaid || Number(amountPaid) <= 0) {
      return res.status(400).json({ success: false, message: "amountPaid must be > 0" });
    }

    const planAmount = customer.planAmount || 300;
    let funds = Number(amountPaid);
    let debt = customer.carryOver || 0;
    let monthsToAdvance = 0;

    // FIFO Payment Distribution
    if (funds < debt) {
      // Partially paying off existing debt
      customer.carryOver = debt - funds;
      customer.partialAmountPaid = (customer.partialAmountPaid || 0) + funds;
    } else {
      // Clears current debt, allocate rest to future months
      funds -= debt;
      let fullMonths = Math.floor(funds / planAmount);
      let remainder = funds % planAmount;
      
      monthsToAdvance = fullMonths;
      if (remainder > 0) {
        monthsToAdvance += 1;
        customer.carryOver = planAmount - remainder;
        customer.partialAmountPaid = remainder;
      } else {
        customer.carryOver = 0;
        customer.partialAmountPaid = 0;
      }
    }

    const now = new Date();
    let baseDate = customer.validTill || now;
    
    if (monthsToAdvance > 0) {
      customer.validTill = calcValidTill(baseDate, monthsToAdvance);
    }

    // Status evaluation based on real-time balance & validity
    if (customer.carryOver > 0) {
      customer.status = "PARTIAL";
    } else if (customer.validTill && customer.validTill < now) {
      customer.status = "UNPAID";
    } else {
      customer.status = "PAID";
    }

    customer.lastPaymentDate = now;
    if (notes) customer.notes = notes;
    await customer.save();

    const payment = await Payment.create({
      customer: customer._id,
      cafNumber: customer.cafNumber,
      customerName: customer.name,
      amountPaid: Number(amountPaid),
      planMonths: monthsToAdvance || 1, // Metadata for history
      paymentType: customer.carryOver > 0 ? "PARTIAL" : "FULL",
      paymentDate: now,
      validFrom: baseDate,
      validTill: customer.validTill || baseDate,
      notes,
    });

    res.json({
      success: true,
      message: `Payment of ₹${amountPaid} recorded`,
      customer,
      payment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** POST /api/payments/unpaid/:customerId — manually mark as unpaid */
exports.markUnpaid = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.customerId,
      {
        status: "UNPAID",
        partialAmountPaid: 0,
        carryOver: 0,
      },
      { new: true }
    ).lean();

    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /api/payments/:paymentId — delete a payment and recalculate customer state */
exports.deletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const paymentToDelete = await Payment.findById(paymentId);
    if (!paymentToDelete) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    const customerId = paymentToDelete.customer;

    await Payment.findByIdAndDelete(paymentId);

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Associated customer not found" });
    }

    // Recalculate customer state from their remaining payments
    const remainingPayments = await Payment.find({ customer: customerId }).sort({ paymentDate: 1 });

    // Reset customer's financial state to their "factory settings"
    customer.status = 'UNPAID';
    customer.partialAmountPaid = 0;
    customer.carryOver = 0;
    customer.validTill = customer.connectionDate || customer.createdAt || new Date();
    customer.lastPaymentDate = null;

    const planAmount = customer.planAmount || 300;

    // Re-apply FIFO logic for each remaining payment
    for (const payment of remainingPayments) {
      let funds = Number(payment.amountPaid);
      let debt = customer.carryOver || 0;
      let monthsToAdvance = 0;

      if (funds < debt) {
        customer.carryOver = debt - funds;
        customer.partialAmountPaid = (customer.partialAmountPaid || 0) + funds;
      } else {
        funds -= debt;
        let fullMonths = Math.floor(funds / planAmount);
        let remainder = funds % planAmount;
        
        monthsToAdvance = fullMonths;
        if (remainder > 0) {
          monthsToAdvance += 1;
          customer.carryOver = planAmount - remainder;
          customer.partialAmountPaid = remainder;
        } else {
          customer.carryOver = 0;
          customer.partialAmountPaid = 0;
        }
      }

      let baseDate = customer.validTill || new Date();
      if (monthsToAdvance > 0) {
        customer.validTill = calcValidTill(baseDate, monthsToAdvance);
      }
      customer.lastPaymentDate = payment.paymentDate;
    }

    await customer.save();
    res.json({ success: true, message: "Payment deleted and customer status recalculated." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Payment History ──────────────────────────────────────────────────────────

/** GET /api/payments/history/:customerId */
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ customer: req.params.customerId })
      .lean()
      .sort({ paymentDate: -1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/payments/all — all payments with optional date range */
exports.getAllPayments = async (req, res) => {
  try {
    const { from, to, page = 1, limit = 50 } = req.query;
    const query = {};

    if (from || to) {
      query.paymentDate = {};
      if (from) query.paymentDate.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = toDate;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [payments, total] = await Promise.all([
      Payment.find(query).lean().sort({ paymentDate: -1 }).skip(skip).limit(parseInt(limit)),
      Payment.countDocuments(query),
    ]);

    res.json({ success: true, total, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
