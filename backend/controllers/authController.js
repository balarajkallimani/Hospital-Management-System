const User = require('../models/User');
const Patient = require('../models/Patient');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user (Admin, Doctor, Receptionist, Patient)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validate that all required fields are present
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    // 2. Check if a user already exists with this email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address' });
    }

    // 3. Create the new user (the pre-save hook will hash the password)
    const user = await User.create({
      name,
      email,
      password,
      role // Defaults to 'patient' if not provided
    });

    // If the registered user is a patient, auto-create a default patient profile document
    // linked to their user ID to ensure they can book appointments immediately.
    if (user.role === 'patient') {
      await Patient.create({
        user: user._id,
        phone: 'Not provided',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'other',
        bloodGroup: 'O+',
        emergencyContact: {
          name: 'Not provided',
          phone: '000-000-0000',
          relation: 'other'
        }
      });
    }

    // 4. Generate JWT token
    const token = generateToken(user._id, user.role);

    // 5. Send response back to the client
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // 2. Find user in database and explicitly request the password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 3. Compare passwords using the schema helper method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 4. Generate JWT token
    const token = generateToken(user._id, user.role);

    // 5. Return success response with token
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private (Requires JWT token in header)
 */
const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware after verifying JWT
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
