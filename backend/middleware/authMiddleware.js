const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect private routes.
 * Verifies the JWT sent in the Authorization header.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extract the token from the header (e.g., "Bearer eyJhbGciOi...")
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find the user associated with this token and attach to the request
      // We exclude the password field for security
      req.user = await User.findById(decoded.id).select('-password');

      // 5. Call next() to proceed to the controller
      next();
    } catch (error) {
      console.error('JWT Verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token verification failed'
      });
    }
  }

  // 6. If no token was found in the header
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

module.exports = { protect };
