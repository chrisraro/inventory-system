-- SYSTEMATIC MIGRATION PLAN: products_new → products_simplified
-- Run this AFTER products_new table recovery is complete and tested

-- PHASE 1: Data Migration with Backup
-- =====================================

-- 1. Create backup of existing data (if any exists in products_new)
CREATE TABLE IF NOT EXISTS products_new_backup AS 
SELECT * FROM products_new;

CREATE TABLE IF NOT EXISTS stock_movements_backup AS
SELECT * FROM stock_movements WHERE product_qr_id IS NOT NULL;

-- PHASE 2: Create New Simplified Schema
-- =====================================

-- 2. Create products_simplified table (if not exists)
CREATE TABLE IF NOT EXISTS products_simplified (
  id TEXT PRIMARY KEY,                    -- LPG-{QR_CODE} format
  qr_code TEXT UNIQUE NOT NULL,          -- Raw QR code
  weight_kg DECIMAL(5,2) NOT NULL,       -- Cylinder weight
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,                         -- Optional supplier
  status TEXT NOT NULL DEFAULT 'available', -- available, sold, maintenance, damaged, missing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- 3. Create stock_movements_simplified table
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

-- PHASE 3: Data Migration
-- =======================

-- 4. Migrate data from products_new to products_simplified
INSERT INTO products_simplified (
  id, 
  qr_code, 
  weight_kg, 
  unit_cost, 
  supplier, 
  status, 
  created_at, 
  updated_at, 
  user_id
)
SELECT 
  id,
  qr_code,
  weight_kg,
  unit_cost,
  CASE 
    WHEN supplier_id IS NOT NULL THEN 'Legacy Supplier'
    ELSE NULL 
  END as supplier,
  CASE 
    WHEN current_stock > 0 THEN 'available'
    ELSE 'sold'
  END as status,
  created_at,
  updated_at,
  user_id
FROM products_new
ON CONFLICT (id) DO UPDATE SET
  weight_kg = EXCLUDED.weight_kg,
  unit_cost = EXCLUDED.unit_cost,
  supplier = EXCLUDED.supplier,
  updated_at = NOW();

-- 5. Create initial stock movements for migrated products
INSERT INTO stock_movements_simplified (
  product_id,
  from_status,
  to_status,
  movement_type,
  reason,
  notes,
  created_by
)
SELECT 
  p.id,
  'new',
  CASE 
    WHEN p.current_stock > 0 THEN 'available'
    ELSE 'sold'
  END,
  'migration',
  'Migrated from products_new table',
  CONCAT('Original stock: ', p.current_stock, ', Brand: ', p.brand, ', Category: ', p.category),
  p.user_id
FROM products_new p
WHERE NOT EXISTS (
  SELECT 1 FROM stock_movements_simplified sm 
  WHERE sm.product_id = p.id
);

-- PHASE 4: Setup Simplified Schema Infrastructure
-- ===============================================

-- 6. Create indexes for products_simplified
CREATE INDEX IF NOT EXISTS idx_products_simplified_qr_code ON products_simplified(qr_code);
CREATE INDEX IF NOT EXISTS idx_products_simplified_status ON products_simplified(status);
CREATE INDEX IF NOT EXISTS idx_products_simplified_weight ON products_simplified(weight_kg);
CREATE INDEX IF NOT EXISTS idx_products_simplified_user_id ON products_simplified(user_id);

-- 7. Create indexes for stock_movements_simplified
CREATE INDEX IF NOT EXISTS idx_stock_movements_simplified_product_id ON stock_movements_simplified(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_simplified_date ON stock_movements_simplified(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_simplified_user ON stock_movements_simplified(created_by);

-- 8. Enable Row Level Security
ALTER TABLE products_simplified ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements_simplified ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for products_simplified
DROP POLICY IF EXISTS "Users can view their own cylinders" ON products_simplified;
DROP POLICY IF EXISTS "Users can insert their own cylinders" ON products_simplified;
DROP POLICY IF EXISTS "Users can update their own cylinders" ON products_simplified;
DROP POLICY IF EXISTS "Users can delete their own cylinders" ON products_simplified;

CREATE POLICY "Users can view their own cylinders" ON products_simplified
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cylinders" ON products_simplified
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cylinders" ON products_simplified
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cylinders" ON products_simplified
  FOR DELETE USING (auth.uid() = user_id);

-- 10. Create RLS policies for stock_movements_simplified
DROP POLICY IF EXISTS "Users can view their own movements" ON stock_movements_simplified;
DROP POLICY IF EXISTS "Users can insert their own movements" ON stock_movements_simplified;
DROP POLICY IF EXISTS "Users can update their own movements" ON stock_movements_simplified;

CREATE POLICY "Users can view their own movements" ON stock_movements_simplified
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own movements" ON stock_movements_simplified
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own movements" ON stock_movements_simplified
  FOR UPDATE USING (auth.uid() = created_by);

-- 11. Create automatic status update function
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

-- 12. Create trigger for automatic status updates
DROP TRIGGER IF EXISTS trigger_update_product_status ON stock_movements_simplified;
CREATE TRIGGER trigger_update_product_status
    AFTER INSERT ON stock_movements_simplified
    FOR EACH ROW
    EXECUTE FUNCTION update_product_status_on_movement();

-- 13. Create updated_at trigger for products_simplified
DROP TRIGGER IF EXISTS update_products_simplified_updated_at ON products_simplified;
CREATE TRIGGER update_products_simplified_updated_at 
    BEFORE UPDATE ON products_simplified 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 14. Create helper functions for simplified system
CREATE OR REPLACE FUNCTION generate_cylinder_id(qr_data TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove any existing LPG- prefix and add it back
  RETURN 'LPG-' || REPLACE(UPPER(qr_data), 'LPG-', '');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION extract_qr_code_simplified(cylinder_id TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove LPG- prefix to get raw QR code
  RETURN REPLACE(cylinder_id, 'LPG-', '');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_cylinder_exists(qr_data TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM products_simplified 
    WHERE qr_code = qr_data OR id = generate_cylinder_id(qr_data)
  );
END;
$$ LANGUAGE plpgsql;

-- 15. Grant permissions
GRANT ALL ON products_simplified TO authenticated;
GRANT ALL ON products_simplified TO service_role;
GRANT ALL ON stock_movements_simplified TO authenticated;
GRANT ALL ON stock_movements_simplified TO service_role;

-- PHASE 5: Verification Queries
-- =============================

-- 16. Verification: Check migration results
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
    movement_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM products_new;
    SELECT COUNT(*) INTO new_count FROM products_simplified;
    SELECT COUNT(*) INTO movement_count FROM stock_movements_simplified;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '- Products in products_new: %', old_count;
    RAISE NOTICE '- Products migrated to products_simplified: %', new_count;
    RAISE NOTICE '- Initial movements created: %', movement_count;
    
    IF new_count >= old_count THEN
        RAISE NOTICE '✅ Migration appears successful!';
        RAISE NOTICE 'Next step: Update API endpoints to use products_simplified';
    ELSE
        RAISE NOTICE '⚠️ Migration may have issues. Please review.';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎯 SYSTEMATIC MIGRATION COMPLETED!';
    RAISE NOTICE 'Your data has been migrated from products_new to products_simplified';
    RAISE NOTICE 'Both old and new tables exist - you can now test the simplified system';
    RAISE NOTICE 'Backup tables: products_new_backup, stock_movements_backup';
END $$;