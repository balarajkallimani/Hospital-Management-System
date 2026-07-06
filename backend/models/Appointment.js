const mongoose = require('mongoose');

// Define the Appointment Schema
const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient', // Reference to Patient details
      required: [true, 'Appointment must be linked to a patient'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor', // Reference to Doctor details
      required: [true, 'Appointment must be linked to a doctor'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department', // Reference to Department
      required: [true, 'Appointment must specify a department'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide the appointment date'],
    },
    timeSlot: {
      type: String, // E.g., '10:00 AM', '02:00 PM'
      required: [true, 'Please specify the appointment time slot'],
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'cancelled', 'completed'],
      default: 'pending',
    },
    reason: {
      type: String,
      required: [true, 'Please specify a reason or symptom for booking'],
      trim: true,
    },
  },
  {
    timestamps: true, // Track booking submission and update times
  }
);

// Compile and export the Appointment Model
const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
