import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with service role for API routes
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const productData = await request.json()

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

    // Validate required fields for simplified system
    if (!productData.qr_code || !productData.weight_kg || !productData.unit_cost) {
      return NextResponse.json({ error: 'Missing required fields: qr_code, weight_kg, unit_cost' }, { status: 400 })
    }

    // Use the QR code directly as the product ID (no LPG- prefix)
    const productId = productData.qr_code.toUpperCase()

    // Check if product with this QR code already exists
    const { data: existingProduct } = await supabaseAdmin
      .from('products_simplified')
      .select('id')
      .eq('qr_code', productId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingProduct) {
      return NextResponse.json({ error: 'Product with this QR code already exists' }, { status: 409 })
    }

    // Create simplified product data
    const simplifiedProduct = {
      id: productId,
      qr_code: productId,
      weight_kg: parseFloat(productData.weight_kg),
      unit_cost: parseFloat(productData.unit_cost),
      supplier: productData.supplier || null,
      status: 'available', // Default status for new cylinders
      user_id: user.id,
    }

    // Insert into simplified products table
    const { data: product, error } = await supabaseAdmin
      .from('products_simplified')
      .insert([simplifiedProduct])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      // Check if it's a table not found error
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database tables not found. Please run the database migration script first.',
          code: 'TABLES_NOT_FOUND'
        }, { status: 503 })
      }
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    return NextResponse.json({ product })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}