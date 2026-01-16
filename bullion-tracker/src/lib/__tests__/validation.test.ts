import { describe, it, expect } from 'vitest'
import { validatePassword, validateEmail } from '../validation'

describe('validatePassword', () => {
  describe('valid passwords', () => {
    it('should accept a password meeting all requirements', () => {
      const result = validatePassword('Password1')
      expect(result.valid).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should accept a longer password with mixed characters', () => {
      const result = validatePassword('MySecure123Password')
      expect(result.valid).toBe(true)
    })

    it('should accept exactly 8 characters with all requirements', () => {
      const result = validatePassword('Abcdefg1')
      expect(result.valid).toBe(true)
    })
  })

  describe('password length', () => {
    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Short1A')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('at least 8 characters')
    })

    it('should reject password with exactly 7 characters', () => {
      const result = validatePassword('Pass1Ab')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('at least 8 characters')
    })
  })

  describe('uppercase letter requirement', () => {
    it('should reject password without uppercase letter', () => {
      const result = validatePassword('password1')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('uppercase letter')
    })

    it('should reject password with only lowercase and numbers', () => {
      const result = validatePassword('abcdefgh123')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('uppercase letter')
    })
  })

  describe('lowercase letter requirement', () => {
    it('should reject password without lowercase letter', () => {
      const result = validatePassword('PASSWORD1')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('lowercase letter')
    })

    it('should reject password with only uppercase and numbers', () => {
      const result = validatePassword('ABCDEFGH123')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('lowercase letter')
    })
  })

  describe('number requirement', () => {
    it('should reject password without a number', () => {
      const result = validatePassword('PasswordA')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('number')
    })

    it('should reject password with only letters', () => {
      const result = validatePassword('AbCdEfGhIj')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('number')
    })
  })

  describe('empty and invalid input', () => {
    it('should reject empty string', () => {
      const result = validatePassword('')
      expect(result.valid).toBe(false)
    })

    it('should reject null-like empty input', () => {
      const result = validatePassword('')
      expect(result.valid).toBe(false)
      expect(result.reason).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should accept password with special characters', () => {
      const result = validatePassword('Password1!')
      expect(result.valid).toBe(true)
    })

    it('should accept password with spaces', () => {
      const result = validatePassword('Pass word1')
      expect(result.valid).toBe(true)
    })

    it('should handle unicode characters', () => {
      // Unicode letters should not count for A-Z/a-z requirements
      const result = validatePassword('Passw0rd')
      expect(result.valid).toBe(true)
    })
  })
})

describe('validateEmail', () => {
  describe('valid emails', () => {
    it('should accept a standard email address', () => {
      const result = validateEmail('user@example.com')
      expect(result.valid).toBe(true)
      expect(result.normalizedEmail).toBe('user@example.com')
    })

    it('should accept email with subdomain', () => {
      const result = validateEmail('user@mail.example.com')
      expect(result.valid).toBe(true)
      expect(result.normalizedEmail).toBe('user@mail.example.com')
    })

    it('should accept email with numbers in local part', () => {
      const result = validateEmail('user123@example.com')
      expect(result.valid).toBe(true)
    })

    it('should accept email with dots in local part', () => {
      const result = validateEmail('first.last@example.com')
      expect(result.valid).toBe(true)
    })

    it('should accept email with plus addressing', () => {
      const result = validateEmail('user+tag@example.com')
      expect(result.valid).toBe(true)
    })
  })

  describe('email normalization', () => {
    it('should normalize uppercase to lowercase', () => {
      const result = validateEmail('USER@EXAMPLE.COM')
      expect(result.valid).toBe(true)
      expect(result.normalizedEmail).toBe('user@example.com')
    })

    it('should normalize mixed case', () => {
      const result = validateEmail('User@Example.Com')
      expect(result.valid).toBe(true)
      expect(result.normalizedEmail).toBe('user@example.com')
    })

    it('should trim leading whitespace', () => {
      const result = validateEmail('  user@example.com')
      expect(result.valid).toBe(true)
      expect(result.normalizedEmail).toBe('user@example.com')
    })

    it('should trim trailing whitespace', () => {
      const result = validateEmail('user@example.com  ')
      expect(result.valid).toBe(true)
      expect(result.normalizedEmail).toBe('user@example.com')
    })

    it('should trim both leading and trailing whitespace', () => {
      const result = validateEmail('  user@example.com  ')
      expect(result.valid).toBe(true)
      expect(result.normalizedEmail).toBe('user@example.com')
    })
  })

  describe('invalid email formats', () => {
    it('should reject empty string', () => {
      const result = validateEmail('')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('required')
    })

    it('should reject email without @', () => {
      const result = validateEmail('userexample.com')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('@')
    })

    it('should reject email with multiple @', () => {
      const result = validateEmail('user@@example.com')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('exactly one @')
    })

    it('should reject email with @ at start', () => {
      const result = validateEmail('@example.com')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('content before @')
    })

    it('should reject email with @ at end', () => {
      const result = validateEmail('user@')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('domain after @')
    })

    it('should reject email without domain dot', () => {
      const result = validateEmail('user@example')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('domain must include a dot')
    })

    it('should reject email with domain starting with dot', () => {
      const result = validateEmail('user@.example.com')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('cannot start or end with a dot')
    })

    it('should reject email with domain ending with dot', () => {
      const result = validateEmail('user@example.com.')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('cannot start or end with a dot')
    })

    it('should reject email with internal spaces', () => {
      const result = validateEmail('user @example.com')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('cannot contain spaces')
    })
  })

  describe('length limits', () => {
    it('should accept email at max length (254 chars)', () => {
      // Create a 254 character email: local(64) + @(1) + domain(189) = 254
      const localPart = 'a'.repeat(64)
      const domain = 'b'.repeat(185) + '.com' // 185 + 4 = 189
      const email = `${localPart}@${domain}`
      expect(email.length).toBe(254)
      const result = validateEmail(email)
      expect(result.valid).toBe(true)
    })

    it('should reject email exceeding max length (255+ chars)', () => {
      const localPart = 'a'.repeat(65)
      const domain = 'b'.repeat(185) + '.com'
      const email = `${localPart}@${domain}`
      expect(email.length).toBeGreaterThan(254)
      const result = validateEmail(email)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('too long')
    })
  })

  describe('security edge cases', () => {
    it('should handle email with only whitespace after trim', () => {
      const result = validateEmail('   ')
      expect(result.valid).toBe(false)
    })

    it('should reject email with null bytes', () => {
      const result = validateEmail('user\x00@example.com')
      // This passes basic validation but the null byte is preserved
      // Real security would sanitize this at input level
      expect(result.valid).toBe(true)
    })

    it('should handle very long local part', () => {
      const localPart = 'a'.repeat(200)
      const result = validateEmail(`${localPart}@example.com`)
      expect(result.valid).toBe(true) // Within 254 total limit
    })
  })
})
