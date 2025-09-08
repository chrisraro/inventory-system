import { NextRequest, NextFetchEvent, NextResponse } from "next/server"
import logger from "@/lib/logger"

// Simple in-memory store for rate limiting
// In production, you would use Redis or a similar external store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // Max 100 requests per window

// Security headers
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "microphone=(), geolocation=(), camera=*"
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"
  const path = request.nextUrl.pathname

  // Log incoming request
  logger.info("Incoming request", {
    method: request.method,
    path,
    ip,
    userAgent
  })

  // Apply security headers to all responses
  const response = NextResponse.next()
  
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Skip rate limiting for static assets
  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.endsWith(".png") ||
    path.endsWith(".jpg") ||
    path.endsWith(".jpeg") ||
    path.endsWith(".gif") ||
    path.endsWith(".css") ||
    path.endsWith(".js")
  ) {
    return response
  }

  // Apply rate limiting
  const rateLimitKey = `${ip}:${path}`
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW

  const rateLimitData = rateLimitStore.get(rateLimitKey) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW }

  // Reset count if window has passed
  if (rateLimitData.resetTime < now) {
    rateLimitData.count = 0
    rateLimitData.resetTime = now + RATE_LIMIT_WINDOW
  }

  // Check rate limit
  if (rateLimitData.count >= RATE_LIMIT_MAX_REQUESTS) {
    logger.warn("Rate limit exceeded", {
      ip,
      path,
      count: rateLimitData.count,
      resetTime: rateLimitData.resetTime
    })

    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: "Too many requests, please try again later"
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...SECURITY_HEADERS
        }
      }
    )
  }

  // Increment request count
  rateLimitData.count++
  rateLimitStore.set(rateLimitKey, rateLimitData)

  // Clean up old entries periodically
  if (Math.random() < 0.1) { // 10% chance to clean up
    cleanUpRateLimitStore(windowStart)
  }

  return response
}

function cleanUpRateLimitStore(windowStart: number) {
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < windowStart) {
      rateLimitStore.delete(key)
    }
  }
}

// Configure which paths to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}