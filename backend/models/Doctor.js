const mongoose = require('mongoose');

// Schema for doctor weekly availability schedule
const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  slots: [
    {
      type: String, // E.g., '09:00 AM', '10:00 AM', '11:00 AM'
      required: true
    }
  ]
}, { _id: false }); // Prevents mongoose from creating an sub-_id for each day in array

// Define the Doctor Schema
const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // 1:1 Link to user login account
      required: [true, 'Doctor must be linked to a User account'],
      unique: true, // Guarantees strict 1:1 relation
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department', // Links Doctor to a specific Department
      required: [true, 'Doctor must belong to a department'],
    },
    specialization: {
      type: String,
      required: [true, 'Please provide doctor specialization'],
      trim: true,
    },
    qualification: {
      type: String,
      required: [true, 'Please provide doctor qualifications'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Please specify doctor experience in years'],
      min: [0, 'Experience cannot be negative'],
    },
    fees: {
      type: Number,
      required: [true, 'Please specify consultation fees'],
      min: [0, 'Fees cannot be negative'],
    },
    image: {
      type: String, // Path to doctor photo uploaded to uploads folder
    },
    availability: [availabilitySchema], // List of weekly availability details
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compile and export the Doctor Model
const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
