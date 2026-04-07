import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace colors in sections
content = content.replace(/text-orange-400/g, 'text-[#FF3366]');
content = content.replace(/border-orange-900/g, 'border-[#FF3366]/30');
content = content.replace(/text-purple-400/g, 'text-[#FF3366]');
content = content.replace(/border-purple-900/g, 'border-[#FF3366]/30');
content = content.replace(/text-emerald-400/g, 'text-[#FF3366]');
content = content.replace(/border-emerald-900/g, 'border-[#FF3366]/30');
content = content.replace(/text-pink-400/g, 'text-[#FF3366]');
content = content.replace(/border-pink-900/g, 'border-[#FF3366]/30');

// Replace text-purple-500 and text-orange-500
content = content.replace(/text-purple-500/g, 'text-[#FF3366]');
content = content.replace(/text-orange-500/g, 'text-[#FF3366]');

fs.writeFileSync('src/App.tsx', content);
