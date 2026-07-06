const Department = require('../models/Department');

/**
 * @desc    Get all departments
 * @route   GET /api/departments
 * @access  Public (So patients can see departments on scheduling forms)
 */
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 }); // Sorted alphabetically
    res.status(200).json({
      success: true,
      count: departments.length,
      departments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDepartments
};
