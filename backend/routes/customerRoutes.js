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

// ⚠️ SPECIFIC routes MUST come before /:id wildcard
router.get('/pon-stats', getPonStats);
router.post('/bulk-delete', bulkDeleteCustomers);
router.post('/import', upload.single('file'), importCustomers);

// General CRUD
router.get('/', getCustomers);
router.post('/', createCustomer);

// /:id wildcard LAST — otherwise it shadows everything above
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;