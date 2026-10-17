/* Optional SSR smoke tests. Requires npm ci; interactive checks are documented in TESTING.md. */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (id, parent, ...rest) {
  return originalResolve.call(this, id.startsWith('@/') ? path.join(root, id.slice(2)) : id, parent, ...rest);
};
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => {
  const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true},
  });
  module._compile(result.outputText, file);
};
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {KonturContext} = require('../components/kontur/context.tsx');
const {createSeed, createEmptyState, defaultEnvironment, currentRelease, defaultConfig, getFlowNodes, copy} = require('../lib/domain.ts');
const {upgradeDemoState} = require('../lib/demo-v16.ts');
const seed = createSeed();
upgradeDemoState(seed);
const noop = () => {};
const emptyTeam = {id: 'empty', name: 'Новая команда', spaceId: 'new-space', knowledgeVersion: 1, people: [], bindings: [], environment: defaultEnvironment('Новая команда'), automation: null};
const base = {
  state: seed, actor: seed.people.find(p => p.id === 'engineer'), team: seed.teams[0], product: seed.products[0],
  screen: 'home', ref: '', tab: '', busy: false, go: noop, act: async () => ({ok: true}), reload: async () => {},
  can: () => true, has: () => true, ask: async () => ({text: ''}), setScope: noop,
};
let count = 0;
function render(file, name = 'default', context = {}, props = {}) {
  const Component = require(`../components/kontur/${file}.tsx`)[name];
  assert.equal(typeof Component, 'function', `${file}:${name} export`);
  const html = renderToStaticMarkup(React.createElement(KonturContext.Provider, {value: {...base, ...context}}, React.createElement(Component, props)));
  assert.ok(html.length, `${file}:${name} must render`);
  count++;
  return html;
}
function includes(html, texts, label) {
  for (const text of texts) assert.ok(html.includes(text), `${label}: missing ${text}`);
}
const before = JSON.stringify(seed);
const fixtures = [
  ['home'], ['tasks'], ['environment'], ['settings'], ['capabilities', 'CapabilityList'],
  ['capabilities', 'CapabilityView', {ref: 'cap-dep'}], ['runs', 'RunView', {ref: 'RUN-912'}],
  ['runs', 'Automation'], ['messenger', 'Messenger'], ['assistant-bubble'], ['knowledge'],
  ['regulation'], ['benchmark'], ['catalog'], ['notifications'],
];
for (const empty of [false, true]) for (const [file, name = 'default', context = {}] of fixtures) {
  if (empty && ['RunView', 'CapabilityView'].includes(name)) continue;
  render(file, name, {screen: file, ...(empty ? {team: emptyTeam} : {}), ...context});
}
const {ScenarioScreen, Bootstrap, getSetupSteps} = require('../components/kontur/onboarding.tsx');
const empty = createEmptyState();
for (const [Component, props] of [
  [ScenarioScreen, {busy: false, choose: noop}],
  [Bootstrap, {state: empty, actor: empty.people.find(p => p.id === 'po'), busy: false, act: async () => ({ok: true}), setScope: noop, go: noop, onScenario: noop}],
]) {
  assert.ok(renderToStaticMarkup(React.createElement(Component, props)).length);
  count++;
}
function releaseGuideStep(stage, securityAccepted = false) {
  const state = copy(seed), cap = state.capabilities.find(item => item.id === 'cap-dep'), release = cap.releases[0];
  release.stage = stage;
  release.securityApproval = securityAccepted ? {accepted: true} : undefined;
  return getSetupSteps(state, state.teams[0], state.products[0], state.people.find(person => person.id === 'engineer')).find(step => step.title === 'Выпустите автономность');
}
assert.deepEqual({role: releaseGuideStep('frozen').role, actorId: releaseGuideStep('frozen').actorId}, {role: 'Product Engineer', actorId: 'engineer'});
assert.deepEqual({role: releaseGuideStep('uat_passed').role, actorId: releaseGuideStep('uat_passed').actorId}, {role: 'Product Owner', actorId: 'po'});
assert.deepEqual({role: releaseGuideStep('admitted').role, actorId: releaseGuideStep('admitted').actorId, switchLabel: releaseGuideStep('admitted').switchLabel}, {role: 'Regulator', actorId: 'regulator', switchLabel: 'эксперта безопасности'});
assert.deepEqual({role: releaseGuideStep('admitted', true).role, actorId: releaseGuideStep('admitted', true).actorId}, {role: 'Product Engineer', actorId: 'engineer'});
const singlePolicyState = copy(seed);
singlePolicyState.capabilities = [];
singlePolicyState.runs = [];
singlePolicyState.suites = [];
singlePolicyState.benchmarks = [];
singlePolicyState.policies = [{...copy(seed.policies.find(policy => policy.direction === 'Information Security' && policy.status === 'Current')), createdBy: 'regulator', productId: seed.products[0].id, status: 'Draft'}];
let singlePolicySteps = getSetupSteps(singlePolicyState, singlePolicyState.teams[0], singlePolicyState.products[0], singlePolicyState.people.find(person => person.id === 'regulator'));
assert.equal(singlePolicySteps.find(step => step.title === 'Создайте регуляторный пакет').done, true, 'One package completes package creation.');
assert.equal(singlePolicySteps.find(step => step.title === 'Введите пакет в действие').done, false, 'Draft package still requires activation.');
singlePolicyState.policies[0].status = 'Current';
singlePolicySteps = getSetupSteps(singlePolicyState, singlePolicyState.teams[0], singlePolicyState.products[0], singlePolicyState.people.find(person => person.id === 'regulator'));
assert.equal(singlePolicySteps.find(step => !step.done).title, 'Создайте Workflow из Автоматизации', 'One current package advances the guide to Workflow.');
assert.equal(singlePolicySteps.find(step => !step.done).button, 'Открыть Автоматизацию');
const intro = render('onboarding', 'JourneyOverview');
includes(intro, ['Последовательность демосценария', 'Product Owner', 'Product Engineer', 'Platform Engineer', 'Regulator'], 'Journey');
const platforms = render('environment', 'default', {screen: 'environment', tab: 'automation', actor: seed.people.find(p => p.id === 'platform'), team: emptyTeam});
includes(platforms, ['HG SDLC', 'Maestro', 'AI Conductor', 'AI Manager', 'Платформа исполнения'], 'Execution platforms');
const automation = render('runs', 'Automation', {screen: 'automation'});
includes(automation, ['Создать Workflow', 'Открыть DEV', 'Мониторинг PROD', 'Workflows продукта'], 'Automation entry');
const productionMonitoringState = copy(seed), productionRelease = currentRelease(productionMonitoringState.capabilities.find(capability => capability.id === 'cap-dep'));
for (const run of productionMonitoringState.runs.filter(run => run.teamId === productionMonitoringState.teams[0].id && run.capabilityId === 'cap-dep' && !run.uat).slice(0, 2)) {
  run.releaseId = productionRelease.id;
  run.mode = 'production';
}
const productionMonitoring = render('capabilities', 'CapabilityView', {state: productionMonitoringState, screen: 'capability', ref: 'cap-dep', tab: 'monitoring'});
includes(productionMonitoring, ['Автоматическое выполнение задач', 'Прогресс PROD', 'Human Gates не используются'], 'Production monitoring progress');
assert.ok(!productionMonitoring.includes('Эмулировать продакшн'), 'Production monitoring has no manual emulation button.');
const capabilityList = render('capabilities', 'CapabilityList', {screen: 'capabilities'});
assert.ok(!capabilityList.includes('Эмулировать продакшн'), 'Production cards have no manual emulation button.');
const messengerInput = render('messenger', 'Messenger', {screen: 'messenger', ref: 'RUN-912', tab: 'messages'});
includes(messengerInput, ['HUMAN INPUT', 'Варианты Human Input', 'Отправить ввод'], 'Messenger Human Input');
const messengerApproval = render('messenger', 'Messenger', {screen: 'messenger', ref: 'RUN-913', tab: 'messages'});
includes(messengerApproval, ['HUMAN APPROVAL', 'Отправить на доработку', 'Одобрить'], 'Messenger Human Approval');
const takeoverState = copy(seed), takeoverRun = takeoverState.runs.find(run => run.id === 'RUN-912'), takeoverGate = takeoverRun.gates.find(gate => gate.status === 'pending');
takeoverRun.writer = 'human';
takeoverRun.status = 'takeover';
takeoverGate.status = 'taken_over';
takeoverGate.decision = {action: 'takeover', actor: 'engineer', comment: 'Ручная правка в IDE.'};
const takeover = render('runs', 'RunView', {state: takeoverState, screen: 'run', ref: takeoverRun.id, tab: 'gates'});
includes(takeover, ['Верните управление после ручной работы', 'Комментарий к возврату', 'Вернуть агенту и продолжить'], 'Takeover return');
const evidenceRun = seed.runs.find(run => run.evidence && run.snapshot.config.policies.length);
assert.ok(evidenceRun, 'Seed must contain a completed run with regulatory evidence.');
const regulatoryEvidence = render('regulatory-evidence-readiness', 'default', {}, {policyKeys: evidenceRun.snapshot.config.policies, runs: [evidenceRun]});
includes(regulatoryEvidence, ['Регуляторные проверки по запускам', 'отчётов evidence', evidenceRun.evidence.id, 'Ожидаемая проверка:', 'Observed', 'Evidence', 'Источник: Evidence Registry'], 'Regulatory evidence readiness');
const missingRegulatoryEvidence = render('regulatory-evidence-readiness', 'default', {}, {policyKeys: evidenceRun.snapshot.config.policies, runs: []});
includes(missingRegulatoryEvidence, ['Нет evidence', 'Нет отчёта'], 'Missing regulatory evidence');
const evidenceRegistry = render('evidence-registry', 'default', {actor: seed.people.find(person => person.id === 'regulator'), screen: 'regulation', tab: 'evidence'});
includes(evidenceRegistry, ['Evidence Registry', 'GET /api/evidence', 'SQLite', 'Журнал проверок', 'REGULATORY CONTROL PLANE'], 'Evidence Registry');
const riskRegulation = render('regulation', 'default', {actor: seed.people.find(person => person.id === 'regulator-reviewer'), screen: 'regulation', tab: ''});
includes(riskRegulation, ['Эксперт рисков', 'Риск'], 'Risk regulator profile');
assert.ok(!riskRegulation.includes('Информационная безопасность'), 'Risk profile must not show the Information Security tab.');
assert.ok(!riskRegulation.includes('Надёжность'), 'Risk profile must not show the Reliability tab.');
assert.ok(!riskRegulation.includes('Сегментация систем'), 'Risk profile must not show the Information Security segmentation action.');
for (const [tab, expected] of Object.entries({
  ontology: ['Как знание попадает в продукт', 'Дерево и граф'],
  publication: ['Workflow публикации', 'Предложено', 'Проверено', 'Опубликовано'],
  graph: ['Граф опубликованных знаний', 'Готовые запросы к графу', 'Регуляторные знания сегмента', 'JavaScript-эмуляция Cypher'],
  delivery: ['Способ 1 · Knowledge MCP', 'Способ 2 · API', 'Implementation', 'Jenkins'],
})) {
  const html = render('knowledge', 'default', {screen: 'knowledge', tab});
  includes(html, ['Онтология', 'Review и публикация', 'Граф знаний', 'Доставка агенту', ...expected], `Knowledge:${tab}`);
  assert.ok(!html.includes('Сформировать Context Request'), 'Delivery simulation belongs in Run, not Knowledge');
}
const benchmarks = render('benchmark', 'default', {screen: 'benchmark', tab: 'lab'});
includes(benchmarks, ['Benchmarks', 'Судьи', 'Наборы тестов', 'Запустить оценку'], 'Benchmarks');
assert.ok(!benchmarks.includes('Golden Isolation'), 'Removed benchmark boilerplate');
assert.ok(!benchmarks.includes('Следующий шаг — набор тестов'), 'Benchmark lab does not duplicate the navigation hint');
const judges = render('benchmark', 'default', {screen: 'benchmark', tab: 'judges'});
includes(judges, ['Создать судью', 'Создать новую версию', 'Промпт и выходная схема'], 'Judges');
for (const capabilityId of ['cap-statement', 'cap-dep']) {
  const cap = seed.capabilities.find(c => c.id === capabilityId);
  const config = cap.draft || currentRelease(cap).snapshot.config;
  const html = render('configuration', 'default', {screen: 'capability', ref: capabilityId, tab: 'configuration'}, {cap});
  includes(html, ['Редактор Flow', 'Контур и доступы', 'Запустить задачу', 'Общие настройки Flow'], capabilityId);
  if (cap.draft && !cap.draft.nodeConfigs) assert.match(html, /<button(?=[^>]*disabled="")(?=[^>]*title="Сначала сохраните Workflow")[^>]*>/, 'Unsaved workflow launch guard');
  assert.equal((html.match(/class="workflow-node-card /g) || []).length, config.nodes.length, 'Flow graph reflects saved nodes');
  if (!cap.draft) includes(html, ['READ ONLY', 'Новая версия'], 'Released workflow');
}
for (const runtime of ['HG SDLC', 'Maestro', 'AI Conductor', 'AI Manager']) {
  const config = defaultConfig('dep-update', runtime);
  config.nodeConfigs = getFlowNodes(config);
  const html = render('flow-editor', 'default', {}, {
    config, savedConfig: copy(config), flowName: 'Проверочный Flow', ownerTeam: seed.teams[0],
    onNameChange: noop, editable: true, busy: false, dirty: true, onChange: noop, onSave: async () => true,
  });
  includes(html, ['Добавить шаг', 'До запуска', 'После запуска'], `Flow editor ${runtime}`);
}
assert.equal(JSON.stringify(seed), before, 'Rendering must not mutate state, historical snapshots or reports');
console.log(`Rendered ${count} populated, empty and version 1.6 screen fixtures without SSR errors.`);
