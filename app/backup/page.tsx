"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Archive,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Database,
  Calendar,
  FileText,
} from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProtectedRoute from "@/components/auth/protected-route"
import { useProducts } from "@/hooks/use-products"
import { formatCurrency } from "@/lib/currency"
import { getStockMovements, supabase } from "@/lib/supabase"

export default function BackupPage() {
  const { products } = useProducts()
  const [backupProgress, setBackupProgress] = useState(0)
  const [restoreProgress, setRestoreProgress] = useState(0)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [backupSuccess, setBackupSuccess] = useState(false)
  const [restoreSuccess, setRestoreSuccess] = useState(false)

  // Initialize last backup from database
  useEffect(() => {
    const getLastBackupTime = async () => {
      try {
        const { data, error } = await supabase
          .from("backup_logs")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (data && !error) {
          setLastBackup(data.created_at)
        }
      } catch (err) {
        // No backup logs yet, keep as null
        console.log("No backup history found")
      }
    }

    getLastBackupTime()
  }, [])

  const handleBackup = async () => {
    setIsBackingUp(true)
    setBackupProgress(0)
    setBackupSuccess(false)

    try {
      // Fetch all data from Supabase
      setBackupProgress(10)
      const { data: stockMovements, error: stockError } = await getStockMovements()
      if (stockError) throw stockError

      setBackupProgress(50)
      // Get any settings from a settings table if it exists
      const { data: settings, error: settingsError } = await supabase
        .from("settings")
        .select("*")
      
      // Settings might not exist yet, so don't throw error
      const settingsData = settings || []

      setBackupProgress(70)
      // Create comprehensive backup data
      const backupData = {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        products: products,
        stockMovements: stockMovements || [],
        settings: settingsData,
        metadata: {
          totalProducts: products.length,
          totalStockMovements: stockMovements?.length || 0,
          totalValue: products.reduce((sum, p) => sum + (p.quantity || 0) * (p.unit_cost || 0), 0),
          backupSize: `${Math.round(JSON.stringify({
            products,
            stockMovements: stockMovements || [],
            settings: settingsData
          }).length / 1024)}KB`,
        },
      }

      setBackupProgress(90)
      // Save backup record to database
      const { error: logError } = await supabase
        .from("backup_logs")
        .insert([{
          backup_data: backupData,
          file_size_kb: Math.round(JSON.stringify(backupData).length / 1024),
          total_products: products.length,
          total_stock_movements: stockMovements?.length || 0,
          total_qr_codes: 0, // QR codes not used in simplified system
        }])

      if (logError) {
        console.warn("Could not save backup log:", logError)
        // Continue with backup even if logging fails
      }

      // Download backup file
      if (typeof window !== "undefined") {
        const backupJson = JSON.stringify(backupData, null, 2)
        const blob = new Blob([backupJson], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `petrogreen-backup-${new Date().toISOString().split("T")[0]}.json`
        a.click()
        window.URL.revokeObjectURL(url)

        setLastBackup(new Date().toISOString())
      }

      setBackupProgress(100)
      setBackupSuccess(true)
      setTimeout(() => setBackupSuccess(false), 5000)
    } catch (error) {
      console.error("Backup failed:", error)
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsRestoring(true)
    setRestoreProgress(0)
    setRestoreSuccess(false)

    try {
      setRestoreProgress(10)
      const fileContent = await file.text()
      const backupData = JSON.parse(fileContent)

      // Validate backup data
      if (!backupData.products || !Array.isArray(backupData.products)) {
        throw new Error("Invalid backup file format: missing products data")
      }

      setRestoreProgress(20)
      // Clear existing data and restore products
      const { error: deleteProductsError } = await supabase
        .from("products")
        .delete()
        .neq("id", "")

      if (deleteProductsError) throw deleteProductsError

      setRestoreProgress(40)
      // Insert restored products
      if (backupData.products.length > 0) {
        const { error: insertProductsError } = await supabase
          .from("products")
          .insert(backupData.products)

        if (insertProductsError) throw insertProductsError
      }

      setRestoreProgress(60)
      // Restore stock movements if they exist
      if (backupData.stockMovements && Array.isArray(backupData.stockMovements)) {
        const { error: deleteMovementsError } = await supabase
          .from("stock_movements")
          .delete()
          .neq("id", "")

        if (deleteMovementsError) throw deleteMovementsError

        if (backupData.stockMovements.length > 0) {
          const { error: insertMovementsError } = await supabase
            .from("stock_movements")
            .insert(backupData.stockMovements)

          if (insertMovementsError) throw insertMovementsError
        }
      }

      setRestoreProgress(90)
      // Restore settings if they exist
      if (backupData.settings && Array.isArray(backupData.settings)) {
        const { error: deleteSettingsError } = await supabase
          .from("settings")
          .delete()
          .neq("id", "")

        // Don't throw error if settings table doesn't exist
        if (backupData.settings.length > 0) {
          const { error: insertSettingsError } = await supabase
            .from("settings")
            .insert(backupData.settings)

          // Don't throw error if settings table doesn't exist
          if (insertSettingsError && !insertSettingsError.message.includes("relation")) {
            throw insertSettingsError
          }
        }
      }

      setRestoreProgress(100)
      setRestoreSuccess(true)
      setTimeout(() => {
        setRestoreSuccess(false)
        if (typeof window !== "undefined") {
          window.location.reload() // Refresh to load restored data
        }
      }, 2000)
    } catch (error) {
      console.error("Restore failed:", error)
      alert(`Restore failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsRestoring(false)
      event.target.value = "" // Reset file input
    }
  }

        const totalValue = products.reduce((sum, p) => sum + (p.quantity || 0) * (p.unit_cost || 0), 0)

  return (
    <ProtectedRoute permission="backup_restore">
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Archive className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Backup & Restore</h1>
              <p className="text-gray-600">Protect your LPG inventory data</p>
            </div>
          </div>

          {/* Success Alerts */}
          {backupSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Backup completed successfully! Your data has been downloaded.
              </AlertDescription>
            </Alert>
          )}

          {restoreSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Data restored successfully! The page will refresh to load the restored data.
              </AlertDescription>
            </Alert>
          )}

          {/* Backup Status */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Database className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-gray-600">Items to backup</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <FileText className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-gray-600">Inventory value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                <Calendar className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {lastBackup ? new Date(lastBackup).toLocaleDateString() : "Never"}
                </div>
                <div className="text-xs text-gray-600">
                  {lastBackup ? (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Up to date
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                      No backup
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Backup Section */}
          <Card className="border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="flex items-center text-blue-900">
                <Download className="h-5 w-5 mr-2" />
                Create Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-gray-600">
                  Create a complete backup of your inventory data, settings, and configurations. The backup file will be
                  downloaded to your device.
                </p>

                {isBackingUp && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Creating backup...</span>
                      <span>{backupProgress}%</span>
                    </div>
                    <Progress value={backupProgress} className="w-full" />
                  </div>
                )}

                <Button onClick={handleBackup} disabled={isBackingUp} className="bg-blue-600 hover:bg-blue-700">
                  {isBackingUp ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Create Backup
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Restore Section */}
          <Card className="border-orange-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardTitle className="flex items-center text-orange-800">
                <Upload className="h-5 w-5 mr-2" />
                Restore from Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Warning:</strong> Restoring from backup will replace all current data. Make sure to create a
                    backup of your current data first.
                  </AlertDescription>
                </Alert>

                <p className="text-gray-600">
                  Select a backup file to restore your inventory data. Only JSON backup files created by Petrogreen are
                  supported.
                </p>

                {isRestoring && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Restoring data...</span>
                      <span>{restoreProgress}%</span>
                    </div>
                    <Progress value={restoreProgress} className="w-full" />
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    disabled={isRestoring}
                    className="hidden"
                    id="restore-file"
                  />
                  <label htmlFor="restore-file">
                    <Button
                      variant="outline"
                      disabled={isRestoring}
                      className="cursor-pointer hover:bg-orange-50 border-orange-200 bg-transparent"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Select Backup File
                        </>
                      )}
                    </Button>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup Information */}
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-gray-800">Backup Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>What's included in backups:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>All product inventory data</li>
                  <li>Complete stock movement history</li>
                  <li>System settings and preferences</li>
                  <li>Database metadata and timestamps</li>
                </ul>
                <p className="mt-4">
                  <strong>Backup file format:</strong> JSON (.json)
                </p>
                <p>
                  <strong>Recommended frequency:</strong> Weekly or after major changes
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}