import { add, emit, get, list, now } from '../domain/core.mjs';
export function message(s, props, user = 'system') { const item = add(s, 'messages', { text: '', revisions: [], reactions: {}, pinned: false, ...props }, user); emit(s, 'message.created', item, user, { messageId: item.id, threadId: item.threadId, channelId: item.channelId }); return item; }
export function postEvent(s, run, type, text, extra = {}) { const event = emit(s, type, run, 'system', { runId: run.id, ...extra }); s.outbox.push({ id: event.eventId, spaceId: run.spaceId, projectId: run.projectId, runId: run.id, channelId: run.channelId, threadId: run.threadId, text, kind: extra.gateId ? 'gate' : 'system', gateId: extra.gateId, status: 'Pending', attempts: 0 }); projectChat(s, run.spaceId); return event; }
export function projectChat(s, spaceId) { for (const event of s.outbox) {
    if (event.status === 'Delivered' || (spaceId && event.spaceId !== spaceId) || s.simulator.spaces?.[event.spaceId]?.chatFailure)
        continue;
    const existing = list(s, 'messages').find(m => m.domainEventId === event.id);
    if (!existing)
        message(s, { spaceId: event.spaceId, projectId: event.projectId, runId: event.runId, channelId: event.channelId, threadId: event.threadId, text: event.text, kind: event.kind, gateId: event.gateId, domainEventId: event.id, ai: true, actorLabel: 'КОНТУР · AI runtime' });
    event.status = 'Delivered';
    event.attempts++;
    event.deliveredAt = now(s);
} }
export function notify(s, props) { return add(s, 'notifications', { status: 'Unread', ...props }); }
