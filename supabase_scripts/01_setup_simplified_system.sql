-- Simplified QR-Based Cylinder Management System
-- Run this on Supabase SQL Editor

-- 1. Create simplified products table (individual cylinders)
CREATE TABLE IF NOT EXISTS products_simplified (
  id TEXT PRIMARY KEY,                    -- Raw QR code format
  qr_code TEXT UNIQUE NOT NULL,          -- Raw QR code (duplicate of id for clarity)
  weight_kg DECIMAL(5,2) NOT NULL,       -- Cylinder weight
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,                         -- Optional supplier
  status TEXT NOT NULL DEFAULT 'available', -- available, sold, maintenance, damaged, missing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- 2. Create simplified stock movements table (status changes)
CREATE TABLE IF NOT EXISTS stock_movements_simplified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES products_simplified(id) NOT NULL,
  from_status TEXT NOT NULL,             -- Previous status
  to_status TEXT NOT NULL,               -- New status
  movement_type TEXT NOT NULL,           -- status_change, sale, purchase, maintenance, damage, found, lost
  reason TEXT,                           -- Why the movement happened
  notes TEXT,                           -- Additional notes
  reference_number TEXT,                -- Invoice, receipt, or reference
  movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_simplified_qr_code ON products_simplified(qr_code);
CREATE INDEX IF NOT EXISTS idx_products_simplified_status ON products_simplified(status);
CREATE INDEX IF NOT EXISTS idx_products_simplified_weight ON products_simplified(weight_kg);
CREATE INDEX IF NOT EXISTS idx_products_simplified_user_id ON products_simplified(user_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_simplified_product_id ON stock_movements_simplified(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_simplified_date ON stock_movements_simplified(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_simplified_user ON stock_movements_simplified(created_by);

-- 4. Enable Row Level Security
ALTER TABLE products_simplified ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements_simplified ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for products_simplified
CREATE POLICY "Users can view their own cylinders" ON products_simplified
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cylinders" ON products_simplified
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cylinders" ON products_simplified
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cylinders" ON products_simplified
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS policies for stock_movements_simplified
CREATE POLICY "Users can view their own movements" ON stock_movements_simplified
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own movements" ON stock_movements_simplified
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own movements" ON stock_movements_simplified
  FOR UPDATE USING (auth.uid() = created_by);

-- 7. Create function to automatically update product status when movement is recorded
CREATE OR REPLACE FUNCTION update_product_status_on_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product status to match the movement's to_status
    UPDATE products_simplified 
    SET 
        status = NEW.to_status,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically update product status
DROP TRIGGER IF EXISTS trigger_update_product_status ON stock_movements_simplified;
CREATE TRIGGER trigger_update_product_status
    AFTER INSERT ON stock_movements_simplified
    FOR EACH ROW
    EXECUTE FUNCTION update_product_status_on_movement();

-- 9. Create function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for updated_at
CREATE TRIGGER update_products_simplified_updated_at 
    BEFORE UPDATE ON products_simplified 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Helper functions for QR code handling
CREATE OR REPLACE FUNCTION generate_cylinder_id(qr_data TEXT)
RETURNS TEXT AS $$
BEGIN
  -- For simplified system, use raw QR code directly
  RETURN qr_data;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION extract_qr_code(cylinder_id TEXT)
RETURNS TEXT AS $$
BEGIN
  -- For simplified system, cylinder ID is already the raw QR code
  RETURN cylinder_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_cylinder_exists(qr_data TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM products_simplified 
    WHERE qr_code = qr_data OR id = qr_data
  );
END;
$$ LANGUAGE plpgsql;

-- 12. Create view for cylinder statistics by weight
CREATE OR REPLACE VIEW cylinder_stats_by_weight AS
SELECT 
    weight_kg,
    status,
    COUNT(*) as count,
    ROUND(AVG(unit_cost), 2) as avg_cost
FROM products_simplified 
GROUP BY weight_kg, status
ORDER BY weight_kg, status;

-- 13. Create function to get cylinder summary
CREATE OR REPLACE FUNCTION get_cylinder_summary(user_uuid UUID)
RETURNS TABLE(
    weight_kg DECIMAL(5,2),
    available_count BIGINT,
    sold_count BIGINT,
    maintenance_count BIGINT,
    damaged_count BIGINT,
    missing_count BIGINT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.weight_kg,
        SUM(CASE WHEN p.status = 'available' THEN 1 ELSE 0 END) as available_count,
        SUM(CASE WHEN p.status = 'sold' THEN 1 ELSE 0 END) as sold_count,
        SUM(CASE WHEN p.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count,
        SUM(CASE WHEN p.status = 'damaged' THEN 1 ELSE 0 END) as damaged_count,
        SUM(CASE WHEN p.status = 'missing' THEN 1 ELSE 0 END) as missing_count,
        COUNT(*) as total_count
    FROM products_simplified p
    WHERE p.user_id = user_uuid
    GROUP BY p.weight_kg
    ORDER BY p.weight_kg;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Simplified QR-based cylinder management system created successfully!';
    RAISE NOTICE 'Tables created: products_simplified, stock_movements_simplified';
    RAISE NOTICE 'Helper functions and triggers are in place';
    RAISE NOTICE 'Ready to use - each QR code = 1 unique cylinder (raw QR code format)';
END $$;