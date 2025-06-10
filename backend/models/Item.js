const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  purchasePrice: {
    type: Number,
    required: true,
    default: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    default: 0
  },
  // Timestamps can be useful for tracking when items are created or updated
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update `updatedAt` field before saving
itemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
