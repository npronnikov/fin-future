const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const test = require('node:test');
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
const {RunView} = require('../components/kontur/runs.tsx');
const {createSeed, copy} = require('../lib/domain.ts');
const {buildKnowledgeReceipt} = require('../lib/demo-v16.ts');

test('runtime evidence is disclosed inside the execution timeline', () => {
  const state = copy(createSeed());
  const run = state.runs.find(item => item.id === 'RUN-912');
  const receipt = buildKnowledgeReceipt(state, run);
  receipt.delivered = true;
  receipt.deliveredAt = run.events.at(-1).time;
  run.execution.knowledgeDelivery = receipt;
  run.events.push({time: receipt.deliveredAt, title: 'Implementation · знания доставлены', detail: 'Контекст передан в Implementation', kind: 'green'});

  const noop = () => {};
  const context = {
    state, actor: state.people.find(person => person.id === 'engineer'), team: state.teams[0], product: state.products[0],
    screen: 'run', ref: run.id, tab: '', busy: false, go: noop, act: async () => ({ok: true}), reload: async () => {},
    can: () => true, has: () => true, ask: async () => ({text: ''}), setScope: noop,
  };
  const html = renderToStaticMarkup(React.createElement(KonturContext.Provider, {value: context}, React.createElement(RunView)));

  for (const text of ['Execution timeline', 'Knowledge MCP', 'Запрос к графу', 'Product / Team без сегмента', 'MATCH (owner)', '&quot;teamId&quot;: &quot;growth&quot;', 'Регуляторный запрос', 'Information Security', 'Reliability', 'Risk', 'SEC-DEP-014@3', 'REL-COMPAT-004@5', 'RISK-SCOPE-003@2', 'Какую допустимую версию использовать?']) {
    assert.ok(html.includes(text), `missing ${text}`);
  }
  assert.ok(html.includes('<details class="timeline-disclosure knowledge-delivery"'), 'Knowledge delivery is inline');
  assert.ok(html.includes('<details class="timeline-disclosure regulatory-delivery"'), 'Regulatory delivery is inline');
  assert.ok(html.includes('<details open="" class="timeline-disclosure human-gate"'), 'Pending Human Gate is open');
  assert.ok(html.indexOf('Execution timeline') < html.indexOf('Knowledge MCP'), 'Knowledge delivery is not above the timeline');
  assert.ok(!html.includes('LLM Context Planner · demo'), 'Low-level delivery events are grouped into the disclosure');
});
