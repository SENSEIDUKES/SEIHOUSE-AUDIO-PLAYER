import { useEffect, useState } from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

/**
 * Tracks the user's `prefers-reduced-motion` setting and updates if it changes
 * mid-session. SSR-safe: with no `window`/`matchMedia` it reports `false`, the
 * motion-on default, matching the server render.
 */
export function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(() =>
        typeof window !== "undefined" && typeof window.matchMedia === "function"
            ? window.matchMedia(QUERY).matches
            : false
    )

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return
        }
        const mq = window.matchMedia(QUERY)
        const onChange = () => setReduced(mq.matches)
        onChange()
        mq.addEventListener?.("change", onChange)
        return () => mq.removeEventListener?.("change", onChange)
    }, [])

    return reduced
}

export default useReducedMotion
