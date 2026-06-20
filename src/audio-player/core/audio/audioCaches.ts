/** Shared decoded-buffer LRU cache for Web Audio playback. */
export class LRUAudioCache {
    private cache = new Map<string, AudioBuffer>()
    private order: string[] = []

    constructor(private maxSize = 12) {}

    getStats() {
        let size = 0
        for (const buffer of this.cache.values()) {
            // approx bytes: length * channels * 32-bit float (4 bytes)
            size += buffer.length * buffer.numberOfChannels * 4
        }
        return {
            decodedBufferCount: this.cache.size,
            decodedBufferBytes: size,
            lruOrder: [...this.order]
        }
    }

    setMaxSize(size: number) {
        this.maxSize = size
        this.enforceSize()
    }

    prune(keepKeys: string[], keepRecent: number = 0) {
        const toKeep = new Set(keepKeys)
        let recentKept = 0
        
        for (let i = this.order.length - 1; i >= 0; i--) {
            const key = this.order[i]
            if (toKeep.has(key)) continue
            
            if (recentKept < keepRecent) {
                recentKept++
                continue
            }
            
            this.cache.delete(key)
            this.order.splice(i, 1)
        }
    }

    private enforceSize() {
        while (this.cache.size > this.maxSize && this.order.length > 0) {
            const oldestKey = this.order.shift()!
            this.cache.delete(oldestKey)
        }
    }

    get(url: string): AudioBuffer | null {
        const buffer = this.cache.get(url)
        if (!buffer) return null
        
        const index = this.order.indexOf(url)
        if (index > -1) {
            this.order.splice(index, 1)
        }
        this.order.push(url)
        
        return buffer
    }

    set(url: string, buffer: AudioBuffer): void {
        if (this.cache.has(url)) {
            this.cache.delete(url)
            const index = this.order.indexOf(url)
            if (index > -1) this.order.splice(index, 1)
        }
        this.order.push(url)
        this.cache.set(url, buffer)
        this.enforceSize()
    }

    has(url: string): boolean {
        return this.cache.has(url)
    }

    delete(url: string): void {
        this.cache.delete(url)
        const index = this.order.indexOf(url)
        if (index > -1) this.order.splice(index, 1)
    }

    clear(): void {
        this.cache.clear()
        this.order = []
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

    getStats() {
        return { preloadElementCount: this.pool.length }
    }

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
