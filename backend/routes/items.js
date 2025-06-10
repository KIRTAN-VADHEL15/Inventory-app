const express = require('express');
const router = express.Router();
const Item = require('../models/Item'); // Adjust path as necessary

// POST /api/items - Create a new item
router.post('/', async (req, res) => {
  try {
    const newItem = new Item(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error (e.g., for 'code' field if unique)
      return res.status(400).json({ message: 'Item with this code already exists.', error: error.message });
    }
    res.status(400).json({ message: 'Error creating item', error: error.message });
  }
});

// GET /api/items - Get a list of all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
});

// GET /api/items/:id - Get a single item by its ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item', error: error.message });
  }
});

// PUT /api/items/:id - Update an existing item
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // new: true returns the updated document, runValidators ensures schema validation
    );
    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json(updatedItem);
  } catch (error) {
    if (error.code === 11000) {
        return res.status(400).json({ message: 'Update failed: Item with this code already exists.', error: error.message });
    }
    res.status(400).json({ message: 'Error updating item', error: error.message });
  }
});

// DELETE /api/items/:id - Delete an item
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
});

module.exports = router;
