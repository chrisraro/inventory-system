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

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Validate Supabase configuration
if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase configuration missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.")
  throw new Error("Supabase configuration is required for production mode")
}




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
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })
  
  // Map database fields to UI expected fields for backward compatibility
  const mappedData = data?.map(product => ({
    ...product,
    quantity: product.current_stock, // Map current_stock to quantity for UI
    price_per_unit: product.unit_cost, // Map unit_cost to price_per_unit for backward compatibility
  }))
  
  return { data: mappedData, error }
}

export const getProduct = async (id: string) => {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single()
  
  // Map database fields to UI expected fields for backward compatibility
  const mappedData = data ? {
    ...data,
    quantity: data.current_stock, // Map current_stock to quantity for UI
    price_per_unit: data.unit_cost, // Map unit_cost to price_per_unit for backward compatibility
  } : null
  
  return { data: mappedData, error }
}

export const createProduct = async (product: any) => {
  // Map form fields to database schema
  const productData = {
    ...product,
    // Map quantity to current_stock for database
    current_stock: product.quantity || 0,
    // Map price_per_unit to unit_cost for database
    unit_cost: product.price_per_unit || product.unit_cost || 0,
    // Remove quantity and price_per_unit to avoid field conflicts
    quantity: undefined,
    price_per_unit: undefined,
  }

  // Remove undefined fields
  Object.keys(productData).forEach(key => {
    if (productData[key] === undefined) {
      delete productData[key]
    }
  })

  const { data, error } = await supabase
    .from("products")
    .insert([productData])
    .select()
    .single()

  return { data, error }
}

export const updateProduct = async (id: string, updates: any) => {
  // Map form fields to database schema
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  }
  
  // Map UI fields to database fields if they exist
  if (updates.quantity !== undefined) {
    updateData.current_stock = updates.quantity
    delete updateData.quantity
  }
  if (updates.price_per_unit !== undefined) {
    updateData.unit_cost = updates.price_per_unit
    delete updateData.price_per_unit
  }

  const { data, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  // Map database fields back to UI fields for response
  const mappedData = data ? {
    ...data,
    quantity: data.current_stock,
    price_per_unit: data.unit_cost,
  } : null

  return { data: mappedData, error }
}

export const deleteProduct = async (id: string) => {
  const { error } = await supabase.from("products").delete().eq("id", id)
  return { error }
}

// Stock movement functions
export const getStockMovements = async (productId?: string) => {
  let query = supabase
    .from("stock_movements")
    .select(`
      *,
      products (
        name,
        brand,
        weight_kg
      )
    `)
    .order("created_at", { ascending: false })

  if (productId) {
    query = query.eq("product_id", productId)
  }

  const { data, error } = await query
  return { data, error }
}

export const createStockMovement = async (movement: any) => {
  const { data, error } = await supabase
    .from("stock_movements")
    .insert([
      {
        ...movement,
        created_by: "admin",
      },
    ])
    .select()
    .single()

  return { data, error }
}

// QR Code functions
export const getQRCodes = async () => {
  const { data, error } = await supabase
    .from("qr_codes")
    .select(`
      *,
      products (
        name,
        brand,
        weight_kg,
        sku
      )
    `)
    .order("created_at", { ascending: false })

  return { data, error }
}

export const generateQRCode = async (productId: string) => {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single()

  if (productError || !product) {
    return { data: null, error: productError || { message: "Product not found" } }
  }

  const qrData = `LPG-${product.brand?.substring(0, 3).toUpperCase()}-${product.weight_kg}KG-${productId}`

  const { data, error } = await supabase
    .from("qr_codes")
    .insert([
      {
        product_id: productId,
        qr_data: qrData,
      },
    ])
    .select()
    .single()

  return { data, error }
}

// Create QR Code with provided data (used by hooks/use-qr-codes)
export const createQRCode = async (productId: string, qrData: string, metadata?: any) => {
  const insertPayload: any = {
    product_id: productId,
    qr_data: qrData,
  }
  if (metadata) {
    if (typeof metadata.qr_code_url === "string") insertPayload.qr_code_url = metadata.qr_code_url
    if (typeof metadata.is_active === "boolean") insertPayload.is_active = metadata.is_active
  }

  const { data, error } = await supabase.from("qr_codes").insert([insertPayload]).select().single()
  return { data, error }
}

export const deleteQRCode = async (id: string) => {
  const { error } = await supabase.from("qr_codes").delete().eq("id", id)
  return { error }
}

export const parseQRData = (qrData: string) => {
  // Expected format: LPG-BRAND-WEIGHT-ID
  const parts = qrData.split("-")
  if (parts.length >= 4 && parts[0] === "LPG") {
    return {
      type: "LPG",
      brand: parts[1],
      weight: parts[2],
      productId: parts.slice(3).join("-"),
    }
  }
  return null
}

// Backward compatible alias expected by hooks/use-qr-codes
export const parseQRCodeData = (qrData: string) => parseQRData(qrData)

// Generate QR code data for products
export const generateQRCodeData = (product: Product): string => {
  if (!product.brand || !product.weight_kg || !product.id) {
    throw new Error("Product missing required fields for QR generation")
  }
  return `LPG-${product.brand.substring(0, 3).toUpperCase()}-${product.weight_kg}KG-${product.id}`
}

// Validate product data
export const validateProduct = (product: any): { isValid: boolean; errors: string[] } => {
  return validateLPGProduct(product)
}

// Get product by QR data
export const getProductByQRData = async (qrData: string) => {
  const { data: qrCode, error: qrError } = await supabase
    .from("qr_codes")
    .select("product_id")
    .eq("qr_data", qrData)
    .single()

  if (qrError || !qrCode) {
    return { data: null, error: qrError || { message: "QR code not found" } }
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", qrCode.product_id)
    .single()

  return { data: product, error: productError }
}

// Test connection
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.from("products").select("count").limit(1)

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
    const { data: products, error: productsError } = await supabase.from("products").select("*")

    if (productsError) throw productsError

    const { data: movements, error: movementsError } = await supabase
      .from("stock_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (movementsError) throw movementsError

    const totalProducts = products?.length || 0
    const totalStock = products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0
    const lowStockItems = products?.filter((p) => (p.quantity || 0) <= (p.min_threshold || 0)).length || 0
    const totalValue = products?.reduce((sum, p) => sum + (p.quantity || 0) * (p.unit_cost || 0), 0) || 0

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
  getQRCodes,
  generateQRCode,
  deleteQRCode,
  parseQRData,
  validateProduct,
  getProductByQRData,
  testConnection,
  getInventoryAnalytics,
}
