const express = require('express');
const {
  createMedicalRecord,
  getMedicalRecords,
  getPatientHistory
} = require('../controllers/medicalRecordController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Route:  POST /api/medical-records
// Access: Private (Only Doctors can create diagnostics/prescriptions)
router.post('/', protect, restrictTo('doctor'), createMedicalRecord);

// Route:  GET /api/medical-records
// Access: Private (All authenticated roles can read history summaries)
router.get('/', protect, getMedicalRecords);

// Route:  GET /api/medical-records/patient/:patientId
// Access: Private (Staff and matching Patient only)
router.get('/patient/:patientId', protect, getPatientHistory);

module.exports = router;
