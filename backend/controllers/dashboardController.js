const Customer = require("../models/Customer");
const Payment = require("../models/Payment");

/** GET /api/dashboard/stats */
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    // Today boundaries
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // This month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalCustomers,
      paidCount,
      unpaidCount,
      partialCount,
      unpaidCustomers,
      partialCustomers,
      todayPayments,
      monthPayments,
      expiringSoon,
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ status: "PAID" }),
      Customer.countDocuments({ status: "UNPAID" }),
      Customer.countDocuments({ status: "PARTIAL" }),

      // UNPAID customers — sum of their planAmount = total still to receive
      Customer.find({ status: "UNPAID" }).select("planAmount carryOver").lean(),

      // PARTIAL customers — sum of remaining carry-over
      Customer.find({ status: "PARTIAL" }).select("planAmount carryOver partialAmountPaid").lean(),

      // Today's income
      Payment.aggregate([
        { $match: { paymentDate: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } },
      ]),

      // This month's income
      Payment.aggregate([
        { $match: { paymentDate: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } },
      ]),

      // Expiring in next 5 days
      Customer.countDocuments({
        status: "PAID",
        validTill: {
          $gte: now,
          $lte: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // Total to receive = all unpaid planAmount + partial carry-overs
    const totalToReceive =
      unpaidCustomers.reduce((sum, c) => sum + (c.planAmount || 300), 0) +
      partialCustomers.reduce((sum, c) => sum + (c.carryOver || 0), 0);

    const dailyIncome = todayPayments[0]?.total || 0;
    const monthlyIncome = monthPayments[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalCustomers,
        paidCount,
        unpaidCount,
        partialCount,
        totalToReceive,
        dailyIncome,
        monthlyIncome,
        expiringSoon,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/dashboard/expiring — customers expiring in next N days */
exports.getExpiringCustomers = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 5;
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const customers = await Customer.find({
      status: { $in: ["PAID", "PARTIAL"] },
      validTill: { $gte: now, $lte: future },
    })
      .lean()
      .sort({ validTill: 1 });

    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/dashboard/monthly-chart — income per day for current month */
exports.getMonthlyChart = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const data = await Payment.aggregate([
      { $match: { paymentDate: { $gte: monthStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
          income: { $sum: "$amountPaid" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
