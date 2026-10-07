# Localize Run Terminology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Flow notice from the mock-task dialog and replace user-facing `Run`/`Runs` terminology with natural Russian launch terminology.

**Architecture:** Keep domain types, route values, action names, collection properties, and identifiers unchanged. Protect the UI boundary with a TypeScript-AST regression scan over user-facing string literals and JSX text, then update component copy, runtime-generated messages, and README prose until the scan and existing behavior tests pass.

**Tech Stack:** React 19, TypeScript 5.9, Node.js test runner, server-side React rendering.

---

### Task 1: Add failing copy regression checks

**Files:**
- Modify: `tests/render.cjs`
- Test: `tests/render.cjs`

- [ ] **Step 1: Add a source-level check for the removed dialog notice**

Append a check that reads `components/kontur/tasks.tsx` and rejects both pieces of the removed notice:

```js
const tasksSource = fs.readFileSync(path.join(root, 'components/kontur/tasks.tsx'), 'utf8');
for (const removed of [
  'Следующий шаг — Flow',
  'У задач будут теги. Вы сможете выбрать Flow в каталоге и настроить его узлы, Skills и Subagents.',
]) {
  if (tasksSource.includes(removed)) throw new Error(`Mock-task dialog still contains removed copy: ${removed}`);
}
```

- [ ] **Step 2: Add an AST-based check for user-facing `Run` and `Runs`**

Scan string literals, template-literal text, and JSX text in the UI/runtime copy files while ignoring identifiers such as the `Run` type and uppercase IDs such as `RUN-912`:

```js
const terminologyFiles = [
  'components/kontur/app.tsx',
  'components/kontur/assistant-bubble.tsx',
  'components/kontur/benchmark.tsx',
  'components/kontur/capabilities.tsx',
  'components/kontur/catalog.tsx',
  'components/kontur/configuration.tsx',
  'components/kontur/environment.tsx',
  'components/kontur/flow-editor.tsx',
  'components/kontur/flow-launch.tsx',
  'components/kontur/home.tsx',
  'components/kontur/knowledge.tsx',
  'components/kontur/notifications.tsx',
  'components/kontur/onboarding.tsx',
  'components/kontur/regulation.tsx',
  'components/kontur/runs.tsx',
  'components/kontur/sandbox-preview.tsx',
  'components/kontur/tasks.tsx',
  'lib/assistant.ts',
  'lib/domain.ts',
  'lib/engine.ts',
];
const englishLaunchCopy = [];
for (const relative of terminologyFiles) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const sourceFile = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true, relative.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = node => {
    if ((ts.isStringLiteralLike(node) || ts.isJsxText(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) && /\bRuns?\b/.test(node.text)) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
      englishLaunchCopy.push(`${relative}:${line}: ${node.text.trim()}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
readme.split('\n').forEach((line, index) => {
  if (/\bRuns?\b/.test(line)) englishLaunchCopy.push(`README.md:${index + 1}: ${line.trim()}`);
});
if (englishLaunchCopy.length) throw new Error(`User-facing Run terminology remains:\n${englishLaunchCopy.join('\n')}`);
```

- [ ] **Step 3: Run the regression test and verify RED**

Run:

```bash
node tests/render.cjs
```

Expected: FAIL with `Mock-task dialog still contains removed copy` before reaching, or followed by, the `User-facing Run terminology remains` inventory.

- [ ] **Step 4: Commit the failing tests**

```bash
git add tests/render.cjs
git commit -m "test: guard Russian launch terminology"
```

### Task 2: Remove the mock-task notice and localize UI copy

**Files:**
- Modify: `components/kontur/tasks.tsx`
- Modify: `components/kontur/app.tsx`
- Modify: `components/kontur/assistant-bubble.tsx`
- Modify: `components/kontur/benchmark.tsx`
- Modify: `components/kontur/capabilities.tsx`
- Modify: `components/kontur/catalog.tsx`
- Modify: `components/kontur/configuration.tsx`
- Modify: `components/kontur/environment.tsx`
- Modify: `components/kontur/flow-editor.tsx`
- Modify: `components/kontur/flow-launch.tsx`
- Modify: `components/kontur/home.tsx`
- Modify: `components/kontur/knowledge.tsx`
- Modify: `components/kontur/notifications.tsx`
- Modify: `components/kontur/onboarding.tsx`
- Modify: `components/kontur/regulation.tsx`
- Modify: `components/kontur/runs.tsx`
- Modify: `components/kontur/sandbox-preview.tsx`
- Modify: `lib/assistant.ts`
- Modify: `lib/domain.ts`
- Modify: `lib/engine.ts`
- Test: `tests/render.cjs`

- [ ] **Step 1: Remove the notice and now-unused import**

In `components/kontur/tasks.tsx`, remove `Notice` from the import list only if no other notice remains in the file, and delete this JSX from the mock-task form:

```tsx
<Notice tone="blue" title="Следующий шаг — Flow">У задач будут теги. Вы сможете выбрать Flow в каталоге и настроить его узлы, Skills и Subagents.</Notice>
```

If other `Notice` instances remain in `tasks.tsx`, retain the import.

- [ ] **Step 2: Translate singular and plural launch copy by context**

Apply natural Russian forms throughout the listed UI and runtime-copy files. Use this mapping as the required wording for recurring phrases:

```text
Run / Runs                         → запуск / запуски / запусков (by grammar)
Нет Runs в выбранном состоянии    → Нет запусков в выбранном состоянии
Run History                       → История запусков
Real Run History                  → История реальных запусков
Production Runs                   → Продуктовые запуски
Before Run                        → До запуска
After Run                         → После запуска
Run context                       → Контекст запуска
Run Events                        → События запуска
Supervised Run                    → Контролируемый запуск
Run не найден                     → Запуск не найден
Run started                       → Запуск начат
Run accepted                      → Запуск принят
Run cancelled                     → Запуск отменён
active Runs                       → активных запусков
Max parallel Runs                 → Максимум параллельных запусков
Parallel Runs                     → Параллельные запуски
Source Run                        → Исходный запуск
Run evidence                      → Подтверждения запуска
Workflow Run · trace              → Запуск процесса · трассировка
```

Preserve identifiers and program symbols exactly:

```ts
type Run = { /* unchanged */ };
state.runs;          // unchanged
runId;               // unchanged
go('run', run.id);   // unchanged
'RUN-912';           // unchanged
```

- [ ] **Step 3: Update existing assertions affected by localized messages**

Where behavior tests assert exact user-visible error or event text, update only the expected copy. Do not rename actions, payload fields, routes, statuses, or domain types.

- [ ] **Step 4: Run the copy regression test and verify GREEN**

Run:

```bash
node tests/render.cjs
```

Expected: PASS and a final line matching `Rendered ... fixtures without runtime errors.`

- [ ] **Step 5: Run TypeScript validation**

Run:

```bash
npm run typecheck
```

Expected: exit code 0 with no TypeScript diagnostics.

- [ ] **Step 6: Commit the implementation**

```bash
git add components/kontur lib tests/render.cjs
git commit -m "fix: localize launch terminology"
```

### Task 3: Localize documentation and run the complete verification suite

**Files:**
- Modify: `README.md`
- Test: `tests/render.cjs`
- Test: `tests/runtime.test.mjs`
- Test: `tests/domain.test.mjs`
- Test: `tests/api.test.mjs`
- Test: `tests/setup.test.mjs`
- Test: `tests/watch.test.mjs`

- [ ] **Step 1: Rewrite README launch terminology**

Replace prose uses of `Run` and `Runs` with grammatical Russian while preserving literal IDs and code symbols. Required examples:

```text
«перейти к связанному Run» → «перейти к связанному запуску»
«доступные ссылки на Runs» → «доступные ссылки на запуски»
«активный Run» → «активный запуск»
«Run History» → «история запусков»
«Before Run / ... и After Run / ...» → «До запуска / ... и После запуска / ...»
```

- [ ] **Step 2: Re-run the focused copy check**

Run:

```bash
node tests/render.cjs
```

Expected: PASS with no `User-facing Run terminology remains` error.

- [ ] **Step 3: Run the full test suite**

Run:

```bash
npm test
```

Expected: all Node tests pass and the render verification exits successfully.

- [ ] **Step 4: Run the production build**

Run:

```bash
npm run build
```

Expected: TypeScript exits successfully and Vite completes a production build.

- [ ] **Step 5: Inspect the final diff for unintended technical renames**

Run:

```bash
git diff --check
git diff --stat
rg -n '\bRuns?\b' components/kontur lib README.md
```

Expected: `git diff --check` is clean; the remaining `rg` results are technical identifiers/types or regex matching logic only, with no user-facing English launch copy.

- [ ] **Step 6: Commit documentation and any adjusted expectations**

```bash
git add README.md tests
git commit -m "docs: use Russian launch terminology"
```
