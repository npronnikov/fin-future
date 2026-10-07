import { NODE_TYPES } from '../../../../packages/contracts/catalog.mjs';
import { digest, fail, safeObject } from './core.mjs';
export const COMMANDS = ['verify-ui', 'verify-docs', 'lint', 'test', 'mock-pr', 'policy-probe'];
export function semanticGraph(graph) { const copy = structuredClone(graph); delete copy.viewport; for (const n of copy.nodes || []) {
    delete n.x;
    delete n.y;
    delete n.position;
    delete n.selected;
} delete copy.layout; return copy; }
export function validateGraph(graph, { profile, versions = [], requiredGates = true } = {}) {
    const issues = [];
    const issue = (nodeId, message) => issues.push({ nodeId, message });
    if (!graph || graph.schemaVersion !== 1 || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges))
        return [{ nodeId: null, message: 'Нужен graph schemaVersion=1 с nodes и edges' }];
    try {
        safeObject(graph);
    }
    catch (e) {
        return [{ nodeId: null, message: e.message }];
    }
    if (graph.nodes.length > 150 || graph.edges.length > 500)
        return [{ nodeId: null, message: 'Лимит: 150 узлов / 500 переходов' }];
    const nodes = new Map();
    for (const n of graph.nodes) {
        if (typeof n.id !== 'string' || !n.id || nodes.has(n.id))
            issue(n.id, 'ID узла отсутствует или повторяется');
        nodes.set(n.id, n);
        if (!NODE_TYPES.includes(n.type))
            issue(n.id, 'Неподдерживаемый тип узла');
        if (profile && !profile.nodeTypes.includes(n.type))
            issue(n.id, 'Тип не поддерживается adapter');
        if (['Input', 'Approval'].includes(n.type) && !['engineer', 'po'].includes(n.reviewerRole))
            issue(n.id, 'Назначьте роль ответственного');
        if (n.type === 'Command' && !COMMANDS.includes(n.command))
            issue(n.id, 'Команда отсутствует в безопасном каталоге');
        if (n.type === 'Condition' && (!['eq', 'neq', 'gt', 'lt', 'truthy'].includes(n.condition?.op) || !['checkPassed', 'input.behavior', 'fixture', 'attempt'].includes(n.condition?.field)))
            issue(n.id, 'Нужен безопасный condition {field,op,value}');
        if (n.timeoutMs !== undefined && (!Number.isSafeInteger(n.timeoutMs) || n.timeoutMs < 1))
            issue(n.id, 'Некорректный timeout');
        if (n.retryCount !== undefined && (!Number.isInteger(n.retryCount) || n.retryCount < 0 || n.retryCount > 5))
            issue(n.id, 'retryCount 0…5');
        if (n.inputSchema && n.inputSchema.type !== 'object')
            issue(n.id, 'inputSchema должен быть object');
    }
    const starts = graph.nodes.filter(n => n.type === 'Start');
    if (starts.length !== 1)
        issue(null, 'Должен быть ровно один Start');
    if (!graph.nodes.some(n => n.type === 'Terminal'))
        issue(null, 'Отсутствует Terminal');
    if (requiredGates && !graph.nodes.some(n => n.type === 'Approval' && n.reviewerRole === 'engineer'))
        issue(null, 'Обязательный инженерный Approval удалён');
    for (const e of graph.edges) {
        if (!nodes.has(e.from) || !nodes.has(e.to))
            issue(e.from, 'Переход ссылается на отсутствующий узел');
        if (typeof e.on !== 'string')
            issue(e.from, 'У перехода отсутствует outcome');
        if (e.maxVisits !== undefined && (!Number.isInteger(e.maxVisits) || e.maxVisits < 1 || e.maxVisits > 20))
            issue(e.from, 'maxVisits должен быть 1…20');
    }
    for (const n of graph.nodes) {
        const out = graph.edges.filter(e => e.from === n.id);
        if (n.type !== 'Terminal' && !out.length)
            issue(n.id, 'Нет исходящего перехода');
        if (n.type === 'Condition' && !['true', 'false'].every(v => out.some(e => e.on === v)))
            issue(n.id, 'Condition требует ветви true и false');
        if (n.type === 'Approval' && !out.some(e => e.on === 'approve'))
            issue(n.id, 'Approval требует переход approve');
        if (n.type !== 'Parallel' && new Set(out.map(e => e.on)).size !== out.length)
            issue(n.id, 'Неоднозначные переходы для одного исхода');
    }
    if (starts.length === 1) {
        const reachable = new Set();
        const walk = id => { if (reachable.has(id))
            return; reachable.add(id); graph.edges.filter(e => e.from === id).forEach(e => walk(e.to)); };
        walk(starts[0].id);
        for (const n of graph.nodes)
            if (!reachable.has(n.id))
                issue(n.id, 'Недостижимый узел');
    }
    // Every cycle must contain a capped edge. Removing capped edges must leave a DAG.
    const visiting = new Set(), done = new Set();
    const dfs = key => { if (visiting.has(key)) {
        issue(key, 'Неограниченный цикл: добавьте maxVisits');
        return;
    } if (done.has(key))
        return; visiting.add(key); graph.edges.filter(e => e.from === key && !e.maxVisits).forEach(e => dfs(e.to)); visiting.delete(key); done.add(key); };
    for (const n of graph.nodes)
        dfs(n.id);
    for (const ref of graph.dependencies || []) {
        const v = versions.find(v => v.id === ref);
        if (!v)
            issue(null, 'Нет component version ' + ref);
        else if (v.status === 'Revoked')
            issue(null, 'Отозвана dependency ' + ref);
    }
    return issues;
}
export function assertGraph(graph, options) { const findings = validateGraph(graph, options); if (findings.length)
    fail('ValidationError', 'Граф не прошёл проверку', 400, { findings }); return graph; }
export function graphDigest(graph) { return digest(semanticGraph(graph)); }
export function conditionValue(n, run) { const fields = { checkPassed: run.checkPassed, 'input.behavior': run.input?.behavior, fixture: run.fixture, attempt: run.attempt }; const c = n.condition, v = fields[c.field]; switch (c.op) {
    case 'eq': return v === c.value;
    case 'neq': return v !== c.value;
    case 'gt': return typeof v === 'number' && v > c.value;
    case 'lt': return typeof v === 'number' && v < c.value;
    case 'truthy': return Boolean(v);
    default: return false;
} }
