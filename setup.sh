#!/bin/bash

# Petrogreen Setup Script
# This script helps set up the application for production deployment

echo "🚀 Petrogreen - Production Setup"
echo "================================="

# Check if we're in the project directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the project root directory."
  exit 1
fi

echo "✅ Project directory confirmed"

# Check Node.js version
NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
  echo "⚠️  pnpm is not installed. Installing..."
  npm install -g pnpm
fi

echo "✅ pnpm is available"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Check environment variables
echo "🔐 Checking environment configuration..."
if [ -f ".env.local" ]; then
  echo "✅ .env.local file found"
else
  echo "⚠️  .env.local file not found. Creating from example..."
  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo "✅ .env.local created from .env.example"
    echo "⚠️  Please update .env.local with your actual Supabase credentials"
  else
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Settings
NEXT_PUBLIC_APP_NAME=Petrogreen
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
    echo "✅ .env.local created. Please update with your actual credentials"
  fi
fi

# Build the application
echo "🏗️  Building the application..."
pnpm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed. Please check the error messages above."
  exit 1
fi

# Check TypeScript
echo "🔍 Checking TypeScript..."
pnpm run tsc --noEmit

if [ $? -eq 0 ]; then
  echo "✅ TypeScript check passed"
else
  echo "❌ TypeScript check failed. Please check the error messages above."
  exit 1
fi

# Check linting
echo "🧹 Checking code linting..."
pnpm run lint

if [ $? -eq 0 ]; then
  echo "✅ Linting check passed"
else
  echo "❌ Linting check failed. Please check the error messages above."
  exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo "The application is ready for production deployment."
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Deploy using your preferred platform (Vercel, Netlify, etc.)"
echo "3. Set up your Supabase database with the schema in scripts/create-complete-database-schema.sql"
echo "4. Verify the application is working correctly"
echo ""
echo "For more information, check the documentation in documentations.md"