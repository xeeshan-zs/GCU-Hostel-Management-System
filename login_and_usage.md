# 🔑 Login & Usage Guide - GCU Hostel System

Welcome to the user guide for the **GC University Lahore Hostel Management System (HostelDayz)**. This document contains startup instructions, seeded credentials for testing, and a walkthrough of the system's role-based functionalities.

---

## 🚀 Quick Start Instructions

This project is fully portable. Follow these steps to run the application on any Windows machine containing **Node.js** and **Microsoft SQL Server (SQLEXPRESS)**:

### Option A: The Easy Way (Double-Click Launcher)
1.  Make sure your local SQL Server instance (`.\SQLEXPRESS`) is running.
2.  Double-click the **`run.bat`** file in the root folder of this project.
3.  The launcher will automatically:
    *   Verify and install all required Node.js libraries (`npm install`).
    *   Connect to your SQL Server master database.
    *   Create the `HostelDB` database, tables, and seed all data automatically.
    *   Launch the web server in a separate terminal.
    *   Open **`http://localhost:8000`** in your default web browser.

### Option B: Manual CLI Commands
If you prefer running commands manually:
1.  Open your terminal in the project directory.
2.  Run `npm install` to install dependencies.
3.  Start the server:
    ```bash
    node server.js
    ```
4.  Open your browser and navigate to **`http://localhost:8000`**.

---

## 👥 Seeded Logins & Role Credentials

The database is pre-seeded with specialized accounts representing each user role in the hostel ecosystem. Use these credentials to test the dynamic dashboard:

### 1. 🛡️ Administrator Account
*   **Role**: High-level oversight, financial monitoring, and system metrics.
*   **Email**: `admin@hosteldayz.pk`
*   **Password**: `AdminPassword123`

### 2. 🔑 Warden Account
*   **Role**: Daily operations, student allocations, room capacity control, and approval management.
*   **Email**: `warden@hosteldayz.pk`
*   **Password**: `WardenPassword123`

### 3. 🎓 Student (Boarder) Accounts
*   **Role**: View room allocation status, check roommates, and order traditional food from the Lahori Canteen.
*   **Demo Student 1**:
    *   **Email**: `student@hosteldayz.pk`
    *   **Password**: `StudentPassword123`
*   **Demo Student 2 (Pending Booking)**:
    *   **Email**: `zainab.noor@hosteldayz.pk`
    *   **Password**: `password123`

---

## 🕹️ System Walkthrough & Feature Guide

To explore the role-specific dashboards, click **Login/out** in the top navigation bar, sign in with one of the accounts above, and you will be automatically redirected to the secure **Interactive Dashboard**.

---

### 1. 🎓 Student Experience
Upon logging in as a student (e.g. `student@hosteldayz.pk`), you will see a personalized dashboard with three premium interactive panels:

#### A. My Room Allocation
*   Displays your current room number (e.g., **Room 102**), room status (**Approved**), and current pricing.
*   Shows a real-time check of your roommates sharing the same room (displaying their names, emails, and phone numbers).

#### B. Lahori Canteen Panel
*   Displays an authentic dynamic canteen menu divided into categories:
    *   *Breakfast*: Lahori Siri Paye, Nihari, Halwa Puri.
    *   *Lunch/Dinner*: Butt Karahi, Mutton Biryani, Lahori Chana.
    *   *Desserts/Drinks*: Rabri Falooda, Sweet Lassi, Kashmiri Chai.
*   **Ordering Integration**: Select a delicious Lahori dish, choose the quantity, and click **Place Order**. A premium floating notification will confirm your order has been sent to the kitchen instantly!

---

### 2. 🔑 Warden Experience
Logging in as a Warden (`warden@hosteldayz.pk`) opens the management portal designed for supervising hostel applications:

#### A. Active Student Registry
*   Lists all registered hostel students along with their emails, phone numbers, and hostel blocks.

#### B. Booking & Allocation Request Manager
*   Shows a real-time list of room requests from students.
*   Includes action buttons to **Approve Booking** or **Cancel Booking** with a single click.
*   **Smart Capacity Control**: Approving a student automatically decrements the room's available beds, preventing over-allocation. Cancelling a booking instantly releases the bed back into the pool.

---

### 3. 🛡️ Administrator Experience
Logging in as the Admin (`admin@hosteldayz.pk`) provides master credentials:

#### A. Live Key Metrics
A modern grid showing instant statistics of the entire hostel network:
*   **Total Hostels**: Number of active wings.
*   **Total Rooms**: Total rooms configured in the system.
*   **Total Students**: Number of boarders.
*   **Pending Bookings**: Active queue size.
*   **Total Revenue**: Real-time summation of approved room semester fees.

#### B. Transaction Logs & Booking Overview
*   A centralized tabular display of all room allocations, prices, and approval states.
*   Includes quick action management controls to approve or reject allocations.
