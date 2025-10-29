import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('index.cjs - Node.js implementation', () => {
  let getRandomValues

  beforeEach(async () => {
    // Clear module cache to get fresh instance
    vi.resetModules()
  })

  describe('basic functionality', () => {
    beforeEach(async () => {
      // Import fresh module
      getRandomValues = (await import('./index.cjs')).default
    })

    it('should fill a Uint8Array with random values', () => {
      const array = new Uint8Array(16)
      const result = getRandomValues(array)

      expect(result).toBe(array)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(16)
    })

    it('should fill a Uint16Array with random values', () => {
      const array = new Uint16Array(8)
      const result = getRandomValues(array)

      expect(result).toBe(array)
      expect(result).toBeInstanceOf(Uint16Array)
      expect(result.length).toBe(8)
    })

    it('should fill a Uint32Array with random values', () => {
      const array = new Uint32Array(4)
      const result = getRandomValues(array)

      expect(result).toBe(array)
      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBe(4)
    })

    it('should modify the array in-place', () => {
      const array = new Uint8Array(10)
      const originalArray = array

      getRandomValues(array)

      expect(array).toBe(originalArray)
    })
  })

  describe('randomness quality', () => {
    beforeEach(async () => {
      getRandomValues = (await import('./index.cjs')).default
    })

    it('should generate different values across the array', () => {
      const array = new Uint8Array(16)
      getRandomValues(array)

      const allSame = array.every((val) => val === array[0])
      expect(allSame).toBe(false)
    })

    it('should generate different values on subsequent calls', () => {
      const array1 = new Uint8Array(16)
      const array2 = new Uint8Array(16)

      getRandomValues(array1)
      getRandomValues(array2)

      const areIdentical = array1.every((val, i) => val === array2[i])
      expect(areIdentical).toBe(false)
    })

    it('should fill array with non-zero values (statistically)', () => {
      const array = new Uint8Array(100)
      getRandomValues(array)

      const hasNonZero = array.some((val) => val !== 0)
      expect(hasNonZero).toBe(true)

      const nonZeroCount = array.filter((val) => val !== 0).length
      expect(nonZeroCount).toBeGreaterThan(90)
    })
  })

  describe('Node.js environment detection', () => {
    it('should work with Node.js built-in webcrypto when available', async () => {
      // In Node 15+, webcrypto should be available
      const crypto = await import('crypto')

      if (crypto.webcrypto) {
        getRandomValues = (await import('./index.cjs')).default
        const array = new Uint8Array(16)
        const result = getRandomValues(array)

        expect(result).toBe(array)
        expect(result.length).toBe(16)

        // Verify it's actually random
        const allSame = array.every((val) => val === array[0])
        expect(allSame).toBe(false)
      } else {
        // If webcrypto is not available, it should fall back to get-random-values
        getRandomValues = (await import('./index.cjs')).default
        const array = new Uint8Array(16)
        const result = getRandomValues(array)

        expect(result).toBe(array)
        expect(result.length).toBe(16)
      }
    })

    it('should handle different array sizes correctly', async () => {
      getRandomValues = (await import('./index.cjs')).default
      const sizes = [1, 16, 32, 64, 256, 1024]

      sizes.forEach((size) => {
        const array = new Uint8Array(size)
        const result = getRandomValues(array)

        expect(result.length).toBe(size)
        expect(result).toBe(array)
      })
    })
  })

  describe('fallback behavior', () => {
    it('should use get-random-values package as fallback', async () => {
      // This test verifies the fallback import works
      const fallbackModule = await import('get-random-values')
      expect(fallbackModule).toBeDefined()
      expect(typeof fallbackModule.default).toBe('function')

      const array = new Uint8Array(16)
      const result = fallbackModule.default(array)

      expect(result).toBe(array)
      expect(result.length).toBe(16)
    })

    it('should actually use get-random-values when webcrypto is undefined', async () => {
      // This test forces index.cjs to take the fallback path by mocking crypto module
      vi.resetModules()

      // Mock the crypto module to return undefined webcrypto
      vi.doMock('crypto', () => ({
        webcrypto: undefined,
      }))

      // Import index.cjs - it should now use the get-random-values fallback
      const module = await import('./index.cjs')
      const getRandomValuesFunc = module.default || module // Handle both default and named exports

      // Test basic functionality
      const array = new Uint8Array(32)
      const result = getRandomValuesFunc(array)

      expect(result).toBe(array)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)

      // Verify it's actually filled with random values
      const allZeros = array.every((val) => val === 0)
      expect(allZeros).toBe(false)

      // Verify randomness
      const allSame = array.every((val) => val === array[0])
      expect(allSame).toBe(false)

      // Test with different typed arrays
      const uint16Array = new Uint16Array(16)
      getRandomValuesFunc(uint16Array)
      expect(uint16Array.length).toBe(16)
      expect(uint16Array.every((val) => val === 0)).toBe(false)

      const uint32Array = new Uint32Array(8)
      getRandomValuesFunc(uint32Array)
      expect(uint32Array.length).toBe(8)
      expect(uint32Array.every((val) => val === 0)).toBe(false)

      // Clean up mock
      vi.doUnmock('crypto')
    })

    it('should use webcrypto when available (non-fallback path)', async () => {
      // This test ensures the webcrypto path still works
      vi.resetModules()

      // Don't mock anything - let it use real webcrypto if available
      const module = await import('./index.cjs')
      const getRandomValuesFunc = module.default || module // Handle both default and named exports

      const array = new Uint8Array(16)
      const result = getRandomValuesFunc(array)

      expect(result).toBe(array)
      expect(result.length).toBe(16)

      // Verify it's filled with random values
      const allZeros = array.every((val) => val === 0)
      expect(allZeros).toBe(false)
    })
  })
})
