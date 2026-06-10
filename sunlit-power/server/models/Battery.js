const mongoose = require('mongoose');

const batterySchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: true,
    unique: true
  },
  model: {
    type: String,
    enum: ['Telecom', 'EV', 'Solar', 'Industrial', 'Robotics', 'Agriculture'],
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  dealerName: {
    type: String
  },
  warrantyYears: {
    type: Number,
    default: 2
  },
  invoiceImage: {
    type: String
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Battery', batterySchema);
