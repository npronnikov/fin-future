import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {Store} from './store.mjs';
import {createApp} from './app.mjs';

const projectDir = fileURLToPath(new URL('..', import.meta.url));
const dev = process.argv.includes('--dev');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
const clientDir = resolve(projectDir, 'dist');
const dataFile = resolve(projectDir, process.env.DATA_FILE || 'data/kontur.sqlite');

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT должен быть числом от 1 до 65535.');
}
if (!dev && !existsSync(resolve(clientDir, 'index.html'))) {
  throw new Error('Не найдена сборка интерфейса. Выполните npm install и npm run build.');
}

const store = new Store(dataFile);
let vite;
const server = createApp({
  store,
  clientDir,
  middleware: dev ? (request, response) => {
    if (!vite) {
      response.writeHead(503, {'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '1'});
      return response.end('Dev server is starting.');
    }
    return vite.middlewares(request, response);
  } : undefined,
});

let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await vite?.close();
  await new Promise(resolve => server.close(resolve));
  store.close();
  process.exit(0);
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
if (process.send) {
  process.on('message', message => {
    if (message?.type === 'kontur:shutdown') void close();
  });
  process.on('disconnect', close);
}

try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  if (dev) {
    const {createServer} = await import('vite');
    vite = await createServer({
      root: projectDir,
      server: {middlewareMode: true, hmr: {server}},
      appType: 'spa',
    });
  }
  console.log(`DevPlane: http://${host.includes(':') ? `[${host}]` : host}:${port}`);
  console.log(`Режим: ${dev ? 'разработка' : 'локальное приложение'}. Данные: ${dataFile}`);
} catch (error) {
  await vite?.close();
  if (server.listening) await new Promise(resolve => server.close(resolve));
  store.close();
  throw error;
}
