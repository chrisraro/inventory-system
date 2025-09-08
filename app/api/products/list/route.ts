import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with service role for API routes
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No valid token' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    // Get products from the simplified table
    const { data: products, error } = await supabaseAdmin
      .from('products_simplified')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Map to maintain compatibility with existing UI
    const mappedProducts = products?.map((product: any) => ({
      ...product,
      // Map simplified fields to expected UI fields
      name: `${product.weight_kg}kg LPG Cylinder`,
      brand: 'Petrogreen', // Default brand
      category: 'LPG',
      quantity: product.status === 'available' ? 1 : 0, // Available = 1, others = 0
      current_stock: product.status === 'available' ? 1 : 0,
      price_per_unit: product.unit_cost,
      unit_type: 'cylinder',
      min_threshold: 0,
      max_threshold: 1,
    })) || []

    return NextResponse.json({ products: mappedProducts })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}