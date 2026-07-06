const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Route:  GET /api/test-roles/admin-only
// Access: Private (Admins only)
router.get('/admin-only', protect, restrictTo('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome, Administrator! You have access to this super-user panel.',
    user: req.user
  });
});

// Route:  GET /api/test-roles/staff-only
// Access: Private (Admins, Doctors, and Receptionists only)
router.get('/staff-only', protect, restrictTo('admin', 'doctor', 'receptionist'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Staff access authorized! Welcome to the hospital workstation.',
    user: req.user
  });
});

module.exports = router;
