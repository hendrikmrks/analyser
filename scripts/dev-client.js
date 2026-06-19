const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const clientDir = path.join(__dirname, '..', 'client');
const viteBin = path.join(clientDir, 'node_modules', 'vite', 'bin', 'vite.js');

if (!fs.existsSync(viteBin)) {
  console.error('Vite missing. Run: npm install --prefix client');
  process.exit(1);
}

const result = spawnSync(process.execPath, [viteBin], {
  cwd: clientDir,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
