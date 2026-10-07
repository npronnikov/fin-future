import React from '../react.js';
import { ui } from '../../app/controller.js';
export const money = (amount = 0) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(amount / 100) + ' d₽';
export const date = (value) => value ? new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
export const short = (value = '') => value.replace('sha256:', '').slice(0, 12);
const labels = { Ready: 'Готово', Pending: 'Ожидает', Running: 'Выполняется', WaitingInput: 'Нужен ответ', WaitingApproval: 'На ревью', Accepted: 'Принято', Failed: 'Ошибка', Cancelled: 'Отменено', Blocked: 'Заблокировано', Paused: 'На паузе', Draft: 'Черновик', Published: 'Опубликовано', Proposed: 'Предложено', InReview: 'На проверке', Approved: 'Одобрено', Answered: 'Ответ получен', ReworkRequested: 'Доработка', Superseded: 'Заменено', Revoked: 'Отозвано', Configured: 'Настроен', Admitted: 'Допущен', Active: 'Активно', Completed: 'Завершено', Installing: 'Установка', TechnicalReview: 'Техническое ревью', ScopeReview: 'Решение PO', AwaitingUAT: 'Ожидает UAT', UATAccepted: 'UAT принят', Backlog: 'Бэклог', InProgress: 'В работе', NeedsInput: 'Нужен ответ', InDoubt: 'Эффект неизвестен', HumanOwned: 'Управляет человек', TakeoverRequested: 'Передача управления', Done: 'Готово', Planned: 'План', AwaitingPO: 'Решение PO', Suspended: 'Приостановлено', Validating: 'Проверка', Provisioning: 'Подготовка', Attesting: 'Аттестация', Provisioned: 'Создано', ReportOnly: 'Только отчёт' };
export const statusLabel = (value) => labels[value] || value;
export function Badge({ value, label }) { const tone = ['Accepted', 'Ready', 'Published', 'Admitted', 'Active', 'Completed', 'Done', 'Approved', 'Answered'].includes(value) ? 'good' : ['Failed', 'Revoked', 'Blocked', 'InDoubt', 'Cancelled'].includes(value) ? 'bad' : ['Pending', 'WaitingInput', 'WaitingApproval', 'ReworkRequested', 'InReview', 'ScopeReview', 'AwaitingPO'].includes(value) ? 'warn' : 'muted'; return React.createElement("span", { className: 'badge ' + tone },
    React.createElement("span", { className: "badge-dot" }),
    label || statusLabel(value)); }
export function Icon({ name, size = 20 }) { const paths = { home: React.createElement("path", { d: "m3 11 9-8 9 8M5 10v11h5v-6h4v6h5V10" }), chat: React.createElement("path", { d: "M21 15a3 3 0 0 1-3 3H8l-5 4V5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z M7 8h10M7 12h7" }), tasks: React.createElement("g", null,
        React.createElement("rect", { x: "4", y: "3", width: "16", height: "18", rx: "3" }),
        React.createElement("path", { d: "m7 9 1 1 2-3m2 2h5m-10 7 1 1 2-3m2 2h5" })), inbox: React.createElement("g", null,
        React.createElement("path", { d: "m4 4-2 10v6h20v-6L20 4Z M2 14h6l1 3h6l1-3h6" })), flow: React.createElement("g", null,
        React.createElement("rect", { x: "2", y: "3", width: "6", height: "6", rx: "1" }),
        React.createElement("rect", { x: "16", y: "3", width: "6", height: "6", rx: "1" }),
        React.createElement("rect", { x: "9", y: "16", width: "6", height: "6", rx: "1" }),
        React.createElement("path", { d: "M8 6h8M12 6v10" })), layers: React.createElement("path", { d: "m12 3 10 5-10 5L2 8Z M2 12l10 5 10-5M2 16l10 5 10-5" }), book: React.createElement("g", null,
        React.createElement("path", { d: "M12 5v16M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z" })), play: React.createElement("path", { d: "m8 4 12 8L8 20Z" }), box: React.createElement("g", null,
        React.createElement("path", { d: "m12 2 10 5v10l-10 5-10-5V7Z M2 7l10 5 10-5M12 12v10M7 4l10 5" })), cloud: React.createElement("path", { d: "M6 19a5 5 0 0 1-1-10 7 7 0 0 1 13-2 6 6 0 0 1 0 12Z" }), team: React.createElement("g", null,
        React.createElement("circle", { cx: "9", cy: "8", r: "3" }),
        React.createElement("path", { d: "M2 21v-3a7 7 0 0 1 14 0v3M16 5a3 3 0 0 1 0 6m3 3a6 6 0 0 1 3 5v2" })), spark: React.createElement("g", null,
        React.createElement("path", { d: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" })), chart: React.createElement("path", { d: "M3 3v18h18M7 16l4-5 4 2 6-8" }), check: React.createElement("path", { d: "m5 12 4 4L19 6" }), close: React.createElement("path", { d: "m6 6 12 12M6 18 18 6" }), plus: React.createElement("path", { d: "M12 4v16M4 12h16" }), arrow: React.createElement("path", { d: "M4 12h16m-6-6 6 6-6 6" }), search: React.createElement("g", null,
        React.createElement("circle", { cx: "10", cy: "10", r: "6" }),
        React.createElement("path", { d: "m15 15 6 6" })), menu: React.createElement("path", { d: "M3 6h18M3 12h18M3 18h18" }), shield: React.createElement("path", { d: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Zm-5 9 3 3 7-7" }), clock: React.createElement("g", null,
        React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
        React.createElement("path", { d: "M12 6v6l4 2" })), settings: React.createElement("g", null,
        React.createElement("path", { d: "M4 6h16M4 12h16M4 18h16" }),
        React.createElement("circle", { cx: "8", cy: "6", r: "2" }),
        React.createElement("circle", { cx: "16", cy: "12", r: "2" }),
        React.createElement("circle", { cx: "9", cy: "18", r: "2" })), logout: React.createElement("path", { d: "M9 3H3v18h6m5-15 6 6-6 6M7 12h13" }) }; return React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.65", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, paths[name] || paths.box); }
export function Button({ children, onClick, variant = 'primary', icon, disabled = false, type = 'button', small = false, ...props }) { return React.createElement("button", { type: type, className: 'btn ' + variant + (small ? ' small' : ''), onClick: onClick, disabled: disabled || ui.busy, ...props },
    icon && React.createElement(Icon, { name: icon, size: 17 }),
    React.createElement("span", null, children)); }
export function Heading({ eyebrow, title, description, actions }) { return React.createElement("div", { className: "page-heading" },
    React.createElement("div", null,
        eyebrow && React.createElement("div", { className: "eyebrow" }, eyebrow),
        React.createElement("h1", null, title),
        description && React.createElement("p", null, description)),
    actions && React.createElement("div", { className: "heading-actions" }, actions)); }
export function Empty({ icon = 'box', title, description, action }) { return React.createElement("div", { className: "empty" },
    React.createElement("div", { className: "empty-icon" },
        React.createElement(Icon, { name: icon, size: 30 })),
    React.createElement("h3", null, title),
    React.createElement("p", null, description),
    action); }
export function Field({ label, form, field, defaultValue = '', type = 'text', options, placeholder, required = false, help, rows = 4, onChange, ...rest }) { const f = ui.form(form), value = f[field] ?? defaultValue; const change = (e) => onChange ? onChange(e.target.value) : ui.set(form, field, type === 'checkbox' ? e.target.checked : e.target.value); const id = (form + '-' + field).replace(/[^a-z0-9_-]/gi, '-'); return React.createElement("label", { className: "field", htmlFor: id },
    React.createElement("span", null,
        label,
        required && React.createElement("b", { className: "required" }, " *")),
    options ? React.createElement("select", { id: id, value: value, onChange: change, ...rest }, options.map((o) => React.createElement("option", { key: o.value ?? o.id ?? o, value: o.value ?? o.id ?? o }, o.label ?? o.name ?? o))) : type === 'textarea' ? React.createElement("textarea", { id: id, value: value, rows: rows, placeholder: placeholder, onChange: change, ...rest }) : React.createElement("input", { id: id, type: type, value: type === 'checkbox' ? undefined : value, checked: type === 'checkbox' ? Boolean(value) : undefined, onChange: change, placeholder: placeholder, required: required, ...rest }),
    " ",
    help && React.createElement("small", null, help)); }
export function SelectField({ label, value, onChange, items, placeholder, ...props }) { return React.createElement("label", { className: "field" },
    React.createElement("span", null, label),
    React.createElement("select", { value: value || '', onChange: (e) => onChange(e.target.value), ...props },
        placeholder && React.createElement("option", { value: "" }, placeholder),
        items.map((e) => React.createElement("option", { key: e.id ?? e.value, value: e.id ?? e.value }, e.name ?? e.title ?? e.label)))); }
export function ErrorBox() {
    if (!ui.error)
        return null;
    return React.createElement("div", { className: "error-box", role: "alert" },
        React.createElement(Icon, { name: "shield" }),
        React.createElement("div", null,
            React.createElement("b", null, ui.error.message || 'Ошибка'),
            ui.error.code && React.createElement("small", null, ui.error.code),
            Object.entries(ui.error.fields || {}).map(([key, value]) => React.createElement("p", { key: key },
                key,
                ": ",
                typeof value === 'string' ? value : JSON.stringify(value)))));
}
export function Panel({ title, meta, actions, children, className = '' }) { return React.createElement("section", { className: 'panel ' + className },
    title && React.createElement("div", { className: "panel-head" },
        React.createElement("div", null,
            React.createElement("h2", null, title),
            meta && React.createElement("small", null, meta)),
        actions),
    children); }
export function Tabs({ items, current, onChange }) { return React.createElement("div", { className: "tabs" }, items.map((it) => React.createElement("button", { key: it.id, className: current === it.id ? 'active' : '', onClick: () => onChange(it.id) },
    it.label,
    it.count !== undefined && React.createElement("span", null, it.count)))); }
export function Metric({ label, value, detail, icon }) { return React.createElement("div", { className: "metric-card" },
    React.createElement("div", { className: "metric-top" },
        label,
        icon && React.createElement(Icon, { name: icon, size: 18 })),
    React.createElement("strong", null, value),
    React.createElement("small", null, detail)); }
export function Digest({ value, label = 'SNAPSHOT' }) { return React.createElement("span", { className: "digest", title: value },
    label,
    " ",
    React.createElement("code", null, short(value) || '—')); }
export function Avatar({ id, ai = false, name }) { const u = ui.data?.catalog.users.find((u) => u.id === id); return React.createElement("span", { className: 'avatar ' + (ai ? 'ai' : id || ''), title: name || u?.name }, ai ? React.createElement(Icon, { name: "spark", size: 18 }) : u?.initials || name?.slice(0, 2) || 'К'); }
export function RunCard({ run, compact = false }) { const task = ui.entity('tasks', run.taskId), def = ui.entity('definitions', ui.entity('snapshots', run.snapshotId)?.definitionId), env = ui.entity('environments', run.environmentId); const gate = ui.all('gates').find(g => g.runId === run.id && g.status === 'Pending'); return React.createElement("div", { className: 'run-card ' + (compact ? 'compact' : '') },
    React.createElement("div", { className: "run-card-top" },
        React.createElement("span", { className: "run-type" },
            React.createElement(Icon, { name: def?.kind === 'team' ? 'team' : 'flow', size: 17 }),
            run.mode?.toUpperCase(),
            " ",
            React.createElement("span", null, "\u00B7"),
            " ",
            env?.name || 'Sandbox'),
        React.createElement(Badge, { value: run.status })),
    React.createElement("button", { className: "link-title", onClick: () => ui.go('runs', run.id) }, task?.title || 'Запуск'),
    React.createElement("p", null, def?.name || run.assignedRole || 'Зафиксированная конфигурация'),
    React.createElement("div", { className: "run-meta" },
        React.createElement(Digest, { value: run.configurationDigest }),
        React.createElement("span", null,
            "\u041F\u043E\u043F\u044B\u0442\u043A\u0430 ",
            run.attempt)),
    !compact && React.createElement("div", { className: "run-card-footer" },
        React.createElement("span", { className: "people" },
            React.createElement(Avatar, { id: run.reviewerId }),
            React.createElement("span", null, date(run.startedAt || run.createdAt))),
        gate ? React.createElement(Button, { variant: "secondary", small: true, onClick: () => void ui.openGate(gate.id) }, gate.kind === 'input' ? 'Ответить' : 'Открыть ревью') : React.createElement(Button, { variant: "ghost", small: true, onClick: () => ui.go('channels', run.channelId, run.threadId) },
            "\u041A \u043E\u0431\u0441\u0443\u0436\u0434\u0435\u043D\u0438\u044E ",
            React.createElement(Icon, { name: "arrow", size: 14 })))); }
export function Markdown({ text = '' }) {
    let code = false;
    return React.createElement("div", { className: "markdown" }, text.split('\n').map((line, i) => {
        if (line.startsWith('```')) {
            code = !code;
            return React.createElement("div", { className: "code-boundary", key: i });
        }
        if (code)
            return React.createElement("pre", { key: i }, line || ' ');
        if (line.startsWith('### '))
            return React.createElement("h4", { key: i }, line.slice(4));
        if (line.startsWith('## '))
            return React.createElement("h3", { key: i }, line.slice(3));
        if (line.startsWith('# '))
            return React.createElement("h2", { key: i }, line.slice(2));
        if (line.startsWith('- '))
            return React.createElement("p", { key: i },
                "\u2022 ",
                line.slice(2));
        return React.createElement("p", { key: i }, line || '\u00a0');
    }));
}
export function Diff({ content = '' }) { return React.createElement("pre", { className: "diff", tabIndex: 0, "aria-label": "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u043E \u0441\u0442\u0440\u043E\u043A\u0430\u043C" }, content.split('\n').map((line, i) => React.createElement("span", { key: i, className: line.startsWith('+') && !line.startsWith('+++') ? 'add' : line.startsWith('-') && !line.startsWith('---') ? 'remove' : line.startsWith('@@') ? 'hunk' : '' },
    React.createElement("i", null, i + 1),
    line || ' ',
    '\n'))); }
