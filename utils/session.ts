/**
 * Session management utilities for the application
 * Handles user authentication state with a 30-minute expiration
 */

// Session duration in milliseconds (30 minutes)
const SESSION_DURATION = 30 * 60 * 1000;

/**
 * Start or refresh a user session
 * @param sessionToken Session token from authentication
 * @param userModule User module from authentication
 */
export function startUserSession(sessionToken: string, userModule: string): void {
  localStorage.setItem('sessionToken', sessionToken);
  localStorage.setItem('userModule', userModule);
  refreshSessionExpiration();
}

/**
 * Get the authentication token for API requests
 * @returns The bearer token for authorization header or null if not authenticated
 */
export function getAuthToken(): string | null {
  const sessionToken = localStorage.getItem('sessionToken');
  if (!sessionToken) return null;
  return sessionToken;
}

/**
 * Refresh the session expiration time
 * Sets expiration to current time + SESSION_DURATION
 */
export function refreshSessionExpiration(): void {
  const expiresAt = Date.now() + SESSION_DURATION;
  localStorage.setItem('sessionExpires', expiresAt.toString());
}

/**
 * Check if the user is authenticated and session is valid
 * @returns boolean indicating if user is authenticated with valid session
 */
export function isAuthenticated(): boolean {
  const sessionToken = localStorage.getItem('sessionToken');
  const userModule = localStorage.getItem('userModule');
  const sessionExpires = localStorage.getItem('sessionExpires');
  
  // Check if all required session data exists
  if (!sessionToken || !userModule || !sessionExpires) {
    return false;
  }
  
  // Check if session has expired
  const expiresAt = parseInt(sessionExpires, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    // Session expired, clear session data
    clearUserSession();
    return false;
  }
  
  // Valid session, refresh expiration
  refreshSessionExpiration();
  return true;
}

/**
 * Clear all user session data
 */
export function clearUserSession(): void {
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('userModule');
  localStorage.removeItem('sessionExpires');
}

/**
 * Redirect to login page if user is not authenticated
 * @returns boolean indicating if redirect was performed
 */
export function redirectIfNotAuthenticated(): boolean {
  if (!isAuthenticated()) {
    // Redirect to root path (/) instead of /login to avoid showing the credit search message
    window.location.href = '/';
    return true;
  }
  return false;
}
