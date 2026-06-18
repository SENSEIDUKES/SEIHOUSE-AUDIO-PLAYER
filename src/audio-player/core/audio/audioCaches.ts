/** Shared decoded-buffer LRU cache for Web Audio playback. */
export class LRUAudioCache {
    private cache = new Map<string, AudioBuffer>()

    constructor(private maxSize = 12) {}

    get(url: string): AudioBuffer | null {
        const buffer = this.cache.get(url)
        if (!buffer) return null
        this.cache.delete(url)
        this.cache.set(url, buffer)
        return buffer
    }

    set(url: string, buffer: AudioBuffer): void {
        if (this.cache.has(url)) {
            this.cache.delete(url)
        } else if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value
            if (oldestKey !== undefined) this.cache.delete(oldestKey)
        }
        this.cache.set(url, buffer)
    }

    has(url: string): boolean {
        return this.cache.has(url)
    }

    delete(url: string): void {
        this.cache.delete(url)
    }

    clear(): void {
        this.cache.clear()
    }
}

function getMimeType(url: string): string {
    const pathname = url.split("?")[0]?.toLowerCase() ?? ""
    if (pathname.endsWith(".wav")) return "audio/wav"
    if (pathname.endsWith(".ogg") || pathname.endsWith(".oga")) return "audio/ogg"
    if (pathname.endsWith(".m4a") || pathname.endsWith(".mp4")) return "audio/mp4"
    if (pathname.endsWith(".aac")) return "audio/aac"
    if (pathname.endsWith(".flac")) return "audio/flac"
    if (pathname.endsWith(".webm")) return "audio/webm"
    return "audio/mpeg"
}

/** Persistent raw audio cache backed by the browser Cache API. */
export class PersistentAudioCache {
    private readonly cacheName = "seihouse-audio-vault-v1"

    private get isAvailable(): boolean {
        return typeof caches !== "undefined" && typeof Response !== "undefined"
    }

    async getArrayBuffer(url: string): Promise<ArrayBuffer | null> {
        if (!this.isAvailable) return null
        try {
            const cache = await caches.open(this.cacheName)
            const response = await cache.match(url)
            return response ? await response.arrayBuffer() : null
        } catch {
            return null
        }
    }

    async putArrayBuffer(url: string, buffer: ArrayBuffer): Promise<void> {
        if (!this.isAvailable) return
        try {
            const cache = await caches.open(this.cacheName)
            const response = new Response(buffer.slice(0), {
                headers: {
                    "Content-Type": getMimeType(url),
                    "Content-Length": buffer.byteLength.toString(),
                },
            })
            await cache.put(url, response)
        } catch (error) {
            console.warn(
                "Persistent cache full or unavailable, skipping disk write.",
                error
            )
        }
    }
}

/** Pool of detached HTMLAudioElements for passive preload / streaming fallbacks. */
export class HTML5AudioPool {
    private pool: HTMLAudioElement[] = []

    constructor(private maxSize = 5) {}

    acquire(): HTMLAudioElement {
        let audio = this.pool.find(
            (candidate) => candidate.paused && !candidate.ended
        )
        if (!audio && this.pool.length < this.maxSize) {
            audio = new Audio()
            audio.preload = "auto"
            this.pool.push(audio)
        } else if (!audio) {
            audio = this.pool[0]
            audio.pause()
        }
        return audio
    }

    release(audio: HTMLAudioElement): void {
        audio.pause()
        audio.removeAttribute("src")
        audio.src = ""
        audio.load()
    }

    releaseAll(): void {
        for (const audio of this.pool) this.release(audio)
    }
}

export const sharedAudioBufferCache = new LRUAudioCache()
export class AudioStorageCache extends PersistentAudioCache {}

export const sharedAudioStorageCache = new PersistentAudioCache()
export const sharedPersistentAudioCache = sharedAudioStorageCache
export const sharedHTML5AudioPool = new HTML5AudioPool()
