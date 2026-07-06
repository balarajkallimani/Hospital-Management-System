const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

/**
 * @desc    Create a new patient medical record
 * @route   POST /api/medical-records
 * @access  Private (Doctor only)
 */
const createMedicalRecord = async (req, res) => {
  try {
    const { patient, symptoms, diagnosis, prescription, notes } = req.body;

    // 1. Validate required inputs
    if (!patient || !symptoms || !diagnosis) {
      return res.status(400).json({ success: false, message: 'Please provide patient, symptoms, and diagnosis fields' });
    }

    // 2. Verify Doctor profile exists for this logged in user account
    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found for this logged in user' });
    }

    // 3. Verify Patient profile exists
    const patientObj = await Patient.findById(patient);
    if (!patientObj) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    // 4. Create the Medical Record
    const medicalRecord = await MedicalRecord.create({
      patient,
      doctor: doctorProfile._id,
      symptoms,
      diagnosis,
      prescription: prescription || [],
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      medicalRecord
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all medical records (Filtered by roles)
 * @route   GET /api/medical-records
 * @access  Private (All roles)
 */
const getMedicalRecords = async (req, res) => {
  try {
    let filter = {};

    // Filter results according to role constraints
    if (req.user.role === 'patient') {
      const patientProfile = await Patient.findOne({ user: req.user.id });
      if (!patientProfile) {
        return res.status(200).json({ success: true, count: 0, medicalRecords: [] });
      }
      filter.patient = patientProfile._id;
    } else if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: req.user.id });
      if (!doctorProfile) {
        return res.status(200).json({ success: true, count: 0, medicalRecords: [] });
      }
      filter.doctor = doctorProfile._id;
    }

    // Query records with deep populates
    const medicalRecords = await MedicalRecord.find(filter)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'department', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 }); // Newest records first

    res.status(200).json({
      success: true,
      count: medicalRecords.length,
      medicalRecords
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get full medical history timeline of a specific patient
 * @route   GET /api/medical-records/patient/:patientId
 * @access  Private (Admin, Doctor, Receptionist, and the specific Patient)
 */
const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    // 1. Guard check: Patients can only view their own history files
    if (req.user.role === 'patient') {
      const patientProfile = await Patient.findOne({ user: req.user.id });
      if (!patientProfile || patientProfile._id.toString() !== patientId) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this patient history' });
      }
    }

    // 2. Fetch all medical records matching patientId
    const history = await MedicalRecord.find({ patient: patientId })
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'department', select: 'name' }
        ]
      })
      .sort({ date: -1 }); // Chronological reverse (timeline style)

    res.status(200).json({
      success: true,
      count: history.length,
      history
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMedicalRecord,
  getMedicalRecords,
  getPatientHistory
};
