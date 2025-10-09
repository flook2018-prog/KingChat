const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: false,  // ไม่บังคับสำหรับ admin user
    unique: true,
    trim: true,
    lowercase: true,
    sparse: true  // allows unique constraint on null values
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'agent', 'viewer'],
    default: 'agent'
  },
  displayName: {
    type: String,
    required: false,  // ไม่บังคับสำหรับ admin user
    trim: true,
    default: function() {
      return this.username;  // ใช้ username เป็น default
    }
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null
  },
  department: {
    type: String,
    trim: true,
    default: null
  },
  position: {
    type: String,
    trim: true,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  permissions: {
    canManageUsers: { type: Boolean, default: false },
    canManageLineOA: { type: Boolean, default: false },
    canViewAllChats: { type: Boolean, default: true },
    canManageSettings: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);