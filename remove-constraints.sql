-- Remove all check constraints from products table
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_unit_type_check;

-- Verify constraints are removed
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'products'::regclass 
AND contype = 'c';
