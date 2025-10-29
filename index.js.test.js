import { describe, it, expect, beforeEach } from 'vitest'

describe('index.js - Simple CommonJS re-export', () => {
  let getRandomValues

  beforeEach(async () => {
    // Import the module
    getRandomValues = (await import('./index.js')).default
  })

  describe('basic functionality', () => {
    it('should export the get-random-values function', () => {
      expect(typeof getRandomValues).toBe('function')
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

    it('should handle different array sizes', () => {
      const sizes = [1, 16, 32, 64, 256, 1024]

      sizes.forEach((size) => {
        const array = new Uint8Array(size)
        const result = getRandomValues(array)

        expect(result.length).toBe(size)
        expect(result).toBe(array)
      })
    })
  })

  describe('randomness quality', () => {
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

  describe('compatibility', () => {
    it('should be compatible with the underlying get-random-values package', async () => {
      const directImport = await import('get-random-values')
      const wrappedImport = await import('./index.js')

      // Both should return functions
      expect(typeof directImport.default).toBe('function')
      expect(typeof wrappedImport.default).toBe('function')

      // Both should produce valid results
      const array1 = new Uint8Array(16)
      const array2 = new Uint8Array(16)

      directImport.default(array1)
      wrappedImport.default(array2)

      expect(array1.length).toBe(16)
      expect(array2.length).toBe(16)
    })
  })
})
