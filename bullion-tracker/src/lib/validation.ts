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

// ============================================
// Input Sanitization and Validation Utilities
// ============================================

/**
 * Generic validation result
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Sanitize a string input
 *
 * - Trims whitespace
 * - Removes null bytes (security)
 * - Truncates to maxLength
 *
 * @param input - The string to sanitize
 * @param maxLength - Maximum allowed length (default 500)
 * @returns Sanitized string, or empty string if input is null/undefined
 */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (input === null || input === undefined) {
    return '';
  }

  // Convert to string if not already
  const str = String(input);

  // Trim whitespace
  let sanitized = str.trim();

  // Remove null bytes (potential security issue)
  sanitized = sanitized.replace(/\0/g, '');

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate that a value is a positive number
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field (for error messages)
 * @returns Validation result
 */
export function validatePositiveNumber(
  value: unknown,
  fieldName: string
): ValidationResult {
  // Check if value exists
  if (value === null || value === undefined) {
    return { valid: false, reason: `${fieldName} is required` };
  }

  // Convert to number
  const num = Number(value);

  // Check if it's a valid number
  if (isNaN(num)) {
    return { valid: false, reason: `${fieldName} must be a number` };
  }

  // Check if positive
  if (num <= 0) {
    return { valid: false, reason: `${fieldName} must be a positive number` };
  }

  return { valid: true };
}

/**
 * Validate that a value is one of the allowed enum values
 *
 * @param value - The value to validate
 * @param allowedValues - Array of allowed values
 * @param fieldName - Name of the field (for error messages)
 * @returns Validation result
 */
export function validateEnum(
  value: unknown,
  allowedValues: readonly string[],
  fieldName: string
): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: false, reason: `${fieldName} is required` };
  }

  const strValue = String(value);

  if (!allowedValues.includes(strValue)) {
    return {
      valid: false,
      reason: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate that a string is a valid CUID
 *
 * CUIDs are 25 characters, start with 'c', and contain lowercase letters and numbers
 *
 * @param id - The ID to validate
 * @returns Validation result
 */
export function validateId(id: unknown): ValidationResult {
  if (id === null || id === undefined) {
    return { valid: false, reason: 'ID is required' };
  }

  const strId = String(id);

  // CUID format: starts with 'c', 25 characters total
  if (strId.length !== 25) {
    return { valid: false, reason: 'Invalid ID format' };
  }

  if (!strId.startsWith('c')) {
    return { valid: false, reason: 'Invalid ID format' };
  }

  // Should contain only lowercase letters and numbers after the 'c'
  if (!/^c[a-z0-9]{24}$/.test(strId)) {
    return { valid: false, reason: 'Invalid ID format' };
  }

  return { valid: true };
}
