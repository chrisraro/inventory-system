import { renderHook, act } from '@testing-library/react'
import { useProducts } from '../hooks/use-products'
import { authenticatedPost } from '@/lib/api-client'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  authenticatedGet: jest.fn(),
  authenticatedPost: jest.fn(),
  authenticatedDelete: jest.fn(),
}))

describe('useProducts - Duplicate Entry Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle duplicate entry error correctly', async () => {
    // Mock the API response for duplicate entry
    (authenticatedPost as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ 
        error: 'Product with this QR code already exists' 
      }),
    })

    const { result } = renderHook(() => useProducts())

    // Try to add a product that already exists
    let addResult
    await act(async () => {
      addResult = await result.current.addProduct({
        qr_code: 'TEST123',
        weight_kg: 11,
        unit_cost: 1000,
      })
    })

    // Check that the error is handled correctly
    expect(addResult).toEqual({
      success: false,
      error: 'A product with QR code "TEST123" already exists in your inventory.'
    })
  })
})