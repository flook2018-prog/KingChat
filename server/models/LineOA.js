const mongoose = require('mongoose');

const lineOASchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  channelId: {
    type: String,
    required: true,
    unique: true
  },
  channelSecret: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  webhookUrl: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  connectionStatus: {
    type: String,
    enum: ['connected', 'disconnected', 'error'],
    default: 'disconnected'
  },
  lastConnectionCheck: {
    type: Date,
    default: Date.now
  },
  avatar: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  totalCustomers: {
    type: Number,
    default: 0
  },
  totalMessages: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LineOA', lineOASchema);