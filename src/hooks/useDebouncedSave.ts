import { useEffect, useRef } from 'react'

export function useDebouncedSave<T>(value: T, save: (value: T) => void, delay = 500): void {
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    const timer = setTimeout(() => save(value), delay)
    return () => clearTimeout(timer)
  }, [value, save, delay])
}
