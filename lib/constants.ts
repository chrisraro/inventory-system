// LPG-specific unit types
export const UNIT_TYPES = [{ value: "kg", label: "Kilograms (kg)" }] as const

// LPG cylinder weights (in kg)
export const LPG_WEIGHTS = [
  { value: 2.7, label: "2.7 kg" },
  { value: 11, label: "11 kg" },
  { value: 22, label: "22 kg" },
  { value: 50, label: "50 kg" },
] as const

// LPG brands available in Philippines
export const LPG_BRANDS = ["Petron Gasul", "Shell LPG", "Solane", "Total LPG", "Liquigaz", "Generic"] as const

// LPG suppliers in Philippines
export const SUPPLIERS = [
  {
    id: "petron-001",
    name: "Petron Corporation",
    contact: "Juan Dela Cruz",
    phone: "+63-2-8886-3888",
    email: "lpg@petron.com",
    address: "Petron Megaplaza, 358 Sen. Gil Puyat Ave, Makati City",
    brands: ["Petron Gasul"],
  },
  {
    id: "shell-001",
    name: "Pilipinas Shell Petroleum Corporation",
    contact: "Maria Santos",
    phone: "+63-2-8789-8888",
    email: "lpg@shell.com.ph",
    address: "Shell House, 156 Valero St, Salcedo Village, Makati City",
    brands: ["Shell LPG"],
  },
  {
    id: "solane-001",
    name: "Isla LPG Corporation",
    contact: "Roberto Garcia",
    phone: "+63-2-8631-8888",
    email: "info@solane.com.ph",
    address: "7th Floor, Petron Megaplaza, 358 Sen. Gil Puyat Ave, Makati City",
    brands: ["Solane"],
  },
  {
    id: "total-001",
    name: "Total Philippines Corporation",
    contact: "Ana Reyes",
    phone: "+63-2-8845-4000",
    email: "lpg@total.com.ph",
    address: "26th Floor, Net Lima Plaza, 5th Ave cor 26th St, BGC, Taguig City",
    brands: ["Total LPG"],
  },
  {
    id: "liquigaz-001",
    name: "Liquigaz Philippines Corporation",
    contact: "Carlos Mendoza",
    phone: "+63-2-8856-2000",
    email: "info@liquigaz.com.ph",
    address: "15th Floor, Antel Global Corporate Center, Julia Vargas Ave, Ortigas Center, Pasig City",
    brands: ["Liquigaz"],
  },
] as const

// Demo user credentials
export const USER_CREDENTIALS = {
  admin: {
    email: "admin@petrogreen.com",
    password: "admin123",
    role: "admin" as const,
    name: "Administrator"
  },
  stockman: {
    email: "stockman@petrogreen.com",
    password: "stock123",
    role: "stockman" as const,
    name: "Stock Manager"
  }
} as const

// Stock status thresholds
export const STOCK_THRESHOLDS = {
  LOW: 10,
  CRITICAL: 5,
} as const

// Movement types
export const MOVEMENT_TYPES = [
  { value: "in", label: "Stock In", color: "text-green-600" },
  { value: "out", label: "Stock Out", color: "text-red-600" },
  { value: "adjustment", label: "Adjustment", color: "text-blue-600" },
  { value: "transfer", label: "Transfer", color: "text-purple-600" },
] as const

// QR Code configuration
export const QR_CODE_CONFIG = {
  size: 256,
  level: "M" as const,
  includeMargin: true,
  fgColor: "#000000",
  bgColor: "#FFFFFF",
}

// PDF export configuration
export const PDF_CONFIG = {
  format: "a4" as const,
  orientation: "portrait" as const,
  unit: "mm" as const,
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
}

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount)
}

export const formatWeight = (weight: number): string => {
  return `${weight} kg`
}

export const getStockStatus = (currentStock: number, threshold: number = STOCK_THRESHOLDS.LOW) => {
  if (currentStock <= STOCK_THRESHOLDS.CRITICAL) {
    return { status: "critical", color: "text-red-600", bgColor: "bg-red-50" }
  } else if (currentStock <= threshold) {
    return { status: "low", color: "text-yellow-600", bgColor: "bg-yellow-50" }
  }
  return { status: "normal", color: "text-green-600", bgColor: "bg-green-50" }
}

// Get threshold by weight (larger cylinders need higher thresholds)
export const getThresholdByWeight = (weight: number): number => {
  if (weight >= 50) return 20
  if (weight >= 22) return 15
  if (weight >= 11) return 10
  return 5 // For 2.7kg and smaller
}

// Get product display name
export const getProductDisplayName = (product: { name: string; brand?: string; weight_kg?: number }): string => {
  const parts = [product.name]
  if (product.brand && product.brand !== "Generic") {
    parts.push(`(${product.brand})`)
  }
  if (product.weight_kg) {
    parts.push(`- ${formatWeight(product.weight_kg)}`)
  }
  return parts.join(" ")
}

// Generate SKU for LPG products
export const generateLPGSKU = (brand: string, weight: number): string => {
  const brandCode = brand.replace(/\s+/g, "").substring(0, 3).toUpperCase()
  const weightCode = weight.toString().replace(".", "")
  const timestamp = Date.now().toString().slice(-4)
  return `${brandCode}-${weightCode}KG-${timestamp}`
}

// Validate LPG product data
export const validateLPGProduct = (product: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!product.name || product.name.trim().length === 0) {
    errors.push("Product name is required")
  }

  if (!product.weight_kg || product.weight_kg <= 0) {
    errors.push("Weight must be greater than 0")
  }

  if (!LPG_WEIGHTS.some((w) => w.value === product.weight_kg)) {
    errors.push("Invalid LPG weight. Must be one of: " + LPG_WEIGHTS.map((w) => w.label).join(", "))
  }

  if (product.brand && !LPG_BRANDS.includes(product.brand)) {
    errors.push("Invalid brand. Must be one of: " + LPG_BRANDS.join(", "))
  }

  if (product.quantity < 0) {
    errors.push("Current stock cannot be negative")
  }

  if (product.unit_cost && product.unit_cost < 0) {
    errors.push("Unit cost cannot be negative")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export default {
  UNIT_TYPES,
  LPG_WEIGHTS,
  LPG_BRANDS,
  SUPPLIERS,
  USER_CREDENTIALS,
  STOCK_THRESHOLDS,
  MOVEMENT_TYPES,
  QR_CODE_CONFIG,
  PDF_CONFIG,
  formatCurrency,
  formatWeight,
  getStockStatus,
  getThresholdByWeight,
  getProductDisplayName,
  generateLPGSKU,
  validateLPGProduct,
}
