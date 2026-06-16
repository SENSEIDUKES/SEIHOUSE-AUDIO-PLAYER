const fs = require('fs');
let lab = fs.readFileSync('src/demo/lab.tsx', 'utf8');
lab = lab.replace(/<FullCardPlayer audioFile=""[\r\n]+(\s*)accentColor/g, '<FullCardPlayer\n$1accentColor');
fs.writeFileSync('src/demo/lab.tsx', lab);
console.log("Fixed audioFile in lab.tsx");
