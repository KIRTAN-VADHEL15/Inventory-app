const express = require('express');
const router = express.Router();
const sql = require('mssql'); // mssql package
// dbConfig is not directly needed here if server.js handles the global pool connection
// However, for specific transaction management or different configs, you might import it.
// const dbConfig = require('../dbConfig'); // Assuming server.js has connected sql object

// POST /api/items - Create a new item
router.post('/', async (req, res) => {
  const { ItemCode, ItemName, PurchasePrice, SellingPrice } = req.body;
  if (!ItemCode || !ItemName || PurchasePrice == null || SellingPrice == null) {
    return res.status(400).json({ message: 'ItemCode, ItemName, PurchasePrice, and SellingPrice are required.' });
  }

  try {
    const request = new sql.Request(); // Each request to DB needs a new sql.Request object from the global pool
    request.input('ItemCode', sql.NVarChar(50), ItemCode);
    request.input('ItemName', sql.NVarChar(255), ItemName);
    request.input('PurchasePrice', sql.Decimal(18, 2), PurchasePrice);
    request.input('SellingPrice', sql.Decimal(18, 2), SellingPrice);

    // Using OUTPUT clause to get the inserted ItemID (and other fields if needed)
    const query = `
      INSERT INTO Items (ItemCode, ItemName, PurchasePrice, SellingPrice)
      OUTPUT inserted.ItemID, inserted.ItemCode, inserted.ItemName, inserted.PurchasePrice, inserted.SellingPrice, inserted.CreatedAt, inserted.UpdatedAt
      VALUES (@ItemCode, @ItemName, @PurchasePrice, @SellingPrice);
    `;

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      res.status(201).json(result.recordset[0]);
    } else {
      res.status(500).json({ message: 'Failed to create item, no record returned.' });
    }
  } catch (error) {
    console.error('Error creating item:', error);
    if (error.number === 2627 || error.number === 2601) { // Unique constraint violation
      res.status(409).json({ message: 'Item with this ItemCode already exists.', error: error.message });
    } else {
      res.status(500).json({ message: 'Error creating item', error: error.message });
    }
  }
});

// GET /api/items - Get a list of all items
router.get('/', async (req, res) => {
  try {
    const request = new sql.Request();
    const query = 'SELECT ItemID, ItemCode, ItemName, PurchasePrice, SellingPrice, CreatedAt, UpdatedAt FROM Items ORDER BY ItemName;';
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
});

// GET /api/items/:id - Get a single item by its ID (ItemID)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) {
    return res.status(400).json({ message: 'Item ID must be a number.'});
  }

  try {
    const request = new sql.Request();
    request.input('ItemID', sql.Int, id);
    const query = 'SELECT ItemID, ItemCode, ItemName, PurchasePrice, SellingPrice, CreatedAt, UpdatedAt FROM Items WHERE ItemID = @ItemID;';
    const result = await request.query(query);

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Error fetching item', error: error.message });
  }
});

// PUT /api/items/:id - Update an existing item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) {
    return res.status(400).json({ message: 'Item ID must be a number.'});
  }
  const { ItemCode, ItemName, PurchasePrice, SellingPrice } = req.body;

  // Basic validation: ensure at least one updatable field is provided if needed, or that key fields are present.
  // For this example, we'll assume the client might send all fields or a subset.
  // SQL Server will handle the update based on what's provided.
   if (!ItemCode || !ItemName || PurchasePrice == null || SellingPrice == null) {
    return res.status(400).json({ message: 'ItemCode, ItemName, PurchasePrice, and SellingPrice are required for update.' });
  }

  try {
    const request = new sql.Request();
    request.input('ItemID', sql.Int, id);
    request.input('ItemCode', sql.NVarChar(50), ItemCode);
    request.input('ItemName', sql.NVarChar(255), ItemName);
    request.input('PurchasePrice', sql.Decimal(18, 2), PurchasePrice);
    request.input('SellingPrice', sql.Decimal(18, 2), SellingPrice);
    // UpdatedAt is handled by the database trigger

    const query = `
      UPDATE Items
      SET ItemCode = @ItemCode,
          ItemName = @ItemName,
          PurchasePrice = @PurchasePrice,
          SellingPrice = @SellingPrice
          -- UpdatedAt will be set by the trigger
      OUTPUT inserted.ItemID, inserted.ItemCode, inserted.ItemName, inserted.PurchasePrice, inserted.SellingPrice, inserted.CreatedAt, inserted.UpdatedAt
      WHERE ItemID = @ItemID;
    `;
    const result = await request.query(query);

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]);
    } else {
      // This case means the WHERE clause (ItemID = @ItemID) didn't match any rows
      res.status(404).json({ message: 'Item not found, or no update made.' });
    }
  } catch (error) {
    console.error('Error updating item:', error);
    if (error.number === 2627 || error.number === 2601) { // Unique constraint violation for ItemCode
      res.status(409).json({ message: 'Update failed: Item with this ItemCode already exists.', error: error.message });
    } else {
      res.status(500).json({ message: 'Error updating item', error: error.message });
    }
  }
});

// DELETE /api/items/:id - Delete an item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
   if (isNaN(parseInt(id))) {
    return res.status(400).json({ message: 'Item ID must be a number.'});
  }

  try {
    const request = new sql.Request();
    request.input('ItemID', sql.Int, id);
    // Check if item is used in InvertTransactionItems
    // This is a basic check. More complex dependencies might exist.
    const checkQuery = 'SELECT TOP 1 TransactionItemID FROM InvertTransactionItems WHERE ItemID = @ItemID;';
    const checkResult = await request.query(checkQuery);

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete item: It is currently used in one or more transactions. Please remove it from transactions first.',
        errorCode: 'ITEM_IN_USE'
      });
    }

    const deleteQuery = 'DELETE FROM Items OUTPUT deleted.ItemID WHERE ItemID = @ItemID;';
    const result = await request.query(deleteQuery);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: 'Item deleted successfully' });
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    // Foreign key constraint errors might also occur if not handled by the check above,
    // e.g., if item is referenced in other tables not yet considered.
    // SQL Server error number for foreign key violation is 547.
    if (error.number === 547) {
         return res.status(400).json({
            message: 'Cannot delete item: It is referenced by other records (e.g., transactions).',
            error: error.message,
            errorCode: 'FK_VIOLATION'
        });
    }
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
});

module.exports = router;
