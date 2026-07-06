const express = require('express');
const { getDepartments } = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route:  GET /api/departments
// Access: Private (All logged in users can view departments)
router.get('/', protect, getDepartments);

module.exports = router;
