import { 
  getProducts, 
  createProduct, 
  getStockMovements, 
  createStockMovement, 
  getQRCodes, 
  createQRCode, 
  testConnection 
} from "@/lib/supabase"

describe("Supabase Integration", () => {
  it("should be properly configured with Supabase credentials", async () => {
    // Test that the Supabase connection is working
    const connectionResult = await testConnection()
    expect(connectionResult.success).toBe(true)
  })
  
  describe("Database Operations", () => {
    it("should have products methods available", () => {
      expect(typeof getProducts).toBe("function")
      expect(typeof createProduct).toBe("function")
    })
    
    it("should have stock movements methods available", () => {
      expect(typeof getStockMovements).toBe("function")
      expect(typeof createStockMovement).toBe("function")
    })
    
    it("should have QR codes methods available", () => {
      expect(typeof getQRCodes).toBe("function")
      expect(typeof createQRCode).toBe("function")
    })
  })
  
  describe("Live Database Operations", () => {
    it("should fetch products from database", async () => {
      const { data, error } = await getProducts()
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      // Products array can be empty for a fresh database
    })
    
    it("should create a product in database", async () => {
      const newProduct = {
        name: "Test Product " + Date.now(),
        brand: "Test Brand",
        weight_kg: 11,
        unit_type: "kg" as const,
        quantity: 10,
        unit_cost: 100,
        min_threshold: 5,
        max_threshold: 20,
        sku: "TEST-" + Date.now(),
        category: "cylinder" as const,
        status: "active" as const
      }
      
      const { data, error } = await createProduct(newProduct)
      expect(error).toBeNull()
      expect(data).toBeDefined()
      if (data) {
        expect(data.name).toBe(newProduct.name)
        expect(data.weight_kg).toBe(newProduct.weight_kg)
      }
    }, 10000) // Increase timeout for database operations
    
    it("should fetch stock movements from database", async () => {
      const { data, error } = await getStockMovements()
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
    
    it("should fetch QR codes from database", async () => {
      const { data, error } = await getQRCodes()
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })
})