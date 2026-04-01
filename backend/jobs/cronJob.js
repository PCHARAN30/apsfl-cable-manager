const cron = require("node-cron");
const Customer = require("../models/Customer");

/**
 * Runs every day at 9:00 AM
 * Marks any PAID/PARTIAL customer whose validTill < today as UNPAID
 */
const startCronJobs = () => {
  cron.schedule("0 9 * * *", async () => {
    console.log(`[CRON] Running expiry check at ${new Date().toISOString()}`);
    try {
      const now = new Date();

      const result = await Customer.updateMany(
        {
          status: { $in: ["PAID", "PARTIAL"] },
          validTill: { $lt: now },
        },
        {
          $set: {
            status: "UNPAID",
            partialAmountPaid: 0,
          },
        }
      );

      console.log(`[CRON] ✅ Marked ${result.modifiedCount} customers as UNPAID (expired)`);
    } catch (err) {
      console.error(`[CRON] ❌ Error during expiry check: ${err.message}`);
    }
  });

  console.log("⏰ Cron job scheduled: Daily expiry check at 9:00 AM");
};

module.exports = startCronJobs;
