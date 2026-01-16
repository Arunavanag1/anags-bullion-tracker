/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  valid: boolean;
  normalizedEmail?: string;
  reason?: string;
}

/**
 * Validate and normalize email address
 *
 * Requirements:
 * - Must contain exactly one @
 * - Must have local part and domain
 * - Max 254 characters (RFC 5321)
 * - No spaces allowed
 *
 * Normalization:
 * - Lowercase
 * - Trim whitespace
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email) {
    return { valid: false, reason: 'Email is required' };
  }

  // Trim whitespace and normalize to lowercase
  const normalizedEmail = email.trim().toLowerCase();

  // Check for spaces (after trimming, internal spaces are invalid)
  if (normalizedEmail.includes(' ')) {
    return { valid: false, reason: 'Email cannot contain spaces' };
  }

  // Check max length (254 per RFC 5321)
  if (normalizedEmail.length > 254) {
    return { valid: false, reason: 'Email is too long (max 254 characters)' };
  }

  // Basic format check: must have exactly one @ with content on both sides
  const atCount = (normalizedEmail.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { valid: false, reason: 'Email must contain exactly one @' };
  }

  const [localPart, domain] = normalizedEmail.split('@');

  // Check local part exists
  if (!localPart || localPart.length === 0) {
    return { valid: false, reason: 'Email must have content before @' };
  }

  // Check domain exists and has at least one dot (basic domain validation)
  if (!domain || domain.length === 0) {
    return { valid: false, reason: 'Email must have a domain after @' };
  }

  // Domain should have at least one dot (e.g., example.com)
  if (!domain.includes('.')) {
    return { valid: false, reason: 'Email domain must include a dot (e.g., example.com)' };
  }

  // Check domain doesn't start or end with a dot
  if (domain.startsWith('.') || domain.endsWith('.')) {
    return { valid: false, reason: 'Email domain cannot start or end with a dot' };
  }

  return { valid: true, normalizedEmail };
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
