import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with service role for API routes
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    // Check if product exists and belongs to the user (or user is admin)
    let query = supabaseAdmin
      .from('products_simplified')
      .select('id, user_id')
      .eq('id', params.id)

    // If user is not admin, ensure they can only access their own products
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data: product, error: productError } = await query.single()

    if (productError) {
      console.error('Database error:', productError)
      // Check if it's a table not found error
      if (productError.message?.includes('relation') && productError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database tables not found. Please run the database migration script first.',
          code: 'TABLES_NOT_FOUND'
        }, { status: 503 })
      }
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete the product
    const { error } = await supabaseAdmin
      .from('products_simplified')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Product deleted successfully' })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}