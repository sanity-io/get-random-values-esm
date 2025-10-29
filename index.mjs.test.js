import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import getRandomValues from './index.mjs'

describe('index.mjs - ESM implementation', () => {
  describe('basic functionality', () => {
    it('should fill a Uint8Array with random values', () => {
      const array = new Uint8Array(16)
      const result = getRandomValues(array)

      expect(result).toBe(array) // should return the same array
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

      // Check that not all values are the same
      const allSame = array.every((val) => val === array[0])
      expect(allSame).toBe(false)
    })

    it('should generate different values on subsequent calls', () => {
      const array1 = new Uint8Array(16)
      const array2 = new Uint8Array(16)

      getRandomValues(array1)
      getRandomValues(array2)

      // Arrays should be different
      const areIdentical = array1.every((val, i) => val === array2[i])
      expect(areIdentical).toBe(false)
    })

    it('should fill array with non-zero values (statistically)', () => {
      const array = new Uint8Array(100)
      getRandomValues(array)

      // At least some values should be non-zero
      const hasNonZero = array.some((val) => val !== 0)
      expect(hasNonZero).toBe(true)

      // Most values should be non-zero (probability of all zeros is astronomically low)
      const nonZeroCount = array.filter((val) => val !== 0).length
      expect(nonZeroCount).toBeGreaterThan(90)
    })
  })

  describe('environment handling', () => {
    let originalCryptoDescriptor
    let originalWindow

    beforeEach(() => {
      originalCryptoDescriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        'crypto',
      )
      originalWindow = globalThis.window
    })

    afterEach(() => {
      // Restore crypto
      if (originalCryptoDescriptor) {
        Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor)
      } else {
        delete globalThis.crypto
      }

      // Restore window
      if (originalWindow) {
        globalThis.window = originalWindow
      } else {
        delete globalThis.window
      }
    })

    it('should use window.crypto when available', () => {
      const mockGetRandomValues = vi.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = 42
        }
        return arr
      })

      globalThis.window = {
        crypto: {
          getRandomValues: mockGetRandomValues,
        },
      }

      const array = new Uint8Array(8)
      getRandomValues(array)

      expect(mockGetRandomValues).toHaveBeenCalledWith(array)
      expect(array.every((val) => val === 42)).toBe(true)
    })

    it('should fall back to globalThis.crypto when window is not available', () => {
      delete globalThis.window

      const mockGetRandomValues = vi.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = 99
        }
        return arr
      })

      Object.defineProperty(globalThis, 'crypto', {
        value: {
          getRandomValues: mockGetRandomValues,
        },
        writable: true,
        configurable: true,
      })

      const array = new Uint8Array(8)
      getRandomValues(array)

      expect(mockGetRandomValues).toHaveBeenCalledWith(array)
      expect(array.every((val) => val === 99)).toBe(true)
    })

    it('should throw error when WebCrypto is not available', () => {
      delete globalThis.window

      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const array = new Uint8Array(8)

      expect(() => getRandomValues(array)).toThrow(
        'WebCrypto not available in this environment',
      )
    })

    it('should throw error when crypto exists but getRandomValues is missing', () => {
      delete globalThis.window

      Object.defineProperty(globalThis, 'crypto', {
        value: {}, // crypto exists but without getRandomValues
        writable: true,
        configurable: true,
      })

      const array = new Uint8Array(8)

      expect(() => getRandomValues(array)).toThrow(
        'WebCrypto not available in this environment',
      )
    })
  })
})
