import { BASE_GRAPH, TEAM_DEFAULT, USERS, PROFILES } from '../../../../packages/contracts/catalog.mjs';
import { add, touch, get, list, role, revision, text, integer, need, fail, digest, emit, now, terminal, visible } from '../domain/core.mjs';
import { assertGraph, validateGraph } from '../domain/graph.mjs';
import { createSnapshot, startRun, routeToken, recompute, schedule, queue, stopRun, tick, artifact, dependencyCheck, activeSnapshot } from '../simulator/runtime.mjs';
import { balance, cost, rootRun } from './economics.mjs';
import { message, postEvent, notify } from '../projections/chat.mjs';
import { verifyBehavior } from '../adapters/mock/oracle.mjs';
function gateAccess(s, u, g) { role(u, [g.role]); if (!g.assigneeId)
    fail('MissingDependency', 'Сначала назначьте ответственного за гейт', 409); if (g.assigneeId !== u.id)
    fail('Forbidden', 'Гейт назначен другому участнику', 403); if (g.status !== 'Pending')
    fail('RevisionConflict', 'Гейт уже закрыт; откройте актуальный пакет', 409); }
export function challenge(s, u, gateId) { const g = get(s, 'gates', gateId); gateAccess(s, u, g); const run = get(s, 'runs', g.runId); if (terminal(run))
    fail('RevisionConflict', 'Run завершён', 409); return add(s, 'challenges', { spaceId: g.spaceId, projectId: g.projectId, userId: u.id, gateId: g.id, expectedRevision: g.revision, artifactBundleDigest: g.artifactBundleDigest, allowedActions: g.kind === 'input' ? ['answer'] : ['approve', 'rework', 'reject', 'clarify'], expiresAt: now(s, g.spaceId) + 10 * 60000 }, u.id); }
function validateChallenge(s, u, c, p, g, decision) { gateAccess(s, u, g); revision(g, c.expectedRevision); const ch = get(s, 'challenges', p.challengeId, c.spaceId); if (ch.userId !== u.id || ch.gateId !== g.id)
    fail('Forbidden', 'Challenge принадлежит другому пользователю или гейту', 403); if (ch.expiresAt <= now(s, g.spaceId))
    fail('StaleReview', 'Время просмотра истекло. Откройте пакет заново.', 409, {}, ['reopen']); if (ch.expectedRevision !== g.revision || ch.artifactBundleDigest !== g.artifactBundleDigest || p.targetDigest !== g.artifactBundleDigest)
    fail('StaleReview', 'Пакет изменился. Откройте актуальную версию.', 409, {}, ['reopen']); if (!ch.allowedActions.includes(decision))
    fail('Forbidden', 'Этот challenge не разрешает действие', 403); }
export const workHandlers = {
    'actor.create': (s, u, c, p) => { role(u, ['engineer', 'platform']); if (p.projectId)
        get(s, 'projects', p.projectId, c.spaceId); const template = ['developer', 'reviewer', 'writer'].includes(p.template) ? p.template : 'developer'; const a = add(s, 'actors', { spaceId: c.spaceId, projectId: p.projectId || null, name: text(p.name, 'name', 100), identityId: 'ai-' + c.actionId, ownerId: u.id, template, status: 'Configured', instruction: p.instruction || 'Работать в разрешённом классе задач', taskClasses: p.taskClasses || ['ui'], skills: [], subagents: [], grants: [], privateMemory: [], approvals: [], memoryScope: 'private:' + c.actionId, modelProfile: 'internal/mock-v1', synthetic: true, ai: true }, u.id); emit(s, 'actor.created', a, u.id); return a; },
    'actor.clone': (s, u, c, p) => { role(u, ['engineer', 'platform']); const original = get(s, 'actors', c.targetId, c.spaceId); const a = add(s, 'actors', { spaceId: c.spaceId, projectId: original.projectId, name: p.name || original.name + ' · копия', identityId: 'ai-' + c.actionId, ownerId: u.id, template: original.template, instruction: original.instruction, taskClasses: original.taskClasses, skills: [...original.skills], subagents: [], grants: [], privateMemory: [], approvals: [], memoryScope: 'private:' + c.actionId, modelProfile: original.modelProfile, status: 'Configured', originRef: original.id, synthetic: true, ai: true }, u.id); emit(s, 'actor.cloned', a, u.id); return a; },
    'definition.create': (s, u, c, p) => { role(u, ['engineer']); const project = get(s, 'projects', p.projectId, c.spaceId); const installation = get(s, 'installations', p.installationId || project.installationId, c.spaceId); if (p.kind && !['flow', 'team', 'actor'].includes(p.kind))
        fail('ValidationError', 'Неизвестный тип определения'); if (p.kind === 'actor' && p.actorId)
        get(s, 'actors', p.actorId, c.spaceId); const def = add(s, 'definitions', { spaceId: c.spaceId, projectId: project.id, installationId: installation.id, name: p.name || 'Статусы заявок · SDLC', kind: p.kind || 'flow', taskClass: p.taskClass || 'ui', graph: structuredClone(p.graph || BASE_GRAPH), team: structuredClone(p.team || TEAM_DEFAULT), actorId: p.actorId || null, dependencies: [], modelProfile: 'internal/mock-v1', status: 'Draft', draftRevision: 1 }, u.id); assertGraph(def.graph, { profile: PROFILES.find(x => x.id === installation.profile) }); emit(s, 'definition.created', def, u.id); return def; },
    'definition.save': (s, u, c, p) => {
        role(u, ['engineer']);
        const def = get(s, 'definitions', c.targetId, c.spaceId);
        revision(def, c.expectedRevision);
        if (p.graph) {
            if (!Array.isArray(p.graph.nodes) || !Array.isArray(p.graph.edges) || p.graph.schemaVersion !== 1)
                fail('ValidationError', 'Повреждённый graph');
        }
        if (p.dependencies) {
            if (!Array.isArray(p.dependencies))
                fail('ValidationError', 'dependencies должны быть массивом');
            for (const ref of p.dependencies) {
                const v = s.entities.componentVersions[ref] || s.entities.knowledgeVersions[ref];
                if (!v || v.spaceId !== c.spaceId || !visible(s, u, v))
                    fail('MissingDependency', 'Версия недоступна');
            }
        }
        if (p.team) {
            if (!Array.isArray(p.team.routing?.ui) || !Array.isArray(p.team.routing?.docs))
                fail('ValidationError', 'Команда должна задавать UI и Docs routing');
            integer(p.team.limits?.concurrency, 'concurrency', 1, 4);
            integer(p.team.limits?.maxDelegations, 'maxDelegations', 1, 12);
            for (const r of [...p.team.routing.ui, ...p.team.routing.docs])
                if (!p.team.roles?.[r])
                    fail('ValidationError', 'Нет специалиста для роли ' + r);
        }
        touch(s, def, { name: p.name ? text(p.name, 'name', 100) : def.name, graph: p.graph || def.graph, team: p.team || def.team, dependencies: p.dependencies || def.dependencies, taskClass: p.taskClass || def.taskClass, draftRevision: def.draftRevision + 1 });
        emit(s, 'definition.saved', def, u.id);
        return def;
    },
    'definition.validate': (s, u, c, p) => { const d = get(s, 'definitions', c.targetId, c.spaceId); return { findings: validateGraph(p.graph || d.graph, { profile: PROFILES.find(x => x.id === get(s, 'installations', d.installationId).profile), versions: [...list(s, 'componentVersions'), ...list(s, 'knowledgeVersions')].filter(v => visible(s, u, v)) }) }; },
    'definition.snapshot': (s, u, c, p) => { role(u, ['engineer']); const snap = createSnapshot(s, get(s, 'definitions', c.targetId, c.spaceId), u.id); emit(s, 'snapshot.created', snap, u.id); return snap; },
    'run.startTrial': (s, u, c, p) => { role(u, ['engineer', 'po']); return startRun(s, u, p, c.spaceId, 'trial'); },
    'run.startReleased': (s, u, c, p) => { role(u, ['engineer', 'po']); return startRun(s, u, p, c.spaceId, 'released'); },
    'gate.answer': (s, u, c, p) => { const g = get(s, 'gates', c.targetId, c.spaceId); validateChallenge(s, u, c, p, g, 'answer'); if (g.kind !== 'input')
        fail('ValidationError', 'Это не input gate'); const fields = {}; if (!['separate', 'empty-on-error'].includes(p.answer?.behavior))
        fields.behavior = 'Выберите допустимый вариант'; if (typeof p.answer?.explanation !== 'string' || p.answer.explanation.trim().length < 8)
        fields.explanation = 'Нужно объяснение не короче 8 символов'; if (Object.keys(fields).length)
        fail('ValidationError', 'Проверьте поля ответа', 400, fields); const run = get(s, 'runs', g.runId); const dependency = dependencyCheck(s, activeSnapshot(s, run)); if (dependency)
        fail(dependency.code, dependency.message, 409); const input = get(s, 'inputs', g.inputRequestId); touch(s, input, { status: 'Answered', answer: p.answer, answeredBy: u.id, answeredAt: now(s) }); touch(s, g, { status: 'Answered', answer: p.answer }); touch(s, get(s, 'humanTasks', g.humanTaskId), { status: 'Completed' }); for (const ex of list(s, 'executions').filter(e => e.runId === g.runId && e.nodeId === g.nodeId && e.attempt === g.attempt && e.status === 'Waiting'))
        touch(s, ex, { status: 'Completed', completedAt: now(s) }); run.input = structuredClone(p.answer); const token = run.tokens.find(t => t.id === g.tokenId); run.status = 'Running'; routeToken(s, run, token); postEvent(s, run, 'input.answered', u.name + ' ответил: ' + p.answer.explanation, { inputId: input.id }); return { gate: g, run }; },
    'gate.decide': (s, u, c, p) => {
        const g = get(s, 'gates', c.targetId, c.spaceId);
        validateChallenge(s, u, c, p, g, p.decision);
        const run = get(s, 'runs', g.runId);
        const dependency = dependencyCheck(s, activeSnapshot(s, run));
        if (dependency)
            fail(dependency.code, dependency.message, 409);
        if (['InDoubt', 'HumanOwned', 'TakeoverRequested'].includes(run.status))
            fail('ActionInDoubt', 'Сначала завершите передачу управления / сверку', 409);
        if (p.decision === 'approve') {
            if (!g.checkIds.length || g.checkIds.some(id => !get(s, 'checks', id).passed))
                fail('ValidationError', 'Обязательные проверки не пройдены; верните на доработку');
            if (run.humanAuthorId === u.id)
                fail('Forbidden', 'После Takeover нужен независимый peer reviewer', 403);
        }
        if (p.decision === 'rework') {
            text(p.reason, 'reason');
            text(p.expectedFix, 'expectedFix');
            const graph = activeSnapshot(s, run).graph;
            if (!graph.nodes.some(n => n.id === p.targetNodeId && ['AI', 'Command', 'Input', 'Delegation'].includes(n.type)))
                fail('ValidationError', 'Выберите целевой рабочий этап');
            const allowed = graph.edges.some(e => e.from === g.nodeId && e.to === p.targetNodeId && e.on === 'rework');
            if (!allowed)
                fail('ValidationError', 'Нет разрешённого rework-перехода к этому этапу');
        }
        const time = integer(p.humanTimeMs ?? 60000, 'humanTimeMs', 0, 8 * 3600000);
        const previousRevision = g.revision;
        const decision = add(s, 'decisions', { spaceId: c.spaceId, projectId: g.projectId, runId: run.id, gateId: g.id, taskId: g.taskId, attempt: run.attempt, reviewerId: u.id, decision: p.decision, reason: p.reason || '', expectedFix: p.expectedFix || '', targetNodeId: p.targetNodeId, expectedRevision: previousRevision, targetDigest: g.artifactBundleDigest, challengeId: p.challengeId, humanTimeMs: time }, u.id);
        run.humanTimeMs += time;
        cost(s, { spaceId: c.spaceId, projectId: run.projectId, rootRunId: run.rootRunId, runId: run.id, attempt: run.attempt, category: 'human', amount: Math.round(time / 60000 * 120), humanTimeMs: time }, decision.id + ':human');
        touch(s, g, { status: { approve: 'Approved', rework: 'ReworkRequested', reject: 'Rejected', clarify: 'Superseded' }[p.decision], decisionId: decision.id });
        touch(s, get(s, 'humanTasks', g.humanTaskId), { status: 'Completed' });
        for (const ex of list(s, 'executions').filter(e => e.runId === g.runId && e.nodeId === g.nodeId && e.attempt === g.attempt && e.status === 'Waiting'))
            touch(s, ex, { status: 'Completed', completedAt: now(s) });
        const token = run.tokens.find(t => t.id === g.tokenId);
        run.status = 'Running';
        delete token.waiting;
        if (p.decision === 'approve')
            routeToken(s, run, token, 'approve');
        if (p.decision === 'rework') {
            for (const a of list(s, 'attempts').filter(a => a.runId === run.id && a.number === run.attempt))
                touch(s, a, { status: 'Reworked' });
            run.reworkInput = p.reason + '\n' + p.expectedFix;
            run.reworks++;
            run.attempt++;
            run.checkPassed = false;
            run.childRunIds = [];
            add(s, 'attempts', { spaceId: c.spaceId, projectId: run.projectId, runId: run.id, number: run.attempt, status: 'Running', sourceDecisionId: decision.id, configurationDigest: run.configurationDigest, input: run.reworkInput });
            routeToken(s, run, token, 'rework');
        }
        if (p.decision === 'reject')
            stopRun(s, run, 'Cancelled', p.reason || 'Reviewer rejected');
        if (p.decision === 'clarify') {
            const inputNode = activeSnapshot(s, run).graph.nodes.find(n => n.type === 'Input');
            if (!inputNode)
                fail('ValidationError', 'В графе нет Input для уточнения');
            token.nodeId = inputNode.id;
            recompute(s, run);
        }
        postEvent(s, run, 'decision.recorded', u.name + ': ' + { approve: 'принято', rework: 'вернул на доработку', reject: 'отклонил', clarify: 'запросил уточнение' }[p.decision] + (p.reason ? ' — ' + p.reason : ''), { decisionId: decision.id });
        schedule(s, run);
        return { decision, gate: g, run, cost: balance(s, run) };
    },
    'gate.reassign': (s, u, c, p) => { const g = get(s, 'gates', c.targetId, c.spaceId); role(u, ['engineer']); revision(g, c.expectedRevision); if (g.status !== 'Pending')
        fail('RevisionConflict', 'Гейт уже закрыт', 409); const space = get(s, 'spaces', c.spaceId); if (!space.memberIds.includes(p.userId) || USERS.find(x => x.id === p.userId)?.role !== g.role)
        fail('ValidationError', 'Нужен участник требуемой роли'); touch(s, g, { assigneeId: p.userId }); touch(s, get(s, 'humanTasks', g.humanTaskId), { assigneeId: p.userId }); emit(s, 'gate.reassigned', g, u.id); return g; },
    'run.control': (s, u, c, p) => {
        const run = get(s, 'runs', c.targetId, c.spaceId);
        const iVersion = get(s, 'installationVersions', run.installationRevisionId);
        if (!iVersion.controls.includes(p.control))
            fail('AdapterUnsupported', 'Adapter не поддерживает ' + p.control, 422);
        if (terminal(run))
            fail('RevisionConflict', 'Run завершён', 409);
        if (run.status === 'InDoubt' && p.control !== 'CANCEL')
            fail('ActionInDoubt', 'Сначала выполните reconciliation', 409);
        if (['TAKEOVER', 'RETURN'].includes(p.control))
            role(u, ['engineer']);
        if (u.role === 'po' && get(s, 'projects', run.projectId).ownerId !== u.id)
            fail('Forbidden', 'Остановить можно свой проект', 403);
        if (p.control === 'CANCEL') {
            stopRun(s, run, 'Cancelled', 'Остановлено ' + u.name);
            return run;
        }
        if (p.control === 'PAUSE') {
            if (['InDoubt', 'HumanOwned', 'TakeoverRequested'].includes(run.status))
                fail('ActionInDoubt', 'Сначала завершите сверку или Takeover', 409);
            run.previousStatus = run.status;
            touch(s, run, { status: 'Paused' });
        }
        if (p.control === 'RESUME') {
            if (run.status !== 'Paused')
                fail('RevisionConflict', 'Run не на паузе', 409);
            const dep = dependencyCheck(s, activeSnapshot(s, run));
            if (dep)
                fail(dep.code, dep.message, 409);
            run.status = 'Running';
            recompute(s, run);
        }
        if (p.control === 'STEP') {
            if (run.status === 'Paused') {
                run.status = 'Running';
                recompute(s, run);
            }
            tick(s, { spaceId: c.spaceId, runId: run.id });
        }
        if (p.control === 'TAKEOVER') {
            if (run.status === 'InDoubt' || list(s, 'actions').some(a => a.runId === run.id && a.status === 'InDoubt'))
                fail('ActionInDoubt', 'Takeover заблокирован до reconciliation', 409);
            if (['HumanOwned', 'TakeoverRequested'].includes(run.status))
                fail('RevisionConflict', 'Передача уже выполнена или запрошена', 409);
            run.controlEpoch++;
            touch(s, get(s, 'workspaces', run.workspaceId), { owner: null, leaseId: null, epoch: run.controlEpoch });
            touch(s, run, { status: 'TakeoverRequested', takeoverUserId: u.id });
            queue(s, 'takeover', run.id, c.spaceId);
        }
        if (p.control === 'RETURN') {
            if (run.status !== 'HumanOwned' || get(s, 'workspaces', run.workspaceId).humanId !== u.id)
                fail('Forbidden', 'Нет human writer lease', 403);
            const diff = text(p.diff, 'diff');
            const check = verifyBehavior(p.behavior || run.behavior, run.taskClass);
            if (!check.passed)
                fail('ValidationError', 'Return checks не пройдены', 400, { findings: check.findings });
            run.controlEpoch++;
            run.humanAuthorId = u.id;
            run.behavior = p.behavior || run.behavior;
            run.checkPassed = true;
            artifact(s, run, { id: 'human-takeover' }, 'takeover.diff', diff);
            touch(s, get(s, 'workspaces', run.workspaceId), { owner: 'agent', humanId: null, epoch: run.controlEpoch, leaseId: 'agent-' + c.actionId, returnChecks: check });
            for (const g of list(s, 'gates').filter(g => g.runId === run.id && g.status === 'Pending')) {
                touch(s, g, { status: 'Superseded' });
                touch(s, get(s, 'humanTasks', g.humanTaskId), { status: 'Cancelled' });
            }
            const review = activeSnapshot(s, run).graph.nodes.find(n => n.type === 'Approval');
            run.tokens = [{ id: 'return-' + c.actionId, nodeId: review.id }];
            run.status = 'Running';
            recompute(s, run);
        }
        emit(s, 'run.control', run, u.id, { control: p.control, epoch: run.controlEpoch });
        schedule(s, run);
        return run;
    },
    'run.reconcile': (s, u, c, p) => { role(u, ['engineer', 'platform']); const run = get(s, 'runs', c.targetId, c.spaceId); if (run.status !== 'InDoubt')
        fail('RevisionConflict', 'Нет неизвестного эффекта', 409); for (const a of list(s, 'actions').filter(a => a.runId === run.id && a.status === 'InDoubt'))
        touch(s, a, { status: 'Reconciled', readBack: { effectId: a.effectId, exists: a.effectObserved, checkedAt: now(s) } }); touch(s, run, { effectReconciled: true, status: 'Running', reason: null }); postEvent(s, run, 'action.reconciled', 'Read-back подтвердил единственный mock-эффект. Повтор не выполнялся.'); schedule(s, run); return run; },
    'run.budget': (s, u, c, p) => { role(u, ['po']); const run = rootRun(s, get(s, 'runs', c.targetId, c.spaceId)); if (get(s, 'projects', run.projectId).ownerId !== u.id)
        fail('Forbidden', 'Бюджет утверждает владелец проекта', 403); integer(p.amount, 'amount', 1, 500000); touch(s, run, { budget: run.budget + p.amount }); for (const h of list(s, 'humanTasks').filter(h => h.runId === run.id && h.kind === 'budget' && h.status === 'Pending'))
        touch(s, h, { status: 'Completed' }); if (run.reason === 'BudgetExceeded') {
        run.status = 'Running';
        run.reason = null;
        recompute(s, run);
    } emit(s, 'budget.extended', run, u.id, { amount: p.amount }); return run; },
    'message.send': (s, u, c, p) => { const channel = p.channelId ? get(s, 'channels', p.channelId, c.spaceId) : null; if (!channel && p.private !== true)
        fail('ValidationError', 'Выберите канал'); if (p.threadId) {
        const th = get(s, 'threads', p.threadId, c.spaceId);
        if (th.channelId !== channel?.id)
            fail('ScopeViolation', 'Тред принадлежит другому каналу', 403);
    } const msg = message(s, { spaceId: c.spaceId, projectId: channel?.projectId, channelId: channel?.id, threadId: p.threadId || null, text: text(p.text, 'text'), kind: p.private ? 'private' : 'text', privateTo: p.private ? u.id : undefined, replyTo: p.replyTo || null }, u.id); if (p.replyTo) {
        const original = get(s, 'messages', p.replyTo, c.spaceId);
        if (!visible(s, u, original))
            fail('NotFound', 'Сообщение недоступно', 404);
    } const memberIds = get(s, 'spaces', c.spaceId).memberIds; for (const other of USERS.filter(x => memberIds.includes(x.id) && p.text.includes('@' + x.name)))
        notify(s, { spaceId: c.spaceId, privateTo: other.id, messageId: msg.id, title: 'Упоминание в канале' }); if (p.private) {
        const waiting = list(s, 'humanTasks').filter(h => h.spaceId === c.spaceId && h.assigneeId === u.id && h.status === 'Pending').length;
        message(s, { spaceId: c.spaceId, privateTo: u.id, kind: 'assistant', ai: true, actorLabel: 'Личный AI-ассистент', text: `У вас ${waiting} ожидающих поручений. Я вижу только доступное вам пространство. Создание задачи требует отдельного подтверждения.` });
    } return msg; },
    'thread.create': (s, u, c, p) => { const root = get(s, 'messages', c.targetId, c.spaceId); if (!visible(s, u, root) || root.privateTo)
        fail('Forbidden', 'Личный диалог нельзя публиковать в канал', 403); if (root.threadId)
        return get(s, 'threads', root.threadId); const thread = add(s, 'threads', { spaceId: c.spaceId, projectId: root.projectId, channelId: root.channelId, rootMessageId: root.id, title: root.text.slice(0, 120) }, u.id); touch(s, root, { threadId: thread.id }); return thread; },
    'message.edit': (s, u, c, p) => { const msg = get(s, 'messages', c.targetId, c.spaceId); if (msg.createdBy !== u.id || !['text', 'private'].includes(msg.kind))
        fail('Forbidden', 'Можно изменять только своё обычное сообщение', 403); revision(msg, c.expectedRevision); msg.revisions.push({ revision: msg.revision, text: msg.text, at: now(s) }); touch(s, msg, p.delete ? { text: 'Сообщение удалено', tombstone: true } : { text: text(p.text, 'text') }); emit(s, 'message.updated', msg, u.id); return msg; },
    'message.react': (s, u, c, p) => { const msg = get(s, 'messages', c.targetId, c.spaceId); if (!visible(s, u, msg))
        fail('NotFound', 'Сообщение недоступно', 404); if (!['👍', '✅', '❤️', '👀'].includes(p.emoji))
        fail('ValidationError', 'Реакция недоступна'); const ids = msg.reactions[p.emoji] || []; msg.reactions[p.emoji] = ids.includes(u.id) ? ids.filter(x => x !== u.id) : [...ids, u.id]; touch(s, msg); emit(s, 'message.reaction', msg, u.id); return msg; },
    'message.pin': (s, u, c, p) => { const msg = get(s, 'messages', c.targetId, c.spaceId); if (!visible(s, u, msg))
        fail('NotFound', 'Сообщение недоступно', 404); touch(s, msg, { pinned: !msg.pinned }); emit(s, 'message.pinned', msg, u.id); return msg; },
    'notification.read': (s, u, c, p) => { const n = get(s, 'notifications', c.targetId, c.spaceId); if (n.privateTo !== u.id)
        fail('Forbidden', 'Чужое уведомление', 403); touch(s, n, { status: 'Read' }); return n; },
    'assistant.propose': (s, u, c, p) => { const project = get(s, 'projects', p.projectId, c.spaceId); return add(s, 'assistantProposals', { spaceId: c.spaceId, projectId: project.id, privateTo: u.id, title: text(p.title, 'title', 500), status: 'Pending', action: 'task.create', requiresConfirmation: true }, u.id); },
    'assistant.confirm': (s, u, c, p) => { const proposal = get(s, 'assistantProposals', c.targetId, c.spaceId); if (proposal.privateTo !== u.id)
        fail('Forbidden', 'Чужой диалог', 403); if (proposal.status !== 'Pending')
        fail('RevisionConflict', 'Предложение уже обработано', 409); if (p.confirm !== true) {
        touch(s, proposal, { status: 'Cancelled' });
        return proposal;
    } const project = get(s, 'projects', proposal.projectId); const task = add(s, 'tasks', { spaceId: c.spaceId, projectId: project.id, title: proposal.title, description: proposal.title, taskClass: 'ui', status: 'Backlog', ownerId: project.ownerId, assigneeId: project.engineerId, originProposalId: proposal.id }, u.id); touch(s, proposal, { status: 'Confirmed', taskId: task.id }); emit(s, 'task.created', task, u.id); return task; },
    'simulator.configure': (s, u, c, p) => { role(u, ['platform', 'engineer']); s.simulator.spaces ||= {}; const config = s.simulator.spaces[c.spaceId] ||= { auto: true, chatFailure: false }; if (p.auto !== undefined)
        config.auto = !!p.auto; if (p.chatFailure !== undefined)
        config.chatFailure = !!p.chatFailure; emit(s, 'simulator.configured', get(s, 'spaces', c.spaceId), u.id); return config; },
    'simulator.step': (s, u, c, p) => { role(u, ['platform', 'engineer']); tick(s, { spaceId: c.spaceId }); return { sequence: s.sequence }; },
    'simulator.clock': (s, u, c, p) => { role(u, ['platform', 'engineer']); integer(p.advanceMs, 'advanceMs', 1, 86400000); s.simulator.spaces ||= {}; const config = s.simulator.spaces[c.spaceId] ||= {}; config.clockOffset = (config.clockOffset || 0) + p.advanceMs; return { clock: now(s, c.spaceId) }; }
};
