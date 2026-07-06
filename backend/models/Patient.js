const mongoose = require('mongoose');

// Define the Patient Schema
const patientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Links 1:1 to the User credentials
      required: [true, 'Patient must be linked to a User account'],
      unique: true, // Forces a strict One-to-One relationship
    },
    phone: {
      type: String,
      required: [true, 'Please provide a contact phone number'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Please provide a date of birth'],
    },
    gender: {
      type: String,
      required: [true, 'Please specify patient gender'],
      enum: {
        values: ['male', 'female', 'other'],
        message: '{VALUE} is not a valid gender option',
      },
    },
    bloodGroup: {
      type: String,
      required: [true, 'Please specify blood group'],
      enum: {
        values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        message: '{VALUE} is not a valid blood group option',
      },
    },
    address: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      name: {
        type: String,
        required: [true, 'Please provide emergency contact name'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Please provide emergency contact phone number'],
        trim: true,
      },
      relation: {
        type: String,
        required: [true, 'Please specify relationship to emergency contact'],
        trim: true,
      },
    },
    image: {
      type: String, // Path to patient profile photo uploaded to uploads folder
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compile and export the Patient Model
const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;
