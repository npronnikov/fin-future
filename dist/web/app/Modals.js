import React from '../shared/react.js';
import { ui } from './controller.js';
import { Button, Icon, Field, ErrorBox, Digest, money } from '../shared/ui/index.js';
function F(p) { const { kind, data = {} } = ui.modal; const key = 'modal:' + kind + ':' + (data.id || data.definitionId || 'new'); return React.createElement(Field, { form: key, ...p }); }
export function Modals() {
    if (!ui.modal)
        return null;
    const { kind, data = {} } = ui.modal;
    const key = 'modal:' + kind + ':' + (data.id || data.definitionId || 'new');
    let title = '', subtitle = '', submit = 'Сохранить', fields = null, defaults = {}, handler = async () => { }, after = () => { };
    const options = (type, predicate = () => true) => ui.scoped(type).filter(predicate).map(e => ({ value: e.id, label: e.name || e.title || e.id }));
    const projects = options('projects');
    const readyEnvs = options('environments', e => e.status === 'Ready');
    const inst = options('installations', e => e.status === 'Ready');
    switch (kind) {
        case 'space':
            title = 'Новое командное пространство';
            subtitle = 'Никакие ресурсы и релизы не создаются автоматически.';
            submit = 'Создать пространство';
            defaults = { name: '', goal: '', budget: 500000, timezone: 'Europe/Amsterdam', memberIds: ui.data?.catalog.users.map((u) => u.id) || ['anna', 'ivan', 'maria', 'maxim'] };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B", field: "name", required: true, placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, \u041A\u043E\u043C\u0430\u043D\u0434\u0430 \u0446\u0438\u0444\u0440\u043E\u0432\u044B\u0445 \u0441\u0435\u0440\u0432\u0438\u0441\u043E\u0432", "data-autofocus": true }),
                React.createElement(F, { label: "\u041E\u0431\u0449\u0430\u044F \u0446\u0435\u043B\u044C", field: "goal", type: "textarea", rows: 3, placeholder: "\u0417\u0430\u0447\u0435\u043C \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u044D\u0442\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u0430?" }),
                React.createElement("div", { className: "form-grid" },
                    React.createElement(F, { label: "\u041B\u0438\u043C\u0438\u0442, \u0432 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0445 demo-\u0435\u0434\u0438\u043D\u0438\u0446\u0430\u0445", field: "budget", type: "number", min: "1000", help: "100 \u0435\u0434\u0438\u043D\u0438\u0446 = 1 d\u20BD. \u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0435 \u0434\u0435\u043D\u044C\u0433\u0438 \u043D\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u0443\u044E\u0442\u0441\u044F." }),
                    React.createElement(F, { label: "\u0427\u0430\u0441\u043E\u0432\u043E\u0439 \u043F\u043E\u044F\u0441", field: "timezone" })),
                React.createElement("div", { className: "member-picker" },
                    React.createElement("h3", null, "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u0438 \u0442\u0440\u0438 \u0440\u043E\u043B\u0438"),
                    ui.data?.catalog.users.map((u) => React.createElement("label", { className: "checkbox-row", key: u.id },
                        React.createElement("input", { type: "checkbox", checked: ui.form(key, defaults).memberIds.includes(u.id), onChange: (e) => { const ids = ui.form(key).memberIds; ui.set(key, 'memberIds', e.target.checked ? [...ids, u.id] : ids.filter((id) => id !== u.id)); } }),
                        React.createElement("span", null,
                            React.createElement("b", null, u.name),
                            React.createElement("small", null, u.title))))));
            handler = f => ui.cmd('space.create', { ...f, budget: Number(f.budget) });
            after = r => { void ui.selectSpace(r.id).then(() => ui.go('setup')); };
            break;
        case 'project':
            title = 'Новый проект';
            subtitle = 'Цель, owner, инженер, канал и task classes создаются вместе.';
            submit = 'Создать проект';
            defaults = { name: 'Статусы заявок', goal: 'Различать пустую выдачу и недоступный источник', installationId: inst[0]?.value || '', engineerId: 'ivan', budget: 100000 };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "name", required: true, "data-autofocus": true }),
                React.createElement(F, { label: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432\u0430\u044F \u0446\u0435\u043B\u044C", field: "goal", type: "textarea" }),
                React.createElement(F, { label: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u0430\u044F \u043E\u0441\u043D\u043E\u0432\u0430", field: "installationId", options: inst.length ? inst : [{ value: '', label: 'Можно подготовить проект без основы' }] }),
                React.createElement(F, { label: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442-\u0438\u043D\u0436\u0435\u043D\u0435\u0440", field: "engineerId", options: ui.data.catalog.users.filter((u) => u.role === 'engineer' && ui.space?.memberIds.includes(u.id)).map((u) => ({ value: u.id, label: u.name })) }),
                React.createElement(F, { label: "\u0411\u044E\u0434\u0436\u0435\u0442 \u043F\u0440\u043E\u0435\u043A\u0442\u0430, \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0435 demo-\u0435\u0434\u0438\u043D\u0438\u0446\u044B", field: "budget", type: "number" }));
            handler = f => ui.cmd('project.create', { ...f, installationId: f.installationId || undefined, budget: Number(f.budget) });
            after = r => { ui.projectId = r.id; ui.go('projects', r.id); };
            break;
        case 'binding':
            title = 'Подключить инструменты';
            subtitle = 'Сервер проверяет каждое подключение отдельно. Vendor API не вызываются.';
            submit = 'Создать mock bindings';
            defaults = { projectId: ui.project?.id || projects[0]?.value, kind: 'required', actions: 'read,propose' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u041F\u0440\u043E\u0435\u043A\u0442", field: "projectId", options: projects, "data-autofocus": true }),
                React.createElement(F, { label: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435", field: "kind", options: [{ value: 'required', label: 'Обязательный набор: repo + CI + model + tracker' }, { value: 'repo', label: 'Git / repository' }, { value: 'ci', label: 'CI runner' }, { value: 'model', label: 'Своя LLM / model gateway' }, { value: 'tracker', label: 'Issue tracker (read-only)' }, { value: 'broker', label: 'Event broker' }] }),
                React.createElement("div", { className: "info-banner" },
                    React.createElement(Icon, { name: "shield" }),
                    "Repo: read, propose \u00B7 CI: execute \u00B7 Model: execute \u00B7 Tracker: \u0442\u043E\u043B\u044C\u043A\u043E read. Secrets: mock:masked."));
            handler = async (f) => {
                const kinds = f.kind === 'required' ? ['repo', 'ci', 'model', 'tracker'] : [f.kind];
                let last;
                for (const k of kinds)
                    last = await ui.cmd('binding.create', { projectId: f.projectId, kind: k, actions: k === 'tracker' ? ['read'] : k === 'repo' ? ['read', 'propose'] : ['read', 'execute'], installationId: ui.entity('projects', f.projectId)?.installationId || undefined });
                return last;
            };
            after = () => ui.go('bindings');
            break;
        case 'definition':
            title = 'Создать конфигурацию';
            subtitle = 'Начните с исполняемого шаблона. Все Human Gates и checks видимы в графе.';
            submit = 'Создать черновик';
            defaults = { name: data.kind === 'actor' ? 'Actor + Workflow' : 'Статусы заявок · SDLC', projectId: data.projectId || ui.project?.id || projects[0]?.value, kind: data.kind || 'flow', taskClass: 'ui' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "name", required: true, "data-autofocus": true }),
                React.createElement(F, { label: "\u041F\u0440\u043E\u0435\u043A\u0442", field: "projectId", options: projects }),
                React.createElement(F, { label: "\u0421\u043F\u043E\u0441\u043E\u0431 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438", field: "kind", options: [{ value: 'flow', label: 'Flow — граф этапов и Human Gates' }, { value: 'team', label: 'Assistant Team — coordinator и разные планы' }, { value: 'actor', label: 'Actor + Workflow / Hybrid' }] }),
                React.createElement(F, { label: "\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u044B\u0439 TaskClass", field: "taskClass", options: [{ value: 'ui', label: 'Информационный frontend' }, { value: 'docs', label: 'Документация' }] }),
                React.createElement("div", { className: "mini-flow" }, "\u041F\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u2192 \u0412\u043E\u043F\u0440\u043E\u0441 \u2192 \u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u2192 \u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u2192 Review"));
            handler = f => ui.cmd('definition.create', { ...f, actorId: data.actorId });
            after = r => ui.go('studio', r.id);
            break;
        case 'trial': {
            title = 'Пробный запуск';
            subtitle = 'Sandbox + сохранённый draft → immutable snapshot. CapabilityRelease не требуется.';
            submit = 'Начать Trial';
            const defs = options('definitions');
            const sandbox = options('environments', e => e.status === 'Ready' && e.kind === 'Sandbox');
            const selected = ui.entity('definitions', data.definitionId) || ui.scoped('definitions')[0];
            const task = ui.entity('tasks', data.taskId);
            defaults = { definitionId: selected?.id || '', environmentId: sandbox[0]?.value || '', fixture: 'rework', taskClass: task?.taskClass || selected?.taskClass || 'ui', description: task?.description || task?.title || 'Сделать понятные статусы заявок на информационном экране', title: task?.title || 'Уточнить и реализовать состояния заявок', budget: 50000 };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u0421\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u0430\u044F \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F", field: "definitionId", options: defs, "data-autofocus": true }),
                React.createElement("div", { className: "form-grid" },
                    React.createElement(F, { label: "\u0421\u0440\u0435\u0434\u0430", field: "environmentId", options: sandbox.length ? sandbox : [{ value: '', label: 'Нет Ready Sandbox' }] }),
                    React.createElement(F, { label: "\u041A\u043B\u0430\u0441\u0441 \u0437\u0430\u0434\u0430\u0447\u0438", field: "taskClass", options: [{ value: 'ui', label: 'UI / frontend' }, { value: 'docs', label: 'Docs / документация' }] })),
                React.createElement(F, { label: "\u041F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u0435", field: "title", required: true }),
                React.createElement(F, { label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0438 \u0433\u0440\u0430\u043D\u0438\u0446\u044B", field: "description", type: "textarea", required: true }),
                React.createElement(F, { label: "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439 \u044D\u043C\u0443\u043B\u044F\u0446\u0438\u0438", field: "fixture", options: ui.data.catalog.fixtures.map((f) => ({ value: f.id, label: f.name })) }),
                React.createElement(F, { label: "\u041E\u0431\u0449\u0438\u0439 \u043B\u0438\u043C\u0438\u0442, \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0435 demo-\u0435\u0434\u0438\u043D\u0438\u0446\u044B", field: "budget", type: "number", min: "1" }),
                React.createElement("div", { className: "info-banner" },
                    React.createElement(Icon, { name: "shield" }),
                    "\u041D\u0438\u043A\u0430\u043A\u0438\u0445 \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0445 PR, inference \u0438\u043B\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430. \u0421\u0435\u0440\u0432\u0435\u0440 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442 \u043A\u043B\u0430\u0441\u0441, bindings \u0438 \u043F\u0440\u0430\u0432\u0430."));
            handler = f => ui.cmd('run.startTrial', { ...f, taskId: data.taskId, budget: Number(f.budget), projectId: ui.entity('definitions', f.definitionId)?.projectId });
            after = r => ui.go('runs', r.id);
            break;
        }
        case 'task':
            title = 'Новая проектная задача';
            subtitle = data.message ? 'Исходное сообщение останется связано с задачей.' : 'Поручение пока не запускает агента автоматически.';
            submit = 'Создать задачу';
            defaults = { projectId: data.message?.projectId || ui.project?.id || projects[0]?.value, title: data.message?.text || '', description: data.message?.text || '', taskClass: 'ui', acceptance: 'Пройти проверки и инженерный Human Gate' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u041F\u0440\u043E\u0435\u043A\u0442", field: "projectId", options: projects, "data-autofocus": true }),
                React.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "title", required: true }),
                React.createElement(F, { label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", field: "description", type: "textarea" }),
                React.createElement(F, { label: "\u041A\u0440\u0438\u0442\u0435\u0440\u0438\u0438 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430", field: "acceptance", type: "textarea", rows: 3 }),
                React.createElement(F, { label: "\u041A\u043B\u0430\u0441\u0441", field: "taskClass", options: ['ui', 'docs'] }));
            handler = f => ui.cmd('task.create', { ...f, originMessageId: data.message?.id });
            after = r => ui.go('tasks', r.id);
            break;
        case 'actor':
            title = 'Создать AI-сотрудника';
            subtitle = 'Новая identity, owner и пустая частная память.';
            submit = 'Создать Actor';
            defaults = { name: 'Алекс · AI-разработчик', template: 'developer', instruction: 'Работать только с разрешённым информационным frontend. Задавать вопросы при неоднозначности.' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u0418\u043C\u044F", field: "name", required: true, "data-autofocus": true }),
                React.createElement(F, { label: "\u0423\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D\u043D\u044B\u0439 template", field: "template", options: [{ value: 'developer', label: 'AI-разработчик' }, { value: 'reviewer', label: 'AI-reviewer' }, { value: 'writer', label: 'AI-автор документации' }] }),
                React.createElement(F, { label: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F", field: "instruction", type: "textarea", rows: 5 }));
            handler = f => ui.cmd('actor.create', { ...f, projectId: ui.project?.id });
            after = () => ui.go('actors');
            break;
        case 'node':
            title = 'Добавить узел';
            subtitle = 'Новый узел появится в локальном draft. Затем свяжите переходы и сохраните граф.';
            submit = 'Добавить в граф';
            defaults = { id: 'node-' + Date.now().toString(36), label: 'Новый этап', type: 'AI' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "Stable nodeId", field: "id", required: true, "data-autofocus": true }),
                React.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "label", required: true }),
                React.createElement(F, { label: "\u0422\u0438\u043F \u0443\u0437\u043B\u0430", field: "type", options: ui.data.catalog.nodeTypes }));
            handler = async (f) => {
                const form = ui.form('studio:' + data.definitionId);
                if (form.graph.nodes.some((n) => n.id === f.id))
                    throw new Error('ID узла уже существует');
                const node = { id: f.id, label: f.label, type: f.type, x: 400, y: 250, ...(['Input', 'Approval'].includes(f.type) ? { reviewerRole: 'engineer' } : {}), ...(f.type === 'Command' ? { command: 'verify-ui' } : {}), ...(f.type === 'Condition' ? { condition: { field: 'checkPassed', op: 'truthy' } } : {}) };
                form.graph = { ...form.graph, nodes: [...form.graph.nodes, node] };
                form.selectedNode = f.id;
                ui.persistForms();
                return node;
            };
            break;
        case 'edge': {
            title = 'Связать узлы';
            subtitle = 'Переход задаёт исполняемую семантику, а не только линию на canvas.';
            submit = 'Сохранить переход';
            const graph = ui.form('studio:' + data.definitionId).graph;
            const nodes = graph.nodes.map((n) => ({ value: n.id, label: n.label + ' · ' + n.id }));
            defaults = { from: nodes[0]?.value, to: nodes[1]?.value, on: 'success', maxVisits: '', replace: true };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u0418\u0437 \u0443\u0437\u043B\u0430", field: "from", options: nodes, "data-autofocus": true }),
                React.createElement(F, { label: "\u0412 \u0443\u0437\u0435\u043B", field: "to", options: nodes }),
                React.createElement(F, { label: "\u0418\u0441\u0445\u043E\u0434", field: "on", options: ['success', 'failure', 'approve', 'rework', 'true', 'false'] }),
                React.createElement(F, { label: "\u041B\u0438\u043C\u0438\u0442 \u043F\u043E\u0441\u0435\u0449\u0435\u043D\u0438\u0439 (\u0434\u043B\u044F \u0446\u0438\u043A\u043B\u0430)", field: "maxVisits", type: "number", min: "1", max: "20" }),
                React.createElement(F, { label: "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0440\u0435\u0436\u043D\u0438\u0439 \u043F\u0435\u0440\u0435\u0445\u043E\u0434 \u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u0438\u0441\u0445\u043E\u0434\u0430", field: "replace", type: "checkbox" }));
            handler = async (f) => { const form = ui.form('studio:' + data.definitionId); const edges = f.replace ? form.graph.edges.filter((e) => e.from !== f.from || e.on !== f.on) : form.graph.edges; form.graph = { ...form.graph, edges: [...edges, { from: f.from, to: f.to, on: f.on, ...(f.maxVisits ? { maxVisits: Number(f.maxVisits) } : {}) }] }; ui.persistForms(); return form.graph; };
            break;
        }
        case 'import-graph':
            title = 'Предпросмотр импорта';
            subtitle = 'Текущий draft не изменится, пока вы не подтвердите замену.';
            submit = 'Применить к локальному черновику';
            fields = React.createElement(React.Fragment, null,
                React.createElement("div", { className: "info-banner" },
                    "\u0423\u0437\u043B\u043E\u0432: ",
                    data.graph.nodes.length,
                    " \u00B7 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u043E\u0432: ",
                    data.graph.edges.length,
                    ". \u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440 \u2014 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435."),
                React.createElement("pre", { className: "code-block" }, JSON.stringify(data.graph, null, 2)));
            handler = async () => { const form = ui.form('studio:' + data.definitionId); form.graph = data.graph; form.selectedNode = data.graph.nodes[0]?.id; ui.persistForms(); return data.graph; };
            break;
        case 'knowledge':
            title = data.parentId ? 'Дочерняя страница' : 'Новая страница знаний';
            subtitle = 'Markdown хранится как текст. HTML и scripts не исполняются.';
            submit = 'Создать страницу';
            defaults = { title: 'Контракт API статусов', content: '# Контракт API\n\nОпишите правило, применимость и контрпример.', visibility: 'team' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "title", required: true, "data-autofocus": true }),
                React.createElement(F, { label: "\u0421\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435 Markdown", field: "content", type: "textarea", rows: 7 }),
                React.createElement(F, { label: "\u0412\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u044C", field: "visibility", options: [{ value: 'team', label: 'Команда' }, { value: 'private', label: 'Только автор' }] }));
            handler = f => ui.cmd('knowledge.create', { ...f, parentId: data.parentId, projectId: ui.project?.id });
            after = r => ui.go('knowledge', r.id);
            break;
        case 'save-knowledge':
            title = 'Это правило пригодится команде?';
            subtitle = 'Доработка уже продолжена. Сохранение знания — отдельное решение.';
            submit = 'Создать предложение знания';
            defaults = { title: '503 не означает пустую выдачу', appliesTo: 'Информационный frontend / API статусов', reason: data.reason || 'Различать пустой ответ и недоступность' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0430\u0442\u043E\u043C\u0430\u0440\u043D\u043E\u0433\u043E \u043F\u0440\u0430\u0432\u0438\u043B\u0430", field: "title", required: true, "data-autofocus": true }),
                React.createElement(F, { label: "\u041E\u0431\u043B\u0430\u0441\u0442\u044C \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u043C\u043E\u0441\u0442\u0438", field: "appliesTo" }),
                React.createElement("div", { className: "source-decision" },
                    React.createElement("small", null, "\u0418\u0421\u0422\u041E\u0427\u041D\u0418\u041A \u00B7 REWORK DECISION"),
                    React.createElement("p", null, data.reason),
                    React.createElement("code", null, data.id)),
                React.createElement("p", { className: "muted" }, "\u041F\u0440\u0430\u0432\u0438\u043B\u043E \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u043A\u0430\u043A proposal. \u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u043F\u0440\u043E\u0434\u0443\u043A\u0442-\u0438\u043D\u0436\u0435\u043D\u0435\u0440\u0430. \u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 Run \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442 \u043F\u0440\u0435\u0436\u043D\u0438\u0439 snapshot."));
            handler = f => ui.cmd('knowledge.propose', { ...f, sourceDecisionId: data.id });
            after = r => ui.go('knowledge', r.page.id);
            break;
        case 'knowledge-link':
            title = 'Добавить типизированную связь';
            subtitle = 'Обратная ссылка строится по ID и проверяется по доступу.';
            submit = 'Связать страницы';
            defaults = { to: ui.scoped('pages').find(p => p.id !== data.id)?.id || '', kind: 'explains' };
            fields = React.createElement(React.Fragment, null,
                React.createElement("p", null,
                    React.createElement("b", null, "\u0418\u0437:"),
                    " ",
                    data.title),
                React.createElement(F, { label: "\u0412 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443", field: "to", options: options('pages', p => p.id !== data.id), "data-autofocus": true }),
                React.createElement(F, { label: "\u0422\u0438\u043F \u0441\u0432\u044F\u0437\u0438", field: "kind", options: ['explains', 'refines', 'contradicts', 'derivedFrom', 'usedBy', 'supersedes'] }));
            handler = f => ui.cmd('knowledge.link', { from: data.id, ...f });
            break;
        case 'component':
            title = 'Компонент из шаблона';
            subtitle = 'Черновая версия пригодна только для испытаний. Публикация требует peer review.';
            submit = 'Создать компонент';
            defaults = { template: data.template || 'skill', name: data.name || 'Правило обработки API', content: 'HTTP 503 означает unavailable. Не показывать пустой список при недоступности источника.' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u0422\u0438\u043F / template", field: "template", options: ui.data.catalog.components.map((c) => ({ value: c.id, label: c.type })) }),
                React.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "name", required: true, "data-autofocus": true }),
                React.createElement(F, { label: "\u0421\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435", field: "content", type: "textarea", rows: 6 }));
            handler = f => ui.cmd('component.create', f);
            after = r => ui.go('components', r.component.id);
            break;
        case 'component-version':
            title = 'Новая версия компонента';
            submit = 'Создать draft version';
            defaults = { version: '2.0.0', content: '' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u0412\u0435\u0440\u0441\u0438\u044F", field: "version", required: true, "data-autofocus": true }),
                React.createElement(F, { label: "\u041D\u043E\u0432\u043E\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435", field: "content", type: "textarea", rows: 8, required: true }));
            handler = f => ui.cmd('component.version', f, data);
            break;
        case 'revoke-component':
            title = 'Отозвать точную версию';
            subtitle = 'Новые действия затронутых Runs будут заблокированы. История сохранится.';
            submit = 'Отозвать версию';
            defaults = { reason: '' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(Digest, { value: data.contentDigest }),
                React.createElement(F, { label: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430 \u043E\u0442\u0437\u044B\u0432\u0430", field: "reason", type: "textarea", required: true, "data-autofocus": true }));
            handler = f => ui.cmd('component.revoke', f, data);
            break;
        case 'evaluation': {
            title = 'Испытать зафиксированную конфигурацию';
            subtitle = 'Корзина sdlc-basket@1; результаты — synthetic evidence, не production-надежность.';
            submit = 'Выполнить evaluation';
            const snaps = ui.scoped('snapshots').filter(s => ui.scoped('runs').some(r => r.snapshotId === s.id && r.mode === 'trial' && r.status === 'Accepted'));
            defaults = { snapshotId: data.snapshotId || snaps.at(-1)?.id || '', track: 'human-guided' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "Snapshot \u043F\u0440\u0438\u043D\u044F\u0442\u043E\u0433\u043E Trial", field: "snapshotId", options: snaps.map(s => ({ value: s.id, label: (ui.entity('definitions', s.definitionId)?.name || 'Конфигурация') + ' · ' + s.configurationDigest.slice(-10) })), "data-autofocus": true }),
                React.createElement(F, { label: "\u0420\u0435\u0436\u0438\u043C \u0443\u0447\u0430\u0441\u0442\u0438\u044F \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430", field: "track", options: ['human-guided', 'autonomous', 'expert-assisted'] }),
                React.createElement("p", null, "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0438: \u043D\u043E\u0440\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0443\u0442\u044C, \u043F\u0443\u0441\u0442\u043E\u0439 \u043E\u0442\u0432\u0435\u0442, HTTP 503, mutation \u0438 \u043C\u0430\u0440\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 policy fixtures. \u041D\u0435\u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0435 started \u043D\u0435 \u0438\u0441\u043A\u043B\u044E\u0447\u0430\u044E\u0442\u0441\u044F \u0438\u0437 \u0437\u043D\u0430\u043C\u0435\u043D\u0430\u0442\u0435\u043B\u044F."));
            handler = f => ui.cmd('evaluation.create', f);
            after = r => ui.go('evaluations', r.id);
            break;
        }
        case 'candidate': {
            title = 'Зафиксировать кандидат';
            subtitle = 'Manifest включает полный resolved lock и evidence точного configurationDigest.';
            submit = 'Подготовить кандидат';
            const evals = ui.scoped('evaluations').filter(e => e.passed);
            defaults = { name: 'Статусы заявок · кандидат', evaluationId: data.evaluationId || evals.at(-1)?.id || '' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "name", required: true, "data-autofocus": true }),
                React.createElement(F, { label: "\u0417\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u0430\u044F evaluation", field: "evaluationId", options: evals.map(e => ({ value: e.id, label: e.taskClass + ' · ' + e.track + ' · ' + e.configurationDigest.slice(-10) })) }),
                React.createElement("p", { className: "muted" }, "\u041F\u043E\u0441\u043B\u0435 \u0444\u0438\u043A\u0441\u0430\u0446\u0438\u0438: \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0434\u0443\u043A\u0442-\u0438\u043D\u0436\u0435\u043D\u0435\u0440 \u2192 PO \u2192 UAT \u2192 \u0434\u043E\u043F\u0443\u0441\u043A \u2192 \u0440\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u0435."));
            handler = f => ui.cmd('candidate.create', { ...f, snapshotId: ui.entity('evaluations', f.evaluationId)?.snapshotId });
            after = r => ui.go('releases', r.id);
            break;
        }
        case 'deployment': {
            title = 'Разместить допущенный релиз';
            subtitle = 'Только mock Deployment. Значимые bindings закрепляются отдельным digest.';
            submit = 'Подтвердить размещение';
            const prod = options('environments', e => e.status === 'Ready' && e.kind === 'Production');
            defaults = { releaseId: data.releaseId || ui.scoped('releases')[0]?.id, environmentId: prod[0]?.value || '', createEnvironment: !prod.length };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "CapabilityRelease", field: "releaseId", options: options('releases', r => r.status === 'Admitted') }),
                prod.length ? React.createElement(F, { label: "Production \u0441\u0440\u0435\u0434\u0430", field: "environmentId", options: prod }) : React.createElement(F, { label: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C mock Production \u043D\u0430 \u0433\u043E\u0442\u043E\u0432\u044B\u0445 \u0440\u0435\u0441\u0443\u0440\u0441\u0430\u0445", field: "createEnvironment", type: "checkbox" }),
                React.createElement("p", { className: "muted" }, "Stop plan: \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C dispatch, \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0430\u0440\u0442\u0435\u0444\u0430\u043A\u0442\u044B \u0438 \u0441\u0432\u0435\u0440\u0438\u0442\u044C \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0435 \u044D\u0444\u0444\u0435\u043A\u0442\u044B."));
            handler = async (f) => {
                let env = f.environmentId;
                if (!env && f.createEnvironment) {
                    const base = ui.scoped('environments').find(e => e.kind === 'Sandbox' && e.status === 'Ready');
                    const created = await ui.cmd('environment.create', { sourceId: base?.id, kind: 'Production' });
                    env = created.id;
                }
                return ui.cmd('deployment.create', { releaseId: f.releaseId, environmentId: env });
            };
            after = () => ui.go('environments');
            break;
        }
        case 'released-run':
            title = 'Работа по допущенному релизу';
            subtitle = 'Run использует snapshot активного Deployment, не текущий draft.';
            submit = 'Начать Released Run';
            defaults = { title: 'Следующее улучшение статусов', description: 'Улучшить информационный экран статусов заявок', taskClass: 'ui' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u041F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u0435", field: "title", required: true, "data-autofocus": true }),
                React.createElement(F, { label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", field: "description", type: "textarea" }),
                React.createElement(F, { label: "\u041A\u043B\u0430\u0441\u0441", field: "taskClass", options: ['ui', 'docs'] }),
                React.createElement("p", null,
                    "\u0421\u0440\u0435\u0434\u0430: ",
                    ui.entity('environments', data.environmentId)?.name,
                    ". \u0420\u0435\u043B\u0438\u0437: ",
                    ui.entity('releases', data.releaseId)?.name,
                    "."));
            handler = f => ui.cmd('run.startReleased', { ...f, deploymentId: data.id, environmentId: data.environmentId, projectId: data.projectId, fixture: 'clean' });
            after = r => ui.go('runs', r.id);
            break;
        case 'product-release':
            title = 'Подготовить изменение продукта';
            subtitle = 'Это отдельный выпуск конкретного artifact digest, а не допуск способности.';
            submit = 'Создать ProductRelease';
            defaults = { runId: ui.scoped('runs').find(r => r.status === 'Accepted' && !r.parentRunId)?.id };
            fields = React.createElement(F, { label: "\u041F\u0440\u0438\u043D\u044F\u0442\u044B\u0439 Run", field: "runId", options: ui.scoped('runs').filter(r => r.status === 'Accepted' && !r.parentRunId).map(r => ({ value: r.id, label: ui.entity('tasks', r.taskId)?.title || r.id })), "data-autofocus": true });
            handler = f => ui.cmd('productRelease.create', f);
            break;
        case 'platform-release':
            title = 'Пакет платформы';
            subtitle = 'Подготовка отдельного пакета. Полный independent platform rollout в этой сборке не реализован.';
            submit = 'Создать PlatformRelease draft';
            defaults = { installationId: inst[0]?.value };
            fields = React.createElement(F, { label: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430", field: "installationId", options: inst, "data-autofocus": true });
            handler = f => ui.cmd('platformRelease.create', f);
            break;
        case 'outcome':
            title = 'Наблюдение продуктовой метрики';
            subtitle = 'Только синтетический dataset с видимой зрелостью и происхождением.';
            submit = 'Запустить observation';
            defaults = { productReleaseId: data.productReleaseId || ui.scoped('productReleases').find(r => r.status === 'Active')?.id, fixture: 'below-target' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u0412\u044B\u043F\u0443\u0449\u0435\u043D\u043D\u043E\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435", field: "productReleaseId", options: options('productReleases', r => r.status === 'Active') }),
                React.createElement(F, { label: "Synthetic dataset", field: "fixture", options: [{ value: 'below-target', label: 'Цель не достигнута' }, { value: 'achieved', label: 'Цель достигнута' }, { value: 'srm', label: 'Нарушение SRM' }, { value: 'immature', label: 'Незрелая когорта' }, { value: 'guardrail', label: 'Нарушение guardrail' }] }));
            handler = f => ui.cmd('outcome.observe', f);
            after = () => ui.go('outcomes');
            break;
        case 'improvement':
            title = 'Подтвердить следующее улучшение';
            subtitle = 'Создаётся новая проектная задача, а не скрытая замена релиза.';
            submit = 'Подтвердить и создать задачу';
            defaults = { title: 'Улучшить понятность статусов заявок' };
            fields = React.createElement(React.Fragment, null,
                React.createElement("p", null,
                    "\u0422\u0435\u043A\u0443\u0449\u0435\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 ",
                    data.value,
                    "% \u043F\u0440\u0438 \u0446\u0435\u043B\u0438 ",
                    data.target,
                    "%. \u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A: ",
                    data.provenance,
                    "."),
                React.createElement(F, { label: "\u0413\u0438\u043F\u043E\u0442\u0435\u0437\u0430 / \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438", field: "title", required: true, "data-autofocus": true }));
            handler = f => ui.cmd('outcome.improve', { ...f, confirm: true }, data);
            after = r => ui.go('tasks', r.task.id);
            break;
        case 'budget':
            title = 'Изменить общий лимит';
            subtitle = 'Дочерние поручения не получают отдельного бесконечного бюджета.';
            submit = 'Утвердить дополнительный бюджет';
            defaults = { amount: 10000 };
            fields = React.createElement(React.Fragment, null,
                React.createElement("p", null,
                    "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043B\u0438\u043C\u0438\u0442: ",
                    money(data.budget),
                    ". \u042D\u0442\u043E \u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 demo-\u0435\u0434\u0438\u043D\u0438\u0446\u044B."),
                React.createElement(F, { label: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0445 \u0435\u0434\u0438\u043D\u0438\u0446", field: "amount", type: "number", min: "1", required: true, "data-autofocus": true }));
            handler = f => ui.cmd('run.budget', { amount: Number(f.amount) }, data);
            break;
        case 'return-control':
            title = 'Вернуть управление агенту';
            subtitle = 'Human lease закрывается после checks, затем выдаётся новый epoch.';
            submit = 'Проверить и вернуть управление';
            defaults = { diff: 'diff --git a/src/status.ts b/src/status.ts\n+ if (response.status === 503) return "unavailable";' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "Diff \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430", field: "diff", type: "textarea", rows: 8, required: true, "data-autofocus": true }),
                React.createElement("div", { className: "info-banner" }, "Protected peer review \u043F\u043E\u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u043F\u0440\u043E\u0434\u0443\u043A\u0442-\u0438\u043D\u0436\u0435\u043D\u0435\u0440\u0430."));
            handler = f => ui.cmd('run.control', { control: 'RETURN', diff: f.diff, behavior: { 200: 'data', 204: 'empty', 503: 'unavailable' } }, data);
            break;
        case 'edit-message':
            title = 'Изменить своё сообщение';
            subtitle = 'Прежняя revision сохранится. Decisions не изменяются.';
            submit = 'Сохранить текст';
            defaults = { text: data.text };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435", field: "text", type: "textarea", rows: 5, "data-autofocus": true }),
                React.createElement(Button, { variant: "danger", onClick: () => void ui.act(async () => { await ui.cmd('message.edit', { delete: true }, data); ui.close(); }, 'Сообщение заменено tombstone') }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435"));
            handler = f => ui.cmd('message.edit', f, data);
            break;
        case 'confirm-provision':
            title = 'Заказать ресурсы?';
            subtitle = 'Сейчас будет создан ProvisionJob. Готовность появится только после серверных проверок.';
            submit = 'Подтвердить заказ';
            fields = React.createElement(React.Fragment, null,
                React.createElement("div", { className: "confirm-quote" },
                    React.createElement("strong", null, money(data.cost)),
                    React.createElement("span", null, "\u0421\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0441\u043C\u0435\u0442\u0430")),
                React.createElement("p", null, data.items.join(' · ')),
                React.createElement("p", null,
                    "\u0421\u0435\u0442\u044C: ",
                    React.createElement("b", null, data.network),
                    ". \u0414\u0430\u0436\u0435 \u043F\u0440\u0438 \u043E\u0442\u043C\u0435\u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u043D\u044B\u0435 \u0440\u0435\u0441\u0443\u0440\u0441\u044B \u0438 \u0440\u0430\u0441\u0445\u043E\u0434\u044B \u043E\u0441\u0442\u0430\u043D\u0443\u0442\u0441\u044F \u0432\u0438\u0434\u0438\u043C\u044B\u043C\u0438."));
            handler = () => ui.cmd('provision.start', { confirm: true }, data);
            break;
        case 'cancel-run':
            title = 'Остановить этот Run?';
            subtitle = 'Новые этапы остановятся. История, артефакты и понесённые расходы сохранятся.';
            submit = 'Остановить Run';
            fields = React.createElement("p", null, ui.entity('tasks', data.taskId)?.title);
            handler = () => ui.cmd('run.control', { control: 'CANCEL' }, data);
            break;
        case 'incident':
            title = 'Зафиксировать инцидент';
            submit = 'Создать инцидент';
            defaults = { title: '', reason: '', severity: 'medium' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "title", required: true, "data-autofocus": true }),
                React.createElement(F, { label: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430 \u0438 \u043E\u0431\u043B\u0430\u0441\u0442\u044C \u0432\u043B\u0438\u044F\u043D\u0438\u044F", field: "reason", type: "textarea" }),
                React.createElement(F, { label: "Severity", field: "severity", options: ['low', 'medium', 'high'] }));
            handler = f => ui.cmd('incident.create', { ...f, projectId: ui.project?.id });
            break;
        case 'search':
            title = 'Поиск в пространстве';
            subtitle = 'Scope проверяется до выдачи названий и текстов.';
            submit = 'Найти';
            defaults = { query: '' };
            fields = React.createElement(React.Fragment, null,
                React.createElement(F, { label: "\u0417\u0430\u043F\u0440\u043E\u0441", field: "query", placeholder: "\u0417\u0430\u0434\u0430\u0447\u0438, \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F, \u043F\u0440\u0430\u0432\u0438\u043B\u0430\u2026", "data-autofocus": true }),
                React.createElement("div", { className: "search-results" }, ui.searchResults.map(e => React.createElement("button", { key: e.id, className: "search-result", type: "button", onClick: () => {
                        ui.close();
                        if (e.type === 'messages')
                            ui.go('channels', e.channelId, e.threadId);
                        else
                            ui.go({ tasks: 'tasks', pages: 'knowledge', projects: 'projects' }[e.type] || 'work', e.id);
                    } },
                    React.createElement("small", null, e.type),
                    React.createElement("b", null, e.title || e.name || e.text)))));
            handler = f => ui.search(f.query);
            break;
        default: return null;
    }
    const form = ui.form(key, defaults);
    return React.createElement("div", { className: "overlay", onMouseDown: (e) => {
            if (e.target === e.currentTarget)
                ui.close();
        } },
        React.createElement("section", { className: 'modal modal-' + kind, role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title" },
            React.createElement("header", null,
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "\u041A\u041E\u041D\u0422\u0423\u0420 / \u0414\u0415\u0419\u0421\u0422\u0412\u0418\u0415"),
                    React.createElement("h2", { id: "modal-title" }, title)),
                React.createElement("button", { className: "icon-button", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0434\u0438\u0430\u043B\u043E\u0433", onClick: () => ui.close() },
                    React.createElement(Icon, { name: "close" }))),
            React.createElement("form", { onSubmit: (e) => {
                    e.preventDefault();
                    void ui.act(async () => {
                        const result = await handler(form);
                        if (kind !== 'search') {
                            delete ui.forms[key];
                            ui.close();
                            after(result);
                        }
                        return result;
                    }, kind === 'search' ? '' : 'Команда сохранена');
                } },
                React.createElement("div", { className: "modal-body" },
                    React.createElement("p", { className: "modal-subtitle" }, subtitle),
                    React.createElement(ErrorBox, null),
                    fields),
                React.createElement("footer", null,
                    React.createElement(Button, { variant: "secondary", onClick: () => ui.close() }, kind === 'save-knowledge' ? 'Не сохранять' : 'Отмена'),
                    React.createElement(Button, { type: "submit", variant: ['revoke-component', 'cancel-run'].includes(kind) ? 'danger' : 'primary', disabled: ui.offline }, ui.busy ? 'Сохраняется…' : submit)))));
}
