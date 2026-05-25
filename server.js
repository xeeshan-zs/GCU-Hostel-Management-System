const express = require('express');
const sql = require('mssql/msnodesqlv8');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static HTML/CSS/JS files
app.use(express.static(__dirname));

// SQL Server Connection Configuration using Windows Authentication
const dbConfig = {
  connectionString: 'Driver={ODBC Driver 18 for SQL Server};Server=.\\SQLEXPRESS;Database=HostelDB;Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes;'
};

// Database Connection helper
async function runQuery(query, params = []) {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const request = pool.request();
    
    // Add parameters
    params.forEach(p => {
      request.input(p.name, p.type, p.value);
    });

    const result = await request.query(query);
    return result;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  } finally {
    if (pool) {
      await sql.close();
    }
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 0. API: Student Registration
app.post('/api/register', async (req, res) => {
  const { fullName, email, password, phone, gender, age } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
  }

  try {
    // Check if email already exists
    const emailCheckQuery = 'SELECT UserId FROM Users WHERE Email = @email';
    const emailCheckParams = [{ name: 'email', type: sql.VarChar(100), value: email }];
    const checkResult = await runQuery(emailCheckQuery, emailCheckParams);

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Insert user into database with RoleId = 3 (Student)
    const insertQuery = `
      INSERT INTO Users (FullName, Email, Password, RoleId, Phone, Gender, Age)
      VALUES (@fullName, @email, @password, 3, @phone, @gender, @age)
    `;
    const insertParams = [
      { name: 'fullName', type: sql.VarChar(100), value: fullName },
      { name: 'email', type: sql.VarChar(100), value: email },
      { name: 'password', type: sql.VarChar(255), value: password },
      { name: 'phone', type: sql.VarChar(20), value: phone || null },
      { name: 'gender', type: sql.VarChar(10), value: gender || null },
      { name: 'age', type: sql.Int, value: age ? parseInt(age) : null }
    ];

    await runQuery(insertQuery, insertParams);

    return res.json({ success: true, message: 'User registered successfully!' });
  } catch (err) {
    console.error('Registration server error:', err);
    return res.status(500).json({ success: false, message: 'Server database connection error.' });
  }
});

// 1. API: Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
  }

  try {
    const query = `
      SELECT u.UserId, u.FullName, u.Email, u.RoleId, r.RoleName, u.Phone, u.Gender, u.Age
      FROM Users u
      JOIN Roles r ON u.RoleId = r.RoleId
      WHERE u.Email = @email AND u.Password = @password
    `;
    const params = [
      { name: 'email', type: sql.VarChar(100), value: email },
      { name: 'password', type: sql.VarChar(255), value: password }
    ];

    const result = await runQuery(query, params);
    
    if (result.recordset.length === 0) {
      return res.json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.recordset[0];
    
    // Set cookie (valid for 1 hour)
    res.cookie('user', JSON.stringify({
      userId: user.UserId,
      fullName: user.FullName,
      email: user.Email,
      roleId: user.RoleId,
      roleName: user.RoleName
    }), { maxAge: 3600000, httpOnly: false });

    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server database connection error.' });
  }
});

// 2. API: Logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('user');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// 3. API: Get Canteen Menu
app.get('/api/canteen', async (req, res) => {
  try {
    const result = await runQuery('SELECT * FROM Canteen');
    return res.json({ success: true, items: result.recordset });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch canteen items.' });
  }
});

// 4. API: Canteen Order Place Demonstration
app.post('/api/canteen/order', (req, res) => {
  const { itemId, quantity } = req.body;
  // Simple mock ordering confirmation for premium interactive feel!
  return res.json({ success: true, message: 'Your Lahori Canteen order has been sent to the kitchen!' });
});

// 5. API: Dashboard Data
app.get('/api/dashboard', async (req, res) => {
  const userCookie = req.cookies.user;
  if (!userCookie) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login first.' });
  }

  const user = JSON.parse(userCookie);

  try {
    // ------------------------------------
    // STUDENT VIEW (RoleId = 3)
    // ------------------------------------
    if (user.roleId === 3) {
      // Get active/pending booking
      const bookingQuery = `
        SELECT b.BookingId, b.Status, b.BookingDate, r.RoomNumber, r.Price, h.HostelName
        FROM Bookings b
        JOIN Rooms r ON b.RoomId = r.RoomId
        JOIN Hostels h ON r.HostelId = h.HostelId
        WHERE b.UserId = @userId
      `;
      const params = [{ name: 'userId', type: sql.Int, value: user.userId }];
      const bookingResult = await runQuery(bookingQuery, params);
      const activeBooking = bookingResult.recordset[0] || null;

      let roommates = [];
      if (activeBooking && activeBooking.Status === 'Approved') {
        const roommateQuery = `
          SELECT u.FullName, u.Phone, u.Email
          FROM Bookings b
          JOIN Users u ON b.UserId = u.UserId
          WHERE b.RoomId = (
            SELECT RoomId FROM Bookings WHERE UserId = @userId AND Status = 'Approved'
          ) AND b.UserId != @userId AND b.Status = 'Approved'
        `;
        const roommateResult = await runQuery(roommateQuery, [{ name: 'userId', type: sql.Int, value: user.userId }]);
        roommates = roommateResult.recordset;
      }

      return res.json({
        success: true,
        role: 'Student',
        booking: activeBooking,
        roommates: roommates
      });
    }

    // ------------------------------------
    // WARDEN VIEW (RoleId = 2)
    // ------------------------------------
    if (user.roleId === 2) {
      // Wardens manage all student bookings and lists
      const wardenBookingsQuery = `
        SELECT b.BookingId, b.Status, b.BookingDate, u.FullName AS StudentName, u.Email AS StudentEmail, u.Phone AS StudentPhone, r.RoomNumber, h.HostelName
        FROM Bookings b
        JOIN Users u ON b.UserId = u.UserId
        JOIN Rooms r ON b.RoomId = r.RoomId
        JOIN Hostels h ON r.HostelId = h.HostelId
        ORDER BY b.BookingDate DESC
      `;
      const bookingsResult = await runQuery(wardenBookingsQuery);
      return res.json({
        success: true,
        role: 'Warden',
        bookings: bookingsResult.recordset
      });
    }

    // ------------------------------------
    // ADMIN VIEW (RoleId = 1)
    // ------------------------------------
    if (user.roleId === 1) {
      // Fetch comprehensive metrics
      const hostCount = await runQuery('SELECT COUNT(*) AS count FROM Hostels');
      const roomCount = await runQuery('SELECT COUNT(*) AS count FROM Rooms');
      const studentCount = await runQuery('SELECT COUNT(*) AS count FROM Users WHERE RoleId = 3');
      const approvedCount = await runQuery("SELECT COUNT(*) AS count FROM Bookings WHERE Status = 'Approved'");
      const pendingCount = await runQuery("SELECT COUNT(*) AS count FROM Bookings WHERE Status = 'Pending'");
      const revenueResult = await runQuery("SELECT SUM(r.Price) AS count FROM Bookings b JOIN Rooms r ON b.RoomId = r.RoomId WHERE b.Status = 'Approved'");
      
      const adminBookingsQuery = `
        SELECT b.BookingId, b.Status, b.BookingDate, u.FullName AS StudentName, r.RoomNumber, h.HostelName, r.Price
        FROM Bookings b
        JOIN Users u ON b.UserId = u.UserId
        JOIN Rooms r ON b.RoomId = r.RoomId
        JOIN Hostels h ON r.HostelId = h.HostelId
        ORDER BY b.BookingDate DESC
      `;
      const bookingsResult = await runQuery(adminBookingsQuery);

      return res.json({
        success: true,
        role: 'Admin',
        metrics: {
          totalHostels: hostCount.recordset[0].count,
          totalRooms: roomCount.recordset[0].count,
          totalStudents: studentCount.recordset[0].count,
          approvedBookings: approvedCount.recordset[0].count,
          pendingBookings: pendingCount.recordset[0].count,
          totalRevenue: revenueResult.recordset[0].count || 0
        },
        bookings: bookingsResult.recordset
      });
    }

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.' });
  }
});

// 6. API: Warden/Admin Approve/Cancel Booking
app.post('/api/bookings/action', async (req, res) => {
  const { bookingId, action } = req.body;
  const userCookie = req.cookies.user;
  
  if (!userCookie) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const user = JSON.parse(userCookie);
  if (user.roleId !== 1 && user.roleId !== 2) {
    return res.status(403).json({ success: false, message: 'Forbidden. Wardens/Admins only.' });
  }

  if (!bookingId || !action) {
    return res.status(400).json({ success: false, message: 'Booking ID and action are required.' });
  }

  try {
    // 1. Get room details for the booking
    const getBookingQuery = 'SELECT RoomId, Status FROM Bookings WHERE BookingId = @bookingId';
    const bookingResult = await runQuery(getBookingQuery, [{ name: 'bookingId', type: sql.Int, value: bookingId }]);
    
    if (bookingResult.recordset.length === 0) {
      return res.json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookingResult.recordset[0];
    const roomId = booking.RoomId;
    const currentStatus = booking.Status;

    if (currentStatus === action) {
      return res.json({ success: true, message: `Booking is already ${action}.` });
    }

    // 2. Perform updates
    // Update booking status
    const updateBookingQuery = 'UPDATE Bookings SET Status = @action WHERE BookingId = @bookingId';
    await runQuery(updateBookingQuery, [
      { name: 'action', type: sql.VarChar(20), value: action },
      { name: 'bookingId', type: sql.Int, value: bookingId }
    ]);

    // Handle room capacity updates
    if (action === 'Approved') {
      // Decrement availability
      await runQuery('UPDATE Rooms SET Available = Available - 1 WHERE RoomId = @roomId AND Available > 0', [
        { name: 'roomId', type: sql.Int, value: roomId }
      ]);
    } else if (action === 'Cancelled' && currentStatus === 'Approved') {
      // Increment availability back
      await runQuery('UPDATE Rooms SET Available = Available + 1 WHERE RoomId = @roomId', [
        { name: 'roomId', type: sql.Int, value: roomId }
      ]);
    }

    return res.json({ success: true, message: `Booking successfully ${action}!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update booking status.' });
  }
});

// Database Auto-Setup & Seeding Sequence
async function autoSetupDatabase() {
  const masterConfig = {
    connectionString: 'Driver={ODBC Driver 18 for SQL Server};Server=.\\SQLEXPRESS;Database=master;Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes;'
  };
  
  let pool;
  try {
    console.log('Connecting to master to verify database...');
    pool = await sql.connect(masterConfig);
    
    // Check if HostelDB database exists
    const dbCheckResult = await pool.request().query("SELECT database_id FROM sys.databases WHERE name = 'HostelDB'");
    
    if (dbCheckResult.recordset.length === 0) {
      console.log('HostelDB database not found. Creating database HostelDB...');
      await pool.request().query("CREATE DATABASE HostelDB");
      console.log('Database HostelDB created successfully.');
    } else {
      console.log('HostelDB database already exists in system.');
    }
  } catch (err) {
    console.error('Error verifying database in master (SQLEXPRESS):', err);
    throw err;
  } finally {
    if (pool) {
      await sql.close();
    }
  }

  // Connect to HostelDB and ensure tables & data exist
  try {
    console.log('Connecting to HostelDB to verify schema...');
    pool = await sql.connect(dbConfig);
    
    // Check if Roles table exists as a schema indicator
    const tableCheckResult = await pool.request().query(
      "SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Roles'"
    );

    if (tableCheckResult.recordset.length === 0) {
      console.log('Schema not found in HostelDB. Creating tables...');
      
      // 1. Roles table
      await pool.request().query(`
        CREATE TABLE Roles (
            RoleId INT PRIMARY KEY,
            RoleName VARCHAR(50) NOT NULL
        )
      `);
      
      // 2. Users table
      await pool.request().query(`
        CREATE TABLE Users (
            UserId INT IDENTITY(1,1) PRIMARY KEY,
            FullName VARCHAR(100) NOT NULL,
            Email VARCHAR(100) UNIQUE NOT NULL,
            Password VARCHAR(255) NOT NULL,
            RoleId INT FOREIGN KEY REFERENCES Roles(RoleId),
            Phone VARCHAR(20),
            Gender VARCHAR(10),
            Age INT
        )
      `);

      // 3. Hostels table
      await pool.request().query(`
        CREATE TABLE Hostels (
            HostelId INT PRIMARY KEY,
            HostelName VARCHAR(100) NOT NULL,
            HostelType VARCHAR(10) NOT NULL
        )
      `);

      // 4. Rooms table
      await pool.request().query(`
        CREATE TABLE Rooms (
            RoomId INT IDENTITY(1,1) PRIMARY KEY,
            HostelId INT FOREIGN KEY REFERENCES Hostels(HostelId),
            RoomNumber VARCHAR(20) NOT NULL,
            Capacity INT NOT NULL,
            Available INT NOT NULL,
            Price DECIMAL(10,2) NOT NULL
        )
      `);

      // 5. Canteen table
      await pool.request().query(`
        CREATE TABLE Canteen (
            ItemId INT IDENTITY(1,1) PRIMARY KEY,
            Name VARCHAR(100) NOT NULL,
            Category VARCHAR(50) NOT NULL,
            Price DECIMAL(10,2) NOT NULL,
            Description VARCHAR(255)
        )
      `);

      // 6. Bookings table
      await pool.request().query(`
        CREATE TABLE Bookings (
            BookingId INT IDENTITY(1,1) PRIMARY KEY,
            UserId INT FOREIGN KEY REFERENCES Users(UserId),
            RoomId INT FOREIGN KEY REFERENCES Rooms(RoomId),
            BookingDate DATETIME DEFAULT GETDATE(),
            Status VARCHAR(20) DEFAULT 'Pending'
        )
      `);

      console.log('Tables created successfully. Seeding initial data...');

      // Seed Roles
      await pool.request().query(`
        INSERT INTO Roles (RoleId, RoleName) VALUES
        (1, 'Admin'),
        (2, 'Warden'),
        (3, 'Student')
      `);

      // Seed Users (Demo Accounts)
      await pool.request().query(`
        INSERT INTO Users (FullName, Email, Password, RoleId, Phone, Gender, Age) VALUES
        ('Usman Ahmed', 'admin@hosteldayz.pk', 'AdminPassword123', 1, '(+92) 42 111 123 456', 'Male', 35),
        ('Saad Khan', 'warden@hosteldayz.pk', 'WardenPassword123', 2, '(+92) 300 987 6543', 'Male', 40),
        ('Hamza Yousaf', 'student@hosteldayz.pk', 'StudentPassword123', 3, '(+92) 321 456 7890', 'Male', 21),
        ('Ali Ahmed', 'ali.ahmed@hosteldayz.pk', 'password123', 3, '(+92) 300 555 1234', 'Male', 20),
        ('Ayesha Imran', 'ayesha.khan@hosteldayz.pk', 'password123', 3, '(+92) 333 444 5555', 'Female', 19),
        ('Zainab Noor', 'zainab.noor@hosteldayz.pk', 'password123', 3, '(+92) 301 765 4321', 'Female', 21)
      `);

      // Seed Hostels
      await pool.request().query(`
        INSERT INTO Hostels (HostelId, HostelName, HostelType) VALUES
        (1, 'Iqbal Hostel', 'Boys'),
        (2, 'Jinnah Hostel', 'Boys'),
        (3, 'Fatima Jinnah Hostel', 'Girls')
      `);

      // Seed Rooms
      await pool.request().query(`
        INSERT INTO Rooms (HostelId, RoomNumber, Capacity, Available, Price) VALUES
        (1, '101', 4, 3, 6000.00),
        (1, '102', 2, 1, 9000.00),
        (2, '201', 4, 4, 5000.00),
        (2, '202', 2, 2, 8000.00),
        (3, '301', 4, 3, 6500.00),
        (3, '302', 2, 1, 9500.00)
      `);

      // Seed Bookings
      await pool.request().query(`
        INSERT INTO Bookings (UserId, RoomId, Status) VALUES
        (3, 2, 'Approved'),
        (4, 1, 'Approved'),
        (5, 5, 'Approved'),
        (6, 6, 'Pending')
      `);

      // Seed Canteen
      await pool.request().query(`
        INSERT INTO Canteen (Name, Category, Price, Description) VALUES
        ('Lahori Siri Paye', 'breakfast', 350.00, 'Slow-cooked goat trotters in rich traditional gravy, served with hot naan.'),
        ('Nihari (Special)', 'breakfast', 400.00, 'Tender beef shank stewed in aromatic spices, topped with fresh ginger and lemon.'),
        ('Halwa Puri (Plate)', 'breakfast', 200.00, 'Two fluffy fried puris served with sweet semolina halwa and spicy chickpea curry.'),
        ('Butt Karahi (Chicken)', 'lunch', 650.00, 'Classic Lahore Lakshmi Chowk style chicken karahi cooked in fresh tomatoes and real butter.'),
        ('Mutton Biryani', 'lunch', 450.00, 'Fragrant basmati rice layered with succulent mutton and authentic Lahori spices.'),
        ('Lahori Chana (Plate)', 'lunch', 150.00, 'Spicy chickpea curry cooked in traditional Lahori spices, served with hot tandoori roti.'),
        ('Rabri Falooda', 'dessert', 250.00, 'Kasuri-style rich rabri topped with thin vermicelli and basil seeds.'),
        ('Lahori Sweet Lassi', 'drink', 120.00, 'Creamy, chilled yogurt drink served with a dollop of fresh cream on top.'),
        ('Kashmiri Chai', 'drink', 100.00, 'Traditional rich pink tea brewed with cardamom, almonds, and pistachios.')
      `);

      console.log('HostelDB Database tables and seed data created successfully!');
    } else {
      console.log('HostelDB tables are already initialized in system.');
    }
  } catch (err) {
    console.error('Error auto-initializing HostelDB schema or data:', err);
    throw err;
  } finally {
    if (pool) {
      await sql.close();
    }
  }
}

// Start express server after verifying and seeding database
autoSetupDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`=============================================================`);
      console.log(`GCU Hostel Management Server running successfully on http://localhost:${PORT}`);
      console.log(`=============================================================`);
    });
  })
  .catch(err => {
    console.error("FATAL: Failed to auto-initialize SQL Server Database:", err);
    console.log("Starting server in degraded mode...");
    app.listen(PORT, () => {
      console.log(`GCU Hostel Server is running on http://localhost:${PORT} (Database integration unavailable)`);
    });
  });
