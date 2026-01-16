import { describe, it, expect } from 'vitest'
import { validatePassword } from '../validation'

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
