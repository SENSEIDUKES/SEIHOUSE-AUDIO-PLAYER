import type { CSSProperties } from "react"
import type { AudioPlayerTheme } from "../types"
import { useAudioSession } from "../session/AudioSessionContext"
import { buildThemeVars } from "./themeVars"
import { NextIcon, PauseIcon, PlayIcon, SpinnerIcon } from "./icons"
import "./skins.css"

export interface MiniSidebarPlayerProps extends AudioPlayerTheme {
    /** Optional CSS background for the small art block (gradient or url). */
    art?: string
    className?: string
    style?: CSSProperties
}

/**
 * A condensed widget for a sidebar: small art, current track, play/pause + next.
 * Reads the shared session so it always shows what is globally playing.
 */
export function MiniSidebarPlayer({
    art = "linear-gradient(135deg,#7C5CFF,#22D3A6)",
    className,
    style,
    ...theme
}: MiniSidebarPlayerProps) {
    const s = useAudioSession()
    const { currentTrack, isPlaying, isBuffering, hasAudio } = s
    const empty = !currentTrack

    return (
        <div
            className={`ap-ms${className ? ` ${className}` : ""}`}
            style={{ ...buildThemeVars(theme), ...style }}
            role="region"
            aria-label="Mini player"
        >
            <div
                className={`ap-ms__art${isPlaying ? " ap-ms__art--playing" : ""}`}
                style={{ background: art }}
                aria-hidden="true"
            />
            <div className="ap-ms__meta">
                <span className="ap-ms__title" title={currentTrack?.title}>
                    {currentTrack?.title ?? "Nothing playing"}
                </span>
                <span className="ap-ms__artist" title={currentTrack?.artist}>
                    {currentTrack?.artist ?? "—"}
                </span>
            </div>
            <button
                type="button"
                className="ap-btn ap-btn--play ap-ms__play ap-tap"
                onClick={s.toggle}
                disabled={!hasAudio}
                aria-label={isBuffering ? "Buffering audio" : isPlaying ? "Pause" : "Play"}
            >
                {isBuffering ? <SpinnerIcon /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
                type="button"
                className="ap-btn ap-btn--ghost ap-btn--sm ap-tap"
                onClick={s.next}
                disabled={empty || !s.canNext}
                aria-label="Next track"
            >
                <NextIcon />
            </button>
        </div>
    )
}

export default MiniSidebarPlayer
