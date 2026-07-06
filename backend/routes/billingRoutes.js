const express = require('express');
const {
  createBill,
  getBills,
  getBillById,
  updateBillStatus
} = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Route:  POST /api/billing
// Access: Private (Admin and Receptionists only can issue invoices)
router.post('/', protect, restrictTo('admin', 'receptionist'), createBill);

// Route:  GET /api/billing
// Access: Private (All authenticated roles can read billing summaries)
router.get('/', protect, getBills);

// Route:  GET /api/billing/:id
// Access: Private (All authenticated roles can read invoice details, restricted by ownership)
router.get('/:id', protect, getBillById);

// Route:  PUT /api/billing/:id/payment
// Access: Private (Admin and Receptionists only can collect payment)
router.put('/:id/payment', protect, restrictTo('admin', 'receptionist'), updateBillStatus);

module.exports = router;
