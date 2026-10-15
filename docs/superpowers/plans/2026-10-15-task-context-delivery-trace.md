# Task-driven Context Delivery Trace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual Context Bundle preview with a task-driven demonstration that shows the complete simulated path `Task → LLM Context Planner → deterministic Resolver → Flow nodes → Regulatory Verification`, while keeping real Run execution unchanged.

**Architecture:** Add a pure `compileContextDeliveryTrace` view-model compiler beside the legacy bundle compiler. It derives task scope and Flow from existing Task/Capability/Resource Binding data, emulates an LLM planner only for Product/Team topic and stage assignment, resolves exact versioned sources deterministically, and injects applicable policy into every Flow stage. The UI keeps a generated trace in local preview state, saves a deep-copied compatibility `ContextBundle` snapshot through the existing action layer, and clearly labels every operation as a simulation.

**Tech Stack:** TypeScript, React 19, Vite, existing KONTUR domain engine, Node `node:test`, server render fixtures, CSS in `src/reference-theme.css`, static architecture HTML.

---

## Task 1: Define the trace contract and pin behavior with failing domain tests

**Files:**
- Modify: `lib/domain.ts:1-35`
- Modify: `tests/domain.test.mjs:790-826`

- [ ] **Step 1: Extend the backward-compatible domain contract**

Add typed structures for the simulation without changing Run or Snapshot:

```ts
export type ContextSourceKind = 'product'|'team'|'policy';
export interface ContextPlannerRequest { taskId:string; taskTitle:string; taskTag:string; repository:string; system:string; segment:string; workTypes:string[]; flowNodes:Item[] }
export interface ContextPlannerResult { simulation:true; topics:string[]; layers:{product:boolean;team:boolean}; assignments:{product:string[];team:string[]}; rationale:string[]; unknown:string[] }
export interface ContextFragment { id:string; sourceId:string; version:number; kind:ContextSourceKind; title:string; content:string; reason:string; stageIds:string[]; provenance:string[]; status:string }
export interface ContextStageSlice { id:string; name:string; type:string; product:ContextFragment[]; team:ContextFragment[]; policy:ContextFragment[]; unknown:string[] }
export interface RegulatoryVerificationPreview { status:'PASS'|'FAIL'|'INCONCLUSIVE'; route:'Result'|'Rework'|'Human Approval Gate'; artifacts:Item[]; results:Item[]; simulation:true }
export interface ContextDeliveryTrace { simulation:true; simulationId:string; task:Item; request:ContextPlannerRequest; plannerResult:ContextPlannerResult; fragments:ContextFragment[]; stages:ContextStageSlice[]; verification:RegulatoryVerificationPreview; unknown:string[]; blocking:string[]; hash:string }
```

Extend only optional `ContextBundle` fields: `simulation?`, `taskId?`, `plannerResult?`, `stageSlices?`, and `verificationPreview?`. Keep all existing required fields intact so persisted legacy bundles still parse and render.

- [ ] **Step 2: Add failing tests for task scope and planner assignments**

Add tests that call the future compiler with `BANK-1842` and assert:

```js
const trace=c.compileContextDeliveryTrace(s,'BANK-1842');
assert.equal(trace.simulation,true);
assert.equal(trace.task.repository,'bank/lc-trade-api');
assert.equal(trace.task.system,'Trade Finance LC');
assert.equal(trace.task.segment,'corporate.backend');
assert.ok(trace.plannerResult.topics.includes('foundation'));
assert.ok(trace.plannerResult.assignments.product.length);
assert.ok(trace.plannerResult.assignments.team.length);
```

- [ ] **Step 3: Add failing tests for policy invariants and deterministic output**

Assert that Product and Team fragments appear only in planner-assigned nodes, every stage contains the applicable Policy lane, applicability honors segment/tag/work type, and identical state/task inputs produce the same hash and simulation id.

- [ ] **Step 4: Add failing tests for edge states**

Cover missing binding/segment, no product topic, no team knowledge, deprecating policy warning, retired policy blocking, no applicable current/deprecating policy blocking, and explicit `INCONCLUSIVE` verification when required evidence is missing.

- [ ] **Step 5: Run the new test slice and confirm RED**

Run: `node --test --test-name-pattern="Context Delivery Trace" tests/domain.test.mjs`

Expected: failure because `compileContextDeliveryTrace` and trace types do not exist yet.

- [ ] **Step 6: Commit the contract and RED tests**

```bash
git add lib/domain.ts tests/domain.test.mjs
git commit -m "test: specify task context delivery trace"
```

## Task 2: Implement the deterministic planner, resolver, stage slices, and verifier

**Files:**
- Modify: `lib/context-supply.ts:1-127`
- Modify: `tests/domain.test.mjs`

- [ ] **Step 1: Add shared matching helpers**

Factor applicability matching so bundle and trace selection use the same semantics:

```ts
const listMatches=(value:string|undefined,expected:string[]) =>
  !value || String(value).split(',').map(item=>item.trim()).some(item=>expected.includes(item));

const ruleMatches=(rule:Item,scope:Item) =>
  (!rule.segment || rule.segment===scope.segment) &&
  (!(rule.tag??rule.taskClass) || (rule.tag??rule.taskClass)===scope.tag) &&
  listMatches(rule.workType,scope.workTypes) &&
  (!rule.artifactType || scope.artifactTypes.includes(rule.artifactType));
```

When artifact type is unavailable, do not silently discard the requirement: keep it applicable and surface the artifact condition in the reason/verification expectation.

- [ ] **Step 2: Derive task, binding, capability, and Flow scope**

Resolve Task from current Product/Team, match its Repository binding, match Capability by task tag, and choose the production release config before draft/default fallback. Use `getFlowNodes(config)` so custom Flow nodes are represented verbatim.

- [ ] **Step 3: Implement the deterministic LLM Planner simulation**

Produce a structured response only for topics/layers/stage assignments. Use task tag/title plus known concepts to select topic IDs, and stable node-type rules to map Product to analysis/specification/implementation and Team to implementation/checks/result. Always emit `simulation: true`, rationale, and unknowns.

- [ ] **Step 4: Resolve exact Product, Team, and Policy fragments**

Product/Team fragments must point to existing approved Knowledge and carry exact version, source refs, reason, and only the Planner-assigned stage ids. Policy selection must ignore Planner layer choices and select requirements by segment/tag/work type. For each applicable Policy fragment, assign all Flow stage ids and preserve package status/sunset, Skills, Evidence Rules, and provenance.

- [ ] **Step 5: Build stage slices and verification preview**

For every real Flow node, create a slice with three lanes. Build demonstration artifacts (`diff`, manifest, tests, registry reference) from task/work type and compute each requirement result. Aggregate routing exactly as:

```ts
const status = results.some(x=>x.status==='FAIL') ? 'FAIL'
  : results.some(x=>x.status==='INCONCLUSIVE') ? 'INCONCLUSIVE'
  : 'PASS';
const route = status==='PASS' ? 'Result'
  : status==='FAIL' ? 'Rework'
  : 'Human Approval Gate';
```

- [ ] **Step 6: Hash only canonical simulation inputs and resolved source content**

Exclude `createdAt`, UI selection, and transient animation state. Derive `simulationId` as `SIM-${hash suffix}` so the same inputs remain stable.

- [ ] **Step 7: Run focused tests and make them GREEN**

Run: `node --test --test-name-pattern="Context Delivery Trace|Context Bundle" tests/domain.test.mjs`

Expected: all matching tests pass, including legacy bundle behavior.

- [ ] **Step 8: Commit the compiler**

```bash
git add lib/context-supply.ts tests/domain.test.mjs
git commit -m "feat: compile task context delivery trace"
```

## Task 3: Persist simulation snapshots without changing runtime execution

**Files:**
- Modify: `lib/engine.ts:1-2,517`
- Modify: `tests/domain.test.mjs:815-826`
- Modify: `tests/api.test.mjs:190-220`

- [ ] **Step 1: Add a failing action test**

Call `save_context_bundle` with `{taskId:'BANK-1842'}` and assert the stored object has `simulation:true`, task id, planner result, stage slices, verification preview, and a `SIM-*` identity while legacy payloads still save through `compileContextBundle`.

- [ ] **Step 2: Implement the task-driven branch in the existing action**

Validate Product/Team scope and permission exactly as today. When `taskId` is present, compile the trace, reject blocking traces, and persist a deep copy mapped into the optional ContextBundle fields. Do not create or mutate Run, Gate, Capability, Snapshot, or evidence.

- [ ] **Step 3: Preserve snapshot immutability**

Mutate live Knowledge/Policy after save in the test and assert the stored stage fragments, planner result, and verification preview do not change.

- [ ] **Step 4: Run action and API tests**

Run: `node --test --test-name-pattern="Context actions|Context Delivery Trace|context bundle" tests/domain.test.mjs tests/api.test.mjs`

Expected: task-driven and legacy save paths pass.

- [ ] **Step 5: Commit persistence**

```bash
git add lib/engine.ts tests/domain.test.mjs tests/api.test.mjs
git commit -m "feat: persist context delivery simulations"
```

## Task 4: Rebuild Delivery as the interactive end-to-end simulation

**Files:**
- Modify: `components/kontur/context-delivery.tsx:1-34`
- Modify: `tests/render.cjs:70-135`

- [ ] **Step 1: Add render assertions for the new surface**

Assert server-rendered markup contains: task selector, `LLM simulation`, Context Planner request/response, the three source lanes, real Flow node names, selected-node inspector, Regulatory Verification, route label, snapshot history controls, and a disclaimer that no runtime delivery/gate is created.

- [ ] **Step 2: Replace manual selectors with task-first scope**

Select from tasks belonging to the current Product/Team. Show derived repository, system, segment, tag, work types, Capability, and Flow. Keep a clear empty state linking to the task board when no task exists.

- [ ] **Step 3: Add explicit planner execution state**

Keep the task scope visible at all times. `Сформировать Context Request` advances a short UI-only sequence (`request → planning → resolving → ready`) and then reveals the compiled trace. Task/source changes invalidate the current generated result until the button is run again.

- [ ] **Step 4: Render the source lanes and clickable Flow cubes**

Show Product, Team, and mandatory Policy counts. Render all `trace.stages` as keyboard-accessible buttons. The selected stage inspector lists fragment title, exact source/version, rationale, provenance, status/sunset, and unknowns.

- [ ] **Step 5: Add Regulatory Verification interaction**

Before activation, describe Build/Checks demo inputs. On `Запустить проверку` show requirement-by-requirement evidence, `PASS/FAIL/INCONCLUSIVE`, and visual route. Explicitly state that the displayed Human Approval Gate is not created in runtime.

- [ ] **Step 6: Make history usable**

Clicking a task-driven snapshot opens its frozen details. Add `Сравнить с preview` and display added/removed/changed fragment ids and changed stage assignments. Label old bundles as `Legacy snapshot` and keep their current readable context block.

- [ ] **Step 7: Keep export/save actions honest**

Export the trace JSON, copy the selected stage context (not a fictitious delivery receipt), and save only when the trace is generated, non-blocking, and the actor has `knowledge.contribute`.

- [ ] **Step 8: Run render tests**

Run: `node tests/render.cjs`

Expected: existing fixtures and new Delivery Trace assertions pass.

- [ ] **Step 9: Commit UI behavior**

```bash
git add components/kontur/context-delivery.tsx tests/render.cjs
git commit -m "feat: show end-to-end context delivery simulation"
```

## Task 5: Finish visual hierarchy, overview, and responsive behavior

**Files:**
- Modify: `src/reference-theme.css:693-900`
- Modify: `src/reference-theme.css` responsive sections
- Modify: `components/kontur/context-overview.tsx:1-80`
- Modify: `tests/render.cjs`

- [ ] **Step 1: Add trace-specific borders-only styles**

Use existing color semantics: forest green Product, sage Team, muted violet Policy, steel blue technical scope, amber unknown/deprecating, muted red blocking/fail. Keep every color paired with a label/status.

- [ ] **Step 2: Implement the responsive layouts**

Desktop uses a task/planner column plus Flow/inspector. Tablet wraps source lanes and Flow nodes without page overflow. Mobile uses one column in causal order and exposes all actions without hover. Keep important text at 11px or larger.

- [ ] **Step 3: Update Context Overview**

Replace the old “three sources → receipt” story with `Task → Planner → Resolver → Flow → Verification`, explicitly distinguishing probabilistic topic/stage planning from mandatory deterministic Policy resolution.

- [ ] **Step 4: Add static render/CSS regression assertions**

Assert trace classes and overview labels exist, and check that no source copy calls a simulation receipt proof of actual delivery/compliance.

- [ ] **Step 5: Run render and type checks**

Run: `npm run typecheck`

Run: `node tests/render.cjs`

Expected: both pass.

- [ ] **Step 6: Commit presentation changes**

```bash
git add src/reference-theme.css components/kontur/context-overview.tsx tests/render.cjs
git commit -m "style: clarify context trace stages"
```

## Task 6: Align the architecture documentation with the implemented demo

**Files:**
- Modify: `public/docs/kontur-architecture.html:706-773`
- Modify: `public/docs/kontur-architecture.html:920-970`
- Modify: `tests/render.cjs`

- [ ] **Step 1: Add failing documentation assertions**

Assert the static document contains `LLM Context Planner`, `deterministic Resolver`, `Context Stage Slice`, all three verification outcomes/routes, and a demo/no-runtime-integration disclaimer.

- [ ] **Step 2: Rewrite the Context Supply Chain sequence**

Document the exact chain, structured planner response example, stage mapping rules, policy invariants, snapshot history, and the distinction between simulated Delivery Trace and authoritative Runtime artifacts.

- [ ] **Step 3: Correct the runtime chapter**

Keep real Regulatory Plan/Evidence behavior separate. State that the demo verifier previews how PASS/FAIL/INCONCLUSIVE would route but creates no Run gate and provides no compliance proof.

- [ ] **Step 4: Run documentation/render checks**

Run: `node tests/render.cjs`

Expected: architecture assertions and all prior fixtures pass.

- [ ] **Step 5: Commit documentation**

```bash
git add public/docs/kontur-architecture.html tests/render.cjs
git commit -m "docs: explain task context delivery trace"
```

## Task 7: Verify the complete change and regenerate production output

**Files:**
- Generated: `dist/**`

- [ ] **Step 1: Run focused domain tests**

Run: `node --test --test-name-pattern="Context Delivery Trace|Context Bundle|Context actions" tests/domain.test.mjs`

Expected: all matching tests pass.

- [ ] **Step 2: Run full static and domain suites**

Run: `npm test`

Expected: all domain/API/setup/render tests pass.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: TypeScript passes, Vite completes, and `dist/docs` is regenerated from the updated source documentation.

- [ ] **Step 4: Inspect the demo in the browser**

Verify populated and empty scenarios at desktop and mobile widths: generate Planner result, change selected Flow node, run verification, save/open/compare snapshot, and confirm no outer horizontal overflow.

- [ ] **Step 5: Run repository hygiene checks**

Run: `git diff --check`

Run: `git status --short`

Expected: no whitespace errors; only intended source/generated files plus pre-existing untracked brainstorming artifacts.

- [ ] **Step 6: Commit generated production artifacts**

```bash
git add dist
git commit -m "build: update context delivery demo"
```

- [ ] **Step 7: Review acceptance criteria against the approved spec**

Confirm all ten criteria in `docs/superpowers/specs/2026-10-15-task-context-delivery-trace-design.md` are evidenced by code, tests, documentation, and browser inspection. Do not claim real runtime delivery or regulatory compliance.
