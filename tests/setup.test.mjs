import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {copy, createEmptyState, createSeed, getEditableFlowNodes, getStats, migrateState, snapshotTag, trackerTaskTemplates} from '../lib/domain.ts';
import {applyAction, DomainError} from '../lib/engine.ts';
import {Store} from '../server/store.mjs';
import {projectStateForActor} from '../lib/scope.ts';
import {createApp} from '../server/app.mjs';

const projectDir = fileURLToPath(new URL('..', import.meta.url));
const workspaceCollections = [
  'products', 'boards', 'teams', 'responsibilities', 'tasks', 'capabilities',
  'runs', 'knowledge', 'suites', 'benchmarks', 'messages', 'notifications',
  'initiatives', 'audit',
];

async function fixture(t, {prepare, cookieId} = {}) {
  const directory = mkdtempSync(join(projectDir, '.setup-test-'));
  const filename = join(directory, 'state.sqlite');
  let server;
  let store;
  let base;
  let cookie = cookieId ? `kontur_session=${cookieId}` : '';
  const start = async () => {
    store = new Store(filename);
    server = createApp({store, clientDir: join(projectDir, 'dist')});
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
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
  prepare?.(filename);
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
      return {status: response.status, body: await response.json()};
    },
  };
}

function domainWorkspace() {
  let state = createEmptyState();
  let productId = '';
  let teamId = '';
  const act = (actorId, action, payload = {}) => {
    const changed = applyAction(state, state.people.find(person => person.id === actorId), action,
      {productId, teamId, ...payload}, 'setup-test');
    state = changed.state;
    return changed.result;
  };
  productId = act('po', 'create_product', {name: 'Новый продукт', description: 'Создан с нуля'}).id;
  teamId = act('po', 'create_team', {name: 'Новая команда', scope: 'Onboarding'}).id;
  act('po', 'add_person', {personId: 'platform', role: 'Platform Engineer'});
  act('po', 'add_person', {personId: 'engineer', role: 'Product Engineer'});
  return {
    get state() { return state; },
    get productId() { return productId; },
    get teamId() { return teamId; },
    act,
  };
}

test('empty scenario has no user workspace data, team membership or inherited history', () => {
  const empty = createEmptyState();
  for (const key of workspaceCollections) assert.deepEqual(empty[key], [], key);
  assert.equal(Object.hasOwn(empty, 'classes'), false);
  assert.equal(empty.revision, 1);
  assert.equal(empty.people.length, 6);
  assert.ok(empty.people.every(person => person.teams.length === 0));
  assert.ok(empty.people.find(person => person.id === 'po').assignments.includes('team.admin'));
  assert.ok(empty.policies.length > 0, 'Platform policies remain available for setup.');
  assert.ok(empty.assets.some(asset => asset.type === 'Skills'));
  assert.ok(empty.assets.some(asset => asset.type === 'Flow'));
  empty.people[0].teams.push('not-shared');
  empty.assets[0].name = 'not-shared';
  const second = createEmptyState();
  assert.deepEqual(second.people[0].teams, []);
  assert.notEqual(second.assets[0].name, 'not-shared');
  assert.equal(createSeed().tasks.length, 16);
});

test('a repository binding in a new workspace keeps the configured system name', () => {
  const workspace = domainWorkspace();
  workspace.act('platform', 'save_environment', {...workspace.state.teams[0].environment, automation: 'HG SDLC'});
  workspace.act('platform', 'save_binding', {
    type: 'Repository', name: 'bank/lc-trade-api', system: 'DevPlane',
    permissions: ['read', 'write', 'create_pr'],
  });
  const binding = workspace.state.teams[0].bindings.find(item => item.type === 'Repository');
  assert.equal(binding.system, 'DevPlane');
  assert.equal(binding.segment, 'corporate.backend');
});

test('the regulatory segment selected during product creation seeds new repository bindings', () => {
  let state = createEmptyState();
  const run = (actorId, action, payload = {}) => {
    const changed = applyAction(state, state.people.find(person => person.id === actorId), action, payload, 'setup-test');
    state = changed.state;
    return changed.result;
  };
  const productId = run('po', 'create_product', {name: 'Data Plane', description: 'Новый продукт', segment: 'retail.data'}).id;
  const teamId = run('po', 'create_team', {productId, name: 'Data Team', scope: 'Data'}).id;
  run('po', 'add_person', {productId, teamId, personId: 'platform', role: 'Platform Engineer'});
  run('platform', 'save_environment', {productId, teamId, ...state.teams[0].environment, automation: 'HG SDLC'});
  run('platform', 'save_binding', {productId, teamId, type: 'Repository', name: 'bank/lc-trade-api', permissions: ['read']});
  assert.equal(state.products[0].segment, 'retail.data');
  assert.equal(state.teams[0].bindings[0].segment, 'retail.data');
  assert.throws(() => run('po', 'create_product', {name: 'Invalid', description: 'Invalid', segment: 'unknown'}), /регуляторный сегмент/);
});

test('team policy follows its repository segment and demo peer approval needs no role switch', () => {
  const workspace = domainWorkspace();
  workspace.act('platform', 'save_environment', {...workspace.state.teams[0].environment, automation: 'HG SDLC'});
  workspace.act('platform', 'save_binding', {type: 'Repository', name: 'bank/lc-trade-api', permissions: ['read']});
  const saved = workspace.act('regulator', 'save_policy', {
    id: 'TEAM-SECURITY', direction: 'Information Security', segment: 'retail.backend',
    requirements: [{id: 'TEAM-SECURITY-R001', version: 1, text: 'Проверить разрешённые зависимости.'}],
    applicability: [{requirement: 'TEAM-SECURITY-R001@1', segment: 'retail.backend', tag: 'dep-update'}],
    evidence: [], skills: [], subagents: [],
  });
  const policy = workspace.state.policies.find(item => `${item.id}@${item.version}` === saved.id);
  assert.equal(policy.segment, 'corporate.backend');
  assert.equal(policy.requirements[0].segment, 'corporate.backend');
  assert.equal(policy.applicability[0].segment, 'corporate.backend');
  const decision = workspace.act('regulator', 'policy_status', {policyKey: saved.id, status: 'Current'});
  assert.equal(decision.simulatedPeerApproval, true);
  assert.equal(workspace.state.policies.find(item => `${item.id}@${item.version}` === saved.id).approvedBy, 'regulator-reviewer');
  const stale = structuredClone(workspace.state), stalePolicy = stale.policies.find(item => `${item.id}@${item.version}` === saved.id);
  stalePolicy.segment = 'retail.backend'; stalePolicy.requirements[0].segment = 'retail.backend'; stalePolicy.applicability[0].segment = 'retail.backend';
  const migrated = migrateState(stale);
  assert.equal(migrated.changed, true);
  assert.equal(migrated.state.policies.find(item => `${item.id}@${item.version}` === saved.id).segment, 'corporate.backend');
});

test('segmentation classifies repositories in the current product instead of inherited demo systems', () => {
  const workspace = domainWorkspace();
  workspace.act('platform', 'save_environment', {...workspace.state.teams[0].environment, automation: 'HG SDLC'});
  workspace.act('platform', 'save_binding', {
    type: 'Repository', name: 'bank/lc-trade-api',
    permissions: ['read', 'write', 'create_pr'],
  });
  assert.equal(workspace.state.teams[0].bindings[0].system, 'Trade Finance LC', 'Legacy catalog metadata reproduces the regression.');
  workspace.act('regulator', 'classify_system', {
    system: 'Новый продукт', repositories: ['bank/lc-trade-api'], segment: 'retail.backend',
  });
  const binding = workspace.state.teams[0].bindings[0];
  assert.equal(binding.system, 'Новый продукт');
  assert.equal(binding.segment, 'retail.backend');
});

test('orchestrator version must come from the platform catalog', () => {
  const workspace = domainWorkspace();
  const environment = workspace.state.teams[0].environment;
  assert.throws(() => workspace.act('platform', 'save_environment', {...environment, automation: 'HG SDLC', runtimeVersion: 'custom'}), /доступную версию/);
  workspace.act('platform', 'save_environment', {...environment, automation: 'HG SDLC', runtimeVersion: '2.0'});
  assert.equal(workspace.state.teams[0].environment.runtimeVersion, '2.0');
});

test('a ready environment can promote resources and orchestrator version atomically', () => {
  const workspace = domainWorkspace();
  const environment = workspace.state.teams[0].environment;
  workspace.act('platform', 'save_environment', {...environment, automation: 'HG SDLC'});
  for (const type of ['Repository', 'Task Tracker', 'CI']) workspace.act('platform', 'save_binding', type === 'Repository'
    ? {type, name: 'bank/lc-trade-api', system: 'DevPlane', permissions: ['read', 'write', 'create_pr']}
    : {type, name: type});
  workspace.act('platform', 'provision', {topologyConfirmed: true});
  assert.throws(() => workspace.act('engineer', 'promote_environment', {...workspace.state.teams[0].environment, ram: 16, runtimeVersion: '2.0'}), error => error instanceof DomainError && error.status === 403);
  workspace.act('platform', 'promote_environment', {...workspace.state.teams[0].environment, automation: 'HG SDLC', ram: 16, runtimeVersion: '2.0'});
  assert.equal(workspace.state.teams[0].environment.ram, 16);
  assert.equal(workspace.state.teams[0].environment.runtimeVersion, '2.0');
  assert.equal(workspace.state.teams[0].environment.status, 'ready');
  assert.ok(workspace.state.notifications.some(item => item.kind === 'Environment Promoted'));
});

test('Tracker only binds a resource; mock tasks are explicitly added to their project', () => {
  const w = domainWorkspace();
  w.act('platform','save_environment',{...w.state.teams[0].environment,automation:'HG SDLC'});
  assert.equal(w.state.tasks.length, 0);
  w.act('platform', 'save_binding', {type: 'Task Tracker', name: 'Task Tracker'});
  w.act('platform', 'save_binding', {type: 'Task Tracker', name: 'Task Tracker'});
  assert.equal(w.state.tasks.length, 0, 'Connecting Tracker must not import tasks.');
  assert.equal(w.state.teams[0].bindings.filter(binding => binding.type === 'Task Tracker').length, 1);
  const projectId = w.act('engineer', 'create_project', {name: 'Первый проект'}).id;
  assert.throws(() => w.act('engineer', 'add_mock_tasks', {projectId, template: 'mixed', count: 12}), /Repository/);
  w.act('platform', 'save_binding', {type: 'Repository', name: 'bank/lc-trade-api', read: '/**', write: '/pom.xml', createPr: true});
  w.act('engineer', 'add_mock_tasks', {projectId, template: 'mixed', count: 12, assigneeId: 'engineer'});
  const first = w.state.tasks.filter(task => task.teamId === w.teamId);
  assert.equal(first.length, 12);
  assert.deepEqual(first.map(task => [task.title, task.tag]), trackerTaskTemplates().slice(0,12).map(task => [task.title, task.tag]));
  assert.ok(first.every(task => task.productId === w.productId && task.boardId === projectId && task.status === 'backlog'));
  assert.ok(first.every(task => task.assigneeId === 'engineer' && task.mock));
  assert.ok(first.every(task => task.id !== task.externalId));
  const firstIds = first.map(task => task.id);
  w.act('platform', 'save_binding', {type: 'Task Tracker', name: 'Task Tracker'});
  assert.deepEqual(w.state.tasks.map(task => task.id), firstIds);

  const secondTeamId = w.act('po', 'create_team', {name: 'Вторая команда', scope: 'Activation'}).id;
  w.act('po', 'add_person', {teamId: secondTeamId, personId: 'platform', role: 'Platform Engineer'});
  w.act('platform','save_environment',{teamId:secondTeamId,...w.state.teams.find(t=>t.id===secondTeamId).environment,automation:'HG SDLC'});
  w.act('platform', 'save_binding', {teamId: secondTeamId, type: 'Task Tracker', name: 'Task Tracker'});
  w.act('platform', 'save_binding', {teamId: secondTeamId, type: 'Repository', name: 'bank/lc-trade-api', read: '/**', write: '/pom.xml', createPr: true});
  assert.equal(w.state.tasks.filter(task => task.teamId === secondTeamId).length, 0);
  const secondProjectId = w.act('po', 'create_project', {teamId: secondTeamId, name: 'Второй проект'}).id;
  w.act('po', 'add_mock_tasks', {teamId: secondTeamId, boardId: secondProjectId, template: 'dep-update', count: 3, assigneeId: ''});
  const second = w.state.tasks.filter(task => task.teamId === secondTeamId);
  assert.equal(second.length, 3);
  assert.ok(second.every(task => task.boardId === secondProjectId && task.tag === 'dep-update' && !task.assigneeId));
  assert.equal(new Set(w.state.tasks.map(task => task.id)).size, 15);
  assert.equal(Object.hasOwn(w.state, 'classes'), false);
  assert.equal(w.state.capabilities.length, 0);
});

test('setup preserves role, required resources, topology and repository scope gates', () => {
  const w = domainWorkspace();
  const team = w.state.teams[0];
  assert.ok(team.spaceId, 'Team Space exists before an Environment is provisioned.');
  assert.equal(team.environment.status, 'not_configured');
  assert.throws(() => w.act('engineer', 'save_binding', {
    type: 'Repository', name: 'bank/lc-trade-api', read: '/**', write: '/**',
  }), error => error instanceof DomainError && error.status === 403);
  w.act('platform', 'save_environment', {...team.environment, automation: 'HG SDLC'});
  for (const type of ['Repository', 'Task Tracker', 'CI']) {
    assert.throws(() => w.act('platform', 'provision', {topologyConfirmed: true}),
      error => error instanceof DomainError && error.message.includes(type));
    w.act('platform', 'save_binding', type === 'Repository' ? {
      type, name: 'bank/lc-trade-api', read: '/**', write: '/pom.xml', createPr: true,
    } : {type, name: type});
  }
  assert.throws(() => w.act('platform', 'provision', {topologyConfirmed: false}), /topology/);
  assert.equal(w.state.teams[0].environment.status, 'configured');
  w.act('platform', 'provision', {topologyConfirmed: true});
  assert.ok(w.state.teams[0].bindings.every(binding => binding.type !== 'Model Gateway'));
  assert.throws(() => w.act('platform', 'save_binding', {type: 'Model Gateway', name: 'Model Gateway'}), /Resource Binding/);
  const projectId = w.act('engineer', 'create_project', {name: 'Проект с ограниченным scope'}).id;
  const taskId = w.act('engineer', 'add_mock_tasks', {projectId, template: 'dep-update', count: 1}).taskIds[0];
  const capabilityId = w.act('engineer', 'create_capability', {tag: 'dep-update', template: 'dependency-update@1'}).id;
  const workflow = copy(w.state.capabilities.find(capability => capability.id === capabilityId).draft);
  workflow.nodeConfigs = getEditableFlowNodes(workflow);
  w.act('engineer', 'save_config', {capabilityId, expectedRevision: workflow.revision, config: workflow});
  w.act('platform', 'save_binding', {
    type: 'Repository', name: 'bank/lc-trade-api', read: '/**', write: '/src/letters-of-credit/**', createPr: true,
  });
  assert.equal(w.state.teams[0].environment.status, 'configured', 'Changed binding requires provisioning again.');
  assert.throws(() => w.act('engineer', 'start_run', {capabilityId, taskId, mode: 'supervised'}), /Environment/);
  w.act('platform', 'provision', {topologyConfirmed: true});
  assert.throws(() => w.act('engineer', 'start_run', {capabilityId, taskId, mode: 'supervised'}), /grants/);
  w.act('platform', 'save_binding', {
    type: 'Repository', name: 'bank/lc-trade-api', read: '/**', write: '/pom.xml', createPr: true,
  });
  w.act('platform', 'provision', {topologyConfirmed: true});
  w.act('po', 'update_assignments', {personId: 'engineer', assignments: []});
  assert.throws(() => w.act('engineer', 'start_run', {capabilityId, taskId, mode: 'supervised'}), /capability.review/);
  assert.equal(w.state.runs.length, 0, 'Rejected startup does not leave a partial Run.');
});

for (const runtime of ['HG SDLC', 'Maestro', 'AI Conductor']) {
  test(`${runtime}: complete empty setup through Node API reaches an approved supervised Run`, async t => {
    const f = await fixture(t);
    let current;
    let productId = '';
    let teamId = '';
    const act = async (action, payload = {}) => {
      const response = await f.request({
        action,
        scenario: current?.scenario,
        revision: current?.state.revision,
        payload: {productId, teamId, ...payload},
      });
      assert.equal(response.status, 200, `${action}: ${response.body.error || response.status}`);
      current = response.body;
      return current.result;
    };
    await act('select_scenario', {scenario: 'empty'});
    assert.equal(current.scenario, 'empty');
    assert.equal(current.scenarioChosen, true);
    assert.equal(current.actor.id, 'po');
    assert.equal(current.state.products.length, 0);
    productId = (await act('create_product', {name: `Продукт ${runtime}`, description: 'Setup с нуля'})).id;
    teamId = (await act('create_team', {name: 'Команда с нуля', scope: 'Onboarding, Activation'})).id;
    let team = current.state.teams.find(value => value.id === teamId);
    assert.ok(team.spaceId);
    assert.equal(team.environment.status, 'not_configured');
    assert.equal(team.automation, null);
    assert.deepEqual(team.people, ['po']);
    await act('add_person', {personId: 'platform', role: 'Platform Engineer'});
    await act('add_person', {personId: 'engineer', role: 'Product Engineer'});
    await act('select_actor', {actorId: 'platform'});
    assert.ok(current.actor.teams.includes(teamId));
    await act('save_environment', {...team.environment, automation: runtime});
    await act('save_binding', {
      type: 'Repository', name: 'bank/lc-trade-api', read: '/**',
      write: '/pom.xml\n/src/letters-of-credit/**', createPr: true, merge: false,
    });
    assert.equal(current.state.tasks.length, 0);
    for (const type of ['Task Tracker', 'CI']) {
      await act('save_binding', {type, name: type});
    }
    assert.equal(current.state.tasks.length, 0, 'Resource setup does not create project tasks.');
    assert.equal(Object.hasOwn(current.state, 'classes'), false);
    team = current.state.teams.find(value => value.id === teamId);
    await act('save_environment', {...team.environment, automation: runtime});
    assert.equal(current.state.teams[0].environment.status, 'configured');
    await act('provision', {topologyConfirmed: true});
    assert.equal(current.state.teams[0].environment.status, 'ready');
    await act('select_actor', {actorId: 'engineer'});
    const projectId = (await act('create_project', {name: 'Проект после Automation', description: 'Первая доска задач'})).id;
    const {taskIds} = await act('add_mock_tasks', {projectId, template: 'mixed', count: 12, assigneeId: 'engineer'});
    assert.equal(current.state.tasks.length, 12);
    assert.ok(current.state.tasks.every(task => task.boardId === projectId && task.assigneeId === 'engineer'));
    const instructions = 'Обновить только зависимость. Не менять retry logic. Выполнить compatibility suite.';
    const capabilityId = (await act('create_capability', {
      tag: 'dep-update', template: 'dependency-update@1', name: 'Dependency Update', config: {instructions},
    })).id;
    const capability = current.state.capabilities.find(value => value.id === capabilityId);
    assert.equal(capability.tag, 'dep-update');
    assert.equal(Object.hasOwn(capability, 'classId'), false);
    assert.equal(capability.draft.runtime, runtime);
    assert.equal(capability.draft.gateAssignee, 'engineer');
    assert.equal(capability.draft.instructions, instructions);
    const workflow = copy(capability.draft);
    workflow.nodeConfigs = getEditableFlowNodes(workflow);
    await act('save_config', {capabilityId, expectedRevision: workflow.revision, config: workflow});
    const taskId = taskIds[0];
    const runId = (await act('start_run', {taskId, capabilityId, mode: 'supervised'})).id;
    let run = current.state.runs.find(value => value.id === runId);
    assert.equal(run.status, 'input_required');
    assert.equal(run.writer, 'none');
    const input = run.gates.at(-1);
    await act('gate_decision', {
      runId, gateId: input.id, gateRevision: input.revision,
      artifactRevision: input.artifactRevision, decision: 'input', value: '2.17.3',
    });
    run = current.state.runs.find(value => value.id === runId);
    assert.equal(run.status, 'approval_required');
    assert.equal(run.metrics.approval, 0);
    assert.match(run.artifacts.manifest, /2\.17\.3/);
    const approval = run.gates.at(-1);
    await act('gate_decision', {
      runId, gateId: approval.id, gateRevision: approval.revision,
      artifactRevision: approval.artifactRevision, decision: 'approve',
    });
    run = current.state.runs.find(value => value.id === runId);
    assert.equal(run.status, 'accepted');
    assert.equal(run.writer, 'none');
    assert.equal(run.snapshot.runtime, runtime);
    assert.equal(snapshotTag(run.snapshot), 'dep-update');
    assert.equal(Object.hasOwn(run.snapshot, 'taskClass'), false);
    assert.equal(run.evidence.status, 'PASS');
    assert.equal(run.metrics.input, 1);
    assert.equal(run.metrics.approval, 1);
    assert.equal(run.gates.filter(gate => gate.status === 'pending').length, 0);
    assert.equal(current.state.tasks.find(task => task.id === taskId).status, 'done');
    assert.equal(current.state.knowledge.length, 1, 'Only the initial Jenkins environment knowledge exists; runs do not auto-publish.');
    assert.equal(current.state.benchmarks.length, 0);
    assert.equal(current.state.capabilities[0].releases.length, 0);
    const stats = getStats(current.state.runs.filter(value => snapshotTag(value.snapshot) === 'dep-update'));
    assert.equal(stats.started, 1);
    assert.equal(stats.accepted, 1);
    assert.equal(stats.input, 1);
    const releaseId = (await act('freeze_release', {capabilityId})).id;
    const release = current.state.capabilities[0].releases.find(value => value.id === releaseId);
    assert.equal(release.snapshot.tag, 'dep-update');
    assert.deepEqual(release.snapshot.historyRefs, [runId]);
    const revision = current.state.revision;
    await f.restart();
    const restored = await f.request();
    assert.equal(restored.status, 200);
    assert.equal(restored.body.scenario, 'empty');
    assert.equal(restored.body.scenarioChosen, true);
    assert.equal(restored.body.actor.id, 'engineer');
    assert.equal(restored.body.state.revision, revision);
    assert.equal(restored.body.state.runs.find(value => value.id === runId).status, 'accepted');
    assert.equal(restored.body.state.products[0].id, productId);
    assert.equal(restored.body.state.teams[0].id, teamId);
    assert.equal(restored.body.state.boards[0].id, projectId);
    if (runtime === 'HG SDLC') {
      const demoBefore = f.store.readState('demo');
      const cleared = await f.request({
        scenario: 'empty', revision, action: 'reset_scenario',
        payload: {confirmation: 'clear-empty-scenario'},
      });
      assert.equal(cleared.status, 200);
      assert.equal(cleared.body.result.reset, true);
      assert.equal(cleared.body.actor.id, 'po');
      assert.equal(cleared.body.state.revision, revision + 1);
      for (const key of workspaceCollections) assert.deepEqual(cleared.body.state[key], [], key);
      assert.ok(cleared.body.state.people.every(person => person.teams.length === 0));
      assert.deepEqual(f.store.readState('demo'), demoBefore, 'Clearing setup must leave demo data unchanged.');
      await f.restart();
      const emptyAgain = await f.request();
      assert.equal(emptyAgain.body.scenario, 'empty');
      assert.equal(emptyAgain.body.actor.id, 'po');
      assert.deepEqual(emptyAgain.body.state, cleared.body.state);
      const stale = await f.request({
        scenario: 'empty', revision, action: 'create_product',
        payload: {name: 'Старая вкладка', description: 'Не должна воскресить очищенный setup'},
      });
      assert.equal(stale.status, 409);
      assert.deepEqual((await f.request()).body.state, cleared.body.state);
    }
  });
}

test('switching scenarios preserves independent datasets and the selection survives restart', async t => {
  const f = await fixture(t);
  const first = await f.request();
  assert.equal(first.body.scenario, 'demo');
  assert.equal(first.body.scenarioChosen, false);
  const demoWrite = await f.request({
    scenario: 'demo', revision: first.body.state.revision, action: 'message',
    payload: {productId: 'accreditive', teamId: 'growth', thread: 'RUN-912', text: 'Demo state remains saved'},
  });
  assert.equal(demoWrite.status, 200);
  const empty = await f.request({action: 'select_scenario', payload: {scenario: 'empty'}});
  assert.equal(empty.body.actor.id, 'po');
  const emptyWrite = await f.request({
    scenario: 'empty', revision: empty.body.state.revision, action: 'create_product',
    payload: {productId: '', teamId: '', name: 'Сохранённый setup', description: 'Независимые данные'},
  });
  assert.equal(emptyWrite.status, 200);
  const productId = emptyWrite.body.result.id;
  await f.request({scenario: 'empty', action: 'select_actor', payload: {actorId: 'platform'}});
  const demo = await f.request({action: 'select_scenario', payload: {scenario: 'demo'}});
  assert.equal(demo.body.actor.id, 'engineer', 'Selecting demo restores its starter role.');
  assert.equal(demo.body.state.revision, demoWrite.body.state.revision);
  assert.ok(demo.body.state.messages.some(message => message.text === 'Demo state remains saved'));
  assert.ok(!demo.body.state.products.some(product => product.id === productId));
  const resumed = await f.request({action: 'select_scenario', payload: {scenario: 'empty'}});
  assert.equal(resumed.body.actor.id, 'po', 'Selecting empty restores its starter role.');
  assert.equal(resumed.body.state.products[0].id, productId);
  assert.equal(resumed.body.state.revision, emptyWrite.body.state.revision);
  assert.equal(resumed.body.state.messages.length, 0);
  await f.restart();
  const restored = await f.request();
  assert.equal(restored.body.scenario, 'empty');
  assert.equal(restored.body.scenarioChosen, true);
  assert.equal(restored.body.state.products[0].id, productId);
  const otherBrowser = await fetch(`${f.base}/api/state`).then(response => response.json());
  assert.equal(otherBrowser.scenario, 'demo', 'Scenario selection belongs to the browser session.');
  assert.equal(otherBrowser.scenarioChosen, false);
  assert.equal(otherBrowser.actor.id, 'engineer');
  assert.ok(otherBrowser.state.messages.some(message => message.text === 'Demo state remains saved'));
});

test('a stale tab cannot mutate data or its actor after the session changes scenario', async t => {
  const f = await fixture(t);
  const empty = await f.request({action: 'select_scenario', payload: {scenario: 'empty'}});
  const demo = await f.request({action: 'select_scenario', payload: {scenario: 'demo'}});
  await f.request({scenario: 'demo', action: 'select_actor', payload: {actorId: 'po'}});
  assert.equal(empty.body.state.revision, demo.body.state.revision, 'The guard must work even when revisions coincide.');
  const attempts = [
    {action: 'create_product', revision: empty.body.state.revision, payload: {name: 'Wrong scenario', description: 'Must not persist'}},
    {action: 'select_actor', payload: {actorId: 'regulator'}},
    {action: 'ask_assistant', payload: {teamId: 'growth', productId: 'accreditive', text: 'Что дальше?', surface: 'home'}},
  ];
  for (const attempt of attempts) {
    const rejected = await f.request({scenario: 'empty', ...attempt});
    assert.equal(rejected.status, 409, attempt.action);
    assert.match(rejected.body.error, /Сценарий изменился/);
  }
  const current = await f.request();
  assert.equal(current.body.scenario, 'demo');
  assert.equal(current.body.actor.id, 'po');
  assert.equal(current.body.state.revision, demo.body.state.revision);
  assert.deepEqual(current.body.state.products, demo.body.state.products);
  assert.equal(f.store.readState('empty').products.length, 0);
});

test('stale writes in the empty scenario cannot overwrite newer setup or the demo dataset', async t => {
  const f = await fixture(t);
  const empty = await f.request({action: 'select_scenario', payload: {scenario: 'empty'}});
  const revision = empty.body.state.revision;
  const responses = await Promise.all(['Первый продукт', 'Второй продукт'].map(name => f.request({
    scenario: 'empty', revision, action: 'create_product', payload: {name, description: 'Concurrent setup'},
  })));
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  const current = await f.request();
  assert.equal(current.body.state.products.length, 1);
  assert.equal(current.body.state.revision, revision + 1);
  const originalDemo = f.store.readState('demo');
  assert.equal(originalDemo.products.length, 1);
  assert.equal(originalDemo.products[0].id, 'accreditive');
  const stale = {...empty.body.state, revision: revision + 1};
  assert.throws(() => f.store.writeState(stale, revision, 'empty'),
    error => error instanceof DomainError && error.status === 409);
  assert.equal(f.store.readState('empty').products.length, 1);
  assert.equal(f.store.readState('demo').revision, originalDemo.revision);
});

test('invalid scenario selection is rejected without replacing the current session or saved data', async t => {
  const f = await fixture(t);
  const before = await f.request({action: 'select_scenario', payload: {scenario: 'empty'}});
  for (const scenario of ['unknown', '', null, '../main']) {
    const response = await f.request({action: 'select_scenario', payload: {scenario}});
    assert.equal(response.status, 400);
  }
  const after = await f.request();
  assert.equal(after.body.scenario, 'empty');
  assert.equal(after.body.scenarioChosen, true);
  assert.equal(after.body.actor.id, 'po');
  assert.deepEqual(after.body.state, before.body.state);
});

test('clearing requires explicit confirmation, a current revision and the empty scenario', async t => {
  const f = await fixture(t);
  const demo = await f.request();
  const forbidden = await f.request({
    scenario: 'demo', revision: demo.body.state.revision, action: 'reset_scenario',
    payload: {confirmation: 'clear-empty-scenario'},
  });
  assert.equal(forbidden.status, 403);
  assert.deepEqual((await f.request()).body.state, demo.body.state);
  const empty = await f.request({action: 'select_scenario', payload: {scenario: 'empty'}});
  const saved = await f.request({
    scenario: 'empty', revision: empty.body.state.revision, action: 'create_product',
    payload: {name: 'Настроенный продукт', description: 'Удаляется только после подтверждения'},
  });
  assert.equal(saved.status, 200);
  for (const confirmation of [undefined, '', 'yes', 'clear-demo-scenario']) {
    const denied = await f.request({
      scenario: 'empty', revision: saved.body.state.revision, action: 'reset_scenario',
      payload: {confirmation},
    });
    assert.equal(denied.status, 400);
    assert.deepEqual((await f.request()).body.state, saved.body.state);
  }
  const staleReset = await f.request({
    scenario: 'empty', revision: empty.body.state.revision, action: 'reset_scenario',
    payload: {confirmation: 'clear-empty-scenario'},
  });
  assert.equal(staleReset.status, 409);
  assert.deepEqual((await f.request()).body.state, saved.body.state);
  assert.deepEqual(projectStateForActor(f.store.readState('demo'),demo.body.actor), demo.body.state);
});

test('an old SQLite database retains its main data and actor while gaining scenario support', async t => {
  const legacySessionId = '71df09e4-6dc0-438c-b9da-4d7abb8857a2';
  const legacy = JSON.parse(JSON.stringify(createSeed()));
  legacy.revision = 73;
  legacy.products[0].name = 'Продукт пользователя из старой версии';
  legacy.messages.push({id: 'legacy-message', thread: 'team-growth', actor: 'po', text: 'Не потерять старые изменения', time: '2026-10-06T12:00:00.000Z'});
  const f = await fixture(t, {
    cookieId: legacySessionId,
    prepare(filename) {
      const old = new DatabaseSync(filename);
      try {
        old.exec(`
          CREATE TABLE kontur_state (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, body TEXT NOT NULL);
          CREATE TABLE kontur_sessions (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL);
        `);
        old.prepare('INSERT INTO kontur_state (id, revision, body) VALUES (?, ?, ?)').run('main', legacy.revision, JSON.stringify(legacy));
        old.prepare('INSERT INTO kontur_sessions (id, actor_id) VALUES (?, ?)').run(legacySessionId, 'po');
      } finally {
        old.close();
      }
    },
  });
  const migrated = await f.request();
  assert.equal(migrated.status, 200);
  assert.equal(migrated.body.actor.id, 'po');
  assert.equal(migrated.body.scenario, 'demo');
  assert.equal(migrated.body.scenarioChosen, false);
  assert.deepEqual(migrated.body.state, projectStateForActor(legacy,migrated.body.actor));
  assert.deepEqual(f.store.readState('demo'),legacy);
  const empty = await f.request({action: 'select_scenario', payload: {scenario: 'empty'}});
  assert.equal(empty.status, 200);
  assert.equal(empty.body.state.products.length, 0);
  assert.deepEqual(f.store.readState('demo'), legacy);
  await f.restart();
  assert.equal((await f.request()).body.scenario, 'empty');
  const restored = await f.request({action: 'select_scenario', payload: {scenario: 'demo'}});
  assert.equal(restored.body.actor.id, 'engineer');
  assert.deepEqual(restored.body.state, projectStateForActor(legacy,restored.body.actor));
});

test('legacy SQLite Task Classes migrate to task tags once while frozen history stays byte-identical', async t => {
  const legacy = JSON.parse(JSON.stringify(createSeed()));
  legacy.revision = 73;
  legacy.classes = legacy.capabilities.map(capability => ({
    id: `class-${capability.tag}`, tag: capability.tag, name: capability.name,
    description: 'Класс в предыдущей версии', productId: capability.productId, teamId: capability.teamId,
  }));
  for (const capability of legacy.capabilities) {
    capability.classId = legacy.classes.find(value => value.tag === capability.tag).id;
    delete capability.tag;
  }
  for (const suite of legacy.suites) {
    suite.classId = legacy.classes.find(value => value.tag === suite.tag).id;
    delete suite.tag;
    delete suite.teamId;
    delete suite.productId;
  }
  delete legacy.boards;
  for (const task of legacy.tasks) {
    delete task.boardId;
    delete task.assigneeId;
    delete task.mock;
  }
  const gateway = {id: 'legacy-gateway', type: 'Model Gateway', name: 'Model Gateway', read: '', write: '', createPr: false, merge: false, status: 'connected'};
  legacy.teams[0].bindings.push(gateway);
  const oldRules = policy => {
    for (const rule of policy.applicability) if (rule.tag !== undefined) {
      rule.taskClass = rule.tag;
      delete rule.tag;
    }
  };
  legacy.policies.forEach(oldRules);
  const snapshots = state => [
    ...state.runs.map(run => run.snapshot),
    ...state.capabilities.flatMap(capability => capability.releases.map(release => release.snapshot)),
  ];
  for (const snapshot of snapshots(legacy)) {
    snapshot.taskClass = JSON.parse(JSON.stringify(legacy.classes.find(value => value.tag === snapshot.tag)));
    delete snapshot.tag;
    snapshot.bindings.push(JSON.parse(JSON.stringify(gateway)));
    snapshot.policyPackages.forEach(oldRules);
  }
  const frozenBefore = snapshots(legacy).map(snapshot => JSON.stringify(snapshot));
  const f = await fixture(t, {
    prepare(filename) {
      const old = new DatabaseSync(filename);
      try {
        old.exec('CREATE TABLE kontur_state (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, body TEXT NOT NULL);');
        old.prepare('INSERT INTO kontur_state (id, revision, body) VALUES (?, ?, ?)').run('main', legacy.revision, JSON.stringify(legacy));
      } finally { old.close(); }
    },
  });
  const migrated = await f.request();
  assert.equal(migrated.status, 200);
  const state = migrated.body.state;
  assert.equal(state.revision, 74);
  assert.equal(Object.hasOwn(state, 'classes'), false);
  assert.equal(state.boards.length, 1);
  assert.ok(state.tasks.every(task => task.boardId === state.boards[0].id));
  assert.deepEqual(state.capabilities.map(capability => capability.tag), ['dep-update', 'statement-doc']);
  assert.ok(state.capabilities.every(capability => !Object.hasOwn(capability, 'classId')));
  assert.equal(state.suites[0].tag, 'dep-update');
  assert.equal(state.suites[0].teamId, 'growth');
  assert.equal(state.suites[0].productId, 'accreditive');
  assert.ok(state.teams[0].bindings.every(binding => binding.type !== 'Model Gateway'));
  assert.deepEqual(snapshots(state).map(snapshot => JSON.stringify(snapshot)), frozenBefore);
  assert.equal(getStats(state.runs.filter(run => snapshotTag(run.snapshot) === 'dep-update')).started, 44);
  assert.deepEqual((await f.request()).body.state, state, 'Reading a migrated state must not migrate it again.');
  await f.restart();
  assert.deepEqual((await f.request()).body.state, state, 'Migrated data and its single revision increment are persisted.');
});
