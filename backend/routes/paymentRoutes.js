const express = require("express");
const router = express.Router();
const {
  markPayment,
  markUnpaid,
  getPaymentHistory,
  getAllPayments,
} = require("../controllers/paymentController");

router.post("/mark/:customerId", markPayment);
router.post("/unpaid/:customerId", markUnpaid);
router.get("/history/:customerId", getPaymentHistory);
router.get("/all", getAllPayments);

module.exports = router;
