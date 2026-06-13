import type { CSSProperties } from "react"
import type { AudioPlayerTheme, Track } from "../types"
import { useAudioSession } from "../session/AudioSessionContext"
import { formatTime } from "../utils/formatTime"
import { trackKey } from "../utils/trackKey"
import { buildThemeVars } from "./themeVars"
import { renderSessionProgress } from "./renderSessionProgress"
import { PauseIcon, PlayIcon, SpinnerIcon } from "./icons"
import "./skins.css"

export interface VaultRowPlayerProps extends AudioPlayerTheme {
    /** The track this row represents. */
    track: Track
    /** Optional 1-based number shown at the left of the row. */
    number?: number
    className?: string
    style?: CSSProperties
}

/** Identify a track within the queue the same way the session's playNow does. */
function sameTrack(a: Track, b: Track): boolean {
    return trackKey(a) === trackKey(b)
}

/**
 * A slim Vault list row. Each row controls the shared session: pressing play
 * starts this track in the one global engine (jumping if it's already queued,
 * else appending). When this row is the active track it shows live progress and
 * its play button mirrors the global play state — so it stays in sync with every
 * other skin.
 */
export function VaultRowPlayer({
    track,
    number,
    className,
    style,
    ...theme
}: VaultRowPlayerProps) {
    const s = useAudioSession()
    const isActive = s.currentTrack ? sameTrack(s.currentTrack, track) : false
    const isPlayingThis = isActive && s.isPlaying
    const isBufferingThis = isActive && s.isBuffering

    const handleToggle = () => {
        if (isActive) s.toggle()
        else s.playNow(track)
    }

    return (
        <div
            className={`ap-vr${isActive ? " ap-vr--active" : ""}${className ? ` ${className}` : ""}`}
            style={{ ...buildThemeVars(theme), ...style }}
            aria-current={isActive ? "true" : undefined}
        >
            {number !== undefined && <span className="ap-vr__num">{number}</span>}
            <button
                type="button"
                className="ap-btn ap-btn--play ap-vr__play ap-tap"
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
            <div className="ap-vr__meta">
                <span className="ap-vr__title" title={track.title}>
                    {track.title}
                </span>
                {isActive ? (
                    <span className="ap-vr__progress">
                        {renderSessionProgress(s, {
                            hostId: "vault-row",
                            height: 24,
                            ...theme,
                        })}
                    </span>
                ) : (
                    <span className="ap-vr__artist" title={track.artist}>
                        {track.artist}
                    </span>
                )}
            </div>
            {isActive && (
                <span className="ap-vr__time" aria-hidden="true">
                    {formatTime(s.currentTime)}
                </span>
            )}
            {isPlayingThis && (
                <span className="ap-eq" aria-hidden="true">
                    <i /><i /><i />
                </span>
            )}
        </div>
    )
}

export default VaultRowPlayer
