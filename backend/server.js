const express = require('express');
const cors = require('cors');
const sql = require('mssql'); // SQL Server package
const dbConfig = require('./dbConfig'); // SQL Server configuration

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// --- Import Route Files (we will recreate these later for SQL Server) ---
const itemRoutes = require('./routes/items');
const invertTransactionRoutes = require('./routes/invertTransactions');

// --- Use Routes (we will uncomment these later) ---
app.use('/api/items', itemRoutes);
app.use('/api/invert-transactions', invertTransactionRoutes);


// Basic route
app.get('/', (req, res) => {
  res.send('Inventory Backend API (SQL Server) is running!');
});

// SQL Server Connection Test
async function connectToSql() {
  try {
    await sql.connect(dbConfig);
    console.log('SQL Server connected successfully.');
  } catch (err) {
    console.error('SQL Server connection error:', err);
    // Exit the process if DB connection fails on startup, or handle appropriately
    // For now, we just log the error. The application might run but API calls needing DB will fail.
    // process.exit(1);
  }
}

// Call the connection test function when the server starts.
// Subsequent requests will use the connection pool managed by 'mssql'.
connectToSql();


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export sql and dbConfig for use in routes
module.exports = { app, sql, dbConfig };
