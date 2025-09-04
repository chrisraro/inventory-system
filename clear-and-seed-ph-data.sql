-- Clear existing data
DELETE FROM inventory_logs;
DELETE FROM products;

-- Insert new Philippine inventory data
INSERT INTO products (product_name, category, unit_type, quantity, price_per_unit, low_stock_threshold, remarks) VALUES
-- MILK & YOGURT
('Arla Milk', 'Milk & Yogurt', 'Case', 29, 450.00, 5, 'Case - 10pcs'),
('Condensed Milk', 'Milk & Yogurt', 'Can', 15, 35.00, 3, ''),
('Evap Milk', 'Milk & Yogurt', 'Can', 20, 25.00, 5, ''),
('Oat Side', 'Milk & Yogurt', 'Liter', 8, 120.00, 3, 'Exp: 3 May 25'),
('Yogurt', 'Milk & Yogurt', 'Cup', 12, 45.00, 5, ''),

-- COFFEE
('Brown Sugar Sachet', 'Coffee', 'Pack', 9, 85.00, 3, '100PCS'),
('Creamer', 'Coffee', 'Pack', 25, 65.00, 5, ''),
('Black Magic', 'Coffee', 'Kg', 6, 850.00, 2, '1KG'),
('Brazil Cerrado', 'Coffee', 'Kg', 9, 950.00, 2, '1KG'),
('Nescafe', 'Coffee', 'Jar', 18, 185.00, 5, ''),
('Rice Coffee Granule', 'Coffee', 'Pack', 12, 125.00, 3, ''),

-- HERB TEA
('Cat''s Whiskers', 'Herb Tea', 'Box', 5, 95.00, 2, 'Box - 14pcs'),
('Tsaang Gubat', 'Herb Tea', 'Box', 3, 95.00, 2, 'Box - 14pcs'),
('Banaba', 'Herb Tea', 'Box', 5, 95.00, 2, 'Box - 14pcs'),
('Roselle', 'Herb Tea', 'Kg', 0.75, 450.00, 1, '3/4 kg'),
('Holy Basil', 'Herb Tea', 'Kg', 1, 380.00, 1, ''),
('Blue Ternate', 'Herb Tea', 'Kg', 1, 420.00, 1, ''),
('Peppermint', 'Herb Tea', 'Kg', 0.5, 650.00, 1, '1/2 kg'),

-- PUREE
('Blueberry Puree', 'Puree', 'Bottle', 8, 285.00, 3, ''),
('Kiwi Pure', 'Puree', 'Bottle', 6, 295.00, 3, ''),
('Strawberry Puree', 'Puree', 'Bottle', 10, 275.00, 3, ''),

-- SYRUP
('Caramel Syrup', 'Syrup', 'Liter', 3, 185.00, 2, '1L'),
('Food Color Red', 'Syrup', 'Bottle', 5, 45.00, 2, ''),
('Green Apple Syrup', 'Syrup', 'Gallon', 1, 750.00, 1, 'Exp: 23 Jun 25'),
('Hazelnut Syrup', 'Syrup', 'Liter', 4, 195.00, 2, ''),
('Lemon Syrup', 'Syrup', 'Liter', 3, 175.00, 2, ''),
('Passionfruit Syrup', 'Syrup', 'Liter', 2, 225.00, 2, ''),
('Peach Syrup', 'Syrup', 'Liter', 3, 185.00, 2, '1L'),
('Popcorn Syrup', 'Syrup', 'Liter', 3, 195.00, 2, '1L'),
('Raspberry Syrup', 'Syrup', 'Liter', 2, 205.00, 2, ''),
('Sprite', 'Syrup', 'Bottle', 15, 65.00, 5, ''),
('Strawberry Syrup', 'Syrup', 'Liter', 4, 185.00, 2, ''),
('Rose Syrup', 'Syrup', 'Liter', 2, 215.00, 2, ''),
('Salted Caramel Syrup', 'Syrup', 'Liter', 3, 225.00, 2, ''),
('Sugar Syrup', 'Syrup', 'Liter', 8, 85.00, 3, ''),
('Vanilla Syrup', 'Syrup', 'Liter', 4, 185.00, 2, '1L'),
('Pandan Syrup', 'Syrup', 'Liter', 3, 165.00, 2, ''),
('Gourmet Syrup', 'Syrup', 'Liter', 2, 0.00, 1, 'free*'),

-- POWDER & CREAM
('Chocolate Powder', 'Powder & Cream', 'Kg', 6, 285.00, 2, ''),
('Frappe Powder', 'Powder & Cream', 'Kg', 8, 325.00, 2, 'Exp: 2 Oct 25'),
('Matcha Powder', 'Powder & Cream', 'Kg', 11, 485.00, 2, 'Exp: 7 Mar 25'),
('Whipped Cream', 'Powder & Cream', 'Liter', 13, 165.00, 3, '1L'),
('Tabla', 'Powder & Cream', 'Pack', 8, 125.00, 3, ''),
('Oreo', 'Powder & Cream', 'Pack', 4, 85.00, 2, ''),

-- SAUCE
('Caramel Sauce', 'Sauce', 'Bottle', 6, 145.00, 2, ''),
('Chocolate Sauce', 'Sauce', 'Gallon', 1, 485.00, 1, 'Exp: 14/6/25'),

-- CUPS & STRAWS
('Cold Cups', 'Cups & Straws', 'Pack', 7, 125.00, 3, '50PCS'),
('Disposable Cup', 'Cups & Straws', 'Pack', 12, 95.00, 5, '50PCS'),
('Disposable Fork', 'Cups & Straws', 'Pack', 200, 2.50, 50, ''),
('Dome Lid', 'Cups & Straws', 'Pack', 300, 3.25, 50, 'pcs'),
('Double Plastic', 'Cups & Straws', 'Pack', 15, 85.00, 5, ''),
('Flat Lid', 'Cups & Straws', 'Pack', 350, 2.85, 50, 'pcs'),
('Hot Cups', 'Cups & Straws', 'Pack', 500, 2.15, 100, 'pcs'),
('Lid for Hot Cups', 'Cups & Straws', 'Pack', 500, 1.95, 100, 'pcs'),
('Paper Bag (Big)', 'Cups & Straws', 'Pack', 2, 165.00, 2, 'pck - 50pcs'),
('Paper Bag (Small)', 'Cups & Straws', 'Pack', 8, 95.00, 3, ''),
('Paper Straw', 'Cups & Straws', 'Pack', 25, 45.00, 10, ''),
('Sauce Cup', 'Cups & Straws', 'Pack', 18, 65.00, 5, ''),
('Single Plastic', 'Cups & Straws', 'Pack', 22, 75.00, 5, ''),
('Stirrer', 'Cups & Straws', 'Pack', 35, 25.00, 10, ''),
('Take Out Box Small', 'Cups & Straws', 'Pack', 2, 185.00, 2, 'pck - 25pcs'),
('Take Out Box Big', 'Cups & Straws', 'Pack', 5, 225.00, 2, 'pck - 25pcs'),
('Tissue', 'Cups & Straws', 'Pack', 27, 35.00, 10, 'pck'),

-- CAKES
('Carrot Cake', 'Cakes', 'Slice', 8, 125.00, 3, ''),
('Cheesecake', 'Cakes', 'Slice', 6, 145.00, 3, ''),
('Choco Moist Cake', 'Cakes', 'Slice', 10, 115.00, 3, ''),
('Red Velvet Cake', 'Cakes', 'Slice', 7, 135.00, 3, ''),
('Tiramisu Cake', 'Cakes', 'Slice', 5, 155.00, 3, ''),
('Ube Cake', 'Cakes', 'Slice', 9, 125.00, 3, ''),

-- COOKIES
('Chocolate Chip Cookie', 'Cookies', 'Piece', 24, 45.00, 10, ''),
('Mallow Crunch Cookie', 'Cookies', 'Piece', 18, 55.00, 10, ''),
('Oatmeal Raisin Cookie', 'Cookies', 'Piece', 15, 50.00, 10, ''),
('Red Velvet Cookie', 'Cookies', 'Piece', 12, 65.00, 10, ''),
('Rocky Road Cookie', 'Cookies', 'Piece', 20, 60.00, 10, ''),

-- BARS
('Slutty Brownies', 'Bars', 'Piece', 14, 85.00, 5, ''),
('Revel Bars', 'Bars', 'Piece', 16, 75.00, 5, '');

-- Insert initial inventory logs for all products
INSERT INTO inventory_logs (product_id, action, quantity_change, old_quantity, new_quantity, value_change, remarks)
SELECT 
    id,
    'added',
    quantity,
    0,
    quantity,
    quantity * price_per_unit,
    'Initial Philippine inventory setup'
FROM products;
