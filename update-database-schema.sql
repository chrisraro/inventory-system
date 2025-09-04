-- Drop the existing constraint on category
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- Add new constraint with Philippine categories
ALTER TABLE products ADD CONSTRAINT products_category_check 
CHECK (category IN (
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
));

-- Drop the existing constraint on unit_type
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_unit_type_check;

-- Add new constraint with Philippine unit types
ALTER TABLE products ADD CONSTRAINT products_unit_type_check 
CHECK (unit_type IN (
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
));
