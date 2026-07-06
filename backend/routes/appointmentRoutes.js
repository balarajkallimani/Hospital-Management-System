const express = require('express');
const {
  createAppointment,
  getAppointments,
  updateAppointmentStatus
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Route:  POST /api/appointments
// Access: Private (Admin, Receptionist, and Patients can book appointments)
router.post('/', protect, restrictTo('admin', 'receptionist', 'patient'), createAppointment);

// Route:  GET /api/appointments
// Access: Private (All authenticated roles can list their respective appointments)
router.get('/', protect, getAppointments);

// Route:  PUT /api/appointments/:id/status
// Access: Private (All authenticated roles can modify status, restricted by logic in controller)
router.put('/:id/status', protect, updateAppointmentStatus);

module.exports = router;
