const fs = require('fs');

function migrateFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove imports
    content = content.replace(/AudioPlayer,\n\s*/g, '');

    // Replace <AudioPlayer ... /> tags
    const regex = /<AudioPlayer([\s\S]*?)\/>/g;
    
    content = content.replace(regex, (match, attrs) => {
        let sessionProps = [];
        let playerProps = [];
        
        // extractAttr returns the exact JS expression inside the attr
        // e.g. for title="Foo", returns '"Foo"'
        // for title={c.t}, returns 'c.t'
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
            .trim();

        return `<AudioSessionProvider ${sessionProps.join(' ')}>\n    <FullCardPlayer ${playerAttrs} />\n</AudioSessionProvider>`;
    });

    // Special cases where AudioPlayer is mentioned in text
    content = content.replace(/(?<!use)AudioPlayer(?!Theme|Plugin)/g, 'FullCardPlayer');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Migrated', filePath);
}

migrateFile('src/demo/lab.tsx');
