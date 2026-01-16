import { describe, it, expect } from 'vitest'

describe('Vitest setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle async tests', async () => {
    const result = await Promise.resolve('hello')
    expect(result).toBe('hello')
  })
})
