@echo off
echo LPG Inventory Management System - Supabase Setup
echo =================================================
echo.
echo This batch file lists all the SQL scripts in order of execution.
echo You should run these scripts in the Supabase SQL Editor in this order:
echo.
echo 1. 00_complete_setup.sql - Complete setup (recommended for new installations)
echo 2. 01_setup_simplified_system.sql - Setup simplified system tables
echo 3. 02_setup_authentication.sql - Setup authentication system
echo 4. 03_update_rls_policies.sql - Update RLS policies for cross-user visibility
echo 5. 04_add_get_product_function.sql - Add function to fetch single product
echo 6. 05_cleanup_obsolete_tables.sql - Cleanup obsolete tables (use with caution)
echo.
echo For existing installations, run scripts 01-04 in order.
echo Only run script 05 after confirming data migration is complete.
echo.
echo Press any key to exit...
pause >nul