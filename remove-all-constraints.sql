-- Drop all check constraints on the products table
DO $$ 
DECLARE 
    constraint_name text;
BEGIN
    -- Get all check constraint names for the products table
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'products'::regclass 
        AND contype = 'c'
    LOOP
        -- Drop each constraint
        EXECUTE 'ALTER TABLE products DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END LOOP;
END $$;

-- Verify no check constraints remain
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'products'::regclass 
AND contype = 'c';
