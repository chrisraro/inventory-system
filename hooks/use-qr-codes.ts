"use client"

import { useState, useCallback } from "react"
import { getQRCodes, createQRCode, deleteQRCode, getProductByQRData, parseQRCodeData } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

export function useQRCodes() {
  const [qrCodes, setQRCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllQRCodes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await getQRCodes()
      if (error) throw error

      setQRCodes(data || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch QR codes"
      setError(errorMsg)
      console.error("Error fetching QR codes:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const generateQRCode = useCallback(
    async (productId: string, metadata?: any) => {
      setLoading(true)
      setError(null)

      try {
        // First get the product to generate QR data
        const { data: products } = await getQRCodes()
        const existingQR = products?.find((qr) => qr.product_id === productId)

        if (existingQR) {
          toast({
            title: "QR Code Exists",
            description: "This product already has a QR code",
            variant: "destructive",
          })
          return { success: false, error: "QR code already exists" }
        }

        // Generate QR data (this would need the actual product data)
        const qrData = `LPG_CYL_${Date.now()}_${productId.slice(-8)}`

        const { data, error } = await createQRCode(productId, qrData, metadata)
        if (error) throw error

        // Refresh the list
        await fetchAllQRCodes()

        toast({
          title: "QR Code Generated",
          description: "QR code created successfully",
        })

        return { success: true, data }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to generate QR code"
        setError(errorMsg)
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
        return { success: false, error: errorMsg }
      } finally {
        setLoading(false)
      }
    },
    [fetchAllQRCodes],
  )

  const removeQRCode = useCallback(async (qrId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await deleteQRCode(qrId)
      if (error) throw error

      // Remove from local state
      setQRCodes((prev) => prev.filter((qr) => qr.id !== qrId))

      toast({
        title: "QR Code Deleted",
        description: "QR code removed successfully",
      })

      return { success: true }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete QR code"
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  const findProductByQR = useCallback(async (qrData: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data: product, error } = await getProductByQRData(qrData)
      if (error) throw error

      if (!product) {
        return { success: false, error: "Product not found", product: null }
      }

      return { success: true, product, error: null }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to find product"
      setError(errorMsg)
      return { success: false, error: errorMsg, product: null }
    } finally {
      setLoading(false)
    }
  }, [])

  const parseQRData = useCallback((qrData: string) => {
    try {
      return parseQRCodeData(qrData)
    } catch (err) {
      console.error("Error parsing QR data:", err)
      return null
    }
  }, [])

  return {
    qrCodes,
    loading,
    error,
    fetchAllQRCodes,
    generateQRCode,
    removeQRCode,
    findProductByQR,
    parseQRData,
  }
}
