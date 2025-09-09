-- Complete Setup Script
-- This script combines the most important setup steps for the LPG Inventory System

-- 1. Setup simplified system tables
-- (This is a simplified version of 01_setup_simplified_system.sql)

-- Create simplified products table (individual cylinders)
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

-- Create simplified stock movements table (status changes)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_simplified_qr_code ON products_simplified(qr_code);
CREATE INDEX IF NOT EXISTS idx_products_simplified_status ON products_simplified(status);
CREATE INDEX IF NOT EXISTS idx_products_simplified_weight ON products_simplified(weight_kg);
CREATE INDEX IF NOT EXISTS idx_products_simplified_user_id ON products_simplified(user_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_simplified_product_id ON stock_movements_simplified(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_simplified_date ON stock_movements_simplified(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_simplified_user ON stock_movements_simplified(created_by);

-- Enable Row Level Security
ALTER TABLE products_simplified ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements_simplified ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products_simplified (admin can see all)
CREATE POLICY "Users can view their own cylinders or admins can view all" ON products_simplified
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own cylinders" ON products_simplified
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cylinders" ON products_simplified
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cylinders" ON products_simplified
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for stock_movements_simplified (admin can see all)
CREATE POLICY "Users can view their own movements or admins can view all" ON stock_movements_simplified
  FOR SELECT USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own movements" ON stock_movements_simplified
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own movements" ON stock_movements_simplified
  FOR UPDATE USING (auth.uid() = created_by);

-- 2. Setup authentication system (simplified version)
-- Make sure user_profiles table exists
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'stockman')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert if user doesn't already exist
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'stockman')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create helper functions
-- Function to get a single product by ID with user access control
CREATE OR REPLACE FUNCTION get_product_by_id(product_id TEXT, user_uuid UUID)
RETURNS TABLE(
    id TEXT,
    qr_code TEXT,
    weight_kg DECIMAL(5,2),
    unit_cost DECIMAL(10,2),
    supplier TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.qr_code,
        p.weight_kg,
        p.unit_cost,
        p.supplier,
        p.status,
        p.created_at,
        p.updated_at,
        p.user_id
    FROM products_simplified p
    WHERE p.id = product_id
    AND (
        p.user_id = user_uuid OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = user_uuid AND role = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_product_by_id(TEXT, UUID) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Complete setup completed successfully!';
    RAISE NOTICE 'Tables created: products_simplified, stock_movements_simplified, user_profiles';
    RAISE NOTICE 'Functions created: get_product_by_id, handle_new_user';
    RAISE NOTICE 'RLS policies updated for cross-user visibility';
END $$;