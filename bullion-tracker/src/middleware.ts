import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers middleware
 * Adds comprehensive security headers to all responses
 */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  // Content-Security-Policy
  // Note: 'unsafe-inline' and 'unsafe-eval' needed for Next.js development mode
  // In production, consider tightening these with nonces or hashes
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "connect-src 'self' https://api.metals.dev",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Legacy XSS protection for older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Disable potentially dangerous browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Note: HSTS (Strict-Transport-Security) intentionally not included
  // Should only be enabled after deployment verification on HTTPS

  return response;
}

// Apply middleware to all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
