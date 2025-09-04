-- Enable RLS on tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON products
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON inventory_logs
  FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;
GRANT ALL ON inventory_logs TO authenticated;
GRANT ALL ON products TO anon;
GRANT ALL ON inventory_logs TO anon;

-- Ensure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
