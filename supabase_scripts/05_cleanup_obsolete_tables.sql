-- Cleanup Obsolete Tables
-- This script removes tables that are no longer used in the simplified system

-- WARNING: Only run this script after confirming that all data has been migrated
-- and that the application is working correctly with the new simplified system.

-- First, check what tables exist
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Backup any data you might need before dropping tables
-- CREATE TABLE products_backup AS SELECT * FROM products;
-- CREATE TABLE stock_movements_backup AS SELECT * FROM stock_movements;
-- CREATE TABLE qr_codes_backup AS SELECT * FROM qr_codes;

-- Drop obsolete tables (uncomment the following lines to execute)
-- DROP TABLE IF EXISTS qr_codes CASCADE;
-- DROP TABLE IF EXISTS stock_movements CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;

-- If you have the intermediate tables from migration, you can also drop them
-- DROP TABLE IF EXISTS products_new CASCADE;
-- DROP TABLE IF EXISTS products_new_backup CASCADE;
-- DROP TABLE IF EXISTS stock_movements_backup CASCADE;

-- Verify that the tables have been dropped
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('products', 'stock_movements', 'qr_codes', 'products_new');

-- You can also check the remaining tables to ensure you still have the important ones
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('products_simplified', 'stock_movements_simplified', 'user_profiles', 'suppliers');