-- Drop all existing check constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_unit_type_check;

-- Verify the constraints are removed by checking current constraints
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'products'::regclass 
AND contype = 'c';
