const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route: Register User
// Path:  POST /api/auth/register
router.post('/register', registerUser);

// Route: Login User
// Path:  POST /api/auth/login
router.post('/login', loginUser);

// Route: Get Current User Profile (Protected)
// Path:  GET /api/auth/me
// Note:  We pass the 'protect' middleware to secure this route
router.get('/me', protect, getMe);

module.exports = router;
