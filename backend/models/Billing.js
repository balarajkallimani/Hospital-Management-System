const mongoose = require('mongoose');

// Sub-schema for single line item service in the invoice
const serviceItemSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: [true, 'Please specify the service name'],
    trim: true,
  },
  cost: {
    type: Number,
    required: [true, 'Please specify the service cost'],
    min: [0, 'Service cost cannot be negative'],
  }
}, { _id: false });

// Define the Billing Schema
const billingSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient', // Links invoice to patient demographics
      required: [true, 'Billing invoice must be linked to a patient'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor', // Links invoice to attending doctor (optional)
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment', // Links invoice to scheduled consultation (optional)
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    billNumber: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate invoice numbers
      trim: true,
    },
    services: [serviceItemSchema], // List of billing items (X-Rays, consults, scans)
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      required: true,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'card', 'insurance', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compile and export the Billing Model
const Billing = mongoose.model('Billing', billingSchema);
module.exports = Billing;
