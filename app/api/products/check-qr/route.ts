import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizeQRCode } from '@/lib/qr-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const qrCode = searchParams.get('qr')

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 })
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Normalize the QR code to extract the product identifier
    const normalizedQRCode = normalizeQRCode(qrCode)
    console.log("Original QR code:", qrCode)
    console.log("Normalized QR code:", normalizedQRCode)

    // Check if product exists with this normalized QR code
    // For stock movements, allow any authenticated user to access any product
    // In simplified system, both id and qr_code fields contain the raw QR code
    const { data: product, error } = await supabase
      .from('products_simplified')
      .select('*')
      .eq('qr_code', normalizedQRCode) // Check by normalized qr_code field
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error)
      // Check if it's a table not found error
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database tables not found. Please run the database migration script first.',
          code: 'TABLES_NOT_FOUND'
        }, { status: 503 })
      }
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      exists: !!product,
      product: product || null,
      qrCode: normalizedQRCode,
      originalQRCode: qrCode
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}