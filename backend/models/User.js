const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User Schema (structure of a user document in MongoDB)
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true, // Automatically removes leading/trailing whitespaces
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true, // Forces emails to be unique in the database
      trim: true,
      lowercase: true, // Converts email to lowercase before saving
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Prevents password from being returned in normal queries by default (for safety)
    },
    role: {
      type: String,
      required: [true, 'Please specify a user role'],
      enum: {
        values: ['admin', 'doctor', 'receptionist', 'patient'],
        message: '{VALUE} is not a valid user role',
      },
      default: 'patient',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds 'createdAt' and 'updatedAt' fields
  }
);

// --- PRE-SAVE PASSWORD HASHING HOOK ---
// This middleware runs automatically before a User document is saved to the database.
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is newly created)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate a salt (random data used as an additional input to hash the password)
    // 10 rounds represents a good balance between security and computation speed
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password with the generated salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// --- CUSTOM METHOD FOR LOGIN VERIFICATION ---
// Compares an entered plain text password with the hashed password stored in the database.
userSchema.methods.comparePassword = async function (enteredPassword) {
  // 'this.password' holds the database hash (we must ensure it was queried using .select('+password'))
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compile and export the User Model
const User = mongoose.model('User', userSchema);
module.exports = User;
