import { useEffect, useRef, useState } from "react"
import type { CSSProperties, KeyboardEvent } from "react"
// Type-only import: erased at compile time, so wavesurfer.js itself is only
// ever loaded through the dynamic import() below (vite splits it into its own
// chunk that consumers without showWaveform never download).
import type WaveSurfer from "wavesurfer.js"
import type { WaveSurferOptions } from "wavesurfer.js"
import { ProgressBar } from "./ProgressBar"
import { computePeaksFromUrl, extractPeaks } from "../core/waveform/peaks"
import { formatTime } from "../utils/formatTime"

export interface WaveformProgressProps {
    // Exact ProgressBar contract — the waveform is a drop-in scrubber.
    currentTime: number
    duration: number
    buffered: number
    disabled: boolean
    isSeeking: boolean
    onSeek: (time: number) => void
    onSeekStart: () => void
    onSeekEnd: () => void

    /** Precomputed peaks (priority 1) with their duration. */
    peaks?: number[][]
    peaksDuration?: number
    /** Decoded PCM from the engine (priority 2 — webaudio backend). */
    getDecodedData?: () => AudioBuffer | null
    /**
     * Audio URL for the fetch+decode fallback (priority 3). Only pass this on
     * backends that will not decode the file themselves (html5) — it costs a
     * second download and requires CORS on remote sources.
     */
    url?: string
    /** Logical track identity; changing it resets the waveform. */
    sourceKey?: string

    /** Canvas height in px. Default 48. */
    height?: number
    /** Lower-resolution proof option; limits the rendered peak count. */
    barCount?: number
    /** Alias for barCount used by preset/workshop configs. */
    resolution?: number
    barWidth?: number
    barGap?: number
    barRadius?: number
    amplitudeScale?: number
    mirrored?: boolean
    /** Concrete colors. Fall back to --ap-track / --ap-progress / --ap-accent. */
    waveColor?: WaveSurferOptions["waveColor"]
    progressColor?: WaveSurferOptions["progressColor"]
    bufferedColor?: string
    cursorColor?: string
    showCursor?: boolean
}

type WaveformStatus = "pending" | "ready" | "failed"

/** Resolve a color prop, falling back to a CSS custom property on the wrapper
 * (canvas fillStyle cannot evaluate `var()` strings). Explicit `var(--x)`
 * values are resolved against the wrapper's computed style too. */
function resolveColor(
    el: HTMLElement,
    explicit: WaveSurferOptions["waveColor"] | undefined,
    cssVar: string,
    fallback: string
): WaveSurferOptions["waveColor"] {
    if (Array.isArray(explicit)) return explicit
    if (typeof explicit !== "string") return explicit ?? fallback
    if (explicit) {
        if (!explicit.includes("var(")) return explicit
        const match = explicit.match(/var\(\s*([^,)]+)/)
        if (match?.[1]) {
            const resolved = getComputedStyle(el)
                .getPropertyValue(match[1].trim())
                .trim()
            if (resolved) return resolved
        }
    }
    const fromVar = getComputedStyle(el).getPropertyValue(cssVar).trim()
    return fromVar || fallback
}

function resolveStringColor(
    el: HTMLElement,
    explicit: string | undefined,
    cssVar: string,
    fallback: string
): string {
    const resolved = resolveColor(el, explicit, cssVar, fallback)
    return Array.isArray(resolved) ? resolved[0] ?? fallback : String(resolved)
}

function reducePeaks(
    peaks: number[][],
    targetCount: number | undefined
): number[][] {
    if (!targetCount || targetCount <= 0) return peaks
    return peaks.map((channel) => {
        if (channel.length <= targetCount) return channel
        const bucketSize = channel.length / targetCount
        return Array.from({ length: targetCount }, (_, i) => {
            const start = Math.floor(i * bucketSize)
            const end = Math.max(start + 1, Math.floor((i + 1) * bucketSize))
            let max = 0
            for (let j = start; j < end && j < channel.length; j++) {
                max = Math.max(max, Math.abs(channel[j] ?? 0))
            }
            return max
        })
    })
}

/**
 * Waveform scrubber rendered by wavesurfer.js. The engine remains the only
 * playback owner: wavesurfer is created with pre-resolved `peaks` + `duration`
 * only (never a URL or media element), progress is pushed in via `setTime`,
 * and click/drag interactions are forwarded out through the same
 * onSeek/onSeekStart/onSeekEnd contract as ProgressBar.
 *
 * While peaks are loading — or when they cannot be produced at all — the
 * regular ProgressBar renders in the same fixed-height slot, so scrubbing
 * always works and the layout never shifts.
 */
export function WaveformProgress({
    currentTime,
    duration,
    buffered,
    disabled,
    isSeeking,
    onSeek,
    onSeekStart,
    onSeekEnd,
    peaks,
    peaksDuration,
    getDecodedData,
    url,
    sourceKey,
    height = 48,
    barCount,
    resolution,
    barWidth = 2,
    barGap = 1,
    barRadius = 2,
    amplitudeScale = 1,
    mirrored = true,
    waveColor,
    progressColor,
    bufferedColor,
    cursorColor,
    showCursor = true,
}: WaveformProgressProps) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const wsRef = useRef<WaveSurfer | null>(null)
    const draggingRef = useRef(false)
    const lastDragEndRef = useRef(0)
    const [status, setStatus] = useState<WaveformStatus>("pending")

    // Callback/value refs so the create effect doesn't re-run when the host
    // re-renders with new closures (engine state changes every frame).
    const onSeekRef = useRef(onSeek)
    onSeekRef.current = onSeek
    const onSeekStartRef = useRef(onSeekStart)
    onSeekStartRef.current = onSeekStart
    const onSeekEndRef = useRef(onSeekEnd)
    onSeekEndRef.current = onSeekEnd
    const durationRef = useRef(duration)
    durationRef.current = duration
    const currentTimeRef = useRef(currentTime)
    currentTimeRef.current = currentTime

    const sourceId = sourceKey ?? url ?? ""
    // Flips false→true when the engine loads metadata — for the webaudio
    // backend that is the moment getDecodedData() starts returning the buffer.
    const hasDuration = duration > 0

    // Create / destroy the wavesurfer instance per logical source.
    useEffect(() => {
        let cancelled = false
        setStatus("pending")

        const resolvePeaks = async (): Promise<{
            peaks: number[][]
            duration: number
        } | null> => {
            if (peaks && peaks.length > 0 && (peaks[0]?.length ?? 0) > 0) {
                const d = peaksDuration ?? durationRef.current
                if (d > 0) return { peaks, duration: d }
            }
            const decoded = getDecodedData?.()
            if (decoded) {
                return {
                    peaks: extractPeaks(decoded),
                    duration: decoded.duration,
                }
            }
            if (url && url.trim().length > 0) {
                // Deliberately not aborted on cleanup: the result is cached by
                // URL, so a StrictMode remount or quick re-run reuses it
                // instead of failing on a shared aborted promise.
                return await computePeaksFromUrl(url)
            }
            return null
        }

        const run = async () => {
            try {
                const resolved = await resolvePeaks()
                if (cancelled) return
                if (!resolved) {
                    // Nothing to draw from (e.g. webaudio before first load).
                    // Stay pending so the ProgressBar fallback keeps working;
                    // the effect re-runs when duration/peaks arrive.
                    return
                }
                const WaveSurferCtor = (await import("wavesurfer.js")).default
                if (cancelled) return
                const container = containerRef.current
                const wrapper = wrapperRef.current
                if (!container || !wrapper) return
                wsRef.current?.destroy()
                container.innerHTML = ""

                const peakResolution = resolution ?? barCount
                const ws = WaveSurferCtor.create({
                    container,
                    peaks: reducePeaks(resolved.peaks, peakResolution),
                    duration: resolved.duration,
                    height,
                    normalize: true,
                    interact: true,
                    dragToSeek: false,
                    barWidth,
                    barGap,
                    barRadius,
                    barHeight: amplitudeScale,
                    barAlign: mirrored ? undefined : "bottom",
                    cursorWidth: showCursor ? 2 : 0,
                    waveColor: resolveColor(
                        wrapper,
                        waveColor,
                        "--ap-track",
                        "rgba(204, 204, 204, 0.35)"
                    ),
                    progressColor: resolveColor(
                        wrapper,
                        progressColor,
                        "--ap-progress",
                        "#FFFFFF"
                    ),
                    cursorColor: resolveStringColor(
                        wrapper,
                        cursorColor,
                        "--ap-accent",
                        "#FFFFFF"
                    ),
                })

                // Drag: wavesurfer renders the visual at full frame rate; the
                // engine only seeks once on release — the same visual-only-
                // while-dragging behavior as ProgressBar.
                ws.on("dragstart", () => {
                    draggingRef.current = true
                    onSeekStartRef.current()
                })
                ws.on("dragend", (relativeX: number) => {
                    draggingRef.current = false
                    lastDragEndRef.current = performance.now()
                    onSeekRef.current(relativeX * durationRef.current)
                    onSeekEndRef.current()
                })
                ws.on("click", (relativeX: number) => {
                    // A drag past the threshold can still emit a trailing
                    // click; the dragend handler already seeked.
                    if (performance.now() - lastDragEndRef.current < 80) return
                    onSeekStartRef.current()
                    onSeekRef.current(relativeX * durationRef.current)
                    onSeekEndRef.current()
                })
                // Note: the `interaction` event double-fires alongside
                // click/drag and is intentionally ignored.

                wsRef.current = ws
                ws.setTime(currentTimeRef.current)
                setStatus("ready")
            } catch {
                if (!cancelled) setStatus("failed")
            }
        }
        void run()

        return () => {
            cancelled = true
            draggingRef.current = false
            wsRef.current?.destroy()
            wsRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        sourceId,
        hasDuration,
        peaks,
        peaksDuration,
        url,
        getDecodedData,
        barCount,
        resolution,
        barWidth,
        barGap,
        barRadius,
        amplitudeScale,
        mirrored,
        showCursor,
    ])

    // Push playback position into the waveform (suppressed while dragging).
    const lastPushedRef = useRef(-1)
    useEffect(() => {
        const ws = wsRef.current
        if (!ws || status !== "ready" || draggingRef.current) return
        if (Math.abs(currentTime - lastPushedRef.current) < 0.01) return
        lastPushedRef.current = currentTime
        ws.setTime(currentTime)
    }, [currentTime, status])

    // Live theme/size updates without recreating the instance.
    useEffect(() => {
        const ws = wsRef.current
        const wrapper = wrapperRef.current
        if (!ws || !wrapper || status !== "ready") return
        ws.setOptions({
            height,
            barWidth,
            barGap,
            barRadius,
            barHeight: amplitudeScale,
            barAlign: mirrored ? undefined : "bottom",
            cursorWidth: showCursor ? 2 : 0,
            waveColor: resolveColor(
                wrapper,
                waveColor,
                "--ap-track",
                "rgba(204, 204, 204, 0.35)"
            ),
            progressColor: resolveColor(
                wrapper,
                progressColor,
                "--ap-progress",
                "#FFFFFF"
            ),
            cursorColor: resolveStringColor(
                wrapper,
                cursorColor,
                "--ap-accent",
                "#FFFFFF"
            ),
        })
    }, [
        height,
        barWidth,
        barGap,
        barRadius,
        amplitudeScale,
        mirrored,
        showCursor,
        waveColor,
        progressColor,
        cursorColor,
        status,
    ])

    // Keyboard seeking — mirrors ProgressBar's handler verbatim so the
    // waveform scrubber has full slider-key parity (see ProgressBar.tsx).
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (disabled || duration <= 0) return
        let next: number | null = null
        const step = event.shiftKey ? 30 : 5
        switch (event.key) {
            case "ArrowRight":
            case "ArrowUp":
                next = currentTime + step
                break
            case "ArrowLeft":
            case "ArrowDown":
                next = currentTime - step
                break
            case "Home":
                next = 0
                break
            case "End":
                next = duration
                break
            case "PageUp":
                next = currentTime + 10
                break
            case "PageDown":
                next = currentTime - 10
                break
            default:
                return
        }
        event.preventDefault()
        onSeek(next)
    }

    const showWave = status === "ready" && !disabled && duration > 0
    const ariaValueNow =
        Number.isFinite(currentTime) && currentTime > 0
            ? Math.round(currentTime * 10) / 10
            : 0
    const clampPct = (v: number) =>
        Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0
    const bufferedPct = clampPct(duration > 0 ? (buffered / duration) * 100 : 0)

    return (
        <div
            ref={wrapperRef}
            className={`ap-waveform${isSeeking ? " ap-waveform--seeking" : ""}`}
            style={{
                height: `${height}px`,
                "--ap-waveform-buffered": bufferedColor,
            } as CSSProperties}
            data-waveform-resolution={resolution ?? barCount ?? undefined}
        >
            <div
                className="ap-waveform__surface"
                role="slider"
                tabIndex={showWave ? 0 : -1}
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={Math.floor(duration)}
                aria-valuenow={ariaValueNow}
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                aria-disabled={disabled}
                onKeyDown={handleKeyDown}
                // visibility (not display) keeps layout measurable so the
                // wavesurfer canvas is created at the right width; hidden
                // surfaces also drop out of the accessibility tree, so the
                // slider role never coexists with the fallback ProgressBar's.
                style={{ visibility: showWave ? "visible" : "hidden" }}
            >
                <div ref={containerRef} className="ap-waveform__canvas" />
                <div
                    className="ap-waveform__buffered"
                    style={{ width: `${bufferedPct}%` }}
                />
            </div>
            {!showWave && (
                <div className="ap-waveform__fallback">
                    <ProgressBar
                        currentTime={currentTime}
                        duration={duration}
                        buffered={buffered}
                        disabled={disabled}
                        isSeeking={isSeeking}
                        onSeek={onSeek}
                        onSeekStart={onSeekStart}
                        onSeekEnd={onSeekEnd}
                    />
                </div>
            )}
        </div>
    )
}
