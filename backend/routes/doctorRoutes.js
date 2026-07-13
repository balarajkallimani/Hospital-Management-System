const express = require('express');
const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Route:  POST /api/doctors
// Access: Private (Admin only)
router.post('/', protect, restrictTo('admin'), createDoctor);

// Route:  GET /api/doctors
// Access: Private (All logged in users can view doctor directories)
router.get('/', protect, getDoctors);

// Route:  GET /api/doctors/:id
// Access: Private (All logged in users can query specific doctor slots)
router.get('/:id', protect, getDoctorById);

// Route:  PUT /api/doctors/:id
// Access: Private (Admin and Doctor)
router.put('/:id', protect, restrictTo('admin', 'doctor'), updateDoctor);

// Route:  DELETE /api/doctors/:id
// Access: Private (Admin only)
router.delete('/:id', protect, restrictTo('admin'), deleteDoctor);

module.exports = router;
