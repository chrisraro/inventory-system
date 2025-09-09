-- Complete RLS Fix for Admin and Stockman Access
-- This script ensures proper Row Level Security policies for the simplified system

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own cylinders or admins can view all" ON products_simplified;
DROP POLICY IF EXISTS "Users can insert their own cylinders" ON products_simplified;
DROP POLICY IF EXISTS "Users can update their own cylinders" ON products_simplified;
DROP POLICY IF EXISTS "Users can delete their own cylinders" ON products_simplified;

DROP POLICY IF EXISTS "Users can view their own movements or admins can view all" ON stock_movements_simplified;
DROP POLICY IF EXISTS "Users can insert their own movements" ON stock_movements_simplified;
DROP POLICY IF EXISTS "Users can update their own movements" ON stock_movements_simplified;

-- Create updated RLS policies for products_simplified
-- Users can view their own cylinders or admins can view all
CREATE POLICY "Users can view their own cylinders or admins can view all" ON products_simplified
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert their own cylinders
CREATE POLICY "Users can insert their own cylinders" ON products_simplified
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own cylinders
CREATE POLICY "Users can update their own cylinders" ON products_simplified
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own cylinders
CREATE POLICY "Users can delete their own cylinders" ON products_simplified
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated RLS policies for stock_movements_simplified
-- Users can view their own movements or admins can view all
CREATE POLICY "Users can view their own movements or admins can view all" ON stock_movements_simplified
  FOR SELECT USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert their own movements
CREATE POLICY "Users can insert their own movements" ON stock_movements_simplified
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own movements
CREATE POLICY "Users can update their own movements" ON stock_movements_simplified
  FOR UPDATE USING (auth.uid() = created_by);

-- Refresh the schema
ALTER TABLE products_simplified ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements_simplified ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('products_simplified', 'stock_movements_simplified')
ORDER BY tablename, policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies updated successfully!';
    RAISE NOTICE 'Admins can now see all data, regular users see only their own data';
END $$;