"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileText, Grid3X3, Loader2 } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import QRCode from "qrcode"
import { Badge } from "@/components/ui/badge"

interface QRCodeData {
  id: string
  product_id: string
  qr_data: string
  products?: {
    name: string
    brand?: string
    weight_kg?: number
    sku?: string
  }
}

interface QRPDFExportProps {
  qrCodes: QRCodeData[]
  onClose: () => void
}

export function QRPDFExport({ qrCodes, onClose }: QRPDFExportProps) {
  const [selectedQRs, setSelectedQRs] = useState<string[]>([])
  const [gridLayout, setGridLayout] = useState<string>("2x2")
  const [includeLabels, setIncludeLabels] = useState(true)
  const [includeProductInfo, setIncludeProductInfo] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const gridLayouts = [
    { value: "1x1", label: "1×1 (1 per page)", cols: 1, rows: 1 },
    { value: "2x2", label: "2×2 (4 per page)", cols: 2, rows: 2 },
    { value: "3x3", label: "3×3 (9 per page)", cols: 3, rows: 3 },
    { value: "4x4", label: "4×4 (16 per page)", cols: 4, rows: 4 },
  ]

  const currentLayout = gridLayouts.find((l) => l.value === gridLayout) || gridLayouts[1]

  const handleSelectAll = () => {
    if (selectedQRs.length === qrCodes.length) {
      setSelectedQRs([])
    } else {
      setSelectedQRs(qrCodes.map((qr) => qr.id))
    }
  }

  const handleSelectQR = (qrId: string) => {
    setSelectedQRs((prev) => (prev.includes(qrId) ? prev.filter((id) => id !== qrId) : [...prev, qrId]))
  }

  const generatePDF = async () => {
    if (selectedQRs.length === 0) {
      toast.error("Please select at least one QR code to export")
      return
    }

    setIsGenerating(true)

    try {
      const pdf = new jsPDF("portrait", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const availableWidth = pageWidth - margin * 2
      const availableHeight = pageHeight - margin * 2

      const cellWidth = availableWidth / currentLayout.cols
      const cellHeight = availableHeight / currentLayout.rows
      const qrSize = Math.min(cellWidth, cellHeight) * 0.6

      const selectedQRData = qrCodes.filter((qr) => selectedQRs.includes(qr.id))
      const itemsPerPage = currentLayout.cols * currentLayout.rows
      let currentPage = 0
      let itemIndex = 0

      for (const qrData of selectedQRData) {
        const pageIndex = Math.floor(itemIndex / itemsPerPage)
        const positionInPage = itemIndex % itemsPerPage
        const row = Math.floor(positionInPage / currentLayout.cols)
        const col = positionInPage % currentLayout.cols

        // Add new page if needed
        if (pageIndex > currentPage) {
          pdf.addPage()
          currentPage = pageIndex
        }

        // Calculate position
        const x = margin + col * cellWidth + (cellWidth - qrSize) / 2
        const y = margin + row * cellHeight + (cellHeight - qrSize) / 2

        try {
          // Generate QR code as data URL
          const qrDataURL = await QRCode.toDataURL(qrData.qr_data, {
            width: 256,
            margin: 1,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          })

          // Add QR code to PDF
          pdf.addImage(qrDataURL, "PNG", x, y, qrSize, qrSize)

          // Add labels if enabled
          if (includeLabels || includeProductInfo) {
            const labelY = y + qrSize + 5
            pdf.setFontSize(8)
            pdf.setTextColor(0, 0, 0)

            let labelText = ""
            if (includeProductInfo && qrData.products) {
              const product = qrData.products
              labelText = `${product.name}`
              if (product.brand && product.brand !== "Generic") {
                labelText += ` (${product.brand})`
              }
              if (product.weight_kg) {
                labelText += ` - ${product.weight_kg}kg`
              }
            }

            if (includeLabels) {
              if (labelText) labelText += "\n"
              labelText += qrData.qr_data
            }

            if (labelText) {
              const lines = labelText.split("\n")
              lines.forEach((line, lineIndex) => {
                const textWidth = pdf.getTextWidth(line)
                const textX = x + (qrSize - textWidth) / 2
                pdf.text(line, textX, labelY + lineIndex * 3)
              })
            }
          }
        } catch (error) {
          console.error("Error generating QR code:", error)
          toast.error(`Failed to generate QR code for ${qrData.qr_data}`)
        }

        itemIndex++
      }

      // Add header to first page
      pdf.setPage(1)
      pdf.setFontSize(16)
      pdf.setTextColor(0, 0, 0)
      pdf.text("LPG Inventory QR Codes", pageWidth / 2, 15, { align: "center" })

      // Add footer with generation info
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(128, 128, 128)
        pdf.text(
          `Generated: ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages} | ${selectedQRs.length} QR codes`,
          pageWidth / 2,
          pageHeight - 5,
          { align: "center" },
        )
      }

      // Save the PDF
      const fileName = `lpg-qr-codes-${new Date().toISOString().split("T")[0]}.pdf`
      pdf.save(fileName)

      toast.success(`PDF generated successfully: ${fileName}`)
      onClose()
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Export QR Codes to PDF</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 overflow-y-auto">
          {/* Layout Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Layout Options</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grid-layout">Grid Layout</Label>
                <Select value={gridLayout} onValueChange={setGridLayout}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {gridLayouts.map((layout) => (
                      <SelectItem key={layout.value} value={layout.value}>
                        <div className="flex items-center space-x-2">
                          <Grid3X3 className="h-4 w-4" />
                          <span>{layout.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Include Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-labels" checked={includeLabels} onCheckedChange={setIncludeLabels} />
                    <Label htmlFor="include-labels" className="text-sm">
                      QR Code Data
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-product-info"
                      checked={includeProductInfo}
                      onCheckedChange={setIncludeProductInfo}
                    />
                    <Label htmlFor="include-product-info" className="text-sm">
                      Product Info
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Select QR Codes ({selectedQRs.length} of {qrCodes.length})
              </Label>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedQRs.length === qrCodes.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
              {qrCodes.map((qr) => (
                <div key={qr.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <Checkbox checked={selectedQRs.includes(qr.id)} onCheckedChange={() => handleSelectQR(qr.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {qr.qr_data}
                      </Badge>
                    </div>
                    {qr.products && (
                      <p className="text-sm text-gray-600 truncate">
                        {qr.products.name}
                        {qr.products.brand && qr.products.brand !== "Generic" && <span> ({qr.products.brand})</span>}
                        {qr.products.weight_kg && <span> - {qr.products.weight_kg}kg</span>}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Info */}
          {selectedQRs.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Preview:</strong> {selectedQRs.length} QR codes will be arranged in a{" "}
                {currentLayout.label.toLowerCase()} grid.{" "}
                {Math.ceil(selectedQRs.length / (currentLayout.cols * currentLayout.rows))} page(s) will be generated.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={generatePDF} disabled={selectedQRs.length === 0 || isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default QRPDFExport
