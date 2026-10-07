import fs from 'node:fs';
import path from 'node:path';
import { blankState, canonical, digest, DomainError } from '../domain/core.mjs';
/** Single writer. A rejected commit never replaces live memory or emits events. */
export class JsonStore {
    constructor(directory) { this.directory = path.resolve(directory); fs.mkdirSync(this.directory, { recursive: true, mode: 0o700 }); this.file = path.join(this.directory, 'state.json'); this.backup = path.join(this.directory, 'state.backup.json'); this.lock = path.join(this.directory, 'writer.lock'); this.listeners = new Set(); this.failNext = false; this.recovery = null; this.acquire(); try {
        this.state = this.load();
    }
    catch (e) {
        this.close();
        throw e;
    } }
    acquire() { try {
        const fd = fs.openSync(this.lock, 'wx', 0o600);
        fs.writeFileSync(fd, String(process.pid));
        fs.closeSync(fd);
    }
    catch (e) {
        if (e.code !== 'EEXIST')
            throw e;
        let pid = Number(fs.readFileSync(this.lock, 'utf8'));
        let active = true;
        try {
            process.kill(pid, 0);
        }
        catch (err) {
            if (err.code === 'ESRCH')
                active = false;
        }
        if (active)
            throw new Error('Data-directory занята другим процессом: ' + pid);
        fs.unlinkSync(this.lock);
        return this.acquire();
    } }
    parse(file) { const wrapper = JSON.parse(fs.readFileSync(file, 'utf8')); if (!wrapper.state || wrapper.checksum !== digest(wrapper.state) || wrapper.state.schemaVersion !== 6)
        throw new Error('Checksum/schema mismatch'); if (!wrapper.state.entities || !wrapper.state.ledger || !Array.isArray(wrapper.state.jobs))
        throw new Error('Invalid snapshot'); return wrapper.state; }
    load() { if (!fs.existsSync(this.file)) {
        if (fs.existsSync(this.backup)) {
            this.recovery = { mode: 'backup', reason: 'Основной snapshot отсутствует', source: 'state.backup.json' };
            return this.parse(this.backup);
        }
        const s = blankState();
        this.save(s, false);
        return s;
    } try {
        return this.parse(this.file);
    }
    catch (e) {
        if (!fs.existsSync(this.backup))
            throw new Error('RECOVERY_REQUIRED: основной snapshot повреждён, проверенного backup нет. Данные не сброшены.');
        const state = this.parse(this.backup);
        this.recovery = { mode: 'read-only', reason: 'Основной snapshot повреждён. Загружен проверенный backup; подтвердите восстановление.', source: 'state.backup.json' };
        return state;
    } }
    save(next, backup = true) { if (this.failNext) {
        this.failNext = false;
        throw new DomainError('StorageUnavailable', 'Тестовый сбой записи. Состояние не изменено.', 503, {}, ['retry']);
    } const tmp = this.file + '.tmp'; const bytes = JSON.stringify({ checksum: digest(next), state: next }); let fd; try {
        fd = fs.openSync(tmp, 'w', 0o600);
        fs.writeFileSync(fd, bytes);
        fs.fsyncSync(fd);
        fs.closeSync(fd);
        fd = undefined;
        if (backup && fs.existsSync(this.file)) {
            this.parse(this.file);
            const btmp = this.backup + '.tmp';
            fs.copyFileSync(this.file, btmp);
            const bfd = fs.openSync(btmp, 'r');
            fs.fsyncSync(bfd);
            fs.closeSync(bfd);
            fs.renameSync(btmp, this.backup);
        }
        fs.renameSync(tmp, this.file);
        try {
            const d = fs.openSync(this.directory, 'r');
            fs.fsyncSync(d);
            fs.closeSync(d);
        }
        catch { /* directory fsync not supported on every OS */ }
    }
    catch (e) {
        if (fd !== undefined)
            try {
                fs.closeSync(fd);
            }
            catch { }
        try {
            fs.unlinkSync(tmp);
        }
        catch { }
        if (e instanceof DomainError)
            throw e;
        throw new DomainError('StorageUnavailable', 'Не удалось сохранить snapshot: ' + e.message, 503, {}, ['retry']);
    } }
    transact(fn) { if (this.recovery)
        throw new DomainError('StorageUnavailable', 'Recovery mode: сначала подтвердите восстановление из backup.', 503, {}, ['recover']); const next = structuredClone(this.state); const before = this.state.sequence; const result = fn(next); if (result instanceof Promise)
        throw new Error('Async transaction callbacks are not supported'); delete next.currentActionId; this.save(next); this.state = next; for (const listener of this.listeners) {
        try {
            listener(next.events.filter(e => e.sequence > before));
        }
        catch (e) {
            console.error('Projection subscriber:', e.message);
        }
    } return result; }
    recover() { if (!this.recovery)
        return { recovered: false }; const corrupt = this.file + '.corrupt-' + Date.now(); if (fs.existsSync(this.file))
        fs.renameSync(this.file, corrupt); this.save(this.state, false); this.recovery = null; return { recovered: true, source: 'verified-backup', preserved: path.basename(corrupt) }; }
    close() { try {
        if (fs.readFileSync(this.lock, 'utf8') === String(process.pid))
            fs.unlinkSync(this.lock);
    }
    catch { } }
}
