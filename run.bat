@echo off
title GCU Hostel Management System - Launcher
cls
echo =======================================================================
echo              GCU Lahore Hostel Management System - Launcher            
echo =======================================================================
echo.
echo Creators: Fatima Rana, Juniad Hassan, and Hadi Hassan
echo.
echo -----------------------------------------------------------------------
echo Step 1: Checking and Installing Dependencies...
echo -----------------------------------------------------------------------
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Please make sure Node.js is installed.
    pause
    exit /b %errorlevel%
)
echo [SUCCESS] Dependencies verified.
echo.
echo -----------------------------------------------------------------------
echo Step 2: Auto-Seeding Database ^& Launching Node Express Server...
echo -----------------------------------------------------------------------
echo The system will connect to local SQL Server (.\SQLEXPRESS) master,
echo create 'HostelDB', compile the tables, and seed all demo data!
echo.
echo Launching server in a new window...
start "GCU Hostel Server" cmd /c "node server.js"
echo.
echo -----------------------------------------------------------------------
echo Step 3: Launching Web Interface...
echo -----------------------------------------------------------------------
echo Waiting 3 seconds for server database initialization...
timeout /t 3 /nobreak > nul
echo Opening http://localhost:8000 in your browser...
start http://localhost:8000
echo.
echo =======================================================================
echo  Server is now running! Keep this window open or close it as needed.  
echo =======================================================================
pause
