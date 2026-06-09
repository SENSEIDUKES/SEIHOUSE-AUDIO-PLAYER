import type { CSSProperties } from "react"

/** A single playable track. */
export interface Track {
    title: string
    artist: string
    audioFile: string
    purchaseUrl?: string
    lyrics?: string
}

/** Theme colors. Applied to the player root as CSS custom properties. */
export interface AudioPlayerTheme {
    /** Buttons, thumb, accents. */
    accentColor?: string
    /** Icon color sitting on top of the accent-filled play button. */
    playIconColor?: string
    /** Primary text (title / time). */
    textColor?: string
    /** Filled portion of the progress bar. */
    progressColor?: string
    /** Unfilled portion of the progress bar. */
    trackColor?: string
    /** Player background tint (sits over the optional background image). */
    backgroundColor?: string
}

export interface BackgroundImage {
    src: string
    alt?: string
}

export interface AudioPlayerProps extends AudioPlayerTheme {
    /** Playlist. When non-empty, the player runs in playlist mode. */
    tracks?: Track[]

    /** Single-track fields (used when `tracks` is empty). */
    audioFile?: string
    title?: string
    artist?: string
    purchaseUrl?: string
    lyrics?: string

    /** Playback behavior. */
    autoPlay?: boolean
    loop?: boolean

    /** Presentation. */
    backgroundImage?: BackgroundImage
    /** Backdrop/background-image blur in px. */
    blurSize?: number
    /** Darken overlay over the background image, 0–100. */
    darkenAmount?: number
    showTracklist?: boolean
    showVolume?: boolean

    /** Typography (inline style objects). */
    titleFont?: CSSProperties
    artistFont?: CSSProperties

    /** Passthrough style/class for the root element. */
    className?: string
    style?: CSSProperties
}

/** Options accepted by the `useAudioPlayer` engine hook. */
export interface UseAudioPlayerOptions {
    /** Current source URL. Changing it loads a new track. */
    src: string
    autoPlay?: boolean
    loop?: boolean
    /** Fired when the current track reaches its end. */
    onEnded?: () => void
}

/** A single buffered range reported by the <audio> element. */
export interface BufferedRange {
    /** Inclusive start time in seconds. */
    start: number
    /** Exclusive end time in seconds. */
    end: number
}

/** Everything the UI needs from the engine hook. */
export interface AudioPlayerEngine {
    audioRef: React.RefObject<HTMLAudioElement>

    // State
    isPlaying: boolean
    currentTime: number
    duration: number
    /** Seconds buffered ahead (end of the furthest buffered range). */
    buffered: number
    /** All buffered ranges for advanced UIs (e.g. multi-segment progress). */
    bufferedRanges: BufferedRange[]
    volume: number
    isMuted: boolean
    isBuffering: boolean
    isSeeking: boolean
    hasError: boolean
    errorMessage: string
    hasAudio: boolean
    /**
     * True when the host environment reports that the browser will not honor
     * programmatic volume changes (e.g. iOS Safari). Consumers can use this to
     * display a fallback hint and rely on the mute control only.
     */
    volumeUnsupported: boolean
    /**
     * True when the most recent autoplay attempt was blocked by the browser.
     * The UI can show a "tap to play" affordance so users know why nothing
     * started and how to recover.
     */
    autoplayBlocked: boolean

    // Actions
    play: (reportError?: boolean) => void
    pause: () => void
    toggle: () => void
    seek: (time: number) => void
    seekBy: (delta: number) => void
    setSeeking: (active: boolean) => void
    setVolume: (value: number) => void
    toggleMute: () => void
    retry: () => void
    /** Imperatively reload + play (used by playlist track changes). */
    loadAndPlay: () => void
    /** Acknowledge the autoplay-blocked flag after presenting a UI affordance. */
    dismissAutoplayBlocked: () => void
}
