# Inventory Management System - Backend

This directory contains the Node.js and Express.js backend for the Inventory Management System. It provides API endpoints to manage items and inventory transactions.

## Prerequisites

- Node.js (v14.x or later recommended)
- npm (usually comes with Node.js)
- MongoDB (running and accessible; connection URI configured in `server.js` or via `MONGO_URI` environment variable)

## Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure MongoDB Connection:**
    Open `server.js` and ensure the `MONGO_URI` constant points to your running MongoDB instance.
    ```javascript
    // Example from server.js:
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_db';
    ```
    Alternatively, you can set the `MONGO_URI` environment variable before running the server.

4.  **Start the server:**
    ```bash
    node server.js
    ```
    Or, for development with automatic restarts (if you have `nodemon` installed globally or as a dev dependency):
    ```bash
    nodemon server.js
    ```
    The server will typically run on `http://localhost:5000`.

## API Endpoints

The API base URL is `http://localhost:5000/api`.

### Item Management (`/api/items`)

-   **`POST /api/items`**: Create a new item.
    -   Body: JSON object with `code` (String, unique, required), `name` (String, required), `purchasePrice` (Number, required), `sellingPrice` (Number, required).
    -   Response: The created item object.

-   **`GET /api/items`**: Get a list of all items.
    -   Response: Array of item objects.

-   **`GET /api/items/:id`**: Get a single item by its MongoDB `_id`.
    -   Response: The item object.

-   **`PUT /api/items/:id`**: Update an existing item by its MongoDB `_id`.
    -   Body: JSON object with fields to update.
    -   Response: The updated item object.

-   **`DELETE /api/items/:id`**: Delete an item by its MongoDB `_id`.
    -   Response: Success message.

### Invert Transaction Management (`/api/invert-transactions`)

-   **`POST /api/invert-transactions`**: Create a new invert (incoming) transaction.
    -   Body: JSON object representing the transaction (see `backend/models/InvertTransaction.js` for schema details). Key fields include `transactionId` (String, unique, required), `date` (Date), `supplier` (String), `items` (Array of objects, each with `itemId` (ObjectId ref Item), `quantity`, `rate`, `amount`), `totalAmount` (Number).
    -   Response: The created transaction object.

-   **`GET /api/invert-transactions`**: Get a list of all invert transactions.
    -   Response: Array of transaction objects (with `items.itemId` populated with item `code` and `name`).

-   **`GET /api/invert-transactions/:id`**: Get a single invert transaction by its MongoDB `_id`.
    -   Response: The transaction object (with `items.itemId` populated).

-   **`PUT /api/invert-transactions/:id`**: Update an existing invert transaction by its MongoDB `_id`.
    -   Body: JSON object with fields to update.
    -   Response: The updated transaction object.

-   **`DELETE /api/invert-transactions/:id`**: Delete an invert transaction by its MongoDB `_id`.
    -   Response: Success message.

## Project Structure

-   `server.js`: Main server file.
-   `models/`: Contains Mongoose schemas (e.g., `Item.js`, `InvertTransaction.js`).
-   `routes/`: Contains Express route definitions (e.g., `items.js`, `invertTransactions.js`).
-   `package.json`: Project metadata and dependencies.
