-- This SQL script adds a function to fetch a single product by ID
-- This complements the API endpoint we'll create in the Next.js application

-- Create a function to get a single product by ID with user access control
CREATE OR REPLACE FUNCTION get_product_by_id(product_id TEXT, user_uuid UUID)
RETURNS TABLE(
    id TEXT,
    qr_code TEXT,
    weight_kg DECIMAL(5,2),
    unit_cost DECIMAL(10,2),
    supplier TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.qr_code,
        p.weight_kg,
        p.unit_cost,
        p.supplier,
        p.status,
        p.created_at,
        p.updated_at,
        p.user_id
    FROM products_simplified p
    WHERE p.id = product_id
    AND (
        p.user_id = user_uuid OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = user_uuid AND role = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_product_by_id(TEXT, UUID) TO authenticated;

-- Test the function (uncomment to test)
-- SELECT * FROM get_product_by_id('LPG-TEST001', 'USER_UUID_HERE');