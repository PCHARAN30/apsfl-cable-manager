const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const { calcValidTill } = require("../utils/dateUtils");

// ─── Mark Payment ─────────────────────────────────────────────────────────────

/**
 * POST /api/payments/mark/:customerId
 * Body: { paymentType: "FULL"|"PARTIAL", amountPaid, planMonths, paymentMethod }
 */
exports.markPayment = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { amountPaid, paymentMethod = "Cash" } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (!amountPaid || Number(amountPaid) <= 0) {
      return res.status(400).json({ success: false, message: "amountPaid must be > 0" });
    }

    const now = new Date();
    const SYSTEM_START_DATE = new Date("2026-01-01T00:00:00.000Z");
    const isOldCustomer = !customer.validTill || new Date(customer.validTill) < SYSTEM_START_DATE;

    if (isOldCustomer) {
      customer.carryOver = 0;
      customer.partialAmountPaid = 0;
      // Wipe dirty historical data to start completely fresh
      await Payment.deleteMany({ customer: customer._id });
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

    const dateStr = now.toLocaleDateString("en-IN");
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
    let generatedNote = `Paid via ${paymentMethod.toLowerCase()} on ${dateStr} at ${timeStr}`;

    // Base calculations
    let baseDate;
    if (isOldCustomer) {
      baseDate = now;
      customer.billingStartDate = now; // Lock new Bill Start Date as the exact Payment Date
      customer.isMigrated = true;
      generatedNote = `[System: Auto-Migrated] ` + generatedNote;
    } else {
      const nextCycleStart = new Date(customer.validTill);
      nextCycleStart.setDate(nextCycleStart.getDate() + 1);
      
      const nextStartNormalized = new Date(nextCycleStart.getFullYear(), nextCycleStart.getMonth(), nextCycleStart.getDate());
      const todayNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      baseDate = nextStartNormalized < todayNormalized ? now : nextCycleStart;
    }
    
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
    customer.notes = generatedNote;
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
      notes: generatedNote,
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
    const { singleMonth } = req.query;

    const paymentToDelete = await Payment.findById(paymentId);
    if (!paymentToDelete) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    const customerId = paymentToDelete.customer;
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Associated customer not found" });
    }

    const planAmount = customer.planAmount || 300;
    let monthsRemoved = 0;

    // 1. Reduce multi-month payment by 1 month OR delete entirely
    if (singleMonth === 'true' && paymentToDelete.amountPaid > planAmount && paymentToDelete.planMonths > 1) {
      paymentToDelete.amountPaid -= planAmount;
      paymentToDelete.planMonths -= 1;
      await paymentToDelete.save();
      monthsRemoved = 1;
    } else {
      monthsRemoved = paymentToDelete.planMonths || Math.max(1, Math.floor(paymentToDelete.amountPaid / planAmount));
      await Payment.findByIdAndDelete(paymentId);
    }

    // 2. Safely rollback validity without recalculating from start
    if (customer.validTill) {
      const d = new Date(customer.validTill);
      const currentDay = d.getDate() + 1;
      d.setDate(d.getDate() + 1);
      d.setMonth(d.getMonth() - monthsRemoved);
      if (d.getDate() !== currentDay) {
        d.setDate(0);
      }
      d.setDate(d.getDate() - 1);
      
      // Floor to either the billingStartDate target or the original connection
      const baseFloorDate = customer.billingStartDate 
        ? new Date(new Date(customer.billingStartDate).getTime() - 24*60*60*1000) 
        : (customer.connectionDate || customer.createdAt);
        
      if (baseFloorDate && d < baseFloorDate) {
        customer.validTill = baseFloorDate; 
      } else {
        customer.validTill = d;
      }
    }

    // 3. Re-evaluate customer status against today
    const now = new Date();
    if (customer.validTill && customer.validTill < now) {
      customer.status = "UNPAID";
    } else {
      customer.status = customer.carryOver > 0 ? "PARTIAL" : "PAID";
    }

    const lastPayment = await Payment.findOne({ customer: customerId }).sort({ paymentDate: -1 });
    customer.lastPaymentDate = lastPayment ? lastPayment.paymentDate : null;

    await customer.save();
    res.json({ success: true, message: "Payment history updated." });
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
    const [payments, total, totalAmountAgg] = await Promise.all([
      Payment.find(query).lean().sort({ paymentDate: -1 }).skip(skip).limit(parseInt(limit)),
      Payment.countDocuments(query),
      Payment.aggregate([
        { $match: query },
        { $group: { _id: null, sum: { $sum: '$amountPaid' } } }
      ])
    ]);

    const totalAmount = totalAmountAgg[0]?.sum || 0;
    res.json({ success: true, total, totalAmount, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
