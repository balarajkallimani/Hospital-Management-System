const mongoose = require('mongoose');

// Sub-schema for single medicine item in prescription
const medicineSchema = new mongoose.Schema({
  medicine: {
    type: String,
    required: [true, 'Please specify the name of the medicine'],
    trim: true,
  },
  dosage: {
    type: String,
    required: [true, 'Please specify dosage instructions (e.g. 1-0-1)'],
    trim: true,
  },
  duration: {
    type: String,
    required: [true, 'Please specify duration of treatment (e.g. 5 days)'],
    trim: true,
  }
}, { _id: false }); // Prevents mongoose from creating an sub-_id for each item in array

// Define the MedicalRecord Schema
const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient', // Links record to patient demographics
      required: [true, 'Medical record must be linked to a patient'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor', // Links record to diagnosing doctor
      required: [true, 'Medical record must be linked to a doctor'],
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    symptoms: {
      type: String,
      required: [true, 'Please specify patient symptoms'],
      trim: true,
    },
    diagnosis: {
      type: String,
      required: [true, 'Please specify diagnosis details'],
      trim: true,
    },
    prescription: [medicineSchema], // Array of prescribed medications
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compile and export the MedicalRecord Model
const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
module.exports = MedicalRecord;
