"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Mail, Fuel, Shield, Package, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedRole, setSelectedRole] = useState("admin")
  const { signIn, user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  // Auto-fill credentials based on selected role (for demo purposes)
  useEffect(() => {
    if (selectedRole === "admin") {
      setEmail("admin@petrogreen.com")
      setPassword("admin123")
    } else {
      setEmail("stockman@petrogreen.com")
      setPassword("stock123")
    }
  }, [selectedRole])

    const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn(email, password)
      
      if (result.success) {
        router.push("/")
      } else {
        setError(result.error || "Invalid email or password")
      }
    } catch (err) {
      setError("An error occurred during login")
      console.error("Login error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
              <Fuel className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-blue-900">Petrogreen</CardTitle>
            <CardDescription className="text-blue-600">LPG Inventory Management System</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRole} onValueChange={setSelectedRole} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Administrator</span>
              </TabsTrigger>
              <TabsTrigger value="stockman" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Stock Manager</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="admin" className="mt-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">Administrator Access</p>
                <p className="text-xs text-blue-700">
                  Full system access including product management, reports, and settings
                </p>
              </div>
            </TabsContent>
            <TabsContent value="stockman" className="mt-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-900 mb-1">Stock Manager Access</p>
                <p className="text-xs text-green-700">
                  Specialized access for stock movements, incoming/outgoing inventory tracking
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="border-blue-200 focus:border-blue-500 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-3">Demo Credentials:</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-800">Administrator:</p>
                <p className="text-xs text-blue-700">
                  <strong>Email:</strong> admin@petrogreen.com
                </p>
                <p className="text-xs text-blue-700">
                  <strong>Password:</strong> admin123
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-green-800">Stock Manager:</p>
                <p className="text-xs text-green-700">
                  <strong>Email:</strong> stockman@petrogreen.com
                </p>
                <p className="text-xs text-green-700">
                  <strong>Password:</strong> stock123
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
