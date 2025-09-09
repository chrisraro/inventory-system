"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface User {
  id: string
  email: string
  name: string
  role: "admin" | "stockman"
}

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Permission mapping based on user roles
const PERMISSIONS = {
  admin: [
    "view_dashboard",
    "add_product",
    "edit_product",
    "delete_product",
    "stock_movements",
    "view_reports",
    "backup_restore",
    "manage_settings",
    "manage_users",
    "view_costing",
    "manage_costing",
  ],
  stockman: ["view_dashboard", "add_product", "edit_product", "stock_movements", "view_reports"],
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Get user profile from Supabase
  const getUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      // Ensure the user is active
      if (!profile.is_active) {
        console.warn("User account is deactivated")
        return null
      }

      return {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        role: profile.role,
      }
    } catch (error) {
      console.error("Error in getUserProfile:", error)
      return null
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Error getting session:", error)
          setLoading(false)
          return
        }

        if (session?.user) {
          const userProfile = await getUserProfile(session.user)
          setUser(userProfile)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userProfile = await getUserProfile(session.user)
        setUser(userProfile)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        const userProfile = await getUserProfile(data.user)
        if (userProfile) {
          setUser(userProfile)
          return { success: true }
        } else {
          return { success: false, error: "User profile not found" }
        }
      }

      return { success: false, error: "Authentication failed" }
    } catch (error) {
      console.error("Sign in error:", error)
      return { success: false, error: "An error occurred during sign in" }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Error signing out:", error)
      }
      setUser(null)
    } catch (error) {
      console.error("Sign out error:", error)
      setUser(null)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    return PERMISSIONS[user.role]?.includes(permission) || false
  }

  const value: AuthContextType = {
    user,
    signIn,
    signOut,
    hasPermission,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
