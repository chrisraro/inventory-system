import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        products_new (
          id,
          name,
          brand,
          weight_kg,
          qr_code,
          current_stock,
          unit_type
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by product if specified
    if (productId) {
      query = query.eq('product_qr_id', productId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 })
    }

    // Map the data to match existing interface
    const mappedMovements = data?.map((movement: any) => ({
      ...movement,
      products: movement.products_new ? {
        ...movement.products_new,
        category: 'LPG', // Default category for LPG products
        quantity: movement.products_new.current_stock,
        unit_cost: movement.products_new.unit_cost
      } : null
    })) || []

    return NextResponse.json({ movements: mappedMovements })

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
    if (!movementData.product_id || !movementData.movement_type || !movementData.quantity || !movementData.reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate quantity
    if (movementData.quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
    }

    // Map movement type to match schema
    const mappedMovementType = movementData.movement_type === 'in' ? 'incoming' 
      : movementData.movement_type === 'out' ? 'outgoing' 
      : 'adjustment'

    // Create the movement record
    const { data: movement, error } = await supabase
      .from('stock_movements')
      .insert([{
        product_qr_id: movementData.product_id, // Use new foreign key column
        movement_type: mappedMovementType,
        quantity: parseInt(movementData.quantity),
        reason: movementData.reason,
        notes: movementData.notes || null,
        created_by: user.id,
      }])
      .select()
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