import {randomUUID} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createSeed, createEmptyState, migrateState} from '../lib/domain.ts';
import {DomainError} from '../lib/engine.ts';

export class Store {
  constructor(filename) {
    if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), {recursive: true});
    this.db = new DatabaseSync(filename, {timeout: 5000});
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS kontur_state (
        id TEXT PRIMARY KEY,
        revision INTEGER NOT NULL,
        body TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS kontur_sessions (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        scenario TEXT NOT NULL DEFAULT 'demo',
        scenario_chosen INTEGER NOT NULL DEFAULT 0
      );
    `);
    const columns = this.db.prepare('PRAGMA table_info(kontur_sessions)').all().map(column => column.name);
    if (!columns.includes('scenario')) this.db.exec("ALTER TABLE kontur_sessions ADD COLUMN scenario TEXT NOT NULL DEFAULT 'demo'");
    if (!columns.includes('scenario_chosen')) this.db.exec('ALTER TABLE kontur_sessions ADD COLUMN scenario_chosen INTEGER NOT NULL DEFAULT 0');
  }

  transaction(callback) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = callback();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  stateKey(scenario) {
    if (!['demo', 'empty'].includes(scenario)) throw new DomainError('Неизвестный сценарий.');
    return scenario === 'demo' ? 'main' : 'empty';
  }

  readState(scenario = 'demo') {
    const key = this.stateKey(scenario);
    let row = this.db.prepare('SELECT body FROM kontur_state WHERE id = ?').get(key);
    if (!row) {
      const seed = scenario === 'empty' ? createEmptyState() : createSeed();
      this.db.prepare('INSERT OR IGNORE INTO kontur_state (id, revision, body) VALUES (?, ?, ?)')
        .run(key, seed.revision, JSON.stringify(seed));
      row = this.db.prepare('SELECT body FROM kontur_state WHERE id = ?').get(key);
    }
    const original = JSON.parse(row.body);
    const migrated = migrateState(original);
    if (migrated.changed) {
      migrated.state.revision = original.revision + 1;
      this.writeState(migrated.state, original.revision, scenario);
    }
    return migrated.state;
  }

  writeState(state, previousRevision, scenario = 'demo') {
    const result = this.db.prepare('UPDATE kontur_state SET revision = ?, body = ? WHERE id = ? AND revision = ?')
      .run(state.revision, JSON.stringify(state), this.stateKey(scenario), previousRevision);
    if (result.changes !== 1) {
      throw new DomainError('Данные изменились в другой вкладке. Обновите экран и повторите действие.', 409);
    }
  }

  session(cookieId) {
    if (typeof cookieId === 'string' && /^[a-f0-9-]{36}$/.test(cookieId)) {
      const saved = this.db.prepare('SELECT * FROM kontur_sessions WHERE id = ?').get(cookieId);
      if (saved) {
        return {id: cookieId, created: false, scenario: saved.scenario, scenarioChosen: Boolean(saved.scenario_chosen)};
      }
    }
    const id = randomUUID();
    this.db.prepare('INSERT INTO kontur_sessions (id, actor_id) VALUES (?, ?)').run(id, 'engineer');
    return {id, created: true, scenario: 'demo', scenarioChosen: false};
  }

  selectScenario(id, scenario) {
    this.stateKey(scenario);
    this.db.prepare('UPDATE kontur_sessions SET scenario = ?, scenario_chosen = 1, actor_id = ? WHERE id = ?')
      .run(scenario, scenario === 'empty' ? 'po' : 'engineer', id);
  }

  actorFor(id, state) {
    const session = this.db.prepare('SELECT actor_id FROM kontur_sessions WHERE id = ?').get(id);
    return state.people.find(person => person.id === session?.actor_id) || state.people[0];
  }

  selectActor(id, actorId, state) {
    if (!state.people.some(person => person.id === actorId)) throw new DomainError('Пользователь не найден.', 404);
    this.db.prepare('UPDATE kontur_sessions SET actor_id = ? WHERE id = ?').run(actorId, id);
  }

  close() {
    this.db.close();
  }
}
