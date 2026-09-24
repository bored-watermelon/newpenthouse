import { useEffect } from 'react'

/**
 * Anything marked data-reveal eases in the first time it scrolls into view (and any .hl inside it gets its
 * marker sweep). Elements added later (a new route, the play tab mounting) are picked up too. Without JS, or
 * with reduced motion, nothing is hidden in the first place: the hiding CSS only applies under html.js-reveal.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.documentElement.classList.add('js-reveal')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )
    const watch = (root: ParentNode) => root.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el))
    watch(document)
    const mo = new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach((n) => n instanceof Element && (n.matches('[data-reveal]') ? io.observe(n) : watch(n)))))
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}
