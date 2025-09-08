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

    // Validate required fields for simplified system
    if (!productData.qr_code || !productData.weight_kg || !productData.unit_cost) {
      return NextResponse.json({ error: 'Missing required fields: qr_code, weight_kg, unit_cost' }, { status: 400 })
    }

    // Generate product ID from QR code
    const cleanQRCode = productData.qr_code.toUpperCase().replace('LPG-', '')
    const productId = `LPG-${cleanQRCode}`

    // Check if product with this QR code already exists
    const { data: existingProduct } = await supabase
      .from('products_simplified')
      .select('id')
      .or(`qr_code.eq.${cleanQRCode},id.eq.${productId}`)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingProduct) {
      return NextResponse.json({ error: 'Product with this QR code already exists' }, { status: 409 })
    }

    // Create simplified product data
    const simplifiedProduct = {
      id: productId,
      qr_code: cleanQRCode,
      weight_kg: parseFloat(productData.weight_kg),
      unit_cost: parseFloat(productData.unit_cost),
      supplier: productData.supplier || null,
      status: 'available', // Default status for new cylinders
      user_id: user.id,
    }

    // Insert into simplified products table
    const { data: product, error } = await supabase
      .from('products_simplified')
      .insert([simplifiedProduct])
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