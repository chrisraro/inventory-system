@echo off
REM Petrogreen Setup Script for Windows
REM This script helps set up the application for production deployment

title Petrogreen - Production Setup

echo 🚀 Petrogreen - Production Setup
echo =================================

REM Check if we're in the project directory
if not exist "package.json" (
  echo ❌ Error: package.json not found. Please run this script from the project root directory.
  pause
  exit /b 1
)

echo ✅ Project directory confirmed

REM Check Node.js version
node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo ❌ Error: Node.js is not installed or not in PATH.
  pause
  exit /b 1
)

echo ✅ Node.js is available

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
  echo ⚠️  pnpm is not installed. Installing...
  npm install -g pnpm
)

echo ✅ pnpm is available

REM Install dependencies
echo 📦 Installing dependencies...
pnpm install

REM Check environment variables
echo 🔐 Checking environment configuration...
if exist ".env.local" (
  echo ✅ .env.local file found
) else (
  echo ⚠️  .env.local file not found. Creating from example...
  if exist ".env.example" (
    copy .env.example .env.local
    echo ✅ .env.local created from .env.example
    echo ⚠️  Please update .env.local with your actual Supabase credentials
  ) else (
    echo 📝 Creating .env.local file...
    (
      echo # Supabase Configuration
      echo NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
      echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
      echo.
      echo # Application Settings
      echo NEXT_PUBLIC_APP_NAME=Petrogreen
      echo NEXT_PUBLIC_APP_VERSION=1.0.0
    ) > .env.local
    echo ✅ .env.local created. Please update with your actual credentials
  )
)

REM Build the application
echo 🏗️  Building the application...
pnpm run build

if %errorlevel% equ 0 (
  echo ✅ Build successful
) else (
  echo ❌ Build failed. Please check the error messages above.
  pause
  exit /b 1
)

REM Run tests
echo 🧪 Running tests...
pnpm run test

if %errorlevel% equ 0 (
  echo ✅ All tests passed
) else (
  echo ❌ Some tests failed. Please check the error messages above.
  pause
  exit /b 1
)

REM Check TypeScript
echo 🔍 Checking TypeScript...
pnpm run tsc --noEmit

if %errorlevel% equ 0 (
  echo ✅ TypeScript check passed
) else (
  echo ❌ TypeScript check failed. Please check the error messages above.
  pause
  exit /b 1
)

REM Check linting
echo 🧹 Checking code linting...
pnpm run lint

if %errorlevel% equ 0 (
  echo ✅ Linting check passed
) else (
  echo ❌ Linting check failed. Please check the error messages above.
  pause
  exit /b 1
)

echo.
echo 🎉 Setup Complete!
echo ==================
echo The application is ready for production deployment.
echo.
echo Next steps:
echo 1. Update .env.local with your Supabase credentials
echo 2. Deploy using your preferred platform (Vercel, Netlify, etc.)
echo 3. Set up your Supabase database with the schema in scripts/create-complete-database-schema.sql
echo 4. Run the health check endpoint at /api/health to verify deployment
echo.
echo For more information, check the documentation in documentations.md
echo.
pause