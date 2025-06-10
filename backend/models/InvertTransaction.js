const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sub-schema for items within an invert transaction
const transactionItemSchema = new Schema({
  itemId: { // Storing itemId instead of the whole item object
    type: Schema.Types.ObjectId,
    ref: 'Item', // Reference to the Item model
    required: true
  },
  // We can still store some denormalized data from Item if needed for reports,
  // but it's generally better to join/populate when querying.
  // For simplicity here, we'll just store the ID and rely on population.
  // If you find you frequently need item code/name directly in transaction listings without populating,
  // you could add them here, but be mindful of data consistency.
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  rate: { // This is the purchase rate at the time of transaction
    type: Number,
    required: true,
    min: 0
  },
  amount: { // quantity * rate
    type: Number,
    required: true,
    min: 0
  }
}, {_id: false}); // No separate _id for sub-documents unless needed

const invertTransactionSchema = new Schema({
  transactionId: { // Custom transaction ID like "INV-0001"
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  supplier: { // Could be a String or a reference to a Supplier model if you create one
    type: String,
    required: true,
    trim: true
  },
  referenceNo: {
    type: String,
    trim: true
  },
  items: [transactionItemSchema], // Array of transaction items
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  receivedBy: {
    type: String,
    trim: true
  },
  warehouseLocation: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
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
invertTransactionSchema.pre('save', function(next) {
  // Calculate totalAmount before saving if not already set or if items changed
  this.totalAmount = this.items.reduce((sum, item) => sum + item.amount, 0);
  this.updatedAt = Date.now();
  next();
});

const InvertTransaction = mongoose.model('InvertTransaction', invertTransactionSchema);

module.exports = InvertTransaction;
