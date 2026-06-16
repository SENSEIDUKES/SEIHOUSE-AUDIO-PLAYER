const fs = require('fs');

function migrateLab() {
    let content = fs.readFileSync('src/demo/lab.tsx', 'utf8');

    // Remove imports
    content = content.replace(/AudioPlayer,\r?\n\s*/g, '');

    // Replace <AudioPlayer ... /> tags
    const regex = /<AudioPlayer([\s\S]*?)\/>/g;
    
    content = content.replace(regex, (match, attrs) => {
        let sessionProps = [];
        
        const extractAttr = (name) => {
            const m = attrs.match(new RegExp(name + '={([^}]+)}'));
            if (m) return m[1];
            const m2 = attrs.match(new RegExp(name + '="([^"]+)"'));
            if (m2) return '"' + m2[1] + '"';
            const m3 = attrs.match(new RegExp(name + '(?=[\\s>])'));
            if (m3) return 'true';
            return null;
        };

        const tracks = extractAttr('tracks');
        const audioFile = extractAttr('audioFile');
        const title = extractAttr('title');
        const artist = extractAttr('artist');
        
        let initialQueue = tracks ? '{' + tracks + '}' : null;
        if (!initialQueue && audioFile) {
            initialQueue = `{[{ title: ${title || '"Audio Track"'}, artist: ${artist || '"Artist Name"'}, audioFile: ${audioFile} }]}`;
        } else if (!initialQueue) {
            initialQueue = `{[]}`;
        }

        const autoPlay = extractAttr('autoPlay');
        const loop = extractAttr('loop');
        const shuffle = extractAttr('shuffle');
        const repeatMode = extractAttr('repeatMode');
        const automix = extractAttr('automix');
        const plugins = extractAttr('plugins');
        const audioBackend = extractAttr('audioBackend');

        if (initialQueue) sessionProps.push(`initialQueue=${initialQueue}`);
        if (autoPlay) sessionProps.push(`autoPlay=${autoPlay === 'true' ? '{true}' : '{' + autoPlay + '}'}`);
        if (repeatMode) sessionProps.push(`repeatMode=${repeatMode.startsWith('"') ? repeatMode : '{' + repeatMode + '}'}`);
        else if (loop) sessionProps.push(`repeatMode="one"`);
        if (shuffle) sessionProps.push(`shuffle=${shuffle === 'true' ? '{true}' : '{' + shuffle + '}'}`);
        if (automix) sessionProps.push(`automix=${automix === 'true' ? '{true}' : '{' + automix + '}'}`);
        if (plugins) sessionProps.push(`plugins={${plugins}}`);
        if (audioBackend) sessionProps.push(`audioBackend={${audioBackend}}`);

        const playerAttrs = attrs
            .replace(/tracks={[^}]+}/, '')
            .replace(/audioFile="[^"]+"/, '')
            .replace(/audioFile={[^}]+}/, '')
            .replace(/title="[^"]+"/, '')
            .replace(/title={[^}]+}/, '')
            .replace(/artist="[^"]+"/, '')
            .replace(/artist={[^}]+}/, '')
            .replace(/autoPlay(=true)?/, '')
            .replace(/loop(=true)?/, '')
            .replace(/shuffle(=true)?/, '')
            .replace(/automix(=true)?/, '')
            .replace(/repeatMode="[^"]+"/, '')
            .replace(/audioBackend={[^}]+}/, '')
            .replace(/plugins={[^}]+}/, '')
            .replace(/showTracklist(=\{[^\}]+\}|="[^"]+"|=[a-zA-Z0-9]+)?\s*/g, '')
            .replace(/showWaveform(=\{[^\}]+\}|="[^"]+"|=[a-zA-Z0-9]+)?\s*/g, '')
            .replace(/lyrics="[^"]+"\s*/g, '')
            .replace(/lyrics={[^}]+}\s*/g, '')
            .trim();

        return `<AudioSessionProvider ${sessionProps.join(' ')}>\n    <FullCardPlayer ${playerAttrs} />\n</AudioSessionProvider>`;
    });

    content = content.replace(/(?<!use)AudioPlayer(?!Theme|Plugin)/g, 'FullCardPlayer');
    content = content.replace(/FullCardPlayer,\s*AudioSessionProvider,\s*FullCardPlayer,/g, 'AudioSessionProvider,\n    FullCardPlayer,');
    content = content.replace(/import type { AudioPlayerProps/g, 'import type { FullCardPlayerProps');

    fs.writeFileSync('src/demo/lab.tsx', content, 'utf8');
}

function fixDataTs() {
    let content = fs.readFileSync('src/demo/data.ts', 'utf8');
    content = content.replace('export const OG_DEFAULTS: AudioPlayerProps = {', 'export const OG_DEFAULTS: FullCardPlayerProps = {');
    content = content.replace(/import type \{ AudioPlayerProps, Track \} from "\.\.\/audio-player"/, 'import type { FullCardPlayerProps, Track } from "../audio-player"');
    content = content.replace(/    audioFile:\r?\n\s*"https:\/\/framerusercontent\.com\/assets\/8w3IUatLX9a5JVJ6XPCVuHi94\.mp3",\r?\n/, '');
    content = content.replace(/    autoPlay: false,\r?\n/, '');
    content = content.replace(/    loop: false,\r?\n/, '');
    content = content.replace(/    title: "Audio Track",\r?\n/, '');
    content = content.replace(/    artist: "Artist Name",\r?\n/, '');
    content = content.replace(/    lyrics: "",\r?\n/, '');
    content = content.replace(/    showTracklist: false,\r?\n/, '');
    content = content.replace(/    purchaseUrl: "",\r?\n/, '');
    fs.writeFileSync('src/demo/data.ts', content, 'utf8');
}

function fixTypesTs() {
    let content = fs.readFileSync('src/audio-player/types.ts', 'utf8');
    
    const startIdx = content.indexOf('export interface MainAudioPlayerProps');
    if (startIdx !== -1) {
        const blockEndMatch = content.slice(startIdx).match(/^}$/m);
        if (blockEndMatch) {
            const endIdx = startIdx + blockEndMatch.index + 1;
            content = content.slice(0, startIdx) + content.slice(endIdx);
        }
    }
    
    content = content.replace(/export type AudioPlayerProps = MainAudioPlayerProps\r?\n/, '');
    fs.writeFileSync('src/audio-player/types.ts', content, 'utf8');
}

migrateLab();
fixDataTs();
fixTypesTs();
console.log("Migration and cleanup complete with CRLF support.");
