@echo off
setlocal enabledelayedexpansion

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║                                                       ║
echo ║       🚀 Habit Tracker Backend Setup Script 🚀      ║
echo ║                                                       ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

:: Navigate to script directory
cd /d "%~dp0"

:: Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

:: Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found. Copying from .env.example...
    copy .env.example .env
    echo ✅ .env file created
    echo ⚠️  Please edit .env file with your configuration
) else (
    echo ✅ .env file exists
)

:: Ask if user wants to seed database
echo.
set /p seed="Would you like to seed the database with demo data? (y/n): "
if /i "%seed%"=="y" (
    echo.
    echo 🌱 Seeding database...
    call npm run seed
    
    if !errorlevel! equ 0 (
        echo ✅ Database seeded successfully
        echo.
        echo Demo Login Credentials:
        echo Email: demo@example.com
        echo Password: password123
    ) else (
        echo ❌ Failed to seed database
        echo Make sure MongoDB is running and configured correctly.
    )
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo                  ✅ Setup Complete! ✅
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo.
echo 📚 Next Steps:
echo 1. Make sure MongoDB is running
echo 2. Start the server:
echo    npm run dev   (development mode)
echo    npm start     (production mode)
echo.
echo 3. Test the API:
echo    curl http://localhost:5000/health
echo.
echo 4. Read the documentation:
echo    - README.md - Overview
echo    - SETUP.md - Detailed setup guide
echo    - API_DOCS.md - API documentation
echo    - FEATURES.md - Feature breakdown
echo.
echo 🎉 Happy coding!
echo.

pause
