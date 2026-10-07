import React from '../shared/react.js';
import { ui } from './controller.js';
import { request } from '../shared/data/api.js';
import { Badge, Button, Icon, Field, ErrorBox, Diff, Digest, money } from '../shared/ui/index.js';
function F(p: any) { const { kind, data = {} } = ui.modal!; const key = 'modal:' + kind + ':' + (data.id || data.definitionId || 'new'); return <Field form={key} {...p}/>; }
export function Modals() {
    if (!ui.modal)
        return null;
    const { kind, data = {} } = ui.modal;
    const key = 'modal:' + kind + ':' + (data.id || data.definitionId || 'new');
    let title = '', subtitle = '', submit = 'Сохранить', fields: any = null, defaults: any = {}, handler: (f: any) => Promise<any> = async () => { }, after: (r: any) => void = () => { };
    const options = (type: string, predicate: (e: any) => boolean = () => true) => ui.scoped(type).filter(predicate).map(e => ({ value: e.id, label: e.name || e.title || e.id }));
    const projects = options('projects');
    const readyEnvs = options('environments', e => e.status === 'Ready');
    const inst = options('installations', e => e.status === 'Ready');
    switch (kind) {
        case 'space':
            title = 'Новое командное пространство';
            subtitle = 'Никакие ресурсы и релизы не создаются автоматически.';
            submit = 'Создать пространство';
            defaults = { name: '', goal: '', budget: 500000, timezone: 'Europe/Amsterdam', memberIds: ui.data?.catalog.users.map((u: any) => u.id) || ['anna', 'ivan', 'maria', 'maxim'] };
            fields = <><F label="Название команды" field="name" required placeholder="Например, Команда цифровых сервисов" data-autofocus/><F label="Общая цель" field="goal" type="textarea" rows={3} placeholder="Зачем работает эта команда?"/><div className="form-grid"><F label="Лимит, в минимальных demo-единицах" field="budget" type="number" min="1000" help="100 единиц = 1 d₽. Настоящие деньги не расходуются."/><F label="Часовой пояс" field="timezone"/></div><div className="member-picker"><h3>Участники и три роли</h3>{ui.data?.catalog.users.map((u: any) => <label className="checkbox-row" key={u.id}><input type="checkbox" checked={ui.form(key, defaults).memberIds.includes(u.id)} onChange={(e: any) => { const ids = ui.form(key).memberIds; ui.set(key, 'memberIds', e.target.checked ? [...ids, u.id] : ids.filter((id: string) => id !== u.id)); }}/><span><b>{u.name}</b><small>{u.title}</small></span></label>)}</div></>;
            handler = f => ui.cmd('space.create', { ...f, budget: Number(f.budget) });
            after = r => { void ui.selectSpace(r.id).then(() => ui.go('setup')); };
            break;
        case 'project':
            title = 'Новый проект';
            subtitle = 'Цель, owner, инженер, канал и task classes создаются вместе.';
            submit = 'Создать проект';
            defaults = { name: 'Статусы заявок', goal: 'Различать пустую выдачу и недоступный источник', installationId: inst[0]?.value || '', engineerId: 'ivan', budget: 100000 };
            fields = <><F label="Название" field="name" required data-autofocus/><F label="Продуктовая цель" field="goal" type="textarea"/><F label="Установленная основа" field="installationId" options={inst.length ? inst : [{ value: '', label: 'Можно подготовить проект без основы' }]}/><F label="Продукт-инженер" field="engineerId" options={ui.data!.catalog.users.filter((u: any) => u.role === 'engineer' && ui.space?.memberIds.includes(u.id)).map((u: any) => ({ value: u.id, label: u.name }))}/><F label="Бюджет проекта, минимальные demo-единицы" field="budget" type="number"/></>;
            handler = f => ui.cmd('project.create', { ...f, installationId: f.installationId || undefined, budget: Number(f.budget) });
            after = r => { ui.projectId = r.id; ui.go('projects', r.id); };
            break;
        case 'binding':
            title = 'Подключить инструменты';
            subtitle = 'Сервер проверяет каждое подключение отдельно. Vendor API не вызываются.';
            submit = 'Создать mock bindings';
            defaults = { projectId: ui.project?.id || projects[0]?.value, kind: 'required', actions: 'read,propose' };
            fields = <><F label="Проект" field="projectId" options={projects} data-autofocus/><F label="Подключение" field="kind" options={[{ value: 'required', label: 'Обязательный набор: repo + CI + model + tracker' }, { value: 'repo', label: 'Git / repository' }, { value: 'ci', label: 'CI runner' }, { value: 'model', label: 'Своя LLM / model gateway' }, { value: 'tracker', label: 'Issue tracker (read-only)' }, { value: 'broker', label: 'Event broker' }]}/><div className="info-banner"><Icon name="shield"/>Repo: read, propose · CI: execute · Model: execute · Tracker: только read. Secrets: mock:masked.</div></>;
            handler = async (f) => { const kinds = f.kind === 'required' ? ['repo', 'ci', 'model', 'tracker'] : [f.kind]; let last; for (const k of kinds)
                last = await ui.cmd('binding.create', { projectId: f.projectId, kind: k, actions: k === 'tracker' ? ['read'] : k === 'repo' ? ['read', 'propose'] : ['read', 'execute'], installationId: ui.entity('projects', f.projectId)?.installationId || undefined }); return last; };
            after = () => ui.go('bindings');
            break;
        case 'definition':
            title = 'Создать конфигурацию';
            subtitle = 'Начните с исполняемого шаблона. Все Human Gates и checks видимы в графе.';
            submit = 'Создать черновик';
            defaults = { name: data.kind === 'actor' ? 'Actor + Workflow' : 'Статусы заявок · SDLC', projectId: data.projectId || ui.project?.id || projects[0]?.value, kind: data.kind || 'flow', taskClass: 'ui' };
            fields = <><F label="Название" field="name" required data-autofocus/><F label="Проект" field="projectId" options={projects}/><F label="Способ организации" field="kind" options={[{ value: 'flow', label: 'Flow — граф этапов и Human Gates' }, { value: 'team', label: 'Assistant Team — coordinator и разные планы' }, { value: 'actor', label: 'Actor + Workflow / Hybrid' }]}/><F label="Начальный TaskClass" field="taskClass" options={[{ value: 'ui', label: 'Информационный frontend' }, { value: 'docs', label: 'Документация' }]}/><div className="mini-flow">Постановка → Вопрос → Изменение → Проверка → Review</div></>;
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
            fields = <><F label="Сохранённая конфигурация" field="definitionId" options={defs} data-autofocus/><div className="form-grid"><F label="Среда" field="environmentId" options={sandbox.length ? sandbox : [{ value: '', label: 'Нет Ready Sandbox' }]}/><F label="Класс задачи" field="taskClass" options={[{ value: 'ui', label: 'UI / frontend' }, { value: 'docs', label: 'Docs / документация' }]}/></div><F label="Поручение" field="title" required/><F label="Описание и границы" field="description" type="textarea" required/><F label="Сценарий эмуляции" field="fixture" options={ui.data!.catalog.fixtures.map((f: any) => ({ value: f.id, label: f.name }))}/><F label="Общий лимит, минимальные demo-единицы" field="budget" type="number" min="1"/><div className="info-banner"><Icon name="shield"/>Никаких реальных PR, inference или изменений продукта. Сервер проверит класс, bindings и права.</div></>;
            handler = f => ui.cmd('run.startTrial', { ...f, taskId: data.taskId, budget: Number(f.budget), projectId: ui.entity('definitions', f.definitionId)?.projectId });
            after = r => ui.go('runs', r.id);
            break;
        }
        case 'task':
            title = 'Новая проектная задача';
            subtitle = data.message ? 'Исходное сообщение останется связано с задачей.' : 'Поручение пока не запускает агента автоматически.';
            submit = 'Создать задачу';
            defaults = { projectId: data.message?.projectId || ui.project?.id || projects[0]?.value, title: data.message?.text || '', description: data.message?.text || '', taskClass: 'ui', acceptance: 'Пройти проверки и инженерный Human Gate' };
            fields = <><F label="Проект" field="projectId" options={projects} data-autofocus/><F label="Название" field="title" required/><F label="Описание" field="description" type="textarea"/><F label="Критерии результата" field="acceptance" type="textarea" rows={3}/><F label="Класс" field="taskClass" options={['ui', 'docs']}/></>;
            handler = f => ui.cmd('task.create', { ...f, originMessageId: data.message?.id });
            after = r => ui.go('tasks', r.id);
            break;
        case 'actor':
            title = 'Создать AI-сотрудника';
            subtitle = 'Новая identity, owner и пустая частная память.';
            submit = 'Создать Actor';
            defaults = { name: 'Алекс · AI-разработчик', template: 'developer', instruction: 'Работать только с разрешённым информационным frontend. Задавать вопросы при неоднозначности.' };
            fields = <><F label="Имя" field="name" required data-autofocus/><F label="Утверждённый template" field="template" options={[{ value: 'developer', label: 'AI-разработчик' }, { value: 'reviewer', label: 'AI-reviewer' }, { value: 'writer', label: 'AI-автор документации' }]}/><F label="Инструкция" field="instruction" type="textarea" rows={5}/></>;
            handler = f => ui.cmd('actor.create', { ...f, projectId: ui.project?.id });
            after = () => ui.go('actors');
            break;
        case 'node':
            title = 'Добавить узел';
            subtitle = 'Новый узел появится в локальном draft. Затем свяжите переходы и сохраните граф.';
            submit = 'Добавить в граф';
            defaults = { id: 'node-' + Date.now().toString(36), label: 'Новый этап', type: 'AI' };
            fields = <><F label="Stable nodeId" field="id" required data-autofocus/><F label="Название" field="label" required/><F label="Тип узла" field="type" options={ui.data!.catalog.nodeTypes}/></>;
            handler = async (f) => { const form = ui.form('studio:' + data.definitionId); if (form.graph.nodes.some((n: any) => n.id === f.id))
                throw new Error('ID узла уже существует'); const node = { id: f.id, label: f.label, type: f.type, x: 400, y: 250, ...(['Input', 'Approval'].includes(f.type) ? { reviewerRole: 'engineer' } : {}), ...(f.type === 'Command' ? { command: 'verify-ui' } : {}), ...(f.type === 'Condition' ? { condition: { field: 'checkPassed', op: 'truthy' } } : {}) }; form.graph = { ...form.graph, nodes: [...form.graph.nodes, node] }; form.selectedNode = f.id; ui.persistForms(); return node; };
            break;
        case 'edge': {
            title = 'Связать узлы';
            subtitle = 'Переход задаёт исполняемую семантику, а не только линию на canvas.';
            submit = 'Сохранить переход';
            const graph = ui.form('studio:' + data.definitionId).graph;
            const nodes = graph.nodes.map((n: any) => ({ value: n.id, label: n.label + ' · ' + n.id }));
            defaults = { from: nodes[0]?.value, to: nodes[1]?.value, on: 'success', maxVisits: '', replace: true };
            fields = <><F label="Из узла" field="from" options={nodes} data-autofocus/><F label="В узел" field="to" options={nodes}/><F label="Исход" field="on" options={['success', 'failure', 'approve', 'rework', 'true', 'false']}/><F label="Лимит посещений (для цикла)" field="maxVisits" type="number" min="1" max="20"/><F label="Заменить прежний переход для этого исхода" field="replace" type="checkbox"/></>;
            handler = async (f) => { const form = ui.form('studio:' + data.definitionId); const edges = f.replace ? form.graph.edges.filter((e: any) => e.from !== f.from || e.on !== f.on) : form.graph.edges; form.graph = { ...form.graph, edges: [...edges, { from: f.from, to: f.to, on: f.on, ...(f.maxVisits ? { maxVisits: Number(f.maxVisits) } : {}) }] }; ui.persistForms(); return form.graph; };
            break;
        }
        case 'import-graph':
            title = 'Предпросмотр импорта';
            subtitle = 'Текущий draft не изменится, пока вы не подтвердите замену.';
            submit = 'Применить к локальному черновику';
            fields = <><div className="info-banner">Узлов: {data.graph.nodes.length} · переходов: {data.graph.edges.length}. Сохранение на сервер — отдельное действие.</div><pre className="code-block">{JSON.stringify(data.graph, null, 2)}</pre></>;
            handler = async () => { const form = ui.form('studio:' + data.definitionId); form.graph = data.graph; form.selectedNode = data.graph.nodes[0]?.id; ui.persistForms(); return data.graph; };
            break;
        case 'knowledge':
            title = data.parentId ? 'Дочерняя страница' : 'Новая страница знаний';
            subtitle = 'Markdown хранится как текст. HTML и scripts не исполняются.';
            submit = 'Создать страницу';
            defaults = { title: 'Контракт API статусов', content: '# Контракт API\n\nОпишите правило, применимость и контрпример.', visibility: 'team' };
            fields = <><F label="Название" field="title" required data-autofocus/><F label="Содержимое Markdown" field="content" type="textarea" rows={7}/><F label="Видимость" field="visibility" options={[{ value: 'team', label: 'Команда' }, { value: 'private', label: 'Только автор' }]}/></>;
            handler = f => ui.cmd('knowledge.create', { ...f, parentId: data.parentId, projectId: ui.project?.id });
            after = r => ui.go('knowledge', r.id);
            break;
        case 'save-knowledge':
            title = 'Это правило пригодится команде?';
            subtitle = 'Доработка уже продолжена. Сохранение знания — отдельное решение.';
            submit = 'Создать предложение знания';
            defaults = { title: '503 не означает пустую выдачу', appliesTo: 'Информационный frontend / API статусов', reason: data.reason || 'Различать пустой ответ и недоступность' };
            fields = <><F label="Название атомарного правила" field="title" required data-autofocus/><F label="Область применимости" field="appliesTo"/><div className="source-decision"><small>ИСТОЧНИК · REWORK DECISION</small><p>{data.reason}</p><code>{data.id}</code></div><p className="muted">Правило появится как proposal. Публикация требует другого продукт-инженера. Активный Run продолжит прежний snapshot.</p></>;
            handler = f => ui.cmd('knowledge.propose', { ...f, sourceDecisionId: data.id });
            after = r => ui.go('knowledge', r.page.id);
            break;
        case 'knowledge-link':
            title = 'Добавить типизированную связь';
            subtitle = 'Обратная ссылка строится по ID и проверяется по доступу.';
            submit = 'Связать страницы';
            defaults = { to: ui.scoped('pages').find(p => p.id !== data.id)?.id || '', kind: 'explains' };
            fields = <><p><b>Из:</b> {data.title}</p><F label="В страницу" field="to" options={options('pages', p => p.id !== data.id)} data-autofocus/><F label="Тип связи" field="kind" options={['explains', 'refines', 'contradicts', 'derivedFrom', 'usedBy', 'supersedes']}/></>;
            handler = f => ui.cmd('knowledge.link', { from: data.id, ...f });
            break;
        case 'component':
            title = 'Компонент из шаблона';
            subtitle = 'Черновая версия пригодна только для испытаний. Публикация требует peer review.';
            submit = 'Создать компонент';
            defaults = { template: data.template || 'skill', name: data.name || 'Правило обработки API', content: 'HTTP 503 означает unavailable. Не показывать пустой список при недоступности источника.' };
            fields = <><F label="Тип / template" field="template" options={ui.data!.catalog.components.map((c: any) => ({ value: c.id, label: c.type }))}/><F label="Название" field="name" required data-autofocus/><F label="Содержимое" field="content" type="textarea" rows={6}/></>;
            handler = f => ui.cmd('component.create', f);
            after = r => ui.go('components', r.component.id);
            break;
        case 'component-version':
            title = 'Новая версия компонента';
            submit = 'Создать draft version';
            defaults = { version: '2.0.0', content: '' };
            fields = <><F label="Версия" field="version" required data-autofocus/><F label="Новое содержимое" field="content" type="textarea" rows={8} required/></>;
            handler = f => ui.cmd('component.version', f, data);
            break;
        case 'revoke-component':
            title = 'Отозвать точную версию';
            subtitle = 'Новые действия затронутых Runs будут заблокированы. История сохранится.';
            submit = 'Отозвать версию';
            defaults = { reason: '' };
            fields = <><Digest value={data.contentDigest}/><F label="Причина отзыва" field="reason" type="textarea" required data-autofocus/></>;
            handler = f => ui.cmd('component.revoke', f, data);
            break;
        case 'evaluation': {
            title = 'Испытать зафиксированную конфигурацию';
            subtitle = 'Корзина sdlc-basket@1; результаты — synthetic evidence, не production-надежность.';
            submit = 'Выполнить evaluation';
            const snaps = ui.scoped('snapshots').filter(s => ui.scoped('runs').some(r => r.snapshotId === s.id && r.mode === 'trial' && r.status === 'Accepted'));
            defaults = { snapshotId: data.snapshotId || snaps.at(-1)?.id || '', track: 'human-guided' };
            fields = <><F label="Snapshot принятого Trial" field="snapshotId" options={snaps.map(s => ({ value: s.id, label: (ui.entity('definitions', s.definitionId)?.name || 'Конфигурация') + ' · ' + s.configurationDigest.slice(-10) }))} data-autofocus/><F label="Режим участия человека" field="track" options={['human-guided', 'autonomous', 'expert-assisted']}/><p>Проверки: нормальный путь, пустой ответ, HTTP 503, mutation и маркированные policy fixtures. Незавершённые started не исключаются из знаменателя.</p></>;
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
            fields = <><F label="Название" field="name" required data-autofocus/><F label="Завершённая evaluation" field="evaluationId" options={evals.map(e => ({ value: e.id, label: e.taskClass + ' · ' + e.track + ' · ' + e.configurationDigest.slice(-10) }))}/><p className="muted">После фиксации: другой продукт-инженер → PO → UAT → допуск → размещение.</p></>;
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
            fields = <><F label="CapabilityRelease" field="releaseId" options={options('releases', r => r.status === 'Admitted')}/>{prod.length ? <F label="Production среда" field="environmentId" options={prod}/> : <F label="Создать mock Production на готовых ресурсах" field="createEnvironment" type="checkbox"/>}<p className="muted">Stop plan: остановить dispatch, сохранить артефакты и сверить неизвестные эффекты.</p></>;
            handler = async (f) => { let env = f.environmentId; if (!env && f.createEnvironment) {
                const base = ui.scoped('environments').find(e => e.kind === 'Sandbox' && e.status === 'Ready');
                const created = await ui.cmd('environment.create', { sourceId: base?.id, kind: 'Production' });
                env = created.id;
            } return ui.cmd('deployment.create', { releaseId: f.releaseId, environmentId: env }); };
            after = () => ui.go('environments');
            break;
        }
        case 'released-run':
            title = 'Работа по допущенному релизу';
            subtitle = 'Run использует snapshot активного Deployment, не текущий draft.';
            submit = 'Начать Released Run';
            defaults = { title: 'Следующее улучшение статусов', description: 'Улучшить информационный экран статусов заявок', taskClass: 'ui' };
            fields = <><F label="Поручение" field="title" required data-autofocus/><F label="Описание" field="description" type="textarea"/><F label="Класс" field="taskClass" options={['ui', 'docs']}/><p>Среда: {ui.entity('environments', data.environmentId)?.name}. Релиз: {ui.entity('releases', data.releaseId)?.name}.</p></>;
            handler = f => ui.cmd('run.startReleased', { ...f, deploymentId: data.id, environmentId: data.environmentId, projectId: data.projectId, fixture: 'clean' });
            after = r => ui.go('runs', r.id);
            break;
        case 'product-release':
            title = 'Подготовить изменение продукта';
            subtitle = 'Это отдельный выпуск конкретного artifact digest, а не допуск способности.';
            submit = 'Создать ProductRelease';
            defaults = { runId: ui.scoped('runs').find(r => r.status === 'Accepted' && !r.parentRunId)?.id };
            fields = <F label="Принятый Run" field="runId" options={ui.scoped('runs').filter(r => r.status === 'Accepted' && !r.parentRunId).map(r => ({ value: r.id, label: ui.entity('tasks', r.taskId)?.title || r.id }))} data-autofocus/>;
            handler = f => ui.cmd('productRelease.create', f);
            break;
        case 'platform-release':
            title = 'Пакет платформы';
            subtitle = 'Подготовка отдельного пакета. Полный independent platform rollout в этой сборке не реализован.';
            submit = 'Создать PlatformRelease draft';
            defaults = { installationId: inst[0]?.value };
            fields = <F label="Установка" field="installationId" options={inst} data-autofocus/>;
            handler = f => ui.cmd('platformRelease.create', f);
            break;
        case 'outcome':
            title = 'Наблюдение продуктовой метрики';
            subtitle = 'Только синтетический dataset с видимой зрелостью и происхождением.';
            submit = 'Запустить observation';
            defaults = { productReleaseId: data.productReleaseId || ui.scoped('productReleases').find(r => r.status === 'Active')?.id, fixture: 'below-target' };
            fields = <><F label="Выпущенное изменение" field="productReleaseId" options={options('productReleases', r => r.status === 'Active')}/><F label="Synthetic dataset" field="fixture" options={[{ value: 'below-target', label: 'Цель не достигнута' }, { value: 'achieved', label: 'Цель достигнута' }, { value: 'srm', label: 'Нарушение SRM' }, { value: 'immature', label: 'Незрелая когорта' }, { value: 'guardrail', label: 'Нарушение guardrail' }]}/></>;
            handler = f => ui.cmd('outcome.observe', f);
            after = () => ui.go('outcomes');
            break;
        case 'improvement':
            title = 'Подтвердить следующее улучшение';
            subtitle = 'Создаётся новая проектная задача, а не скрытая замена релиза.';
            submit = 'Подтвердить и создать задачу';
            defaults = { title: 'Улучшить понятность статусов заявок' };
            fields = <><p>Текущее значение {data.value}% при цели {data.target}%. Источник: {data.provenance}.</p><F label="Гипотеза / название задачи" field="title" required data-autofocus/></>;
            handler = f => ui.cmd('outcome.improve', { ...f, confirm: true }, data);
            after = r => ui.go('tasks', r.task.id);
            break;
        case 'budget':
            title = 'Изменить общий лимит';
            subtitle = 'Дочерние поручения не получают отдельного бесконечного бюджета.';
            submit = 'Утвердить дополнительный бюджет';
            defaults = { amount: 10000 };
            fields = <><p>Текущий лимит: {money(data.budget)}. Это синтетические demo-единицы.</p><F label="Добавить минимальных единиц" field="amount" type="number" min="1" required data-autofocus/></>;
            handler = f => ui.cmd('run.budget', { amount: Number(f.amount) }, data);
            break;
        case 'return-control':
            title = 'Вернуть управление агенту';
            subtitle = 'Human lease закрывается после checks, затем выдаётся новый epoch.';
            submit = 'Проверить и вернуть управление';
            defaults = { diff: 'diff --git a/src/status.ts b/src/status.ts\n+ if (response.status === 503) return "unavailable";' };
            fields = <><F label="Diff человека" field="diff" type="textarea" rows={8} required data-autofocus/><div className="info-banner">Protected peer review потребует другого продукт-инженера.</div></>;
            handler = f => ui.cmd('run.control', { control: 'RETURN', diff: f.diff, behavior: { 200: 'data', 204: 'empty', 503: 'unavailable' } }, data);
            break;
        case 'edit-message':
            title = 'Изменить своё сообщение';
            subtitle = 'Прежняя revision сохранится. Decisions не изменяются.';
            submit = 'Сохранить текст';
            defaults = { text: data.text };
            fields = <><F label="Сообщение" field="text" type="textarea" rows={5} data-autofocus/><Button variant="danger" onClick={() => void ui.act(async () => { await ui.cmd('message.edit', { delete: true }, data); ui.close(); }, 'Сообщение заменено tombstone')}>Удалить сообщение</Button></>;
            handler = f => ui.cmd('message.edit', f, data);
            break;
        case 'confirm-provision':
            title = 'Заказать ресурсы?';
            subtitle = 'Сейчас будет создан ProvisionJob. Готовность появится только после серверных проверок.';
            submit = 'Подтвердить заказ';
            fields = <><div className="confirm-quote"><strong>{money(data.cost)}</strong><span>Синтетическая смета</span></div><p>{data.items.join(' · ')}</p><p>Сеть: <b>{data.network}</b>. Даже при отмене созданные ресурсы и расходы останутся видимыми.</p></>;
            handler = () => ui.cmd('provision.start', { confirm: true }, data);
            break;
        case 'cancel-run':
            title = 'Остановить этот Run?';
            subtitle = 'Новые этапы остановятся. История, артефакты и понесённые расходы сохранятся.';
            submit = 'Остановить Run';
            fields = <p>{ui.entity('tasks', data.taskId)?.title}</p>;
            handler = () => ui.cmd('run.control', { control: 'CANCEL' }, data);
            break;
        case 'incident':
            title = 'Зафиксировать инцидент';
            submit = 'Создать инцидент';
            defaults = { title: '', reason: '', severity: 'medium' };
            fields = <><F label="Название" field="title" required data-autofocus/><F label="Причина и область влияния" field="reason" type="textarea"/><F label="Severity" field="severity" options={['low', 'medium', 'high']}/></>;
            handler = f => ui.cmd('incident.create', { ...f, projectId: ui.project?.id });
            break;
        case 'search':
            title = 'Поиск в пространстве';
            subtitle = 'Scope проверяется до выдачи названий и текстов.';
            submit = 'Найти';
            defaults = { query: '' };
            fields = <><F label="Запрос" field="query" placeholder="Задачи, сообщения, правила…" data-autofocus/><div className="search-results">{ui.searchResults.map(e => <button key={e.id} className="search-result" type="button" onClick={() => { ui.close(); if (e.type === 'messages')
                ui.go('channels', e.channelId, e.threadId);
            else
                ui.go({ tasks: 'tasks', pages: 'knowledge', projects: 'projects' }[e.type] || 'work', e.id); }}><small>{e.type}</small><b>{e.title || e.name || e.text}</b></button>)}</div></>;
            handler = f => ui.search(f.query);
            break;
        default: return null;
    }
    const form = ui.form(key, defaults);
    return <div className="overlay" onMouseDown={(e: any) => { if (e.target === e.currentTarget)
        ui.close(); }}><section className={'modal modal-' + kind} role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><div><span className="eyebrow">КОНТУР / ДЕЙСТВИЕ</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" aria-label="Закрыть диалог" onClick={() => ui.close()}><Icon name="close"/></button></header><form onSubmit={(e: any) => { e.preventDefault(); void ui.act(async () => { const result = await handler(form); if (kind !== 'search') {
        delete ui.forms[key];
        ui.close();
        after(result);
    } return result; }, kind === 'search' ? '' : 'Команда сохранена'); }}><div className="modal-body"><p className="modal-subtitle">{subtitle}</p><ErrorBox />{fields}</div><footer><Button variant="secondary" onClick={() => ui.close()}>{kind === 'save-knowledge' ? 'Не сохранять' : 'Отмена'}</Button><Button type="submit" variant={['revoke-component', 'cancel-run'].includes(kind) ? 'danger' : 'primary'} disabled={ui.offline}>{ui.busy ? 'Сохраняется…' : submit}</Button></footer></form></section></div>;
}
