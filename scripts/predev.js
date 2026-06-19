const { execSync } = require('child_process');
const path = require('path');

require('./kill-ports');

const clientDir = path.join(__dirname, '..', 'client');
console.log('Ensuring client dependencies…');
execSync('npm install', { cwd: clientDir, stdio: 'inherit', shell: true });

const viteBin = path.join(clientDir, 'node_modules', 'vite', 'bin', 'vite.js');
const fs = require('fs');
if (!fs.existsSync(viteBin)) {
  console.error('Vite not found after install. Try: cd client && npm install');
  process.exit(1);
}
