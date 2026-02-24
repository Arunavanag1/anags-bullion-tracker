import { NextResponse } from 'next/server';

/**
 * Standard API error types
 */
export enum ApiErrorType {
  VALIDATION = 'VALIDATION',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL = 'INTERNAL',
}

/**
 * Standard API error class
 */
export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    type: ApiErrorType,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Create a validation error (400)
 */
export function validationError(
  message: string,
  details?: Record<string, unknown>
): ApiError {
  return new ApiError(message, ApiErrorType.VALIDATION, 400, details);
}

/**
 * Create a not found error (404)
 */
export function notFoundError(message = 'Not found'): ApiError {
  return new ApiError(message, ApiErrorType.NOT_FOUND, 404);
}

/**
 * Create a rate limited error (429)
 */
export function rateLimitedError(retryAfter?: number): ApiError {
  const error = new ApiError(
    'Too many requests. Please try again later.',
    ApiErrorType.RATE_LIMITED,
    429,
    retryAfter ? { retryAfter } : undefined
  );
  return error;
}

/**
 * Standard error response structure
 */
interface ErrorResponse {
  success: false;
  error: string;
  type?: ApiErrorType;
  details?: Record<string, unknown>;
}

/**
 * Handle any error and return a standardized NextResponse
 *
 * @param error - The error to handle
 * @param logContext - Optional context string for logging (e.g., 'fetching collection')
 * @returns NextResponse with standardized error structure
 */
export function handleApiError(
  error: unknown,
  logContext?: string
): NextResponse<ErrorResponse> {
  // Handle our custom ApiError
  if (error instanceof ApiError) {
    const response: ErrorResponse = {
      success: false,
      error: error.message,
      type: error.type,
    };

    if (error.details) {
      response.details = error.details;
    }

    const headers: Record<string, string> = {};
    if (error.type === ApiErrorType.RATE_LIMITED && error.details?.retryAfter) {
      headers['Retry-After'] = String(error.details.retryAfter);
      headers['X-RateLimit-Remaining'] = '0';
    }

    return NextResponse.json(response, {
      status: error.statusCode,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });
  }

  // Handle generic Error with 'Unauthorized' message (from getUserId)
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        type: ApiErrorType.UNAUTHORIZED,
      },
      { status: 401 }
    );
  }

  // Handle unknown errors
  const contextMsg = logContext ? ` ${logContext}` : '';
  console.error(`Error${contextMsg}:`, error);

  return NextResponse.json(
    {
      success: false,
      error: logContext ? `Failed to ${logContext}` : 'Internal server error',
      type: ApiErrorType.INTERNAL,
    },
    { status: 500 }
  );
}
