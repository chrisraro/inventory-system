"use client"

import { useState, useEffect } from "react"
import { authenticatedGet, authenticatedPost } from '@/lib/api-client'

// Simplified Product interface for the new system
interface Product {
  id: string
  qr_code: string
  weight_kg: number
  unit_cost: number
  supplier?: string
  status: string
  created_at: string
  updated_at: string
  user_id: string
  // Backward compatibility fields
  name?: string
  brand?: string
  category?: string
  quantity?: number
  current_stock?: number
  price_per_unit?: number
  unit_type?: string
  min_threshold?: number
  max_threshold?: number
}

interface UseProductsReturn {
  products: Product[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getProduct: (id: string) => Promise<{ product: Product | null; error: string | null }>
  addProduct: (
    product: { qr_code: string; weight_kg: number; unit_cost: number; supplier?: string }
  ) => Promise<{ success: boolean; error?: string }>
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await authenticatedGet('/api/products/list')
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const { products: productData } = await response.json()
      setProducts(productData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const getProduct = async (id: string): Promise<{ product: Product | null; error: string | null }> => {
    try {
      const response = await authenticatedGet(`/api/products/get/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return { product: null, error: 'Product not found' }
        }
        throw new Error('Failed to fetch product')
      }
      
      const { product } = await response.json()
      return { product, error: null }
    } catch (err) {
      return { product: null, error: err instanceof Error ? err.message : "Failed to fetch product" }
    }
  }

  const addProduct = async (
    productData: { qr_code: string; weight_kg: number; unit_cost: number; supplier?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authenticatedPost('/api/products/create', productData)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      await fetchProducts()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to add product" }
    }
  }

  const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // For now, we don't have a delete API endpoint, so this is a placeholder
      console.warn('Product deletion not implemented yet')
      return { success: false, error: 'Product deletion not implemented' }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to delete product" }
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    getProduct,
    addProduct,
    deleteProduct,
  }
}

// Export the Product type for use in other components
export type { Product }
