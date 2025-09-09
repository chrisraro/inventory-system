# Fix Instructions for Data Visibility and User Management

This document provides instructions to fix the issue where stockman users see the same data as admin users and to restore user role management functionality.

## Issues Identified

1. **Data Visibility Issue**: The Supabase client functions were not filtering data based on user roles
2. **RLS Policies**: The Row Level Security policies needed to be updated to ensure proper data isolation
3. **User Management**: User management functionality was already implemented but needed to be verified

## Fixes Applied

### 1. Client-Side Filtering (lib/supabase.ts)

The following functions in [lib/supabase.ts](file:///C:/Users/User/OneDrive/Desktop/inventory-system/lib/supabase.ts) have been updated to respect user roles:
- [getProducts](file:///C:/Users/User/OneDrive/Desktop/inventory-system/lib/supabase.ts#L117-L140)
- [getProduct](file:///C:/Users/User/OneDrive/Desktop/inventory-system/lib/supabase.ts#L142-L165)
- [getStockMovements](file:///C:/Users/User/OneDrive/Desktop/inventory-system/lib/supabase.ts#L187-L217)

These functions now:
1. Fetch the current user's profile to determine their role
2. If the user is an admin, they can see all data
3. If the user is a stockman, they can only see their own data

### 2. Database RLS Policies (supabase_scripts/05_complete_rls_fix.sql)

A new SQL script has been created to ensure proper Row Level Security policies:
- Admin users can view all products and stock movements
- Regular users can only view their own products and stock movements
- All users can create, update, and delete their own records

## Steps to Apply Fixes

### Step 1: Run the SQL Script

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of [supabase_scripts/05_complete_rls_fix.sql](file:///C:/Users/User/OneDrive/Desktop/inventory-system/supabase_scripts/05_complete_rls_fix.sql)
4. Run the script

### Step 2: Test the Application

1. Log in as an admin user (admin@petrogreen.com)
   - You should see all products and stock movements
2. Log in as a stockman user (stockman@petrogreen.com)
   - You should only see products and stock movements created by this user

### Step 3: Test User Management

1. Log in as an admin user
2. Navigate to the Admin section → User Management
3. You should be able to:
   - View all users
   - Change user roles between admin and stockman
   - Activate/deactivate users

## Verification

After applying these fixes:
- Admin users will see all data in the system
- Stockman users will only see data they created
- Admin users can manage user roles and permissions
- The system maintains proper data isolation while providing appropriate access

## Troubleshooting

If you still experience issues:

1. Check that the SQL script ran successfully in Supabase
2. Verify that user profiles have the correct roles in the `user_profiles` table
3. Clear browser cache and refresh the application
4. Check the browser console for any JavaScript errors

## Additional Notes

The user management functionality is already implemented in [app/admin/users/page.tsx](file:///C:/Users/User/OneDrive/Desktop/inventory-system/app/admin/users/page.tsx) and should work correctly after applying these fixes.