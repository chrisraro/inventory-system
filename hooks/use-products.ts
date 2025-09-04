"use client"

import { useState, useEffect } from "react"
import { supabase, type Product, validateProduct } from "@/lib/supabase"

interface UseProductsReturn {
  products: Product[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  addProduct: (
    product: Omit<Product, "id" | "created_at" | "updated_at">,
  ) => Promise<{ success: boolean; error?: string }>
  updateProduct: (id: string, product: Partial<Product>) => Promise<{ success: boolean; error?: string }>
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
      const { data, error: supabaseError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })

      if (supabaseError) throw supabaseError
      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async (
    productData: Omit<Product, "id" | "created_at" | "updated_at">,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const validation = validateProduct(productData)
      if (!validation.isValid) {
        return { success: false, error: validation.errors[0] }
      }

      const newProduct: Product = {
        ...productData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: supabaseError } = await supabase.from("products").insert([newProduct])
      if (supabaseError) throw supabaseError

      await fetchProducts()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to add product" }
    }
  }

  const updateProduct = async (
    id: string,
    productData: Partial<Product>,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedData = {
        ...productData,
        updated_at: new Date().toISOString(),
      }

      const { error: supabaseError } = await supabase.from("products").update(updatedData).eq("id", id)
      if (supabaseError) throw supabaseError

      await fetchProducts()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to update product" }
    }
  }

  const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: supabaseError } = await supabase.from("products").delete().eq("id", id)
      if (supabaseError) throw supabaseError

      await fetchProducts()
      return { success: true }
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
    addProduct,
    updateProduct,
    deleteProduct,
  }
}
