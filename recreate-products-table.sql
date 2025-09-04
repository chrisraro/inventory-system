-- First, backup the existing data
CREATE TEMP TABLE products_backup AS SELECT * FROM products;

-- Drop the existing table (this will remove all constraints)
DROP TABLE IF EXISTS products CASCADE;

-- Recreate the products table with new constraints
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'Milk & Yogurt',
        'Coffee',
        'Herb Tea', 
        'Puree',
        'Syrup',
        'Powder & Cream',
        'Sauce',
        'Cups & Straws',
        'Cakes',
        'Cookies',
        'Bars'
    )),
    unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN (
        'Case',
        'Can',
        'Liter', 
        'Cup',
        'Pack',
        'Kg',
        'Jar',
        'Box',
        'Bottle',
        'Gallon',
        'Slice',
        'Piece'
    )),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
    low_stock_threshold DECIMAL(10,2) NOT NULL DEFAULT 5,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON products FOR DELETE USING (true);

-- Restore the data
INSERT INTO products SELECT * FROM products_backup;

-- Drop the temp table
DROP TABLE products_backup;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;
