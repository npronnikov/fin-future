# Context Supply Chain and Accreditive Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the populated demo with an accreditive scenario and add a connected seven-stage Context Supply Chain route plus complete product documentation.

**Architecture:** Keep the existing server-owned `State` as the source of truth. Add ontology and immutable context-bundle collections, derive graph views and bundle previews from that state, and reuse existing bindings, policies, knowledge proposals, roles, and navigation. The static documentation remains the `/docs/kontur-architecture.html` entry point but gains Context Supply Chain, accreditive, API, guarantees, glossary, and source chapters.

**Tech Stack:** React 19, TypeScript 5.9, Node.js action engine, built-in Node test runner, Vite, existing CSS/UI primitives, standalone HTML documentation.

**Implementation note:** The user explicitly requested implementation without TDD because this is a mockup. Tests are added and run after each functional slice as regression verification rather than red-green development.

---

### Task 1: Add ontology and Context Bundle domain primitives

**Files:**
- Modify: `lib/domain.ts`
- Create: `lib/context-supply.ts`
- Modify: `tests/domain.test.mjs`

- [ ] **Step 1: Extend the state model**

Add `ConceptCategory`, `ProductConcept`, `ContextSelection`, `ContextBundleInput`, and `ContextBundle` interfaces. Extend `Knowledge` with optional `conceptIds`, `sourceRefs`, `summary`, and `publishedAt`. Extend `State` with `conceptCategories`, `concepts`, and `contextBundles`.

```ts
export interface ConceptCategory {id:string;productId:string;title:string;description:string;order:number}
export interface ProductConcept {id:string;productId:string;categoryId:string;label:string;description:string;variant:'all'|'individual'|'corporate';sourceRefs:string[];status:string;version:number}
export interface ContextBundleInput {productId:string;teamId:string;system:string;productTopic:string;workType:string;stage:'plan'|'implementation'|'verification'}
export interface ContextBundle {id:string;hash:string;input:ContextBundleInput;segment:string;product:Item;team:Item;productKnowledge:Item[];teamKnowledge:Item[];policies:Item[];concepts:Item[];selectionReasons:Item[];sourceVersions:string[];unknown:string[];blocking:string[];agentContext:string;createdAt:string;createdBy:string;receiptStatus:string}
```

- [ ] **Step 2: Implement deterministic compilation**

Create `lib/context-supply.ts` with:

```ts
export function compileContextBundle(state:State,input:ContextBundleInput,meta:{id?:string;createdAt?:string;createdBy?:string}={}):ContextBundle
export function contextBundleHash(payload:unknown):string
export function contextGraph(state:State,productId:string,teamId:string):{nodes:Item[];links:Item[]}
```

The compiler resolves system bindings to a segment, includes only approved Product/Team Knowledge, selects current/deprecating policies by segment and applicability, filters concepts by category and product variant, records missing data in `unknown`, records retired policies in `blocking`, and produces stable `sourceVersions`, `selectionReasons`, `agentContext`, and content hash.

- [ ] **Step 3: Seed the accreditive ontology**

Add the seven approved categories and concepts from the attached demo: foundations, customer scenarios, deal types, attributes, settlement, fees, and parties. Store only synthetic educational claims and explicit source labels.

- [ ] **Step 4: Keep migrations backward compatible**

Ensure `migrateState` supplies empty arrays for the three new collections and preserves all frozen historical snapshots byte-for-byte.

- [ ] **Step 5: Add regression tests**

Cover retail/corporate selection, topic filtering, draft exclusion, missing Team Knowledge, deprecating/retired policies, stable hash, changed-version hash, and legacy-state migration.

- [ ] **Step 6: Run domain tests**

Run: `node --test tests/domain.test.mjs`  
Expected: all domain tests pass.

### Task 2: Connect Context Supply Chain actions to the server state

**Files:**
- Modify: `lib/engine.ts`
- Modify: `tests/api.test.mjs`

- [ ] **Step 1: Add system classification action**

Add `classify_system`. Require `Platform Engineer`, validate the segment against `SEGMENTS`, validate team/product scope, and update every repository binding whose `system` equals the selected system.

```ts
case 'classify_system': {
  role(actor,'Platform Engineer');
  const team=workspaceScope(s,actor,p.teamId,p.productId);
  must(SEGMENTS.includes(p.segment),'Выберите поддерживаемый сегмент.');
  const bindings=team.bindings.filter(binding=>binding.type==='Repository'&&binding.system===p.system);
  must(bindings.length>0,'Техническая система не найдена.');
  bindings.forEach(binding=>binding.segment=p.segment);
  break;
}
```

- [ ] **Step 2: Preserve knowledge metadata**

Extend `knowledge_propose` to validate concept IDs in the current product and save `conceptIds`, `sourceRefs`, and `summary`. Extend `knowledge_review` to stamp `publishedAt` when approved.

- [ ] **Step 3: Save immutable Context Bundles**

Add `save_context_bundle`. Require `knowledge.contribute`, check team access and product scope, compile from current state on the server, reject `blocking` results, assign a unique ID, push a deep copy to `state.contextBundles`, and return that saved bundle.

- [ ] **Step 4: Verify action behavior through API tests**

Add tests for role enforcement, persisted classification, knowledge metadata, saved bundle persistence, identical content hashes, immutable earlier snapshots, and retired-policy rejection.

- [ ] **Step 5: Run API and domain suites**

Run with local-port permission: `node --test tests/domain.test.mjs tests/api.test.mjs`  
Expected: all selected tests pass.

### Task 3: Replace the populated demo with the accreditive scenario

**Files:**
- Modify: `lib/domain.ts`
- Modify: `lib/assistant.ts`
- Modify: `components/kontur/home.tsx`
- Modify: user-visible fixture expectations in `tests/domain.test.mjs`, `tests/render.cjs`, and `tests/api.test.mjs`

- [ ] **Step 1: Replace product and team fixtures**

Use product `accreditive` named «Аккредитив», with `LC Retail Engineering` and `Trade Finance Engineering`. Keep the trade-finance team first so existing single-team fixture helpers remain deterministic; add both teams to the relevant demo people and product responsibilities.

- [ ] **Step 2: Replace systems and repositories**

Use `LC Retail Service` in `retail.backend` and `Trade Finance LC` in `corporate.backend`, with repository names under `bank/lc-*`. Update configs, bindings, task repo fields, snapshots, capabilities, plans, suites, and any exact-history fixture references consistently.

- [ ] **Step 3: Replace visible work data**

Rename boards, tasks, Flow descriptions, knowledge, policies, messages, notifications, initiatives, assistant examples, benchmark labels, and home copy to accreditive scenarios while preserving the existing behavioral diversity of the test fixture.

- [ ] **Step 4: Preserve the empty scenario**

Do not prepopulate product/team/workspace data in `createEmptyState`; keep onboarding language domain-neutral.

- [ ] **Step 5: Scan for stale user-visible demo names**

Run: `rg -n "Копилка|Savings Core|bank/savings" components lib public tests`  
Expected: no user-visible populated-demo references remain; any intentional legacy migration fixture is explicitly named and isolated.

- [ ] **Step 6: Run domain and render regression suites**

Run: `node --test tests/domain.test.mjs && node tests/render.cjs`  
Expected: both commands pass.

### Task 4: Build the seven-stage native knowledge route

**Files:**
- Rewrite: `components/kontur/knowledge.tsx`
- Create: `components/kontur/context-supply-nav.tsx`
- Create: `components/kontur/context-overview.tsx`
- Create: `components/kontur/context-segmentation.tsx`
- Create: `components/kontur/context-policy.tsx`
- Create: `components/kontur/context-ontology.tsx`
- Create: `components/kontur/context-publication.tsx`
- Create: `components/kontur/context-graph.tsx`
- Create: `components/kontur/context-delivery.tsx`
- Modify: `components/kontur/app.tsx`
- Modify: `src/reference-theme.css`
- Modify: `tests/render.cjs`

- [ ] **Step 1: Implement the route shell**

Map tabs to `overview`, `segmentation`, `policy`, `ontology`, `publication`, `graph`, and `delivery`; unknown or old tabs such as `product`, `team`, and `proposals` redirect to the appropriate compatible stage. Keep the app sidebar and render a secondary route rail inside the page.

- [ ] **Step 2: Apply the interface-design checkpoint**

Use this explicit system before component work:

```text
Intent: cross-role bank product experts must trace and publish agent context; calm, technical, audit-ready.
Palette: existing forest Product, muted violet Policy, sage Team, steel-blue System, amber Unknown.
Depth: borders-only because provenance and density matter more than decorative lift.
Surfaces: current page/card/control surfaces; no second shell or dark theme.
Typography: current application type scale; monospace only for IDs, hashes, Cypher, and JSON.
Spacing: existing 4px-derived scale and UI primitives.
```

- [ ] **Step 3: Implement overview and segmentation**

Show the three source lanes converging on a Context Bundle receipt. Segmentation lists distinct binding systems, repository lineage, current segment, role requirement, and calls `classify_system`.

- [ ] **Step 4: Implement Policy Package stage**

Show applicable policy versions for the selected system segment, requirement/evidence composition, lifecycle, and guided links/actions using the existing `save_policy` and `policy_status` actions. Link to the full Regulator workspace for advanced editing.

- [ ] **Step 5: Implement ontology and publication**

Ontology supports category/variant filters and a concept detail inspector. Publication preserves the existing Product/Team approved lists, proposal modal, review controls, run evidence, and adds concept/source selection.

- [ ] **Step 6: Implement graph**

Render an accessible deterministic SVG from `contextGraph`, with type filters, selected-node inspector, zoom controls, four predefined Cypher examples, and clearly labeled JavaScript emulation results.

- [ ] **Step 7: Implement delivery**

Provide system/topic/work type/stage controls, live scope explanation, bundle preview, selected sources, unknown/blocking sections, agent-context text, saved history, copy, JSON download, and `save_context_bundle`.

- [ ] **Step 8: Add responsive styles and states**

Add route rail, source lanes, trace cards, graph, bundle receipt, focus, hover, disabled, empty, warning, and mobile rules. Reuse CSS variables and existing primitives; do not introduce a second palette.

- [ ] **Step 9: Add render checks**

Render all seven tabs, verify the route labels and accreditive content, and assert read-only/disabled states for roles without the required permission.

- [ ] **Step 10: Run render and type checks**

Run: `node tests/render.cjs && npm run typecheck`  
Expected: both commands pass.

### Task 5: Complete the Documentation section

**Files:**
- Modify: `public/docs/kontur-architecture.html`
- Generated by build: `dist/docs/kontur-architecture.html`
- Modify: `components/kontur/app.tsx`
- Modify: `tests/render.cjs`

- [ ] **Step 1: Add documentation chapters and navigation**

Add first-class pages/anchors for platform overview, Context Supply Chain, the accreditive walkthrough, regulators, Flow delivery, Sandbox, Knowledge Graph, assistant, Trusted Capability, Context Service API, operational guarantees, glossary, and sources.

- [ ] **Step 2: Move the industrial architecture content**

Move the attached demo's Authoring → Control Plane → Graph/Search → Runtime architecture, minimal Neo4j schema, API contract, guarantees, and source references into the documentation. The knowledge route links to these chapters instead of rendering an eighth stage.

- [ ] **Step 3: Replace old demo examples**

Replace «Копилка», savings systems, repositories, tasks, screenshots/copy, and diagrams with the retail/corporate accreditive example while retaining the existing trusted-autonomy material.

- [ ] **Step 4: Support direct chapter links**

Keep hash navigation stable and add `window.KonturInfoPages.open(...)` keys for the new chapters. Update the iframe route so links from the knowledge route can open the requested chapter.

- [ ] **Step 5: Verify documentation source**

Run HTML/source scans for every required chapter, external-link safety attributes, stale demo terms, and duplicate IDs.

### Task 6: Regression verification and generated artifacts

**Files:**
- Modify as required by failures: `tests/*.mjs`, `tests/render.cjs`
- Generated: `dist/**`

- [ ] **Step 1: Run targeted verification**

Run: `node --test tests/domain.test.mjs`  
Run with local-port permission: `node --test tests/api.test.mjs`  
Run: `node tests/render.cjs`  
Expected: all pass.

- [ ] **Step 2: Run typecheck and production build**

Run: `npm run typecheck`  
Run: `npm run build`  
Expected: both exit 0; build refreshes `dist` from `public`.

- [ ] **Step 3: Run the full suite**

Run with local-port permission: `npm test`  
Expected: all tests pass with zero failures.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check`, `git status --short`, and inspect the complete diff/stat. Confirm no source data from `/Users/nick/Downloads` was copied as executable instructions and no unrelated files changed.

- [ ] **Step 5: Commit the implementation**

Stage only the implementation, tests, documentation, plan, and generated build artifacts. Commit with a message describing the connected Context Supply Chain and accreditive demo.
