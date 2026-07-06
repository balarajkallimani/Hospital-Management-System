const Doctor = require('../models/Doctor');
const User = require('../models/User');

/**
 * @desc    Register a new doctor
 * @route   POST /api/doctors
 * @access  Private (Admin only)
 */
const createDoctor = async (req, res) => {
  let createdUser = null;
  try {
    const { name, email, password, department, specialization, qualification, experience, fees, availability, image } = req.body;

    // 1. Validate fields
    if (!name || !email || !password || !department || !specialization || !qualification || !experience || !fees) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'A user already exists with this email address' });
    }

    // 3. Create the user credential document
    createdUser = await User.create({
      name,
      email,
      password,
      role: 'doctor' // Enforce doctor role
    });

    // 4. Create the doctor profile document linked to the user
    // availability defaults to empty array if not supplied
    const doctor = await Doctor.create({
      user: createdUser._id,
      department,
      specialization,
      qualification,
      experience,
      fees,
      availability: availability || [],
      image
    });

    res.status(201).json({
      success: true,
      message: 'Doctor registered successfully',
      doctor: {
        id: doctor._id,
        user: {
          id: createdUser._id,
          name: createdUser.name,
          email: createdUser.email,
        },
        department: doctor.department,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        fees: doctor.fees,
        availability: doctor.availability
      }
    });

  } catch (error) {
    // PREVENT ORPHANS: Rollback user creation if doctor profile creation fails
    if (createdUser) {
      await User.findByIdAndDelete(createdUser._id);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all doctors (with optional department filter)
 * @route   GET /api/doctors
 * @access  Private (Admin, Doctor, Receptionist, Patient)
 */
const getDoctors = async (req, res) => {
  try {
    const { department } = req.query;
    let query = {};

    // 1. Filter by department if supplied in query params
    if (department) {
      query.department = department;
    }

    // 2. Query doctors and populate user and department details
    const doctors = await Doctor.find(query)
      .populate('user', 'name email role')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get a single doctor profile by ID
 * @route   GET /api/doctors/:id
 * @access  Private (Admin, Doctor, Receptionist, Patient)
 */
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'name email role')
      .populate('department', 'name');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    res.status(200).json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update a doctor profile
 * @route   PUT /api/doctors/:id
 * @access  Private (Admin only)
 */
const updateDoctor = async (req, res) => {
  try {
    const { name, department, specialization, qualification, experience, fees, availability, image } = req.body;

    // 1. Find Doctor
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    // 2. Update linked User name if supplied
    if (name) {
      await User.findByIdAndUpdate(doctor.user, { name });
    }

    // 3. Update Doctor details
    doctor.department = department || doctor.department;
    doctor.specialization = specialization || doctor.specialization;
    doctor.qualification = qualification || doctor.qualification;
    doctor.experience = experience !== undefined ? experience : doctor.experience;
    doctor.fees = fees !== undefined ? fees : doctor.fees;
    doctor.availability = availability || doctor.availability;
    doctor.image = image !== undefined ? image : doctor.image;

    const updatedDoctor = await doctor.save();
    const populatedDoctor = await updatedDoctor.populate([
      { path: 'user', select: 'name email role' },
      { path: 'department', select: 'name' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      doctor: populatedDoctor
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a doctor and their User credentials
 * @route   DELETE /api/doctors/:id
 * @access  Private (Admin only)
 */
const deleteDoctor = async (req, res) => {
  try {
    // 1. Find Doctor
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    // 2. Delete linked User login account
    await User.findByIdAndDelete(doctor.user);

    // 3. Delete Doctor document
    await Doctor.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Doctor and associated login account deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
};
