import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get products from the new QR-based table
    const { data: products, error } = await supabase
      .from('products_new')
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
      quantity: product.current_stock, // Map current_stock to quantity for UI compatibility
      price_per_unit: product.unit_cost, // Map unit_cost to price_per_unit for UI compatibility
    })) || []

    return NextResponse.json({ products: mappedProducts })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}