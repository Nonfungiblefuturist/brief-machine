import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace anomaLabTheme ternaries
// Pattern: anomaLabTheme === "dark" ? "X" : \n anomaLabTheme === "light" ? "Y" : \n "Z"
// Or: anomaLabTheme === "dark" ? "X" : anomaLabTheme === "light" ? "Y" : "Z"
// We can use a regex that matches `anomaLabTheme === "dark" \? "([^"]+)" :[\s\S]*?(?=\)|,|}|\n)`
// Actually, it's safer to just replace `anomaLabTheme === "dark" ? "X" : \n anomaLabTheme === "light" ? "Y" : \n "Z"` with `"X"`
// Let's write a function to do this.

const regex = /anomaLabTheme === "dark" \? "([^"]+)" :\s*anomaLabTheme === "light" \? "[^"]+" :\s*"[^"]+"/g;
content = content.replace(regex, '"$1"');

const regex2 = /anomaLabTheme === "dark" \? "([^"]+)" :\s*anomaLabTheme === "light" \? "[^"]+" :\s*anomaLabTheme === "high-contrast" \? "[^"]+" :\s*"[^"]+"/g;
content = content.replace(regex2, '"$1"');

// For the ones with newlines:
const regex3 = /anomaLabTheme === "dark" \? "([^"]+)" :\s*\n\s*anomaLabTheme === "light" \? "[^"]+" :\s*\n\s*"[^"]+"/g;
content = content.replace(regex3, '"$1"');

// For the ones with high-contrast:
const regex4 = /anomaLabTheme === "high-contrast" \? "([^"]+)" : "([^"]+)"/g;
content = content.replace(regex4, '"$2"');

const regex5 = /anomaLabTheme === "high-contrast" \? "([^"]+)" : section\.color/g;
content = content.replace(regex5, 'section.color');

const regex6 = /anomaLabTheme === "high-contrast" \? "([^"]+)" : section\.accent/g;
content = content.replace(regex6, 'section.accent');

const regex7 = /anomaLabTheme === "light" \? "([^"]+)" : "([^"]+)"/g;
content = content.replace(regex7, '"$2"');

const regex8 = /anomaLabTheme === "light" \? "([^"]+)" :\s*\n\s*anomaLabTheme === "high-contrast" \? "([^"]+)" :\s*\n\s*"([^"]+)"/g;
content = content.replace(regex8, '"$3"');

fs.writeFileSync('src/App.tsx', content);
