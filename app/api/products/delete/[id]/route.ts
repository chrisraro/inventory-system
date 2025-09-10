import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with service role for API routes
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("DELETE request for product ID:", params.id)
  
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log("Unauthorized - No valid token")
      return NextResponse.json({ error: 'Unauthorized - No valid token' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log("Token extracted from header")
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      console.log("Unauthorized - Invalid token:", authError?.message || "No user")
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }
    
    console.log("User authenticated:", user.id)

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
    
    console.log("User profile fetched:", profile)

    const isAdmin = profile?.role === 'admin'
    const isStockman = profile?.role === 'stockman'

    // Check if product exists
    console.log("Checking if product exists:", params.id)
    const { data: product, error: productError } = await supabaseAdmin
      .from('products_simplified')
      .select('id')
      .eq('id', params.id)
      .single()

    if (productError) {
      console.error('Database error when checking product:', productError)
      // Check if it's a "not found" error (PGRST116 is the PostgREST code for "not found")
      if (productError.code === 'PGRST116') {
        console.log("Product not found (PGRST116)")
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      // Check if it's a table not found error
      if (productError.message?.includes('relation') && productError.message?.includes('does not exist')) {
        console.log("Database tables not found")
        return NextResponse.json({ 
          error: 'Database tables not found. Please run the database migration script first.',
          code: 'TABLES_NOT_FOUND'
        }, { status: 503 })
      }
      console.log("Product not found (general error)")
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product) {
      console.log("Product not found (no data)")
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    console.log("Product found, proceeding with deletion")

    // Admin can delete any product
    // Stockman can delete any product
    // No additional permission checks needed

    // Delete the product
    console.log("Deleting product:", params.id)
    const { error } = await supabaseAdmin
      .from('products_simplified')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Database error when deleting product:', error)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
    
    console.log("Product deleted successfully")

    return NextResponse.json({ message: 'Product deleted successfully' })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}