// backend/dbConfig.js
// IMPORTANT: Replace these values with your actual SQL Server connection details.
// You should use environment variables for sensitive information in a production environment.
const sqlConfig = {
  user: process.env.DB_USER || 'your_db_user', // Replace 'your_db_user'
  password: process.env.DB_PASSWORD || 'your_db_password', // Replace 'your_db_password'
  database: process.env.DB_NAME || 'InventoryDB', // Replace 'InventoryDB' or use your actual DB name
  server: process.env.DB_SERVER || 'localhost', // Replace 'localhost' if your server is elsewhere
  port: parseInt(process.env.DB_PORT) || 1433, // Default SQL Server port
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use true if you're on Azure SQL Database or other services requiring encryption
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || true // Change to true for local dev / self-signed certs, false for production with valid certs
  }
};

module.exports = sqlConfig;
