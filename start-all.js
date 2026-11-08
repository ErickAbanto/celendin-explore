const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const dataJsPath = path.join(__dirname, 'backend', 'data.js');
const placesJsonPath = path.join(__dirname, 'frontend', 'src', 'constants', 'placesData.json');

function syncPlacesToFrontend() {
  try {
    delete require.cache[require.resolve(dataJsPath)];
    const { places } = require(dataJsPath);
    fs.writeFileSync(placesJsonPath, JSON.stringify(places, null, 2));
  } catch (e) {
    // Si el usuario está a mitad de edición en data.js, espera al siguiente guardado válido
  }
}

syncPlacesToFrontend();
fs.watchFile(dataJsPath, { interval: 500 }, () => syncPlacesToFrontend());

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
  fs.unwatchFile(dataJsPath);
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
