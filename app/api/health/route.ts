import { NextRequest, NextResponse } from "next/server"
import { performHealthCheck, formatHealthCheckResult } from "@/lib/health-check"
import logger from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const result = await performHealthCheck()
    
    // For detailed health check, return JSON
    if (request.headers.get("Accept") === "application/json") {
      return NextResponse.json(result, { 
        status: result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503 
      })
    }
    
    // For simple health check, return plain text
    const formattedResult = formatHealthCheckResult(result)
    return new NextResponse(formattedResult, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      },
      status: result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503
    })
  } catch (error) {
    logger.error("Health check failed", {}, error instanceof Error ? error : undefined)
    
    return new NextResponse("Health check failed", {
      status: 500
    })
  }
}