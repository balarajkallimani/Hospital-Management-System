// Import required dependencies
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Establish connection to MongoDB database
connectDB();

// Initialize the Express application instance
const app = express();

// --- Apply Global Middleware ---

// Enable CORS so the frontend application can securely talk to this API
app.use(cors());

// Parse incoming requests with JSON payloads (replaces bodyParser.json())
app.use(express.json());

// Log HTTP requests in development mode for easy debugging
app.use(morgan('dev'));

// Serve uploads directory statically for client image rendering
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---

// Mount Authentication Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Mount Role Verification Test Routes
app.use('/api/test-roles', require('./routes/testRoutes'));

// Mount Patient Management Routes
app.use('/api/patients', require('./routes/patientRoutes'));

// Mount Department & Doctor Routes
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));

// Mount Appointment Routes
app.use('/api/appointments', require('./routes/appointmentRoutes'));

// Mount Medical Record Routes
app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));

// Mount Billing Routes
app.use('/api/billing', require('./routes/billingRoutes'));

// Mount Reports & Analytics Routes
app.use('/api/reports', require('./routes/reportRoutes'));

// Mount File Upload Routes
app.use('/api/upload', require('./routes/uploadRoutes'));

// A simple test endpoint to confirm our server is live and responsive
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Hospital Management System API!',
    timestamp: new Date()
  });
});

// --- Production Settings ---
if (process.env.NODE_ENV === 'production') {
  // Serve the compiled static assets from the frontend build folder
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Redirect any other route request to index.html so React Router handles it
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

// --- Start the Server ---

// Set the port (use the environment variable PORT or fallback to 5000)
const PORT = process.env.PORT || 5000;

// Start listening for incoming network requests
app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});
