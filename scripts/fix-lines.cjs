const fs = require('fs');

let lines = fs.readFileSync('src/demo/lab.tsx', 'utf8').split('\n');
let insidePlayer = false;
let sessionProps = [];
let outLines = [];

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    if (line.includes('<AudioPlayer')) {
        insidePlayer = true;
        sessionProps = [];
        
        let initialQueue = null;
        let audioFile = null;
        let title = null;
        let artist = null;
        
        // Extract properties from the start line
        if (line.includes('tracks={')) {
            let m = line.match(/tracks=\{([^}]+)\}/);
            if (m) initialQueue = '{' + m[1] + '}';
        }
        if (line.includes('audioFile=')) {
            let m = line.match(/audioFile="([^"]+)"/);
            if (m) audioFile = `"${m[1]}"`;
            else {
                let m2 = line.match(/audioFile=\{([^}]+)\}/);
                if (m2) audioFile = m2[1];
            }
        }
        if (line.includes('title=')) {
            let m = line.match(/title="([^"]+)"/);
            if (m) title = `"${m[1]}"`;
            else {
                let m2 = line.match(/title=\{([^}]+)\}/);
                if (m2) title = m2[1];
            }
        }
        if (line.includes('artist=')) {
            let m = line.match(/artist="([^"]+)"/);
            if (m) artist = `"${m[1]}"`;
            else {
                let m2 = line.match(/artist=\{([^}]+)\}/);
                if (m2) artist = m2[1];
            }
        }
        
        if (initialQueue) {
            sessionProps.push(`initialQueue=${initialQueue}`);
        } else if (audioFile && audioFile !== '""') {
            sessionProps.push(`initialQueue={[{ title: ${title || '"Track"'}, artist: ${artist || '"Artist"'}, audioFile: ${audioFile} }]}`);
        }
        
        let autoPlay = line.match(/autoPlay(=\{([^}]+)\})?/);
        if (autoPlay) sessionProps.push(autoPlay[2] ? `autoPlay={${autoPlay[2]}}` : `autoPlay`);
        
        let loop = line.match(/loop(=\{([^}]+)\})?/);
        let repeatMode = line.match(/repeatMode="([^"]+)"/);
        if (repeatMode) sessionProps.push(`repeatMode="${repeatMode[1]}"`);
        else if (loop) sessionProps.push(`repeatMode="one"`);
        
        let shuffle = line.match(/shuffle(=\{([^}]+)\})?/);
        if (shuffle) sessionProps.push(shuffle[2] ? `shuffle={${shuffle[2]}}` : `shuffle`);
        
        // Push the wrapper
        outLines.push(line.replace(/<AudioPlayer.*/, `<AudioSessionProvider ${sessionProps.join(' ')}>`));
        
        // Push the FullCardPlayer
        let playerAttrs = line
            .replace(/<AudioPlayer/, '    <FullCardPlayer')
            .replace(/tracks=\{[^}]+\}/g, '')
            .replace(/audioFile="[^"]*"/g, '')
            .replace(/audioFile=\{[^}]+\}/g, '')
            .replace(/title="[^"]*"/g, '')
            .replace(/title=\{[^}]+\}/g, '')
            .replace(/artist="[^"]*"/g, '')
            .replace(/artist=\{[^}]+\}/g, '')
            .replace(/autoPlay(=\{[^}]+\})?/g, '')
            .replace(/loop(=\{[^}]+\})?/g, '')
            .replace(/shuffle(=\{[^}]+\})?/g, '')
            .replace(/repeatMode="[^"]+"/g, '')
            .replace(/showTracklist(=\{[^}]+\})?/g, '')
            .replace(/showWaveform(=\{[^}]+\})?/g, '')
            .replace(/lyrics="[^"]*"/g, '')
            .replace(/lyrics=\{[^}]+\}/g, '');
            
        outLines.push(playerAttrs);
        
        if (line.includes('/>')) {
            insidePlayer = false;
            outLines.push(line.replace(/.*?\/>/, '</AudioSessionProvider>'));
        }
        continue;
    }
    
    if (insidePlayer) {
        let playerAttrs = line
            .replace(/showTracklist(=\{[^}]+\})?/g, '')
            .replace(/showWaveform(=\{[^}]+\})?/g, '')
            .replace(/lyrics="[^"]*"/g, '')
            .replace(/lyrics=\{[^}]+\}/g, '');
        outLines.push(playerAttrs);
        
        if (line.includes('/>')) {
            insidePlayer = false;
            outLines.push(line.replace(/.*?\/>/, '</AudioSessionProvider>'));
        }
        continue;
    }
    
    outLines.push(line);
}

fs.writeFileSync('src/demo/lab.tsx', outLines.join('\n'), 'utf8');
console.log('Fixed lab.tsx fully via line-by-line parsing');
