import { useState, useEffect } from 'react'

/**
 * Debounces a value — useful for search inputs to avoid hammering the API.
 * @param {any}    value  - Value to debounce
 * @param {number} delay  - Delay in ms (default 400)
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
