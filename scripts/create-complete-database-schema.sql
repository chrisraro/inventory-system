-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Create suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table (LPG-specific)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'LPG Cylinder',
    brand VARCHAR(100) NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    unit_type VARCHAR(20) NOT NULL DEFAULT 'kg',
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_threshold INTEGER NOT NULL DEFAULT 5,
    max_threshold INTEGER NOT NULL DEFAULT 100,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    supplier_id UUID REFERENCES suppliers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_weight CHECK (weight_kg > 0),
    CONSTRAINT valid_stock CHECK (current_stock >= 0),
    CONSTRAINT valid_thresholds CHECK (min_threshold >= 0 AND max_threshold >= min_threshold),
    CONSTRAINT valid_prices CHECK (unit_cost >= 0 AND selling_price >= 0)
);

-- Create stock_movements table
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reason TEXT,
    reference_number VARCHAR(100),
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_quantity CHECK (quantity != 0)
);

-- Create qr_codes table
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qr_data VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_weight ON products(weight_kg);
CREATE INDEX idx_products_stock ON products(current_stock);
CREATE INDEX idx_products_created_at ON products(created_at);

CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

CREATE INDEX idx_qr_codes_product_id ON qr_codes(product_id);
CREATE INDEX idx_qr_codes_qr_data ON qr_codes(qr_data);

-- Create function to update product stock automatically
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.movement_type = 'in' THEN
        UPDATE products 
        SET current_stock = current_stock + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    ELSIF NEW.movement_type = 'out' THEN
        UPDATE products 
        SET current_stock = current_stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    ELSIF NEW.movement_type = 'adjustment' THEN
        UPDATE products 
        SET current_stock = NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stock updates
CREATE TRIGGER trigger_update_product_stock
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES
('Petron Corporation', 'Juan Dela Cruz', '+63-2-8888-3000', 'sales@petron.com', 'Petron Megaplaza, 358 Sen. Gil Puyat Ave, Makati City'),
('Shell Philippines', 'Maria Santos', '+63-2-8789-8888', 'info@shell.com.ph', 'Shell House, 156 Valero St, Salcedo Village, Makati City'),
('Caltex Philippines', 'Roberto Garcia', '+63-2-8403-2400', 'customer@caltex.com.ph', 'Caltex House, 1340 Acacia Ave, Madrigal Business Park, Alabang'),
('Total Philippines', 'Ana Reyes', '+63-2-8845-4000', 'contact@total.com.ph', 'Total Building, Bonifacio Global City, Taguig'),
('Phoenix Petroleum', 'Carlos Mendoza', '+63-82-233-8888', 'info@phoenixpetroleum.com.ph', 'Phoenix Building, Lanang, Davao City');

-- Insert sample LPG products
INSERT INTO products (name, brand, weight_kg, unit_type, current_stock, min_threshold, max_threshold, unit_cost, selling_price, supplier_id) 
SELECT 
    'LPG Cylinder',
    s.name,
    w.weight,
    'kg',
    FLOOR(RANDOM() * 50) + 10, -- Random stock between 10-60
    w.threshold,
    w.threshold * 5, -- Max threshold is 5x min threshold
    w.cost,
    w.price,
    s.id
FROM suppliers s
CROSS JOIN (
    VALUES 
        (2.5, 5, 425, 500),
        (5.0, 8, 850, 950),
        (11.0, 10, 1650, 1800),
        (22.0, 15, 3200, 3500),
        (50.0, 20, 7500, 8200)
) AS w(weight, threshold, cost, price)
WHERE s.name IN ('Petron Corporation', 'Shell Philippines', 'Caltex Philippines');

-- Insert sample stock movements
INSERT INTO stock_movements (product_id, movement_type, quantity, unit_cost, total_cost, reason, reference_number, created_by)
SELECT 
    p.id,
    'in',
    20,
    p.unit_cost,
    p.unit_cost * 20,
    'Initial stock',
    'INIT-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(ROW_NUMBER() OVER()::TEXT, 3, '0'),
    'admin'
FROM products p;

-- Insert sample QR codes
INSERT INTO qr_codes (product_id, qr_data)
SELECT 
    p.id,
    UPPER(LEFT(p.brand, 3)) || '-' || REPLACE(p.weight_kg::TEXT, '.', '') || 'KG-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(ROW_NUMBER() OVER()::TEXT, 3, '0')
FROM products p;

-- Create useful views
CREATE VIEW low_stock_products AS
SELECT 
    p.*,
    CASE 
        WHEN p.current_stock = 0 THEN 'Out of Stock'
        WHEN p.current_stock <= p.min_threshold THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status
FROM products p
WHERE p.current_stock <= p.min_threshold
ORDER BY p.current_stock ASC;

CREATE VIEW recent_movements AS
SELECT 
    sm.*,
    p.name as product_name,
    p.brand,
    p.weight_kg
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
ORDER BY sm.created_at DESC
LIMIT 50;

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for demo - in production, implement proper user-based policies)
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations on stock_movements" ON stock_movements FOR ALL USING (true);
CREATE POLICY "Allow all operations on qr_codes" ON qr_codes FOR ALL USING (true);
CREATE POLICY "Allow all operations on suppliers" ON suppliers FOR ALL USING (true);

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (for demo mode)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Create summary statistics function
CREATE OR REPLACE FUNCTION get_inventory_summary()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_products', COUNT(*),
        'total_stock_value', COALESCE(SUM(current_stock * unit_cost), 0),
        'low_stock_count', COUNT(*) FILTER (WHERE current_stock <= min_threshold),
        'out_of_stock_count', COUNT(*) FILTER (WHERE current_stock = 0),
        'total_brands', COUNT(DISTINCT brand)
    )
    INTO result
    FROM products;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE products IS 'LPG cylinder inventory with weight-based specifications';
COMMENT ON TABLE stock_movements IS 'All stock movements including in, out, adjustments, and transfers';
COMMENT ON TABLE qr_codes IS 'QR codes for quick product identification and tracking';
COMMENT ON TABLE suppliers IS 'LPG suppliers and distributors information';
