"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Package, QrCode, Scan, ShoppingCart, Wrench, 
  AlertTriangle, Eye, Plus 
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { useRouter } from "next/navigation"
import { authenticatedGet, authenticatedPost } from "@/lib/api-client"

interface Product {
  id: string
  qr_code: string
  weight_kg: number
  status: string
  supplier?: string
  unit_cost: number
}

interface StockMovement {
  id: string
  product_id: string
  from_status: string
  to_status: string
  movement_type: string
  reason?: string
  notes?: string
  reference_number?: string
  movement_date: string
  created_by: string
  products_simplified: Product
}

const statusOptions = [
  { value: "available", label: "Available", icon: Package, color: "bg-green-500" },
  { value: "sold", label: "Sold", icon: ShoppingCart, color: "bg-blue-500" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "bg-yellow-500" },
  { value: "damaged", label: "Damaged", icon: AlertTriangle, color: "bg-red-500" },
  { value: "missing", label: "Missing", icon: Eye, color: "bg-gray-500" },
]

const movementTypes = [
  { value: "status_change", label: "Status Change" },
  { value: "sale", label: "Sale" },
  { value: "purchase", label: "Purchase" },
  { value: "maintenance", label: "Maintenance" },
  { value: "damage", label: "Damage Report" },
  { value: "found", label: "Found" },
  { value: "lost", label: "Lost/Missing" },
]

export default function StockMovementsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState({
    product_id: "",
    to_status: "",
    movement_type: "",
    reason: "",
    notes: "",
    reference_number: "",
  })

  const [filters, setFilters] = useState({
    status: "all",
    weight: "all",
  })

  useEffect(() => {
    fetchMovements()
  }, [filters])

  const fetchMovements = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (filters.status && filters.status !== 'all') queryParams.set('status', filters.status)
      if (filters.weight && filters.weight !== 'all') queryParams.set('weight', filters.weight)
      
      const response = await authenticatedGet(`/api/stock-movements/simplified?${queryParams}`)
      
      if (response.status === 503) {
        const errorData = await response.json()
        if (errorData.code === 'TABLES_NOT_FOUND') {
          toast({
            title: "Database Setup Required",
            description: "Please run the database migration script in Supabase SQL Editor first.",
            variant: "destructive",
          })
          return
        }
      }
      
      if (!response.ok) throw new Error('Failed to fetch movements')
      
      const { movements } = await response.json()
      setMovements(movements || [])
    } catch (error) {
      console.error("Error fetching movements:", error)
      toast({
        title: "Error",
        description: "Failed to fetch stock movements",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQRScanRedirect = () => {
    router.push('/qr-scanner')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_id || !formData.to_status || !formData.movement_type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await authenticatedPost('/api/stock-movements/simplified', formData)

      if (response.status === 503) {
        const errorData = await response.json()
        if (errorData.code === 'TABLES_NOT_FOUND') {
          toast({
            title: "Database Setup Required",
            description: "Please run the database migration script in Supabase SQL Editor first.",
            variant: "destructive",
          })
          return
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create movement')
      }

      toast({
        title: "Success",
        description: "Stock movement recorded successfully",
      })

      // Reset form and refresh data
      setFormData({
        product_id: "",
        to_status: "",
        movement_type: "",
        reason: "",
        notes: "",
        reference_number: "",
      })
      setScannedProduct(null)
      setShowMovementForm(false)
      
      fetchMovements()
    } catch (error) {
      console.error("Error creating movement:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record movement",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status)
    if (!statusConfig) return <Badge variant="secondary">{status}</Badge>

    return (
      <Badge className={`${statusConfig.color} text-white`}>
        <statusConfig.icon className="h-3 w-3 mr-1" />
        {statusConfig.label}
      </Badge>
    )
  }

  return (
    <ProtectedRoute permission="stock_movements">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cylinder Management</h1>
              <p className="text-gray-600">Track individual cylinder status and movements</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleQRScanRedirect}>
                <Scan className="h-4 w-4 mr-2" />
                Scan QR Code
              </Button>
              <Button variant="outline" onClick={() => setShowMovementForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[11, 22, 50].map((weight) => (
              <Card key={weight}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{weight}kg Cylinders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Available:</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Sold:</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Maintenance:</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Damaged:</span>
                      <span className="font-medium">-</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Weight</Label>
                  <Select value={filters.weight} onValueChange={(value) => setFilters(prev => ({ ...prev, weight: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All weights" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All weights</SelectItem>
                      <SelectItem value="11">11kg</SelectItem>
                      <SelectItem value="22">22kg</SelectItem>
                      <SelectItem value="50">50kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movements Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Movements</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading movements...</div>
              ) : movements.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No movements found</h3>
                  <p className="text-gray-600 mb-4">Start by scanning QR codes to track cylinder movements</p>
                  <Button onClick={handleQRScanRedirect}>
                    <Scan className="h-4 w-4 mr-2" />
                    Scan First QR Code
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cylinder ID</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>From Status</TableHead>
                      <TableHead>To Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="font-mono text-sm">
                          {movement.products_simplified?.id || movement.product_id}
                        </TableCell>
                        <TableCell>
                          {movement.products_simplified?.weight_kg}kg
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(movement.from_status)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(movement.to_status)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {movementTypes.find(t => t.value === movement.movement_type)?.label || movement.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(movement.movement_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {movement.reason || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Movement Form Dialog */}
        <Dialog open={showMovementForm} onOpenChange={setShowMovementForm}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Movement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Product ID *</Label>
                <Input
                  value={formData.product_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                  placeholder="LPG-05285AWI1ES04"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Scan QR code or enter product ID manually
                </p>
              </div>
              
              <div>
                <Label>New Status *</Label>
                <Select 
                  value={formData.to_status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, to_status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Movement Type *</Label>
                <Select 
                  value={formData.movement_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, movement_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select movement type" />
                  </SelectTrigger>
                  <SelectContent>
                    {movementTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Reason</Label>
                <Input
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., Customer purchase, Routine maintenance"
                />
              </div>

              <div>
                <Label>Reference Number</Label>
                <Input
                  value={formData.reference_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Invoice, receipt, or reference number"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowMovementForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Recording..." : "Record Movement"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}