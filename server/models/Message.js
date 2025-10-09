const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  lineOA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LineOA',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for customer messages
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'sticker', 'file', 'location', 'quick_reply'],
    required: true
  },
  content: {
    text: String,
    imageUrl: String,
    stickerId: String,
    stickerPackageId: String,
    fileUrl: String,
    fileName: String,
    latitude: Number,
    longitude: Number,
    address: String
  },
  direction: {
    type: String,
    enum: ['incoming', 'outgoing'],
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  lineMessageId: {
    type: String,
    default: null
  },
  replyToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ customer: 1, createdAt: -1 });
messageSchema.index({ lineOA: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);