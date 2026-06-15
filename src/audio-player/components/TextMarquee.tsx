import { useEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import { useReducedMotion } from "./useReducedMotion"
import { shouldEnableMarquee } from "../utils/formatMetadata"
import "./text-marquee.css"

export interface TextMarqueeProps {
    children: ReactNode
    /** Merged onto the clipping container. */
    className?: string
    /** Tooltip / full-text affordance for the clipped content. */
    title?: string
    /** Force the marquee off (e.g. compact faces) — renders static truncation. */
    disabled?: boolean
    /** Container must be at least this wide to animate. Defaults to 200px. */
    minWidth?: number
    /** Seconds of travel per 100px of overflow; tunes the scroll speed. */
    secondsPer100px?: number
}

/**
 * Scrolls long text horizontally, but only when it genuinely overflows its
 * container. Overflow is measured with a ResizeObserver (RAF-debounced, never in
 * a render loop), and the scroll is a single GPU-composited transform driven by
 * CSS. When the text fits, or the user prefers reduced motion, it falls back to
 * static ellipsis truncation. The full text stays in one DOM node, so screen
 * readers read it once. Pauses on hover/focus (handled in CSS).
 */
export function TextMarquee({
    children,
    className,
    title,
    disabled = false,
    minWidth = 200,
    secondsPer100px = 3,
}: TextMarqueeProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const innerRef = useRef<HTMLSpanElement>(null)
    const reducedMotion = useReducedMotion()
    const [distance, setDistance] = useState(0)

    useEffect(() => {
        const container = containerRef.current
        const inner = innerRef.current
        if (!container || !inner) return
        if (disabled || reducedMotion || typeof ResizeObserver === "undefined") {
            setDistance(0)
            return
        }

        let rafId = 0
        const measure = () => {
            const containerWidth = container.clientWidth
            const contentWidth = inner.scrollWidth
            const active = shouldEnableMarquee({
                contentWidth,
                containerWidth,
                reducedMotion,
                minWidth,
            })
            setDistance(active ? contentWidth - containerWidth : 0)
        }
        const schedule = () => {
            cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(measure)
        }

        const observer = new ResizeObserver(schedule)
        observer.observe(container)
        observer.observe(inner)
        schedule()

        return () => {
            cancelAnimationFrame(rafId)
            observer.disconnect()
        }
        // Re-measure when the content or gating inputs change.
    }, [children, disabled, reducedMotion, minWidth])

    const scrolling = distance > 0
    // A little end padding so the last glyph clears the edge before reversing.
    const travel = distance + 8
    const style = scrolling
        ? ({
              "--ap-marquee-distance": `${travel}px`,
              "--ap-marquee-duration": `${Math.max(6, (travel / 100) * secondsPer100px)}s`,
          } as CSSProperties)
        : undefined

    return (
        <div
            ref={containerRef}
            className={`ap-marquee${className ? ` ${className}` : ""}`}
            data-scroll={scrolling ? "true" : "false"}
            title={title}
            style={style}
        >
            <span ref={innerRef} className="ap-marquee__inner">
                {children}
            </span>
        </div>
    )
}

export default TextMarquee
