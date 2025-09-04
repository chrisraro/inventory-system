-- Remove the category column from products table
ALTER TABLE products DROP COLUMN IF EXISTS category;

-- Verify the column is removed
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;
