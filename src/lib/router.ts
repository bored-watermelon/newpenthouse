import { useEffect, useState } from 'react'

// A minimal client-side router: just enough to have a /case-studies/:slug page without pulling in a routing
// library. `navigate` does a pushState (no full reload); the back/forward buttons work via `popstate`.
const listeners = new Set<() => void>()

export function navigate(path: string) {
  if (location.pathname === path) return
  history.pushState({}, '', path)
  listeners.forEach((l) => l())
}

/** The current pathname, re-rendering on navigation (ours or the browser's back/forward). */
export function useRoute() {
  const [path, setPath] = useState(location.pathname)
  useEffect(() => {
    const onChange = () => setPath(location.pathname)
    listeners.add(onChange)
    window.addEventListener('popstate', onChange)
    return () => {
      listeners.delete(onChange)
      window.removeEventListener('popstate', onChange)
    }
  }, [])
  return path
}
