import { request, downloadJSON, APIError } from '../shared/data/api.js';
export class UIController {
    data = null;
    user = null;
    spaceId = '';
    projectId = '';
    route = 'spaces';
    objectId = '';
    threadId = '';
    channelId = '';
    modal = null;
    gateId = '';
    challenge = null;
    forms = {};
    listeners = new Set();
    busy = false;
    loading = true;
    offline = false;
    error = null;
    toast = '';
    navOpen = false;
    events = null;
    generation = 0;
    lastEvent = 0;
    focusOrigin = null;
    searchResults = [];
    audit = [];
    loadingText = '';
    refreshTimer;
    toastTimer;
    setupTimer;
    drag;
    subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    changed() {
        for (const fn of this.listeners)
            fn();
    }
    all(type) { return this.data?.entities[type] || []; }
    entity(type, id) { return this.all(type).find(e => e.id === id); }
    get space() { return this.entity('spaces', this.spaceId); }
    get project() { return this.entity('projects', this.projectId) || this.all('projects')[0]; }
    scoped(type) { return this.all(type).filter(e => e.spaceId === this.spaceId && (!this.projectId || !e.projectId || e.projectId === this.projectId)); }
    form(key, defaults = {}) {
        if (!this.forms[key])
            this.forms[key] = { ...defaults };
        return this.forms[key];
    }
    set(key, field, value) { this.form(key)[field] = value; this.persistForms(); this.changed(); }
    persistForms() {
        try {
            sessionStorage.setItem('kontur:drafts:' + this.user?.id + ':' + this.spaceId, JSON.stringify(this.forms));
        }
        catch { }
    }
    restoreForms() {
        try {
            this.forms = JSON.parse(sessionStorage.getItem('kontur:drafts:' + this.user?.id + ':' + this.spaceId) || '{}');
        }
        catch {
            this.forms = {};
        }
    }
    async init() {
        window.addEventListener('popstate', () => { this.parseRoute(); this.changed(); });
        window.addEventListener('online', () => { this.offline = false; void this.refresh(); });
        window.addEventListener('offline', () => { this.offline = true; this.changed(); });
        document.addEventListener('keydown', e => this.keyboard(e));
        try {
            this.data = await request('/bootstrap');
            this.user = this.data.user;
        }
        catch {
            const session = await request('/demo/session', { userId: 'maxim' });
            this.user = session.user;
        }
        this.parseRoute();
        this.restoreForms();
        await this.refresh();
        this.loading = false;
        this.changed();
    }
    parseRoute() {
        const routeURL = new URL(location.hash.startsWith('#/') ? location.hash.slice(1) : location.href, 'http://kontur.local');
        const parts = routeURL.pathname.split('/').filter(Boolean);
        if (parts[0] === 's' && parts[1]) {
            this.spaceId = parts[1];
            this.route = parts[2] || 'work';
            if (this.route === 'platform') {
                this.route = parts[3] || 'resources';
                this.objectId = parts[4] || '';
            }
            else
                this.objectId = parts[3] || '';
            if (this.route === 'channels')
                this.channelId = this.objectId;
            this.threadId = routeURL.searchParams.get('thread') || '';
        }
        else {
            this.route = 'spaces';
            this.spaceId = '';
            this.objectId = '';
        }
    }
    path(route, id = '') {
        if (route === 'spaces')
            return '/spaces';
        if (['resources', 'installations', 'bindings'].includes(route))
            return `/s/${this.spaceId}/platform/${route}${id ? '/' + id : ''}`;
        return `/s/${this.spaceId}/${route}${id ? '/' + id : ''}`;
    }
    go(route, id = '', threadId = '') {
        const url = this.path(route, id) + (threadId ? '?thread=' + encodeURIComponent(threadId) : '');
        if (location.protocol === 'about:')
            location.hash = url;
        else
            history.pushState({}, '', url);
        this.parseRoute();
        this.navOpen = false;
        this.error = null;
        this.changed();
        if (route === 'audit')
            void this.loadAudit();
        document.getElementById('main-scroll')?.scrollTo(0, 0);
    }
    async selectSpace(id) { this.events?.close(); this.events = null; this.generation++; this.spaceId = id; this.projectId = ''; this.restoreForms(); await this.refresh(); this.go('work'); }
    async identity(userId) {
        if (this.busy)
            return;
        const previousSpace = this.spaceId;
        this.generation++;
        this.events?.close();
        this.events = null;
        this.data = null;
        this.forms = {};
        this.gateId = '';
        this.challenge = null;
        this.modal = null;
        this.error = null;
        this.loading = true;
        this.changed();
        try {
            const session = await request('/demo/session', { userId });
            this.user = session.user;
            this.spaceId = '';
            this.projectId = '';
            this.restoreForms();
            await this.refresh();
            if (previousSpace && this.all('spaces').some(s => s.id === previousSpace)) {
                await this.selectSpace(previousSpace);
            }
            else
                this.go('spaces');
        }
        catch (e) {
            this.error = e;
        }
        finally {
            this.loading = false;
            this.changed();
        }
    }
    async refresh() {
        const generation = this.generation, space = this.spaceId;
        try {
            const data = await request('/bootstrap' + (space ? '?spaceId=' + encodeURIComponent(space) : ''));
            if (generation !== this.generation || space !== this.spaceId)
                return;
            this.data = data;
            this.user = data.user;
            this.offline = false;
            this.lastEvent = Math.max(this.lastEvent, data.sequence);
            if (space && !this.events)
                this.connect();
            this.changed();
        }
        catch (e) {
            if (generation !== this.generation)
                return;
            if (e instanceof APIError && e.code === 'Forbidden' && this.spaceId) {
                this.spaceId = '';
                this.go('spaces');
                return this.refresh();
            }
            this.offline = true;
            this.error = e;
            this.changed();
        }
    }
    connect() {
        this.events?.close();
        const generation = this.generation;
        this.events = new EventSource('/api/v1/events?spaceId=' + encodeURIComponent(this.spaceId) + '&after=' + this.data.sequence);
        this.events.addEventListener('domain', (ev) => {
            if (generation !== this.generation)
                return;
            const event = JSON.parse(ev.data);
            if (event.sequence <= this.lastEvent)
                return;
            this.lastEvent = event.sequence;
            clearTimeout(this.refreshTimer);
            this.refreshTimer = setTimeout(() => void this.refresh(), 90);
        });
        this.events.onopen = () => { this.offline = false; this.changed(); };
        this.events.onerror = () => { this.offline = true; this.changed(); };
    }
    notice(text) { this.toast = text; clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => { this.toast = ''; this.changed(); }, 4500); this.changed(); }
    async cmd(type, payload = {}, target, extra = {}) {
        if (this.offline)
            throw new APIError({ code: 'Offline', message: 'Нет связи с сервером. Решение не сохранено.' });
        const targetId = typeof target === 'string' ? target : target?.id;
        const expectedRevision = typeof target === 'object' ? target.revision : undefined;
        const response = await request('/commands', { actionId: crypto.randomUUID(), type, ...(this.spaceId ? { spaceId: this.spaceId } : {}), ...(targetId ? { targetId } : {}), ...(expectedRevision !== undefined ? { expectedRevision } : {}), payload, ...extra });
        await this.refresh();
        return response.commandResult;
    }
    async act(fn, success = 'Команда сохранена') {
        if (this.busy)
            return;
        this.busy = true;
        this.error = null;
        this.changed();
        try {
            const result = await fn();
            if (success)
                this.notice(success);
            return result;
        }
        catch (e) {
            this.error = e;
            this.changed();
            return null;
        }
        finally {
            this.busy = false;
            this.changed();
        }
    }
    open(kind, data) { this.focusOrigin = document.activeElement; this.modal = { kind, data }; this.error = null; this.changed(); setTimeout(() => document.querySelector('[data-autofocus]')?.focus(), 30); }
    close() { this.modal = null; this.gateId = ''; this.challenge = null; this.error = null; this.changed(); setTimeout(() => this.focusOrigin?.focus(), 20); }
    keyboard(e) {
        if (e.key === 'Escape') {
            if (this.modal || this.gateId)
                this.close();
            else {
                this.navOpen = false;
                this.changed();
            }
            return;
        }
        if (e.key === 'Tab' && (this.modal || this.gateId)) {
            const root = document.querySelector('[role="dialog"]');
            const focusables = Array.from(root?.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]') || []).filter(e => e.offsetParent !== null);
            if (!focusables.length)
                return;
            const first = focusables[0], last = focusables.at(-1);
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
            }
            else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
    async openGate(gateId) {
        this.focusOrigin = document.activeElement;
        this.gateId = gateId;
        this.challenge = null;
        this.error = null;
        this.changed();
        try {
            const ch = await request('/gates/' + gateId + '/challenges', {});
            if (this.gateId !== gateId)
                return;
            this.challenge = ch;
            this.changed();
            setTimeout(() => document.querySelector('[data-autofocus]')?.focus(), 30);
        }
        catch (e) {
            this.error = e;
            this.changed();
        }
    }
    async submitGate(decision) {
        const gate = this.entity('gates', this.gateId), ch = this.challenge;
        if (!gate || !ch)
            return;
        const form = this.form('gate:' + gate.id);
        await this.act(async () => {
            const payload = { challengeId: ch.id, targetDigest: ch.artifactBundleDigest, ...(gate.kind === 'input' ? { answer: { behavior: form.behavior || 'separate', explanation: form.explanation || '' } } : { decision, reason: form.reason || '', expectedFix: form.expectedFix || '', targetNodeId: form.targetNodeId || 'implement', humanTimeMs: Number(form.minutes ?? 1) * 60000 }) };
            const result = await this.cmd(gate.kind === 'input' ? 'gate.answer' : 'gate.decide', payload, gate.id, { expectedRevision: ch.expectedRevision });
            this.close();
            if (decision === 'rework')
                this.open('save-knowledge', result.decision);
            return result;
        }, gate.kind === 'input' ? 'Ответ сохранён, Run продолжен' : decision === 'rework' ? 'Доработка начата' : 'Решение сохранено');
    }
    autosaveSetup(setup, field, value) {
        this.set('setup:' + setup.id, field, value);
        clearTimeout(this.setupTimer);
        this.setupTimer = setTimeout(() => {
            const current = this.entity('setups', setup.id);
            if (!current)
                return;
            void this.act(() => this.cmd('setup.save', { fields: this.form('setup:' + setup.id) }, current), '');
        }, 500);
    }
    async loadAudit() {
        try {
            this.audit = (await request('/spaces/' + this.spaceId + '/audit')).items;
            this.changed();
        }
        catch (e) {
            this.error = e;
            this.changed();
        }
    }
    async search(q) {
        try {
            this.searchResults = (await request('/spaces/' + this.spaceId + '/search?q=' + encodeURIComponent(q))).items;
            this.changed();
        }
        catch (e) {
            this.error = e;
            this.changed();
        }
    }
    async exportSpace() { const data = await request('/demo/export', { spaceId: this.spaceId }); downloadJSON('kontur-space-export.json', data); }
    async createPrepared() {
        await this.act(async () => {
            this.loadingText = 'Подготовленный пример: создание связанного пространства';
            const login = async (id) => { const ses = await request('/demo/session', { userId: id }); this.user = ses.user; this.events?.close(); this.events = null; };
            await login('maxim');
            const space = await this.cmd('space.create', { name: 'Команда цифровых сервисов', goal: 'Понятные статусы заявок', origin: 'fixture' });
            this.spaceId = space.id;
            this.generation++;
            const plan = await this.cmd('plan.create', { template: 'minimal' });
            await this.cmd('provision.start', { confirm: true }, plan);
            for (let i = 0; i < 4; i++)
                await this.cmd('simulator.step');
            const env = this.all('environments').find(e => e.kind === 'Sandbox');
            const installation = await this.cmd('installation.create', { profile: 'hg', environmentId: env.id });
            for (let i = 0; i < 5; i++)
                await this.cmd('simulator.step');
            await login('anna');
            const project = await this.cmd('project.create', { name: 'Статусы заявок', installationId: installation.id, goal: 'Отличать пустой список от недоступного источника' });
            await login('maxim');
            for (const kind of ['repo', 'ci', 'model', 'tracker'])
                await this.cmd('binding.create', { projectId: project.id, installationId: installation.id, kind });
            await login('ivan');
            await this.cmd('definition.create', { projectId: project.id, name: 'Статусы заявок · SDLC', kind: 'flow' });
            await this.cmd('actor.create', { name: 'Алекс · AI-разработчик', projectId: project.id, template: 'developer' });
            await this.refresh();
            this.projectId = project.id;
            this.go('work');
            this.loadingText = '';
        }, 'Подготовленный fixture загружен. История запусков пока пуста.');
        this.loadingText = '';
        this.changed();
    }
}
export const ui = new UIController();
