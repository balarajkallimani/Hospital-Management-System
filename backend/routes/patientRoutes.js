const express = require('express');
const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Route:  POST /api/patients
// Access: Private (Admin and Receptionist only)
router.post('/', protect, restrictTo('admin', 'receptionist'), createPatient);

// Route:  GET /api/patients
// Access: Private (Admin, Doctor, and Receptionist only)
router.get('/', protect, restrictTo('admin', 'doctor', 'receptionist'), getPatients);

// Route:  GET /api/patients/:id
// Access: Private (Admin, Doctor, and Receptionist only)
router.get('/:id', protect, restrictTo('admin', 'doctor', 'receptionist'), getPatientById);

// Route:  PUT /api/patients/:id
// Access: Private (Admin, Doctor, and Receptionist only)
router.put('/:id', protect, restrictTo('admin', 'doctor', 'receptionist'), updatePatient);

// Route:  DELETE /api/patients/:id
// Access: Private (Admin only)
router.delete('/:id', protect, restrictTo('admin'), deletePatient);

module.exports = router;
