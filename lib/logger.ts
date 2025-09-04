// Logging utility
export type LogLevel = "error" | "warn" | "info" | "debug"

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private minLevel: LogLevel = "info"
  
  constructor(minLevel?: LogLevel) {
    if (minLevel) {
      this.minLevel = minLevel
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["error", "warn", "info", "debug"]
    return levels.indexOf(level) <= levels.indexOf(this.minLevel)
  }
  
  private formatLog(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString()
    const context = entry.context ? JSON.stringify(entry.context) : ""
    const error = entry.error ? `
Error: ${entry.error.message}
Stack: ${entry.error.stack}` : ""
    
    return `[${timestamp}] ${entry.level.toUpperCase()}: ${entry.message} ${context}${error}`
  }
  
  error(message: string, context?: Record<string, any>, error?: Error) {
    if (this.shouldLog("error")) {
      const entry: LogEntry = { level: "error", message, timestamp: new Date(), context, error }
      console.error(this.formatLog(entry))
    }
  }
  
  warn(message: string, context?: Record<string, any>) {
    if (this.shouldLog("warn")) {
      const entry: LogEntry = { level: "warn", message, timestamp: new Date(), context }
      console.warn(this.formatLog(entry))
    }
  }
  
  info(message: string, context?: Record<string, any>) {
    if (this.shouldLog("info")) {
      const entry: LogEntry = { level: "info", message, timestamp: new Date(), context }
      console.info(this.formatLog(entry))
    }
  }
  
  debug(message: string, context?: Record<string, any>) {
    if (this.shouldLog("debug")) {
      const entry: LogEntry = { level: "debug", message, timestamp: new Date(), context }
      console.debug(this.formatLog(entry))
    }
  }
  
  // Specialized logging methods for common operations
  logUserAction(userId: string, action: string, details?: Record<string, any>) {
    this.info(`User Action: ${action}`, { userId, ...details })
  }
  
  logDatabaseOperation(operation: string, table: string, details?: Record<string, any>) {
    this.info(`Database Operation: ${operation}`, { table, ...details })
  }
  
  logApiCall(method: string, endpoint: string, status: number, details?: Record<string, any>) {
    this.info(`API Call: ${method} ${endpoint}`, { status, ...details })
  }
}

// Create a default logger instance
const logger = new Logger(process.env.NODE_ENV === "development" ? "debug" : "info")

export default logger