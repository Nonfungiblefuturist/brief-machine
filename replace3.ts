import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(/briefmachine_favorites/g, 'anomalab_favorites');
fs.writeFileSync('src/App.tsx', content);
