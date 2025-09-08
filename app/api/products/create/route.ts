import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const productData = await request.json()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    if (!productData.name || !productData.brand || !productData.weight_kg || !productData.unit_cost) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If QR code is provided, generate product ID and validate uniqueness
    if (productData.qr_code) {
      const cleanQRCode = productData.qr_code.toUpperCase().replace('LPG-', '')
      const productId = `LPG-${cleanQRCode}`

      // Check if product with this QR code already exists
      const { data: existingProduct } = await supabase
        .from('products_new')
        .select('id')
        .or(`qr_code.eq.${cleanQRCode},id.eq.${productId}`)
        .eq('user_id', user.id)
        .single()

      if (existingProduct) {
        return NextResponse.json({ error: 'Product with this QR code already exists' }, { status: 409 })
      }

      // Set the generated ID and clean QR code
      productData.id = productId
      productData.qr_code = cleanQRCode
    } else {
      // For manual products without QR codes, generate a unique ID
      productData.id = crypto.randomUUID()
      productData.qr_code = null
    }

    // Ensure user_id is set
    productData.user_id = user.id

    // Set default values
    productData.current_stock = productData.current_stock || 0
    productData.min_threshold = productData.min_threshold || 0
    productData.max_threshold = productData.max_threshold || 100
    productData.unit_type = productData.unit_type || 'cylinder'
    productData.category = productData.category || 'LPG'

    // Insert into products_new table
    const { data: product, error } = await supabase
      .from('products_new')
      .insert([productData])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    return NextResponse.json({ product })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}