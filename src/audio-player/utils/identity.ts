import type { Track, TrackArtwork } from "../types"

export interface ResolvedTrackIdentity {
    title: string
    artist: string
    album?: string
    project?: string
    release?: string
    edition?: string
    label?: string
    year?: string | number
    catalogId?: string
    artwork?: TrackArtwork
    thumbnailArtwork?: TrackArtwork
    heroArtwork?: TrackArtwork
    mediaArtwork: MediaImage[]
    eyebrow: string
    detailLine: string
}

function firstArtwork(track: Track): TrackArtwork | undefined {
    return (
        track.identity?.heroArtwork ??
        track.identity?.thumbnailArtwork ??
        track.identity?.artwork?.[0] ??
        track.artwork?.[0]
    )
}

export function resolveTrackIdentity(track: Track | null | undefined): ResolvedTrackIdentity {
    const artwork = track ? firstArtwork(track) : undefined
    const album = track?.identity?.albumTitle ?? track?.album
    const project = track?.identity?.projectTitle
    const release = track?.identity?.releaseTitle
    const title = track?.identity?.title ?? track?.title ?? "Nothing playing"
    const artist = track?.identity?.artistName ?? track?.artist ?? "—"
    const detailParts = [album ?? project ?? release, track?.identity?.edition, track?.identity?.year]
        .filter(Boolean)
        .map(String)

    return {
        title,
        artist,
        album,
        project,
        release,
        edition: track?.identity?.edition,
        label: track?.identity?.label,
        year: track?.identity?.year,
        catalogId: track?.identity?.catalogId,
        artwork,
        heroArtwork: track?.identity?.heroArtwork ?? artwork,
        thumbnailArtwork: track?.identity?.thumbnailArtwork ?? artwork,
        mediaArtwork: artwork?.src
            ? [{ src: artwork.src, sizes: artwork.sizes ?? "512x512", type: artwork.type ?? "image/jpeg" }]
            : [],
        eyebrow: track ? "SEIHouse · Official Audio" : "SEIHouse Audio",
        detailLine: detailParts.join(" · "),
    }
}

export function artworkBackground(artwork?: TrackArtwork): string | undefined {
    return artwork?.src ? `url("${artwork.src}")` : undefined
}
