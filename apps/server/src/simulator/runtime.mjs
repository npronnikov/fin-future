import { BASE_GRAPH, TEAM_DEFAULT, PROFILES, USERS } from '../../../../packages/contracts/catalog.mjs';
import { visible, integer, add, touch, emit, get, list, digest, now, fail, terminal, id } from '../domain/core.mjs';
import { assertGraph, conditionValue, semanticGraph } from '../domain/graph.mjs';
import { reserve, settle, balance, rootRun, cost, RATE_CARD } from '../services/economics.mjs';
import { message, postEvent, notify, projectChat } from '../projections/chat.mjs';
import { behaviorFor, verifyBehavior } from '../adapters/mock/oracle.mjs';
export function queue(s, kind, targetId, spaceId, props = {}) { const job = add(s, 'jobs', { spaceId, kind, targetId, index: 0, status: 'Pending', steps: [], ...props }); s.jobs.push(job.id); return job; }
export function schedule(s, run) { if (terminal(run) || ['Paused', 'InDoubt', 'HumanOwned', 'Blocked'].includes(run.status))
    return; if (!list(s, 'jobs').some(j => j.targetId === run.id && j.kind === 'run' && j.status === 'Pending'))
    queue(s, 'run', run.id, run.spaceId); }
export function activeSnapshot(s, run) { return get(s, 'snapshots', run.snapshotId); }
export function dependencyCheck(s, snapshot) { for (const locked of snapshot.lock) {
    const live = s.entities.componentVersions[locked.id] || s.entities.knowledgeVersions[locked.id];
    if (!live || live.status === 'Revoked')
        return { code: 'MissingDependency', message: 'Отсутствует или отозвана dependency ' + locked.id };
} return null; }
export function createSnapshot(s, def, user) { const installation = get(s, 'installations', def.installationId, def.spaceId); const profile = PROFILES.find(p => p.id === installation.profile); const versions = [...list(s, 'componentVersions'), ...list(s, 'knowledgeVersions')]; assertGraph(def.graph, { profile, versions }); const refs = [...new Set([...(def.dependencies || []), ...(def.graph.dependencies || []), ...def.graph.nodes.flatMap(n => [...(n.skillRefs || []), ...(n.ruleRefs || [])])])]; const lock = refs.map(ref => { const v = versions.find(v => v.id === ref && v.spaceId === def.spaceId); if (!v || !visible(s, USERS.find(u => u.id === user), v))
    fail('MissingDependency', 'Версия зависимости недоступна'); if (v.status === 'Revoked')
    fail('MissingDependency', 'Версия отозвана'); return { id: v.id, type: v.type, contentDigest: v.contentDigest || digest(v.content), name: v.name || v.title, content: v.content, rule: v.rule, testOnly: v.status !== 'Published' }; }); const semantics = { graph: semanticGraph(def.graph), kind: def.kind, team: def.kind === 'team' ? def.team : null, actorId: def.actorId || null, taskClass: def.taskClass, lock, installationRevisionId: installation.currentVersionId, modelProfile: def.modelProfile || 'internal/mock-v1' }; return add(s, 'snapshots', { spaceId: def.spaceId, projectId: def.projectId, definitionId: def.id, definitionRevision: def.revision, kind: def.kind, graph: structuredClone(def.graph), team: structuredClone(def.team || TEAM_DEFAULT), taskClass: def.taskClass, lock, installationId: installation.id, installationRevisionId: installation.currentVersionId, configurationDigest: digest(semantics), contentDigest: digest(semantics), modelProfile: semantics.modelProfile, testOnly: lock.some(l => l.testOnly) }, user); }
export function startRun(s, user, p, spaceId, mode = 'trial') {
    const environment = get(s, 'environments', p.environmentId, spaceId);
    if (environment.status !== 'Ready')
        fail('EnvironmentNotReady', 'Среда не прошла подготовку', 409);
    if (mode === 'trial' && environment.kind !== 'Sandbox')
        fail('EnvironmentNotReady', 'Trial разрешён только в Sandbox', 409);
    let snapshot;
    if (mode === 'released') {
        const dep = get(s, 'deployments', p.deploymentId, spaceId);
        if (dep.status !== 'Active' || dep.environmentId !== environment.id)
            fail('Forbidden', 'Нет активного размещения в выбранной среде', 403);
        const release = get(s, 'releases', dep.releaseId, spaceId);
        if (release.status !== 'Admitted' || release.expiresAt < now(s))
            fail('Forbidden', 'Допуск недействителен', 403);
        snapshot = get(s, 'snapshots', release.snapshotId, spaceId);
        if (p.snapshotId && p.snapshotId !== snapshot.id)
            fail('StaleReview', 'Нельзя подменять snapshot размещения', 409);
    }
    else if (p.snapshotId)
        snapshot = get(s, 'snapshots', p.snapshotId, spaceId);
    else
        snapshot = createSnapshot(s, get(s, 'definitions', p.definitionId, spaceId), user.id);
    const installation = get(s, 'installations', snapshot.installationId, spaceId);
    if (installation.status !== 'Ready')
        fail('MissingDependency', 'Установка не Ready', 409);
    const depError = dependencyCheck(s, snapshot);
    if (depError)
        fail(depError.code, depError.message, 409);
    const project = get(s, 'projects', p.projectId || snapshot.projectId, spaceId);
    if (snapshot.projectId !== project.id)
        fail('ScopeViolation', 'Конфигурация принадлежит другому проекту', 403);
    const bindings = list(s, 'bindings').filter(b => b.projectId === project.id && b.status === 'Ready');
    if (!['repo', 'ci', 'model'].every(kind => bindings.some(b => b.kind === kind)))
        fail('MissingDependency', 'Нужны проверенные repo, CI и model bindings', 409);
    const taskClass = p.taskClass || snapshot.taskClass || 'ui';
    if (mode === 'released' && taskClass !== snapshot.taskClass)
        fail('ScopeViolation', 'Допуск этой сборки ограничен классом ' + snapshot.taskClass + '; другой класс требует отдельной конфигурации и UAT', 403);
    if (!['ui', 'docs'].includes(taskClass) || (snapshot.kind !== 'team' && snapshot.taskClass !== taskClass))
        fail('ScopeViolation', 'Класс задачи не разрешён этой конфигурацией', 403);
    const originalTask = p.taskId ? get(s, 'tasks', p.taskId, spaceId) : null;
    if (originalTask && originalTask.taskClass !== taskClass)
        fail('ScopeViolation', 'Класс исходной задачи не совпадает с конфигурацией', 403);
    const description = originalTask?.description || p.description || 'Изменить информационный экран статусов заявок';
    if (p.fixture === 'scope' || /\bauth\b|payment|плат[её]ж|кредитн.*ставк|клиентск.*данн/i.test(description + ' ' + (originalTask?.title || p.title || '')) || (/(^|\/)auth(\/|$)/.test(p.path || '')))
        fail('ScopeViolation', 'Защищённая область вне разрешённого TaskClass', 403);
    const reviewer = p.reviewerId || project.engineerId;
    const space = get(s, 'spaces', spaceId);
    if (!space.memberIds.includes(reviewer) || USERS.find(u => u.id === reviewer)?.role !== 'engineer')
        fail('MissingDependency', 'Назначьте продукт-инженера', 409);
    let task = p.taskId ? get(s, 'tasks', p.taskId, spaceId) : add(s, 'tasks', { spaceId, projectId: project.id, title: p.title || description, description, taskClass, status: 'Ready', ownerId: project.ownerId, assigneeId: reviewer, acceptance: 'Различать data, empty и unavailable; пройти инженерное ревью' }, user.id);
    if (task.projectId !== project.id)
        fail('ScopeViolation', 'Задача относится к другому проекту', 403);
    if (list(s, 'runs').some(r => r.taskId === task.id && !r.parentRunId && !terminal(r)))
        fail('RevisionConflict', 'У задачи уже есть активный Run', 409);
    const run = add(s, 'runs', { spaceId, projectId: project.id, taskId: task.id, snapshotId: snapshot.id, configurationDigest: snapshot.configurationDigest, installationRevisionId: snapshot.installationRevisionId, environmentId: environment.id, installationId: snapshot.installationId, mode, fixture: p.fixture || 'clean', seed: p.seed || s.seed, taskClass, status: 'Running', nodeId: snapshot.graph.nodes.find(n => n.type === 'Start').id, tokens: [], edgeVisits: {}, joins: {}, steps: 0, attempt: 1, reworks: 0, takeovers: 0, inputCount: 0, approvalCount: 0, humanTimeMs: 0, controlEpoch: 1, reviewerId: reviewer, initiatorId: user.id, budget: integer(p.budget ?? (p.fixture === 'budget' ? 100 : 50000), 'budget', 0, 500000), channelId: project.channelId, synthetic: true, startedAt: now(s) }, user.id);
    run.rootRunId = run.id;
    run.tokens = [{ id: id('token'), nodeId: run.nodeId }];
    const thread = add(s, 'threads', { spaceId, projectId: project.id, channelId: project.channelId, rootRunId: run.id, taskId: task.id, title: task.title }, user.id);
    run.threadId = thread.id;
    const root = message(s, { spaceId, projectId: project.id, channelId: project.channelId, threadId: thread.id, runId: run.id, taskId: task.id, kind: 'run', text: task.title, snapshotId: snapshot.id, environmentId: environment.id }, user.id);
    run.rootMessageId = root.id;
    thread.rootMessageId = root.id;
    const workspace = add(s, 'workspaces', { spaceId, projectId: project.id, runId: run.id, path: 'workspace/' + run.id, owner: 'agent', epoch: 1, leaseId: id('lease'), checkpoint: null });
    run.workspaceId = workspace.id;
    add(s, 'attempts', { spaceId, projectId: project.id, runId: run.id, number: 1, status: 'Running', inputRef: task.id, configurationDigest: run.configurationDigest });
    touch(s, task, { status: 'InProgress', activeRunId: run.id });
    postEvent(s, run, 'run.started', 'Пробная работа начата. Все внешние эффекты — эмуляция.');
    schedule(s, run);
    return run;
}
export function artifact(s, run, node, name, content, extra = {}) { return add(s, 'artifacts', { spaceId: run.spaceId, projectId: run.projectId, runId: run.id, nodeId: node.id, attempt: run.attempt, configurationDigest: run.configurationDigest, name, content, contentDigest: digest(content), synthetic: true, ...extra }); }
export function makeGate(s, run, node, token, kind) {
    const artifacts = list(s, 'artifacts').filter(a => a.runId === run.id && a.attempt === run.attempt);
    const checks = list(s, 'checks').filter(c => c.runId === run.id && c.attempt === run.attempt);
    const g = add(s, 'gates', { spaceId: run.spaceId, projectId: run.projectId, runId: run.id, taskId: run.taskId, threadId: run.threadId, kind, nodeId: node.id, tokenId: token.id, attempt: run.attempt, status: 'Pending', role: node.reviewerRole || 'engineer', assigneeId: node.reviewerRole === 'po' ? get(s, 'projects', run.projectId).ownerId : run.fixture === 'missing-reviewer' ? null : run.reviewerId, title: kind === 'input' ? 'Как различать состояния ответа API?' : 'Проверьте изменение и контракт', artifactIds: artifacts.map(a => a.id), checkIds: checks.map(c => c.id), artifactBundleDigest: digest({ artifacts: artifacts.map(a => a.contentDigest), checks: checks.map(c => c.contentDigest), configurationDigest: run.configurationDigest, attempt: run.attempt }), schema: kind === 'input' ? { type: 'object', required: ['behavior', 'explanation'], properties: { behavior: { type: 'enum', values: ['separate', 'empty-on-error'] }, explanation: { type: 'string', minLength: 8 } } } : null });
    const ht = add(s, 'humanTasks', { spaceId: run.spaceId, projectId: run.projectId, runId: run.id, taskId: run.taskId, gateId: g.id, kind, status: 'Pending', role: g.role, assigneeId: g.assigneeId, title: g.title });
    g.humanTaskId = ht.id;
    if (kind === 'input') {
        const ir = add(s, 'inputs', { spaceId: run.spaceId, projectId: run.projectId, runId: run.id, gateId: g.id, question: g.title, schema: g.schema, status: 'Pending' });
        g.inputRequestId = ir.id;
        run.inputCount++;
    }
    else
        run.approvalCount++;
    token.waiting = g.id;
    postEvent(s, run, kind === 'input' ? 'input.requested' : 'gate.requested', g.title, { gateId: g.id });
    notify(s, { spaceId: run.spaceId, projectId: run.projectId, privateTo: g.assigneeId, gateId: g.id, runId: run.id, title: g.title });
    return g;
}
export function routeToken(s, run, token, outcome = 'success') {
    const graph = activeSnapshot(s, run).graph;
    const edge = graph.edges.find(e => e.from === token.nodeId && e.on === outcome) || (['success', 'failure'].includes(outcome) ? graph.edges.find(e => e.from === token.nodeId && e.on === 'success') : null);
    if (!edge) {
        stopRun(s, run, 'Failed', 'MissingTransition: ' + token.nodeId + ' / ' + outcome);
        return;
    }
    const key = edge.from + ':' + edge.to + ':' + edge.on;
    run.edgeVisits[key] = (run.edgeVisits[key] || 0) + 1;
    if (edge.maxVisits && run.edgeVisits[key] > edge.maxVisits) {
        stopRun(s, run, 'Failed', 'LoopLimit: исчерпан maxVisits');
        return;
    }
    token.predecessor = token.nodeId;
    token.nodeId = edge.to;
    delete token.waiting;
    run.nodeId = token.nodeId;
    touch(s, run);
    recompute(s, run);
}
export function recompute(s, run) { if (terminal(run) || ['Paused', 'InDoubt', 'HumanOwned', 'TakeoverRequested', 'Blocked'].includes(run.status))
    return; const ready = run.tokens.some(t => !t.waiting); run.status = ready ? 'Running' : run.tokens.some(t => s.entities.gates[t.waiting]?.kind === 'input') ? 'WaitingInput' : 'WaitingApproval'; const task = get(s, 'tasks', run.taskId); touch(s, task, { status: run.status === 'WaitingInput' ? 'NeedsInput' : run.status === 'WaitingApproval' ? 'InReview' : 'InProgress' }); if (ready)
    schedule(s, run); }
export function stopRun(s, run, status, reason) { touch(s, run, { status, reason, endedAt: now(s) }); for (const job of list(s, 'jobs').filter(j => j.targetId === run.id && j.status === 'Pending'))
    touch(s, job, { status: 'Cancelled' }); for (const gate of list(s, 'gates').filter(g => g.runId === run.id && g.status === 'Pending')) {
    touch(s, gate, { status: 'Cancelled' });
    touch(s, get(s, 'humanTasks', gate.humanTaskId), { status: 'Cancelled' });
} for (const child of list(s, 'runs').filter(r => r.parentRunId === run.id && !terminal(r)))
    stopRun(s, child, 'Cancelled', 'Родитель остановлен'); for (const r of list(s, 'reservations').filter(r => r.runId === run.id && r.status === 'Reserved'))
    touch(s, r, { status: 'Released' }); for (const at of list(s, 'attempts').filter(a => a.runId === run.id && a.number === run.attempt))
    touch(s, at, { status }); touch(s, get(s, 'tasks', run.taskId), { status: status === 'Accepted' ? 'Done' : status === 'Cancelled' ? 'Cancelled' : 'Ready' }); if (run.workspaceId)
    touch(s, get(s, 'workspaces', run.workspaceId), { owner: null, leaseId: null }); postEvent(s, run, 'run.' + status.toLowerCase(), status === 'Accepted' ? 'Работа принята. Версия и решения сохранены.' : 'Работа остановлена: ' + reason); }
function spawnTeam(s, run, node, token, snapshot) {
    const team = snapshot.team;
    const plan = team.routing[run.taskClass];
    if (!Array.isArray(plan) || !plan.length || plan.length > team.limits.maxDelegations) {
        touch(s, run, { status: 'Blocked', reason: 'RoutingRequired' });
        return;
    }
    run.workPlan = { taskClass: run.taskClass, roles: plan, coordinator: team.coordinator, concurrency: team.limits.concurrency, aggregationPolicy: team.aggregationPolicy };
    run.delegationToken = token.id;
    run.delegationNodeId = node.id;
    for (let i = 0; i < plan.length; i++) {
        const assignedRole = plan[i];
        const task = add(s, 'tasks', { spaceId: run.spaceId, projectId: run.projectId, parentTaskId: run.taskId, title: assignedRole + ' · ' + get(s, 'tasks', run.taskId).title, taskClass: run.taskClass, status: i ? 'Backlog' : 'Ready', ownerId: run.initiatorId, dependencies: [] });
        const child = add(s, 'runs', { spaceId: run.spaceId, projectId: run.projectId, taskId: task.id, parentRunId: run.id, rootRunId: run.rootRunId, snapshotId: run.snapshotId, configurationDigest: run.configurationDigest, installationRevisionId: run.installationRevisionId, environmentId: run.environmentId, installationId: run.installationId, mode: 'delegated', assignedRole, threadId: run.threadId, channelId: run.channelId, status: 'Queued', attempt: run.attempt, synthetic: true, controlEpoch: 1 });
        const work = add(s, 'delegations', { spaceId: run.spaceId, projectId: run.projectId, runId: child.id, parentRunId: run.id, parentTaskId: run.taskId, taskId: task.id, delegatedBy: team.coordinator, role: assignedRole, status: 'Queued', dependsOn: i ? run.childRunIds?.[0] : null, allowedActions: ['read', 'propose'], expectedOutput: i ? 'review-contract' : 'implementation', deadline: now(s) + 300000 });
        child.workItemId = work.id;
        (run.childRunIds ||= []).push(child.id);
    }
    token.delegating = true;
    postEvent(s, run, 'team.planned', 'План команды: ' + plan.join(' → '));
}
function stepTeam(s, run, node, token) {
    const children = (run.childRunIds || []).map(id => get(s, 'runs', id)).filter(c => c.attempt === run.attempt);
    const running = children.filter(c => c.status === 'Running');
    for (const child of running) {
        const reservation = reserve(s, run, RATE_CARD.delegation, node.id);
        if (!reservation)
            return false;
        settle(s, reservation, child.id + ':complete');
        touch(s, child, { status: 'Accepted', endedAt: now(s) });
        touch(s, get(s, 'tasks', child.taskId), { status: 'Done' });
        touch(s, get(s, 'delegations', child.workItemId), { status: 'Accepted', artifactId: artifact(s, run, node, child.assignedRole + '.md', 'Синтетическое поручение завершено: ' + child.assignedRole, { childRunId: child.id }).id });
        emit(s, 'delegation.completed', child);
    }
    let slots = run.workPlan.concurrency;
    for (const child of children.filter(c => c.status === 'Queued')) {
        if (slots <= 0)
            break;
        const work = get(s, 'delegations', child.workItemId);
        if (work.dependsOn && get(s, 'runs', work.dependsOn).status !== 'Accepted')
            continue;
        touch(s, child, { status: 'Running', startedAt: now(s) });
        touch(s, work, { status: 'Running' });
        touch(s, get(s, 'tasks', child.taskId), { status: 'InProgress' });
        slots--;
    }
    if (children.every(c => c.status === 'Accepted')) {
        token.delegating = false;
        return true;
    }
    return false;
}
export function stepRun(s, run) {
    if (run.parentRunId || !['Running', 'Reworking'].includes(run.status))
        return;
    const snapshot = activeSnapshot(s, run);
    const revoked = dependencyCheck(s, snapshot);
    if (revoked) {
        touch(s, run, { status: 'Blocked', reason: revoked.code, recoveryActions: ['cancel'] });
        postEvent(s, run, 'run.blocked', revoked.message);
        return;
    }
    if (++run.steps > 200) {
        stopRun(s, run, 'Failed', 'StepLimit: 200 переходов');
        return;
    }
    const token = run.tokens.find(t => !t.waiting);
    if (!token) {
        recompute(s, run);
        return;
    }
    const node = snapshot.graph.nodes.find(n => n.id === token.nodeId);
    if (!node) {
        stopRun(s, run, 'Failed', 'MissingNode');
        return;
    }
    run.nodeId = node.id;
    let execution = list(s, 'executions').find(e => e.runId === run.id && e.tokenId === token.id && e.nodeId === node.id && e.attempt === run.attempt && e.status === 'Running');
    if (!execution) {
        execution = add(s, 'executions', { spaceId: run.spaceId, projectId: run.projectId, runId: run.id, tokenId: token.id, nodeId: node.id, nodeType: node.type, attempt: run.attempt, status: 'Running', startedAt: now(s), epoch: run.controlEpoch });
        const sources = snapshot.lock.map(l => ({ versionId: l.id, contentDigest: l.contentDigest, reason: 'Явно закреплено в configuration snapshot' }));
        add(s, 'contexts', { spaceId: run.spaceId, projectId: run.projectId, runId: run.id, nodeId: node.id, executionId: execution.id, configurationDigest: run.configurationDigest, sources, input: structuredClone(run.input || {}), reworkInput: run.reworkInput || null, tokenLimit: 8192, contentDigest: digest({ sources, input: run.input || {}, reworkInput: run.reworkInput || null }) });
    }
    const finish = (outcome = 'success') => { touch(s, execution, { status: 'Completed', completedAt: now(s) }); emit(s, 'node.completed', run, 'system', { nodeId: node.id, executionId: execution.id, outcome }); routeToken(s, run, token, outcome); };
    switch (node.type) {
        case 'Start':
            artifact(s, run, node, 'specification.md', '# ' + get(s, 'tasks', run.taskId).title + '\n\nКласс: ' + run.taskClass + '\nСинтетические данные. Auth и платежи запрещены.');
            finish();
            break;
        case 'Input':
            makeGate(s, run, node, token, 'input');
            touch(s, execution, { status: 'Waiting' });
            recompute(s, run);
            break;
        case 'Approval':
            makeGate(s, run, node, token, 'approval');
            touch(s, execution, { status: 'Waiting' });
            recompute(s, run);
            break;
        case 'AI':
        case 'Delegation': {
            if ((snapshot.kind === 'team' || node.type === 'Delegation') && !token.teamDone) {
                if (!token.delegating) {
                    spawnTeam(s, run, node, token, snapshot);
                    schedule(s, run);
                    return;
                }
                if (!stepTeam(s, run, node, token)) {
                    schedule(s, run);
                    return;
                }
                token.teamDone = true;
            }
            const reservation = reserve(s, run, RATE_CARD.modelStep, node.id);
            if (!reservation)
                return;
            run.behavior = behaviorFor(run, snapshot);
            settle(s, reservation, execution.id + ':usage');
            const diff = run.taskClass === 'docs' ? 'diff --git a/docs/status.md b/docs/status.md\n+ # Состояния заявок\n+ Источник: синтетический API contract@1\n+ При 503 источник недоступен.' : `diff --git a/src/status.ts b/src/status.ts\n--- a/src/status.ts\n+++ b/src/status.ts\n@@ -1,4 +1,6 @@\n- if (!response.ok) return "empty";\n+ if (response.status === 503) return "${run.behavior[503]}";\n+ if (response.status === 204) return "empty";\n+ return "data";`;
            artifact(s, run, node, 'implementation.diff', diff, { behavior: structuredClone(run.behavior) });
            artifact(s, run, node, 'preview.json', JSON.stringify({ states: run.behavior, synthetic: true }, null, 2));
            postEvent(s, run, 'artifact.created', 'AI подготовил изменение. Ожидается независимая проверка.');
            delete token.teamDone;
            finish();
            break;
        }
        case 'Command': {
            const reservation = reserve(s, run, RATE_CARD.command, node.id);
            if (!reservation)
                return;
            if (run.fixture === 'ci-transient' && !run.transientRetried) {
                run.transientRetried = true;
                settle(s, reservation, execution.id + ':transient');
                emit(s, 'command.retry', run, 'system', { nodeId: node.id, attempt: 1, maxRetries: 1 });
                schedule(s, run);
                return;
            }
            if (node.command === 'mock-pr' || (run.fixture === 'unknown-effect' && !run.effectReconciled)) {
                const existing = list(s, 'actions').find(a => a.runId === run.id && a.nodeId === node.id);
                if (!existing) {
                    add(s, 'actions', { spaceId: run.spaceId, projectId: run.projectId, runId: run.id, nodeId: node.id, actionId: execution.id, payloadDigest: digest(run.behavior || {}), target: 'mock-pr', status: run.fixture === 'unknown-effect' ? 'InDoubt' : 'Succeeded', effectId: id('mock_pr'), effectObserved: true });
                }
                if (run.fixture === 'unknown-effect' && !run.effectReconciled) {
                    settle(s, reservation, execution.id + ':effect');
                    touch(s, run, { status: 'InDoubt', reason: 'Timeout after mock PR', recoveryActions: ['reconcile'] });
                    postEvent(s, run, 'action.indoubt', 'Результат действия неизвестен. Повтор и Takeover заблокированы до сверки.');
                    return;
                }
            }
            const result = verifyBehavior(run.behavior, run.taskClass);
            run.checkPassed = result.passed;
            const c = add(s, 'checks', { spaceId: run.spaceId, projectId: run.projectId, runId: run.id, nodeId: node.id, attempt: run.attempt, ...result, contentDigest: digest(result), synthetic: true });
            artifact(s, run, node, 'test-report.json', JSON.stringify(result, null, 2));
            settle(s, reservation, execution.id + ':usage');
            finish(result.passed ? 'success' : 'failure');
            break;
        }
        case 'Condition':
            finish(conditionValue(node, run) ? 'true' : 'false');
            break;
        case 'Parallel': {
            const edges = snapshot.graph.edges.filter(e => e.from === node.id);
            run.tokens = run.tokens.filter(t => t.id !== token.id);
            for (const edge of edges)
                run.tokens.push({ id: id('token'), nodeId: edge.to, predecessor: node.id });
            touch(s, execution, { status: 'Completed' });
            recompute(s, run);
            break;
        }
        case 'Join': {
            const join = run.joins[node.id] ||= { arrived: [], round: 0 };
            if (!join.arrived.includes(token.predecessor))
                join.arrived.push(token.predecessor);
            const required = node.required || snapshot.graph.edges.filter(e => e.to === node.id).length;
            if (join.arrived.length < required) {
                run.tokens = run.tokens.filter(t => t.id !== token.id);
                touch(s, execution, { status: 'WaitingJoin' });
                if (!run.tokens.length)
                    stopRun(s, run, 'Failed', 'JoinWithoutRequiredResults');
            }
            else {
                join.arrived = [];
                join.round++;
                finish();
            }
            break;
        }
        case 'Terminal': {
            run.tokens = run.tokens.filter(t => t.id !== token.id);
            touch(s, execution, { status: 'Completed' });
            if (run.tokens.length) {
                recompute(s, run);
                return;
            }
            const open = list(s, 'gates').some(g => g.runId === run.id && g.status === 'Pending');
            const approved = list(s, 'decisions').some(d => d.runId === run.id && d.attempt === run.attempt && d.decision === 'approve');
            if ((node.outcome || 'Accepted') === 'Accepted' && (open || !approved || !run.checkPassed)) {
                stopRun(s, run, 'Failed', 'AcceptancePolicy: нужны checks и инженерное решение');
                return;
            }
            stopRun(s, run, node.outcome || 'Accepted', 'Terminal');
            break;
        }
        default: stopRun(s, run, 'Failed', 'Unsupported node');
    }
    if (run.status === 'Running')
        schedule(s, run);
}
function stepProvision(s, job) {
    const plan = get(s, 'plans', job.targetId);
    const stages = ['Validating', 'Provisioning', 'Attesting', 'Ready'];
    const stage = stages[job.index];
    const env = get(s, 'environments', job.environmentId);
    if (stage === 'Provisioning') {
        for (const item of plan.items) {
            if (!list(s, 'resources').some(r => r.planId === plan.id && r.kind === item)) {
                const r = add(s, 'resources', { spaceId: job.spaceId, planId: plan.id, environmentId: env.id, kind: item, name: item + ' · ' + env.name, status: 'Provisioned', endpointAlias: item + '.' + env.id + '.mock', network: plan.network, templateVersion: plan.templateVersion, leaseExpiresAt: now(s) + 7 * 86400000, synthetic: true });
                cost(s, { spaceId: job.spaceId, amount: Math.ceil(plan.cost / plan.items.length), category: 'infrastructure', resourceId: r.id }, r.id + ':provision');
            }
        }
    }
    if (stage === 'Attesting' && plan.network !== 'isolated') {
        touch(s, job, { status: 'Failed', reason: 'NetworkAttestationFailed', recoveryActions: ['edit-plan', 'retry'] });
        touch(s, env, { status: 'Failed', reason: 'Сеть не соответствует isolated profile' });
        emit(s, 'resource.attestation_failed', env);
        return;
    }
    job.steps.push({ stage, at: now(s), status: 'Passed' });
    touch(s, env, { status: stage });
    touch(s, job, { index: job.index + 1 });
    emit(s, 'provision.progress', job, 'system', { stage });
    if (stage === 'Ready') {
        for (const r of list(s, 'resources').filter(r => r.environmentId === env.id)) {
            touch(s, r, { status: 'Ready', attestation: { network: true, identity: true, health: true, at: now(s) } });
            emit(s, 'resource.ready', r);
        }
        touch(s, job, { status: 'Completed' });
        touch(s, get(s, 'setups', plan.setupId), { stage: 3 });
        touch(s, get(s, 'spaces', job.spaceId), { status: 'Требуется основа' });
    }
}
function stepInstallation(s, job) { const installation = get(s, 'installations', job.targetId); const stages = ['compatibility', 'configuration', 'connection-checks', 'mock-service', 'Ready']; const stage = stages[job.index]; if (stage === 'connection-checks' && installation.fixture === 'connection-failure') {
    touch(s, job, { status: 'Failed', reason: 'ConnectionFailure', recoveryActions: ['retry'] });
    touch(s, installation, { status: 'Failed', health: 'Connection failure' });
    return;
} job.steps.push({ stage, status: 'Passed', at: now(s) }); touch(s, job, { index: job.index + 1 }); emit(s, 'installation.progress', installation, 'system', { stage }); if (stage === 'Ready') {
    touch(s, installation, { status: 'Ready', health: 'Healthy' });
    touch(s, job, { status: 'Completed' });
    touch(s, get(s, 'spaces', job.spaceId), { status: 'Готово к проекту' });
    emit(s, 'installation.ready', installation);
} }
export function tick(s, { spaceId, runId, automatic = false } = {}) {
    const jobs = s.jobs.map(id => s.entities.jobs[id]).filter(j => j?.status === 'Pending' && (!spaceId || j.spaceId === spaceId) && (!runId || j.targetId === runId) && (!automatic || s.simulator.spaces?.[j.spaceId]?.auto !== false));
    for (const job of jobs) {
        if (job.kind === 'provision')
            stepProvision(s, job);
        else if (job.kind === 'installation')
            stepInstallation(s, job);
        else if (job.kind === 'run') {
            touch(s, job, { status: 'Completed' });
            const run = get(s, 'runs', job.targetId);
            stepRun(s, run);
        }
        else if (job.kind === 'takeover') {
            const run = get(s, 'runs', job.targetId);
            if (list(s, 'actions').some(a => a.runId === run.id && a.status === 'InDoubt')) {
                touch(s, job, { status: 'Failed', reason: 'ActionInDoubt' });
                continue;
            }
            const ws = get(s, 'workspaces', run.workspaceId);
            const checkpoint = digest({ runId: run.id, attempt: run.attempt, epoch: run.controlEpoch, artifacts: list(s, 'artifacts').filter(a => a.runId === run.id).map(a => a.contentDigest) });
            touch(s, ws, { owner: 'human', humanId: run.takeoverUserId, checkpoint, epoch: run.controlEpoch, leaseId: id('human_lease') });
            touch(s, run, { status: 'HumanOwned', takeovers: run.takeovers + 1 });
            touch(s, job, { status: 'Completed' });
            postEvent(s, run, 'takeover.ready', 'Drain завершён, checkpoint сохранён. Выдан human writer lease.');
        }
    }
    s.jobs = s.jobs.filter(id => s.entities.jobs[id]?.status === 'Pending');
    projectChat(s, spaceId);
}
