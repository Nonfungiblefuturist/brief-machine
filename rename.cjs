const fs = require('fs');
const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/Brief Machine Lab/g, 'Anoma Lab');
content = content.replace(/briefMachineLab/g, 'anomaLab');
content = content.replace(/briefMachineTheme/g, 'anomaLabTheme');
content = content.replace(/briefMachineActiveTab/g, 'anomaLabActiveTab');
content = content.replace(/briefMachineCharacters/g, 'anomaLabCharacters');
content = content.replace(/briefMachineGallery/g, 'anomaLabGallery');
content = content.replace(/isBriefMachineSidebarOpen/g, 'isAnomaLabSidebarOpen');
content = content.replace(/setBriefMachineActiveTab/g, 'setAnomaLabActiveTab');
content = content.replace(/setBriefMachineTheme/g, 'setAnomaLabTheme');
content = content.replace(/setBriefMachineGallery/g, 'setAnomaLabGallery');

fs.writeFileSync(path, content);
console.log('Done renaming in App.tsx');
