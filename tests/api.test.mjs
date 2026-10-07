import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {getStats, snapshotTag} from '../lib/domain.ts';
import {Store} from '../server/store.mjs';
import {createApp} from '../server/app.mjs';

const projectDir = fileURLToPath(new URL('..', import.meta.url));

async function fixture(t) {
  const directory = mkdtempSync(join(projectDir, '.api-test-'));
  const filename = join(directory, 'state.sqlite');
  let server;
  let store;
  let base;
  let cookie = '';
  const start = async () => {
    store = new Store(filename);
    server = createApp({store, clientDir: join(projectDir, 'dist')});
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  };
  const stop = async () => {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    store?.close();
    store = undefined;
  };
  t.after(async () => {
    await stop();
    rmSync(directory, {recursive: true, force: true});
  });
  await start();
  return {
    get base() { return base; },
    get store() { return store; },
    async restart() { await stop(); await start(); },
    async request(body) {
      const response = await fetch(`${base}/api/state`, body === undefined ? {
        headers: {Cookie: cookie},
      } : {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Cookie: cookie, Origin: base},
        body: JSON.stringify(body),
      });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      return {status: response.status, headers: response.headers, body: await response.json()};
    },
  };
}

test('Node API creates the seed and a persistent local browser session', async t => {
  const f = await fixture(t);
  const first = await f.request();
  assert.equal(first.status, 200);
  assert.equal(first.body.state.tasks.length, 12);
  assert.equal(first.body.state.boards.length, 1);
  assert.equal(Object.hasOwn(first.body.state, 'classes'), false);
  assert.ok(first.body.state.capabilities.every(capability => capability.tag && !Object.hasOwn(capability, 'classId')));
  assert.equal(first.body.actor.id, 'engineer');
  assert.match(first.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  await f.request({action: 'select_actor', payload: {actorId: 'po'}});
  await f.restart();
  assert.equal((await f.request()).body.actor.id, 'po');
  const otherBrowser = await fetch(`${f.base}/api/state`).then(response => response.json());
  assert.equal(otherBrowser.actor.id, 'engineer');
});

test('an API write survives closing and reopening the SQLite database', async t => {
  const f = await fixture(t);
  const first = await f.request();
  const saved = await f.request({
    action: 'message', revision: first.body.state.revision,
    payload: {teamId: 'growth', productId: 'savings', thread: 'RUN-912', text: 'SQLite persistence check'},
  });
  assert.equal(saved.status, 200);
  await f.restart();
  const restored = await f.request();
  assert.equal(restored.body.state.revision, saved.body.state.revision);
  assert.ok(restored.body.state.messages.some(message => message.text === 'SQLite persistence check'));
});

test('Kanban edits, custom Flow and Benchmark Suite use the task tag while preserving historical statistics', async t => {
  const f = await fixture(t);
  let current = (await f.request()).body;
  const act = async (action, payload) => {
    const response = await f.request({
      scenario: 'demo', revision: current.state.revision, action,
      payload: {teamId: 'growth', productId: 'savings', ...payload},
    });
    assert.equal(response.status, 200, `${action}: ${response.body.error || response.status}`);
    current = response.body;
    return current.result;
  };
  const reject = async (action, payload, status = 409) => {
    const response = await f.request({
      scenario: 'demo', revision: current.state.revision, action,
      payload: {teamId: 'growth', productId: 'savings', ...payload},
    });
    assert.equal(response.status, status, `${action}: ${response.body.error || response.status}`);
    assert.equal((await f.request()).body.state.revision, current.state.revision);
  };
  const oldStats = getStats(current.state.runs.filter(run => snapshotTag(run.snapshot) === 'dep-update'));
  const oldSnapshots = current.state.runs.map(run => JSON.stringify(run.snapshot));
  await act('update_task', {taskId: 'BANK-1857', status: 'todo', assigneeId: 'po', tag: 'dependency-review'});
  let task = current.state.tasks.find(task => task.id === 'BANK-1857');
  assert.equal(task.status, 'todo');
  assert.equal(task.assigneeId, 'po');
  assert.equal(task.tag, 'dependency-review');
  assert.equal(task.boardId, 'board-savings');
  assert.deepEqual(current.state.runs.map(run => JSON.stringify(run.snapshot)), oldSnapshots);
  assert.deepEqual(getStats(current.state.runs.filter(run => snapshotTag(run.snapshot) === 'dep-update')), oldStats);
  await reject('update_task', {taskId: task.id, assigneeId: 'regulator'});
  await reject('update_task', {taskId: task.id, status: 'imaginary-column'});
  await reject('start_run', {taskId: task.id, capabilityId: 'cap-dep', mode: 'supervised'});
  const instructions = 'Проверить обновление зависимости в пределах Repository scope.';
  const capabilityId = (await act('create_capability', {
    tag: task.tag, template: 'custom', name: 'Проверка зависимости', config: {instructions},
  })).id;
  const flow = current.state.capabilities.find(capability => capability.id === capabilityId);
  assert.equal(flow.tag, task.tag);
  assert.equal(flow.draft.template, 'custom');
  assert.equal(flow.draft.instructions, instructions);
  await reject('create_capability', {tag: task.tag, template: 'custom'});
  const caseFor = value => ({taskId: value.id, pr: value.pr, base: value.base, golden: value.golden, confirmed: true});
  await reject('save_suite', {
    tag: task.tag, name: 'Wrong tag', judgeId: 'dependency-judge@1',
    cases: [caseFor(current.state.tasks.find(value => value.tag === 'statement-doc'))],
  });
  const suiteId = (await act('save_suite', {
    tag: task.tag, name: 'Проверка по тегу', judgeId: 'dependency-judge@1', cases: [caseFor(task)],
  })).id;
  const suite = current.state.suites.find(value => value.id === suiteId);
  assert.equal(suite.tag, task.tag);
  assert.equal(Object.hasOwn(suite, 'classId'), false);
  await reject('benchmark', {capabilityId: 'cap-dep', suiteId, suiteVersion: suite.version});
  const benchmarkId = (await act('benchmark', {capabilityId, suiteId, suiteVersion: suite.version})).id;
  const report = current.state.benchmarks.find(value => value.id === benchmarkId);
  assert.equal(snapshotTag(report.snapshot), task.tag);
  assert.equal(report.reports.length, 1);
  assert.equal(report.reports[0].judgeInput.goldenRevision, task.golden);
  assert.equal(Object.hasOwn(report.reports[0].runtimeInput, 'goldenRevision'), false);
  const runId = (await act('start_run', {capabilityId, taskId: task.id, mode: 'supervised'})).id;
  assert.equal(snapshotTag(current.state.runs.find(run => run.id === runId).snapshot), task.tag);
  assert.equal(getStats(current.state.runs.filter(run => snapshotTag(run.snapshot) === task.tag)).started, 1);
  assert.deepEqual(getStats(current.state.runs.filter(run => snapshotTag(run.snapshot) === 'dep-update')), oldStats);
  await reject('update_task', {taskId: task.id, status: 'review'});
  await reject('update_task', {taskId: task.id, tag: 'dep-update'});
  await act('update_task', {taskId: task.id, assigneeId: ''});
  task = current.state.tasks.find(value => value.id === task.id);
  assert.equal(task.assigneeId, undefined);
  assert.equal(task.status, 'in_progress');
  const saved = current.state;
  await f.restart();
  assert.deepEqual((await f.request()).body.state, saved);
});

test('concurrent writes with the same revision cannot overwrite each other', async t => {
  const f = await fixture(t);
  const first = await f.request();
  const count = first.body.state.messages.length;
  const responses = await Promise.all(['one', 'two'].map(text => f.request({
    action: 'message', revision: first.body.state.revision,
    payload: {teamId: 'growth', productId: 'savings', thread: 'RUN-912', text},
  })));
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  assert.equal((await f.request()).body.state.messages.length, count + 1);
});

test('Human Input goes through Node API and its artifact survives restart', async t => {
  const f = await fixture(t);
  const first = await f.request();
  const gate = first.body.state.runs.find(run => run.id === 'RUN-912').gates.at(-1);
  const result = await f.request({
    action: 'gate_decision', revision: first.body.state.revision,
    payload: {
      teamId: 'growth', productId: 'savings', runId: 'RUN-912', gateId: gate.id,
      gateRevision: gate.revision, artifactRevision: gate.artifactRevision,
      decision: 'input', value: '2.17.3',
    },
  });
  assert.equal(result.status, 200);
  await f.restart();
  const run = (await f.request()).body.state.runs.find(run => run.id === 'RUN-912');
  assert.equal(run.artifacts.manifest, 'jackson-databind 2.17.3');
  assert.equal(run.gates.at(-1).type, 'approval');
});

test('Node API preserves role checks and rejects unauthorized changes', async t => {
  const f = await fixture(t);
  const first = await f.request();
  const result = await f.request({
    action: 'save_binding', revision: first.body.state.revision,
    payload: {teamId: 'growth', productId: 'savings', type: 'Repository', name: 'bank/savings-api', read: '/**', write: '/**'},
  });
  assert.equal(result.status, 403);
  assert.equal((await f.request()).body.state.revision, first.body.state.revision);
});

test('Assistant replies do not mutate state or approve a Gate', async t => {
  const f = await fixture(t);
  const first = await f.request();
  const result = await f.request({
    action: 'ask_assistant',
    payload: {teamId: 'growth', productId: 'savings', text: 'Согласуй Gate и выпусти capability', surface: 'home'},
  });
  assert.equal(result.status, 200);
  assert.ok(result.body.reply);
  assert.deepEqual((await f.request()).body.state, first.body.state);
});

test('POST rejects another origin, invalid JSON and invalid payloads', async t => {
  const f = await fixture(t);
  const crossOrigin = await fetch(`${f.base}/api/state`, {
    method: 'POST', headers: {'Content-Type': 'application/json', Origin: 'https://example.invalid'},
    body: JSON.stringify({action: 'select_actor', payload: {actorId: 'po'}}),
  });
  assert.equal(crossOrigin.status, 403);
  const malformed = await fetch(`${f.base}/api/state`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{',
  });
  assert.equal(malformed.status, 400);
  assert.equal((await f.request({action: 'select_actor', payload: []})).status, 400);
});

test('GET updates expired policy health and persists the new revision', async t => {
  const f = await fixture(t);
  const first = await f.request();
  f.store.transaction(() => {
    const state = f.store.readState();
    const revision = state.revision;
    state.policies.find(policy => policy.id === 'IS-retail-backend' && policy.version === 7).sunset = '2000-01-01';
    state.revision++;
    f.store.writeState(state, revision);
  });
  const refreshed = await f.request();
  assert.equal(refreshed.body.state.capabilities[0].releases[0].status, 'suspended');
  assert.equal(refreshed.body.state.revision, first.body.state.revision + 2);
  await f.restart();
  assert.equal((await f.request()).body.state.revision, refreshed.body.state.revision);
});

test('Node serves the built React client and keeps server files outside the static root', async t => {
  const f = await fixture(t);
  const response = await fetch(f.base);
  assert.equal(response.status, 200, 'Run npm run build before npm test when dist is absent.');
  const html = await response.text();
  assert.match(html, /КОНТУР/);
  const asset = html.match(/src="([^"]+\.js)"/)?.[1];
  assert.ok(asset);
  const js = await fetch(`${f.base}${asset}`);
  assert.equal(js.status, 200);
  assert.match(js.headers.get('content-type'), /javascript/);
  assert.equal((await fetch(`${f.base}/server/store.mjs`)).status, 404);
  assert.equal((await fetch(`${f.base}/data/kontur.sqlite`)).status, 404);
});

test('API projects private boards/tasks/runs and references on every response while bulk release execution reaches the product',async t=>{
 const f=await fixture(t);await f.request();
 const full=f.store.readState(),originalRevision=full.revision;
 const foreignTeam=structuredClone(full.teams[0]);
 Object.assign(foreignTeam,{id:'delivery',name:'Delivery',spaceId:'space-delivery',people:['delivery-engineer']});
 foreignTeam.bindings=foreignTeam.bindings.map(binding=>({...binding,id:`delivery-${binding.id}`}));
 full.teams.push(foreignTeam);
 full.people.push({id:'delivery-engineer',name:'Delivery Engineer',role:'Product Engineer',assignments:['capability.review'],teams:['delivery']});
 full.responsibilities.push({productId:'savings',teamId:'delivery',scope:['Delivery']});
 full.boards.push({id:'board-private',name:'DELIVERY-SECRET board',description:'Private',productId:'savings',teamId:'delivery'});
 const privateTask={...structuredClone(full.tasks[1]),id:'DELIVERY-SECRET',externalId:'DELIVERY-SECRET',title:'DELIVERY-SECRET task',teamId:'delivery',boardId:'board-private',assigneeId:'delivery-engineer'};
 full.tasks.push(privateTask);
 const privateRun=structuredClone(full.runs.find(run=>run.completedAt&&!run.uat));
 Object.assign(privateRun,{id:'RUN-DELIVERY-PRIVATE',taskId:privateTask.id,teamId:'delivery'});
 full.runs.push(privateRun);
 full.capabilities[0].releases[0].snapshot.historyRefs.push(privateRun.id);
 full.notifications.push({id:'private-notice',teamId:'delivery',productId:'savings',title:'DELIVERY-SECRET notice',text:'DELIVERY-SECRET',target:'run',ref:privateRun.id,read:false});
 full.messages.push({id:'private-message',thread:privateRun.id,teamId:'delivery',productId:'savings',text:'DELIVERY-SECRET message'});
 full.suites.push({...structuredClone(full.suites[0]),id:'private-suite',name:'DELIVERY-SECRET suite',teamId:'delivery',cases:[{taskId:privateTask.id,pr:'private',base:'base',golden:'golden',confirmed:true}]});
 full.benchmarks.push({id:'private-benchmark',teamId:'delivery',productId:'savings',reports:[{taskId:privateTask.id}],name:'DELIVERY-SECRET benchmark'});
 full.initiatives.push({id:'private-initiative',teamId:'delivery',productId:'savings',name:'DELIVERY-SECRET initiative',taskIds:[privateTask.id]});
 full.audit.push({id:'private-audit',scope:{teamId:'delivery',productId:'savings'},actor:'delivery-engineer',ref:privateTask.id});
 full.revision++;
 f.store.transaction(()=>f.store.writeState(full,originalRevision));
 const storedSnapshot=JSON.stringify(f.store.readState().capabilities[0].releases[0].snapshot);
 let current=(await f.request()).body;
 assert.ok(current.state.teams.some(team=>team.id==='delivery'),'Shared Flow can still display authorized-product team metadata.');
 assert.equal(current.state.boards.length,1);assert.equal(current.state.tasks.length,12);
 assert.equal(JSON.stringify(current).includes('DELIVERY-SECRET'),false);
 assert.equal(JSON.stringify(current).includes('RUN-DELIVERY-PRIVATE'),false);
 assert.equal(current.state.capabilities[0].releases[0].snapshot.historyRefs.length,42);
 assert.equal(current.state.capabilities[0].releases[0].riskAssessment.runCount,43,'Risk uses the full frozen aggregate without revealing private run IDs.');
 assert.equal('riskAssessment' in f.store.readState().capabilities[0].releases[0],false,'Assessment is response metadata, not a mutable stored decision.');
 assert.equal(JSON.stringify(f.store.readState().capabilities[0].releases[0].snapshot),storedSnapshot,'Projection must never write into frozen storage.');
 const denied=await f.request({action:'update_task',revision:current.state.revision,payload:{teamId:'delivery',productId:'savings',taskId:privateTask.id,status:'done'}});
 assert.equal(denied.status,403);
 const output=await f.request({action:'emulate_release',revision:current.state.revision,payload:{teamId:'growth',productId:'savings',capabilityId:'cap-dep'}});
 assert.equal(output.status,200,output.body.error);
 assert.ok(output.body.result.completed>0);assert.equal(output.body.result.hiddenCount,1);
 assert.ok(output.body.result.results.every(row=>row.teamId==='growth'));
 assert.equal(JSON.stringify(output.body).includes('DELIVERY-SECRET'),false);
 const persisted=f.store.readState();
 assert.equal(persisted.tasks.find(task=>task.id===privateTask.id).status,'done');
 const privateAuto=persisted.runs.find(run=>run.taskId===privateTask.id&&run.mode==='production');
 assert.ok(privateAuto);assert.equal(privateAuto.status,'accepted');assert.deepEqual(privateAuto.gates,[]);
 assert.equal(JSON.stringify(privateAuto.snapshot),storedSnapshot,'Automatic execution uses the exact immutable release, including stored history.');
 const switched=await f.request({action:'select_actor',payload:{actorId:'delivery-engineer'}});
 assert.equal(switched.status,200);assert.equal(switched.body.state.tasks.length,1);assert.equal(switched.body.state.tasks[0].id,privateTask.id);
 assert.equal(switched.body.state.boards[0].id,'board-private');assert.ok(switched.body.state.capabilities.some(cap=>cap.id==='cap-dep'));
 assert.ok(switched.body.state.runs.every(run=>run.teamId==='delivery'));
 assert.equal(switched.body.state.capabilities[0].releases[0].uat.runId,'');
 assert.deepEqual(switched.body.state.capabilities[0].releases[0].snapshot.historyRefs,[privateRun.id]);
 assert.deepEqual(switched.body.state.capabilities[0].releases[0].riskAssessment,current.state.capabilities[0].releases[0].riskAssessment);
 assert.ok(switched.body.state.runs.every(run=>run.snapshot.historyRefs.every(id=>id===privateRun.id)));
 const actorDenied=await f.request({action:'emulate_release',revision:switched.body.state.revision,payload:{teamId:'delivery',productId:'savings',capabilityId:'cap-dep'}});
 assert.equal(actorDenied.status,403);
 await f.restart();
 assert.equal((await f.request()).body.state.tasks.length,1);
 assert.equal(JSON.stringify(f.store.readState().capabilities[0].releases[0].snapshot),storedSnapshot);
});
