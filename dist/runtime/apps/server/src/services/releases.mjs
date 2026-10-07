import { add, touch, get, list, role, revision, text, integer, need, fail, digest, emit, now } from '../domain/core.mjs';
import { startRun, activeSnapshot, dependencyCheck } from '../simulator/runtime.mjs';
import { behaviorFor, verifyBehavior, mutationTest } from '../adapters/mock/oracle.mjs';
import { metrics, cost } from './economics.mjs';
import { message } from '../projections/chat.mjs';
const stableObject = o => JSON.parse(JSON.stringify(o));
const stageAttest = (s, u, candidate, kind, extra = {}) => { const a = add(s, 'attestations', { spaceId: candidate.spaceId, projectId: candidate.projectId, candidateId: candidate.id, targetDigest: candidate.manifestDigest, kind, reviewerId: u.id, ...extra }, u.id); emit(s, 'attestation.recorded', a, u.id); return a; };
export const releaseHandlers = {
    'evaluation.create': (s, u, c, p) => {
        role(u, ['engineer']);
        const snapshot = get(s, 'snapshots', p.snapshotId, c.spaceId);
        const trial = list(s, 'runs').find(r => r.configurationDigest === snapshot.configurationDigest && r.mode === 'trial' && r.status === 'Accepted');
        if (!trial)
            fail('ValidationError', 'Нужен принятый Trial точной конфигурации');
        const track = p.track || 'human-guided';
        if (!['human-guided', 'autonomous', 'expert-assisted'].includes(track))
            fail('ValidationError', 'Неизвестный track');
        const plan = add(s, 'evaluationPlans', { spaceId: c.spaceId, projectId: snapshot.projectId, snapshotId: snapshot.id, configurationDigest: snapshot.configurationDigest, taskClass: snapshot.taskClass, basketVersion: 'sdlc-basket@1', oracleVersions: ['http-states@1', 'scope@1'], track, memoryMode: 'pinned', budget: 50000, repetitions: 1, timeout: 300000, passPredicates: ['positive behavior contract', 'negative rejected', 'mutation rejected'], synthetic: true }, u.id);
        const cases = [{ id: 'normal', title: 'Нормальный путь', kind: 'positive' }, { id: 'empty', title: 'Пустой ответ', kind: 'positive' }, { id: '503', title: 'Недоступный API', kind: 'positive' }, { id: 'mutation', title: 'Намеренно неверный diff', kind: 'negative' }, { id: 'scope', title: 'Попытка изменить auth', kind: 'negative' }, { id: 'duplicate', title: 'Повтор usage event', kind: 'negative' }, { id: 'cancel', title: 'Отмена', kind: 'cancel' }];
        const resultBehavior = behaviorFor({ ...trial, fixture: 'knowledge', reworkInput: null, input: track === 'human-guided' ? { behavior: 'separate', explanation: 'При 503 показывать недоступность' } : {} }, snapshot);
        const oracle = verifyBehavior(resultBehavior, trial.taskClass);
        const mutation = mutationTest();
        const results = cases.map(test => { let passed, outcome; if (test.kind === 'positive') {
            passed = oracle.passed;
            outcome = passed ? 'Accepted' : 'Failed';
        }
        else if (test.id === 'mutation') {
            passed = mutation.wrongRejected;
            outcome = 'RejectedAsExpected';
        }
        else if (test.id === 'scope') {
            passed = true;
            outcome = 'PolicyFixtureRejected';
        }
        else if (test.id === 'duplicate') {
            passed = true;
            outcome = 'LedgerFixtureDeduplicated';
        }
        else {
            passed = true;
            outcome = 'Cancelled';
        } return { ...test, started: true, passed, outcome, configurationDigest: snapshot.configurationDigest, track, synthetic: true, provenance: test.kind === 'positive' ? 'deterministic-oracle' : test.id === 'mutation' ? 'mutation-oracle' : 'declared-policy-fixture' }; });
        const evaluation = add(s, 'evaluations', { spaceId: c.spaceId, projectId: snapshot.projectId, planId: plan.id, snapshotId: snapshot.id, configurationDigest: snapshot.configurationDigest, taskClass: snapshot.taskClass, track, basketVersion: plan.basketVersion, budget: plan.budget, status: 'Completed', results, mutation, allStarted: results.length, accepted: results.filter(r => r.outcome === 'Accepted').length, failures: results.filter(r => r.outcome === 'Failed').length, cancellations: 1, pending: 0, maturity: 'complete', passed: results.every(r => r.passed), hardViolation: false, cost: 1400, limitations: ['Scope / duplicate / cancel — declared fixtures; не live integration evidence', 'Небольшая синтетическая корзина; статистические интервалы не рассчитаны'], contentDigest: digest({ results, configurationDigest: snapshot.configurationDigest, track }), synthetic: true }, u.id);
        cost(s, { spaceId: c.spaceId, projectId: snapshot.projectId, amount: 1400, category: 'evaluation', evaluationId: evaluation.id }, evaluation.id + ':usage');
        emit(s, 'evaluation.completed', evaluation, u.id);
        return evaluation;
    },
    'arena.compare': (s, u, c, p) => { role(u, ['engineer']); if (!Array.isArray(p.evaluationIds) || p.evaluationIds.length < 2)
        fail('ValidationError', 'Выберите минимум две оценки'); const evaluations = p.evaluationIds.map(id => get(s, 'evaluations', id, c.spaceId)); const first = evaluations[0]; if (evaluations.some(e => e.taskClass !== first.taskClass || e.track !== first.track || e.basketVersion !== first.basketVersion || e.budget !== first.budget))
        fail('ValidationError', 'Арена требует одинаковые class, track, basket и budget'); const eligible = evaluations.filter(e => !e.hardViolation && e.passed); const report = add(s, 'arenaReports', { spaceId: c.spaceId, projectId: first.projectId, evaluationIds: p.evaluationIds, track: first.track, taskClass: first.taskClass, rows: evaluations.map((e, i) => ({ label: String.fromCharCode(65 + i), evaluationId: e.id, correctness: e.accepted / e.allStarted, cost: e.cost, hardViolation: e.hardViolation, eligible: !e.hardViolation && e.passed })), preferredEvaluationId: eligible.sort((a, b) => a.cost - b.cost)[0]?.id || null, review: p.review || 'tie', status: 'ReportOnly', autoAdmission: false, synthetic: true }, u.id); emit(s, 'arena.reported', report, u.id); return report; },
    'candidate.create': (s, u, c, p) => { role(u, ['engineer']); const snapshot = get(s, 'snapshots', p.snapshotId, c.spaceId); const dep = dependencyCheck(s, snapshot); if (dep)
        fail(dep.code, dep.message); if (snapshot.testOnly)
        fail('ValidationError', 'Draft dependency не допускается в кандидат'); const evaluation = get(s, 'evaluations', p.evaluationId, c.spaceId); if (evaluation.configurationDigest !== snapshot.configurationDigest || !evaluation.passed || evaluation.maturity !== 'complete' || !evaluation.mutation.wrongRejected)
        fail('ValidationError', 'Нет подходящих завершённых evidence'); const trial = list(s, 'runs').find(r => r.configurationDigest === snapshot.configurationDigest && r.mode === 'trial' && r.status === 'Accepted'); if (!trial)
        fail('ValidationError', 'Нет принятого Trial'); const manifest = { kind: snapshot.kind === 'team' ? 'AssistantTeamRelease' : 'WorkflowRelease', snapshotId: snapshot.id, configurationDigest: snapshot.configurationDigest, graph: snapshot.graph, team: snapshot.kind === 'team' ? snapshot.team : null, resolvedLock: snapshot.lock, installationRevisionId: snapshot.installationRevisionId, modelProfile: snapshot.modelProfile, taskClass: snapshot.taskClass, actionBounds: ['read', 'propose'], mandatoryChecks: ['contract', 'scope'], budget: 50000, evidenceRefs: [evaluation.id, trial.id], track: evaluation.track }; const candidate = add(s, 'candidates', { spaceId: c.spaceId, projectId: snapshot.projectId, name: p.name || get(s, 'definitions', snapshot.definitionId).name, snapshotId: snapshot.id, configurationDigest: snapshot.configurationDigest, evaluationId: evaluation.id, manifest, manifestDigest: digest(manifest), status: 'TechnicalReview', authorId: u.id }, u.id); emit(s, 'candidate.created', candidate, u.id); return candidate; },
    'candidate.technical': (s, u, c, p) => { role(u, ['engineer']); const candidate = get(s, 'candidates', c.targetId, c.spaceId); revision(candidate, c.expectedRevision); if (candidate.status !== 'TechnicalReview')
        fail('RevisionConflict', 'Не ожидается technical review', 409); if (candidate.authorId === u.id)
        fail('Forbidden', 'Автор не может согласовать собственный кандидат', 403); if (p.targetDigest !== candidate.manifestDigest)
        fail('StaleReview', 'Digest кандидата изменился', 409); const a = stageAttest(s, u, candidate, 'technical', { statement: p.statement || 'Проверены конфигурация и evidence' }); touch(s, candidate, { status: 'ScopeReview', technicalAttestationId: a.id }); return candidate; },
    'candidate.scope': (s, u, c, p) => { role(u, ['po']); const candidate = get(s, 'candidates', c.targetId, c.spaceId); revision(candidate, c.expectedRevision); if (get(s, 'projects', candidate.projectId).ownerId !== u.id)
        fail('Forbidden', 'Решение принимает владелец проекта', 403); if (candidate.status !== 'ScopeReview')
        fail('RevisionConflict', 'Сначала нужен technical review', 409); if (p.targetDigest !== candidate.manifestDigest)
        fail('StaleReview', 'Digest кандидата изменился', 409); const a = stageAttest(s, u, candidate, 'scope-risk', { scope: 'Low-risk ' + candidate.manifest.taskClass, residualRisk: 'Synthetic demo only' }); touch(s, candidate, { status: 'AwaitingUAT', scopeAttestationId: a.id }); return candidate; },
    'uat.start': (s, u, c, p) => { role(u, ['engineer']); const candidate = get(s, 'candidates', c.targetId, c.spaceId); if (candidate.status !== 'AwaitingUAT')
        fail('RevisionConflict', 'Кандидат ещё не готов к UAT', 409); if (p.snapshotId && p.snapshotId !== candidate.snapshotId)
        fail('StaleReview', 'UAT выполняет только исходный snapshot', 409); const env = get(s, 'environments', p.environmentId, c.spaceId); if (env.kind !== 'UAT')
        fail('EnvironmentNotReady', 'Выберите UAT среду'); const run = startRun(s, u, { snapshotId: candidate.snapshotId, projectId: candidate.projectId, environmentId: env.id, fixture: 'clean', title: 'UAT · ' + candidate.name }, c.spaceId, 'uat'); run.candidateId = candidate.id; touch(s, candidate, { uatRunId: run.id }); return run; },
    'uat.accept': (s, u, c, p) => { role(u, ['engineer']); const candidate = get(s, 'candidates', c.targetId, c.spaceId); const run = get(s, 'runs', candidate.uatRunId, c.spaceId); if (run.status !== 'Accepted' || run.snapshotId !== candidate.snapshotId)
        fail('ValidationError', 'UAT точного snapshot ещё не принят'); if (p.targetDigest !== candidate.manifestDigest)
        fail('StaleReview', 'Digest кандидата не совпадает', 409); const report = add(s, 'uatReports', { spaceId: c.spaceId, projectId: candidate.projectId, candidateId: candidate.id, runId: run.id, configurationDigest: run.configurationDigest, candidateDigest: candidate.manifestDigest, reviewerId: u.id, passed: true, contentDigest: digest({ candidateDigest: candidate.manifestDigest, runId: run.id, decisions: list(s, 'decisions').filter(d => d.runId === run.id).map(d => d.id) }) }, u.id); stageAttest(s, u, candidate, 'uat', { reportDigest: report.contentDigest }); touch(s, candidate, { status: 'UATAccepted', uatReportId: report.id }); return report; },
    'release.admit': (s, u, c, p) => { role(u, ['po']); const candidate = get(s, 'candidates', c.targetId, c.spaceId); if (get(s, 'projects', candidate.projectId).ownerId !== u.id)
        fail('Forbidden', 'Нужен владелец проекта', 403); if (candidate.status !== 'UATAccepted')
        fail('ValidationError', 'Нет принятого UAT'); const snapshot = get(s, 'snapshots', candidate.snapshotId); const dep = dependencyCheck(s, snapshot); if (dep)
        fail(dep.code, dep.message); const release = add(s, 'releases', { spaceId: c.spaceId, projectId: candidate.projectId, candidateId: candidate.id, name: candidate.name, kind: candidate.manifest.kind, snapshotId: candidate.snapshotId, configurationDigest: candidate.configurationDigest, manifestDigest: candidate.manifestDigest, uatReportId: candidate.uatReportId, status: 'Admitted', expiresAt: now(s) + 30 * 86400000, admittedBy: u.id }, u.id); touch(s, candidate, { status: 'Admitted', releaseId: release.id }); emit(s, 'release.admitted', release, u.id); return release; },
    'deployment.create': (s, u, c, p) => { role(u, ['platform']); const release = get(s, 'releases', p.releaseId, c.spaceId); if (release.status !== 'Admitted' || release.expiresAt < now(s))
        fail('Forbidden', 'Релиз не допущен или истёк', 403); const env = get(s, 'environments', p.environmentId, c.spaceId); if (env.status !== 'Ready')
        fail('EnvironmentNotReady', 'Среда не Ready'); const snapshot = get(s, 'snapshots', release.snapshotId); const dep = dependencyCheck(s, snapshot); if (dep)
        fail(dep.code, dep.message); if (get(s, 'installations', snapshot.installationId).status !== 'Ready')
        fail('MissingDependency', 'Установка недоступна'); const bindings = list(s, 'bindings').filter(b => b.projectId === release.projectId && b.status === 'Ready'); if (!['repo', 'ci', 'model'].every(k => bindings.some(b => b.kind === k)))
        fail('MissingDependency', 'Недостаточно bindings'); const deployment = add(s, 'deployments', { spaceId: c.spaceId, projectId: release.projectId, releaseId: release.id, environmentId: env.id, bindingDigest: digest(bindings.map(b => b.contentDigest).sort()), bindingIds: bindings.map(b => b.id), quota: p.quota || 50000, stopPlan: 'Pause new dispatch; retain artifacts; reconcile unknown effects', status: 'Active', synthetic: true }, u.id); const project = get(s, 'projects', release.projectId); message(s, { spaceId: c.spaceId, projectId: project.id, channelId: project.channelId, kind: 'system', text: `Размещён ${release.name} в ${env.name}. Только mock-runtime.`, deploymentId: deployment.id }); emit(s, 'deployment.activated', deployment, u.id); return deployment; },
    'deployment.control': (s, u, c, p) => { role(u, ['platform']); const dep = get(s, 'deployments', c.targetId, c.spaceId); if (!['pause', 'resume', 'rollback'].includes(p.action))
        fail('ValidationError', 'Неизвестное действие'); const release = get(s, 'releases', p.action === 'rollback' ? p.releaseId : dep.releaseId, c.spaceId); const snapshot = get(s, 'snapshots', release.snapshotId); const error = dependencyCheck(s, snapshot); if (error)
        fail(error.code, error.message); if (release.status !== 'Admitted' || release.expiresAt < now(s))
        fail('Forbidden', 'Нет действующего допуска', 403); if (p.action === 'rollback' && release.projectId !== dep.projectId)
        fail('ScopeViolation', 'Релиз другого проекта', 403); touch(s, dep, { status: p.action === 'pause' ? 'Paused' : 'Active', releaseId: release.id }); emit(s, 'deployment.' + p.action, dep, u.id); return dep; },
    'productRelease.create': (s, u, c, p) => { role(u, ['engineer']); const run = get(s, 'runs', p.runId, c.spaceId); if (run.status !== 'Accepted')
        fail('ValidationError', 'Нужен принятый Run'); const artifact = list(s, 'artifacts').filter(a => a.runId === run.id && a.name === 'implementation.diff').at(-1); const release = add(s, 'productReleases', { spaceId: c.spaceId, projectId: run.projectId, runId: run.id, name: p.name || get(s, 'tasks', run.taskId).title, artifactDigest: artifact?.contentDigest, status: 'AwaitingPO', technicalReviewerId: u.id, synthetic: true }, u.id); emit(s, 'product_release.created', release, u.id); return release; },
    'productRelease.approve': (s, u, c, p) => { role(u, ['po']); const r = get(s, 'productReleases', c.targetId, c.spaceId); if (get(s, 'projects', r.projectId).ownerId !== u.id)
        fail('Forbidden', 'Нужен владелец проекта', 403); if (r.status !== 'AwaitingPO')
        fail('RevisionConflict', 'Уже обработано', 409); touch(s, r, { status: 'Approved', poReviewerId: u.id }); emit(s, 'product_release.approved', r, u.id); return r; },
    'productRelease.deploy': (s, u, c, p) => { role(u, ['platform']); const r = get(s, 'productReleases', c.targetId, c.spaceId); if (r.status !== 'Approved')
        fail('Forbidden', 'Нет решения PO', 403); touch(s, r, { status: 'Active', deployedAt: now(s) }); emit(s, 'product_release.deployed', r, u.id); return r; },
    'platformRelease.create': (s, u, c, p) => { role(u, ['platform']); const i = get(s, 'installations', p.installationId, c.spaceId); const release = add(s, 'platformReleases', { spaceId: c.spaceId, installationId: i.id, installationRevisionId: i.currentVersionId, name: p.name || i.name + ' · platform package', status: 'Draft', compatibility: { profile: i.profile, controls: i.controls }, contentDigest: digest({ installationRevisionId: i.currentVersionId, controls: i.controls }), limitations: ['Отдельный platform approval не реализован'], synthetic: true }, u.id); emit(s, 'platform_release.created', release, u.id); return release; },
    'outcome.observe': (s, u, c, p) => { role(u, ['po']); const r = get(s, 'productReleases', p.productReleaseId, c.spaceId); const project = get(s, 'projects', r.projectId); if (project.ownerId !== u.id)
        fail('Forbidden', 'Нужен владелец проекта', 403); if (r.status !== 'Active')
        fail('ValidationError', 'ProductRelease не размещён'); const fixture = p.fixture || 'below-target'; if (!['below-target', 'achieved', 'srm', 'immature', 'guardrail'].includes(fixture))
        fail('ValidationError', 'Неизвестный dataset'); const outcome = add(s, 'outcomes', { spaceId: c.spaceId, projectId: project.id, productReleaseId: r.id, metricContract: project.metricContract, fixture, value: fixture === 'achieved' ? 85 : 71, baseline: 62, target: 80, observations: fixture === 'immature' ? 20 : 160, maturity: fixture === 'immature' ? 'preliminary' : 'complete', srm: fixture === 'srm', guardrailViolation: fixture === 'guardrail', assignment: 'synthetic balanced fixture', exposure: 'fixture-only', provenance: 'synthetic/status-observations@1', status: 'Observed', synthetic: true }, u.id); outcome.contentDigest = digest(stableObject(outcome)); message(s, { spaceId: c.spaceId, projectId: project.id, channelId: project.channelId, kind: 'system', text: `Синтетическая метрика: ${outcome.value}% при цели ${outcome.target}%. Зрелость: ${outcome.maturity}.`, outcomeId: outcome.id }); emit(s, 'outcome.observed', outcome, u.id); return outcome; },
    'outcome.improve': (s, u, c, p) => { role(u, ['po']); const o = get(s, 'outcomes', c.targetId, c.spaceId); if (get(s, 'projects', o.projectId).ownerId !== u.id)
        fail('Forbidden', 'Нужен владелец проекта', 403); if (p.confirm !== true)
        fail('ValidationError', 'Нужно явное подтверждение'); const improvement = add(s, 'improvements', { spaceId: c.spaceId, projectId: o.projectId, outcomeId: o.id, title: p.title || 'Улучшить понятность статусов', status: 'ApprovedForSandbox', hypothesis: 'Разделение состояний снизит неопределённость', regressionPlan: ['http-states@1'], allowedClass: 'ui' }, u.id); const project = get(s, 'projects', o.projectId); const task = add(s, 'tasks', { spaceId: c.spaceId, projectId: o.projectId, title: improvement.title, description: improvement.title, status: 'Backlog', taskClass: 'ui', ownerId: u.id, assigneeId: project.engineerId, originOutcomeId: o.id, improvementId: improvement.id }, u.id); improvement.taskId = task.id; emit(s, 'improvement.created', improvement, u.id); return { improvement, task }; },
    'outcome.scale': (s, u, c, p) => { role(u, ['po']); const o = get(s, 'outcomes', c.targetId, c.spaceId); if (o.srm || o.guardrailViolation || o.maturity !== 'complete')
        fail('ValidationError', 'SRM, guardrail или незрелость блокируют масштабирование'); if (o.value < o.target)
        fail('ValidationError', 'Целевая метрика не достигнута'); touch(s, o, { status: 'ScaleRecommended', autoRollout: false }); return o; },
    'cost.record': (s, u, c, p) => { role(u, ['platform']); if (p.runId)
        get(s, 'runs', p.runId, c.spaceId); if (p.originRef) {
        const original = get(s, 'costs', p.originRef, c.spaceId);
        if (original.currency !== 'DEMO')
            fail('ValidationError', 'Валюта не совпадает');
    } integer(p.amount, 'amount', -10000000); return cost(s, { spaceId: c.spaceId, projectId: p.projectId, runId: p.runId, rootRunId: p.runId ? get(s, 'runs', p.runId).rootRunId : undefined, amount: p.amount, category: p.originRef ? 'adjustment' : 'usage', originRef: p.originRef }, text(p.eventId, 'eventId', 120)); },
    'incident.create': (s, u, c, p) => { role(u, ['platform', 'engineer']); const incident = add(s, 'incidents', { spaceId: c.spaceId, projectId: p.projectId, runId: p.runId, title: text(p.title, 'title', 200), reason: p.reason || 'Ручная диагностика', severity: p.severity || 'medium', ownerId: u.id, status: 'Open', stopAction: 'manual review', synthetic: true }, u.id); emit(s, 'incident.opened', incident, u.id); return incident; }
};
