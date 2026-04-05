const fs = require('fs');
const path = './src/components/PromptEngine.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-zinc-900/50');
content = content.replace(/border-white\/\[0\.05\]/g, 'border-zinc-800');
content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-zinc-900/50');
content = content.replace(/border-white\/\[0\.07\]/g, 'border-zinc-800');
content = content.replace(/bg-white\/5/g, 'bg-zinc-800/50');
content = content.replace(/bg-white\/10/g, 'bg-zinc-800');
content = content.replace(/hover:bg-white\/\[0\.04\]/g, 'hover:bg-zinc-800/50');
content = content.replace(/hover:bg-white\/\[0\.02\]/g, 'hover:bg-zinc-800/30');
content = content.replace(/hover:bg-white\/5/g, 'hover:bg-zinc-800/50');
content = content.replace(/hover:bg-white\/10/g, 'hover:bg-zinc-700/50');
content = content.replace(/hover:bg-white\/20/g, 'hover:bg-zinc-700');
content = content.replace(/border-white\/10/g, 'border-zinc-800');
content = content.replace(/border-white\/20/g, 'border-zinc-700');
content = content.replace(/text-white\/20/g, 'text-zinc-500');
content = content.replace(/text-white\/30/g, 'text-zinc-500');
content = content.replace(/text-white\/40/g, 'text-zinc-500');
content = content.replace(/text-white\/50/g, 'text-zinc-400');
content = content.replace(/text-white\/60/g, 'text-zinc-400');
content = content.replace(/text-white\/70/g, 'text-zinc-300');
content = content.replace(/text-white\/80/g, 'text-zinc-300');
content = content.replace(/text-white\/85/g, 'text-zinc-200');
content = content.replace(/text-white\/90/g, 'text-zinc-200');
content = content.replace(/text-white/g, 'text-zinc-100');
content = content.replace(/border-opacity-50/g, 'border-zinc-700');

// Fix the Pill component text-zinc-100 replacement issue
content = content.replace(/text-zinc-100\/50/g, 'text-zinc-500');
content = content.replace(/text-zinc-100\/80/g, 'text-zinc-300');

fs.writeFileSync(path, content);
console.log('Done');
