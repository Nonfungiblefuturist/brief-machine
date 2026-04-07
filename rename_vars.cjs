const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/BriefMachineShot/g, 'AnomaLabShot');
content = content.replace(/BriefMachineHistoryItem/g, 'AnomaLabHistoryItem');
content = content.replace(/briefMachineShot/g, 'anomaLabShot');
content = content.replace(/setBriefMachineShot/g, 'setAnomaLabShot');
content = content.replace(/briefMachineRawInput/g, 'anomaLabRawInput');
content = content.replace(/setBriefMachineRawInput/g, 'setAnomaLabRawInput');
content = content.replace(/briefMachineHistory/g, 'anomaLabHistory');
content = content.replace(/setBriefMachineHistory/g, 'setAnomaLabHistory');
content = content.replace(/briefMachineStoryboard/g, 'anomaLabStoryboard');
content = content.replace(/setBriefMachineStoryboard/g, 'setAnomaLabStoryboard');

fs.writeFileSync(filePath, content);
console.log('Renamed variables in App.tsx');
