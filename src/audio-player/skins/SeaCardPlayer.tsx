import type { CSSProperties } from "react"
import type { AudioPlayerTheme, Track } from "../types"
import { useAudioSession } from "../session/AudioSessionContext"
import { ProgressBar } from "../components/ProgressBar"
import { buildThemeVars } from "./themeVars"
import { PauseIcon, PlayIcon, SpinnerIcon } from "./icons"
import "./skins.css"

export interface SeaCardPlayerProps extends AudioPlayerTheme {
    /** The track this card represents and plays into the shared session. */
    track: Track
    /** CSS background for the card art (gradient or url). */
    art?: string
    /** Optional price / tag chip. */
    tag?: string
    className?: string
    style?: CSSProperties
}

/** Identify a track within the queue (matches the session's playNow logic). */
function sameTrack(a: Track, b: Track): boolean {
    return a.audioFile === b.audioFile && a.title === b.title
}

/**
 * An embeddable "SEA card" surface — a marketplace/album card with an overlaid
 * play button that plays its track in the global session. When its track is the
 * active one it shows live progress and a pause state, kept in sync with every
 * other skin through the shared engine.
 */
export function SeaCardPlayer({
    track,
    art = "linear-gradient(135deg,#FF7AC6,#7C5CFF)",
    tag,
    className,
    style,
    ...theme
}: SeaCardPlayerProps) {
    const s = useAudioSession()
    const isActive = s.currentTrack ? sameTrack(s.currentTrack, track) : false
    const isPlayingThis = isActive && s.isPlaying
    const isBufferingThis = isActive && s.isBuffering

    const handleToggle = () => {
        if (isActive) s.toggle()
        else s.playNow(track)
    }

    return (
        <article
            className={`ap-sea${isActive ? " ap-sea--active" : ""}${className ? ` ${className}` : ""}`}
            style={{ ...buildThemeVars(theme), ...style }}
        >
            <div className="ap-sea__art" style={{ background: art }} aria-hidden="true">
                <button
                    type="button"
                    className="ap-btn ap-btn--play ap-sea__play ap-tap"
                    onClick={handleToggle}
                    aria-label={
                        isBufferingThis
                            ? "Buffering audio"
                            : isPlayingThis
                              ? `Pause ${track.title}`
                              : `Play ${track.title}`
                    }
                >
                    {isBufferingThis ? <SpinnerIcon /> : isPlayingThis ? <PauseIcon /> : <PlayIcon />}
                </button>
                {tag && <span className="ap-sea__tag">{tag}</span>}
            </div>
            <div className="ap-sea__body">
                <div className="ap-sea__title" title={track.title}>{track.title}</div>
                <div className="ap-sea__artist" title={track.artist}>{track.artist}</div>
                {isActive && (
                    <div className="ap-sea__progress">
                        <ProgressBar
                            currentTime={s.currentTime}
                            duration={s.duration}
                            buffered={s.buffered}
                            disabled={!s.hasAudio}
                            isSeeking={s.isSeeking}
                            onSeek={s.seek}
                            onSeekStart={() => s.setSeeking(true)}
                            onSeekEnd={() => s.setSeeking(false)}
                        />
                    </div>
                )}
            </div>
        </article>
    )
}

export default SeaCardPlayer
