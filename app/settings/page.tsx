"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Building, Bell, Shield, Save, CheckCircle, AlertCircle } from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProtectedRoute from "@/components/auth/protected-route"
import { supabase } from "@/lib/supabase"

interface CompanySettings {
  companyName: string
  address: string
  phone: string
  email: string
  taxId: string
  currency: string
  timezone: string
}

interface NotificationSettings {
  lowStockAlerts: boolean
  emailNotifications: boolean
  stockMovementAlerts: boolean
  dailyReports: boolean
  lowStockThreshold: number
}

interface SystemSettings {
  autoBackup: boolean
  backupFrequency: string
  dataRetention: number
  maintenanceMode: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: "Petrogreen",
    address: "123 Business Street, City, Country",
    phone: "+1 234 567 8900",
    email: "info@petrogreen.com",
    taxId: "TAX123456789",
    currency: "PHP",
    timezone: "Asia/Manila",
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    lowStockAlerts: true,
    emailNotifications: false,
    stockMovementAlerts: true,
    dailyReports: false,
    lowStockThreshold: 10,
  })

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    autoBackup: true,
    backupFrequency: "weekly",
    dataRetention: 365,
    maintenanceMode: false,
  })

  useEffect(() => {
    // Load settings from Supabase database
    const loadSettings = async () => {
      try {
        // Try to get settings from the database
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (data && !error) {
          // Parse stored settings
          if (data.company_settings) {
            setCompanySettings(JSON.parse(data.company_settings))
          }
          if (data.notification_settings) {
            setNotificationSettings(JSON.parse(data.notification_settings))
          }
          if (data.system_settings) {
            setSystemSettings(JSON.parse(data.system_settings))
          }
        }
      } catch (err) {
        console.log("Settings not found in database, using defaults")
        // Keep default values if database doesn't have settings yet
      }
    }

    loadSettings()
  }, [])

  const handleSaveSettings = async () => {
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      // Prepare settings data for database
      const settingsData = {
        company_settings: JSON.stringify(companySettings),
        notification_settings: JSON.stringify(notificationSettings),
        system_settings: JSON.stringify(systemSettings),
        updated_at: new Date().toISOString(),
      }

      // Try to update existing settings first
      const { data: existingSettings } = await supabase
        .from("settings")
        .select("id")
        .limit(1)
        .single()

      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from("settings")
          .update(settingsData)
          .eq("id", existingSettings.id)

        if (updateError) throw updateError
      } else {
        // Insert new settings record
        const { error: insertError } = await supabase
          .from("settings")
          .insert([{
            ...settingsData,
            created_at: new Date().toISOString(),
          }])

        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("Failed to save settings:", err)
      setError("Failed to save settings. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const currencies = [
    { value: "PHP", label: "Philippine Peso (₱)" },
    { value: "USD", label: "US Dollar ($)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "British Pound (£)" },
  ]

  const timezones = [
    { value: "Asia/Manila", label: "Asia/Manila (GMT+8)" },
    { value: "America/New_York", label: "America/New_York (GMT-5)" },
    { value: "Europe/London", label: "Europe/London (GMT+0)" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo (GMT+9)" },
  ]

  return (
    <ProtectedRoute permission="manage_settings">
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Settings</h1>
                <p className="text-gray-600">Configure your LPG inventory system</p>
              </div>
            </div>
            <Button onClick={handleSaveSettings} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>

          {/* Success/Error Alerts */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Settings saved successfully!</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="company" className="space-y-4">
            <TabsList>
              <TabsTrigger value="company" className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Company</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>System</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="space-y-4">
              <Card className="border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardTitle className="flex items-center text-blue-900">
                    <Building className="h-5 w-5 mr-2" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companySettings.companyName}
                        onChange={(e) => setCompanySettings((prev) => ({ ...prev, companyName: e.target.value }))}
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={companySettings.phone}
                        onChange={(e) => setCompanySettings((prev) => ({ ...prev, phone: e.target.value }))}
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={companySettings.email}
                        onChange={(e) => setCompanySettings((prev) => ({ ...prev, email: e.target.value }))}
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        value={companySettings.taxId}
                        onChange={(e) => setCompanySettings((prev) => ({ ...prev, taxId: e.target.value }))}
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={companySettings.currency}
                        onValueChange={(value) => setCompanySettings((prev) => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={companySettings.timezone}
                        onValueChange={(value) => setCompanySettings((prev) => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((timezone) => (
                            <SelectItem key={timezone.value} value={timezone.value}>
                              {timezone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings((prev) => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card className="border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardTitle className="flex items-center text-blue-900">
                    <Bell className="h-5 w-5 mr-2" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Low Stock Alerts</Label>
                        <p className="text-sm text-gray-600">Get notified when products are running low</p>
                      </div>
                      <Switch
                        checked={notificationSettings.lowStockAlerts}
                        onCheckedChange={(checked) =>
                          setNotificationSettings((prev) => ({ ...prev, lowStockAlerts: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-600">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings((prev) => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Stock Movement Alerts</Label>
                        <p className="text-sm text-gray-600">Get notified of all stock movements</p>
                      </div>
                      <Switch
                        checked={notificationSettings.stockMovementAlerts}
                        onCheckedChange={(checked) =>
                          setNotificationSettings((prev) => ({ ...prev, stockMovementAlerts: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Daily Reports</Label>
                        <p className="text-sm text-gray-600">Receive daily inventory summary reports</p>
                      </div>
                      <Switch
                        checked={notificationSettings.dailyReports}
                        onCheckedChange={(checked) =>
                          setNotificationSettings((prev) => ({ ...prev, dailyReports: checked }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lowStockThreshold">Default Low Stock Threshold</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        min="1"
                        value={notificationSettings.lowStockThreshold}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            lowStockThreshold: Number.parseInt(e.target.value) || 10,
                          }))
                        }
                        className="border-blue-200 focus:border-blue-500 max-w-xs"
                      />
                      <p className="text-sm text-gray-600">Default threshold for new products</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <Card className="border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardTitle className="flex items-center text-blue-900">
                    <Shield className="h-5 w-5 mr-2" />
                    System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Automatic Backup</Label>
                        <p className="text-sm text-gray-600">Automatically backup data at regular intervals</p>
                      </div>
                      <Switch
                        checked={systemSettings.autoBackup}
                        onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, autoBackup: checked }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Backup Frequency</Label>
                      <Select
                        value={systemSettings.backupFrequency}
                        onValueChange={(value) => setSystemSettings((prev) => ({ ...prev, backupFrequency: value }))}
                        disabled={!systemSettings.autoBackup}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-500 max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataRetention">Data Retention (Days)</Label>
                      <Input
                        id="dataRetention"
                        type="number"
                        min="30"
                        max="3650"
                        value={systemSettings.dataRetention}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            dataRetention: Number.parseInt(e.target.value) || 365,
                          }))
                        }
                        className="border-blue-200 focus:border-blue-500 max-w-xs"
                      />
                      <p className="text-sm text-gray-600">How long to keep historical data</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Maintenance Mode</Label>
                        <p className="text-sm text-gray-600">Temporarily disable system for maintenance</p>
                      </div>
                      <Switch
                        checked={systemSettings.maintenanceMode}
                        onCheckedChange={(checked) =>
                          setSystemSettings((prev) => ({ ...prev, maintenanceMode: checked }))
                        }
                      />
                    </div>

                    {systemSettings.maintenanceMode && (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          <strong>Warning:</strong> Maintenance mode will restrict access to the system for regular
                          users.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
