/**
 * Pure decision helpers for the buffering ("loading") spinner.
 *
 * The media element fires `waiting`/`stalled` during passive preload too — even
 * while paused or idle at 0:00 — which previously stranded the play button on a
 * spinner. These helpers encode the rule that buffering only represents *active*
 * playback waiting, so the logic stays unit-testable without a DOM.
 */

export interface BufferingIntent {
    /** The engine currently considers itself playing. */
    isPlaying: boolean
    /** The backend media element reports a paused state. */
    isPaused: boolean
    /** A `play()` attempt is in flight (promise not yet settled). */
    hasPendingPlay: boolean
}

/**
 * Whether a `waiting`/`stalled` event should be treated as real buffering.
 *
 * True only when playback is actually active or a play attempt is pending;
 * passive preload while paused must not show a spinner.
 */
export function shouldEnterBuffering({
    isPlaying,
    isPaused,
    hasPendingPlay,
}: BufferingIntent): boolean {
    return isPlaying || hasPendingPlay || !isPaused
}

/**
 * Whether the main play button should render the buffering spinner.
 *
 * The spinner is gated by active playback intent so an idle/paused player never
 * spins, while genuine mid-playback buffering still surfaces.
 */
export function shouldShowPlaySpinner(
    isBuffering: boolean,
    isPlaying: boolean
): boolean {
    return isBuffering && isPlaying
}
