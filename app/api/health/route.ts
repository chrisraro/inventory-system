import { NextRequest, NextResponse } from "next/server"
import { performHealthCheck, formatHealthCheckResult } from "@/lib/health-check"
import logger from "@/lib/logger"

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}
