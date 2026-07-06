const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Billing = require('../models/Billing');

/**
 * @desc    Get aggregated hospital metrics & monthly revenue trends
 * @route   GET /api/reports/stats
 * @access  Private (Admin only)
 */
const getHospitalStats = async (req, res) => {
  try {
    // 1. Gather total counts for Patients, Doctors, and overall Appointments
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    // 2. Aggregate Appointment statuses
    const appointmentStatuses = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Map status breakdown array to a clean object
    const appointmentsBreakdown = {
      pending: 0,
      approved: 0,
      completed: 0,
      cancelled: 0
    };
    appointmentStatuses.forEach((statusGroup) => {
      if (statusGroup._id && appointmentsBreakdown.hasOwnProperty(statusGroup._id)) {
        appointmentsBreakdown[statusGroup._id] = statusGroup.count;
      }
    });

    // 3. Aggregate Total Paid Revenue
    const revenueAggregate = await Billing.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    const totalRevenue = revenueAggregate[0] ? revenueAggregate[0].total : 0;

    // 4. Aggregate Monthly Revenue (Group paid bills by YYYY-MM)
    const monthlyRevenueAggregate = await Billing.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } } // Sort chronologically ascending
    ]);

    // Convert _id to 'month' key for cleaner client readability
    const monthlyRevenue = monthlyRevenueAggregate.map((item) => ({
      month: item._id,
      revenue: item.revenue
    }));

    // 5. Send aggregated payload back to the client
    res.status(200).json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        appointmentsBreakdown,
        totalRevenue,
        monthlyRevenue
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to aggregate hospital analytics.',
      error: error.message
    });
  }
};

module.exports = {
  getHospitalStats
};
