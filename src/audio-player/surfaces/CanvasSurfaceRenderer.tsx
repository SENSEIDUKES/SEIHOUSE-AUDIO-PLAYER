import { useMemo } from "react"
import { parseLyrics } from "../plugins/LyricsPlugin"

export interface CanvasSurfaceRendererProps {
    /** Which plugin canvas surface to render (e.g. "lyrics"). */
    surfaceId: string
    /** Active track lyrics (LRC or plain text), when available. */
    lyrics?: string
}

/**
 * Renders the content for the active plugin SEI Canvas surface. Phase 3 supports
 * the lyrics surface; the switch is intentionally small and extensible so future
 * canvas plugins add a case without touching the host/skins. No synced scrolling
 * — just a clean static read of the current track's lyrics.
 */
export function CanvasSurfaceRenderer({
    surfaceId,
    lyrics,
}: CanvasSurfaceRendererProps) {
    switch (surfaceId) {
        case "lyrics":
            return <LyricsCanvas lyrics={lyrics} />
        default:
            return (
                <div className="ap-canvas-surface ap-canvas-surface--empty">
                    <span className="ap-canvas-surface__empty-text">
                        This surface is not available yet.
                    </span>
                </div>
            )
    }
}

function LyricsCanvas({ lyrics }: { lyrics?: string }) {
    const lines = useMemo(
        () => (lyrics ? parseLyrics(lyrics).map((line) => line.text) : []),
        [lyrics]
    )

    if (lines.length === 0) {
        return (
            <div className="ap-canvas-surface ap-canvas-surface--empty" data-surface="lyrics">
                <span className="ap-canvas-surface__empty-text">
                    Lyrics are not available for this track.
                </span>
            </div>
        )
    }

    return (
        <div
            className="ap-canvas-surface ap-canvas-surface--lyrics"
            data-surface="lyrics"
            role="group"
            aria-label="Lyrics"
        >
            <div className="ap-canvas-surface__head">Lyrics</div>
            <ul className="ap-canvas-surface__lyrics-list">
                {lines.map((text, index) => (
                    <li key={index} className="ap-canvas-surface__lyrics-line">
                        {text}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default CanvasSurfaceRenderer
