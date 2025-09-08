import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const status = searchParams.get('status')
    const weight = searchParams.get('weight')

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('stock_movements_simplified')
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
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    // Filter by product if specified
    if (productId) {
      query = query.eq('product_id', productId)
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('to_status', status)
    }

    const { data: movements, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 })
    }

    // Filter by weight if specified (client-side filtering since it's from joined table)
    let filteredMovements = movements || []
    if (weight) {
      filteredMovements = filteredMovements.filter(movement => 
        movement.products_simplified?.weight_kg === parseFloat(weight)
      )
    }

    return NextResponse.json({ movements: filteredMovements })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const movementData = await request.json()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    if (!movementData.product_id || !movementData.to_status || !movementData.movement_type) {
      return NextResponse.json({ error: 'Missing required fields: product_id, to_status, movement_type' }, { status: 400 })
    }

    // Get current product to check its current status
    const { data: product, error: productError } = await supabase
      .from('products_simplified')
      .select('id, status')
      .eq('id', movementData.product_id)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 })
    }

    // Validate status transition
    if (product.status === movementData.to_status) {
      return NextResponse.json({ error: 'Product is already in the specified status' }, { status: 400 })
    }

    // Create the movement record
    const { data: movement, error } = await supabase
      .from('stock_movements_simplified')
      .insert([{
        product_id: movementData.product_id,
        from_status: product.status,
        to_status: movementData.to_status,
        movement_type: movementData.movement_type,
        reason: movementData.reason || null,
        notes: movementData.notes || null,
        reference_number: movementData.reference_number || null,
        created_by: user.id,
      }])
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

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create stock movement' }, { status: 500 })
    }

    return NextResponse.json({ movement })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET cylinder summary statistics
export async function OPTIONS(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get cylinder statistics using the database function
    const { data: stats, error } = await supabase
      .rpc('get_cylinder_summary', { user_uuid: user.id })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to get statistics' }, { status: 500 })
    }

    return NextResponse.json({ stats: stats || [] })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}