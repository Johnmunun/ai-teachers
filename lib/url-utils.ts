/**
 * Safely extracts search parameters from a Request object
 * Handles cases where req.url might be undefined or invalid
 */
export function getSearchParams(req: Request): URLSearchParams {
  try {
    if (req.url) {
      const url = new URL(req.url);
      return url.searchParams;
    }
  } catch (error) {
    console.warn('Failed to parse URL from request:', error);
  }
  
  // Fallback: try to construct URL from headers
  try {
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const path = req.headers.get('x-pathname') || '/';
    
    if (host) {
      const url = new URL(`${protocol}://${host}${path}`);
      return url.searchParams;
    }
  } catch (error) {
    console.warn('Failed to construct URL from headers:', error);
  }
  
  // Last resort: return empty search params
  return new URLSearchParams();
}


