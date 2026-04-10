const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const customerController = require('../controllers/customerController');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
  getPonStats,
  importCustomers,
} = require("../controllers/customerController");

router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.post('/bulk-delete', customerController.bulkDeleteCustomers);
router.get('/pon-stats', customerController.getPonStats);
router.post("/import", upload.single("file"), importCustomers);

module.exports = router;
