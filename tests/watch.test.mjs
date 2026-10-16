import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import {createServer} from 'node:net';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';

const projectDir = fileURLToPath(new URL('..', import.meta.url));

async function waitFor(check, message, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try { if (await check()) return; } catch {}
    await delay(100);
  }
  assert.fail(message());
}

function alive(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

test('development server reserves its port before Vite touches the shared dependency cache', () => {
  const source = readFileSync(join(projectDir, 'server/index.mjs'), 'utf8');
  const listen = source.indexOf('server.listen(port, host, resolve)');
  const createVite = source.indexOf("await import('vite')");
  assert.ok(listen >= 0 && createVite >= 0, 'Expected server startup and Vite initialization in server/index.mjs');
  assert.ok(listen < createVite, 'The port must be reserved before Vite starts dependency optimization');
});

test('npm run dev ignores generated files, keeps HMR, reloads source once, and stops its server', {timeout: 45000}, async t => {
  const directory = mkdtempSync(join(projectDir, '.watch-test-'));
  for (const name of ['server', 'lib', 'src', 'components', 'hooks', 'public', 'vendor', 'package.json', 'vite.config.ts', 'tsconfig.json', 'postcss.config.mjs', 'index.html']) {
    if (existsSync(join(projectDir, name))) cpSync(join(projectDir, name), join(directory, name), {recursive: true});
  }
  symlinkSync(join(projectDir, 'node_modules'), join(directory, 'node_modules'), 'junction');
  // Only the isolated fixture exposes this probe; the application's API is unchanged.
  const appFile = join(directory, 'server/app.mjs');
  let appSource = readFileSync(appFile, 'utf8');
  appSource = `import {watchValue} from '../lib/watch-probe.mjs';\n${appSource}`;
  appSource = appSource.replace("if (url.pathname === '/api/state')", `if (url.pathname === '/api/watch-probe') {
        response.writeHead(200, {'Content-Type': 'application/json'});
        return response.end(JSON.stringify({revision: 'server-one', watchValue, pid: process.pid, supervisor: process.ppid}));
      }
      if (url.pathname === '/api/state')`);
  writeFileSync(appFile, appSource);
  const libFile = join(directory, 'lib/watch-probe.mjs');
  writeFileSync(libFile, "export const watchValue = 'lib-one';\n");
  const frontendFile = join(directory, 'src/watch-probe.ts');
  writeFileSync(frontendFile, "export const value = 'front-one'; if (import.meta.hot) import.meta.hot.accept();\n");

  const reservation = createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const probe = () => fetch(`${base}/api/watch-probe`, {signal: AbortSignal.timeout(1500)}).then(response => response.json());
  let output = '';
  let supervisor;
  let socket;
  const children = new Set();
  const generatedFile = join(directory, 'node_modules/.vite-temp', `kontur-watch-test-${process.pid}-${port}.mjs`);
  const processHandle = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    cwd: directory,
    env: {...process.env, HOST: '127.0.0.1', PORT: String(port), DATA_FILE: './data/watch-test.sqlite'},
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    detached: process.platform !== 'win32',
  });
  processHandle.stdout.on('data', chunk => { output += chunk; });
  processHandle.stderr.on('data', chunk => { output += chunk; });
  const completed = new Promise(resolve => processHandle.once('close', resolve));
  t.after(async () => {
    socket?.close();
    if (alive(supervisor)) process.kill(supervisor, 'SIGINT');
    if (processHandle.exitCode === null && processHandle.signalCode === null) {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(processHandle.pid), '/T', '/F'], {stdio: 'ignore'});
      } else {
        try { process.kill(-processHandle.pid, 'SIGTERM'); } catch {}
      }
    }
    await Promise.race([completed, delay(6000, undefined, {ref: false})]);
    for (const pid of children) if (alive(pid)) process.kill(pid, 'SIGKILL');
    rmSync(generatedFile, {force: true});
    rmSync(directory, {recursive: true, force: true});
  });

  await waitFor(async () => {
    const state = await probe();
    supervisor = state.supervisor;
    children.add(state.pid);
    return state.revision === 'server-one';
  }, () => `Development server did not start:\n${output}`);
  const starts = () => (output.match(/DevPlane: http:/g) || []).length;
  await delay(1800);
  assert.equal(starts(), 1, `Startup restarted itself:\n${output}`);
  assert.equal((await fetch(`${base}/api/state`)).status, 200);
  assert.match(await (await fetch(base)).text(), /\/\@vite\/client/);

  const messages = [];
  socket = new WebSocket(`ws://127.0.0.1:${port}/`, 'vite-hmr');
  socket.addEventListener('message', event => messages.push(JSON.parse(event.data)));
  await waitFor(() => messages.some(message => message.type === 'connected'), () => 'Vite HMR socket did not connect');
  assert.match(await (await fetch(`${base}/src/watch-probe.ts`)).text(), /front-one/);
  writeFileSync(frontendFile, "export const value = 'front-two'; if (import.meta.hot) import.meta.hot.accept();\n");
  await waitFor(() => messages.some(message => message.type === 'update' && message.updates.some(update => update.path === '/src/watch-probe.ts')), () => `Vite did not send a frontend HMR update:\n${output}`);
  assert.match(await (await fetch(`${base}/src/watch-probe.ts`)).text(), /front-two/);

  mkdirSync(join(directory, 'node_modules/.vite-temp'), {recursive: true});
  mkdirSync(join(directory, 'dist'), {recursive: true});
  for (let revision = 1; revision <= 4; revision++) {
    writeFileSync(generatedFile, `export default ${revision};\n`);
    writeFileSync(join(directory, 'dist/watch-generated.js'), String(revision));
    writeFileSync(join(directory, 'data/watch-generated.json'), JSON.stringify({revision}));
    await delay(150);
  }
  await delay(1600);
  assert.equal(starts(), 1, `Generated files caused a server restart:\n${output}`);

  writeFileSync(appFile, appSource.replace("revision: 'server-one'", "revision: 'server-two'"));
  await waitFor(async () => {
    const state = await probe();
    children.add(state.pid);
    return state.revision === 'server-two';
  }, () => `Server source was not reloaded:\n${output}`);
  await delay(1400);
  assert.equal(starts(), 2, `One server edit should cause one restart:\n${output}`);

  writeFileSync(libFile, "export const watchValue = 'lib-two';\n");
  await waitFor(async () => {
    const state = await probe();
    children.add(state.pid);
    return state.watchValue === 'lib-two';
  }, () => `Shared domain source was not reloaded:\n${output}`);
  await delay(1400);
  assert.equal(starts(), 3, `One shared module edit should cause one restart:\n${output}`);

  process.kill(supervisor, 'SIGINT');
  await waitFor(() => !alive(supervisor) && [...children].every(pid => !alive(pid)), () => `Development shutdown left a process running:\n${output}`);
  await completed;
  await assert.rejects(fetch(`${base}/api/state`, {signal: AbortSignal.timeout(1000)}));
});
