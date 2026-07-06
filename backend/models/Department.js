const mongoose = require('mongoose');

// Define the Department Schema
const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a department name'],
      unique: true, // Prevents duplicate department folders
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compile and export the Department Model
const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;
