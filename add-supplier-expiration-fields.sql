-- Add supplier and expiration_date columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS supplier VARCHAR(255),
ADD COLUMN IF NOT EXISTS expiration_date DATE;

-- Add new columns to inventory_logs table for better tracking
ALTER TABLE inventory_logs 
ADD COLUMN IF NOT EXISTS movement_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS supplier VARCHAR(255),
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS expiration_date DATE,
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- Create stock_movements table for detailed tracking
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('incoming', 'outgoing', 'adjustment', 'expired', 'damaged')),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    total_value DECIMAL(10,2),
    supplier VARCHAR(255),
    batch_number VARCHAR(100),
    expiration_date DATE,
    reason TEXT NOT NULL,
    notes TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for stock_movements
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stock_movements
CREATE POLICY "Enable read access for all users" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON stock_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON stock_movements FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON stock_movements FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_products_expiration_date ON products(expiration_date);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier);
