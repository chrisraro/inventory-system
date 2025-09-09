-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  unit_type VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 0,
  price_per_unit DECIMAL(10,2) DEFAULT 0,
  low_stock_threshold DECIMAL(10,2) DEFAULT 5,
  supplier VARCHAR(255),
  expiration_date DATE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  quantity_change DECIMAL(10,2) DEFAULT 0,
  old_quantity DECIMAL(10,2) DEFAULT 0,
  new_quantity DECIMAL(10,2) DEFAULT 0,
  value_change DECIMAL(10,2) DEFAULT 0,
  movement_type VARCHAR(50),
  supplier VARCHAR(255),
  batch_number VARCHAR(100),
  expiration_date DATE,
  reason VARCHAR(255),
  remarks TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);

-- Insert sample data if tables are empty
INSERT INTO products (product_name, unit_type, quantity, price_per_unit, low_stock_threshold)
SELECT 'Sample Product', 'pieces', 10, 5.00, 5
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
