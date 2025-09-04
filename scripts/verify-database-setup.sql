-- Verify database tables exist and have correct structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('products', 'inventory_logs')
ORDER BY table_name, ordinal_position;

-- Check if products table has data
SELECT COUNT(*) as product_count FROM products;

-- Check if inventory_logs table exists
SELECT COUNT(*) as log_count FROM inventory_logs;

-- Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('products', 'inventory_logs');
