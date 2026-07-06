const Billing = require('../models/Billing');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

/**
 * @desc    Create a new invoice bill
 * @route   POST /api/billing
 * @access  Private (Admin, Receptionist only)
 */
const createBill = async (req, res) => {
  try {
    const { patient, doctor, appointment, services, status, paymentMethod } = req.body;

    // 1. Validate required inputs
    if (!patient || !services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide patient and at least one service item' });
    }

    // 2. Verify Patient exists
    const patientObj = await Patient.findById(patient);
    if (!patientObj) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    // 3. Compute totalAmount by summing service costs
    const totalAmount = services.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

    // 4. Generate unique bill number (INV-YYYYMMDD-RANDOM)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const randomCode = Math.floor(1000 + Math.random() * 9000); // 4 digit random code
    const billNumber = `INV-${dateStr}-${randomCode}`;

    // 5. Create the Billing document
    const bill = await Billing.create({
      patient,
      doctor: doctor || undefined,
      appointment: appointment || undefined,
      billNumber,
      services,
      totalAmount,
      status: status || 'unpaid',
      paymentMethod: paymentMethod || 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      bill
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all bills (Filtered by roles)
 * @route   GET /api/billing
 * @access  Private (All roles)
 */
const getBills = async (req, res) => {
  try {
    let filter = {};

    // Filter results according to role constraints
    if (req.user.role === 'patient') {
      const patientProfile = await Patient.findOne({ user: req.user.id });
      if (!patientProfile) {
        return res.status(200).json({ success: true, count: 0, bills: [] });
      }
      filter.patient = patientProfile._id;
    } else if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: req.user.id });
      if (!doctorProfile) {
        return res.status(200).json({ success: true, count: 0, bills: [] });
      }
      filter.doctor = doctorProfile._id;
    }

    // Query bills with populates
    const bills = await Billing.find(filter)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'department', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bills.length,
      bills
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get details of a single bill
 * @route   GET /api/billing/:id
 * @access  Private (All roles with security limits)
 */
const getBillById = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'department', select: 'name' }
        ]
      });

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Guard: Patients can only view their own invoices
    if (req.user.role === 'patient') {
      const patientProfile = await Patient.findOne({ user: req.user.id });
      if (!patientProfile || bill.patient._id.toString() !== patientProfile._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this invoice' });
      }
    }

    res.status(200).json({ success: true, bill });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Collect payment and update status to paid
 * @route   PUT /api/billing/:id/payment
 * @access  Private (Admin, Receptionist only)
 */
const updateBillStatus = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const allowedMethods = ['cash', 'card', 'insurance'];

    if (!paymentMethod || !allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Please specify a valid payment method (cash, card, insurance)' });
    }

    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Toggle invoice status to paid
    bill.status = 'paid';
    bill.paymentMethod = paymentMethod;
    await bill.save();

    // Re-query with populates
    const populatedBill = await Billing.findById(req.params.id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

    res.status(200).json({
      success: true,
      message: 'Payment collected successfully. Invoice closed.',
      bill: populatedBill
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBill,
  getBills,
  getBillById,
  updateBillStatus
};
