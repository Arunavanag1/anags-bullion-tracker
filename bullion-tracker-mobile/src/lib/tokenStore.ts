/**
 * In-memory token store for immediate access after login
 * Solves race condition where SecureStore hasn't propagated yet
 */

let currentToken: string | null = null;

export function setToken(token: string | null): void {
  currentToken = token;
}

export function getToken(): string | null {
  return currentToken;
}

export function clearToken(): void {
  currentToken = null;
}
