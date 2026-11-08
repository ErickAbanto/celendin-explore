const { spawn } = require('child_process');
const path = require('path');

// 1. Inicia el Backend (Express + MongoDB) compartiendo la salida en consola
const backend = spawn(process.execPath, ['index.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: ['ignore', 'inherit', 'inherit'],
});

// 2. Inicia el Frontend (Expo) de forma interactiva desde la carpeta frontend/
const rawArgs = process.argv.slice(2);
const extraArgs = rawArgs[0] === 'start' ? rawArgs.slice(1) : rawArgs;
const expoCli = path.join(__dirname, 'frontend', 'node_modules', 'expo', 'bin', 'cli');

const frontend = spawn(process.execPath, [expoCli, 'start', ...extraArgs], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
});

function cleanup() {
  if (!backend.killed) backend.kill();
  if (!frontend.killed) frontend.kill();
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

frontend.on('exit', (code) => {
  cleanup();
  process.exit(code || 0);
});
