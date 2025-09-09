"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { QrCode, Download, Check } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "@/hooks/use-toast"
import { generateQRCodeData, createQRCode } from "@/lib/supabase"
import { getProductDisplayName } from "@/lib/constants"

interface QRCodeGeneratorProps {
  products: any[]
  onGenerated?: (qrCode: any) => void
  className?: string
}

export function QRCodeGenerator({ products, onGenerated, className }: QRCodeGeneratorProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [generatedQR, setGeneratedQR] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!selectedProduct) return

    setLoading(true)
    try {
      const product = products.find((p) => p.id === selectedProduct)
      if (!product) throw new Error("Product not found")

      const qrData = await generateQRCodeData(product)

      const { data: qrCode, error } = await createQRCode(product.id, qrData, {
        weight_kg: product.weight_kg,
        brand: product.brand,
        product_name: product.name,
      })

      if (error) throw error

      setGeneratedQR(qrData)
      onGenerated?.(qrCode)

      toast({
        title: "QR Code Generated",
        description: `QR code created for ${getProductDisplayName(product)}`,
      })
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = () => {
    if (!generatedQR) return

    const svg = document.querySelector("[data-qr-generator]")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg as Element)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = 300
      canvas.height = 300
      ctx?.drawImage(img, 0, 0, 300, 300)

      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      const product = products.find((p) => p.id === selectedProduct)
      downloadLink.download = `qr-${
        product
          ? getProductDisplayName(product)
              .replace(/[^a-z0-9]/gi, "_")
              .toLowerCase()
          : "product"
      }.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }

  const selectedProductData = products.find((p) => p.id === selectedProduct)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <QrCode className="h-5 w-5" />
          <span>QR Code Generator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Product</label>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a product..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{getProductDisplayName(product)}</span>
                    <Badge variant="outline" className="ml-2">
                      Stock: {product.quantity}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProductData && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm space-y-1">
              <div className="font-medium">{getProductDisplayName(selectedProductData)}</div>
              <div className="text-gray-600">
                Price: ₱{selectedProductData.unit_cost} | Stock: {selectedProductData.quantity}
              </div>
              {selectedProductData.supplier && (
                <div className="text-gray-600">Supplier: {selectedProductData.supplier}</div>
              )}
            </div>
          </div>
        )}

        <Button onClick={handleGenerate} disabled={!selectedProduct || loading} className="w-full">
          {loading ? (
            "Generating..."
          ) : (
            <>
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR Code
            </>
          )}
        </Button>

        {generatedQR && (
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-white border rounded-lg">
              <QRCodeSVG value={generatedQR} size={200} level="M" includeMargin data-qr-generator />
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              <span>QR Code Generated Successfully</span>
            </div>

            <Button onClick={downloadQR} variant="outline" className="w-full bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
