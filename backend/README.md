# Inventory Management System - Backend (SQL Server Edition)

This directory contains the Node.js and Express.js backend for the Inventory Management System, configured to use Microsoft SQL Server as its database.

## Prerequisites

- Node.js (v14.x or later recommended)
- npm (usually comes with Node.js)
- Microsoft SQL Server:
    - Running and accessible.
    - Database created (e.g., `InventoryDB`).
    - SQL Server user credentials with permissions to connect and perform CRUD operations on the database.
- SQL Server Management Studio (SSMS) or a similar tool to run the schema script.

## Setup

1.  **Database Setup:**
    a.  Connect to your SQL Server instance using SSMS.
    b.  Create a new database (e.g., `InventoryDB`) if it doesn't already exist.
    c.  Open the `backend/schema.sql` file provided in this project.
    d.  Execute the script in the context of your inventory database to create the necessary tables (`Items`, `InvertTransactions`, `InvertTransactionItems`) and triggers.

2.  **Backend Application Setup:**
    a.  Navigate to the `backend` directory:
        ```bash
        cd backend
        ```
    b.  Install dependencies:
        ```bash
        npm install
        ```
    c.  **Configure SQL Server Connection:**
        Open `backend/dbConfig.js`. This file contains the configuration for connecting to your SQL Server.
        ```javascript
        // Example from dbConfig.js:
        const sqlConfig = {
          user: process.env.DB_USER || 'your_db_user',
          password: process.env.DB_PASSWORD || 'your_db_password',
          database: process.env.DB_NAME || 'InventoryDB',
          server: process.env.DB_SERVER || 'localhost',
          port: parseInt(process.env.DB_PORT) || 1433,
          options: {
            encrypt: process.env.DB_ENCRYPT === 'true', // true for Azure SQL, some other cloud services
            trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || true // true for local dev, false for prod with valid cert
          }
        };
        ```
        **IMPORTANT:** You **MUST** replace the placeholder values (`your_db_user`, `your_db_password`, etc.) with your actual SQL Server credentials and server details, or set the corresponding environment variables (e.g., `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SERVER`).

3.  **Start the server:**
    ```bash
    node server.js
    ```
    Or, for development with automatic restarts (if you have `nodemon` installed globally or as a dev dependency):
    ```bash
    nodemon server.js
    ```
    The server will typically run on `http://localhost:5000`. Check the console output to ensure it connects to SQL Server successfully.

## API Endpoints

The API base URL is `http://localhost:5000/api`. The data is returned in JSON format.

### Item Management (`/api/items`)

-   **`POST /api/items`**: Create a new item.
    -   Body: JSON object with `ItemCode` (String, unique, required), `ItemName` (String, required), `PurchasePrice` (Number, required), `SellingPrice` (Number, required).
    -   Response: The created item object including its `ItemID`.

-   **`GET /api/items`**: Get a list of all items.
    -   Response: Array of item objects.

-   **`GET /api/items/:id`**: Get a single item by its `ItemID`.
    -   Response: The item object.

-   **`PUT /api/items/:id`**: Update an existing item by its `ItemID`.
    -   Body: JSON object with fields to update (all fields like `ItemCode`, `ItemName`, etc. are expected).
    -   Response: The updated item object.

-   **`DELETE /api/items/:id`**: Delete an item by its `ItemID`.
    -   Response: Success message. (Note: Deletion may be prevented if the item is in use by transactions).

### Invert Transaction Management (`/api/invert-transactions`)

-   **`POST /api/invert-transactions`**: Create a new invert (incoming) transaction.
    -   Body: JSON object. Key fields:
        -   `CustomTransactionID` (String, unique, required)
        -   `TransactionDate` (String/Date, required)
        -   `Supplier` (String, required)
        -   `ReferenceNo` (String, optional)
        -   `ReceivedBy` (String, optional)
        -   `WarehouseLocation` (String, optional)
        -   `Notes` (String, optional)
        -   `items`: Array of objects (required, at least one item). Each item object:
            -   `ItemID` (Number, required, must exist in `Items` table)
            -   `Quantity` (Number, required)
            -   `Rate` (Number, required, purchase rate for the item at transaction time)
    -   Response: The created transaction object, including its `TransactionID` and details of its items. `TotalAmount` is calculated by the server.

-   **`GET /api/invert-transactions`**: Get a list of all invert transactions.
    -   Response: Array of transaction objects, each including an `items` array with details of the items in that transaction.

-   **`GET /api/invert-transactions/:id`**: Get a single invert transaction by its `TransactionID`.
    -   Response: The transaction object, including its `items`.

-   **`PUT /api/invert-transactions/:id`**: Update an existing invert transaction by `TransactionID`.
    -   Body: Similar to POST. All existing items for the transaction will be replaced with the new `items` array provided.
    -   Response: The updated transaction object.

-   **`DELETE /api/invert-transactions/:id`**: Delete an invert transaction by `TransactionID`. This will also delete associated line items due to database cascade rules.
    -   Response: Success message.

## Project Structure (Backend)

-   `server.js`: Main Express server file, initializes SQL Server connection.
-   `dbConfig.js`: SQL Server connection configuration. **(NEEDS USER CONFIGURATION)**
-   `schema.sql`: SQL DDL script to create database tables. **(USER MUST EXECUTE IN SSMS)**
-   `routes/`: Contains Express route definitions (e.g., `items.js`, `invertTransactions.js`).
-   `package.json`: Project metadata and dependencies.
