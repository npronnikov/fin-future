import {DomainError} from '../lib/engine.ts';
import {EVIDENCE_REGISTRY_NAME, evidenceRegistryRecords, evidenceRegistrySummary, filterEvidenceRegistry} from '../lib/evidence-registry.ts';

const COOKIE_NAME = 'kontur_session';

function json(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

function cookieId(request) {
  const part = (request.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE_NAME}=`));
  return part?.slice(COOKIE_NAME.length + 1);
}

function optionalFilter(url, name) {
  const value = url.searchParams.get(name)?.trim() || '';
  if (value.length > 200) throw new DomainError(`Фильтр ${name} слишком длинный.`);
  return value || undefined;
}

export function handleEvidenceApi(request, response, store, url) {
  try {
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      return json(response, 405, {error: 'Метод не поддерживается.'});
    }
    const output = store.transaction(() => {
      const session = store.session(cookieId(request));
      const state = store.readState(session.scenario);
      const actor = store.actorFor(session.id, state);
      if (actor.role !== 'Regulator') throw new DomainError('Evidence Registry доступен только регуляторам.', 403);
      const filters = {
        policyPackage: optionalFilter(url, 'policyPackage'),
        requirement: optionalFilter(url, 'requirement'),
        taskId: optionalFilter(url, 'taskId'),
        runId: optionalFilter(url, 'runId'),
        status: optionalFilter(url, 'status'),
        teamId: optionalFilter(url, 'teamId'),
        productId: optionalFilter(url, 'productId'),
        directions: (actor.directions || []).slice(0, 1),
      };
      const visible = filterEvidenceRegistry(evidenceRegistryRecords(state), filters);
      const path = decodeURIComponent(url.pathname).replace(/\/$/, '');
      const recordId = path === '/api/evidence' ? '' : path.slice('/api/evidence/'.length);
      if (recordId) {
        const record = visible.find(item => item.id === recordId);
        if (!record) throw new DomainError('Evidence record не найден.', 404);
        return {session, body: {service: EVIDENCE_REGISTRY_NAME, storage: 'SQLite', record}};
      }
      const rawLimit = url.searchParams.get('limit') || '100';
      const limit = Number(rawLimit);
      if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new DomainError('limit должен быть целым числом от 1 до 500.');
      return {session, body: {service: EVIDENCE_REGISTRY_NAME, storage: 'SQLite', total: visible.length, summary: evidenceRegistrySummary(visible), records: visible.slice(0, limit)}};
    });
    if (output.session.created) {
      const secure = request.socket.encrypted ? '; Secure' : '';
      response.setHeader('Set-Cookie', `${COOKIE_NAME}=${output.session.id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${secure}`);
    }
    json(response, 200, output.body);
  } catch (error) {
    if (error instanceof DomainError) return json(response, error.status, {error: error.message});
    console.error('Evidence Registry API error:', error);
    json(response, 503, {error: 'Evidence Registry временно недоступен.'});
  }
}
