import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace cyan colors with #FF3366
content = content.replace(/text-cyan-400/g, 'text-[#FF3366]');
content = content.replace(/text-cyan-500/g, 'text-[#FF3366]');
content = content.replace(/text-cyan-800/g, 'text-[#FF3366]/80');
content = content.replace(/bg-cyan-500/g, 'bg-[#FF3366]');
content = content.replace(/bg-cyan-600/g, 'bg-[#FF3366]');
content = content.replace(/hover:bg-cyan-500/g, 'hover:bg-[#FF3366]/80');
content = content.replace(/border-cyan-500/g, 'border-[#FF3366]');
content = content.replace(/border-cyan-900/g, 'border-[#FF3366]/30');
content = content.replace(/ring-cyan-500/g, 'ring-[#FF3366]');
content = content.replace(/shadow-cyan-900\/20/g, 'shadow-[#FF3366]/20');
content = content.replace(/bg-cyan-950/g, 'bg-[#FF3366]/10');

fs.writeFileSync('src/App.tsx', content);
