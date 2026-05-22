-- SQL Server Setup Script for Hostel Management System
-- Database name: HostelDB
-- Instance: .\SQLEXPRESS

USE master;
GO

-- Recreate database if exists
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'HostelDB')
BEGIN
    ALTER DATABASE HostelDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE HostelDB;
END
GO

CREATE DATABASE HostelDB;
GO

USE HostelDB;
GO

-- 1. Create Roles Table
CREATE TABLE Roles (
    RoleId INT PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL
);
GO

-- 2. Create Users Table
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL, -- Stored plaintext or simple string for demo
    RoleId INT FOREIGN KEY REFERENCES Roles(RoleId),
    Phone VARCHAR(20),
    Gender VARCHAR(10),
    Age INT
);
GO

-- 3. Create Hostels Table
CREATE TABLE Hostels (
    HostelId INT PRIMARY KEY,
    HostelName VARCHAR(100) NOT NULL,
    HostelType VARCHAR(10) NOT NULL -- 'Boys' or 'Girls'
);
GO

-- 4. Create Rooms Table
CREATE TABLE Rooms (
    RoomId INT IDENTITY(1,1) PRIMARY KEY,
    HostelId INT FOREIGN KEY REFERENCES Hostels(HostelId),
    RoomNumber VARCHAR(20) NOT NULL,
    Capacity INT NOT NULL,
    Available INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL
);
GO

-- 5. Create Canteen Table
CREATE TABLE Canteen (
    ItemId INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Category VARCHAR(50) NOT NULL, -- 'breakfast', 'lunch', 'dessert', 'drink'
    Price DECIMAL(10,2) NOT NULL,
    Description VARCHAR(255)
);
GO

-- 6. Create Bookings Table
CREATE TABLE Bookings (
    BookingId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    RoomId INT FOREIGN KEY REFERENCES Rooms(RoomId),
    BookingDate DATETIME DEFAULT GETDATE(),
    Status VARCHAR(20) DEFAULT 'Pending' -- 'Pending', 'Approved', 'Cancelled'
);
GO

-- ==========================================
-- SEED DATA
-- ==========================================

-- Seed Roles
INSERT INTO Roles (RoleId, RoleName) VALUES
(1, 'Admin'),
(2, 'Warden'),
(3, 'Student');
GO

-- Seed Users (Demo Accounts)
-- Admin
INSERT INTO Users (FullName, Email, Password, RoleId, Phone, Gender, Age) VALUES
('Usman Ahmed', 'admin@hosteldayz.pk', 'AdminPassword123', 1, '(+92) 42 111 123 456', 'Male', 35);

-- Warden
INSERT INTO Users (FullName, Email, Password, RoleId, Phone, Gender, Age) VALUES
('Saad Khan', 'warden@hosteldayz.pk', 'WardenPassword123', 2, '(+92) 300 987 6543', 'Male', 40);

-- Students
INSERT INTO Users (FullName, Email, Password, RoleId, Phone, Gender, Age) VALUES
('Hamza Yousaf', 'student@hosteldayz.pk', 'StudentPassword123', 3, '(+92) 321 456 7890', 'Male', 21),
('Ali Ahmed', 'ali.ahmed@hosteldayz.pk', 'password123', 3, '(+92) 300 555 1234', 'Male', 20),
('Ayesha Imran', 'ayesha.khan@hosteldayz.pk', 'password123', 3, '(+92) 333 444 5555', 'Female', 19),
('Zainab Noor', 'zainab.noor@hosteldayz.pk', 'password123', 3, '(+92) 301 765 4321', 'Female', 21);
GO

-- Seed Hostels
INSERT INTO Hostels (HostelId, HostelName, HostelType) VALUES
(1, 'Iqbal Hostel', 'Boys'),
(2, 'Jinnah Hostel', 'Boys'),
(3, 'Fatima Jinnah Hostel', 'Girls');
GO

-- Seed Rooms
-- Iqbal Hostel Rooms
INSERT INTO Rooms (HostelId, RoomNumber, Capacity, Available, Price) VALUES
(1, '101', 4, 3, 6000.00),
(1, '102', 2, 1, 9000.00);

-- Jinnah Hostel Rooms
INSERT INTO Rooms (HostelId, RoomNumber, Capacity, Available, Price) VALUES
(2, '201', 4, 4, 5000.00),
(2, '202', 2, 2, 8000.00);

-- Fatima Jinnah Hostel Rooms
INSERT INTO Rooms (HostelId, RoomNumber, Capacity, Available, Price) VALUES
(3, '301', 4, 3, 6500.00),
(3, '302', 2, 1, 9500.00);
GO

-- Seed Bookings
-- Hamza Yousaf (UserId = 3) is allocated in Room 102 (RoomId = 2)
INSERT INTO Bookings (UserId, RoomId, Status) VALUES
(3, 2, 'Approved');

-- Ali Ahmed (UserId = 4) is allocated in Room 101 (RoomId = 1)
INSERT INTO Bookings (UserId, RoomId, Status) VALUES
(4, 1, 'Approved');

-- Ayesha Imran (UserId = 5) is allocated in Room 301 (RoomId = 5)
INSERT INTO Bookings (UserId, RoomId, Status) VALUES
(5, 5, 'Approved');

-- Zainab Noor (UserId = 6) has a pending booking in Room 302 (RoomId = 6)
INSERT INTO Bookings (UserId, RoomId, Status) VALUES
(6, 6, 'Pending');
GO

-- Seed Canteen (Lahori Canteen Specialties)
INSERT INTO Canteen (Name, Category, Price, Description) VALUES
('Lahori Siri Paye', 'breakfast', 350.00, 'Slow-cooked goat trotters in rich traditional gravy, served with hot naan.'),
('Nihari (Special)', 'breakfast', 400.00, 'Tender beef shank stewed in aromatic spices, topped with fresh ginger and lemon.'),
('Halwa Puri (Plate)', 'breakfast', 200.00, 'Two fluffy fried puris served with sweet semolina halwa and spicy chickpea curry.'),
('Butt Karahi (Chicken)', 'lunch', 650.00, 'Classic Lahore Lakshmi Chowk style chicken karahi cooked in fresh tomatoes and real butter.'),
('Mutton Biryani', 'lunch', 450.00, 'Fragrant basmati rice layered with succulent mutton and authentic Lahori spices.'),
('Lahori Chana (Plate)', 'lunch', 150.00, 'Spicy chickpea curry cooked in traditional Lahori spices, served with hot tandoori roti.'),
('Rabri Falooda', 'dessert', 250.00, 'Kasuri-style rich rabri topped with thin vermicelli and basil seeds.'),
('Lahori Sweet Lassi', 'drink', 120.00, 'Creamy, chilled yogurt drink served with a dollop of fresh cream on top.'),
('Kashmiri Chai', 'drink', 100.00, 'Traditional rich pink tea brewed with cardamom, almonds, and pistachios.');
GO

PRINT 'HostelDB Database created and seeded successfully!';
GO
