"use client"

import { useCallback, useRef, useEffect } from "react"

/**
 * Hook that returns a debounced version of a callback
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
        timeoutRef.current = null
      }, delay)
    },
    [delay],
  )
}

/**
 * Hook that returns a throttled version of a callback using RAF
 */
export function useRafCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
): (...args: Parameters<T>) => void {
  const rafRef = useRef<number | null>(null)
  const argsRef = useRef<Parameters<T> | null>(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return useCallback((...args: Parameters<T>) => {
    argsRef.current = args

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        if (argsRef.current !== null) {
          callbackRef.current(...(argsRef.current as Parameters<T>))
        }
        rafRef.current = null
      })
    }
  }, [])
}
