import { transferHandlers } from '../services/transfer.mjs';
import { platformHandlers } from '../services/platform.mjs';
import { workHandlers } from '../services/work.mjs';
import { knowledgeHandlers } from '../services/knowledge.mjs';
import { releaseHandlers } from '../services/releases.mjs';
import { scope, safeObject, text, fail, digest, emit, get, add, DomainError } from './core.mjs';
export const HANDLERS = { ...platformHandlers, ...workHandlers, ...knowledgeHandlers, ...releaseHandlers, ...transferHandlers };
export const COMMAND_TYPES = Object.keys(HANDLERS);
export function validateEnvelope(command) { if (!command || typeof command !== 'object' || Array.isArray(command))
    fail('ValidationError', 'Нужен command envelope'); safeObject(command); text(command.actionId, 'actionId', 160); text(command.type, 'type', 100); if (!HANDLERS[command.type])
    fail('ValidationError', 'Неизвестная команда ' + command.type); if (command.payload !== undefined && (!command.payload || typeof command.payload !== 'object' || Array.isArray(command.payload)))
    fail('ValidationError', 'payload должен быть объектом'); for (const k of ['role', 'userId'])
    if (command[k] !== undefined)
        fail('ValidationError', 'Identity определяется только server session'); if (!['space.create', 'demo.import'].includes(command.type))
    text(command.spaceId, 'spaceId', 80); return command; }
export function execute(store, user, command) {
    validateEnvelope(command);
    const key = [user.id, command.spaceId || 'new-space', command.actionId].join(':');
    const requestDigest = digest(command);
    if (command.spaceId)
        scope(store.state, user, command.spaceId);
    const previous = store.state.ledger[key];
    if (previous) {
        if (previous.requestDigest !== requestDigest)
            fail('RevisionConflict', 'actionId уже использован с другим payload', 409);
        return { ...previous.result, replayed: true };
    }
    try {
        return store.transact(s => { s.currentActionId = command.actionId; if (command.spaceId)
            scope(s, user, command.spaceId); const result = HANDLERS[command.type](s, user, command, command.payload || {}); const response = { commandResult: structuredClone(result), sequence: s.sequence, correlationId: command.actionId, replayed: false }; s.ledger[key] = { requestDigest, result: response }; return response; });
    }
    catch (e) {
        if (e instanceof DomainError && ['Forbidden', 'ScopeViolation'].includes(e.code) && command.spaceId) {
            try {
                store.transact(s => { emit(s, 'action.denied', get(s, 'spaces', command.spaceId), user.id, { commandType: command.type, code: e.code }); });
            }
            catch { /* failing audit must not convert a denial into success */ }
        }
        throw e;
    }
}
