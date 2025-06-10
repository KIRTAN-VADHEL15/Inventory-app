const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Helper function to get a new request object (useful if you need to manage transactions manually)
// For simple queries, new sql.Request() is fine. For transactions, you'd pass the transaction object.
// const getRequest = async (transaction = null) => {
//   if (transaction) {
//     return transaction.request();
//   }
//   // If no transaction, create a request from the default pool (assuming sql.connect was called in server.js)
//   return new sql.Request();
// };


// POST /api/invert-transactions - Create a new invert transaction
router.post('/', async (req, res) => {
  const {
    CustomTransactionID,
    TransactionDate,
    Supplier,
    ReferenceNo,
    // TotalAmount, // This will be calculated based on items
    ReceivedBy,
    WarehouseLocation,
    Notes,
    items // Array of { ItemID, Quantity, Rate }
  } = req.body;

  if (!CustomTransactionID || !TransactionDate || !Supplier || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'CustomTransactionID, TransactionDate, Supplier, and at least one item are required.' });
  }

  // Validate each item in the items array
  for (const item of items) {
    if (item.ItemID == null || item.Quantity == null || item.Rate == null ||
        isNaN(parseFloat(item.Quantity)) || isNaN(parseFloat(item.Rate)) ||
        parseFloat(item.Quantity) <= 0 || parseFloat(item.Rate) < 0 ) {
      return res.status(400).json({ message: 'Each item must have a valid ItemID, Quantity (>0), and Rate (>=0).' });
    }
  }

  const transaction = new sql.Transaction(); // Create a new transaction object
  try {
    await transaction.begin(); // Begin SQL transaction
    const request = transaction.request(); // All requests in this transaction use this request object

    let calculatedTotalAmount = 0;
    for (const item of items) {
      calculatedTotalAmount += parseFloat(item.Quantity) * parseFloat(item.Rate);
    }

    request.input('CustomTransactionID', sql.NVarChar(50), CustomTransactionID);
    request.input('TransactionDate', sql.DateTime2, new Date(TransactionDate));
    request.input('Supplier', sql.NVarChar(255), Supplier);
    request.input('ReferenceNo', sql.NVarChar(100), ReferenceNo);
    request.input('TotalAmount', sql.Decimal(18, 2), calculatedTotalAmount);
    request.input('ReceivedBy', sql.NVarChar(100), ReceivedBy);
    request.input('WarehouseLocation', sql.NVarChar(100), WarehouseLocation);
    request.input('Notes', sql.NVarChar(sql.MAX), Notes);

    const insertTransactionHeaderQuery = `
      INSERT INTO InvertTransactions (CustomTransactionID, TransactionDate, Supplier, ReferenceNo, TotalAmount, ReceivedBy, WarehouseLocation, Notes)
      OUTPUT inserted.TransactionID, inserted.CustomTransactionID, inserted.TotalAmount, inserted.CreatedAt, inserted.UpdatedAt
      VALUES (@CustomTransactionID, @TransactionDate, @Supplier, @ReferenceNo, @TotalAmount, @ReceivedBy, @WarehouseLocation, @Notes);
    `;
    const resultHeader = await request.query(insertTransactionHeaderQuery);
    const newTransactionID = resultHeader.recordset[0].TransactionID;

    // Insert items into InvertTransactionItems
    for (const item of items) {
      const itemRequest = transaction.request(); // New request for each item within the same transaction
      itemRequest.input('TransactionID', sql.Int, newTransactionID);
      itemRequest.input('ItemID', sql.Int, item.ItemID);
      itemRequest.input('Quantity', sql.Decimal(18, 3), item.Quantity);
      itemRequest.input('Rate', sql.Decimal(18, 2), item.Rate);
      // 'Amount' is a computed column in the DB, so no need to insert it.

      // Basic check if item exists (optional, FK constraint will catch it too but this gives a nicer error)
      const checkItemRequest = transaction.request();
      checkItemRequest.input('ItemID_check', sql.Int, item.ItemID);
      const itemExists = await checkItemRequest.query('SELECT TOP 1 ItemID FROM Items WHERE ItemID = @ItemID_check');
      if(itemExists.recordset.length === 0){
        await transaction.rollback(); // Rollback before throwing error
        return res.status(400).json({message: `Item with ID ${item.ItemID} not found.`});
      }

      const insertItemQuery = `
        INSERT INTO InvertTransactionItems (TransactionID, ItemID, Quantity, Rate)
        VALUES (@TransactionID, @ItemID, @Quantity, @Rate);
      `;
      await itemRequest.query(insertItemQuery);
    }

    await transaction.commit(); // Commit SQL transaction

    // Fetch the created transaction with its items to return (similar to GET by ID)
    const finalRequest = new sql.Request();
    finalRequest.input('TransactionID_final', sql.Int, newTransactionID);
    const getCreatedTxQuery = `
        SELECT
            it.TransactionID, it.CustomTransactionID, it.TransactionDate, it.Supplier, it.ReferenceNo,
            it.TotalAmount, it.ReceivedBy, it.WarehouseLocation, it.Notes, it.CreatedAt, it.UpdatedAt,
            iti.TransactionItemID, iti.ItemID, i.ItemCode, i.ItemName, iti.Quantity, iti.Rate, iti.Amount
        FROM InvertTransactions it
        LEFT JOIN InvertTransactionItems iti ON it.TransactionID = iti.TransactionID
        LEFT JOIN Items i ON iti.ItemID = i.ItemID
        WHERE it.TransactionID = @TransactionID_final;
    `;
    const finalResult = await finalRequest.query(getCreatedTxQuery);

    if (finalResult.recordset.length > 0) {
        const transactionResult = {
            TransactionID: finalResult.recordset[0].TransactionID,
            CustomTransactionID: finalResult.recordset[0].CustomTransactionID,
            // ... other header fields
            items: finalResult.recordset.map(row => ({
                TransactionItemID: row.TransactionItemID,
                ItemID: row.ItemID,
                ItemCode: row.ItemCode,
                ItemName: row.ItemName,
                Quantity: row.Quantity,
                Rate: row.Rate,
                Amount: row.Amount
            }))
        };
         // Populate all header fields for consistency
        ['TransactionDate', 'Supplier', 'ReferenceNo', 'TotalAmount', 'ReceivedBy', 'WarehouseLocation', 'Notes', 'CreatedAt', 'UpdatedAt'].forEach(field => {
            transactionResult[field] = finalResult.recordset[0][field];
        });
        res.status(201).json(transactionResult);
    } else {
        // Should not happen if commit was successful
        res.status(500).json({ message: 'Transaction created but failed to fetch details.'})
    }

  } catch (error) {
    console.error('Error creating invert transaction:', error);
    if (transaction.rolledBack === false && transaction.began === true) { // Check if not already rolled back and was begun
        try {
            await transaction.rollback(); // Ensure rollback on any error
            console.log("Transaction rolled back due to error.");
        } catch (rollbackError) {
            console.error("Error during transaction rollback:", rollbackError);
        }
    }
    if (error.number === 2627 || error.number === 2601) { // Unique constraint violation for CustomTransactionID
      res.status(409).json({ message: 'Transaction with this CustomTransactionID already exists.', error: error.message });
    } else if (error.number === 547) { // FK constraint violation (e.g. ItemID does not exist)
       res.status(400).json({ message: 'Invalid ItemID provided in transaction items.', error: error.message });
    }
    else {
      res.status(500).json({ message: 'Error creating invert transaction', error: error.message });
    }
  }
});

// GET /api/invert-transactions - Get a list of all invert transactions
router.get('/', async (req, res) => {
  try {
    const request = new sql.Request();
    // This query fetches all transactions and their items.
    // It will result in duplicated transaction header data for each item.
    // The frontend or backend will need to group these.
    const query = `
      SELECT
        it.TransactionID, it.CustomTransactionID, it.TransactionDate, it.Supplier, it.ReferenceNo,
        it.TotalAmount, it.ReceivedBy, it.WarehouseLocation, it.Notes AS TransactionNotes,
        it.CreatedAt AS TransactionCreatedAt, it.UpdatedAt AS TransactionUpdatedAt,
        iti.TransactionItemID, iti.ItemID, i.ItemCode, i.ItemName, iti.Quantity, iti.Rate, iti.Amount
      FROM InvertTransactions it
      LEFT JOIN InvertTransactionItems iti ON it.TransactionID = iti.TransactionID
      LEFT JOIN Items i ON iti.ItemID = i.ItemID
      ORDER BY it.TransactionDate DESC, it.TransactionID DESC, iti.TransactionItemID ASC;
    `;
    const result = await request.query(query);

    // Group items by transaction
    const transactionsMap = new Map();
    result.recordset.forEach(row => {
      if (!transactionsMap.has(row.TransactionID)) {
        transactionsMap.set(row.TransactionID, {
          TransactionID: row.TransactionID,
          CustomTransactionID: row.CustomTransactionID,
          TransactionDate: row.TransactionDate,
          Supplier: row.Supplier,
          ReferenceNo: row.ReferenceNo,
          TotalAmount: row.TotalAmount,
          ReceivedBy: row.ReceivedBy,
          WarehouseLocation: row.WarehouseLocation,
          Notes: row.TransactionNotes,
          CreatedAt: row.TransactionCreatedAt,
          UpdatedAt: row.TransactionUpdatedAt,
          items: []
        });
      }
      if (row.TransactionItemID) { // If there are items for this transaction
        transactionsMap.get(row.TransactionID).items.push({
          TransactionItemID: row.TransactionItemID,
          ItemID: row.ItemID,
          ItemCode: row.ItemCode,
          ItemName: row.ItemName,
          Quantity: row.Quantity,
          Rate: row.Rate,
          Amount: row.Amount
        });
      }
    });
    res.status(200).json(Array.from(transactionsMap.values()));
  } catch (error) {
    console.error('Error fetching invert transactions:', error);
    res.status(500).json({ message: 'Error fetching invert transactions', error: error.message });
  }
});

// GET /api/invert-transactions/:id - Get a single invert transaction by its ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) {
    return res.status(400).json({ message: 'Transaction ID must be a number.'});
  }
  try {
    const request = new sql.Request();
    request.input('TransactionID', sql.Int, id);
    const query = `
      SELECT
        it.TransactionID, it.CustomTransactionID, it.TransactionDate, it.Supplier, it.ReferenceNo,
        it.TotalAmount, it.ReceivedBy, it.WarehouseLocation, it.Notes AS TransactionNotes,
        it.CreatedAt AS TransactionCreatedAt, it.UpdatedAt AS TransactionUpdatedAt,
        iti.TransactionItemID, iti.ItemID, i.ItemCode, i.ItemName, iti.Quantity, iti.Rate, iti.Amount
      FROM InvertTransactions it
      LEFT JOIN InvertTransactionItems iti ON it.TransactionID = iti.TransactionID
      LEFT JOIN Items i ON iti.ItemID = i.ItemID
      WHERE it.TransactionID = @TransactionID;
    `;
    const result = await request.query(query);

    if (result.recordset.length > 0) {
      const header = result.recordset[0];
      const transactionDetail = {
        TransactionID: header.TransactionID,
        CustomTransactionID: header.CustomTransactionID,
        TransactionDate: header.TransactionDate,
        Supplier: header.Supplier,
        ReferenceNo: header.ReferenceNo,
        TotalAmount: header.TotalAmount,
        ReceivedBy: header.ReceivedBy,
        WarehouseLocation: header.WarehouseLocation,
        Notes: header.TransactionNotes,
        CreatedAt: header.TransactionCreatedAt,
        UpdatedAt: header.TransactionUpdatedAt,
        items: result.recordset.filter(r => r.TransactionItemID != null).map(row => ({ // Filter out if no items
          TransactionItemID: row.TransactionItemID,
          ItemID: row.ItemID,
          ItemCode: row.ItemCode,
          ItemName: row.ItemName,
          Quantity: row.Quantity,
          Rate: row.Rate,
          Amount: row.Amount
        }))
      };
      res.status(200).json(transactionDetail);
    } else {
      res.status(404).json({ message: 'Invert transaction not found' });
    }
  } catch (error) {
    console.error('Error fetching invert transaction:', error);
    res.status(500).json({ message: 'Error fetching invert transaction', error: error.message });
  }
});

// PUT /api/invert-transactions/:id - Update an existing invert transaction
router.put('/:id', async (req, res) => {
  const { id } = req.params;
   if (isNaN(parseInt(id))) {
    return res.status(400).json({ message: 'Transaction ID must be a number.'});
  }

  const {
    CustomTransactionID,
    TransactionDate,
    Supplier,
    ReferenceNo,
    // TotalAmount, // Recalculate
    ReceivedBy,
    WarehouseLocation,
    Notes,
    items // Array of { ItemID, Quantity, Rate }
  } = req.body;

  if (!CustomTransactionID || !TransactionDate || !Supplier || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'CustomTransactionID, TransactionDate, Supplier, and at least one item are required for update.' });
  }
  items.forEach(item => { // Basic validation for items
    if (item.ItemID == null || item.Quantity == null || item.Rate == null ||
        isNaN(parseFloat(item.Quantity)) || isNaN(parseFloat(item.Rate)) ||
        parseFloat(item.Quantity) <= 0 || parseFloat(item.Rate) < 0) {
      // This validation could be more robust
      throw new Error('Each item must have a valid ItemID, Quantity (>0), and Rate (>=0).');
    }
  });

  const transaction = new sql.Transaction();
  try {
    await transaction.begin();
    const request = transaction.request(); // Request for header update

    let calculatedTotalAmount = 0;
    for (const item of items) {
      calculatedTotalAmount += parseFloat(item.Quantity) * parseFloat(item.Rate);
    }

    request.input('TransactionID', sql.Int, id);
    request.input('CustomTransactionID', sql.NVarChar(50), CustomTransactionID);
    request.input('TransactionDate', sql.DateTime2, new Date(TransactionDate));
    request.input('Supplier', sql.NVarChar(255), Supplier);
    request.input('ReferenceNo', sql.NVarChar(100), ReferenceNo);
    request.input('TotalAmount', sql.Decimal(18, 2), calculatedTotalAmount);
    request.input('ReceivedBy', sql.NVarChar(100), ReceivedBy);
    request.input('WarehouseLocation', sql.NVarChar(100), WarehouseLocation);
    request.input('Notes', sql.NVarChar(sql.MAX), Notes);

    const updateTransactionHeaderQuery = `
      UPDATE InvertTransactions
      SET CustomTransactionID = @CustomTransactionID,
          TransactionDate = @TransactionDate,
          Supplier = @Supplier,
          ReferenceNo = @ReferenceNo,
          TotalAmount = @TotalAmount,
          ReceivedBy = @ReceivedBy,
          WarehouseLocation = @WarehouseLocation,
          Notes = @Notes
          -- UpdatedAt will be set by trigger
      OUTPUT inserted.TransactionID -- ensure it exists
      WHERE TransactionID = @TransactionID;
    `;
    const resultHeader = await request.query(updateTransactionHeaderQuery);
    if (resultHeader.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Invert transaction not found for update.' });
    }

    // Delete existing items for this transaction
    const deleteItemsRequest = transaction.request();
    deleteItemsRequest.input('TransactionID_del', sql.Int, id);
    await deleteItemsRequest.query('DELETE FROM InvertTransactionItems WHERE TransactionID = @TransactionID_del;');

    // Insert new items
    for (const item of items) {
      const itemRequest = transaction.request();
      itemRequest.input('TransactionID_item', sql.Int, id); // Use original transaction ID
      itemRequest.input('ItemID', sql.Int, item.ItemID);
      itemRequest.input('Quantity', sql.Decimal(18, 3), item.Quantity);
      itemRequest.input('Rate', sql.Decimal(18, 2), item.Rate);

      const checkItemRequest = transaction.request();
      checkItemRequest.input('ItemID_check_put', sql.Int, item.ItemID);
      const itemExists = await checkItemRequest.query('SELECT TOP 1 ItemID FROM Items WHERE ItemID = @ItemID_check_put');
      if(itemExists.recordset.length === 0){
        await transaction.rollback();
        return res.status(400).json({message: `Item with ID ${item.ItemID} not found during update.`});
      }

      const insertItemQuery = `
        INSERT INTO InvertTransactionItems (TransactionID, ItemID, Quantity, Rate)
        VALUES (@TransactionID_item, @ItemID, @Quantity, @Rate);
      `;
      await itemRequest.query(insertItemQuery);
    }

    await transaction.commit();

    // Fetch and return the updated transaction (similar to GET by ID)
    const finalRequest = new sql.Request(); // New request, not part of the committed transaction
    finalRequest.input('TransactionID_final_put', sql.Int, id);
    const getUpdatedTxQuery = `
        SELECT
            it.TransactionID, it.CustomTransactionID, it.TransactionDate, it.Supplier, it.ReferenceNo,
            it.TotalAmount, it.ReceivedBy, it.WarehouseLocation, it.Notes, it.CreatedAt, it.UpdatedAt,
            iti.TransactionItemID, iti.ItemID, i.ItemCode, i.ItemName, iti.Quantity, iti.Rate, iti.Amount
        FROM InvertTransactions it
        LEFT JOIN InvertTransactionItems iti ON it.TransactionID = iti.TransactionID
        LEFT JOIN Items i ON iti.ItemID = i.ItemID
        WHERE it.TransactionID = @TransactionID_final_put;
    `;
    const finalResult = await finalRequest.query(getUpdatedTxQuery);
    const updatedTransaction = {
        TransactionID: finalResult.recordset[0].TransactionID,
        CustomTransactionID: finalResult.recordset[0].CustomTransactionID,
        // ... other header fields
        items: finalResult.recordset.map(row => ({
            TransactionItemID: row.TransactionItemID,
            ItemID: row.ItemID,
            ItemCode: row.ItemCode,
            ItemName: row.ItemName,
            Quantity: row.Quantity,
            Rate: row.Rate,
            Amount: row.Amount
        }))
    };
    ['TransactionDate', 'Supplier', 'ReferenceNo', 'TotalAmount', 'ReceivedBy', 'WarehouseLocation', 'Notes', 'CreatedAt', 'UpdatedAt'].forEach(field => {
        updatedTransaction[field] = finalResult.recordset[0][field];
    });
    res.status(200).json(updatedTransaction);

  } catch (error) {
    console.error('Error updating invert transaction:', error);
    if (transaction.rolledBack === false && transaction.began === true) {
        try {
            await transaction.rollback();
            console.log("Transaction rolled back due to error during update.");
        } catch (rollbackError) {
            console.error("Error during transaction rollback (update):", rollbackError);
        }
    }
    if (error.number === 2627 || error.number === 2601) { // Unique constraint violation for CustomTransactionID
      res.status(409).json({ message: 'Update failed: Transaction with this CustomTransactionID already exists.', error: error.message });
    } else if (error.number === 547) {
       res.status(400).json({ message: 'Invalid ItemID provided in transaction items during update.', error: error.message });
    } else {
      res.status(500).json({ message: 'Error updating invert transaction', error: error.message });
    }
  }
});

// DELETE /api/invert-transactions/:id - Delete an invert transaction
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
   if (isNaN(parseInt(id))) {
    return res.status(400).json({ message: 'Transaction ID must be a number.'});
  }

  // Note: InvertTransactionItems are deleted via CASCADE constraint defined in schema.sql
  const transaction = new sql.Transaction();
  try {
    await transaction.begin();
    const request = transaction.request();
    request.input('TransactionID', sql.Int, id);

    // First, delete items (CASCADE will handle this, but explicit can be clearer or used if no CASCADE)
    // await request.query('DELETE FROM InvertTransactionItems WHERE TransactionID = @TransactionID');

    const deleteHeaderQuery = 'DELETE FROM InvertTransactions OUTPUT deleted.TransactionID WHERE TransactionID = @TransactionID;';
    const result = await request.query(deleteHeaderQuery);

    if (result.rowsAffected[0] > 0) {
      await transaction.commit();
      res.status(200).json({ message: 'Invert transaction and its items deleted successfully' });
    } else {
      await transaction.rollback(); // Nothing was deleted, so transaction didn't find the ID
      res.status(404).json({ message: 'Invert transaction not found' });
    }
  } catch (error) {
    console.error('Error deleting invert transaction:', error);
     if (transaction.rolledBack === false && transaction.began === true) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error("Error during transaction rollback (delete):", rollbackError);
        }
    }
    res.status(500).json({ message: 'Error deleting invert transaction', error: error.message });
  }
});

module.exports = router;
