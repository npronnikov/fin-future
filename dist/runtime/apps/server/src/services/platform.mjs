import { USERS, RESOURCE_TEMPLATES, PROFILES, CONFORMANCE } from '../../../../packages/contracts/catalog.mjs';
import { visible, add, touch, get, list, role, revision, text, integer, need, fail, digest, emit, now } from '../domain/core.mjs';
import { queue, stopRun } from '../simulator/runtime.mjs';
import { message } from '../projections/chat.mjs';
import { cost } from './economics.mjs';
export const platformHandlers = {
    'space.create': (s, u, c, p) => { role(u, ['platform']); const memberIds = [...new Set(p.memberIds || USERS.map(x => x.id))]; if (!memberIds.includes(u.id) || memberIds.some(x => !USERS.some(y => y.id === x)) || !['po', 'engineer', 'platform'].every(r => memberIds.some(i => USERS.find(x => x.id === i)?.role === r)))
        fail('ValidationError', 'Назначьте участников всех трёх ролей'); const ownerId = p.ownerId || memberIds.find(i => USERS.find(x => x.id === i)?.role === 'po'); if (!memberIds.includes(ownerId) || USERS.find(x => x.id === ownerId)?.role !== 'po')
        fail('ValidationError', 'Владелец должен иметь роль PO'); const space = add(s, 'spaces', { name: text(p.name, 'name', 100), goal: p.goal || '', memberIds, ownerId, budget: integer(p.budget ?? 500000, 'budget', 1000), classification: p.classification || 'synthetic', timezone: p.timezone || 'Europe/Amsterdam', status: 'Требуется инфраструктура', origin: p.origin === 'fixture' ? 'prepared-fixture' : 'user-created' }, u.id); space.spaceId = space.id; for (const userId of memberIds)
        add(s, 'memberships', { spaceId: space.id, userId, role: USERS.find(x => x.id === userId).role }, u.id); const setup = add(s, 'setups', { spaceId: space.id, stage: 1, fields: { template: 'minimal', network: 'isolated', profile: 'hg' }, status: 'Draft' }, u.id); space.setupId = setup.id; for (const name of ['общее', 'платформа'])
        add(s, 'channels', { spaceId: space.id, name, kind: 'team' }, u.id); emit(s, 'space.created', space, u.id); return space; },
    'setup.save': (s, u, c, p) => { role(u, ['platform']); const e = get(s, 'setups', c.targetId, c.spaceId); revision(e, c.expectedRevision); if (p.stage !== undefined)
        integer(p.stage, 'stage', 1, 6); touch(s, e, { fields: { ...e.fields, ...p.fields }, stage: p.stage ?? e.stage }); emit(s, 'setup.saved', e, u.id); return e; },
    'plan.create': (s, u, c, p) => { role(u, ['platform']); const template = RESOURCE_TEMPLATES.find(t => t.id === p.template); if (!template)
        fail('ValidationError', 'Неизвестный шаблон'); const space = get(s, 'spaces', c.spaceId); const items = [...new Set([...template.items, ...(p.broker ? ['broker'] : [])])]; const value = template.cost + (p.broker && !template.items.includes('broker') ? 1500 : 0); if (value > space.budget)
        fail('QuotaExceeded', 'План превышает лимит команды', 409); const existing = list(s, 'resources').filter(r => r.spaceId === space.id); const plan = add(s, 'plans', { spaceId: space.id, setupId: space.setupId, template: template.id, templateVersion: template.version, items, cost: value, currency: 'DEMO', network: p.network || 'isolated', status: 'Planned', diff: { add: items.filter(x => !existing.some(r => r.kind === x)), keep: items.filter(x => existing.some(r => r.kind === x)) }, synthetic: true }, u.id); touch(s, get(s, 'setups', space.setupId), { planId: plan.id, stage: 2, fields: { ...get(s, 'setups', space.setupId).fields, template: template.id, network: plan.network } }); emit(s, 'plan.created', plan, u.id); return plan; },
    'provision.start': (s, u, c, p) => { role(u, ['platform']); if (p.confirm !== true)
        fail('ValidationError', 'Нужно явное подтверждение плана'); const plan = get(s, 'plans', c.targetId, c.spaceId); const existing = list(s, 'jobs').find(j => j.targetId === plan.id && j.kind === 'provision' && ['Pending', 'Completed'].includes(j.status)); if (existing)
        return existing; const environment = add(s, 'environments', { spaceId: c.spaceId, name: 'Sandbox', kind: 'Sandbox', status: 'Validating', planId: plan.id, bindingIds: [], synthetic: true }, u.id); const job = queue(s, 'provision', plan.id, c.spaceId, { environmentId: environment.id }); touch(s, plan, { status: 'Provisioning', jobId: job.id }); emit(s, 'provision.started', job, u.id); return job; },
    'job.cancel': (s, u, c, p) => { role(u, ['platform']); const job = get(s, 'jobs', c.targetId, c.spaceId); if (job.status !== 'Pending')
        fail('RevisionConflict', 'Job уже не активен', 409); touch(s, job, { status: 'Cancelled' }); if (job.environmentId)
        touch(s, get(s, 'environments', job.environmentId), { status: 'Cancelled' }); emit(s, 'job.cancelled', job, u.id); return job; },
    'job.retry': (s, u, c, p) => { role(u, ['platform']); const job = get(s, 'jobs', c.targetId, c.spaceId); if (!['Failed', 'Cancelled'].includes(job.status))
        fail('RevisionConflict', 'Job не ожидает восстановления', 409); if (job.kind === 'provision') {
        const plan = get(s, 'plans', job.targetId);
        if (p.network)
            touch(s, plan, { network: p.network });
        touch(s, get(s, 'environments', job.environmentId), { status: 'Validating' });
        job.index = Math.min(job.index, 2);
    } if (job.kind === 'installation') {
        const i = get(s, 'installations', job.targetId);
        touch(s, i, { fixture: 'clean', status: 'Installing' });
    } touch(s, job, { status: 'Pending', reason: null }); if (!s.jobs.includes(job.id))
        s.jobs.push(job.id); emit(s, 'job.retried', job, u.id); return job; },
    'installation.create': (s, u, c, p) => {
        role(u, ['platform']);
        const env = get(s, 'environments', p.environmentId, c.spaceId);
        if (env.status !== 'Ready')
            fail('EnvironmentNotReady', 'Сначала подготовьте ресурсы', 409);
        const profile = PROFILES.find(t => t.id === p.profile);
        if (!profile)
            fail('ValidationError', 'Неизвестный профиль');
        let composition = p.composition || null;
        if (profile.id === 'custom') {
            composition = composition || { stateOwners: ['workflow-controller'], harness: 'bounded-harness@1', store: 'json-state@1', humanAdapter: 'human-workbench@1', modelGateway: 'internal/mock-v1', eventAdapter: 'outbox@1', toolGateway: 'mock-tools@1' };
            if (!Array.isArray(composition.stateOwners) || composition.stateOwners.length !== 1)
                fail('ValidationError', 'Run state должен иметь ровно одного владельца');
            for (const name of ['harness', 'store', 'humanAdapter'])
                need(composition[name], 'Отсутствует компонент ' + name, name);
        }
        const installation = add(s, 'installations', { spaceId: c.spaceId, environmentId: env.id, name: profile.name, profile: profile.id, kind: profile.kind, placement: profile.placement, controls: profile.controls, supportedNodeTypes: profile.nodeTypes, status: 'Installing', health: 'Pending', composition, conformancePlan: composition ? CONFORMANCE : [], conformanceResults: [], fixture: p.fixture || 'clean', synthetic: true }, u.id);
        const v = add(s, 'installationVersions', { spaceId: c.spaceId, installationId: installation.id, version: p.version || 'demo-1', profile: profile.id, adapterContract: 'kontur-mock@1', composition, controls: profile.controls, contentDigest: digest({ profile: profile.id, version: p.version || 'demo-1', composition }) }, u.id);
        installation.currentVersionId = v.id;
        const job = queue(s, 'installation', installation.id, c.spaceId);
        installation.jobId = job.id;
        emit(s, 'installation.created', installation, u.id);
        return installation;
    },
    'installation.update': (s, u, c, p) => { role(u, ['platform']); const i = get(s, 'installations', c.targetId, c.spaceId); revision(i, c.expectedRevision); const version = add(s, 'installationVersions', { spaceId: c.spaceId, installationId: i.id, version: text(p.version, 'version', 80), profile: i.profile, controls: i.controls, composition: i.composition, adapterContract: 'kontur-mock@1', previousVersionId: i.currentVersionId, contentDigest: digest({ profile: i.profile, version: p.version, composition: i.composition }) }, u.id); touch(s, i, { currentVersionId: version.id, impact: list(s, 'runs').filter(r => r.installationId === i.id).map(r => ({ runId: r.id, pinnedRevisionId: r.installationRevisionId, action: 'retained' })) }); emit(s, 'installation.updated', i, u.id); return i; },
    'installation.conformance': (s, u, c, p) => { role(u, ['platform']); const i = get(s, 'installations', c.targetId, c.spaceId); if (i.status !== 'Ready')
        fail('EnvironmentNotReady', 'Установка не готова'); const results = CONFORMANCE.map(name => ({ name, status: name === 'start' && i.controls.includes('STEP') ? 'passed' : 'planned', reason: name === 'start' ? 'Контракт доступности adapter проверен' : 'Требуется отдельный сценарный прогон' })); touch(s, i, { conformanceResults: results }); return i; },
    'environment.create': (s, u, c, p) => { role(u, ['platform']); if (!['UAT', 'Production'].includes(p.kind))
        fail('ValidationError', 'Допустимы UAT и Production'); const base = get(s, 'environments', p.sourceId, c.spaceId); if (base.status !== 'Ready')
        fail('EnvironmentNotReady', 'Базовые ресурсы не готовы'); const e = add(s, 'environments', { spaceId: c.spaceId, name: p.kind, kind: p.kind, status: 'Ready', sourceEnvironmentId: base.id, bindingIds: [], attestation: { network: true, identity: true, synthetic: true }, synthetic: true }, u.id); emit(s, 'environment.ready', e, u.id); return e; },
    'binding.create': (s, u, c, p) => { role(u, ['platform']); const kind = p.kind; if (!['repo', 'tracker', 'ci', 'model', 'broker', 'registry'].includes(kind))
        fail('ValidationError', 'Неизвестный binding'); if (p.projectId)
        get(s, 'projects', p.projectId, c.spaceId); if (p.installationId)
        get(s, 'installations', p.installationId, c.spaceId); if (p.environmentId)
        get(s, 'environments', p.environmentId, c.spaceId); if (p.endpoint && !/^mock:\/\/|\.mock$/.test(p.endpoint))
        fail('ValidationError', 'В этой поставке допустимы только mock endpoints'); const actions = p.actions || (['repo', 'tracker'].includes(kind) ? ['read', 'propose'] : ['read', 'execute']); if (!Array.isArray(actions) || actions.some(a => !['read', 'propose', 'execute', 'write', 'merge'].includes(a)))
        fail('ValidationError', 'Некорректный список actions'); const b = add(s, 'bindings', { spaceId: c.spaceId, projectId: p.projectId, environmentId: p.environmentId, installationId: p.installationId, kind, endpoint: p.endpoint || 'mock://' + kind, actions, identityId: u.id, secretRef: 'mock:masked', status: 'Ready', testResult: { connection: true, scope: true, synthetic: true }, scope: p.scope || 'project', contentDigest: digest({ kind, actions, projectId: p.projectId || null, environmentId: p.environmentId || null }) }, u.id); emit(s, 'binding.ready', b, u.id); return b; },
    'tool.invoke': (s, u, c, p) => { const b = get(s, 'bindings', c.targetId, c.spaceId); if (b.status !== 'Ready' || !b.actions.includes(p.action))
        fail('Forbidden', 'Binding не разрешает ' + p.action, 403); if (!['read', 'propose', 'execute'].includes(p.action))
        role(u, ['platform']); const a = add(s, 'actions', { spaceId: c.spaceId, projectId: b.projectId, bindingId: b.id, actionId: c.actionId, target: b.kind, payloadDigest: digest(p.input || {}), status: 'Succeeded', result: { synthetic: true, action: p.action } }, u.id); emit(s, 'action.succeeded', a, u.id); return a; },
    'project.create': (s, u, c, p) => { role(u, ['po', 'engineer', 'platform']); const space = get(s, 'spaces', c.spaceId); const ownerId = p.ownerId || space.ownerId; const engineerId = p.engineerId || space.memberIds.find(x => USERS.find(y => y.id === x)?.role === 'engineer'); if (!space.memberIds.includes(ownerId) || USERS.find(x => x.id === ownerId)?.role !== 'po' || !space.memberIds.includes(engineerId) || USERS.find(x => x.id === engineerId)?.role !== 'engineer')
        fail('ValidationError', 'Назначения должны соответствовать ролям команды'); if (p.installationId)
        get(s, 'installations', p.installationId, c.spaceId); const project = add(s, 'projects', { spaceId: c.spaceId, name: text(p.name, 'name', 100), goal: p.goal || 'Повысить понятность статусов заявок', ownerId, engineerId, installationId: p.installationId || null, repo: p.repo || 'mock://status-app', budget: integer(p.budget ?? 100000, 'budget', 1000), metricContract: { metric: 'Доля успешного понимания статуса', baseline: 62, target: 80, windowDays: 14, source: 'synthetic/status-observations@1', guardrails: ['error-rate <= 0.02'], maturity: 'minimum 100 observations' }, status: 'Draft' }, u.id); const channel = add(s, 'channels', { spaceId: c.spaceId, projectId: project.id, name: project.name.toLowerCase().replace(/\s+/g, '-'), kind: 'project' }, u.id); project.channelId = channel.id; for (const kind of ['ui', 'docs'])
        add(s, 'classes', { spaceId: c.spaceId, projectId: project.id, name: kind, version: '1.0', allowedPaths: kind === 'ui' ? ['src/', 'tests/'] : ['docs/'], forbidden: ['auth', 'payments', 'client-data'], checks: ['contract', 'scope'], gatePolicy: ['engineer-approval'], budget: 50000, contentDigest: digest({ kind, forbidden: ['auth', 'payments', 'client-data'] }) }, u.id); emit(s, 'project.created', project, u.id); return project; },
    'task.create': (s, u, c, p) => { const project = get(s, 'projects', p.projectId, c.spaceId); const origin = p.originMessageId ? get(s, 'messages', p.originMessageId, c.spaceId) : null; if (origin && !visible(s, u, origin))
        fail('NotFound', 'Сообщение недоступно', 404); const task = add(s, 'tasks', { spaceId: c.spaceId, projectId: project.id, title: text(p.title || origin?.text, 'title', 500), description: p.description || origin?.text || '', originMessageId: origin?.id, acceptance: p.acceptance || 'Пройти checks и обязательный Human Gate', taskClass: p.taskClass || 'ui', priority: p.priority || 'normal', ownerId: project.ownerId, assigneeId: project.engineerId, status: 'Backlog' }, u.id); emit(s, 'task.created', task, u.id); return task; },
    'task.update': (s, u, c, p) => { const task = get(s, 'tasks', c.targetId, c.spaceId); revision(task, c.expectedRevision); if (p.status === 'Done' && (list(s, 'gates').some(g => g.taskId === task.id && g.status === 'Pending') || !list(s, 'runs').some(r => r.taskId === task.id && r.status === 'Accepted')))
        fail('Forbidden', 'Done требует принятого Run и закрытых гейтов', 403); if (p.status && !['Backlog', 'Ready', 'Done', 'Cancelled'].includes(p.status))
        fail('ValidationError', 'Нельзя вручную изменять состояние исполнения'); if (p.status === 'Cancelled')
        for (const r of list(s, 'runs').filter(r => r.taskId === task.id && !['Accepted', 'Cancelled', 'Failed'].includes(r.status)))
            stopRun(s, r, 'Cancelled', 'Задача отменена'); touch(s, task, { ...(p.title ? { title: text(p.title, 'title', 500) } : {}), ...(p.status ? { status: p.status } : {}) }); emit(s, 'task.updated', task, u.id); return task; }
};
