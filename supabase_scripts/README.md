# Supabase Scripts for LPG Inventory Management System

This folder contains SQL scripts to set up and configure the Supabase database for the LPG Inventory Management System.

## Script Order and Usage

1. **01_setup_simplified_system.sql** - Creates the main database schema for the simplified QR-based system
   - Run this first to set up the core tables and functions

2. **02_setup_authentication.sql** - Sets up user authentication and role-based access control
   - Run this after the main schema is created

3. **03_update_rls_policies.sql** - Updates Row Level Security policies for cross-user visibility
   - Run this to allow admins to see all products

4. **04_add_get_product_function.sql** - Adds a database function to fetch a single product
   - Run this to support the single product API endpoint

## How to Run Scripts

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste each script in order
4. Run each script by clicking "Run"

## Important Notes

- Always run scripts in numerical order
- Make sure to replace placeholder values with actual values when needed
- Backup your database before running these scripts in production
- Some scripts may need to be run multiple times if there are dependency issues

## Troubleshooting

If you encounter errors:
1. Check that all environment variables are set correctly
2. Ensure the Supabase project has the necessary extensions enabled
3. Verify that the auth schema exists and is properly configured
4. Check the Supabase logs for detailed error messages