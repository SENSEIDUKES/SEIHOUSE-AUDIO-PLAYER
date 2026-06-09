import { useCallback, useEffect, useRef, useState } from "react"
import type { AudioPlayerEngine, BufferedRange, UseAudioPlayerOptions } from "./types"

/**
 * Headless audio engine. Owns a single hidden <audio> element and is the sole
 * source of truth for playback state. UI components read state and call actions;
 * they never touch the <audio> element directly.
 *
 * Notable behavior:
 * - `currentTime` is driven by a single rAF loop while playing, and set
 *   explicitly on seek / pause / metadata. There is no second update path.
 * - When `src` changes, playback continues automatically if it was playing
 *   (track-change UX). The very first load only plays when `autoPlay` is set.
 * - Browsers block audible autoplay without a user gesture; `autoPlay` is a
 *   best-effort attempt, not a guarantee. When blocked, the engine exposes an
 *   `autoplayBlocked` flag so the UI can prompt the user for a tap.
 * - A monotonic `playbackToken` is bumped on every source / play-attempt
 *   boundary. Async callbacks captured before the swap check the token and
 *   no-op if it has changed, which removes the rapid-track-skip race.
 */
export function useAudioPlayer(
    options: UseAudioPlayerOptions
): AudioPlayerEngine {
    const { src, autoPlay = false, loop = false, onEnded } = options

    const audioRef = useRef<HTMLAudioElement>(null)
    const currentTimeRef = useRef(0)
    const isSeekingRef = useRef(false)
    const isPlayingRef = useRef(false)
    const playPromiseRef = useRef<Promise<void> | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const isFirstLoadRef = useRef(true)
    const previousVolumeRef = useRef(1)
    const onEndedRef = useRef(onEnded)
    onEndedRef.current = onEnded
    /**
     * Bumped on any operation that should invalidate in-flight async audio
     * callbacks (src change, retry, loadAndPlay). Comparing the captured token
     * to the latest token is how we keep stale `play().then/.catch` from
     * clobbering state after a fast track skip.
     */
    const playbackTokenRef = useRef(0)
    /**
     * Stores the last token for which we already raised the autoplay-blocked
     * affordance, so we don't spam a state update for every rejected promise.
     */
    const lastAutoplayBlockedTokenRef = useRef(-1)

    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [buffered, setBuffered] = useState(0)
    const [bufferedRanges, setBufferedRanges] = useState<BufferedRange[]>([])
    const [volume, setVolumeState] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [isSeeking, setIsSeekingState] = useState(false)
    const [isBuffering, setIsBuffering] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [autoplayBlocked, setAutoplayBlocked] = useState(false)
    const volumeUnsupportedRef = useRef(false)
    const [volumeUnsupported, setVolumeUnsupported] = useState(false)

    const hasAudio = src.trim().length > 0

    const bumpToken = useCallback(() => {
        playbackTokenRef.current += 1
        return playbackTokenRef.current
    }, [])

    const clearPendingPlay = useCallback(() => {
        if (playPromiseRef.current) {
            playPromiseRef.current.catch(() => {
                // Ignore interrupted play attempts during source changes.
            })
            playPromiseRef.current = null
        }
    }, [])

    const stopLoop = useCallback(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }
    }, [])

    const setSeeking = useCallback((active: boolean) => {
        isSeekingRef.current = active
        setIsSeekingState(active)
    }, [])

    const play = useCallback(
        (reportError = true) => {
            const audio = audioRef.current
            if (!audio || !hasAudio) return

            const token = bumpToken()
            clearPendingPlay()
            setHasError(false)
            setErrorMessage("")

            let playPromise: Promise<void>
            try {
                playPromise = audio.play()
            } catch {
                if (playbackTokenRef.current !== token) return
                if (reportError) {
                    setHasError(true)
                    setErrorMessage("Playback failed. Please try again.")
                }
                return
            }
            playPromiseRef.current = playPromise

            playPromise
                .then(() => {
                    if (playbackTokenRef.current !== token) return
                    if (playPromiseRef.current === playPromise) {
                        playPromiseRef.current = null
                    }
                })
                .catch((error: unknown) => {
                    if (playbackTokenRef.current !== token) return
                    if (playPromiseRef.current === playPromise) {
                        playPromiseRef.current = null
                    }
                    const name = error instanceof Error ? error.name : ""
                    if (name === "AbortError") return

                    // Browsers throw NotAllowedError when autoplay is blocked.
                    // Surface this through a dedicated UI flag rather than the
                    // generic error banner.
                    if (name === "NotAllowedError") {
                        if (lastAutoplayBlockedTokenRef.current !== token) {
                            lastAutoplayBlockedTokenRef.current = token
                            setAutoplayBlocked(true)
                        }
                        setIsPlaying(false)
                        setIsBuffering(false)
                        return
                    }

                    setIsPlaying(false)
                    setIsBuffering(false)
                    if (reportError) {
                        setHasError(true)
                        setErrorMessage(
                            name === "NotSupportedError"
                                ? "Audio file not found or format not supported."
                                : "Playback failed. Please try again."
                        )
                    }
                })
        },
        [bumpToken, clearPendingPlay, hasAudio]
    )

    const pause = useCallback(() => {
        const audio = audioRef.current
        if (!audio) return

        const pending = playPromiseRef.current
        if (pending) {
            // Bump the token so the in-flight play() does not flip state back
            // to "playing" once the browser finally resolves it.
            bumpToken()
            pending
                .catch(() => {})
                .finally(() => {
                    if (playPromiseRef.current === pending) {
                        playPromiseRef.current = null
                    }
                    audio.pause()
                })
            return
        }
        audio.pause()
    }, [bumpToken])

    const toggle = useCallback(() => {
        if (!hasAudio) return
        if (isPlayingRef.current) pause()
        else play(true)
    }, [hasAudio, pause, play])

    const seek = useCallback(
        (time: number) => {
            const audio = audioRef.current
            if (!audio || !hasAudio || duration <= 0) return
            const next = Math.max(0, Math.min(duration, time))
            audio.currentTime = next
            currentTimeRef.current = next
            setCurrentTime(next)
        },
        [duration, hasAudio]
    )

    const seekBy = useCallback(
        (delta: number) => {
            const audio = audioRef.current
            if (!audio) return
            seek(audio.currentTime + delta)
        },
        [seek]
    )

    const setVolume = useCallback((value: number) => {
        const audio = audioRef.current
        const next = Math.max(0, Math.min(1, value))
        previousVolumeRef.current = next > 0 ? next : previousVolumeRef.current
        setVolumeState(next)
        if (audio) {
            if (!volumeUnsupportedRef.current && next !== 0) {
                // iOS Safari (and a few other mobile browsers) ignore
                // programmatic volume. Detect this once and surface it to the
                // UI rather than silently letting the slider appear to work.
                audio.volume = next
                if (Math.abs(audio.volume - next) > 0.001) {
                    volumeUnsupportedRef.current = true
                    setVolumeUnsupported(true)
                }
            } else {
                audio.volume = next
            }
            // Dragging the slider above zero implicitly unmutes.
            if (next > 0 && audio.muted) {
                audio.muted = false
                setIsMuted(false)
            }
        }
    }, [])

    const toggleMute = useCallback(() => {
        const audio = audioRef.current
        if (!audio) return
        const nextMuted = !audio.muted
        audio.muted = nextMuted
        setIsMuted(nextMuted)
        // Restore an audible level if unmuting while volume sits at zero.
        if (!nextMuted && audio.volume === 0) {
            const restored = previousVolumeRef.current || 1
            audio.volume = restored
            setVolumeState(restored)
        }
    }, [])

    const retry = useCallback(() => {
        const audio = audioRef.current
        if (!audio || !hasAudio) return
        bumpToken()
        clearPendingPlay()
        setHasError(false)
        setErrorMessage("")
        setAutoplayBlocked(false)
        setIsBuffering(true)
        audio.load()
        play(true)
    }, [bumpToken, clearPendingPlay, hasAudio, play])

    const loadAndPlay = useCallback(() => {
        const audio = audioRef.current
        if (!audio || !hasAudio) return
        bumpToken()
        audio.load()
        play(true)
    }, [bumpToken, hasAudio, play])

    const dismissAutoplayBlocked = useCallback(() => {
        setAutoplayBlocked(false)
    }, [])

    // Wire up all <audio> events. Single rAF loop owns currentTime while playing.
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        let lastUpdate = 0

        const readBuffered = () => {
            try {
                const length = audio.buffered.length
                if (length > 0) {
                    // Collect all ranges so the UI can render multi-segment
                    // buffers (e.g. after seeks that leave gaps).
                    const ranges: BufferedRange[] = []
                    let furthest = 0
                    for (let i = 0; i < length; i++) {
                        const start = audio.buffered.start(i)
                        const end = audio.buffered.end(i)
                        ranges.push({ start, end })
                        if (end > furthest) furthest = end
                    }
                    setBufferedRanges(ranges)
                    setBuffered(furthest)
                } else {
                    setBufferedRanges([])
                    setBuffered(0)
                }
            } catch {
                // buffered can throw before any data is loaded; ignore.
            }
        }

        const loop = (timestamp: number) => {
            if (!isSeekingRef.current) {
                currentTimeRef.current = audio.currentTime
                // Update state once per ~16ms (one frame). The previous 100ms
                // throttle caused visible stutter on 120Hz displays; the audio
                // element's `timeupdate` event still fires at 4Hz on most
                // browsers, so we drive smooth UI from rAF instead.
                if (timestamp - lastUpdate >= 16) {
                    setCurrentTime(audio.currentTime)
                    lastUpdate = timestamp
                }
            }
            if (!audio.paused && !audio.ended) {
                animationFrameRef.current = requestAnimationFrame(loop)
            } else {
                animationFrameRef.current = null
            }
        }

        const handlePlay = () => {
            isPlayingRef.current = true
            setIsPlaying(true)
            setIsBuffering(false)
            setAutoplayBlocked(false)
            if (animationFrameRef.current === null) {
                animationFrameRef.current = requestAnimationFrame(loop)
            }
        }
        const handlePause = () => {
            isPlayingRef.current = false
            setIsPlaying(false)
            stopLoop()
            // Snap to the exact paused position (the throttled loop may lag).
            currentTimeRef.current = audio.currentTime
            setCurrentTime(audio.currentTime)
        }
        const handleEnded = () => {
            isPlayingRef.current = false
            setIsPlaying(false)
            stopLoop()
            // Snap to exact duration so the progress bar reaches 100% even when
            // the rAF loop's throttle left it a frame short.
            setCurrentTime(audio.duration || audio.currentTime)
            onEndedRef.current?.()
        }
        const handleLoadedMetadata = () => {
            setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
        }
        const handleWaiting = () => setIsBuffering(true)
        const clearBuffering = () => setIsBuffering(false)
        const handleError = () => {
            setIsBuffering(false)
            isPlayingRef.current = false
            setIsPlaying(false)
            setHasError(true)
            const error = audio.error
            switch (error?.code) {
                case error?.MEDIA_ERR_ABORTED:
                    setErrorMessage("Playback was aborted. Please try again.")
                    break
                case error?.MEDIA_ERR_NETWORK:
                    setErrorMessage(
                        "Network error. Check your connection and try again."
                    )
                    break
                case error?.MEDIA_ERR_DECODE:
                    setErrorMessage("Audio file is corrupted or unsupported.")
                    break
                case error?.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    setErrorMessage(
                        "Audio file not found or format not supported."
                    )
                    break
                default:
                    setErrorMessage("Failed to load audio. Please try again.")
            }
        }
        const handleLoadStart = () => {
            setHasError(false)
            setErrorMessage("")
        }

        audio.addEventListener("play", handlePlay)
        audio.addEventListener("pause", handlePause)
        audio.addEventListener("ended", handleEnded)
        audio.addEventListener("loadedmetadata", handleLoadedMetadata)
        audio.addEventListener("waiting", handleWaiting)
        audio.addEventListener("stalled", handleWaiting)
        audio.addEventListener("canplay", clearBuffering)
        audio.addEventListener("canplaythrough", clearBuffering)
        audio.addEventListener("playing", clearBuffering)
        audio.addEventListener("progress", readBuffered)
        audio.addEventListener("timeupdate", readBuffered)
        audio.addEventListener("error", handleError)
        audio.addEventListener("loadstart", handleLoadStart)

        // If the source was already cached the loadedmetadata event fires before
        // the effect runs. Catch that case by reading readyState synchronously.
        if (audio.readyState >= 1) {
            handleLoadedMetadata()
            readBuffered()
        }

        return () => {
            stopLoop()
            audio.removeEventListener("play", handlePlay)
            audio.removeEventListener("pause", handlePause)
            audio.removeEventListener("ended", handleEnded)
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
            audio.removeEventListener("waiting", handleWaiting)
            audio.removeEventListener("stalled", handleWaiting)
            audio.removeEventListener("canplay", clearBuffering)
            audio.removeEventListener("canplaythrough", clearBuffering)
            audio.removeEventListener("playing", clearBuffering)
            audio.removeEventListener("progress", readBuffered)
            audio.removeEventListener("timeupdate", readBuffered)
            audio.removeEventListener("error", handleError)
            audio.removeEventListener("loadstart", handleLoadStart)
        }
    }, [stopLoop])

    // Reset + load whenever the source changes. Continues playing across track
    // changes; the initial load only plays when autoPlay is requested.
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const isFirstLoad = isFirstLoadRef.current
        isFirstLoadRef.current = false
        const wasPlaying = isPlayingRef.current
        const shouldPlay = isFirstLoad ? autoPlay : wasPlaying

        // Bump the token up front so any in-flight play() / error handlers
        // from the previous source become no-ops.
        const token = bumpToken()
        clearPendingPlay()
        stopLoop()
        audio.pause()

        // On the first mount, don't reset state or call audio.load() when the
        // source is already loaded/loading from a cache hit. Resetting would
        // discard the browser's preloaded data and make the readyState >= 1
        // synchronous check in the event-listener effect useless.
        if (!isFirstLoad) {
            audio.currentTime = 0
            currentTimeRef.current = 0
            setSeeking(false)
            setCurrentTime(0)
            setDuration(0)
            setBuffered(0)
            setBufferedRanges([])
            setIsPlaying(false)
            setHasError(false)
            setErrorMessage("")
            setIsBuffering(false)
            setAutoplayBlocked(false)
        }

        if (!hasAudio) {
            audio.removeAttribute("src")
            audio.load()
            return
        }

        if (!isFirstLoad) {
            audio.load()
        }
        if (shouldPlay) {
            // Don't surface an error toast for autoplay blocked on first load;
            // the autoplay-blocked affordance handles that case.
            if (isFirstLoad) {
                let playPromise: Promise<void> | null
                try {
                    playPromise = audio.play()
                } catch {
                    return
                }
                if (playPromise) {
                    playPromiseRef.current = playPromise
                    playPromise
                        .then(() => {
                            if (playbackTokenRef.current !== token) return
                            if (playPromiseRef.current === playPromise) {
                                playPromiseRef.current = null
                            }
                        })
                        .catch((error: unknown) => {
                            if (playbackTokenRef.current !== token) return
                            if (playPromiseRef.current === playPromise) {
                                playPromiseRef.current = null
                            }
                            const name =
                                error instanceof Error ? error.name : ""
                            if (name === "AbortError") return
                            if (name === "NotAllowedError") {
                                if (
                                    lastAutoplayBlockedTokenRef.current !==
                                    token
                                ) {
                                    lastAutoplayBlockedTokenRef.current =
                                        token
                                    setAutoplayBlocked(true)
                                }
                                setIsPlaying(false)
                                setIsBuffering(false)
                                return
                            }
                            setHasError(true)
                            setErrorMessage(
                                name === "NotSupportedError"
                                    ? "Audio file not found or format not supported."
                                    : "Playback failed. Please try again."
                            )
                        })
                }
            } else {
                play(!isFirstLoad)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src])

    // Keep the element's volume/loop in sync with state on mount + changes.
    useEffect(() => {
        const audio = audioRef.current
        if (audio) audio.volume = volume
    }, [volume])

    useEffect(() => {
        const audio = audioRef.current
        if (audio) audio.loop = loop
    }, [loop])

    return {
        audioRef,
        isPlaying,
        currentTime,
        duration,
        buffered,
        bufferedRanges,
        volume,
        isMuted,
        isBuffering,
        isSeeking,
        hasError,
        errorMessage,
        hasAudio,
        volumeUnsupported,
        autoplayBlocked,
        play,
        pause,
        toggle,
        seek,
        seekBy,
        setSeeking,
        setVolume,
        toggleMute,
        retry,
        loadAndPlay,
        dismissAutoplayBlocked,
    }
}
