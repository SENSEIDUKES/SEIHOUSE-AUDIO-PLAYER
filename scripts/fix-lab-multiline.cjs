const fs = require('fs');
let content = fs.readFileSync('src/demo/lab.tsx', 'utf8');

// Remove unused import
content = content.replace(/AudioPlayer,\r?\n\s*/g, '');

const regex = /<AudioPlayer([\s\S]*?)\/>/g;
content = content.replace(regex, (match, attrs) => {
    let sessionProps = [];
    
    // Extract using robust multiline regexes
    let tracks = attrs.match(/tracks=\{([^}]+)\}/);
    let audioFile = attrs.match(/audioFile=(?:\"([^\"]*)\"|\{([^}]+)\})/);
    let title = attrs.match(/title=(?:\"([^\"]+)\"|\{([^}]+)\})/);
    let artist = attrs.match(/artist=(?:\"([^\"]+)\"|\{([^}]+)\})/);
    let autoPlay = attrs.match(/autoPlay(=\{[^}]+\})?/);
    let loop = attrs.match(/loop(=\{[^}]+\})?/);
    let shuffle = attrs.match(/shuffle(=\{[^}]+\})?/);
    let repeatMode = attrs.match(/repeatMode=\"([^\"]+)\"/);
    let plugins = attrs.match(/plugins=\{([^}]+)\}/);
    let audioBackend = attrs.match(/audioBackend=\{([^}]+)\}/);

    let initQueue = tracks ? `{${tracks[1]}}` : null;
    if (!initQueue && audioFile && audioFile[1] !== '') {
        let t = title ? (title[1] ? `"${title[1]}"` : title[2]) : '"Track"';
        let a = artist ? (artist[1] ? `"${artist[1]}"` : artist[2]) : '"Artist"';
        let f = audioFile[1] ? `"${audioFile[1]}"` : audioFile[2];
        initQueue = `{[{ title: ${t}, artist: ${a}, audioFile: ${f} }]}`;
    }

    if (initQueue) sessionProps.push(`initialQueue=${initQueue}`);
    if (autoPlay) sessionProps.push(autoPlay[1] ? `autoPlay${autoPlay[1]}` : `autoPlay`);
    if (repeatMode) sessionProps.push(`repeatMode="${repeatMode[1]}"`);
    else if (loop) sessionProps.push(`repeatMode="one"`);
    if (shuffle) sessionProps.push(shuffle[1] ? `shuffle${shuffle[1]}` : `shuffle`);
    if (plugins) sessionProps.push(`plugins={${plugins[1]}}`);
    if (audioBackend) sessionProps.push(`audioBackend={${audioBackend[1]}}`);

    let newAttrs = attrs
        .replace(/tracks=\{[^}]+\}/g, '')
        .replace(/audioFile=\"[^\"]*\"/g, '')
        .replace(/audioFile=\{[^}]+\}/g, '')
        .replace(/title=\"[^\"]*\"/g, '')
        .replace(/title=\{[^}]+\}/g, '')
        .replace(/artist=\"[^\"]*\"/g, '')
        .replace(/artist=\{[^}]+\}/g, '')
        .replace(/autoPlay(=\{[^}]+\})?/g, '')
        .replace(/loop(=\{[^}]+\})?/g, '')
        .replace(/shuffle(=\{[^}]+\})?/g, '')
        .replace(/repeatMode=\"[^\"]+\"/g, '')
        .replace(/plugins=\{[^}]+\}/g, '')
        .replace(/audioBackend=\{[^}]+\}/g, '')
        .replace(/showTracklist(=\{[^}]+\})?/g, '')
        .replace(/showWaveform(=\{[^}]+\})?/g, '')
        .replace(/lyrics=\"[^\"]*\"/g, '')
        .replace(/lyrics=\{[^}]+\}/g, '')
        .replace(/showVolume={false}/g, ''); // Fix the floating ={false} issue early

    return `<AudioSessionProvider ${sessionProps.join(' ')}>\n    <FullCardPlayer${newAttrs}/>\n</AudioSessionProvider>`;
});

content = content.replace(/(?<!use)AudioPlayer(?!Theme|Plugin)/g, 'FullCardPlayer');
content = content.replace(/import {([^}]+)FullCardPlayer,([^}]+)FullCardPlayer,([^}]+)}/, 'import {$1FullCardPlayer,$2$3}');
fs.writeFileSync('src/demo/lab.tsx', content, 'utf8');
console.log('Fixed multiline attributes perfectly.');
