-- First, let's see what constraints exist
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'products' 
    AND tc.constraint_type = 'CHECK';
