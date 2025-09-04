import { Product, StockMovement } from "@/lib/supabase"

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export const validateProduct = (product: Partial<Product>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Check if product is defined
  if (!product) {
    errors.push("Product data is required")
    return { isValid: false, errors }
  }

  // Validate required fields
  if (!product.name?.trim()) {
    errors.push("Product name is required")
  }

  if (!product.brand?.trim()) {
    errors.push("Brand is required")
  }

  // Validate weight (can be null for non-LPG products)
  if (product.weight_kg !== undefined && product.weight_kg !== null && product.weight_kg <= 0) {
    errors.push("Valid weight is required")
  }

  // Validate quantity
  if (product.quantity === undefined || product.quantity < 0) {
    errors.push("Quantity must be 0 or greater")
  }

  // Validate unit cost (updated field name)
  if (product.unit_cost === undefined || product.unit_cost < 0) {
    errors.push("Unit cost must be 0 or greater")
  }

  // Validate thresholds
  if (product.min_threshold === undefined || product.min_threshold < 0) {
    errors.push("Minimum threshold must be 0 or greater")
  }

  if (product.max_threshold === undefined || product.max_threshold < 0) {
    errors.push("Maximum threshold must be 0 or greater")
  }

  if (
    product.min_threshold !== undefined &&
    product.max_threshold !== undefined &&
    product.min_threshold > product.max_threshold
  ) {
    errors.push("Minimum threshold cannot be greater than maximum threshold")
  }

  return { isValid: errors.length === 0, errors }
}

export const validateStockMovement = (movement: Partial<StockMovement>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Required fields
  if (!movement.product_id) {
    errors.push("Product ID is required")
  }
  
  if (!movement.movement_type) {
    errors.push("Movement type is required")
  }
  
  if (!["in", "out", "adjustment"].includes(movement.movement_type)) {
    errors.push("Invalid movement type")
  }
  
  if (movement.quantity === undefined || movement.quantity <= 0) {
    errors.push("Valid quantity is required")
  }
  
  if (!movement.reason?.trim()) {
    errors.push("Reason is required")
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const formatWeight = (weight: number): string => {
  if (weight % 1 === 0) {
    return `${weight}kg`
  }
  return `${weight.toFixed(1)}kg`
}

export const getThresholdByWeight = (weight: number): number => {
  if (weight <= 2.5) return 5
  if (weight <= 5) return 8
  if (weight <= 11) return 10
  if (weight <= 22) return 15
  if (weight <= 50) return 20
  return 25
}

export const validateLPGProduct = (product: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // First validate basic product requirements
  const basicValidation = validateProduct(product)
  errors.push(...basicValidation.errors)
  
  // Validate LPG-specific requirements
  if (!product.brand || !LPG_BRANDS.includes(product.brand)) {
    errors.push(`Invalid brand. Must be one of: ${LPG_BRANDS.join(", ")}`)
  }
  
  if (product.weight_kg && !LPG_WEIGHTS.some(w => w.value === product.weight_kg)) {
    errors.push(`Invalid weight. Must be one of: ${LPG_WEIGHTS.map(w => w.label).join(", ")}`)
  }
  
  return { isValid: errors.length === 0, errors }
}

export const LPG_WEIGHTS = [
  { value: 2.5, label: "2.5kg Canister", threshold: 5 },
  { value: 5.0, label: "5kg Cylinder", threshold: 8 },
  { value: 11.0, label: "11kg Cylinder", threshold: 10 },
  { value: 22.0, label: "22kg Cylinder", threshold: 15 },
  { value: 50.0, label: "50kg Cylinder", threshold: 20 },
]

export const LPG_BRANDS = [
  "Petron Gasul",
  "Shell LPG",
  "Caltex",
  "Total LPG",
  "Solane",
  "Phoenix Petroleum",
  "Liquigaz",
  "Other"
]

export const SUPPLIERS = [
  "Petron Corporation",
  "Shell Philippines",
  "Caltex Philippines",
  "Total Philippines",
  "Phoenix Petroleum",
  "Local Distributor",
  "Other"
]

export const UNIT_TYPES = ["pieces", "kg", "liters", "units"]

export const USER_CREDENTIALS = {
  username: "admin@petrogreen.com",
  password: "PetrogreenAdmin2024!"
}