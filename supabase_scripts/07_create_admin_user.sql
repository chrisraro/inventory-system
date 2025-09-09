-- Script to create admin@petrogreen.com user and set as admin
-- Run this on Supabase SQL Editor

-- First, check if the user already exists
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@petrogreen.com';

-- If the user doesn't exist, you'll need to create it through the Supabase Auth interface
-- This cannot be done directly via SQL for security reasons
-- However, we can prepare the user profile for when the user is created

-- Insert or update the user profile to ensure admin role
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
    -- You'll need to replace this with the actual UUID from auth.users once the user is created
    gen_random_uuid(),
    'admin@petrogreen.com',
    'Admin User',
    'admin',
    true
)
ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    is_active = true,
    updated_at = NOW();

-- Alternative approach: If you know the user ID, you can use this version
-- Uncomment and replace 'USER_UUID_HERE' with the actual user UUID
/*
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
    'USER_UUID_HERE',
    'admin@petrogreen.com',
    'Admin User',
    'admin',
    true
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    updated_at = NOW();
*/

-- Verify the user profile
SELECT id, email, full_name, role, is_active, created_at FROM user_profiles WHERE email = 'admin@petrogreen.com';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'User profile for admin@petrogreen.com has been created/updated with admin role!';
    RAISE NOTICE 'Note: The actual user account must be created through Supabase Auth dashboard.';
    RAISE NOTICE 'This script only sets up the user profile with admin permissions.';
END $$;