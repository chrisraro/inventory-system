// Environment validation utility
import logger from "@/lib/logger"

interface EnvironmentVariables {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  [key: string]: string | undefined
}

interface ValidationResult {
  isValid: boolean
  missing: string[]
  invalid: string[]
  warnings: string[]
}

export const validateEnvironment = (): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    missing: [],
    invalid: [],
    warnings: []
  }

  // Check required environment variables
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ]

  // Check if variables are present
  for (const variable of required) {
    if (!process.env[variable]) {
      result.missing.push(variable)
      result.isValid = false
    }
  }

  // Validate Supabase URL format
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
      if (url.protocol !== "https:") {
        result.warnings.push("NEXT_PUBLIC_SUPABASE_URL should use HTTPS in production")
      }
    } catch (error) {
      result.invalid.push("NEXT_PUBLIC_SUPABASE_URL is not a valid URL")
      result.isValid = false
    }
  }

  // Check for demo mode
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    result.warnings.push("Running in demo mode - no Supabase connection configured")
  }

  // Log validation results
  if (!result.isValid) {
    logger.error("Environment validation failed", {
      missing: result.missing,
      invalid: result.invalid
    })
  } else if (result.warnings.length > 0) {
    logger.warn("Environment validation has warnings", {
      warnings: result.warnings
    })
  } else {
    logger.info("Environment validation passed")
  }

  return result
}

export const formatValidationResult = (result: ValidationResult): string => {
  const lines: string[] = []

  if (result.isValid) {
    lines.push("✅ Environment validation passed")
  } else {
    lines.push("❌ Environment validation failed")
  }

  if (result.missing.length > 0) {
    lines.push("\nMissing required environment variables:")
    result.missing.forEach(variable => lines.push(`  - ${variable}`))
  }

  if (result.invalid.length > 0) {
    lines.push("\nInvalid environment variables:")
    result.invalid.forEach(variable => lines.push(`  - ${variable}`))
  }

  if (result.warnings.length > 0) {
    lines.push("\nWarnings:")
    result.warnings.forEach(warning => lines.push(`  - ${warning}`))
  }

  return lines.join("\n")
}

export default {
  validateEnvironment,
  formatValidationResult
}