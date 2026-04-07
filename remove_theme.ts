import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove anomaLabTheme state
content = content.replace(/const \[anomaLabTheme, setAnomaLabTheme\] = useState<"dark" \| "light" \| "high-contrast">\("dark"\);\n/g, '');

// Replace ternaries
content = content.replace(/anomaLabTheme === "dark" \? "([^"]+)" :\s*anomaLabTheme === "light" \? "[^"]+" :\s*"[^"]+"/g, '"$1"');
content = content.replace(/anomaLabTheme === "dark" \? "([^"]+)" :\s*anomaLabTheme === "light" \? "[^"]+" :\s*anomaLabTheme === "high-contrast" \? "[^"]+" :\s*"[^"]+"/g, '"$1"');

// Some might be split across lines
content = content.replace(/anomaLabTheme === "dark" \? "([^"]+)" :\s*\n\s*anomaLabTheme === "light" \? "[^"]+" :\s*\n\s*"[^"]+"/g, '"$1"');

// Let's just use regex to replace the whole block of anomaLabTheme ternaries
// It's safer to do it manually or with a more robust script.
