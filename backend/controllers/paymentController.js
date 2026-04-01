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
    const {
      paymentType = "FULL",
      amountPaid,
      planMonths = 1,
      notes = "",
    } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (!amountPaid || amountPaid <= 0) {
      return res.status(400).json({ success: false, message: "amountPaid must be > 0" });
    }

    const now = new Date();
    const validFrom = now;
    const validTill = calcValidTill(now, planMonths);

    if (paymentType === "FULL") {
      customer.status = "PAID";
      customer.partialAmountPaid = 0;
      customer.carryOver = 0;
      customer.planMonths = planMonths;
      customer.lastPaymentDate = now;
      customer.validTill = validTill;
    } else if (paymentType === "PARTIAL") {
      const fullDue = customer.planAmount - (customer.carryOver || 0);
      const remaining = fullDue - amountPaid;
      customer.status = "PARTIAL";
      customer.partialAmountPaid = amountPaid;
      customer.carryOver = remaining > 0 ? remaining : 0;
      customer.planMonths = 1;
      customer.lastPaymentDate = now;
      // Partial: still set validTill for 30 days but they owe balance
      customer.validTill = validTill;
    }

    if (notes) customer.notes = notes;
    await customer.save();

    // Save payment record
    const payment = await Payment.create({
      customer: customer._id,
      cafNumber: customer.cafNumber,
      customerName: customer.name,
      amountPaid,
      planMonths,
      paymentType,
      paymentDate: now,
      validFrom,
      validTill,
      notes,
    });

    res.json({
      success: true,
      message: `Marked as ${paymentType}`,
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
