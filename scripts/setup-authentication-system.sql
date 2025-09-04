-- Petrogreen Authentication System Setup
-- This script sets up user authentication with role-based access control

-- 1. Enable RLS on existing tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create user_profiles table to store additional user information and roles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'stockman')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert if user doesn't already exist
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'stockman')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM public.user_profiles 
        WHERE id = user_uuid AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to check user permissions
CREATE OR REPLACE FUNCTION public.has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get current user role
    user_role := public.get_user_role();
    
    -- Admin has all permissions
    IF user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Stock manager permissions
    IF user_role = 'stockman' AND permission_name IN (
        'view_dashboard',
        'add_product',
        'edit_product',
        'stock_movements',
        'view_reports'
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Row Level Security Policies

-- User profiles: Users can only see their own profile, admins can see all
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (public.get_user_role() = 'admin');

-- Products: All authenticated users can read, admin can modify
CREATE POLICY "Authenticated users can view products" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert products" ON products
    FOR INSERT WITH CHECK (public.has_permission('add_product'));

CREATE POLICY "Admin can update products" ON products
    FOR UPDATE USING (public.has_permission('edit_product'));

CREATE POLICY "Admin can delete products" ON products
    FOR DELETE USING (public.has_permission('delete_product'));

-- Stock movements: All authenticated users can read, authorized users can insert
CREATE POLICY "Authenticated users can view stock_movements" ON stock_movements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can insert stock_movements" ON stock_movements
    FOR INSERT WITH CHECK (public.has_permission('stock_movements'));

CREATE POLICY "Users can update own stock_movements" ON stock_movements
    FOR UPDATE USING (auth.uid()::text = created_by);

-- QR codes: All authenticated users can read, authorized users can modify
CREATE POLICY "Authenticated users can view qr_codes" ON qr_codes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can insert qr_codes" ON qr_codes
    FOR INSERT WITH CHECK (public.has_permission('add_product'));

CREATE POLICY "Authorized users can delete qr_codes" ON qr_codes
    FOR DELETE USING (public.has_permission('delete_product'));

-- Suppliers: All authenticated users can read, admin can modify
CREATE POLICY "Authenticated users can view suppliers" ON suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert suppliers" ON suppliers
    FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admin can update suppliers" ON suppliers
    FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admin can delete suppliers" ON suppliers
    FOR DELETE USING (public.get_user_role() = 'admin');

-- Inventory logs: All authenticated users can read, authorized users can insert
CREATE POLICY "Authenticated users can view inventory_logs" ON inventory_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can insert inventory_logs" ON inventory_logs
    FOR INSERT WITH CHECK (public.has_permission('stock_movements'));

-- 9. Update function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Add updated_at trigger to user_profiles
CREATE TRIGGER handle_updated_at_user_profiles
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.stock_movements TO authenticated;
GRANT ALL ON public.qr_codes TO authenticated;
GRANT ALL ON public.suppliers TO authenticated;
GRANT ALL ON public.inventory_logs TO authenticated;

-- 12. Create view for easy user data access
CREATE OR REPLACE VIEW public.current_user_profile AS
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.is_active,
    up.created_at,
    up.updated_at
FROM public.user_profiles up
WHERE up.id = auth.uid();

GRANT SELECT ON public.current_user_profile TO authenticated;