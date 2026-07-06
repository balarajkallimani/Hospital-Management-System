/**
 * Middleware to restrict access to specific roles.
 * Must be placed AFTER the 'protect' middleware since it relies on 'req.user'.
 * 
 * @param {...string} roles - The roles that are allowed to access the route (e.g., 'admin', 'doctor')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // 1. Check if req.user exists (set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user profile missing'
      });
    }

    // 2. Verify if the user's role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource`
      });
    }

    // 3. If authorized, let them proceed
    next();
  };
};

module.exports = { restrictTo };
