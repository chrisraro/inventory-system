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
  refreshSession?: () => Promise<{ success: boolean; error?: string; data?: any }> // Add refreshSession to the interface
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
  stockman: [
    "view_dashboard",
    "add_product",
    "edit_product",
    "delete_product", // Allow stockman to delete their own products
    "stock_movements",
    "view_reports"
  ],
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
      console.log("Auth state change:", event, session ? `User: ${session.user?.id}` : "No session") // Debug log
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("User signed in:", session.user.id)
          const userProfile = await getUserProfile(session.user)
          setUser(userProfile)
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out")
          setUser(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log("Token refreshed for user:", session.user.id)
          // Handle token refresh
          const userProfile = await getUserProfile(session.user)
          setUser(userProfile)
        } else if (event === 'USER_UPDATED' && session?.user) {
          console.log("User updated:", session.user.id)
          // Handle user profile updates
          const userProfile = await getUserProfile(session.user)
          setUser(userProfile)
        } else if (event === 'INITIAL_SESSION') {
          console.log("Initial session:", session ? `User: ${session.user?.id}` : "No session")
          // Handle initial session
          if (session?.user) {
            const userProfile = await getUserProfile(session.user)
            setUser(userProfile)
          } else {
            setUser(null)
          }
        } else if (event === 'MFA_CHALLENGE_VERIFIED') {
          console.log("MFA challenge verified")
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log("Password recovery")
        } else {
          console.log("Unhandled auth event:", event)
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error)
        // If there's an error in the auth state change handler, sign out the user
        // to prevent being stuck in an invalid state
        try {
          await supabase.auth.signOut()
        } catch (signOutError) {
          console.error("Error signing out after auth error:", signOutError)
        }
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Function to refresh the session manually
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error("Error refreshing session:", error)
        // If refresh fails, sign out the user
        await signOut()
        return { success: false, error }
      }
      
      if (data.session?.user) {
        const userProfile = await getUserProfile(data.session.user)
        setUser(userProfile)
        return { success: true, data }
      }
      
      return { success: false, error: "No session found after refresh" }
    } catch (error) {
      console.error("Error in refreshSession:", error)
      // If refresh fails, sign out the user
      await signOut()
      return { success: false, error: "Failed to refresh session" }
    }
  }

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
          // Sign out if user profile not found
          await supabase.auth.signOut()
          return { success: false, error: "User profile not found or account deactivated" }
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
    refreshSession, // Add refreshSession to the context value
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