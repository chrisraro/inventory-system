import { createClient } from "@supabase/supabase-js"
import { getThresholdByWeight, validateLPGProduct } from "./constants"

// Shared types aligned with database schema and UI usage
export type Product = {
  id: string
  // Core fields
  name: string
  brand?: string
  weight_kg?: number
  unit_type?: string
  // Stock fields (UI uses quantity, DB uses current_stock)
  quantity?: number // UI field
  current_stock?: number // Database field
  // Threshold fields
  min_threshold?: number
  max_threshold?: number
  // Pricing (UI uses price_per_unit, DB uses unit_cost)
  unit_cost?: number // Database field
  selling_price?: number
  price_per_unit?: number // UI field for backward compatibility
  // Extra/optional metadata used in UI
  supplier?: string
  supplier_id?: string
  sku?: string
  barcode?: string
  location?: string
  expiration_date?: string
  remarks?: string
  // Legacy/UI alias used in some components (deprecated)
  product_name?: string
  // Timestamps
  created_at?: string
  updated_at?: string
}

export type StockMovement = {
  id: string
  product_id: string
  movement_type: string
  quantity: number
  reason?: string
  reference_number?: string
  unit_cost?: number
  total_cost?: number
  created_by?: string
  created_at?: string
  updated_at?: string
}

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Validate Supabase configuration
if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase configuration missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.")
  throw new Error("Supabase configuration is required for production mode")
}

// Create Supabase admin client for server-side operations
export const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null




// Authentication functions
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  })

  return { user: data.user, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

// Get current user profile with role information
export const getCurrentUserProfile = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { data: null, error: authError }
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return { data: profile, error: profileError }
}

// Product functions
export const getProducts = async () => {
  // First get the current user's profile to check their role
  const { data: userProfile, error: profileError } = await getCurrentUserProfile()
  
  if (profileError) {
    console.error("Error fetching user profile:", profileError)
    return { data: null, error: profileError }
  }

  let query = supabase.from("products_simplified").select("*").order("created_at", { ascending: false })
  
  // If user is not admin, filter by their own products only
  const isAdmin = userProfile?.role === 'admin'
  if (!isAdmin) {
    query = query.eq("user_id", userProfile?.id)
  }

  const { data, error } = await query
  
  // Map database fields to UI expected fields for backward compatibility
  const mappedData = data?.map(product => ({
    ...product,
    quantity: 1, // For simplified system, each product is 1 unit
    price_per_unit: product.unit_cost, // Map unit_cost to price_per_unit for backward compatibility
    current_stock: product.status === 'available' ? 1 : 0, // Available = 1, others = 0
  }))
  
  return { data: mappedData, error }
}

export const getProduct = async (id: string) => {
  // First get the current user's profile to check their role
  const { data: userProfile, error: profileError } = await getCurrentUserProfile()
  
  if (profileError) {
    console.error("Error fetching user profile:", profileError)
    return { data: null, error: profileError }
  }

  let query = supabase.from("products_simplified").select("*").eq("id", id)
  
  // If user is not admin, ensure they can only access their own products
  const isAdmin = userProfile?.role === 'admin'
  if (!isAdmin) {
    query = query.eq("user_id", userProfile?.id)
  }

  const { data, error } = await query.single()
  
  // Map database fields to UI expected fields for backward compatibility
  const mappedData = data ? {
    ...data,
    quantity: 1, // For simplified system, each product is 1 unit
    price_per_unit: data.unit_cost, // Map unit_cost to price_per_unit for backward compatibility
    current_stock: data.status === 'available' ? 1 : 0, // Available = 1, others = 0
  } : null
  
  return { data: mappedData, error }
}

export const createProduct = async (product: any) => {
  // For simplified system, we expect qr_code, weight_kg, unit_cost, supplier
  const productData = {
    id: `LPG-${product.qr_code.toUpperCase().replace('LPG-', '')}`,
    qr_code: product.qr_code.toUpperCase().replace('LPG-', ''),
    weight_kg: parseFloat(product.weight_kg),
    unit_cost: parseFloat(product.unit_cost),
    supplier: product.supplier || null,
    status: 'available', // Default status for new cylinders
  }

  const { data, error } = await supabase
    .from("products_simplified")
    .insert([productData])
    .select()
    .single()

  return { data, error }
}

export const updateProduct = async (id: string, updates: any) => {
  // For simplified system, we only allow updating supplier
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  }
  
  // Remove fields that shouldn't be updated
  delete updateData.quantity
  delete updateData.price_per_unit
  delete updateData.current_stock
  delete updateData.status

  const { data, error } = await supabase
    .from("products_simplified")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  // Map database fields back to UI fields for response
  const mappedData = data ? {
    ...data,
    quantity: 1,
    price_per_unit: data.unit_cost,
    current_stock: data.status === 'available' ? 1 : 0,
  } : null

  return { data: mappedData, error }
}

export const deleteProduct = async (id: string) => {
  const { error } = await supabase.from("products_simplified").delete().eq("id", id)
  return { error }
}

// Stock movement functions
export const getStockMovements = async (productId?: string) => {
  // First get the current user's profile to check their role
  const { data: userProfile, error: profileError } = await getCurrentUserProfile()
  
  if (profileError) {
    console.error("Error fetching user profile:", profileError)
    return { data: null, error: profileError }
  }

  let query = supabase
    .from("stock_movements_simplified")
    .select(`
      *,
      products_simplified (
        id,
        qr_code,
        weight_kg,
        status,
        unit_cost,
        supplier
      )
    `)
    .order("created_at", { ascending: false })

  if (productId) {
    query = query.eq("product_id", productId)
  }

  // If user is not admin, filter by their own movements only
  const isAdmin = userProfile?.role === 'admin'
  if (!isAdmin) {
    query = query.eq("created_by", userProfile?.id)
  }

  const { data, error } = await query
  return { data, error }
}

export const createStockMovement = async (movement: any) => {
  // First get the current user's profile to get their ID
  const { data: userProfile, error: profileError } = await getCurrentUserProfile()
  
  if (profileError) {
    console.error("Error fetching user profile:", profileError)
    return { data: null, error: profileError }
  }

  const { data, error } = await supabase
    .from("stock_movements_simplified")
    .insert([
      {
        ...movement,
        created_by: userProfile?.id || "admin", // Use actual user ID or fallback to "admin"
      },
    ])
    .select(`
      *,
      products_simplified (
        id,
        qr_code,
        weight_kg,
        status,
        unit_cost,
        supplier
      )
    `)
    .single()

  return { data, error }
}

// Test connection
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.from("products_simplified").select("count").limit(1)

    if (error) {
      return { success: false, message: `Connection failed: ${error.message}` }
    }

    return { success: true, message: "Database connection successful" }
  } catch (error) {
    return { success: false, message: `Connection error: ${error}` }
  }
}

// Analytics functions
export const getInventoryAnalytics = async () => {
  try {
    const { data: products, error: productsError } = await supabase.from("products_simplified").select("*")

    if (productsError) throw productsError

    const { data: movements, error: movementsError } = await supabase
      .from("stock_movements_simplified")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (movementsError) throw movementsError

    const totalProducts = products?.length || 0
    const totalStock = products?.reduce((sum, p) => sum + (p.status === 'available' ? 1 : 0), 0) || 0
    const lowStockItems = 0 // Not applicable in simplified system
    const totalValue = products?.reduce((sum, p) => sum + (p.unit_cost || 0), 0) || 0

    return {
      data: {
        totalProducts,
        totalStock,
        lowStockItems,
        totalValue,
        recentMovements: movements || [],
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error }
  }
}

export default {
  supabase,
  signIn,
  signOut,
  getCurrentUser,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getStockMovements,
  createStockMovement,
  testConnection,
  getInventoryAnalytics,
}
