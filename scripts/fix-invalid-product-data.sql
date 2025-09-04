-- Fix invalid product data
DO $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    -- Fix null or empty product names
    UPDATE products 
    SET product_name = 'Unnamed Product ' || id
    WHERE product_name IS NULL OR product_name = '';
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % products with invalid names', fixed_count;
    
    -- Fix null or empty unit types
    UPDATE products 
    SET unit_type = 'Pieces'
    WHERE unit_type IS NULL OR unit_type = '';
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % products with invalid unit types', fixed_count;
    
    -- Fix negative quantities
    UPDATE products 
    SET quantity = 0
    WHERE quantity IS NULL OR quantity < 0;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % products with invalid quantities', fixed_count;
    
    -- Fix negative prices
    UPDATE products 
    SET price_per_unit = 0
    WHERE price_per_unit IS NULL OR price_per_unit < 0;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % products with invalid prices', fixed_count;
    
    -- Fix negative thresholds
    UPDATE products 
    SET low_stock_threshold = 5
    WHERE low_stock_threshold IS NULL OR low_stock_threshold < 0;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % products with invalid thresholds', fixed_count;
    
    RAISE NOTICE 'Product data cleanup completed';
END $$;
