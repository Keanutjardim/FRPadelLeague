@echo off
echo ========================================
echo Padel Connect - Supabase Setup Script
echo ========================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Supabase CLI not found. Installing...
    echo.
    echo Please install Supabase CLI using one of these methods:
    echo.
    echo 1. Using npm:
    echo    npm install -g supabase
    echo.
    echo 2. Using Scoop:
    echo    scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
    echo    scoop install supabase
    echo.
    echo After installing, run this script again.
    pause
    exit /b 1
)

echo Supabase CLI found!
echo.

REM Check if .env file exists
if exist .env (
    echo .env file already exists.
    set /p OVERWRITE="Do you want to update it? (y/n): "
    if /i not "%OVERWRITE%"=="y" goto LOGIN
)

:ENV_SETUP
echo.
echo ========================================
echo Step 1: Environment Variables Setup
echo ========================================
echo.
echo Please enter your Supabase project details:
echo (You can find these at https://app.supabase.com/project/_/settings/api)
echo.

set /p SUPABASE_URL="Supabase Project URL: "
set /p SUPABASE_ANON_KEY="Supabase Anon Key: "

echo.
echo Creating .env file...
(
echo # Supabase Configuration
echo VITE_SUPABASE_URL=%SUPABASE_URL%
echo VITE_SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY%
) > .env

echo .env file created successfully!
echo.

:LOGIN
echo ========================================
echo Step 2: Supabase Login
echo ========================================
echo.
echo Please login to Supabase...
supabase login

if %ERRORLEVEL% NEQ 0 (
    echo Login failed. Please try again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 3: Link to Project
echo ========================================
echo.
set /p PROJECT_REF="Enter your Supabase project reference ID (from project URL): "

supabase link --project-ref %PROJECT_REF%

if %ERRORLEVEL% NEQ 0 (
    echo Failed to link project. Please check your project reference.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 4: Run Database Migration
echo ========================================
echo.
echo Applying database migration...

supabase db push

if %ERRORLEVEL% NEQ 0 (
    echo Migration failed. You may need to run it manually.
    echo.
    echo Manual steps:
    echo 1. Go to https://app.supabase.com/project/%PROJECT_REF%/sql/new
    echo 2. Copy the contents of supabase/migrations/001_initial_schema.sql
    echo 3. Paste and run it in the SQL Editor
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete! ✓
echo ========================================
echo.
echo Your Padel Connect app is now connected to Supabase!
echo.
echo Next steps:
echo 1. Install dependencies: npm install
echo 2. Start the dev server: npm run dev
echo 3. Create your first user account
echo.
pause
