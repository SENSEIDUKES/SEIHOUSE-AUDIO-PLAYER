const fs = require('fs');

let types = fs.readFileSync('src/audio-player/types.ts', 'utf8');
types = types.replace(/import type { CSSProperties } from "react"\n/, '');
fs.writeFileSync('src/audio-player/types.ts', types);

let data = fs.readFileSync('src/demo/data.ts', 'utf8');
data = data.replace(/    audioFile:\n        "https:\/\/framerusercontent\.com\/assets\/8w3IUatLX9a5JVJ6XPCVuHi94\.mp3",\n/, '');
fs.writeFileSync('src/demo/data.ts', data);

let lab = fs.readFileSync('src/demo/lab.tsx', 'utf8');
lab = lab.replace(/FullCardPlayer,\s*AudioSessionProvider,\s*FullCardPlayer,/g, 'AudioSessionProvider,\n    FullCardPlayer,');
lab = lab.replace(/showTracklist(=\{true\}|=true)?\s*/g, '');
lab = lab.replace(/showWaveform(=\{true\}|=true)?\s*/g, '');
lab = lab.replace(/audioFile=""\s*/g, '');
fs.writeFileSync('src/demo/lab.tsx', lab);
