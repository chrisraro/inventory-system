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
    const qrCode = searchParams.get('qr')

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 })
    }

    // Authenticate request
    const { user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: `Unauthorized - ${authError}` }, { status: 401 })
    }

    // Use the QR code directly (preserve exact case and special characters)
    const productId = qrCode

    // Check if product exists with this QR code
    // For stock movements, allow any authenticated user to access any product
    const { data: product, error } = await supabaseAdmin
      .from('products_simplified')
      .select('*')
      .eq('qr_code', productId)
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
      qrCode,
      productId
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}