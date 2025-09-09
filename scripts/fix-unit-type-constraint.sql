-- Check current unit type constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'products'::regclass 
AND contype = 'c' 
AND conname LIKE '%unit_type%';

-- Drop existing constraint if it exists
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_unit_type_check;

-- Add updated constraint that matches our unit types
ALTER TABLE products ADD CONSTRAINT products_unit_type_check 
CHECK (unit_type IN (
  'Case', 'Can', 'Liter', 'Cup', 'Pack', 'Kg', 'Jar', 'Box', 
  'Bottle', 'Gallon', 'Slice', 'Piece', 'Others'
) OR (unit_type IS NOT NULL AND length(trim(unit_type)) > 0 AND length(trim(unit_type)) <= 50));

-- Update any existing products with invalid unit types
UPDATE products 
SET unit_type = 'Others' 
WHERE unit_type NOT IN (
  'Case', 'Can', 'Liter', 'Cup', 'Pack', 'Kg', 'Jar', 'Box', 
  'Bottle', 'Gallon', 'Slice', 'Piece', 'Others'
) AND unit_type IS NOT NULL;
