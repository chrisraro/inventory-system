-- Script to set admin@petrogreen.com as an admin user
-- Run this on Supabase SQL Editor

-- First, let's check if the user exists in the auth.users table
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@petrogreen.com';

-- Then, let's check if the user has a profile in user_profiles table
SELECT id, email, role, is_active FROM user_profiles WHERE email = 'admin@petrogreen.com';

-- If the user exists in auth.users but not in user_profiles, we need to create a profile
-- This would be the case for a newly created user
INSERT INTO user_profiles (id, email, full_name, role, is_active)
SELECT 
    id,
    email,
    'Admin User',
    'admin',
    true
FROM auth.users 
WHERE email = 'admin@petrogreen.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- If the user already exists in user_profiles, just update the role
UPDATE user_profiles 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'admin@petrogreen.com';

-- Verify the update
SELECT id, email, full_name, role, is_active, created_at FROM user_profiles WHERE email = 'admin@petrogreen.com';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'User admin@petrogreen.com has been set as admin successfully!';
    RAISE NOTICE 'If the user did not exist in user_profiles, a new profile has been created.';
    RAISE NOTICE 'If the user already existed, their role has been updated to admin.';
END $$;