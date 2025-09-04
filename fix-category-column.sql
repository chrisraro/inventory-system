-- Remove the category column completely
ALTER TABLE products DROP COLUMN IF EXISTS category CASCADE;

-- Verify the table structure
\d products;
