import { validateProduct, validateStockMovement, validateLPGProduct } from "@/lib/validation"

describe("Validation Utilities", () => {
  describe("validateProduct", () => {
    it("should validate a correct product", () => {
      const product = {
        name: "Test Product",
        brand: "Test Brand",
        weight_kg: 11,
        unit_type: "kg",
        quantity: 10,
        unit_cost: 100,
        min_threshold: 5,
        max_threshold: 20
      }
      
      const result = validateProduct(product)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it("should reject product with missing name", () => {
      const product = {
        brand: "Test Brand",
        weight_kg: 11,
        unit_type: "kg",
        quantity: 10,
        unit_cost: 100,
        min_threshold: 5,
        max_threshold: 20
      }
      
      const result = validateProduct(product)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Product name is required")
    })
    
    it("should reject product with invalid weight", () => {
      const product = {
        name: "Test Product",
        brand: "Test Brand",
        weight_kg: -5,
        unit_type: "kg",
        quantity: 10,
        unit_cost: 100,
        min_threshold: 5,
        max_threshold: 20
      }
      
      const result = validateProduct(product)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Valid weight is required")
    })
  })
  
  describe("validateStockMovement", () => {
    it("should validate a correct stock movement", () => {
      const movement = {
        product_id: "product-1",
        movement_type: "in",
        quantity: 5,
        reason: "Purchase"
      }
      
      const result = validateStockMovement(movement)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it("should reject movement with invalid type", () => {
      const movement = {
        product_id: "product-1",
        movement_type: "invalid",
        quantity: 5,
        reason: "Purchase"
      }
      
      const result = validateStockMovement(movement)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Invalid movement type")
    })
  })
  
  describe("validateLPGProduct", () => {
    it("should validate a correct LPG product", () => {
      const product = {
        name: "LPG Cylinder",
        brand: "Petron Gasul",
        weight_kg: 11,
        unit_type: "kg",
        quantity: 10,
        unit_cost: 100,
        min_threshold: 5,
        max_threshold: 20
      }
      
      const result = validateLPGProduct(product)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it("should reject LPG product with invalid brand", () => {
      const product = {
        name: "LPG Cylinder",
        brand: "Invalid Brand",
        weight_kg: 11,
        unit_type: "kg",
        quantity: 10,
        unit_cost: 100,
        min_threshold: 5,
        max_threshold: 20
      }
      
      const result = validateLPGProduct(product)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes("Invalid brand"))).toBe(true)
    })
  })
})