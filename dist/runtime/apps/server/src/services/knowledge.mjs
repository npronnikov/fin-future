import { COMPONENT_TEMPLATES } from '../../../../packages/contracts/catalog.mjs';
import { add, touch, get, list, role, revision, text, need, fail, digest, emit, now, visible } from '../domain/core.mjs';
import { mutationTest } from '../adapters/mock/oracle.mjs';
import { postEvent } from '../projections/chat.mjs';
export const knowledgeHandlers = {
    'knowledge.propose': (s, u, c, p) => { role(u, ['engineer']); let decision = p.sourceDecisionId ? get(s, 'decisions', p.sourceDecisionId, c.spaceId) : null; if (decision && decision.decision !== 'rework')
        fail('ValidationError', 'Источником должен быть Rework'); const title = p.title || '503 не означает пустую выдачу'; const content = p.content || `# ${title}\n\n## Проблема\n${decision?.reason || 'HTTP 503 ошибочно показан как пустые данные.'}\n\n## Правило\nHTTP 503 означает недоступность источника. Показывать отдельное состояние unavailable.\n\n## Применимость\nИнформационный frontend, API статусов заявок.\n\n## Контрпример\n503 → «У вас нет заявок» — неверно.\n\n## Проверка\n503 → unavailable, 204 → empty, 200 → data.`; const proposal = add(s, 'proposals', { spaceId: c.spaceId, projectId: decision?.projectId || p.projectId, title, content, sourceDecisionId: decision?.id, sourceMessageId: p.sourceMessageId, reason: decision?.reason || p.reason || 'Правило из работы', appliesTo: p.appliesTo || 'ui / API response states', tests: ['http-states@1'], status: 'Proposed' }, u.id); const page = add(s, 'pages', { spaceId: c.spaceId, projectId: proposal.projectId, title, content, parentId: p.parentId || null, tags: ['API', '503'], visibility: 'team', status: 'Proposed', proposalId: proposal.id, ownerId: u.id, sourceDecisionId: decision?.id, tests: ['http-states@1'], rule: 'http-503-unavailable', revisionHistory: [] }, u.id); proposal.pageId = page.id; emit(s, 'knowledge.proposed', proposal, u.id); return { proposal, page }; },
    'knowledge.create': (s, u, c, p) => { role(u, ['engineer', 'po']); if (p.parentId) {
        const parent = get(s, 'pages', p.parentId, c.spaceId);
        if (!visible(s, u, parent))
            fail('NotFound', 'Родитель недоступен', 404);
    } if (p.visibility && !['team', 'private'].includes(p.visibility))
        fail('ValidationError', 'Неизвестная видимость'); const page = add(s, 'pages', { spaceId: c.spaceId, projectId: p.projectId || null, title: text(p.title, 'title', 200), content: p.content || '', parentId: p.parentId || null, tags: p.tags || [], visibility: p.visibility || 'team', status: 'Draft', ownerId: u.id, tests: [], revisionHistory: [] }, u.id); emit(s, 'knowledge.created', page, u.id); return page; },
    'knowledge.save': (s, u, c, p) => {
        role(u, ['engineer', 'po']);
        const page = get(s, 'pages', c.targetId, c.spaceId);
        if (!visible(s, u, page))
            fail('NotFound', 'Страница недоступна', 404);
        revision(page, c.expectedRevision);
        if (p.parentId) {
            let parent = get(s, 'pages', p.parentId, c.spaceId);
            if (!visible(s, u, parent))
                fail('NotFound', 'Родитель недоступен', 404);
            let count = 0;
            while (parent) {
                if (parent.id === page.id)
                    fail('ValidationError', 'Циклическая иерархия страниц');
                parent = parent.parentId ? s.entities.pages[parent.parentId] : null;
                if (++count > 100)
                    fail('ValidationError', 'Слишком глубокая иерархия');
            }
        }
        page.revisionHistory.push({ revision: page.revision, title: page.title, content: page.content, updatedAt: page.updatedAt });
        touch(s, page, { title: p.title ? text(p.title, 'title', 200) : page.title, content: p.content ?? page.content, parentId: p.parentId !== undefined ? p.parentId : page.parentId, tags: p.tags || page.tags, status: 'Draft', authorId: u.id, tests: p.tests || page.tests });
        emit(s, 'knowledge.saved', page, u.id);
        return page;
    },
    'knowledge.submit': (s, u, c, p) => { role(u, ['engineer']); const page = get(s, 'pages', c.targetId, c.spaceId); if (!visible(s, u, page))
        fail('NotFound', 'Недоступная страница', 404); revision(page, c.expectedRevision); if (!page.content.trim())
        fail('ValidationError', 'Нет текста для проверки'); touch(s, page, { status: 'InReview', authorId: u.id, tests: p.tests || page.tests || ['http-states@1'] }); emit(s, 'knowledge.submitted', page, u.id); return page; },
    'knowledge.publish': (s, u, c, p) => { role(u, ['engineer']); const page = get(s, 'pages', c.targetId, c.spaceId); if (!visible(s, u, page))
        fail('NotFound', 'Недоступная страница', 404); revision(page, c.expectedRevision); if (['Draft', 'Published', 'Revoked'].includes(page.status))
        fail('ValidationError', 'Сначала отправьте страницу на review'); if ((page.authorId || page.createdBy) === u.id)
        fail('Forbidden', 'Нужен независимый продукт-инженер', 403); const tests = page.tests?.length ? page.tests : ['http-states@1']; if (!tests.every(t => ['http-states@1', 'docs-contract@1'].includes(t)))
        fail('ValidationError', 'Неизвестный тест'); const verification = mutationTest(); const v = add(s, 'knowledgeVersions', { spaceId: c.spaceId, projectId: page.projectId, pageId: page.id, title: page.title, content: page.content, contentDigest: digest({ content: page.content, tests }), authorId: page.authorId || page.createdBy, reviewerId: u.id, status: 'Published', appliesTo: p.appliesTo || 'ui', exceptions: p.exceptions || 'Не распространяется на auth/платежи', validUntil: now(s) + 180 * 86400000, sourceDecisionId: page.sourceDecisionId, tests, verification, rule: page.rule || (/503/.test(page.content) && /unavailable|недоступ/i.test(page.content) ? 'http-503-unavailable' : null) }, u.id); touch(s, page, { status: 'Published', currentVersionId: v.id }); if (page.proposalId)
        touch(s, get(s, 'proposals', page.proposalId), { status: 'Published', versionId: v.id }); emit(s, 'knowledge.published', page, u.id, { versionId: v.id }); return v; },
    'knowledge.link': (s, u, c, p) => { role(u, ['engineer', 'po']); const from = get(s, 'pages', p.from, c.spaceId), to = get(s, 'pages', p.to, c.spaceId); if (!visible(s, u, from) || !visible(s, u, to))
        fail('NotFound', 'Страница недоступна', 404); if (!['explains', 'refines', 'contradicts', 'derivedFrom', 'usedBy', 'supersedes'].includes(p.kind))
        fail('ValidationError', 'Неподдерживаемый тип связи'); const same = list(s, 'knowledgeLinks').find(l => l.from === p.from && l.to === p.to && l.kind === p.kind); if (same)
        return same; const link = add(s, 'knowledgeLinks', { spaceId: c.spaceId, from: from.id, to: to.id, kind: p.kind }, u.id); emit(s, 'knowledge.linked', from, u.id); return link; },
    'component.create': (s, u, c, p) => { role(u, ['engineer', 'platform']); const template = COMPONENT_TEMPLATES.find(t => t.id === p.template) || COMPONENT_TEMPLATES[0]; const component = add(s, 'components', { spaceId: c.spaceId, name: p.name || template.name, componentType: template.type, ownerId: u.id, originRef: 'catalog:' + template.id, scope: 'team', inputContract: 'typed object', outputContract: 'artifact + checks', allowedTools: ['mock-read', 'mock-propose'], status: 'Draft' }, u.id); const v = add(s, 'componentVersions', { spaceId: c.spaceId, componentId: component.id, name: component.name, version: '1.0.0', content: p.content || 'Предметная инструкция: различать HTTP 503 и пустые данные.', authorId: u.id, status: 'Draft', testOnly: true, contentDigest: digest(p.content || 'Предметная инструкция: различать HTTP 503 и пустые данные.'), dependencies: [], tests: [] }, u.id); component.currentVersionId = v.id; emit(s, 'component.created', component, u.id); return { component, version: v }; },
    'component.version': (s, u, c, p) => { role(u, ['engineer', 'platform']); const component = get(s, 'components', c.targetId, c.spaceId); const v = add(s, 'componentVersions', { spaceId: c.spaceId, componentId: component.id, name: component.name, version: text(p.version, 'version', 60), content: text(p.content, 'content'), contentDigest: digest(p.content), authorId: u.id, status: 'Draft', testOnly: true, dependencies: p.dependencies || [], tests: [] }, u.id); touch(s, component, { currentVersionId: v.id, status: 'Draft' }); emit(s, 'component.version_created', component, u.id); return v; },
    'component.submit': (s, u, c, p) => { role(u, ['engineer', 'platform']); const v = get(s, 'componentVersions', c.targetId, c.spaceId); if (v.status !== 'Draft')
        fail('ValidationError', 'Только Draft можно передать на проверку'); touch(s, v, { status: 'InReview', tests: ['http-states@1'], testResult: mutationTest() }); emit(s, 'component.submitted', v, u.id); return v; },
    'component.publish': (s, u, c, p) => { const v = get(s, 'componentVersions', c.targetId, c.spaceId); const component = get(s, 'components', v.componentId); role(u, ['RuntimeAdapter', 'ToolAdapter', 'SandboxProfile', 'ModelProfile', 'HarnessProfile'].includes(component.componentType) ? ['platform'] : ['engineer']); if (v.authorId === u.id)
        fail('Forbidden', 'Нужен независимый reviewer', 403); if (v.status !== 'InReview' || !v.testResult?.wrongRejected)
        fail('ValidationError', 'Нет review и результатов тестирования'); touch(s, v, { status: 'Published', testOnly: false, reviewerId: u.id, publishedAt: now(s) }); touch(s, component, { status: 'Published' }); emit(s, 'component.published', v, u.id); return v; },
    'component.revoke': (s, u, c, p) => { role(u, ['engineer', 'platform']); const v = s.entities.componentVersions[c.targetId] || s.entities.knowledgeVersions[c.targetId]; if (!v || v.spaceId !== c.spaceId || !visible(s, u, v))
        fail('NotFound', 'Версия недоступна', 404); text(p.reason, 'reason'); touch(s, v, { status: 'Revoked', revokedBy: u.id, revokeReason: p.reason }); for (const r of list(s, 'runs').filter(r => r.spaceId === c.spaceId && !['Accepted', 'Failed', 'Cancelled'].includes(r.status))) {
        const snap = get(s, 'snapshots', r.snapshotId);
        if (snap.lock.some(l => l.id === v.id)) {
            touch(s, r, { status: 'Blocked', reason: 'RevokedDependency' });
            postEvent(s, r, 'dependency.revoked', 'Отозвана зависимость. Новые действия заблокированы.');
        }
    } emit(s, 'component.revoked', v, u.id); return v; }
};
