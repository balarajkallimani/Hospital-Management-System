const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

/**
 * @desc    Book a new appointment
 * @route   POST /api/appointments
 * @access  Private (Patient, Receptionist, Admin)
 */
const createAppointment = async (req, res) => {
  try {
    const { doctor, department, date, timeSlot, reason } = req.body;
    let { patient } = req.body;

    // 1. If logged in as patient, enforce their own patient ID
    if (req.user.role === 'patient') {
      let patientProfile = await Patient.findOne({ user: req.user.id });
      
      // Fallback: Auto-create a default profile on the fly if missing (supports legacy accounts)
      if (!patientProfile) {
        patientProfile = await Patient.create({
          user: req.user.id,
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
        console.log(`Fallback: On-the-fly Patient profile generated for user ID: ${req.user.id}`);
      }
      
      patient = patientProfile._id;
    } else {
      // Admin/Receptionist must provide patient ID in req.body
      if (!patient) {
        return res.status(400).json({ success: false, message: 'Please specify a patient profile ID' });
      }
    }

    // 2. Validate required inputs
    if (!doctor || !department || !date || !timeSlot || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide all required details' });
    }

    // 3. Find Doctor details and verify availability
    const doctorObj = await Doctor.findById(doctor);
    if (!doctorObj) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    // Resolve day of the week from the date string (UTC timezone-safe parsing)
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dateParts = date.split('-'); // ['YYYY', 'MM', 'DD']
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayName = daysOfWeek[dateObj.getDay()];

    // Verify if doctor works on this day
    const daySchedule = doctorObj.availability.find((a) => a.day === dayName);
    if (!daySchedule) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${dayName}s`
      });
    }

    // Verify if doctor is available at this time slot
    if (!daySchedule.slots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available at ${timeSlot} on ${dayName}s`
      });
    }

    // 4. Prevent Double Booking (active appointment at same date/time)
    const parsedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const overlap = await Appointment.findOne({
      doctor,
      date: parsedDate,
      timeSlot,
      status: { $ne: 'cancelled' } // Ignore cancelled bookings
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: 'This timeslot has already been booked with this doctor'
      });
    }

    // 5. Save the Appointment
    const appointment = await Appointment.create({
      patient,
      doctor,
      department,
      date: parsedDate,
      timeSlot,
      reason,
      status: 'pending' // Default status
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all appointments (Role specific list filtering)
 * @route   GET /api/appointments
 * @access  Private (All roles)
 */
const getAppointments = async (req, res) => {
  try {
    let filter = {};

    // Enforce role visibility bounds
    if (req.user.role === 'patient') {
      // Find patient document linked to logged-in user
      const patientProfile = await Patient.findOne({ user: req.user.id });
      if (!patientProfile) {
        return res.status(200).json({ success: true, count: 0, appointments: [] });
      }
      filter.patient = patientProfile._id;
    } else if (req.user.role === 'doctor') {
      // Find doctor document linked to logged-in user
      const doctorProfile = await Doctor.findOne({ user: req.user.id });
      if (!doctorProfile) {
        return res.status(200).json({ success: true, count: 0, appointments: [] });
      }
      filter.doctor = doctorProfile._id;
    }

    // Execute query with nested population of user details
    const appointments = await Appointment.find(filter)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('department', 'name')
      .sort({ date: 1, timeSlot: 1 }); // Sorted chronologically

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update appointment status
 * @route   PUT /api/appointments/:id/status
 * @access  Private (All roles with security limits)
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['approved', 'cancelled', 'completed'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Please specify a valid status' });
    }

    // Find the appointment
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Role-based state constraints
    if (req.user.role === 'patient') {
      // Patients can ONLY cancel their OWN appointments
      const patientProfile = await Patient.findOne({ user: req.user.id });
      if (!patientProfile || appointment.patient.toString() !== patientProfile._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to change this appointment' });
      }

      if (status !== 'cancelled') {
        return res.status(403).json({ success: false, message: 'Patients can only cancel appointments' });
      }
    } else if (req.user.role === 'doctor') {
      // Doctors can only manage their own appointments
      const doctorProfile = await Doctor.findOne({ user: req.user.id });
      if (!doctorProfile || appointment.doctor.toString() !== doctorProfile._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to manage this doctor schedule' });
      }
    }

    // Update status
    appointment.status = status;
    await appointment.save();

    // Re-query with populates for response
    const populated = await Appointment.findById(req.params.id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .populate('department', 'name');

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment: populated
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus
};
