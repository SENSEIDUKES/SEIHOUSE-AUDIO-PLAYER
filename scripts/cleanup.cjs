const fs = require('fs');

let types = fs.readFileSync('src/audio-player/types.ts', 'utf8');
types = types.replace(/import type { CSSProperties, ReactNode } from "react"/, 'import type { ReactNode } from "react"');
types = types.replace(/import type { CSSProperties } from "react"\r?\n/, '');
fs.writeFileSync('src/audio-player/types.ts', types);

let lab = fs.readFileSync('src/demo/lab.tsx', 'utf8');
lab = lab.replace(/FullCardPlayer,\s*AudioSessionProvider,\s*FullCardPlayer,/g, 'AudioSessionProvider,\n    FullCardPlayer,');
lab = lab.replace(/showTracklist(=\{true\}|=true)?\s*/g, '');
lab = lab.replace(/showWaveform(=\{true\}|=true)?\s*/g, '');
lab = lab.replace(/audioFile=""\s*/g, '');
lab = lab.replace(/lyrics="Spam me with lyrics\.\.\."\s*/g, '');
lab = lab.replace(/=\{false\}\s*/g, '');
fs.writeFileSync('src/demo/lab.tsx', lab);

console.log("Cleanup complete!");
