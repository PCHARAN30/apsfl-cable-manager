const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getExpiringCustomers,
  getMonthlyChart,
} = require("../controllers/dashboardController");
const { resetDashboard } = require("../controllers/resetController");

router.get("/stats", getDashboardStats);
router.get("/expiring", getExpiringCustomers);
router.get("/monthly-chart", getMonthlyChart);
router.post("/reset", resetDashboard);

module.exports = router;
