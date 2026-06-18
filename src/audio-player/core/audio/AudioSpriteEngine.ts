function getAudioContextCtor(): typeof AudioContext | undefined {
    if (typeof window === "undefined") return undefined
    return (
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext
    )
}

function clamp01(value: number): number {
    if (!Number.isFinite(value)) return 1
    return Math.max(0, Math.min(1, value))
}

function positiveSeconds(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, value)
}

export type AudioSpriteInstanceId = string

export interface AudioSpriteClipDefinition {
    /** Clip start within the decoded pack, in seconds. */
    offset: number
    /** Clip duration in seconds. */
    duration: number
    /** Default loop behavior for this clip. Can be overridden per play(). */
    loop?: boolean
    /** Default playback volume for this clip. Can be overridden per play(). */
    volume?: number
}

export interface AudioSpriteManifest {
    /** Single audio file containing every named clip. */
    src: string
    /** Named clips addressed by plugin/Vault Radio callers. */
    clips: Record<string, AudioSpriteClipDefinition>
}

export interface AudioSpritePlayOptions {
    volume?: number
    loop?: boolean
}

export interface AudioSpriteInstanceInfo {
    id: AudioSpriteInstanceId
    clipName: string
    loop: boolean
    volume: number
}

type AudioSpriteInstance = AudioSpriteInstanceInfo & {
    source: AudioBufferSourceNode
    gain: GainNode
}

let nextInstanceId = 0

function createInstanceId(): AudioSpriteInstanceId {
    nextInstanceId += 1
    return `sap-sprite-${nextInstanceId}`
}

/**
 * SAP-native audio sprite engine for short Vault Radio / plugin-layer sounds.
 *
 * This intentionally does not replace the player's track playback backend. It
 * decodes one declared pack and lets trusted SAP plugin surfaces trigger named
 * slices through Web Audio (`AudioBufferSourceNode.start(when, offset, duration)`).
 */
export class AudioSpriteEngine {
    private ctx: AudioContext | null = null
    private output: GainNode | null = null
    private manifest: AudioSpriteManifest | null = null
    private buffer: AudioBuffer | null = null
    private loadAbort: AbortController | null = null
    private loadPromise: Promise<void> | null = null
    private instances = new Map<AudioSpriteInstanceId, AudioSpriteInstance>()
    private generation = 0

    private ensureContext(): AudioContext {
        if (this.ctx && this.ctx.state !== "closed") return this.ctx
        const Ctor = getAudioContextCtor()
        if (!Ctor) throw new Error("Web Audio API unavailable for SAP sprites.")
        this.ctx = new Ctor()
        this.output = this.ctx.createGain()
        this.output.connect(this.ctx.destination)
        return this.ctx
    }

    async load(manifest: AudioSpriteManifest): Promise<void> {
        const src = manifest.src.trim()
        if (!src) throw new Error("Audio sprite manifest requires a src URL.")

        this.generation += 1
        const generation = this.generation
        this.loadAbort?.abort()
        this.stopAll()
        this.manifest = { ...manifest, src }
        this.buffer = null

        const abort = new AbortController()
        this.loadAbort = abort
        this.loadPromise = (async () => {
            const response = await fetch(src, { signal: abort.signal })
            if (!response.ok) {
                throw new Error(`Audio sprite pack failed to load: ${response.status}`)
            }
            const data = await response.arrayBuffer()
            const decoded = await this.ensureContext().decodeAudioData(data)
            if (generation !== this.generation) return
            this.buffer = decoded
        })()

        try {
            await this.loadPromise
        } finally {
            if (this.loadAbort === abort) this.loadAbort = null
        }
    }

    async ready(): Promise<void> {
        await this.loadPromise
    }

    play(
        clipName: string,
        options: AudioSpritePlayOptions = {}
    ): AudioSpriteInstanceId | null {
        const manifest = this.manifest
        const buffer = this.buffer
        if (!manifest || !buffer) return null

        const clip = manifest.clips[clipName]
        if (!clip) return null

        const ctx = this.ensureContext()
        void ctx.resume().catch(() => {})
        const output = this.output
        if (!output) return null

        const offset = Math.min(positiveSeconds(clip.offset), buffer.duration)
        const duration = Math.min(
            positiveSeconds(clip.duration),
            Math.max(0, buffer.duration - offset)
        )
        if (duration <= 0) return null

        const loop = options.loop ?? clip.loop ?? false
        const volume = clamp01(options.volume ?? clip.volume ?? 1)
        const id = createInstanceId()
        const source = ctx.createBufferSource()
        const gain = ctx.createGain()

        source.buffer = buffer
        source.loop = loop
        if (loop) {
            source.loopStart = offset
            source.loopEnd = offset + duration
        }
        gain.gain.setValueAtTime(volume, ctx.currentTime)
        source.connect(gain)
        gain.connect(output)

        const instance: AudioSpriteInstance = {
            id,
            clipName,
            loop,
            volume,
            source,
            gain,
        }
        this.instances.set(id, instance)
        source.onended = () => {
            if (this.instances.get(id) === instance) this.removeInstance(id)
        }
        source.start(0, offset, loop ? undefined : duration)
        return id
    }

    stop(id: AudioSpriteInstanceId): void {
        const instance = this.instances.get(id)
        if (!instance) return
        instance.source.onended = null
        try {
            instance.source.stop()
        } catch {}
        this.removeInstance(id)
    }

    fade(id: AudioSpriteInstanceId, toVolume: number, durationMs: number): void {
        const instance = this.instances.get(id)
        if (!instance || !this.ctx) return
        const gain = instance.gain.gain
        const now = this.ctx.currentTime
        const duration = Math.max(0, durationMs) / 1000
        const target = clamp01(toVolume)
        gain.cancelScheduledValues(now)
        gain.setValueAtTime(gain.value, now)
        gain.linearRampToValueAtTime(target, now + duration)
        instance.volume = target
    }

    stopAll(): void {
        for (const id of [...this.instances.keys()]) this.stop(id)
    }

    getActiveInstances(): AudioSpriteInstanceInfo[] {
        return [...this.instances.values()].map(({ id, clipName, loop, volume }) => ({
            id,
            clipName,
            loop,
            volume,
        }))
    }

    dispose(): void {
        this.generation += 1
        this.loadAbort?.abort()
        this.loadAbort = null
        this.loadPromise = null
        this.stopAll()
        this.output?.disconnect()
        this.output = null
        this.buffer = null
        this.manifest = null
        if (this.ctx && this.ctx.state !== "closed") {
            void this.ctx.close().catch(() => {})
        }
        this.ctx = null
    }

    private removeInstance(id: AudioSpriteInstanceId): void {
        const instance = this.instances.get(id)
        if (!instance) return
        this.instances.delete(id)
        try {
            instance.source.disconnect()
        } catch {}
        try {
            instance.gain.disconnect()
        } catch {}
    }
}

export function createAudioSpriteEngine(): AudioSpriteEngine {
    return new AudioSpriteEngine()
}
