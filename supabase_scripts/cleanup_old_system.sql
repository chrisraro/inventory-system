-- Cleanup Script for Old QR-Based System
-- This script removes all obsolete tables and functions from the old system
-- WARNING: This will permanently delete all data in these tables

-- First, check what tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Drop obsolete tables (uncomment the following lines to execute)
-- These tables are from the old system and are no longer used

-- Drop the old products table
DROP TABLE IF EXISTS products CASCADE;

-- Drop the old stock_movements table
DROP TABLE IF EXISTS stock_movements CASCADE;

-- Drop the old qr_codes table
DROP TABLE IF EXISTS qr_codes CASCADE;

-- Drop any intermediate or backup tables from migration
DROP TABLE IF EXISTS products_new CASCADE;
DROP TABLE IF EXISTS products_backup CASCADE;
DROP TABLE IF EXISTS stock_movements_backup CASCADE;
DROP TABLE IF EXISTS qr_codes_backup CASCADE;
DROP TABLE IF EXISTS products_new_backup CASCADE;

-- Drop obsolete functions (if any)
-- DROP FUNCTION IF EXISTS apply_stock_movement() CASCADE;
-- DROP FUNCTION IF EXISTS update_product_timestamp() CASCADE;

-- Drop any obsolete views
-- DROP VIEW IF EXISTS products_with_stock CASCADE;

-- Verify that the tables have been dropped
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('products', 'stock_movements', 'qr_codes', 'products_new');

-- You can also check the remaining tables to ensure you still have the important ones
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('products_simplified', 'stock_movements_simplified', 'user_profiles', 'suppliers');

-- Check remaining functions
SELECT proname FROM pg_proc WHERE proname IN ('apply_stock_movement', 'update_product_timestamp', 'get_user_role', 'has_permission', 'handle_new_user', 'handle_updated_at');