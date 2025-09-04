// Health check utility
import { supabase, isDemoMode } from "@/lib/supabase"
import logger from "@/lib/logger"

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: Date
  checks: {
    database: {
      status: "healthy" | "unhealthy"
      message: string
      latency?: number
    }
    supabaseAuth: {
      status: "healthy" | "unhealthy"
      message: string
    }
    demoMode: {
      status: "info"
      message: string
    }
  }
}

export const performHealthCheck = async (): Promise<HealthCheckResult> => {
  const result: HealthCheckResult = {
    status: "healthy",
    timestamp: new Date(),
    checks: {
      database: {
        status: "healthy",
        message: "Database connection successful"
      },
      supabaseAuth: {
        status: "healthy",
        message: "Supabase Auth is accessible"
      },
      demoMode: {
        status: "info",
        message: isDemoMode ? "Running in demo mode" : "Connected to Supabase"
      }
    }
  }

  // Check database connectivity
  try {
    const startTime = Date.now()
    const { data, error } = await supabase
      .from("products")
      .select("count()")
      .limit(1)
    
    const latency = Date.now() - startTime
    
    if (error) {
      result.checks.database = {
        status: "unhealthy",
        message: `Database query failed: ${error.message}`,
        latency
      }
      result.status = "unhealthy"
    } else {
      result.checks.database = {
        status: "healthy",
        message: "Database query successful",
        latency
      }
    }
  } catch (error) {
    result.checks.database = {
      status: "unhealthy",
      message: `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`
    }
    result.status = "unhealthy"
  }

  // Check Supabase Auth
  try {
    // This is a lightweight check that doesn't require authentication
    const { data } = await supabase.rpc("version")
    // We're just testing if we can make an RPC call
    result.checks.supabaseAuth = {
      status: "healthy",
      message: "Supabase Auth RPC endpoint is accessible"
    }
  } catch (error) {
    result.checks.supabaseAuth = {
      status: "unhealthy",
      message: `Supabase Auth check failed: ${error instanceof Error ? error.message : "Unknown error"}`
    }
    result.status = "degraded"
  }

  // Log health check result
  logger.info("Health check completed", {
    status: result.status,
    database: result.checks.database.status,
    auth: result.checks.supabaseAuth.status
  })

  return result
}

export const formatHealthCheckResult = (result: HealthCheckResult): string => {
  const statusEmoji = {
    healthy: "✅",
    degraded: "⚠️",
    unhealthy: "❌"
  }
  
  const databaseEmoji = result.checks.database.status === "healthy" ? "✅" : "❌"
  const authEmoji = result.checks.supabaseAuth.status === "healthy" ? "✅" : "❌"
  const demoEmoji = isDemoMode ? "⚠️" : "✅"
  
  return `
${statusEmoji[result.status]} Application Status: ${result.status.toUpperCase()}

${databaseEmoji} Database: ${result.checks.database.message} ${result.checks.database.latency ? `(Latency: ${result.checks.database.latency}ms)` : ""}
${authEmoji} Supabase Auth: ${result.checks.supabaseAuth.message}
${demoEmoji} Mode: ${result.checks.demoMode.message}
  `.trim()
}

export default {
  performHealthCheck,
  formatHealthCheckResult
}