-- RECOVERY SCRIPT: Restore products_new table
-- Run this FIRST to restore your web app functionality
-- After this works, we'll do systematic migration to products_simplified

-- 1. Recreate the products_new table with original schema
CREATE TABLE IF NOT EXISTS products_new (
  id TEXT PRIMARY KEY,                    -- Will store LPG-xxxxx format
  qr_code TEXT UNIQUE NOT NULL,          -- Raw QR code data (like 05285AWI1ES04)
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  weight_kg DECIMAL(10,2) NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'cylinder',
  category TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_threshold INTEGER NOT NULL DEFAULT 0,
  max_threshold INTEGER NOT NULL DEFAULT 100,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier_id UUID REFERENCES suppliers(id),
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_new_qr_code ON products_new(qr_code);
CREATE INDEX IF NOT EXISTS idx_products_new_category ON products_new(category);
CREATE INDEX IF NOT EXISTS idx_products_new_user_id ON products_new(user_id);
CREATE INDEX IF NOT EXISTS idx_products_new_weight ON products_new(weight_kg);
CREATE INDEX IF NOT EXISTS idx_products_new_brand ON products_new(brand);

-- 3. Enable Row Level Security
ALTER TABLE products_new ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for products_new
DROP POLICY IF EXISTS "Users can view their own products" ON products_new;
DROP POLICY IF EXISTS "Users can insert their own products" ON products_new;
DROP POLICY IF EXISTS "Users can update their own products" ON products_new;
DROP POLICY IF EXISTS "Users can delete their own products" ON products_new;

CREATE POLICY "Users can view their own products" ON products_new
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON products_new
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON products_new
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON products_new
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Ensure stock_movements table has the foreign key column
-- (This might already exist, but we'll make sure)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
        AND column_name = 'product_qr_id'
    ) THEN
        ALTER TABLE stock_movements 
        ADD COLUMN product_qr_id TEXT REFERENCES products_new(id);
    END IF;
END $$;

-- 6. Create helper functions for QR code handling
CREATE OR REPLACE FUNCTION generate_lpg_id(qr_data TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove any existing LPG- prefix and add it back
  RETURN 'LPG-' || REPLACE(UPPER(qr_data), 'LPG-', '');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION extract_qr_code(lpg_id TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove LPG- prefix to get raw QR code
  RETURN REPLACE(lpg_id, 'LPG-', '');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_qr_exists(qr_data TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM products_new 
    WHERE qr_code = qr_data OR id = generate_lpg_id(qr_data)
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Create function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_products_new_updated_at ON products_new;
CREATE TRIGGER update_products_new_updated_at 
    BEFORE UPDATE ON products_new 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Create function to update product stock automatically for products_new
CREATE OR REPLACE FUNCTION update_product_new_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process movements that have product_qr_id set
    IF NEW.product_qr_id IS NOT NULL THEN
        IF NEW.movement_type = 'incoming' THEN
            UPDATE products_new 
            SET current_stock = current_stock + NEW.quantity,
                updated_at = NOW()
            WHERE id = NEW.product_qr_id;
        ELSIF NEW.movement_type = 'outgoing' THEN
            UPDATE products_new 
            SET current_stock = GREATEST(0, current_stock - NEW.quantity),
                updated_at = NOW()
            WHERE id = NEW.product_qr_id;
        ELSIF NEW.movement_type = 'adjustment' THEN
            UPDATE products_new 
            SET current_stock = NEW.quantity,
                updated_at = NOW()
            WHERE id = NEW.product_qr_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for automatic stock updates
DROP TRIGGER IF EXISTS trigger_update_product_new_stock ON stock_movements;
CREATE TRIGGER trigger_update_product_new_stock
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_product_new_stock();

-- 11. Grant necessary permissions
GRANT ALL ON products_new TO authenticated;
GRANT ALL ON products_new TO service_role;

-- 12. Insert some sample data for testing (optional)
-- Uncomment this if you want some test data
/*
INSERT INTO products_new (id, qr_code, name, brand, weight_kg, category, current_stock, unit_cost, user_id)
VALUES 
  ('LPG-TEST001', 'TEST001', '11kg LPG Cylinder', 'Petrogreen', 11.00, 'LPG', 1, 850.00, auth.uid()),
  ('LPG-TEST002', 'TEST002', '22kg LPG Cylinder', 'Petrogreen', 22.00, 'LPG', 1, 1200.00, auth.uid()),
  ('LPG-TEST003', 'TEST003', '50kg LPG Cylinder', 'Petrogreen', 50.00, 'LPG', 1, 2500.00, auth.uid())
ON CONFLICT (id) DO NOTHING;
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'products_new table has been successfully restored!';
    RAISE NOTICE 'Your web app should now work with the original functionality.';
    RAISE NOTICE 'Next step: Run systematic migration to products_simplified when ready.';
END $$;