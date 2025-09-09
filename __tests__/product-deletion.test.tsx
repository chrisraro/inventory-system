import { renderHook, act } from '@testing-library/react'
import { useProducts } from '../hooks/use-products'
import { authenticatedDelete } from '@/lib/api-client'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  authenticatedGet: jest.fn(),
  authenticatedPost: jest.fn(),
  authenticatedDelete: jest.fn(),
}))

describe('useProducts - Product Deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should delete a product successfully', async () => {
    // Mock the API response for successful deletion
    (authenticatedDelete as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Product deleted successfully' }),
    })

    const { result } = renderHook(() => useProducts())

    // Try to delete a product
    let deleteResult
    await act(async () => {
      deleteResult = await result.current.deleteProduct('LPG-TEST123')
    })

    // Check that the deletion was successful
    expect(deleteResult).toEqual({ success: true })
    expect(authenticatedDelete).toHaveBeenCalledWith('/api/products/delete/LPG-TEST123')
  })

  it('should handle deletion error correctly', async () => {
    // Mock the API response for deletion error
    (authenticatedDelete as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to delete product' }),
    })

    const { result } = renderHook(() => useProducts())

    // Try to delete a product that fails
    let deleteResult
    await act(async () => {
      deleteResult = await result.current.deleteProduct('LPG-TEST123')
    })

    // Check that the error is handled correctly
    expect(deleteResult).toEqual({
      success: false,
      error: 'Failed to delete product'
    })
  })
})