const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'dashboard', 'layout.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace('الموقع العام', 'الموقع الإلكتروني');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');