/**
 * PCGS Public API Client (TypeScript)
 *
 * Provides OAuth2-authenticated access to PCGS CoinFacts data.
 * Rate limited to 1,000 queries/day on free tier.
 *
 * Environment variables required:
 * - PCGS_USERNAME: PCGS account email
 * - PCGS_PASSWORD: PCGS account password
 *
 * API Documentation: https://api.pcgs.com/publicapi/swagger/ui/index
 */

// Error types
export class PCGSApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'PCGSApiError';
  }
}

export class AuthenticationError extends PCGSApiError {
  constructor(message: string, statusCode?: number) {
    super(message, statusCode);
    this.name = 'AuthenticationError';
  }
}

export class QuotaExceededError extends PCGSApiError {
  constructor(message: string) {
    super(message, 429);
    this.name = 'QuotaExceededError';
  }
}

export class RateLimitError extends PCGSApiError {
  constructor(message: string) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class CertNotFoundError extends PCGSApiError {
  constructor(certNo: string) {
    super(`Certificate ${certNo} not found`, 404);
    this.name = 'CertNotFoundError';
  }
}

// Response interfaces
export interface PCGSCoinResponse {
  IsValidRequest: boolean;
  ServerMessage: string;
  PCGSNo: number;
  CertNo: string;
  Grade: string;
  GradeNumeric: number;
  Denomination: string;
  Year: number;
  MintMark: string | null;
  FullName: string;
  DesignerName: string | null;
  EdgeDescription: string | null;
  Mintage: number | null;
  PriceGuideValue: number | null;
  MajorVariety: string | null;
  MinorVariety: string | null;
  DieVariety: string | null;
  PriceSource: string | null;
  SpeciesName: string | null;
  CategoryName: string | null;
  SeriesName: string | null;
  // Additional fields that may be present
  Obverse100ImageURL?: string | null;
  Reverse100ImageURL?: string | null;
  TrueViewFront?: string | null;
  TrueViewBack?: string | null;
}

// Token storage interface
interface TokenCache {
  accessToken: string;
  expiresAt: number; // Unix timestamp
}

// In-memory token cache (shared across requests in serverless)
let tokenCache: TokenCache | null = null;

const BASE_URL = 'https://api.pcgs.com/publicapi';
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 2000;

/**
 * Check if credentials are configured
 */
function checkCredentials(): void {
  if (!process.env.PCGS_USERNAME || !process.env.PCGS_PASSWORD) {
    throw new AuthenticationError(
      'PCGS credentials not set. Please set PCGS_USERNAME and PCGS_PASSWORD environment variables.'
    );
  }
}

/**
 * Check if cached token is still valid
 */
function isTokenValid(): boolean {
  if (!tokenCache) return false;
  // Add buffer to refresh before actual expiry
  return Date.now() < tokenCache.expiresAt - TOKEN_EXPIRY_BUFFER_MS;
}

/**
 * Authenticate with PCGS API using OAuth2 password grant
 */
export async function authenticate(): Promise<string> {
  checkCredentials();

  // Return cached token if valid
  if (isTokenValid()) {
    return tokenCache!.accessToken;
  }

  console.log('[PCGS API] Authenticating...');

  const url = `${BASE_URL}/Authentication/GetToken`;
  const payload = {
    userName: process.env.PCGS_USERNAME,
    password: process.env.PCGS_PASSWORD,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new AuthenticationError('Invalid PCGS credentials', 401);
  }

  if (!response.ok) {
    throw new AuthenticationError(
      `Authentication failed: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const data = await response.json();
  const accessToken = data.access_token || data.token;

  if (!accessToken) {
    throw new AuthenticationError('No access token in response');
  }

  // Parse token expiry (typically 24 hours for PCGS)
  const expiresIn = data.expires_in || 86400; // Default 24 hours
  const expiresAt = Date.now() + expiresIn * 1000;

  // Cache token
  tokenCache = { accessToken, expiresAt };

  console.log('[PCGS API] Authentication successful');
  return accessToken;
}

/**
 * Make an authenticated API request with retry logic
 */
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await authenticate();

  const url = `${BASE_URL}/${endpoint.replace(/^\//, '')}`;
  const headers = {
    Authorization: `bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle specific error codes
      if (response.status === 401) {
        // Token expired, clear cache and retry
        console.log('[PCGS API] Token expired, re-authenticating...');
        tokenCache = null;
        const newToken = await authenticate();
        headers.Authorization = `bearer ${newToken}`;
        continue;
      }

      if (response.status === 429) {
        throw new RateLimitError('Rate limit exceeded');
      }

      if (response.status === 404) {
        // Check if cert not found
        const text = await response.text();
        if (text.includes('CertNo') || text.includes('not found')) {
          throw new CertNotFoundError(endpoint.split('/').pop() || 'unknown');
        }
        throw new PCGSApiError(`Not found: ${endpoint}`, 404);
      }

      if (!response.ok) {
        throw new PCGSApiError(
          `API error: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry client errors (4xx) except 401
      if (
        error instanceof PCGSApiError &&
        error.statusCode &&
        error.statusCode >= 400 &&
        error.statusCode < 500 &&
        error.statusCode !== 401
      ) {
        throw error;
      }

      // Retry with backoff for server errors or network issues
      if (attempt < MAX_RETRIES - 1) {
        const waitTime = RETRY_BACKOFF_MS * (attempt + 1);
        console.log(
          `[PCGS API] Request failed, retrying in ${waitTime}ms: ${(error as Error).message}`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new PCGSApiError(
    `Request failed after ${MAX_RETRIES} retries: ${lastError?.message}`,
    500
  );
}

/**
 * Get coin data by certificate number
 *
 * @param certNo - PCGS certificate number (7-8 digits)
 * @returns Coin data including price guide values
 */
export async function getCoinByCert(certNo: string): Promise<PCGSCoinResponse> {
  // Validate cert number
  if (!certNo || !/^\d{7,8}$/.test(certNo)) {
    throw new PCGSApiError(
      'Invalid cert number: must be 7-8 digits',
      400
    );
  }

  console.log(`[PCGS API] Fetching coin by cert number: ${certNo}`);

  const data = await makeRequest<PCGSCoinResponse>(
    `/coindetail/GetCoinFactsByCertNo/${certNo}`
  );

  // Check for valid response
  if (!data.IsValidRequest) {
    throw new CertNotFoundError(certNo);
  }

  return data;
}

/**
 * PCGS API Client class for more complex use cases
 */
export class PCGSApiClient {
  /**
   * Authenticate and get access token
   */
  async authenticate(): Promise<string> {
    return authenticate();
  }

  /**
   * Get coin data by certificate number
   */
  async getCoinByCert(certNo: string): Promise<PCGSCoinResponse> {
    return getCoinByCert(certNo);
  }

  /**
   * Check if API is configured and accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await authenticate();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const pcgsApi = new PCGSApiClient();
