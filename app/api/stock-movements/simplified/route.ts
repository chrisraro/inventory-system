import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with service role for API routes
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to authenticate request
async function authenticateRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'No valid token' }
    }

    const token = authHeader.substring(7)
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return { user: null, error: 'Invalid token' }
    }
    
    return { user, error: null }
  } catch (error) {
    console.error('Authentication error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const status = searchParams.get('status')
    const weight = searchParams.get('weight')

    // Authenticate request
    const { user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: `Unauthorized - ${authError}` }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    const isAdmin = profile?.role === 'admin'

    let query = supabaseAdmin
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
      .order('created_at', { ascending: false })

    // For non-admin users, filter by their own movements
    if (!isAdmin) {
      query = query.eq('created_by', user.id)
    }

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
      // Check if it's a table not found error
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database tables not found. Please run the database migration script first.',
          code: 'TABLES_NOT_FOUND'
        }, { status: 503 })
      }
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

    // Authenticate request
    const { user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: `Unauthorized - ${authError}` }, { status: 401 })
    }

    // Validate required fields
    if (!movementData.product_id || !movementData.to_status || !movementData.movement_type) {
      return NextResponse.json({ error: 'Missing required fields: product_id, to_status, movement_type' }, { status: 400 })
    }

    // Get current product to check its current status
    // For admins, allow access to any product; for regular users, only their own products
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    const isAdmin = profile?.role === 'admin'

    let productQuery = supabaseAdmin
      .from('products_simplified')
      .select('id, status')
      .eq('id', movementData.product_id)

    if (!isAdmin) {
      productQuery = productQuery.eq('user_id', user.id)
    }

    const { data: product, error: productError } = await productQuery.single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 })
    }

    // Validate status transition
    if (product.status === movementData.to_status) {
      return NextResponse.json({ error: 'Product is already in the specified status' }, { status: 400 })
    }

    // Create the movement record
    const { data: movement, error } = await supabaseAdmin
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
    // Authenticate request
    const { user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: `Unauthorized - ${authError}` }, { status: 401 })
    }

    // Get cylinder statistics using the database function
    const { data: stats, error } = await supabaseAdmin
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