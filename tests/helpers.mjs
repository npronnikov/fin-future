import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createApp } from '../apps/server/src/http/server.mjs';
export async function harness(t, { auto = false, faults = true } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kontur-test-'));
    let app, url, serial = 0;
    const tokens = {};
    const launch = async () => { app = createApp({ dataDir: dir, auto, faults, webDir: path.resolve('dist/web') }); await new Promise(r => app.server.listen(0, '127.0.0.1', r)); url = 'http://127.0.0.1:' + app.server.address().port; };
    await launch();
    const h = { get app() { return app; }, get url() { return url; }, dir, tokens, spaceId: '',
        async raw(who, endpoint, payload, options = {}) { if (who && !tokens[who]) {
            const res = await fetch(url + '/api/v1/demo/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: who }) });
            tokens[who] = (await res.json()).token;
        } const res = await fetch(url + '/api/v1' + endpoint, { method: payload === undefined ? 'GET' : 'POST', headers: { ...(who ? { Authorization: 'Bearer ' + tokens[who] } : {}), ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }), ...options.headers }, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }), ...options }); const data = await res.json(); return { status: res.status, data, headers: res.headers }; },
        async api(who, endpoint, payload) { const r = await h.raw(who, endpoint, payload); if (r.status >= 400) {
            const e = new Error(r.data.error.message);
            Object.assign(e, r.data.error, { status: r.status });
            throw e;
        } return r.data; },
        async command(who, type, payload = {}, target, extra = {}) { return h.api(who, '/commands', { actionId: 'test-' + (++serial), type, ...(h.spaceId ? { spaceId: h.spaceId } : {}), ...(target ? { targetId: typeof target === 'string' ? target : target.id, ...(typeof target === 'object' ? { expectedRevision: target.revision } : {}) } : {}), payload, ...extra }); },
        async cmd(...args) { return (await h.command(...args)).commandResult; },
        async boot(who = 'ivan') { return h.api(who, '/bootstrap' + (h.spaceId ? '?spaceId=' + h.spaceId : '')); },
        async all(type, who = 'ivan') { return (await h.boot(who)).entities[type]; },
        async entity(type, id, who = 'ivan') { return h.api(who, `/spaces/${h.spaceId}/entities/${type}/${id}`); },
        async steps(n = 1, who = 'maxim') { for (let i = 0; i < n; i++)
            await h.cmd(who, 'simulator.step'); },
        async until(runId, statuses = ['WaitingInput', 'WaitingApproval', 'Accepted', 'Blocked', 'Failed', 'InDoubt']) { for (let i = 0; i < 80; i++) {
            const run = await h.entity('runs', runId);
            if (statuses.includes(run.status))
                return run;
            await h.steps();
        } throw Error('Run did not reach ' + statuses); },
        async gate(runId) { return (await h.all('gates')).find(g => g.runId === runId && g.status === 'Pending'); },
        async challenge(gateId, who = 'ivan') { return h.api(who, '/gates/' + gateId + '/challenges', {}); },
        async answer(runId, { who = 'ivan', behavior = 'separate', explanation = 'HTTP 503 означает недоступность источника, а не пустой список.' } = {}) { const gate = await h.gate(runId); assert.equal(gate.kind, 'input'); const ch = await h.challenge(gate.id, who); return h.cmd(who, 'gate.answer', { challengeId: ch.id, targetDigest: ch.artifactBundleDigest, answer: { behavior, explanation } }, gate, { expectedRevision: ch.expectedRevision }); },
        async decide(runId, decision = 'approve', { who = 'ivan', ...payload } = {}) { const gate = await h.gate(runId); assert.equal(gate.kind, 'approval'); const ch = await h.challenge(gate.id, who); return h.cmd(who, 'gate.decide', { challengeId: ch.id, targetDigest: ch.artifactBundleDigest, decision, humanTimeMs: 60000, ...payload }, gate, { expectedRevision: ch.expectedRevision }); },
        async trial(options = {}) { return h.cmd('ivan', 'run.startTrial', { definitionId: h.def.id, environmentId: h.env.id, fixture: 'clean', ...options }); },
        async accept(runOrId) { const id = typeof runOrId === 'string' ? runOrId : runOrId.id; for (let i = 0; i < 6; i++) {
            const run = await h.until(id);
            if (run.status === 'Accepted')
                return run;
            if (run.status === 'WaitingInput')
                await h.answer(id);
            else if (run.status === 'WaitingApproval')
                await h.decide(id);
            else
                throw Error('Cannot accept ' + run.status);
        } throw Error('Too many gates'); },
        async restart() { await app.close(); await launch(); },
        async setup({ profile = 'hg', kind = 'flow', members, network = 'isolated' } = {}) { const space = await h.cmd('maxim', 'space.create', { name: 'Проверяемая команда', ...(members ? { memberIds: members } : {}) }); h.spaceId = space.id; h.space = space; h.plan = await h.cmd('maxim', 'plan.create', { template: 'minimal', network }); h.provision = await h.cmd('maxim', 'provision.start', { confirm: true }, h.plan); await h.steps(4); h.env = (await h.all('environments'))[0]; assert.equal(h.env.status, 'Ready'); h.inst = await h.cmd('maxim', 'installation.create', { environmentId: h.env.id, profile }); await h.steps(5); h.inst = await h.entity('installations', h.inst.id); assert.equal(h.inst.status, 'Ready'); h.project = await h.cmd('anna', 'project.create', { name: 'Статусы заявок', installationId: h.inst.id }); for (const kind of ['repo', 'ci', 'model'])
            await h.cmd('maxim', 'binding.create', { kind, projectId: h.project.id, installationId: h.inst.id }); h.def = await h.cmd('ivan', 'definition.create', { projectId: h.project.id, kind }); return h; }
    };
    t.after(async () => { await app.close(); fs.rmSync(dir, { recursive: true, force: true }); });
    return h;
}
export async function rejectsCode(fn, code) { await assert.rejects(fn, e => e.code === code, `Expected ${code}`); }
