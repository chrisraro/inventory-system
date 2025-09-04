// Error handling utilities
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, details)
    this.name = "ValidationError"
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, "FORBIDDEN", 403)
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not Found") {
    super(message, "NOT_FOUND", 404)
    this.name = "NotFoundError"
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "DATABASE_ERROR", 500, details)
    this.name = "DatabaseError"
  }
}

// Error handler for API responses
export const handleApiError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, "INTERNAL_ERROR", 500)
  }
  
  return new AppError("An unknown error occurred", "UNKNOWN_ERROR", 500)
}

// Format error for user display
export const formatErrorForUser = (error: AppError): string => {
  switch (error.code) {
    case "VALIDATION_ERROR":
      return `Validation failed: ${error.message}`
    case "UNAUTHORIZED":
      return "You need to be logged in to perform this action"
    case "FORBIDDEN":
      return "You don't have permission to perform this action"
    case "NOT_FOUND":
      return "The requested resource was not found"
    case "DATABASE_ERROR":
      return "A database error occurred. Please try again later."
    default:
      return "An unexpected error occurred. Please try again later."
  }
}

// Log error for debugging
export const logError = (error: Error, context?: Record<string, any>) => {
  console.error("Application Error:", {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context
  })
}

export default {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  DatabaseError,
  handleApiError,
  formatErrorForUser,
  logError
}