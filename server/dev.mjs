import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readdir, readFile} from 'node:fs/promises';
import {extname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const projectDir = fileURLToPath(new URL('..', import.meta.url));
const sourceExtensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.json']);
const ignoredDirectories = new Set(['node_modules', 'dist', 'data', '.vite', '.vite-temp', '.git']);
let running;
let scanTimer;
let restartTimer;
let closing = false;
let restarting = false;

// Observe our source files, never Vite's imported modules or generated config.
// Content snapshots also handle atomic saves consistently on all supported OSes.
async function sourceSnapshot() {
  const entries = [];
  async function visit(directory) {
    let children;
    try { children = await readdir(directory, {withFileTypes: true}); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of children) {
      const path = join(directory, entry.name);
      if (entry.isDirectory() && !ignoredDirectories.has(entry.name) && !entry.name.startsWith('.')) {
        await visit(path);
      } else if (entry.isFile() && sourceExtensions.has(extname(entry.name)) && !entry.name.startsWith('.')) {
        try {
          entries.push([path, createHash('sha256').update(await readFile(path)).digest('hex')]);
        } catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
    }
  }
  await Promise.all(['server', 'lib'].map(directory => visit(join(projectDir, directory))));
  return JSON.stringify(entries.sort(([a], [b]) => a.localeCompare(b)));
}

function startServer() {
  if (closing) return;
  const child = spawn(process.execPath, [join(projectDir, 'server/index.mjs'), '--dev'], {
    cwd: projectDir,
    env: process.env,
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  });
  const instance = {child, expectedExit: false};
  running = instance;
  instance.stopped = new Promise(resolve => {
    child.once('error', error => console.error(`[dev] Не удалось запустить сервер: ${error.message}`));
    child.once('close', (code, signal) => {
      if (running === instance) running = undefined;
      if (!closing && !instance.expectedExit) {
        console.error(`[dev] Сервер остановился (${signal || code}). Сохраните серверный исходник для повторного запуска.`);
      }
      resolve();
    });
  });
}

async function stopServer() {
  const instance = running;
  if (!instance) return;
  instance.expectedExit = true;
  const {child} = instance;
  // IPC provides graceful shutdown on Windows too, where kill() is forceful.
  const deadline = setTimeout(() => child.kill('SIGKILL'), 5000);
  if (child.connected) {
    child.send({type: 'kontur:shutdown'}, error => {
      if (error && child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    });
  } else if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
  }
  await instance.stopped;
  clearTimeout(deadline);
}

async function restartServer() {
  if (closing || restarting) return;
  restarting = true;
  console.log('[dev] Изменены серверные исходники. Перезапуск…');
  await stopServer();
  startServer();
  restarting = false;
}

async function shutdown() {
  if (closing) return;
  closing = true;
  clearTimeout(scanTimer);
  clearTimeout(restartTimer);
  await stopServer();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

let previous = await sourceSnapshot();
let previousError = '';
async function scan() {
  if (closing) return;
  try {
    const next = await sourceSnapshot();
    previousError = '';
    if (next !== previous) {
      previous = next;
      clearTimeout(restartTimer);
      if (!closing) restartTimer = setTimeout(restartServer, 250);
    }
  } catch (error) {
    if (error.message !== previousError) console.error(`[dev] Не удалось прочитать исходники: ${error.message}`);
    previousError = error.message;
  }
  if (!closing) scanTimer = setTimeout(scan, 350);
}

console.log('[dev] Наблюдение за server/ и lib/. Интерфейс обновляет Vite HMR.');
startServer();
if (!closing) scanTimer = setTimeout(scan, 350);
