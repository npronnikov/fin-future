import { COLLECTIONS, USERS } from '../../../../packages/contracts/catalog.mjs';
import { readState, scope, role, safeObject, fail, digest, now, emit } from '../domain/core.mjs';
const EXCLUDED = ['challenges', 'assistantProposals'];
const refs = { projects: ['channelId'], runs: ['taskId', 'snapshotId', 'environmentId', 'installationRevisionId'], gates: ['runId', 'humanTaskId'], definitions: ['projectId', 'installationId'], knowledgeVersions: ['pageId'], knowledgeLinks: ['from', 'to'], deployments: ['releaseId', 'environmentId'], componentVersions: ['componentId'], attempts: ['runId'], artifacts: ['runId'], checks: ['runId'], decisions: ['runId', 'gateId'], threads: ['channelId'], installationVersions: ['installationId'] };
export function exportSpace(s, u, spaceId) { scope(s, u, spaceId); const scoped = readState(s, u, spaceId); const entities = {}; for (const [type, items] of Object.entries(scoped.entities)) {
    if (EXCLUDED.includes(type))
        continue;
    entities[type] = items.filter(e => type !== 'spaces' || e.id === spaceId).map(e => { const item = structuredClone(e); delete item.privateMemory; delete item.secretRef; delete item.grants; return item; });
} const data = { format: 'kontur-space-export', schemaVersion: 6, exportedAt: now(s), sourceSpaceId: spaceId, entities, origin: 'user-export', limitations: ['Sessions, secrets, challenges and private actor memory excluded', 'Import pauses executions and suspends deployments'] }; return { ...data, checksum: digest(data) }; }
export function validateImport(data) {
    safeObject(data);
    if (!data || data.format !== 'kontur-space-export' || data.schemaVersion !== 6 || !data.entities)
        fail('ValidationError', 'Неподдерживаемый формат импорта');
    const { checksum, ...unsigned } = data;
    if (checksum !== digest(unsigned))
        fail('ValidationError', 'Checksum импорта не совпадает');
    const ids = new Set();
    let count = 0;
    for (const [type, items] of Object.entries(data.entities)) {
        if (!COLLECTIONS.includes(type) || EXCLUDED.includes(type) || !Array.isArray(items))
            fail('ValidationError', 'Недопустимая коллекция ' + type);
        for (const e of items) {
            if (!e.id || e.type !== type || ids.has(e.id) || e.spaceId !== data.sourceSpaceId)
                fail('ValidationError', 'Некорректные ID / namespace / type');
            ids.add(e.id);
            if (++count > 10000)
                fail('ValidationError', 'Слишком много сущностей');
        }
    }
    if (data.entities.spaces?.length !== 1 || data.entities.spaces[0].id !== data.sourceSpaceId)
        fail('ValidationError', 'Импорт должен содержать ровно одно пространство');
    for (const id of data.entities.spaces[0].memberIds)
        if (!USERS.some(u => u.id === id))
            fail('ValidationError', 'Неизвестная demo identity');
    for (const [type, items] of Object.entries(data.entities))
        for (const e of items)
            for (const key of refs[type] || [])
                if (e[key] && !ids.has(e[key]))
                    fail('ValidationError', 'Висячая ссылка ' + type + '.' + key);
    return { valid: true, entityCount: count, sourceSpaceId: data.sourceSpaceId, checksum, restrictions: ['Runs paused', 'Releases suspended', 'Jobs disabled'], warnings: ['Полнота всех cross-reference invariants не является production validation'] };
}
export const transferHandlers = {
    'demo.import': (s, u, c, p) => {
        role(u, ['platform']);
        if (p.confirm !== true)
            fail('ValidationError', 'Подтвердите импорт');
        const report = validateImport(p.data);
        const source = p.data.sourceSpaceId;
        if (s.entities.spaces[source])
            fail('RevisionConflict', 'Пространство с такими ID уже существует. Импортируйте в новую data-directory.', 409);
        for (const [type, items] of Object.entries(p.data.entities)) {
            for (const original of items) {
                const e = structuredClone(original);
                if (s.entities[type][e.id])
                    fail('RevisionConflict', 'ID уже существует', 409);
                e.origin = 'imported-fixture';
                if (type === 'spaces' && !e.memberIds.includes(u.id))
                    e.memberIds.push(u.id);
                if (type === 'runs' && !['Accepted', 'Failed', 'Cancelled'].includes(e.status)) {
                    e.status = 'Paused';
                    e.reason = 'Imported execution: explicit recovery required';
                }
                if (type === 'gates' && e.status === 'Pending')
                    e.status = 'Superseded';
                if (type === 'humanTasks' && e.status === 'Pending')
                    e.status = 'Cancelled';
                if (type === 'jobs')
                    e.status = 'Cancelled';
                if (type === 'deployments')
                    e.status = 'Paused';
                if (type === 'releases')
                    e.status = 'Suspended';
                if (type === 'workspaces') {
                    e.owner = null;
                    e.leaseId = null;
                }
                s.entities[type][e.id] = e;
            }
        }
        emit(s, 'space.imported', s.entities.spaces[source], u.id, { entityCount: report.entityCount });
        return { spaceId: source, ...report };
    }
};
