import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import { JsonStore } from '../persistence/store.mjs';
import { USERS, RESOURCE_TEMPLATES, PROFILES, COMPONENT_TEMPLATES, FIXTURES, COLLECTIONS, NODE_TYPES } from '../../../../packages/contracts/catalog.mjs';
import { DomainError, fail, get, list, visible, readState, scope, eventVisible, now, userById, digest, role } from '../domain/core.mjs';
import { execute, COMMAND_TYPES } from '../domain/commands.mjs';
import { challenge } from '../services/work.mjs';
import { tick } from '../simulator/runtime.mjs';
import { balance, metrics } from '../services/economics.mjs';
import { exportSpace, validateImport } from '../services/transfer.mjs';
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');
const json = (res, status, data) => { const body = JSON.stringify(data); res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(body) }); res.end(body); };
async function body(req) { if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || ''))
    fail('ValidationError', 'Нужен Content-Type: application/json', 415); let size = 0; const chunks = []; for await (const chunk of req) {
    size += chunk.length;
    if (size > 5 * 1024 * 1024)
        fail('ValidationError', 'Лимит запроса: 5 MiB', 413);
    chunks.push(chunk);
} try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
catch {
    fail('ValidationError', 'Некорректный JSON');
} }
const cookieToken = req => req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('kontur_session='))?.slice('kontur_session='.length);
export function createApp({ dataDir = process.env.DATA_DIR || path.join(projectRoot, 'data'), auto = process.env.SIM_AUTO !== '0', webDir = path.join(projectRoot, 'dist/web'), faults = process.env.TEST_FAULTS === '1' } = {}) {
    const store = new JsonStore(dataDir), clients = new Set(), ephemeralSessions = {};
    let closed = false;
    function auth(req) { const token = cookieToken(req), session = store.state.sessions[token] || ephemeralSessions[token]; if (!session || session.expiresAt < now(store.state))
        fail('Forbidden', 'Выберите демонстрационный профиль', 401); const user = userById(session.userId); if (!user)
        fail('Forbidden', 'Профиль недоступен', 401); return { user, token }; }
    function sseSend(client, events) { const sess = store.state.sessions[client.token] || ephemeralSessions[client.token]; if (!sess || sess.userId !== client.user.id || sess.expiresAt < now(store.state)) {
        client.res.end();
        return;
    } if (!store.state.entities.spaces[client.spaceId]?.memberIds.includes(client.user.id)) {
        client.res.end();
        return;
    } for (const event of events) {
        if (event.sequence <= client.after || event.spaceId !== client.spaceId || !eventVisible(store.state, client.user, event))
            continue;
        client.res.write('id: ' + event.sequence + '\nevent: domain\ndata: ' + JSON.stringify(event) + '\n\n');
        client.after = event.sequence;
    } }
    store.listeners.add(events => { for (const client of clients)
        sseSend(client, events); });
    const server = http.createServer(async (req, res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'same-origin');
        res.setHeader('X-Frame-Options', 'DENY');
        try {
            const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
            const pathname = decodeURIComponent(url.pathname);
            if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== 'http://' + req.headers.host)
                fail('Forbidden', 'Cross-origin writes запрещены', 403);
            if (pathname === '/api/v1/health') {
                json(res, 200, { status: store.recovery ? 'recovery' : 'ok', storage: store.recovery ? 'verified-backup-read-only' : 'ready', recovery: store.recovery, simulator: { auto, activeJobs: store.state.jobs.length }, version: '6.0.0-prototype.1', node: process.version, synthetic: true });
                return;
            }
            if (pathname === '/api/v1/demo/profiles' && req.method === 'GET') {
                json(res, 200, { users: USERS });
                return;
            }
            if (pathname === '/api/v1/demo/session' && req.method === 'POST') {
                const p = await body(req);
                const user = userById(p.userId);
                if (!user)
                    fail('ValidationError', 'Неизвестный demo profile');
                const token = randomBytes(32).toString('hex'), session = { userId: user.id, expiresAt: now(store.state) + 7 * 86400000 };
                const old = cookieToken(req);
                if (store.recovery) {
                    ephemeralSessions[token] = session;
                }
                else
                    store.transact(s => { s.sessions[token] = session; if (old)
                        delete s.sessions[old]; });
                res.setHeader('Set-Cookie', 'kontur_session=' + token + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800');
                json(res, 200, { user, token, warning: 'Локальная demo-сессия. Не enterprise authentication.' });
                return;
            }
            if (pathname.startsWith('/api/')) {
                const { user, token } = auth(req);
                if (pathname === '/api/v1/bootstrap' && req.method === 'GET') {
                    const spaceId = url.searchParams.get('spaceId') || undefined;
                    const result = readState(store.state, user, spaceId);
                    for (const actor of result.entities.actors || [])
                        if (actor.ownerId !== user.id)
                            delete actor.privateMemory;
                    const runs = result.entities.runs.filter(r => !r.parentRunId);
                    json(res, 200, { ...result, catalog: { users: USERS, resourceTemplates: RESOURCE_TEMPLATES, profiles: PROFILES, components: COMPONENT_TEMPLATES, fixtures: FIXTURES, nodeTypes: NODE_TYPES }, capabilities: COMMAND_TYPES, metrics: metrics(store.state, runs), recovery: store.recovery });
                    return;
                }
                if (pathname === '/api/v1/commands' && req.method === 'POST') {
                    const c = await body(req);
                    if (c.type === 'storage.recover') {
                        role(user, ['platform']);
                        json(res, 200, { commandResult: store.recover() });
                        return;
                    }
                    json(res, 200, execute(store, user, c));
                    return;
                }
                const chmatch = pathname.match(/^\/api\/v1\/gates\/([^/]+)\/challenges$/);
                if (chmatch && req.method === 'POST') {
                    await body(req);
                    const gate = get(store.state, 'gates', chmatch[1]);
                    scope(store.state, user, gate.spaceId);
                    json(res, 200, store.transact(s => challenge(s, user, gate.id)));
                    return;
                }
                const traceMatch = pathname.match(/^\/api\/v1\/runs\/([^/]+)\/trace$/);
                if (traceMatch && req.method === 'GET') {
                    const r = get(store.state, 'runs', traceMatch[1]);
                    scope(store.state, user, r.spaceId);
                    json(res, 200, { run: r, events: store.state.events.filter(e => (e.aggregateId === r.id || e.refs?.runId === r.id) && eventVisible(store.state, user, e)), artifacts: list(store.state, 'artifacts').filter(a => a.runId === r.id), attempts: list(store.state, 'attempts').filter(a => a.runId === r.id), cost: balance(store.state, r) });
                    return;
                }
                const artmatch = pathname.match(/^\/api\/v1\/artifacts\/([^/]+)$/);
                if (artmatch && req.method === 'GET') {
                    const a = get(store.state, 'artifacts', artmatch[1]);
                    if (!visible(store.state, user, a))
                        fail('NotFound', 'Артефакт недоступен', 404);
                    json(res, 200, a);
                    return;
                }
                if (pathname === '/api/v1/events/poll' && req.method === 'GET') {
                    const spaceId = url.searchParams.get('spaceId');
                    scope(store.state, user, spaceId);
                    const after = Number(url.searchParams.get('after') || 0);
                    if (!Number.isSafeInteger(after) || after < 0)
                        fail('ValidationError', 'Некорректный cursor');
                    const items = store.state.events.filter(e => e.spaceId === spaceId && e.sequence > after && eventVisible(store.state, user, e)).slice(0, 200);
                    json(res, 200, { items, after: items.at(-1)?.sequence || after, hasMore: items.length === 200 });
                    return;
                }
                if (pathname === '/api/v1/events' && req.method === 'GET') {
                    const spaceId = url.searchParams.get('spaceId');
                    scope(store.state, user, spaceId);
                    let after = Number(req.headers['last-event-id'] || url.searchParams.get('after') || 0);
                    if (!Number.isSafeInteger(after) || after < 0)
                        fail('ValidationError', 'Некорректный cursor');
                    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
                    res.write(': connected\n\n');
                    const client = { user, token, spaceId, after, res };
                    clients.add(client);
                    sseSend(client, store.state.events);
                    const hb = setInterval(() => { if (res.destroyed)
                        return; res.write(': heartbeat\n\n'); sseSend(client, []); }, 10000);
                    req.on('close', () => { clearInterval(hb); clients.delete(client); });
                    return;
                }
                const entity = pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/entities\/([^/]+)\/([^/]+)$/);
                if (entity && req.method === 'GET') {
                    scope(store.state, user, entity[1]);
                    const e = get(store.state, entity[2], entity[3], entity[1]);
                    if (!visible(store.state, user, e))
                        fail('NotFound', 'Объект недоступен', 404);
                    const result = structuredClone(e);
                    if (result.type === 'actors' && result.ownerId !== user.id)
                        delete result.privateMemory;
                    json(res, 200, result);
                    return;
                }
                const collection = pathname.match(/^\/api\/v1\/spaces\/([^/]+)\/([^/]+)$/);
                if (collection && req.method === 'GET') {
                    const spaceId = collection[1], type = collection[2];
                    scope(store.state, user, spaceId);
                    if (type === 'audit') {
                        const items = store.state.events.filter(e => e.spaceId === spaceId && eventVisible(store.state, user, e));
                        json(res, 200, { items: items.slice(-200), total: items.length });
                        return;
                    }
                    if (type === 'search') {
                        const query = (url.searchParams.get('q') || '').toLowerCase();
                        if (query.length < 2) {
                            json(res, 200, { items: [] });
                            return;
                        }
                        const items = ['tasks', 'pages', 'messages', 'projects'].flatMap(t => list(store.state, t)).filter(e => e.spaceId === spaceId && visible(store.state, user, e) && [e.name, e.title, e.text, e.content].join(' ').toLowerCase().includes(query)).slice(0, 50);
                        json(res, 200, { items });
                        return;
                    }
                    if (!COLLECTIONS.includes(type))
                        fail('NotFound', 'Нет такой коллекции', 404);
                    const cursor = Math.max(0, Number(url.searchParams.get('cursor')) || 0), limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 50));
                    let all = list(store.state, type).filter(e => e.spaceId === spaceId && visible(store.state, user, e));
                    const filter = url.searchParams.get('projectId');
                    if (filter)
                        all = all.filter(e => e.projectId === filter);
                    const items = all.slice(cursor, cursor + limit).map(e => { const copy = structuredClone(e); if (copy.type === 'actors' && copy.ownerId !== user.id)
                        delete copy.privateMemory; return copy; });
                    json(res, 200, { items, total: all.length, nextCursor: cursor + limit < all.length ? cursor + limit : null });
                    return;
                }
                if (pathname === '/api/v1/demo/export' && req.method === 'POST') {
                    const p = await body(req);
                    json(res, 200, exportSpace(store.state, user, p.spaceId));
                    return;
                }
                if (pathname === '/api/v1/demo/import/validate' && req.method === 'POST') {
                    role(user, ['platform']);
                    json(res, 200, validateImport(await body(req)));
                    return;
                }
                if (pathname === '/api/v1/demo/import/apply' && req.method === 'POST') {
                    const p = await body(req);
                    json(res, 200, execute(store, user, { actionId: p.actionId, type: 'demo.import', payload: { data: p.data, confirm: p.confirm } }));
                    return;
                }
                if (pathname === '/api/v1/demo/fault' && req.method === 'POST' && faults) {
                    role(user, ['platform']);
                    const p = await body(req);
                    if (p.kind === 'storage')
                        store.failNext = true;
                    else
                        fail('ValidationError', 'Неизвестный fault');
                    json(res, 200, { armed: true });
                    return;
                }
                fail('NotFound', 'Endpoint не найден', 404);
            }
            if (req.method !== 'GET' && req.method !== 'HEAD')
                fail('NotFound', 'Не найдено', 404);
            if (pathname.includes('..') || pathname.includes('\\') || pathname.includes('\0'))
                fail('ScopeViolation', 'Небезопасный путь', 400);
            let relative = pathname.slice(1);
            if (!relative || !path.extname(relative))
                relative = 'index.html';
            const full = path.resolve(webDir, relative);
            if (!full.startsWith(path.resolve(webDir) + path.sep))
                fail('NotFound', 'Не найдено', 404);
            if (!fs.existsSync(full) || !fs.statSync(full).isFile())
                fail('NotFound', 'Файл не найден', 404);
            const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' }[path.extname(full)] || 'application/octet-stream';
            res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
            res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': relative === 'index.html' ? 'no-cache' : 'public, max-age=300' });
            if (req.method === 'HEAD')
                res.end();
            else
                fs.createReadStream(full).pipe(res);
        }
        catch (error) {
            if (res.headersSent) {
                res.end();
                return;
            }
            const known = error instanceof DomainError;
            if (!known)
                console.error(error);
            json(res, known ? error.status : 500, { error: { code: known ? error.code : 'InternalError', message: known ? error.message : 'Внутренняя ошибка сервера', fields: known ? error.fields : {}, currentRevision: error.currentRevision, retryable: error.retryable || false, recoveryActions: error.recoveryActions || [] } });
        }
    });
    const timer = setInterval(() => { if (closed || !auto || store.recovery || !store.state.simulator.auto)
        return; if (!store.state.jobs.length && !store.state.outbox.some(e => e.status === 'Pending'))
        return; try {
        store.transact(s => tick(s, { automatic: true }));
    }
    catch (e) {
        console.error('Simulator:', e.message);
    } }, 650);
    timer.unref();
    return { server, store, close: () => { closed = true; clearInterval(timer); for (const client of clients)
            client.res.end(); server.closeAllConnections(); return new Promise(resolve => server.close(() => { store.close(); resolve(); })); } };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const app = createApp();
    const port = Number(process.env.PORT || 4310), host = process.env.HOST || '127.0.0.1';
    app.server.listen(port, host, () => console.log(`КОНТУР Team Space → http://${host}:${port} · ${app.store.recovery ? 'RECOVERY' : 'synthetic mock runtime'} · Node ${process.version}`));
    let exiting = false;
    const exit = () => { if (exiting)
        return; exiting = true; app.close().then(() => process.exit(0)); };
    process.on('SIGINT', exit);
    process.on('SIGTERM', exit);
}
