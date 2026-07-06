const express = require('express');
const { getHospitalStats } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Route:  GET /api/reports/stats
// Access: Private (Admin role only has read privileges to hospital statistics)
router.get('/stats', protect, restrictTo('admin'), getHospitalStats);

module.exports = router;
