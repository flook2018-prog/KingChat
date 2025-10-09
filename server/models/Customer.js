const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  lineUserId: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  lineOA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LineOA',
    required: true
  },
  phone: {
    type: String,
    default: null,
    trim: true
  },
  email: {
    type: String,
    default: null,
    trim: true,
    lowercase: true
  },
  notes: {
    type: String,
    default: '',
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true
  }],
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  lastMessageAt: {
    type: Date,
    default: null
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// Index for faster searches
customerSchema.index({ displayName: 'text', phone: 'text', email: 'text' });
customerSchema.index({ lineOA: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Customer', customerSchema);