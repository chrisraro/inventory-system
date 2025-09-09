"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { supabase } from "@/lib/supabase"

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: "admin" | "stockman"
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    role: "stockman" as "admin" | "stockman",
    is_active: true,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Use the supabaseAdmin client to ensure we can fetch all users
      // This is important for admin functionality
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, role: "admin" | "stockman") => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (error) throw error

      toast({
        title: "Success",
        description: "User role updated successfully",
      })

      fetchUsers()
    } catch (error) {
      console.error("Error updating user role:", error)
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      })
    }
  }

  const updateUserStatus = async (userId: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (error) throw error

      toast({
        title: "Success",
        description: `User ${is_active ? "activated" : "deactivated"} successfully`,
      })

      fetchUsers()
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error",
        description: `Failed to ${is_active ? "activate" : "deactivate"} user`,
        variant: "destructive",
      })
    }
  }

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: editingUser.full_name,
          role: editingUser.role,
          is_active: editingUser.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingUser.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleCreateUser = async () => {
    // In a real application, you would integrate with Supabase Auth admin APIs
    // to create users. For now, we'll show a message.
    toast({
      title: "Info",
      description: "User creation should be done through Supabase Dashboard or Auth Admin APIs",
    })
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <ProtectedRoute permission="manage_users">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p>Access denied. Admin privileges required.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute permission="manage_users">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user roles and permissions</p>
          </div>

          {/* Create User Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Note: User creation should be done through the Supabase Authentication dashboard. 
                After creating a user there, you can assign roles and manage permissions here.
              </p>
              <Button onClick={handleCreateUser}>Instructions for Creating Users</Button>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>User List</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        {editingUser?.id === user.id ? (
                          <>
                            <TableCell>
                              <Input
                                value={editingUser.full_name}
                                onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Select
                                value={editingUser.role}
                                onValueChange={(value) => setEditingUser({ ...editingUser, role: value as "admin" | "stockman" })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="stockman">Stock Manager</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={editingUser.is_active}
                                  onCheckedChange={(checked) => setEditingUser({ ...editingUser, is_active: checked })}
                                />
                                <span>{editingUser.is_active ? "Active" : "Inactive"}</span>
                              </div>
                            </TableCell>
                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" onClick={handleSaveUser}>
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{user.full_name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                {user.role === "admin" ? "Admin" : "Stock Manager"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.is_active ? "default" : "destructive"}>
                                {user.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" onClick={() => handleEditUser(user)}>
                                  Edit
                                </Button>
                                {user.role === "stockman" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateUserRole(user.id, "admin")}
                                  >
                                    Make Admin
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateUserRole(user.id, "stockman")}
                                  >
                                    Make Stock Manager
                                  </Button>
                                )}
                                <Switch
                                  checked={user.is_active}
                                  onCheckedChange={(checked) => updateUserStatus(user.id, checked)}
                                />
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}