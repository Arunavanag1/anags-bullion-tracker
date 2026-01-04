'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred while signing in.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-background-card rounded-lg shadow-lg p-8 border border-border">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Authentication Error
            </h1>
            <p className="text-text-secondary">{errorMessage}</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/auth/signin" className="block">
              <Button variant="primary" className="w-full">
                Try Again
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="secondary" className="w-full">
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
