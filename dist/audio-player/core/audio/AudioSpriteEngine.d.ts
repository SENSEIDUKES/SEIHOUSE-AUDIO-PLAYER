export type AudioSpriteInstanceId = string;
export interface AudioSpriteClipDefinition {
    /** Clip start within the decoded pack, in seconds. */
    offset: number;
    /** Clip duration in seconds. */
    duration: number;
    /** Default loop behavior for this clip. Can be overridden per play(). */
    loop?: boolean;
    /** Default playback volume for this clip. Can be overridden per play(). */
    volume?: number;
}
export interface AudioSpriteManifest {
    /** Single audio file containing every named clip. */
    src: string;
    /** Named clips addressed by plugin/Vault Radio callers. */
    clips: Record<string, AudioSpriteClipDefinition>;
}
export interface AudioSpritePlayOptions {
    volume?: number;
    loop?: boolean;
}
export interface AudioSpriteInstanceInfo {
    id: AudioSpriteInstanceId;
    clipName: string;
    loop: boolean;
    volume: number;
}
/**
 * SAP-native audio sprite engine for short Vault Radio / plugin-layer sounds.
 *
 * This intentionally does not replace the player's track playback backend. It
 * decodes one declared pack and lets trusted SAP plugin surfaces trigger named
 * slices through Web Audio (`AudioBufferSourceNode.start(when, offset, duration)`).
 */
export declare class AudioSpriteEngine {
    private ctx;
    private output;
    private manifest;
    private buffer;
    private loadAbort;
    private loadPromise;
    private instances;
    private generation;
    private ensureContext;
    load(manifest: AudioSpriteManifest): Promise<void>;
    ready(): Promise<void>;
    play(clipName: string, options?: AudioSpritePlayOptions): AudioSpriteInstanceId | null;
    stop(id: AudioSpriteInstanceId): void;
    fade(id: AudioSpriteInstanceId, toVolume: number, durationMs: number): void;
    stopAll(): void;
    getActiveInstances(): AudioSpriteInstanceInfo[];
    dispose(): void;
    private removeInstance;
}
export declare function createAudioSpriteEngine(): AudioSpriteEngine;
//# sourceMappingURL=AudioSpriteEngine.d.ts.map