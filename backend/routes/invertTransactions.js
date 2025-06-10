const express = require('express');
const router = express.Router();
const InvertTransaction = require('../models/InvertTransaction'); // Adjust path as necessary
const Item = require('../models/Item'); // Needed to validate item IDs

// POST /api/invert-transactions - Create a new invert transaction
router.post('/', async (req, res) => {
  try {
    const { items, ...transactionData } = req.body;

    // Validate item IDs and calculate amounts
    let calculatedTotalAmount = 0;
    const processedItems = [];

    for (const txItem of items) {
      const itemExists = await Item.findById(txItem.itemId);
      if (!itemExists) {
        return res.status(400).json({ message: `Item with ID ${txItem.itemId} not found.` });
      }
      const amount = txItem.quantity * txItem.rate;
      if (txItem.amount !== amount) {
        // Optionally, enforce that provided amount matches calculated, or just recalculate
        // For now, we'll trust the calculated amount if they differ or if amount wasn't provided.
        console.warn(`Recalculating amount for item ${txItem.itemId} in transaction ${transactionData.transactionId}. Original: ${txItem.amount}, Calculated: ${amount}`);
      }
      processedItems.push({ ...txItem, amount: amount });
      calculatedTotalAmount += amount;
    }

    // Ensure totalAmount matches sum of item amounts
    if (transactionData.totalAmount !== undefined && transactionData.totalAmount !== calculatedTotalAmount) {
        console.warn(`Recalculating totalAmount for transaction ${transactionData.transactionId}. Original: ${transactionData.totalAmount}, Calculated: ${calculatedTotalAmount}`);
    }

    const newTransaction = new InvertTransaction({
      ...transactionData,
      items: processedItems,
      totalAmount: calculatedTotalAmount // Use the server-calculated total amount
    });

    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error for 'transactionId'
      return res.status(400).json({ message: 'Invert transaction with this transactionId already exists.', error: error.message });
    }
    res.status(400).json({ message: 'Error creating invert transaction', error: error.message });
  }
});

// GET /api/invert-transactions - Get a list of all invert transactions
router.get('/', async (req, res) => {
  try {
    // Populate item details for each transaction item
    const transactions = await InvertTransaction.find().populate('items.itemId', 'code name'); // Populate with item code and name
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invert transactions', error: error.message });
  }
});

// GET /api/invert-transactions/:id - Get a single invert transaction by its ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await InvertTransaction.findById(req.params.id).populate('items.itemId', 'code name');
    if (!transaction) {
      return res.status(404).json({ message: 'Invert transaction not found' });
    }
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invert transaction', error: error.message });
  }
});

// PUT /api/invert-transactions/:id - Update an existing invert transaction
router.put('/:id', async (req, res) => {
  try {
    const { items, ...transactionData } = req.body;

    let calculatedTotalAmount = 0;
    const processedItems = [];

    if (items) { // If items are being updated
        for (const txItem of items) {
            const itemExists = await Item.findById(txItem.itemId);
            if (!itemExists) {
            return res.status(400).json({ message: `Item with ID ${txItem.itemId} not found during update.` });
            }
            const amount = txItem.quantity * txItem.rate;
            processedItems.push({ ...txItem, amount: amount });
            calculatedTotalAmount += amount;
        }
        transactionData.items = processedItems;
        transactionData.totalAmount = calculatedTotalAmount; // Update total amount based on new items
    }


    const updatedTransaction = await InvertTransaction.findByIdAndUpdate(
      req.params.id,
      { ...transactionData }, // Ensure all fields are passed for update
      { new: true, runValidators: true }
    ).populate('items.itemId', 'code name');

    if (!updatedTransaction) {
      return res.status(404).json({ message: 'Invert transaction not found' });
    }
    res.status(200).json(updatedTransaction);
  } catch (error) {
     if (error.code === 11000) {
        return res.status(400).json({ message: 'Update failed: Invert transaction with this transactionId already exists.', error: error.message });
    }
    res.status(400).json({ message: 'Error updating invert transaction', error: error.message });
  }
});

// DELETE /api/invert-transactions/:id - Delete an invert transaction
router.delete('/:id', async (req, res) => {
  try {
    const deletedTransaction = await InvertTransaction.findByIdAndDelete(req.params.id);
    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Invert transaction not found' });
    }
    res.status(200).json({ message: 'Invert transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting invert transaction', error: error.message });
  }
});

module.exports = router;
