import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    // Get the product ID from query parameters
    const url = new URL(request.url)
    const productId = url.searchParams.get('id')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
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
    let query = supabase
      .from('products_simplified')
      .select('id, user_id')
      .eq('id', productId)

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
    const { error } = await supabase
      .from('products_simplified')
      .delete()
      .eq('id', productId)

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