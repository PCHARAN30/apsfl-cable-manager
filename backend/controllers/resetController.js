const Customer = require("../models/Customer");
const Payment = require("../models/Payment");

/** POST /api/dashboard/reset — wipe all payments and mark all UNPAID */
exports.resetDashboard = async (req, res) => {
  try {
    await Promise.all([
      Customer.updateMany({}, {
        $set: {
          status: "UNPAID",
          partialAmountPaid: 0,
          carryOver: 0,
          lastPaymentDate: null,
          validTill: null,
          planMonths: 1,
          isMigrated: false,
          billingStartDate: null,
          notes: '',
        }
      }),
      Payment.deleteMany({}),
    ]);
    res.json({ success: true, message: "Dashboard reset successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
