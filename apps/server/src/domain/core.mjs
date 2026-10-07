import { createHash, randomUUID } from 'node:crypto';
import { USERS, COLLECTIONS } from '../../../../packages/contracts/catalog.mjs';
export function canonical(value) { if (value === null || typeof value !== 'object')
    return JSON.stringify(value); if (Array.isArray(value))
    return '[' + value.map(canonical).join(',') + ']'; return '{' + Object.keys(value).filter(k => value[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}'; }
export const digest = value => 'sha256:' + createHash('sha256').update(typeof value === 'string' ? value : canonical(value)).digest('hex');
export const id = prefix => prefix + '_' + randomUUID().replaceAll('-', '').slice(0, 16);
export class DomainError extends Error {
    constructor(code, message, status = 400, fields = {}, recoveryActions = []) { super(message); this.code = code; this.status = status; this.fields = fields; this.recoveryActions = recoveryActions; this.retryable = ['StorageUnavailable', 'RevisionConflict', 'StaleReview'].includes(code); }
}
export const fail = (code, message, status = 400, fields = {}, recovery = []) => { throw new DomainError(code, message, status, fields, recovery); };
export const need = (v, message, field = 'value') => { if (v === undefined || v === null || v === '')
    fail('ValidationError', message, 400, { [field]: message }); return v; };
export const text = (v, name = 'text', max = 20000) => { if (typeof v !== 'string' || !v.trim() || v.length > max)
    fail('ValidationError', `Поле ${name}: нужен текст от 1 до ${max} символов`, 400, { [name]: 'Проверьте текст' }); return v.trim(); };
export const integer = (v, name = 'amount', min = 0, max = 100000000) => { if (!Number.isSafeInteger(v) || v < min || v > max)
    fail('ValidationError', `Поле ${name}: целое число ${min}…${max}`, 400, { [name]: 'Некорректное число' }); return v; };
export function safeObject(value, depth = 0) { if (depth > 40)
    fail('ValidationError', 'Слишком глубокая структура'); if (typeof value === 'string' && value.length > 200000)
    fail('ValidationError', 'Поле слишком длинное'); if (value && typeof value === 'object')
    for (const [key, v] of Object.entries(value)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key))
            fail('ValidationError', 'Небезопасный ключ');
        if (/^(path|file|filename|artifactPath|targetPath)$/i.test(key) && typeof v === 'string' && (v.includes('..') || v.startsWith('/') || v.includes('\\') || /^[a-z]:/i.test(v)))
            fail('ScopeViolation', 'Путь выходит за workspace');
        safeObject(v, depth + 1);
    } return value; }
export const now = (s, spaceId) => Date.now() + (s.clockOffset || 0) + (spaceId ? (s.simulator.spaces?.[spaceId]?.clockOffset || 0) : 0);
export function blankState() { return { schemaVersion: 6, sequence: 0, seed: 6104, clockOffset: 0, entities: Object.fromEntries(COLLECTIONS.map(c => [c, {}])), events: [], outbox: [], jobs: [], ledger: {}, sessions: {}, simulator: { auto: true, paused: false, chatFailure: false } }; }
export const list = (s, type) => Object.values(s.entities[type] || {});
export function get(s, type, key, spaceId) { const e = s.entities[type]?.[key]; if (!e || (spaceId && e.spaceId !== spaceId))
    fail('NotFound', 'Объект недоступен', 404); return e; }
export function add(s, type, props = {}, user = 'system') { const t = now(s); const e = { id: id(type.replace(/s$/, '')), type, revision: 1, schemaVersion: 1, createdAt: t, updatedAt: t, createdBy: user, ...props }; s.entities[type][e.id] = e; return e; }
export function touch(s, e, props = {}) { Object.assign(e, props); e.revision++; e.updatedAt = now(s); return e; }
export const userById = id => USERS.find(u => u.id === id);
export function hasSpace(s, user, spaceId) { return !!s.entities.spaces[spaceId]?.memberIds?.includes(user.id); }
export function scope(s, user, spaceId) { if (!hasSpace(s, user, spaceId))
    fail('Forbidden', 'Нет доступа к этому пространству', 403); return get(s, 'spaces', spaceId); }
export function role(user, roles) { if (!roles.includes(user.role))
    fail('Forbidden', 'Действие недоступно выбранной роли', 403); }
export function revision(e, expected) { if (!Number.isSafeInteger(expected) || expected !== e.revision) {
    const error = new DomainError('RevisionConflict', 'Версия изменилась. Откройте актуальную; локальный текст сохранён.', 409, { expectedRevision: `Текущая версия ${e.revision}` }, ['reload']);
    error.currentRevision = e.revision;
    throw error;
} }
export function visible(s, user, e) { if (!e)
    return false; if (e.type === 'spaces')
    return hasSpace(s, user, e.id); if (e.privateTo && e.privateTo !== user.id)
    return false; if (!hasSpace(s, user, e.spaceId))
    return false; if (e.visibility === 'private' && e.createdBy !== user.id && !(e.readerIds || []).includes(user.id))
    return false; if (e.type === 'challenges' && e.userId !== user.id)
    return false; if (e.type === 'knowledgeLinks')
    return visible(s, user, s.entities.pages[e.from]) && visible(s, user, s.entities.pages[e.to]); if (e.type === 'knowledgeVersions')
    return visible(s, user, s.entities.pages[e.pageId]); return true; }
export function emit(s, type, entity, actor = 'system', payload = {}) { const ev = { eventId: id('evt'), type, occurredAt: now(s), recordedAt: now(s), spaceId: entity.spaceId || entity.id, projectId: entity.projectId, aggregateId: entity.id, aggregateRevision: entity.revision, sequence: ++s.sequence, correlationId: entity.runId || entity.id, causationId: s.currentActionId || 'simulator', actorRef: actor, privateTo: entity.privateTo, visibility: entity.visibility, ownerId: entity.createdBy, refs: { runId: entity.runId, taskId: entity.taskId }, payload }; s.events.push(ev); return ev; }
export function eventVisible(s, user, e) { return hasSpace(s, user, e.spaceId) && (!e.privateTo || e.privateTo === user.id) && (e.visibility !== 'private' || e.ownerId === user.id); }
export const terminal = r => ['Accepted', 'Failed', 'Cancelled'].includes(r.status);
export function readState(s, user, spaceId) { const selected = spaceId ? scope(s, user, spaceId) : null; const entities = {}; for (const type of COLLECTIONS) {
    if (type === 'challenges')
        continue;
    entities[type] = list(s, type).filter(e => visible(s, user, e) && (type === 'spaces' || !selected || e.spaceId === spaceId || e.id === spaceId)).map(e => structuredClone(e));
} return { user, entities, sequence: s.sequence, simulator: { auto: true, chatFailure: false, ...structuredClone(s.simulator.spaces?.[spaceId] || {}) }, clock: now(s, spaceId) }; }
