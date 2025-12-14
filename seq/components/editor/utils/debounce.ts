/**
 * Creates a debounced version of a function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Creates a throttled version of a function using requestAnimationFrame
 */
export function rafThrottle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  let latestArgs: Parameters<T> | null = null

  return (...args: Parameters<T>) => {
    latestArgs = args

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (latestArgs !== null) {
          if (latestArgs !== null) {
            fn(...(latestArgs as Parameters<T>))
          }
        }
        rafId = null
      })
    }
  }
}

/**
 * Creates a throttled version of a function with a minimum interval
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => void {
  let lastCallTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime

    if (timeSinceLastCall >= interval) {
      lastCallTime = now
      fn(...args)
    } else if (timeoutId === null) {
      // Schedule a trailing call
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now()
        fn(...args)
        timeoutId = null
      }, interval - timeSinceLastCall)
    }
  }
}
