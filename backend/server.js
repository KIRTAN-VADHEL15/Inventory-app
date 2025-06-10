const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies
const itemRoutes = require('./routes/items');
const invertTransactionRoutes = require('./routes/invertTransactions');

// Basic route
app.get('/', (req, res) => {
  res.send('Inventory Backend API is running!');
});

// MongoDB Connection (replace with your actual connection string)
app.use('/api/items', itemRoutes);
app.use('/api/invert-transactions', invertTransactionRoutes);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
