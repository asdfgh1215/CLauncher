const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const https = require('node:https');
const { spawn } = require('node:child_process');
const { Client, Authenticator } = require('minecraft-launcher-core');

let win;
const launcher = new Client();
const dataDir = path.join(app.getPath('userData'), 'CLauncherGo');
const gameDir = path.join(dataDir, 'game');
const configFile = path.join(dataDir, 'settings.json');

function readSettings() {
  try { return JSON.parse(fs.readFileSync(configFile, 'utf8')); }
  catch { return { username: 'Player', version: 'release', ram: 4, language: 'ru' }; }
}
function saveSettings(value) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(configFile, JSON.stringify(value, null, 2));
  return true;
}
function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1100, minHeight: 720,
    backgroundColor: '#050914',
    title: 'CLauncherGo',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('app:settings:get', () => readSettings());
ipcMain.handle('app:settings:save', (_e, value) => saveSettings(value));
ipcMain.handle('app:open-folder', async () => {
  fs.mkdirSync(gameDir, { recursive: true });
  return shell.openPath(gameDir);
});
ipcMain.handle('versions:list', async () => {
  const response = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
  if (!response.ok) throw new Error(`Minecraft manifest: HTTP ${response.status}`);
  const manifest = await response.json();
  return manifest.versions.map(v => ({ id: v.id, type: v.type, releaseTime: v.releaseTime }))
    .filter(v => ['release', 'snapshot', 'old_beta', 'old_alpha'].includes(v.type));
});
ipcMain.handle('java:check', async () => {
  const candidates = process.platform === 'win32' ? ['java.exe'] : ['java'];
  for (const bin of candidates) {
    try {
      const result = await new Promise(resolve => {
        const child = spawn(bin, ['-version']);
        let output = '';
        child.stderr.on('data', d => output += d.toString());
        child.on('error', () => resolve(null));
        child.on('close', code => resolve(code === 0 ? output : null));
      });
      if (result) return { installed: true, version: result.trim().split('\n')[0] };
    } catch {}
  }
  return { installed: false, version: null, message: 'Java не найдена. Для запуска используйте встроенную/подходящую Java или установите её.' };
});
ipcMain.handle('game:launch', async (event, options) => {
  const settings = readSettings();
  const username = String(options.username || settings.username || 'Player').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16) || 'Player';
  const version = String(options.version || settings.version || 'release');
  const ram = Math.max(2, Math.min(16, Number(options.ram || settings.ram || 4)));
  fs.mkdirSync(gameDir, { recursive: true });
  const auth = Authenticator.getAuth(username);
  const launchOptions = {
    authorization: auth,
    root: gameDir,
    version: { number: version, type: 'release' },
    memory: { max: `${ram}G`, min: '1G' }
  };
  launcher.on('debug', e => event.sender.send('game:log', String(e)));
  launcher.on('data', e => event.sender.send('game:log', String(e)));
  launcher.on('progress', e => event.sender.send('game:progress', e));
  launcher.on('close', code => event.sender.send('game:closed', code));
  await launcher.launch(launchOptions);
  return { started: true, mode: 'offline', username, version };
});
