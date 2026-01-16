/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate password strength
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return { valid: false, reason: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number' };
  }

  return { valid: true };
}
