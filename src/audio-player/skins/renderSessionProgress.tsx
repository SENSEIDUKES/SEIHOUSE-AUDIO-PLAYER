import type { AudioPlayerTheme, SessionEngine } from "../types"
import { ProgressBar } from "../components/ProgressBar"

interface RenderSessionProgressOptions extends AudioPlayerTheme {
    hostId: string
    height?: number
}

export function renderSessionProgress(
    session: SessionEngine,
    {
        hostId,
        height,
        accentColor,
        progressColor,
        trackColor,
    }: RenderSessionProgressOptions
) {
    const currentTrack = session.currentTrack
    const rendered = session.renderPluginSlot("progress", {
        hostId,
        currentTime: session.currentTime,
        duration: session.duration,
        buffered: session.buffered,
        disabled: !session.hasAudio,
        isSeeking: session.isSeeking,
        onSeek: session.seek,
        onSeekStart: () => session.setSeeking(true),
        onSeekEnd: () => session.setSeeking(false),
        currentTrack,
        sourceKey: session.sourceKey,
        peaks: currentTrack?.peaks,
        peaksDuration: currentTrack?.waveformDuration,
        getDecodedData: session.getDecodedData,
        url:
            session.getBackendInfo().active === "html5"
                ? currentTrack?.audioFile?.trim()
                : undefined,
        height,
        waveColor: trackColor,
        progressColor,
        cursorColor: accentColor,
    })

    return rendered ?? (
        <ProgressBar
            currentTime={session.currentTime}
            duration={session.duration}
            buffered={session.buffered}
            disabled={!session.hasAudio}
            isSeeking={session.isSeeking}
            onSeek={session.seek}
            onSeekStart={() => session.setSeeking(true)}
            onSeekEnd={() => session.setSeeking(false)}
        />
    )
}
