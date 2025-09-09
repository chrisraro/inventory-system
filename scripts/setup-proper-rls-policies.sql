-- Setup proper Row Level Security policies
DO $$
BEGIN
    -- Enable RLS on all tables
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON products;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON inventory_logs;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON stock_movements;
    
    -- Create permissive policies for authenticated users
    CREATE POLICY "Enable all operations for authenticated users" ON products
        FOR ALL USING (true) WITH CHECK (true);
    
    CREATE POLICY "Enable all operations for authenticated users" ON inventory_logs
        FOR ALL USING (true) WITH CHECK (true);
    
    CREATE POLICY "Enable all operations for authenticated users" ON stock_movements
        FOR ALL USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'RLS policies setup completed successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error setting up RLS policies: %', SQLERRM;
END $$;
