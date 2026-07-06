const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

/**
 * Establishes a connection to the MongoDB Database and seeds initial values.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // 1. Auto-seed default departments if empty
    let deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      const defaultDepartments = [
        { name: 'Cardiology', description: 'Deals with disorders of the heart and blood vessels.' },
        { name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents.' },
        { name: 'Neurology', description: 'Deals with diagnosis and treatment of all conditions involving the brain and nervous system.' },
        { name: 'Orthopedics', description: 'Focuses on muscles, joints, ligaments, tendons, and bones.' },
        { name: 'Dermatology', description: 'Deals with the skin, nails, hair and its diseases.' },
        { name: 'General Medicine', description: 'Diagnoses and provides non-surgical treatment for internal organs and health checkups.' }
      ];
      await Department.insertMany(defaultDepartments);
      console.log('Database Seeder: Default departments successfully seeded!');
    }

    // 2. Retrieve all departments to map IDs
    const departments = await Department.find();

    // 3. Auto-seed default doctors if empty
    const docCount = await Doctor.countDocuments();
    if (docCount === 0) {
      const doctorsMetadata = [
        {
          name: 'Dr. Charles Xavier',
          email: 'xavier.cardio@hospital.com',
          deptName: 'Cardiology',
          specialization: 'Interventional Cardiology',
          qualification: 'MD, FACC',
          experience: 15,
          fees: 300,
          availability: [
            { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '11:00 AM'] },
            { day: 'Tuesday', slots: ['02:00 PM', '03:00 PM', '04:00 PM'] }
          ]
        },
        {
          name: 'Dr. Mary Poppins',
          email: 'poppins.peds@hospital.com',
          deptName: 'Pediatrics',
          specialization: 'Pediatric General Care',
          qualification: 'MD, Board Certified',
          experience: 8,
          fees: 200,
          availability: [
            { day: 'Wednesday', slots: ['10:00 AM', '11:00 AM', '01:00 PM'] },
            { day: 'Thursday', slots: ['09:00 AM', '10:00 AM', '03:00 PM'] }
          ]
        },
        {
          name: 'Dr. Stephen Strange',
          email: 'strange.neuro@hospital.com',
          deptName: 'Neurology',
          specialization: 'Neuro-Surgery & Trauma',
          qualification: 'MD, PhD',
          experience: 12,
          fees: 400,
          availability: [
            { day: 'Thursday', slots: ['01:00 PM', '02:00 PM', '03:00 PM'] },
            { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '11:00 AM'] }
          ]
        },
        {
          name: 'Dr. Bruce Banner',
          email: 'banner.ortho@hospital.com',
          deptName: 'Orthopedics',
          specialization: 'Joint Replacement & Bone Surgery',
          qualification: 'MD, FRCS',
          experience: 10,
          fees: 250,
          availability: [
            { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '02:00 PM'] },
            { day: 'Wednesday', slots: ['01:00 PM', '02:00 PM', '03:00 PM'] }
          ]
        },
        {
          name: 'Dr. Reed Richards',
          email: 'richards.derma@hospital.com',
          deptName: 'Dermatology',
          specialization: 'Clinical & Cosmetic Dermatology',
          qualification: 'MD, FAAD',
          experience: 14,
          fees: 180,
          availability: [
            { day: 'Tuesday', slots: ['09:00 AM', '11:00 AM', '03:00 PM'] },
            { day: 'Saturday', slots: ['10:00 AM', '11:00 AM', '12:00 PM'] }
          ]
        },
        {
          name: 'Dr. Gregory House',
          email: 'house.general@hospital.com',
          deptName: 'General Medicine',
          specialization: 'Internal Medicine & Diagnostics',
          qualification: 'MD, Board Certified',
          experience: 18,
          fees: 350,
          availability: [
            { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '11:00 AM'] },
            { day: 'Wednesday', slots: ['02:00 PM', '03:00 PM', '04:00 PM'] },
            { day: 'Friday', slots: ['01:00 PM', '02:00 PM', '03:00 PM'] }
          ]
        }
      ];

      for (const dm of doctorsMetadata) {
        // Find matching seeded department ID
        const matchedDept = departments.find((d) => d.name === dm.deptName);
        if (!matchedDept) continue;

        // Check if user login already exists
        let user = await User.findOne({ email: dm.email });
        if (!user) {
          user = await User.create({
            name: dm.name,
            email: dm.email,
            password: 'doctorpassword123', // Default doctor password
            role: 'doctor'
          });
        }

        // Create doctor profile linked to user and department
        await Doctor.create({
          user: user._id,
          department: matchedDept._id,
          specialization: dm.specialization,
          qualification: dm.qualification,
          experience: dm.experience,
          fees: dm.fees,
          availability: dm.availability
        });
      }
      console.log('Database Seeder: Default specialist doctors successfully seeded!');
    }

  } catch (error) {
    console.error(`Database connection or seeding failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
