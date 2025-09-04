#!/bin/bash

# Petrogreen - Supabase Authentication Setup Script
# This script helps set up the authentication system in Supabase

echo "🚀 Setting up Petrogreen Authentication System..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials:"
    echo "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key"
    exit 1
fi

echo "✅ Found .env.local file"

# Check if SQL scripts exist
if [ ! -f "scripts/setup-authentication-system.sql" ]; then
    echo "❌ Authentication setup script not found!"
    exit 1
fi

echo "✅ Found authentication setup scripts"

echo ""
echo "📋 Next steps to complete the setup:"
echo ""
echo "1. Go to your Supabase Dashboard (https://supabase.com/dashboard)"
echo "2. Navigate to your project"
echo "3. Go to SQL Editor"
echo "4. Run the following scripts in order:"
echo ""
echo "   a) scripts/setup-authentication-system.sql"
echo "      This sets up the user profiles table, RLS policies, and functions"
echo ""
echo "   b) Create demo users manually in Authentication > Users:"
echo "      - Email: admin@petrogreen.com, Password: admin123"
echo "      - Email: stockman@petrogreen.com, Password: stock123"
echo ""
echo "   c) scripts/create-demo-users.sql"
echo "      This creates user profiles for the demo users"
echo ""
echo "5. Verify setup:"
echo "   - Check that user_profiles table exists"
echo "   - Check that RLS policies are enabled"
echo "   - Test login with demo credentials"
echo ""
echo "🔧 Manual User Creation Steps:"
echo "1. In Supabase Dashboard > Authentication > Users"
echo "2. Click 'Add user'"
echo "3. Create admin user:"
echo "   - Email: admin@petrogreen.com"
echo "   - Password: admin123"
echo "   - User Metadata: {\"full_name\": \"Administrator\", \"role\": \"admin\"}"
echo ""
echo "4. Create stockman user:"
echo "   - Email: stockman@petrogreen.com"
echo "   - Password: stock123"
echo "   - User Metadata: {\"full_name\": \"Stock Manager\", \"role\": \"stockman\"}"
echo ""
echo "📚 For detailed instructions, see the project documentation."
echo ""
echo "⚠️  Important Security Notes:"
echo "- Change default passwords in production"
echo "- Enable email confirmation in Supabase settings for production"
echo "- Configure proper password policies"
echo "- Set up proper email templates"
echo ""
echo "🎉 Setup script completed! Please follow the manual steps above."