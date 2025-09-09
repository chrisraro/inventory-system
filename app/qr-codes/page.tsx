"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, Search, Download, Trash2, Plus, FileDown, Scan } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { useRouter } from "next/navigation"
import { QRPDFExport } from "@/components/qr/qr-pdf-export"
import { useQRCodes } from "@/hooks/use-qr-codes"
import { useProducts } from "@/hooks/use-products"
import { QRCodeSVG } from "qrcode.react"

export default function QRCodesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { qrCodes, loading, removeQRCode, fetchAllQRCodes } = useQRCodes()
  const { products } = useProducts()
  const [searchTerm, setSearchTerm] = useState("")
  const [showExporter, setShowExporter] = useState(false)

  useEffect(() => {
    fetchAllQRCodes()
  }, [])

  const handleDeleteQR = async (qrId: string) => {
    // TODO: Replace with proper confirmation dialog
    if (confirm("Are you sure you want to delete this QR code?")) {
      await removeQRCode(qrId)
    }
  }

  const downloadQRCode = (qrData: string, productName: string) => {
    const svg = document.querySelector(`[data-qr="${qrData}"]`)
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
      downloadLink.download = `qr-${productName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }

  const filteredQRCodes = qrCodes.filter((qr) => {
    const productName = qr.products?.name?.toLowerCase() || ""
    const productBrand = qr.products?.brand?.toLowerCase() || ""
    const qrData = qr.qr_data?.toLowerCase() || ""
    const search = searchTerm.toLowerCase()

    return productName.includes(search) || productBrand.includes(search) || qrData.includes(search)
  })

  return (
    <ProtectedRoute permission="add_product">
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Code Management</h1>
              <p className="text-gray-600">Scan QR codes to add products or view existing QR-based products</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/qr-scanner')}>
                <Scan className="h-4 w-4 mr-2" />
                Scan QR Code
              </Button>

              {qrCodes.length > 0 && (
                <Dialog open={showExporter} onOpenChange={setShowExporter}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <FileDown className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Export QR Codes to PDF</DialogTitle>
                    </DialogHeader>
                    <QRPDFExport qrCodes={qrCodes} onClose={() => setShowExporter(false)} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <Tabs defaultValue="grid" className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search QR codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Badge variant="secondary">{filteredQRCodes.length} QR codes</Badge>
              </div>
            </div>

            <TabsContent value="grid" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading QR codes...</div>
              ) : filteredQRCodes.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? "No QR codes match your search." : "Scan QR codes to add products to your inventory."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => router.push('/qr-scanner')}>
                      <Scan className="h-4 w-4 mr-2" />
                      Start Scanning
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredQRCodes.map((qrCode) => (
                    <Card key={qrCode.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium truncate">
                            {qrCode.products?.name || "Unknown Product"}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQR(qrCode.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600">
                          {qrCode.products?.brand} • {qrCode.products?.weight_kg}kg
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-center p-4 bg-white border rounded-lg">
                          <QRCodeSVG
                            value={qrCode.qr_data}
                            size={120}
                            level="M"
                            includeMargin
                            data-qr={qrCode.qr_data}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadQRCode(qrCode.qr_data, qrCode.products?.name || "product")}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading QR codes...</div>
              ) : filteredQRCodes.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? "No QR codes match your search." : "Scan QR codes to add products to your inventory."}
                  </p>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredQRCodes.map((qrCode) => (
                        <div key={qrCode.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              <QRCodeSVG value={qrCode.qr_data} size={48} level="M" data-qr={qrCode.qr_data} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-gray-900 truncate">
                                {qrCode.products?.name || "Unknown Product"}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {qrCode.products?.brand} • {qrCode.products?.weight_kg}kg
                              </p>
                              <p className="text-xs text-gray-500">
                                Created: {new Date(qrCode.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadQRCode(qrCode.qr_data, qrCode.products?.name || "product")}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQR(qrCode.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
