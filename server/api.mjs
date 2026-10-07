import {applyAction, DomainError, refreshHealth} from '../lib/engine.ts';
import {assistantReply} from '../lib/assistant.ts';
import {createEmptyState} from '../lib/domain.ts';
import {projectStateForActor,projectActionResult} from '../lib/scope.ts';

const COOKIE_NAME = 'kontur_session';
const MAX_BODY_BYTES = 800_000;

function json(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

function cookieId(request) {
  const part = (request.headers.cookie || '').split(';').map(value => value.trim())
    .find(value => value.startsWith(`${COOKIE_NAME}=`));
  return part?.slice(COOKIE_NAME.length + 1);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let rejected = false;
    const chunks = [];
    request.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        if (!rejected) reject(new DomainError('Слишком большой запрос.', 413));
        rejected = true;
        chunks.length = 0;
      } else if (!rejected) chunks.push(chunk);
    });
    request.on('end', () => {
      if (rejected) return;
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (raw.length > 200_000) throw new DomainError('Слишком большой запрос.', 413);
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error instanceof DomainError ? error : new DomainError('Некорректный JSON.'));
      }
    });
    request.on('error', reject);
    request.on('aborted', () => reject(new DomainError('Запрос прерван.')));
  });
}

export async function handleApi(request, response, store) {
  try {
    if (!['GET', 'POST'].includes(request.method)) {
      response.setHeader('Allow', 'GET, POST');
      return json(response, 405, {error: 'Метод не поддерживается.'});
    }
    let body;
    if (request.method === 'POST') {
      const protocol = request.socket.encrypted ? 'https:' : 'http:';
      const origin = `${protocol}//${request.headers.host}`;
      if (request.headers.origin && request.headers.origin !== origin) {
        throw new DomainError('Запрос должен исходить из приложения.', 403);
      }
      if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || '')) {
        throw new DomainError('Используйте Content-Type: application/json.', 415);
      }
      body = await readBody(request);
      if (!body || Array.isArray(body) || typeof body.action !== 'string' ||
          !body.payload || typeof body.payload !== 'object' || Array.isArray(body.payload)) {
        throw new DomainError('Некорректный запрос.');
      }
    }

    const output = store.transaction(() => {
      const session = store.session(cookieId(request));
      if (body?.action === 'select_scenario') {
        store.selectScenario(session.id, body.payload.scenario);
        session.scenario = body.payload.scenario;
        session.scenarioChosen = true;
      } else if (body?.scenario !== undefined && body.scenario !== session.scenario) {
        throw new DomainError('Сценарий изменился в другой вкладке. Обновите экран и повторите действие.', 409);
      }
      const state = store.readState(session.scenario);
      if (body?.action === 'select_scenario') {
        return {session, body: {state, actor: store.actorFor(session.id, state)}};
      }
      if (request.method === 'GET') {
        const before = JSON.stringify(state);
        refreshHealth(state);
        if (JSON.stringify(state) !== before) {
          const revision = state.revision;
          state.revision++;
          store.writeState(state, revision, session.scenario);
        }
        return {session, body: {state, actor: store.actorFor(session.id, state), identity: 'local-browser'}};
      }

      const actor = store.actorFor(session.id, state);
      if (body.action === 'select_actor') {
        store.selectActor(session.id, body.payload.actorId, state);
        return {session, body: {state, actor: store.actorFor(session.id, state)}};
      }
      if (body.action === 'ask_assistant') {
        const payload = body.payload;
        if (actor.role !== 'Regulator' && !actor.teams.includes(payload.teamId)) {
          throw new DomainError('Нет доступа к Team Space.', 403);
        }
        if (typeof payload.text !== 'string' || !payload.text.trim() || payload.text.length > 10_000) {
          throw new DomainError('Введите вопрос до 10 000 символов.');
        }
        return {session, body: {reply: assistantReply(projectStateForActor(state, actor), actor, payload)}};
      }
      if (body.revision !== state.revision) {
        throw new DomainError('Данные обновились. Повторите действие после обновления экрана.', 409);
      }
      if (body.action === 'reset_scenario') {
        if (session.scenario !== 'empty') {
          throw new DomainError('Очистка доступна только в сценарии «С нуля».', 403);
        }
        if (body.payload.confirmation !== 'clear-empty-scenario') {
          throw new DomainError('Подтвердите очистку данных сценария «С нуля».');
        }
        const cleared = createEmptyState();
        cleared.revision = state.revision + 1;
        store.writeState(cleared, state.revision, 'empty');
        store.selectActor(session.id, 'po', cleared);
        return {session, body: {state: cleared, actor: store.actorFor(session.id, cleared), result: {reset: true}}};
      }
      const changed = applyAction(state, actor, body.action, body.payload, session.id);
      store.writeState(changed.state, state.revision, session.scenario);
      return {
        session,
        body: {state: changed.state, actor: changed.state.people.find(person => person.id === actor.id), result: changed.result},
      };
    });

    if (output.body.state && output.body.actor) {
      output.body.state = projectStateForActor(output.body.state, output.body.actor);
      output.body.result = projectActionResult(output.body.result, output.body.actor);
    }
    if (output.session.created) {
      const secure = request.socket.encrypted ? '; Secure' : '';
      response.setHeader('Set-Cookie', `${COOKIE_NAME}=${output.session.id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${secure}`);
    }
    json(response, 200, {...output.body, scenario: output.session.scenario, scenarioChosen: output.session.scenarioChosen});
  } catch (error) {
    if (error instanceof DomainError) return json(response, error.status, {error: error.message});
    console.error('KONTUR API error:', error);
    json(response, 503, {error: 'Не удалось сохранить данные. Повторите попытку.'});
  }
}
