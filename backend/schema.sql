-- SQL Server Schema for Inventory Management System

-- First, ensure you have a database created and selected, e.g., InventoryDB
-- USE InventoryDB;
-- GO

-- 1. Items Table
-- Stores information about each inventory item.
IF OBJECT_ID('dbo.Items', 'U') IS NOT NULL
    DROP TABLE dbo.Items;
GO

CREATE TABLE Items (
    ItemID INT PRIMARY KEY IDENTITY(1,1), -- Auto-incrementing primary key
    ItemCode NVARCHAR(50) NOT NULL UNIQUE, -- Unique code for the item (e.g., SKU)
    ItemName NVARCHAR(255) NOT NULL,
    PurchasePrice DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    SellingPrice DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);
GO

-- Trigger to update UpdatedAt timestamp on Items table
IF OBJECT_ID('dbo.trg_Items_UpdateUpdatedAt', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Items_UpdateUpdatedAt;
GO
CREATE TRIGGER trg_Items_UpdateUpdatedAt
ON Items
AFTER UPDATE
AS
BEGIN
    IF TRIGGER_NESTLEVEL() > 1 RETURN; -- Avoid recursion if trigger causes another update
    UPDATE Items
    SET UpdatedAt = GETDATE()
    FROM Items
    INNER JOIN inserted ON Items.ItemID = inserted.ItemID;
END;
GO


-- 2. InvertTransactions Table (Incoming Transactions)
-- Stores header information for each incoming inventory transaction.
IF OBJECT_ID('dbo.InvertTransactions', 'U') IS NOT NULL
    DROP TABLE dbo.InvertTransactions;
GO

CREATE TABLE InvertTransactions (
    TransactionID INT PRIMARY KEY IDENTITY(1,1), -- Auto-incrementing primary key
    CustomTransactionID NVARCHAR(50) NOT NULL UNIQUE, -- User-defined transaction ID (e.g., INV-0001)
    TransactionDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    Supplier NVARCHAR(255) NOT NULL,
    ReferenceNo NVARCHAR(100),
    TotalAmount DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    ReceivedBy NVARCHAR(100),
    WarehouseLocation NVARCHAR(100),
    Notes NVARCHAR(MAX), -- For longer text notes
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);
GO

-- Trigger to update UpdatedAt timestamp on InvertTransactions table
IF OBJECT_ID('dbo.trg_InvertTransactions_UpdateUpdatedAt', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_InvertTransactions_UpdateUpdatedAt;
GO
CREATE TRIGGER trg_InvertTransactions_UpdateUpdatedAt
ON InvertTransactions
AFTER UPDATE
AS
BEGIN
    IF TRIGGER_NESTLEVEL() > 1 RETURN;
    UPDATE InvertTransactions
    SET UpdatedAt = GETDATE()
    FROM InvertTransactions
    INNER JOIN inserted ON InvertTransactions.TransactionID = inserted.TransactionID;
END;
GO


-- 3. InvertTransactionItems Table (Line Items for Incoming Transactions)
-- This is a junction table linking InvertTransactions to Items and storing quantity, rate, etc.
IF OBJECT_ID('dbo.InvertTransactionItems', 'U') IS NOT NULL
    DROP TABLE dbo.InvertTransactionItems;
GO

CREATE TABLE InvertTransactionItems (
    TransactionItemID INT PRIMARY KEY IDENTITY(1,1),
    TransactionID INT NOT NULL,
    ItemID INT NOT NULL,
    Quantity DECIMAL(18, 3) NOT NULL, -- Allow for fractional quantities if needed
    Rate DECIMAL(18, 2) NOT NULL, -- Purchase rate at the time of transaction
    Amount AS (Quantity * Rate), -- Computed column for Quantity * Rate

    CONSTRAINT FK_InvertTransactionItems_Transaction FOREIGN KEY (TransactionID) REFERENCES InvertTransactions(TransactionID) ON DELETE CASCADE, -- If a transaction is deleted, its items are also deleted
    CONSTRAINT FK_InvertTransactionItems_Item FOREIGN KEY (ItemID) REFERENCES Items(ItemID) -- Consider ON DELETE RESTRICT or SET NULL depending on business logic for item deletion
);
GO

-- Optional: Add indexes for performance on foreign keys
CREATE INDEX IX_InvertTransactionItems_TransactionID ON InvertTransactionItems(TransactionID);
CREATE INDEX IX_InvertTransactionItems_ItemID ON InvertTransactionItems(ItemID);
GO

PRINT 'Database schema created successfully (Items, InvertTransactions, InvertTransactionItems).';
PRINT 'Please ensure you have executed this script in your SQL Server database using SSMS.';
PRINT 'Remember to update backend/dbConfig.js with your SQL Server connection details.';
