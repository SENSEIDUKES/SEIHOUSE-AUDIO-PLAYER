import type { Track, TrackSource } from "../types"

function normalizeSource(source: TrackSource): TrackSource | null {
    const url = source.url?.trim() ?? ""
    if (!url) return null
    const type = source.type?.trim()
    return type ? { url, type } : { url }
}

function dedupeSources(sources: TrackSource[]): TrackSource[] {
    const seen = new Set<string>()
    const next: TrackSource[] = []
    for (const source of sources) {
        const normalized = normalizeSource(source)
        if (!normalized || seen.has(normalized.url)) continue
        seen.add(normalized.url)
        next.push(normalized)
    }
    return next
}

/**
 * Resolve the ordered source list for a track.
 *
 * `track.sources` is authoritative when present and non-empty. Otherwise the
 * legacy `audioFile` remains the primary URL and `fallbackSources` are appended.
 */
export function getTrackSources(track: Track | null | undefined): TrackSource[] {
    if (!track) return []

    const declaredSources = dedupeSources(track.sources ?? [])
    if (declaredSources.length > 0) return declaredSources

    return dedupeSources([
        { url: track.audioFile ?? "" },
        ...(track.fallbackSources ?? []).map((url) => ({ url })),
    ])
}

/** First playable URL for a track after source normalization. */
export function getPrimaryTrackSource(track: Track | null | undefined): string {
    return getTrackSources(track)[0]?.url ?? ""
}

/** Stable signature used to detect source-list changes without storing objects. */
export function trackSourcesSignature(track: Track | null | undefined): string {
    return JSON.stringify(
        getTrackSources(track).map((source) => [source.url, source.type ?? ""])
    )
}
