import { useState, useEffect } from 'react'

/**
 * Persists state in localStorage.
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const val = value instanceof Function ? value(storedValue) : value
      setStoredValue(val)
      window.localStorage.setItem(key, JSON.stringify(val))
    } catch (err) {
      console.error('useLocalStorage write error:', err)
    }
  }

  const remove = () => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (_) {}
  }

  return [storedValue, setValue, remove]
}
