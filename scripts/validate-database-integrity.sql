-- Comprehensive database validation and integrity check
DO $$
DECLARE
    table_count INTEGER;
    product_count INTEGER;
    invalid_products INTEGER;
BEGIN
    -- Check if required tables exist
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('products', 'inventory_logs', 'stock_movements');
    
    RAISE NOTICE 'Found % required tables', table_count;
    
    IF table_count < 3 THEN
        RAISE EXCEPTION 'Missing required tables. Expected 3, found %', table_count;
    END IF;
    
    -- Check products table structure and data integrity
    SELECT COUNT(*) INTO product_count FROM products;
    RAISE NOTICE 'Total products in database: %', product_count;
    
    -- Check for invalid product data
    SELECT COUNT(*) INTO invalid_products
    FROM products 
    WHERE product_name IS NULL 
       OR product_name = '' 
       OR unit_type IS NULL 
       OR unit_type = ''
       OR quantity IS NULL 
       OR quantity < 0
       OR price_per_unit IS NULL 
       OR price_per_unit < 0
       OR low_stock_threshold IS NULL 
       OR low_stock_threshold < 0;
    
    IF invalid_products > 0 THEN
        RAISE WARNING 'Found % products with invalid data', invalid_products;
        
        -- Show details of invalid products
        RAISE NOTICE 'Invalid products details:';
        FOR rec IN 
            SELECT id, product_name, unit_type, quantity, price_per_unit, low_stock_threshold
            FROM products 
            WHERE product_name IS NULL 
               OR product_name = '' 
               OR unit_type IS NULL 
               OR unit_type = ''
               OR quantity IS NULL 
               OR quantity < 0
               OR price_per_unit IS NULL 
               OR price_per_unit < 0
               OR low_stock_threshold IS NULL 
               OR low_stock_threshold < 0
            LIMIT 10
        LOOP
            RAISE NOTICE 'ID: %, Name: %, Unit: %, Qty: %, Price: %, Threshold: %', 
                rec.id, rec.product_name, rec.unit_type, rec.quantity, rec.price_per_unit, rec.low_stock_threshold;
        END LOOP;
    ELSE
        RAISE NOTICE 'All product data is valid';
    END IF;
    
    -- Check RLS policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'products'
    ) THEN
        RAISE NOTICE 'No RLS policies found for products table - this may cause access issues';
    END IF;
    
    RAISE NOTICE 'Database validation completed successfully';
END $$;
