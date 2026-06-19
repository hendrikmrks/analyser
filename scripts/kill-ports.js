const { execSync } = require('child_process');

if (process.platform !== 'win32') {
  process.exit(0);
}
const ports = [3001, 5173, 5174];

for (const port of ports) {
  try {
    const out = execSync('netstat -ano', { encoding: 'utf8' });
    const pids = new Set();

    for (const line of out.split('\n')) {
      if (!new RegExp(`:${port}\\s`).test(line)) continue;
      if (!/ABH|LISTENING/i.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) pids.add(pid);
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`Port ${port} freed (PID ${pid})`);
      } catch {
        // already stopped
      }
    }
  } catch {
    // ignore
  }
}
