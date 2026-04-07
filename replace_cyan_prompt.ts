import fs from 'fs';
let content = fs.readFileSync('src/components/PromptEngine.tsx', 'utf-8');

// Replace cyan colors with #FF3366
content = content.replace(/cyan-500\/10/g, '[#FF3366]/10');
content = content.replace(/cyan-500\/20/g, '[#FF3366]/20');
content = content.replace(/cyan-100\/80/g, 'zinc-300');
content = content.replace(/cyan-400\/50/g, '[#FF3366]/50');
content = content.replace(/cyan-400\/60/g, '[#FF3366]/60');
content = content.replace(/cyan-500\/5/g, '[#FF3366]/5');

fs.writeFileSync('src/components/PromptEngine.tsx', content);
