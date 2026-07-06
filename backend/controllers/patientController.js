const Patient = require('../models/Patient');
const User = require('../models/User');

/**
 * @desc    Create/Register a new patient
 * @route   POST /api/patients
 * @access  Private (Admin, Receptionist)
 */
const createPatient = async (req, res) => {
  let createdUser = null;
  try {
    const { name, email, password, phone, dateOfBirth, gender, bloodGroup, address, emergencyContact, image } = req.body;

    // 1. Validate fields
    if (!name || !email || !password || !phone || !dateOfBirth || !gender || !bloodGroup || !emergencyContact) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
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
      role: 'patient' // Enforce patient role
    });

    // 4. Create the patient profile document linked to the user
    const patient = await Patient.create({
      user: createdUser._id,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
      image
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient: {
        id: patient._id,
        user: {
          id: createdUser._id,
          name: createdUser.name,
          email: createdUser.email,
        },
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        address: patient.address,
        emergencyContact: patient.emergencyContact
      }
    });

  } catch (error) {
    // PREVENT ORPHANS: If patient profile fails but user was created, roll back user creation
    if (createdUser) {
      await User.findByIdAndDelete(createdUser._id);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all patients with search & pagination
 * @route   GET /api/patients
 * @access  Private (Admin, Doctor, Receptionist)
 */
const getPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};

    // 1. If search term is present, perform case-insensitive regex on user name/email
    if (search) {
      const matchingUsers = await User.find({
        role: 'patient',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      });

      const userIds = matchingUsers.map(u => u._id);
      // Filter patients belonging to those users
      query.user = { $in: userIds };
    }

    // 2. Fetch total count of documents matching the query (needed for pagination count)
    const total = await Patient.countDocuments(query);

    // 3. Query patients, populate the user details, apply pagination skip/limit
    const patients = await Patient.find(query)
      .populate('user', 'name email role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Newest patients first

    res.status(200).json({
      success: true,
      count: patients.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      patients
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get a single patient profile by ID
 * @route   GET /api/patients/:id
 * @access  Private (Admin, Doctor, Receptionist)
 */
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('user', 'name email role');

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    res.status(200).json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update a patient profile
 * @route   PUT /api/patients/:id
 * @access  Private (Admin, Receptionist)
 */
const updatePatient = async (req, res) => {
  try {
    const { name, phone, dateOfBirth, gender, bloodGroup, address, emergencyContact, image } = req.body;

    // 1. Find Patient
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    // 2. Update linked User name if supplied
    if (name) {
      await User.findByIdAndUpdate(patient.user, { name }, { new: true });
    }

    // 3. Update Patient details
    patient.phone = phone || patient.phone;
    patient.dateOfBirth = dateOfBirth || patient.dateOfBirth;
    patient.gender = gender || patient.gender;
    patient.bloodGroup = bloodGroup || patient.bloodGroup;
    patient.address = address || patient.address;
    patient.emergencyContact = emergencyContact || patient.emergencyContact;
    patient.image = image !== undefined ? image : patient.image;

    const updatedPatient = await patient.save();
    const populatedPatient = await updatedPatient.populate('user', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Patient profile updated successfully',
      patient: populatedPatient
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a patient and their User credentials
 * @route   DELETE /api/patients/:id
 * @access  Private (Admin only)
 */
const deletePatient = async (req, res) => {
  try {
    // 1. Find Patient
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    // 2. Delete linked User login account
    await User.findByIdAndDelete(patient.user);

    // 3. Delete Patient document
    await Patient.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Patient and associated login account deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
};
