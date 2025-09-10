import { supabase } from '@/lib/supabase'

/**
 * Get the current auth token for API requests
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    
    if (!session?.access_token) {
      return null
    }
    
    // Check if token is expired or about to expire (within 60 seconds)
    const expirationTime = session.expires_at ? session.expires_at * 1000 : 0
    const now = Date.now()
    const timeUntilExpiration = expirationTime - now
    
    // If token expires within 60 seconds, try to refresh it
    if (timeUntilExpiration < 60000) {
      try {
        const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.error('Error refreshing session:', refreshError)
          return null
        }
        
        if (refreshedSession?.access_token) {
          return refreshedSession.access_token
        }
      } catch (refreshError) {
        console.error('Error during token refresh:', refreshError)
        return null
      }
    }
    
    return session.access_token
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

/**
 * Make an authenticated API request
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken()
  
  if (!token) {
    throw new Error('No authentication token available')
  }

  // Ensure the URL is correctly formed
  const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000'
  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  }

  return fetch(fullUrl, {
    ...options,
    headers,
  })
}

/**
 * Helper for GET requests
 */
export async function authenticatedGet(url: string): Promise<Response> {
  return authenticatedFetch(url, { method: 'GET' })
}

/**
 * Helper for POST requests
 */
export async function authenticatedPost(url: string, data: any): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Helper for DELETE requests
 */
export async function authenticatedDelete(url: string): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'DELETE',
  })
}