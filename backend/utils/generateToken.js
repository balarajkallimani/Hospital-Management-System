const jwt = require('jsonwebtoken');

/**
 * Generates a signed JSON Web Token (JWT) for a user.
 * @param {string} id - The MongoDB User ID
 * @param {string} role - The user role (admin, doctor, receptionist, patient)
 * @returns {string} - The signed JWT token
 */
const generateToken = (id, role) => {
  // Sign the token with the payload, secret key, and expiration time
  return jwt.sign(
    { id, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' } // Token is valid for 30 days
  );
};

module.exports = generateToken;
