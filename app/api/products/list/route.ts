import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get products from the simplified table
    const { data: products, error } = await supabase
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