-- Create Demo Users for Petrogreen
-- This script creates the demo users that were previously hardcoded

-- Note: This script should be run after setting up the authentication system
-- Users will be created via Supabase Auth API or manual creation in Supabase Dashboard

-- Demo user data for reference:
-- These users should be created through Supabase Dashboard or API calls

/*
Admin User:
- Email: admin@petrogreen.com
- Password: admin123
- Full Name: Administrator
- Role: admin

Stock Manager User:
- Email: stockman@petrogreen.com  
- Password: stock123
- Full Name: Stock Manager
- Role: stockman
*/

-- If users already exist in auth.users, insert their profiles
-- This is a fallback in case profiles weren't auto-created

DO $$
DECLARE
    admin_uuid UUID;
    stockman_uuid UUID;
BEGIN
    -- Get UUIDs for existing users (if they exist)
    SELECT id INTO admin_uuid FROM auth.users WHERE email = 'admin@petrogreen.com';
    SELECT id INTO stockman_uuid FROM auth.users WHERE email = 'stockman@petrogreen.com';
    
    -- Insert admin profile if user exists
    IF admin_uuid IS NOT NULL THEN
        INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
        VALUES (admin_uuid, 'admin@petrogreen.com', 'Administrator', 'admin', true)
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            is_active = EXCLUDED.is_active,
            updated_at = now();
        
        RAISE NOTICE 'Admin profile created/updated for UUID: %', admin_uuid;
    ELSE
        RAISE NOTICE 'Admin user not found in auth.users. Please create user first.';
    END IF;
    
    -- Insert stockman profile if user exists
    IF stockman_uuid IS NOT NULL THEN
        INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
        VALUES (stockman_uuid, 'stockman@petrogreen.com', 'Stock Manager', 'stockman', true)
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            is_active = EXCLUDED.is_active,
            updated_at = now();
        
        RAISE NOTICE 'Stockman profile created/updated for UUID: %', stockman_uuid;
    ELSE
        RAISE NOTICE 'Stockman user not found in auth.users. Please create user first.';
    END IF;
END $$;

-- Verify user profiles
SELECT 
    email,
    full_name,
    role,
    is_active,
    created_at
FROM public.user_profiles
ORDER BY role DESC;