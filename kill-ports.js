/**
 * kill-ports.js — Cross-platform port cleaner before dev startup
 */
const { execSync } = require('child_process');

const ports = [8081, 8082, 3002];

console.log('🧹 Clearing stale dev servers...');

for (const port of ports) {
  try {
    if (process.platform === 'win32') {
      // Find PID using netstat and kill it
      const output = execSync(`netstat -ano | findstr :${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
      const lines = output.split('\r\n').map(line => line.trim()).filter(Boolean);
      const pids = new Set();
      
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && !isNaN(pid)) {
            pids.add(pid);
          }
        }
      }
      
      for (const pid of pids) {
        console.log(`Killing process ${pid} on port ${port}...`);
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      }
    } else {
      // macOS / Linux
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
    }
  } catch (e) {
    // Port is not in use or error encountered, continue quietly
  }
}

console.log('✅ Ports checked and cleared.');
