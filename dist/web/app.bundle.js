(function(){
const modules={"app/App.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_js_1 = require("../shared/react.js");
const controller_js_1 = require("./controller.js");
const Modals_js_1 = require("./Modals.js");
const SetupPage_js_1 = require("../features/setup/SetupPage.js");
const WorkPage_js_1 = require("../features/operations/WorkPage.js");
const ProjectsPage_js_1 = require("../features/projects/ProjectsPage.js");
const StudioPage_js_1 = require("../features/studio/StudioPage.js");
const RunsPage_js_1 = require("../features/runs/RunsPage.js");
const MessengerPage_js_1 = require("../features/messenger/MessengerPage.js");
const HumanWorkbench_js_1 = require("../features/review/HumanWorkbench.js");
const KnowledgePage_js_1 = require("../features/knowledge/KnowledgePage.js");
const ComponentsPage_js_1 = require("../features/components/ComponentsPage.js");
const EvaluationsPage_js_1 = require("../features/evaluations/EvaluationsPage.js");
const ReleasesPage_js_1 = require("../features/releases/ReleasesPage.js");
const PlatformPage_js_1 = require("../features/platform/PlatformPage.js");
const OperationsPage_js_1 = require("../features/operations/OperationsPage.js");
const index_js_1 = require("../shared/ui/index.js");
const groups = [{ label: 'РАБОТА', items: [['work', 'Мой день', 'home'], ['channels', 'Сообщения', 'chat'], ['tasks', 'Задачи', 'tasks'], ['inbox', 'Human Inbox', 'inbox'], ['assistant', 'Мой ассистент', 'spark']] }, { label: 'РАЗРАБОТКА АВТОНОМНОСТИ', items: [['projects', 'Проекты', 'box'], ['actors', 'AI-сотрудники', 'team'], ['studio', 'Studio', 'flow'], ['runs', 'Запуски', 'play'], ['components', 'Компоненты', 'layers'], ['knowledge', 'Знания', 'book'], ['evaluations', 'Испытания и арена', 'chart'], ['releases', 'Релизы', 'shield']] }, { label: 'ПЛАТФОРМА', items: [['setup', 'Подготовка пространства', 'settings'], ['resources', 'Ресурсы и сервисы', 'cloud'], ['installations', 'Установленные основы', 'layers'], ['bindings', 'Интеграции и доступы', 'box'], ['environments', 'Среды и размещения', 'cloud'], ['monitoring', 'Мониторинг', 'chart'], ['outcomes', 'Метрики продукта', 'chart'], ['costs', 'Затраты', 'chart'], ['audit', 'Аудит', 'shield']] }];
const routeName = (route) => route === 'spaces' ? 'Пространства' : groups.flatMap(g => g.items).find(i => i[0] === route)?.[1] || 'Работа';
function Sidebar() { const pending = controller_js_1.ui.scoped('humanTasks').filter(h => h.assigneeId === controller_js_1.ui.user?.id && h.status === 'Pending').length; return react_js_1.default.createElement(react_js_1.default.Fragment, null,
    react_js_1.default.createElement("div", { className: 'nav-shade ' + (controller_js_1.ui.navOpen ? 'open' : ''), onClick: () => { controller_js_1.ui.navOpen = false; controller_js_1.ui.changed(); } }),
    react_js_1.default.createElement("aside", { className: 'sidebar ' + (controller_js_1.ui.navOpen ? 'open' : ''), "aria-label": "\u0413\u043B\u0430\u0432\u043D\u0430\u044F \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F" },
        react_js_1.default.createElement("button", { className: "brand", onClick: () => controller_js_1.ui.go('spaces'), "aria-label": "\u041A\u041E\u041D\u0422\u0423\u0420 \u2014 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430" },
            react_js_1.default.createElement("span", { className: "brand-mark" },
                react_js_1.default.createElement("i", null),
                react_js_1.default.createElement("i", null),
                react_js_1.default.createElement("i", null)),
            react_js_1.default.createElement("span", null,
                react_js_1.default.createElement("b", null, "\u041A\u041E\u041D\u0422\u0423\u0420"),
                react_js_1.default.createElement("small", null, "TEAM SPACE")),
            react_js_1.default.createElement("span", { className: "brand-version" }, "6.0")),
        react_js_1.default.createElement("div", { className: "space-switch" },
            react_js_1.default.createElement("label", { htmlFor: "space-select" }, "\u0420\u0430\u0431\u043E\u0447\u0435\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E"),
            react_js_1.default.createElement("select", { id: "space-select", value: controller_js_1.ui.spaceId, onChange: (e) => e.target.value ? void controller_js_1.ui.selectSpace(e.target.value) : controller_js_1.ui.go('spaces') },
                react_js_1.default.createElement("option", { value: "" }, "\u0412\u0441\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430"),
                controller_js_1.ui.all('spaces').map(s => react_js_1.default.createElement("option", { key: s.id, value: s.id }, s.name)))),
        react_js_1.default.createElement("nav", { className: "nav-scroll" }, groups.map(group => react_js_1.default.createElement("div", { className: "nav-group", key: group.label },
            react_js_1.default.createElement("h2", null, group.label),
            group.items.map(([route, label, icon]) => react_js_1.default.createElement("button", { key: route, className: 'nav-item ' + (controller_js_1.ui.route === route ? 'active' : ''), disabled: !controller_js_1.ui.spaceId, onClick: () => controller_js_1.ui.go(route, route === 'channels' ? controller_js_1.ui.scoped('channels')[0]?.id || '' : '') },
                react_js_1.default.createElement(index_js_1.Icon, { name: icon, size: 18 }),
                react_js_1.default.createElement("span", null, label),
                route === 'inbox' && pending > 0 && react_js_1.default.createElement("b", { className: "nav-count" }, pending)))))),
        react_js_1.default.createElement("div", { className: "sidebar-footer" },
            react_js_1.default.createElement("span", { className: 'status-dot ' + (controller_js_1.ui.offline ? 'offline' : '') }),
            react_js_1.default.createElement("div", null,
                react_js_1.default.createElement("b", null, controller_js_1.ui.offline ? 'Соединение потеряно' : 'Локальный mock-runtime'),
                react_js_1.default.createElement("small", null, "\u0412\u043D\u0435\u0448\u043D\u0438\u0435 \u044D\u0444\u0444\u0435\u043A\u0442\u044B \u2014 \u044D\u043C\u0443\u043B\u044F\u0446\u0438\u044F")),
            react_js_1.default.createElement(index_js_1.Icon, { name: "shield", size: 16 })))); }
function Page() {
    if (controller_js_1.ui.route === 'spaces')
        return react_js_1.default.createElement(SetupPage_js_1.SpacesPage, null);
    if (!controller_js_1.ui.spaceId)
        return react_js_1.default.createElement(SetupPage_js_1.SpacesPage, null);
    switch (controller_js_1.ui.route) {
        case 'work': return react_js_1.default.createElement(WorkPage_js_1.WorkPage, null);
        case 'inbox': return react_js_1.default.createElement(WorkPage_js_1.InboxPage, null);
        case 'setup': return react_js_1.default.createElement(SetupPage_js_1.SetupPage, null);
        case 'projects': return react_js_1.default.createElement(ProjectsPage_js_1.ProjectsPage, null);
        case 'tasks': return react_js_1.default.createElement(ProjectsPage_js_1.TasksPage, null);
        case 'studio': return react_js_1.default.createElement(StudioPage_js_1.StudioPage, null);
        case 'actors': return react_js_1.default.createElement(StudioPage_js_1.ActorsPage, null);
        case 'runs': return react_js_1.default.createElement(RunsPage_js_1.RunsPage, null);
        case 'channels': return react_js_1.default.createElement(MessengerPage_js_1.MessengerPage, null);
        case 'assistant': return react_js_1.default.createElement(MessengerPage_js_1.AssistantPage, null);
        case 'knowledge': return react_js_1.default.createElement(KnowledgePage_js_1.KnowledgePage, null);
        case 'components': return react_js_1.default.createElement(ComponentsPage_js_1.ComponentsPage, null);
        case 'evaluations': return react_js_1.default.createElement(EvaluationsPage_js_1.EvaluationsPage, null);
        case 'releases': return react_js_1.default.createElement(ReleasesPage_js_1.ReleasesPage, null);
        case 'resources':
        case 'installations':
        case 'bindings': return react_js_1.default.createElement(PlatformPage_js_1.PlatformPage, null);
        default: return react_js_1.default.createElement(OperationsPage_js_1.OperationsPage, null);
    }
}
function App() { return react_js_1.default.createElement(react_js_1.default.Fragment, null,
    react_js_1.default.createElement("a", { className: "skip-link", href: "#main-scroll" }, "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u043C\u0443"),
    react_js_1.default.createElement(Sidebar, null),
    react_js_1.default.createElement("div", { className: "app-main" },
        react_js_1.default.createElement("header", { className: "topbar" },
            react_js_1.default.createElement("button", { className: "icon-button mobile-menu", "aria-label": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044E", "aria-expanded": controller_js_1.ui.navOpen, onClick: () => { controller_js_1.ui.navOpen = !controller_js_1.ui.navOpen; controller_js_1.ui.changed(); } },
                react_js_1.default.createElement(index_js_1.Icon, { name: "menu" })),
            react_js_1.default.createElement("div", { className: "breadcrumbs" },
                react_js_1.default.createElement("span", null, controller_js_1.ui.space?.name || 'Командная среда'),
                react_js_1.default.createElement("i", null, "/"),
                react_js_1.default.createElement("b", null, routeName(controller_js_1.ui.route))),
            react_js_1.default.createElement("div", { className: "topbar-tools" },
                controller_js_1.ui.spaceId && react_js_1.default.createElement(react_js_1.default.Fragment, null,
                    react_js_1.default.createElement("select", { className: "project-select", "aria-label": "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u0440\u043E\u0435\u043A\u0442\u0430", value: controller_js_1.ui.projectId, onChange: (e) => { controller_js_1.ui.projectId = e.target.value; controller_js_1.ui.changed(); } },
                        react_js_1.default.createElement("option", { value: "" }, "\u0412\u0441\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u044B"),
                        controller_js_1.ui.all('projects').map(p => react_js_1.default.createElement("option", { key: p.id, value: p.id }, p.name))),
                    react_js_1.default.createElement("button", { className: "icon-button top-search", "aria-label": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0443", onClick: () => controller_js_1.ui.open('search') },
                        react_js_1.default.createElement(index_js_1.Icon, { name: "search" }))),
                react_js_1.default.createElement("span", { className: "demo-pill" }, "MOCK"),
                react_js_1.default.createElement("div", { className: "identity" },
                    react_js_1.default.createElement(index_js_1.Avatar, { id: controller_js_1.ui.user?.id }),
                    react_js_1.default.createElement("select", { disabled: controller_js_1.ui.busy || controller_js_1.ui.loading, "aria-label": "\u0414\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043F\u0440\u043E\u0444\u0438\u043B\u044C", value: controller_js_1.ui.user?.id || 'maxim', onChange: (e) => void controller_js_1.ui.identity(e.target.value) }, (controller_js_1.ui.data?.catalog.users || [{ id: 'maxim', name: 'Максим', title: 'Платформенный инженер' }, { id: 'ivan', name: 'Иван', title: 'Продукт-инженер' }, { id: 'maria', name: 'Мария', title: 'Продукт-инженер' }, { id: 'anna', name: 'Анна', title: 'Владелец продукта' }]).map((u) => react_js_1.default.createElement("option", { key: u.id, value: u.id },
                        u.name,
                        " \u00B7 ",
                        u.title)))))),
        controller_js_1.ui.offline && react_js_1.default.createElement("div", { className: "offline-banner", role: "status" },
            "\u041D\u0435\u0442 \u0441\u0432\u044F\u0437\u0438 \u0441 \u0441\u0435\u0440\u0432\u0435\u0440\u043E\u043C. \u0414\u0430\u043D\u043D\u044B\u0435 \u043C\u043E\u0433\u0443\u0442 \u0431\u044B\u0442\u044C \u0443\u0441\u0442\u0430\u0440\u0435\u0432\u0448\u0438\u043C\u0438; \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0438 approval \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u044B. ",
            react_js_1.default.createElement("button", { onClick: () => void controller_js_1.ui.refresh() }, "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435")),
        controller_js_1.ui.data?.recovery && react_js_1.default.createElement("div", { className: "recovery-banner" },
            react_js_1.default.createElement("b", null, "Recovery mode"),
            " ",
            controller_js_1.ui.data.recovery.reason,
            react_js_1.default.createElement(index_js_1.Button, { small: true, disabled: controller_js_1.ui.user?.role !== 'platform', onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('storage.recover'), 'Проверенный backup восстановлен') }, "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C backup")),
        react_js_1.default.createElement("main", { id: "main-scroll", className: 'page ' + (controller_js_1.ui.route === 'channels' ? 'messenger-page' : ''), tabIndex: -1 }, controller_js_1.ui.loading || !controller_js_1.ui.data ? react_js_1.default.createElement("div", { className: "loading-screen" },
            react_js_1.default.createElement("div", { className: "spinner" }),
            react_js_1.default.createElement("h2", null, "\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u043C \u0440\u0430\u0431\u043E\u0447\u0435\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E"),
            react_js_1.default.createElement("p", null, controller_js_1.ui.loadingText || 'Загрузка сохранённого состояния…'),
            controller_js_1.ui.error && react_js_1.default.createElement(index_js_1.ErrorBox, null)) : react_js_1.default.createElement(react_js_1.default.Fragment, null,
            !controller_js_1.ui.modal && !controller_js_1.ui.gateId && react_js_1.default.createElement(index_js_1.ErrorBox, null),
            react_js_1.default.createElement(Page, null))),
        react_js_1.default.createElement("div", { className: "app-foot" },
            react_js_1.default.createElement("span", null, "\u041A\u041E\u041D\u0422\u0423\u0420 \u00B7 TEAM SPACE"),
            react_js_1.default.createElement("span", null, "\u0422\u0440\u0438 \u0440\u043E\u043B\u0438 \u00B7 \u0441\u0435\u0440\u0432\u0435\u0440\u043D\u044B\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u00B7 \u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435"))),
    controller_js_1.ui.modal && react_js_1.default.createElement(Modals_js_1.Modals, null),
    controller_js_1.ui.gateId && react_js_1.default.createElement(HumanWorkbench_js_1.HumanWorkbench, null),
    controller_js_1.ui.toast && !controller_js_1.ui.modal && !controller_js_1.ui.gateId && react_js_1.default.createElement("div", { className: "toast", role: "status" },
        react_js_1.default.createElement(index_js_1.Icon, { name: "check", size: 18 }),
        controller_js_1.ui.toast),
    controller_js_1.ui.loadingText && react_js_1.default.createElement("div", { className: "busy-overlay" },
        react_js_1.default.createElement("div", { className: "spinner" }),
        react_js_1.default.createElement("b", null, controller_js_1.ui.loadingText))); }
class RenderBridge extends react_js_1.default.Component {
    unsubscribe;
    constructor(props) { super(props); this.state = { revision: 0 }; }
    componentDidMount() { this.unsubscribe = controller_js_1.ui.subscribe(() => this.setState((state) => ({ revision: state.revision + 1 }))); void controller_js_1.ui.init().catch(e => { controller_js_1.ui.error = e; controller_js_1.ui.loading = false; controller_js_1.ui.changed(); }); }
    componentWillUnmount() { this.unsubscribe?.(); }
    render() { return react_js_1.default.createElement(App, null); }
}
react_js_1.ReactDOM.render(react_js_1.default.createElement(RenderBridge, null), document.getElementById('root'));

},
"app/Modals.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modals = Modals;
const react_js_1 = require("../shared/react.js");
const controller_js_1 = require("./controller.js");
const index_js_1 = require("../shared/ui/index.js");
function F(p) { const { kind, data = {} } = controller_js_1.ui.modal; const key = 'modal:' + kind + ':' + (data.id || data.definitionId || 'new'); return react_js_1.default.createElement(index_js_1.Field, { form: key, ...p }); }
function Modals() {
    if (!controller_js_1.ui.modal)
        return null;
    const { kind, data = {} } = controller_js_1.ui.modal;
    const key = 'modal:' + kind + ':' + (data.id || data.definitionId || 'new');
    let title = '', subtitle = '', submit = 'Сохранить', fields = null, defaults = {}, handler = async () => { }, after = () => { };
    const options = (type, predicate = () => true) => controller_js_1.ui.scoped(type).filter(predicate).map(e => ({ value: e.id, label: e.name || e.title || e.id }));
    const projects = options('projects');
    const readyEnvs = options('environments', e => e.status === 'Ready');
    const inst = options('installations', e => e.status === 'Ready');
    switch (kind) {
        case 'space':
            title = 'Новое командное пространство';
            subtitle = 'Никакие ресурсы и релизы не создаются автоматически.';
            submit = 'Создать пространство';
            defaults = { name: '', goal: '', budget: 500000, timezone: 'Europe/Amsterdam', memberIds: controller_js_1.ui.data?.catalog.users.map((u) => u.id) || ['anna', 'ivan', 'maria', 'maxim'] };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B", field: "name", required: true, placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, \u041A\u043E\u043C\u0430\u043D\u0434\u0430 \u0446\u0438\u0444\u0440\u043E\u0432\u044B\u0445 \u0441\u0435\u0440\u0432\u0438\u0441\u043E\u0432", "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u041E\u0431\u0449\u0430\u044F \u0446\u0435\u043B\u044C", field: "goal", type: "textarea", rows: 3, placeholder: "\u0417\u0430\u0447\u0435\u043C \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u044D\u0442\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u0430?" }),
                react_js_1.default.createElement("div", { className: "form-grid" },
                    react_js_1.default.createElement(F, { label: "\u041B\u0438\u043C\u0438\u0442, \u0432 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0445 demo-\u0435\u0434\u0438\u043D\u0438\u0446\u0430\u0445", field: "budget", type: "number", min: "1000", help: "100 \u0435\u0434\u0438\u043D\u0438\u0446 = 1 d\u20BD. \u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0435 \u0434\u0435\u043D\u044C\u0433\u0438 \u043D\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u0443\u044E\u0442\u0441\u044F." }),
                    react_js_1.default.createElement(F, { label: "\u0427\u0430\u0441\u043E\u0432\u043E\u0439 \u043F\u043E\u044F\u0441", field: "timezone" })),
                react_js_1.default.createElement("div", { className: "member-picker" },
                    react_js_1.default.createElement("h3", null, "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u0438 \u0442\u0440\u0438 \u0440\u043E\u043B\u0438"),
                    controller_js_1.ui.data?.catalog.users.map((u) => react_js_1.default.createElement("label", { className: "checkbox-row", key: u.id },
                        react_js_1.default.createElement("input", { type: "checkbox", checked: controller_js_1.ui.form(key, defaults).memberIds.includes(u.id), onChange: (e) => { const ids = controller_js_1.ui.form(key).memberIds; controller_js_1.ui.set(key, 'memberIds', e.target.checked ? [...ids, u.id] : ids.filter((id) => id !== u.id)); } }),
                        react_js_1.default.createElement("span", null,
                            react_js_1.default.createElement("b", null, u.name),
                            react_js_1.default.createElement("small", null, u.title))))));
            handler = f => controller_js_1.ui.cmd('space.create', { ...f, budget: Number(f.budget) });
            after = r => { void controller_js_1.ui.selectSpace(r.id).then(() => controller_js_1.ui.go('setup')); };
            break;
        case 'project':
            title = 'Новый проект';
            subtitle = 'Цель, owner, инженер, канал и task classes создаются вместе.';
            submit = 'Создать проект';
            defaults = { name: 'Статусы заявок', goal: 'Различать пустую выдачу и недоступный источник', installationId: inst[0]?.value || '', engineerId: 'ivan', budget: 100000 };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "name", required: true, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432\u0430\u044F \u0446\u0435\u043B\u044C", field: "goal", type: "textarea" }),
                react_js_1.default.createElement(F, { label: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u0430\u044F \u043E\u0441\u043D\u043E\u0432\u0430", field: "installationId", options: inst.length ? inst : [{ value: '', label: 'Можно подготовить проект без основы' }] }),
                react_js_1.default.createElement(F, { label: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442-\u0438\u043D\u0436\u0435\u043D\u0435\u0440", field: "engineerId", options: controller_js_1.ui.data.catalog.users.filter((u) => u.role === 'engineer' && controller_js_1.ui.space?.memberIds.includes(u.id)).map((u) => ({ value: u.id, label: u.name })) }),
                react_js_1.default.createElement(F, { label: "\u0411\u044E\u0434\u0436\u0435\u0442 \u043F\u0440\u043E\u0435\u043A\u0442\u0430, \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0435 demo-\u0435\u0434\u0438\u043D\u0438\u0446\u044B", field: "budget", type: "number" }));
            handler = f => controller_js_1.ui.cmd('project.create', { ...f, installationId: f.installationId || undefined, budget: Number(f.budget) });
            after = r => { controller_js_1.ui.projectId = r.id; controller_js_1.ui.go('projects', r.id); };
            break;
        case 'binding':
            title = 'Подключить инструменты';
            subtitle = 'Сервер проверяет каждое подключение отдельно. Vendor API не вызываются.';
            submit = 'Создать mock bindings';
            defaults = { projectId: controller_js_1.ui.project?.id || projects[0]?.value, kind: 'required', actions: 'read,propose' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u041F\u0440\u043E\u0435\u043A\u0442", field: "projectId", options: projects, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435", field: "kind", options: [{ value: 'required', label: 'Обязательный набор: repo + CI + model + tracker' }, { value: 'repo', label: 'Git / repository' }, { value: 'ci', label: 'CI runner' }, { value: 'model', label: 'Своя LLM / model gateway' }, { value: 'tracker', label: 'Issue tracker (read-only)' }, { value: 'broker', label: 'Event broker' }] }),
                react_js_1.default.createElement("div", { className: "info-banner" },
                    react_js_1.default.createElement(index_js_1.Icon, { name: "shield" }),
                    "Repo: read, propose \u00B7 CI: execute \u00B7 Model: execute \u00B7 Tracker: \u0442\u043E\u043B\u044C\u043A\u043E read. Secrets: mock:masked."));
            handler = async (f) => {
                const kinds = f.kind === 'required' ? ['repo', 'ci', 'model', 'tracker'] : [f.kind];
                let last;
                for (const k of kinds)
                    last = await controller_js_1.ui.cmd('binding.create', { projectId: f.projectId, kind: k, actions: k === 'tracker' ? ['read'] : k === 'repo' ? ['read', 'propose'] : ['read', 'execute'], installationId: controller_js_1.ui.entity('projects', f.projectId)?.installationId || undefined });
                return last;
            };
            after = () => controller_js_1.ui.go('bindings');
            break;
        case 'definition':
            title = 'Создать конфигурацию';
            subtitle = 'Начните с исполняемого шаблона. Все Human Gates и checks видимы в графе.';
            submit = 'Создать черновик';
            defaults = { name: data.kind === 'actor' ? 'Actor + Workflow' : 'Статусы заявок · SDLC', projectId: data.projectId || controller_js_1.ui.project?.id || projects[0]?.value, kind: data.kind || 'flow', taskClass: 'ui' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "name", required: true, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u041F\u0440\u043E\u0435\u043A\u0442", field: "projectId", options: projects }),
                react_js_1.default.createElement(F, { label: "\u0421\u043F\u043E\u0441\u043E\u0431 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438", field: "kind", options: [{ value: 'flow', label: 'Flow — граф этапов и Human Gates' }, { value: 'team', label: 'Assistant Team — coordinator и разные планы' }, { value: 'actor', label: 'Actor + Workflow / Hybrid' }] }),
                react_js_1.default.createElement(F, { label: "\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u044B\u0439 TaskClass", field: "taskClass", options: [{ value: 'ui', label: 'Информационный frontend' }, { value: 'docs', label: 'Документация' }] }),
                react_js_1.default.createElement("div", { className: "mini-flow" }, "\u041F\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 \u2192 \u0412\u043E\u043F\u0440\u043E\u0441 \u2192 \u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u2192 \u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u2192 Review"));
            handler = f => controller_js_1.ui.cmd('definition.create', { ...f, actorId: data.actorId });
            after = r => controller_js_1.ui.go('studio', r.id);
            break;
        case 'trial': {
            title = 'Пробный запуск';
            subtitle = 'Sandbox + сохранённый draft → immutable snapshot. CapabilityRelease не требуется.';
            submit = 'Начать Trial';
            const defs = options('definitions');
            const sandbox = options('environments', e => e.status === 'Ready' && e.kind === 'Sandbox');
            const selected = controller_js_1.ui.entity('definitions', data.definitionId) || controller_js_1.ui.scoped('definitions')[0];
            const task = controller_js_1.ui.entity('tasks', data.taskId);
            defaults = { definitionId: selected?.id || '', environmentId: sandbox[0]?.value || '', fixture: 'rework', taskClass: task?.taskClass || selected?.taskClass || 'ui', description: task?.description || task?.title || 'Сделать понятные статусы заявок на информационном экране', title: task?.title || 'Уточнить и реализовать состояния заявок', budget: 50000 };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u0421\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u0430\u044F \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F", field: "definitionId", options: defs, "data-autofocus": true }),
                react_js_1.default.createElement("div", { className: "form-grid" },
                    react_js_1.default.createElement(F, { label: "\u0421\u0440\u0435\u0434\u0430", field: "environmentId", options: sandbox.length ? sandbox : [{ value: '', label: 'Нет Ready Sandbox' }] }),
                    react_js_1.default.createElement(F, { label: "\u041A\u043B\u0430\u0441\u0441 \u0437\u0430\u0434\u0430\u0447\u0438", field: "taskClass", options: [{ value: 'ui', label: 'UI / frontend' }, { value: 'docs', label: 'Docs / документация' }] })),
                react_js_1.default.createElement(F, { label: "\u041F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u0435", field: "title", required: true }),
                react_js_1.default.createElement(F, { label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0438 \u0433\u0440\u0430\u043D\u0438\u0446\u044B", field: "description", type: "textarea", required: true }),
                react_js_1.default.createElement(F, { label: "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439 \u044D\u043C\u0443\u043B\u044F\u0446\u0438\u0438", field: "fixture", options: controller_js_1.ui.data.catalog.fixtures.map((f) => ({ value: f.id, label: f.name })) }),
                react_js_1.default.createElement(F, { label: "\u041E\u0431\u0449\u0438\u0439 \u043B\u0438\u043C\u0438\u0442, \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0435 demo-\u0435\u0434\u0438\u043D\u0438\u0446\u044B", field: "budget", type: "number", min: "1" }),
                react_js_1.default.createElement("div", { className: "info-banner" },
                    react_js_1.default.createElement(index_js_1.Icon, { name: "shield" }),
                    "\u041D\u0438\u043A\u0430\u043A\u0438\u0445 \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0445 PR, inference \u0438\u043B\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430. \u0421\u0435\u0440\u0432\u0435\u0440 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442 \u043A\u043B\u0430\u0441\u0441, bindings \u0438 \u043F\u0440\u0430\u0432\u0430."));
            handler = f => controller_js_1.ui.cmd('run.startTrial', { ...f, taskId: data.taskId, budget: Number(f.budget), projectId: controller_js_1.ui.entity('definitions', f.definitionId)?.projectId });
            after = r => controller_js_1.ui.go('runs', r.id);
            break;
        }
        case 'task':
            title = 'Новая проектная задача';
            subtitle = data.message ? 'Исходное сообщение останется связано с задачей.' : 'Поручение пока не запускает агента автоматически.';
            submit = 'Создать задачу';
            defaults = { projectId: data.message?.projectId || controller_js_1.ui.project?.id || projects[0]?.value, title: data.message?.text || '', description: data.message?.text || '', taskClass: 'ui', acceptance: 'Пройти проверки и инженерный Human Gate' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u041F\u0440\u043E\u0435\u043A\u0442", field: "projectId", options: projects, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "title", required: true }),
                react_js_1.default.createElement(F, { label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", field: "description", type: "textarea" }),
                react_js_1.default.createElement(F, { label: "\u041A\u0440\u0438\u0442\u0435\u0440\u0438\u0438 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430", field: "acceptance", type: "textarea", rows: 3 }),
                react_js_1.default.createElement(F, { label: "\u041A\u043B\u0430\u0441\u0441", field: "taskClass", options: ['ui', 'docs'] }));
            handler = f => controller_js_1.ui.cmd('task.create', { ...f, originMessageId: data.message?.id });
            after = r => controller_js_1.ui.go('tasks', r.id);
            break;
        case 'actor':
            title = 'Создать AI-сотрудника';
            subtitle = 'Новая identity, owner и пустая частная память.';
            submit = 'Создать Actor';
            defaults = { name: 'Алекс · AI-разработчик', template: 'developer', instruction: 'Работать только с разрешённым информационным frontend. Задавать вопросы при неоднозначности.' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u0418\u043C\u044F", field: "name", required: true, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u0423\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D\u043D\u044B\u0439 template", field: "template", options: [{ value: 'developer', label: 'AI-разработчик' }, { value: 'reviewer', label: 'AI-reviewer' }, { value: 'writer', label: 'AI-автор документации' }] }),
                react_js_1.default.createElement(F, { label: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F", field: "instruction", type: "textarea", rows: 5 }));
            handler = f => controller_js_1.ui.cmd('actor.create', { ...f, projectId: controller_js_1.ui.project?.id });
            after = () => controller_js_1.ui.go('actors');
            break;
        case 'node':
            title = 'Добавить узел';
            subtitle = 'Новый узел появится в локальном draft. Затем свяжите переходы и сохраните граф.';
            submit = 'Добавить в граф';
            defaults = { id: 'node-' + Date.now().toString(36), label: 'Новый этап', type: 'AI' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "Stable nodeId", field: "id", required: true, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "label", required: true }),
                react_js_1.default.createElement(F, { label: "\u0422\u0438\u043F \u0443\u0437\u043B\u0430", field: "type", options: controller_js_1.ui.data.catalog.nodeTypes }));
            handler = async (f) => {
                const form = controller_js_1.ui.form('studio:' + data.definitionId);
                if (form.graph.nodes.some((n) => n.id === f.id))
                    throw new Error('ID узла уже существует');
                const node = { id: f.id, label: f.label, type: f.type, x: 400, y: 250, ...(['Input', 'Approval'].includes(f.type) ? { reviewerRole: 'engineer' } : {}), ...(f.type === 'Command' ? { command: 'verify-ui' } : {}), ...(f.type === 'Condition' ? { condition: { field: 'checkPassed', op: 'truthy' } } : {}) };
                form.graph = { ...form.graph, nodes: [...form.graph.nodes, node] };
                form.selectedNode = f.id;
                controller_js_1.ui.persistForms();
                return node;
            };
            break;
        case 'edge': {
            title = 'Связать узлы';
            subtitle = 'Переход задаёт исполняемую семантику, а не только линию на canvas.';
            submit = 'Сохранить переход';
            const graph = controller_js_1.ui.form('studio:' + data.definitionId).graph;
            const nodes = graph.nodes.map((n) => ({ value: n.id, label: n.label + ' · ' + n.id }));
            defaults = { from: nodes[0]?.value, to: nodes[1]?.value, on: 'success', maxVisits: '', replace: true };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u0418\u0437 \u0443\u0437\u043B\u0430", field: "from", options: nodes, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u0412 \u0443\u0437\u0435\u043B", field: "to", options: nodes }),
                react_js_1.default.createElement(F, { label: "\u0418\u0441\u0445\u043E\u0434", field: "on", options: ['success', 'failure', 'approve', 'rework', 'true', 'false'] }),
                react_js_1.default.createElement(F, { label: "\u041B\u0438\u043C\u0438\u0442 \u043F\u043E\u0441\u0435\u0449\u0435\u043D\u0438\u0439 (\u0434\u043B\u044F \u0446\u0438\u043A\u043B\u0430)", field: "maxVisits", type: "number", min: "1", max: "20" }),
                react_js_1.default.createElement(F, { label: "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0440\u0435\u0436\u043D\u0438\u0439 \u043F\u0435\u0440\u0435\u0445\u043E\u0434 \u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u0438\u0441\u0445\u043E\u0434\u0430", field: "replace", type: "checkbox" }));
            handler = async (f) => { const form = controller_js_1.ui.form('studio:' + data.definitionId); const edges = f.replace ? form.graph.edges.filter((e) => e.from !== f.from || e.on !== f.on) : form.graph.edges; form.graph = { ...form.graph, edges: [...edges, { from: f.from, to: f.to, on: f.on, ...(f.maxVisits ? { maxVisits: Number(f.maxVisits) } : {}) }] }; controller_js_1.ui.persistForms(); return form.graph; };
            break;
        }
        case 'import-graph':
            title = 'Предпросмотр импорта';
            subtitle = 'Текущий draft не изменится, пока вы не подтвердите замену.';
            submit = 'Применить к локальному черновику';
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement("div", { className: "info-banner" },
                    "\u0423\u0437\u043B\u043E\u0432: ",
                    data.graph.nodes.length,
                    " \u00B7 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u043E\u0432: ",
                    data.graph.edges.length,
                    ". \u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440 \u2014 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435."),
                react_js_1.default.createElement("pre", { className: "code-block" }, JSON.stringify(data.graph, null, 2)));
            handler = async () => { const form = controller_js_1.ui.form('studio:' + data.definitionId); form.graph = data.graph; form.selectedNode = data.graph.nodes[0]?.id; controller_js_1.ui.persistForms(); return data.graph; };
            break;
        case 'knowledge':
            title = data.parentId ? 'Дочерняя страница' : 'Новая страница знаний';
            subtitle = 'Markdown хранится как текст. HTML и scripts не исполняются.';
            submit = 'Создать страницу';
            defaults = { title: 'Контракт API статусов', content: '# Контракт API\n\nОпишите правило, применимость и контрпример.', visibility: 'team' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "title", required: true, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u0421\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435 Markdown", field: "content", type: "textarea", rows: 7 }),
                react_js_1.default.createElement(F, { label: "\u0412\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u044C", field: "visibility", options: [{ value: 'team', label: 'Команда' }, { value: 'private', label: 'Только автор' }] }));
            handler = f => controller_js_1.ui.cmd('knowledge.create', { ...f, parentId: data.parentId, projectId: controller_js_1.ui.project?.id });
            after = r => controller_js_1.ui.go('knowledge', r.id);
            break;
        case 'save-knowledge':
            title = 'Это правило пригодится команде?';
            subtitle = 'Доработка уже продолжена. Сохранение знания — отдельное решение.';
            submit = 'Создать предложение знания';
            defaults = { title: '503 не означает пустую выдачу', appliesTo: 'Информационный frontend / API статусов', reason: data.reason || 'Различать пустой ответ и недоступность' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0430\u0442\u043E\u043C\u0430\u0440\u043D\u043E\u0433\u043E \u043F\u0440\u0430\u0432\u0438\u043B\u0430", field: "title", required: true, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u041E\u0431\u043B\u0430\u0441\u0442\u044C \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u043C\u043E\u0441\u0442\u0438", field: "appliesTo" }),
                react_js_1.default.createElement("div", { className: "source-decision" },
                    react_js_1.default.createElement("small", null, "\u0418\u0421\u0422\u041E\u0427\u041D\u0418\u041A \u00B7 REWORK DECISION"),
                    react_js_1.default.createElement("p", null, data.reason),
                    react_js_1.default.createElement("code", null, data.id)),
                react_js_1.default.createElement("p", { className: "muted" }, "\u041F\u0440\u0430\u0432\u0438\u043B\u043E \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u043A\u0430\u043A proposal. \u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u043F\u0440\u043E\u0434\u0443\u043A\u0442-\u0438\u043D\u0436\u0435\u043D\u0435\u0440\u0430. \u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 Run \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442 \u043F\u0440\u0435\u0436\u043D\u0438\u0439 snapshot."));
            handler = f => controller_js_1.ui.cmd('knowledge.propose', { ...f, sourceDecisionId: data.id });
            after = r => controller_js_1.ui.go('knowledge', r.page.id);
            break;
        case 'knowledge-link':
            title = 'Добавить типизированную связь';
            subtitle = 'Обратная ссылка строится по ID и проверяется по доступу.';
            submit = 'Связать страницы';
            defaults = { to: controller_js_1.ui.scoped('pages').find(p => p.id !== data.id)?.id || '', kind: 'explains' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement("p", null,
                    react_js_1.default.createElement("b", null, "\u0418\u0437:"),
                    " ",
                    data.title),
                react_js_1.default.createElement(F, { label: "\u0412 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443", field: "to", options: options('pages', p => p.id !== data.id), "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u0422\u0438\u043F \u0441\u0432\u044F\u0437\u0438", field: "kind", options: ['explains', 'refines', 'contradicts', 'derivedFrom', 'usedBy', 'supersedes'] }));
            handler = f => controller_js_1.ui.cmd('knowledge.link', { from: data.id, ...f });
            break;
        case 'component':
            title = 'Компонент из шаблона';
            subtitle = 'Черновая версия пригодна только для испытаний. Публикация требует peer review.';
            submit = 'Создать компонент';
            defaults = { template: data.template || 'skill', name: data.name || 'Правило обработки API', content: 'HTTP 503 означает unavailable. Не показывать пустой список при недоступности источника.' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u0422\u0438\u043F / template", field: "template", options: controller_js_1.ui.data.catalog.components.map((c) => ({ value: c.id, label: c.type })) }),
                react_js_1.default.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "name", required: true, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u0421\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435", field: "content", type: "textarea", rows: 6 }));
            handler = f => controller_js_1.ui.cmd('component.create', f);
            after = r => controller_js_1.ui.go('components', r.component.id);
            break;
        case 'component-version':
            title = 'Новая версия компонента';
            submit = 'Создать draft version';
            defaults = { version: '2.0.0', content: '' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u0412\u0435\u0440\u0441\u0438\u044F", field: "version", required: true, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u041D\u043E\u0432\u043E\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435", field: "content", type: "textarea", rows: 8, required: true }));
            handler = f => controller_js_1.ui.cmd('component.version', f, data);
            break;
        case 'revoke-component':
            title = 'Отозвать точную версию';
            subtitle = 'Новые действия затронутых Runs будут заблокированы. История сохранится.';
            submit = 'Отозвать версию';
            defaults = { reason: '' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(index_js_1.Digest, { value: data.contentDigest }),
                react_js_1.default.createElement(F, { label: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430 \u043E\u0442\u0437\u044B\u0432\u0430", field: "reason", type: "textarea", required: true, "data-autofocus": true }));
            handler = f => controller_js_1.ui.cmd('component.revoke', f, data);
            break;
        case 'evaluation': {
            title = 'Испытать зафиксированную конфигурацию';
            subtitle = 'Корзина sdlc-basket@1; результаты — synthetic evidence, не production-надежность.';
            submit = 'Выполнить evaluation';
            const snaps = controller_js_1.ui.scoped('snapshots').filter(s => controller_js_1.ui.scoped('runs').some(r => r.snapshotId === s.id && r.mode === 'trial' && r.status === 'Accepted'));
            defaults = { snapshotId: data.snapshotId || snaps.at(-1)?.id || '', track: 'human-guided' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "Snapshot \u043F\u0440\u0438\u043D\u044F\u0442\u043E\u0433\u043E Trial", field: "snapshotId", options: snaps.map(s => ({ value: s.id, label: (controller_js_1.ui.entity('definitions', s.definitionId)?.name || 'Конфигурация') + ' · ' + s.configurationDigest.slice(-10) })), "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u0420\u0435\u0436\u0438\u043C \u0443\u0447\u0430\u0441\u0442\u0438\u044F \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430", field: "track", options: ['human-guided', 'autonomous', 'expert-assisted'] }),
                react_js_1.default.createElement("p", null, "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0438: \u043D\u043E\u0440\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0443\u0442\u044C, \u043F\u0443\u0441\u0442\u043E\u0439 \u043E\u0442\u0432\u0435\u0442, HTTP 503, mutation \u0438 \u043C\u0430\u0440\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 policy fixtures. \u041D\u0435\u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0435 started \u043D\u0435 \u0438\u0441\u043A\u043B\u044E\u0447\u0430\u044E\u0442\u0441\u044F \u0438\u0437 \u0437\u043D\u0430\u043C\u0435\u043D\u0430\u0442\u0435\u043B\u044F."));
            handler = f => controller_js_1.ui.cmd('evaluation.create', f);
            after = r => controller_js_1.ui.go('evaluations', r.id);
            break;
        }
        case 'candidate': {
            title = 'Зафиксировать кандидат';
            subtitle = 'Manifest включает полный resolved lock и evidence точного configurationDigest.';
            submit = 'Подготовить кандидат';
            const evals = controller_js_1.ui.scoped('evaluations').filter(e => e.passed);
            defaults = { name: 'Статусы заявок · кандидат', evaluationId: data.evaluationId || evals.at(-1)?.id || '' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "name", required: true, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u0417\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u0430\u044F evaluation", field: "evaluationId", options: evals.map(e => ({ value: e.id, label: e.taskClass + ' · ' + e.track + ' · ' + e.configurationDigest.slice(-10) })) }),
                react_js_1.default.createElement("p", { className: "muted" }, "\u041F\u043E\u0441\u043B\u0435 \u0444\u0438\u043A\u0441\u0430\u0446\u0438\u0438: \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0434\u0443\u043A\u0442-\u0438\u043D\u0436\u0435\u043D\u0435\u0440 \u2192 PO \u2192 UAT \u2192 \u0434\u043E\u043F\u0443\u0441\u043A \u2192 \u0440\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u0435."));
            handler = f => controller_js_1.ui.cmd('candidate.create', { ...f, snapshotId: controller_js_1.ui.entity('evaluations', f.evaluationId)?.snapshotId });
            after = r => controller_js_1.ui.go('releases', r.id);
            break;
        }
        case 'deployment': {
            title = 'Разместить допущенный релиз';
            subtitle = 'Только mock Deployment. Значимые bindings закрепляются отдельным digest.';
            submit = 'Подтвердить размещение';
            const prod = options('environments', e => e.status === 'Ready' && e.kind === 'Production');
            defaults = { releaseId: data.releaseId || controller_js_1.ui.scoped('releases')[0]?.id, environmentId: prod[0]?.value || '', createEnvironment: !prod.length };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "CapabilityRelease", field: "releaseId", options: options('releases', r => r.status === 'Admitted') }),
                prod.length ? react_js_1.default.createElement(F, { label: "Production \u0441\u0440\u0435\u0434\u0430", field: "environmentId", options: prod }) : react_js_1.default.createElement(F, { label: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C mock Production \u043D\u0430 \u0433\u043E\u0442\u043E\u0432\u044B\u0445 \u0440\u0435\u0441\u0443\u0440\u0441\u0430\u0445", field: "createEnvironment", type: "checkbox" }),
                react_js_1.default.createElement("p", { className: "muted" }, "Stop plan: \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C dispatch, \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0430\u0440\u0442\u0435\u0444\u0430\u043A\u0442\u044B \u0438 \u0441\u0432\u0435\u0440\u0438\u0442\u044C \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0435 \u044D\u0444\u0444\u0435\u043A\u0442\u044B."));
            handler = async (f) => {
                let env = f.environmentId;
                if (!env && f.createEnvironment) {
                    const base = controller_js_1.ui.scoped('environments').find(e => e.kind === 'Sandbox' && e.status === 'Ready');
                    const created = await controller_js_1.ui.cmd('environment.create', { sourceId: base?.id, kind: 'Production' });
                    env = created.id;
                }
                return controller_js_1.ui.cmd('deployment.create', { releaseId: f.releaseId, environmentId: env });
            };
            after = () => controller_js_1.ui.go('environments');
            break;
        }
        case 'released-run':
            title = 'Работа по допущенному релизу';
            subtitle = 'Run использует snapshot активного Deployment, не текущий draft.';
            submit = 'Начать Released Run';
            defaults = { title: 'Следующее улучшение статусов', description: 'Улучшить информационный экран статусов заявок', taskClass: 'ui' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u041F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u0435", field: "title", required: true, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", field: "description", type: "textarea" }),
                react_js_1.default.createElement(F, { label: "\u041A\u043B\u0430\u0441\u0441", field: "taskClass", options: ['ui', 'docs'] }),
                react_js_1.default.createElement("p", null,
                    "\u0421\u0440\u0435\u0434\u0430: ",
                    controller_js_1.ui.entity('environments', data.environmentId)?.name,
                    ". \u0420\u0435\u043B\u0438\u0437: ",
                    controller_js_1.ui.entity('releases', data.releaseId)?.name,
                    "."));
            handler = f => controller_js_1.ui.cmd('run.startReleased', { ...f, deploymentId: data.id, environmentId: data.environmentId, projectId: data.projectId, fixture: 'clean' });
            after = r => controller_js_1.ui.go('runs', r.id);
            break;
        case 'product-release':
            title = 'Подготовить изменение продукта';
            subtitle = 'Это отдельный выпуск конкретного artifact digest, а не допуск способности.';
            submit = 'Создать ProductRelease';
            defaults = { runId: controller_js_1.ui.scoped('runs').find(r => r.status === 'Accepted' && !r.parentRunId)?.id };
            fields = react_js_1.default.createElement(F, { label: "\u041F\u0440\u0438\u043D\u044F\u0442\u044B\u0439 Run", field: "runId", options: controller_js_1.ui.scoped('runs').filter(r => r.status === 'Accepted' && !r.parentRunId).map(r => ({ value: r.id, label: controller_js_1.ui.entity('tasks', r.taskId)?.title || r.id })), "data-autofocus": true });
            handler = f => controller_js_1.ui.cmd('productRelease.create', f);
            break;
        case 'platform-release':
            title = 'Пакет платформы';
            subtitle = 'Подготовка отдельного пакета. Полный independent platform rollout в этой сборке не реализован.';
            submit = 'Создать PlatformRelease draft';
            defaults = { installationId: inst[0]?.value };
            fields = react_js_1.default.createElement(F, { label: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430", field: "installationId", options: inst, "data-autofocus": true });
            handler = f => controller_js_1.ui.cmd('platformRelease.create', f);
            break;
        case 'outcome':
            title = 'Наблюдение продуктовой метрики';
            subtitle = 'Только синтетический dataset с видимой зрелостью и происхождением.';
            submit = 'Запустить observation';
            defaults = { productReleaseId: data.productReleaseId || controller_js_1.ui.scoped('productReleases').find(r => r.status === 'Active')?.id, fixture: 'below-target' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u0412\u044B\u043F\u0443\u0449\u0435\u043D\u043D\u043E\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435", field: "productReleaseId", options: options('productReleases', r => r.status === 'Active') }),
                react_js_1.default.createElement(F, { label: "Synthetic dataset", field: "fixture", options: [{ value: 'below-target', label: 'Цель не достигнута' }, { value: 'achieved', label: 'Цель достигнута' }, { value: 'srm', label: 'Нарушение SRM' }, { value: 'immature', label: 'Незрелая когорта' }, { value: 'guardrail', label: 'Нарушение guardrail' }] }));
            handler = f => controller_js_1.ui.cmd('outcome.observe', f);
            after = () => controller_js_1.ui.go('outcomes');
            break;
        case 'improvement':
            title = 'Подтвердить следующее улучшение';
            subtitle = 'Создаётся новая проектная задача, а не скрытая замена релиза.';
            submit = 'Подтвердить и создать задачу';
            defaults = { title: 'Улучшить понятность статусов заявок' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement("p", null,
                    "\u0422\u0435\u043A\u0443\u0449\u0435\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 ",
                    data.value,
                    "% \u043F\u0440\u0438 \u0446\u0435\u043B\u0438 ",
                    data.target,
                    "%. \u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A: ",
                    data.provenance,
                    "."),
                react_js_1.default.createElement(F, { label: "\u0413\u0438\u043F\u043E\u0442\u0435\u0437\u0430 / \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438", field: "title", required: true, "data-autofocus": true }));
            handler = f => controller_js_1.ui.cmd('outcome.improve', { ...f, confirm: true }, data);
            after = r => controller_js_1.ui.go('tasks', r.task.id);
            break;
        case 'budget':
            title = 'Изменить общий лимит';
            subtitle = 'Дочерние поручения не получают отдельного бесконечного бюджета.';
            submit = 'Утвердить дополнительный бюджет';
            defaults = { amount: 10000 };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement("p", null,
                    "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043B\u0438\u043C\u0438\u0442: ",
                    (0, index_js_1.money)(data.budget),
                    ". \u042D\u0442\u043E \u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 demo-\u0435\u0434\u0438\u043D\u0438\u0446\u044B."),
                react_js_1.default.createElement(F, { label: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0445 \u0435\u0434\u0438\u043D\u0438\u0446", field: "amount", type: "number", min: "1", required: true, "data-autofocus": true }));
            handler = f => controller_js_1.ui.cmd('run.budget', { amount: Number(f.amount) }, data);
            break;
        case 'return-control':
            title = 'Вернуть управление агенту';
            subtitle = 'Human lease закрывается после checks, затем выдаётся новый epoch.';
            submit = 'Проверить и вернуть управление';
            defaults = { diff: 'diff --git a/src/status.ts b/src/status.ts\n+ if (response.status === 503) return "unavailable";' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "Diff \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430", field: "diff", type: "textarea", rows: 8, required: true, "data-autofocus": true }),
                react_js_1.default.createElement("div", { className: "info-banner" }, "Protected peer review \u043F\u043E\u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u043F\u0440\u043E\u0434\u0443\u043A\u0442-\u0438\u043D\u0436\u0435\u043D\u0435\u0440\u0430."));
            handler = f => controller_js_1.ui.cmd('run.control', { control: 'RETURN', diff: f.diff, behavior: { 200: 'data', 204: 'empty', 503: 'unavailable' } }, data);
            break;
        case 'edit-message':
            title = 'Изменить своё сообщение';
            subtitle = 'Прежняя revision сохранится. Decisions не изменяются.';
            submit = 'Сохранить текст';
            defaults = { text: data.text };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435", field: "text", type: "textarea", rows: 5, "data-autofocus": true }),
                react_js_1.default.createElement(index_js_1.Button, { variant: "danger", onClick: () => void controller_js_1.ui.act(async () => { await controller_js_1.ui.cmd('message.edit', { delete: true }, data); controller_js_1.ui.close(); }, 'Сообщение заменено tombstone') }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435"));
            handler = f => controller_js_1.ui.cmd('message.edit', f, data);
            break;
        case 'confirm-provision':
            title = 'Заказать ресурсы?';
            subtitle = 'Сейчас будет создан ProvisionJob. Готовность появится только после серверных проверок.';
            submit = 'Подтвердить заказ';
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement("div", { className: "confirm-quote" },
                    react_js_1.default.createElement("strong", null, (0, index_js_1.money)(data.cost)),
                    react_js_1.default.createElement("span", null, "\u0421\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0441\u043C\u0435\u0442\u0430")),
                react_js_1.default.createElement("p", null, data.items.join(' · ')),
                react_js_1.default.createElement("p", null,
                    "\u0421\u0435\u0442\u044C: ",
                    react_js_1.default.createElement("b", null, data.network),
                    ". \u0414\u0430\u0436\u0435 \u043F\u0440\u0438 \u043E\u0442\u043C\u0435\u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u043D\u044B\u0435 \u0440\u0435\u0441\u0443\u0440\u0441\u044B \u0438 \u0440\u0430\u0441\u0445\u043E\u0434\u044B \u043E\u0441\u0442\u0430\u043D\u0443\u0442\u0441\u044F \u0432\u0438\u0434\u0438\u043C\u044B\u043C\u0438."));
            handler = () => controller_js_1.ui.cmd('provision.start', { confirm: true }, data);
            break;
        case 'cancel-run':
            title = 'Остановить этот Run?';
            subtitle = 'Новые этапы остановятся. История, артефакты и понесённые расходы сохранятся.';
            submit = 'Остановить Run';
            fields = react_js_1.default.createElement("p", null, controller_js_1.ui.entity('tasks', data.taskId)?.title);
            handler = () => controller_js_1.ui.cmd('run.control', { control: 'CANCEL' }, data);
            break;
        case 'incident':
            title = 'Зафиксировать инцидент';
            submit = 'Создать инцидент';
            defaults = { title: '', reason: '', severity: 'medium' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", field: "title", required: true, "data-autofocus": true }),
                react_js_1.default.createElement(F, { label: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430 \u0438 \u043E\u0431\u043B\u0430\u0441\u0442\u044C \u0432\u043B\u0438\u044F\u043D\u0438\u044F", field: "reason", type: "textarea" }),
                react_js_1.default.createElement(F, { label: "Severity", field: "severity", options: ['low', 'medium', 'high'] }));
            handler = f => controller_js_1.ui.cmd('incident.create', { ...f, projectId: controller_js_1.ui.project?.id });
            break;
        case 'search':
            title = 'Поиск в пространстве';
            subtitle = 'Scope проверяется до выдачи названий и текстов.';
            submit = 'Найти';
            defaults = { query: '' };
            fields = react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(F, { label: "\u0417\u0430\u043F\u0440\u043E\u0441", field: "query", placeholder: "\u0417\u0430\u0434\u0430\u0447\u0438, \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F, \u043F\u0440\u0430\u0432\u0438\u043B\u0430\u2026", "data-autofocus": true }),
                react_js_1.default.createElement("div", { className: "search-results" }, controller_js_1.ui.searchResults.map(e => react_js_1.default.createElement("button", { key: e.id, className: "search-result", type: "button", onClick: () => {
                        controller_js_1.ui.close();
                        if (e.type === 'messages')
                            controller_js_1.ui.go('channels', e.channelId, e.threadId);
                        else
                            controller_js_1.ui.go({ tasks: 'tasks', pages: 'knowledge', projects: 'projects' }[e.type] || 'work', e.id);
                    } },
                    react_js_1.default.createElement("small", null, e.type),
                    react_js_1.default.createElement("b", null, e.title || e.name || e.text)))));
            handler = f => controller_js_1.ui.search(f.query);
            break;
        default: return null;
    }
    const form = controller_js_1.ui.form(key, defaults);
    return react_js_1.default.createElement("div", { className: "overlay", onMouseDown: (e) => {
            if (e.target === e.currentTarget)
                controller_js_1.ui.close();
        } },
        react_js_1.default.createElement("section", { className: 'modal modal-' + kind, role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title" },
            react_js_1.default.createElement("header", null,
                react_js_1.default.createElement("div", null,
                    react_js_1.default.createElement("span", { className: "eyebrow" }, "\u041A\u041E\u041D\u0422\u0423\u0420 / \u0414\u0415\u0419\u0421\u0422\u0412\u0418\u0415"),
                    react_js_1.default.createElement("h2", { id: "modal-title" }, title)),
                react_js_1.default.createElement("button", { className: "icon-button", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0434\u0438\u0430\u043B\u043E\u0433", onClick: () => controller_js_1.ui.close() },
                    react_js_1.default.createElement(index_js_1.Icon, { name: "close" }))),
            react_js_1.default.createElement("form", { onSubmit: (e) => {
                    e.preventDefault();
                    void controller_js_1.ui.act(async () => {
                        const result = await handler(form);
                        if (kind !== 'search') {
                            delete controller_js_1.ui.forms[key];
                            controller_js_1.ui.close();
                            after(result);
                        }
                        return result;
                    }, kind === 'search' ? '' : 'Команда сохранена');
                } },
                react_js_1.default.createElement("div", { className: "modal-body" },
                    react_js_1.default.createElement("p", { className: "modal-subtitle" }, subtitle),
                    react_js_1.default.createElement(index_js_1.ErrorBox, null),
                    fields),
                react_js_1.default.createElement("footer", null,
                    react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => controller_js_1.ui.close() }, kind === 'save-knowledge' ? 'Не сохранять' : 'Отмена'),
                    react_js_1.default.createElement(index_js_1.Button, { type: "submit", variant: ['revoke-component', 'cancel-run'].includes(kind) ? 'danger' : 'primary', disabled: controller_js_1.ui.offline }, controller_js_1.ui.busy ? 'Сохраняется…' : submit)))));
}

},
"app/controller.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ui = exports.UIController = void 0;
const api_js_1 = require("../shared/data/api.js");
class UIController {
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
            this.data = await (0, api_js_1.request)('/bootstrap');
            this.user = this.data.user;
        }
        catch {
            const session = await (0, api_js_1.request)('/demo/session', { userId: 'maxim' });
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
            const session = await (0, api_js_1.request)('/demo/session', { userId });
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
            const data = await (0, api_js_1.request)('/bootstrap' + (space ? '?spaceId=' + encodeURIComponent(space) : ''));
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
            if (e instanceof api_js_1.APIError && e.code === 'Forbidden' && this.spaceId) {
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
            throw new api_js_1.APIError({ code: 'Offline', message: 'Нет связи с сервером. Решение не сохранено.' });
        const targetId = typeof target === 'string' ? target : target?.id;
        const expectedRevision = typeof target === 'object' ? target.revision : undefined;
        const response = await (0, api_js_1.request)('/commands', { actionId: crypto.randomUUID(), type, ...(this.spaceId ? { spaceId: this.spaceId } : {}), ...(targetId ? { targetId } : {}), ...(expectedRevision !== undefined ? { expectedRevision } : {}), payload, ...extra });
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
            const ch = await (0, api_js_1.request)('/gates/' + gateId + '/challenges', {});
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
            this.audit = (await (0, api_js_1.request)('/spaces/' + this.spaceId + '/audit')).items;
            this.changed();
        }
        catch (e) {
            this.error = e;
            this.changed();
        }
    }
    async search(q) {
        try {
            this.searchResults = (await (0, api_js_1.request)('/spaces/' + this.spaceId + '/search?q=' + encodeURIComponent(q))).items;
            this.changed();
        }
        catch (e) {
            this.error = e;
            this.changed();
        }
    }
    async exportSpace() { const data = await (0, api_js_1.request)('/demo/export', { spaceId: this.spaceId }); (0, api_js_1.downloadJSON)('kontur-space-export.json', data); }
    async createPrepared() {
        await this.act(async () => {
            this.loadingText = 'Подготовленный пример: создание связанного пространства';
            const login = async (id) => { const ses = await (0, api_js_1.request)('/demo/session', { userId: id }); this.user = ses.user; this.events?.close(); this.events = null; };
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
exports.UIController = UIController;
exports.ui = new UIController();

},
"features/components/ComponentsPage.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentsPage = ComponentsPage;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const index_js_1 = require("../../shared/ui/index.js");
function ComponentsPage() {
    const component = controller_js_1.ui.entity('components', controller_js_1.ui.objectId);
    if (component) {
        const versions = controller_js_1.ui.all('componentVersions').filter(v => v.componentId === component.id);
        return react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement(index_js_1.Heading, { eyebrow: `КОМПОНЕНТЫ / ${component.componentType}`, title: component.name, description: "\u0422\u043E\u0447\u043D\u044B\u0435 \u0432\u0435\u0440\u0441\u0438\u0438, contracts, tests \u0438 \u043F\u043E\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B\u0438. \u0422\u0435\u043A\u0441\u0442 helper \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F, \u043D\u043E \u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F.", actions: react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => controller_js_1.ui.open('component-version', component) }, "\u041D\u043E\u0432\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F") }),
            react_js_1.default.createElement("div", { className: "split-grid" },
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u0412\u0435\u0440\u0441\u0438\u0438 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0430" }, versions.map(v => react_js_1.default.createElement("div", { className: "version-card", key: v.id },
                    react_js_1.default.createElement("h3", null,
                        "v",
                        v.version),
                    react_js_1.default.createElement(index_js_1.Badge, { value: v.status }),
                    react_js_1.default.createElement(index_js_1.Digest, { value: v.contentDigest }),
                    react_js_1.default.createElement(index_js_1.Markdown, { text: v.content }),
                    react_js_1.default.createElement("small", null,
                        "\u0410\u0432\u0442\u043E\u0440 ",
                        v.authorId,
                        " \u00B7 reviewer ",
                        v.reviewerId || 'не назначен',
                        " \u00B7 ",
                        (0, index_js_1.date)(v.createdAt)),
                    react_js_1.default.createElement("div", { className: "inline-actions" },
                        v.status === 'Draft' && react_js_1.default.createElement(index_js_1.Button, { small: true, onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('component.submit', {}, v)) }, "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0438 \u043F\u0435\u0440\u0435\u0434\u0430\u0442\u044C \u043D\u0430 review"),
                        v.status === 'InReview' && react_js_1.default.createElement(index_js_1.Button, { small: true, disabled: v.authorId === controller_js_1.ui.user?.id, onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('component.publish', {}, v)) }, "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C"),
                        v.status === 'Published' && react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "danger", onClick: () => controller_js_1.ui.open('revoke-component', v) }, "\u041E\u0442\u043E\u0437\u0432\u0430\u0442\u044C \u0432\u0435\u0440\u0441\u0438\u044E")),
                    v.testResult && react_js_1.default.createElement("p", { className: "muted small-text" },
                        "Mutation rejected: ",
                        String(v.testResult.wrongRejected),
                        " \u00B7 Correct accepted: ",
                        String(v.testResult.correctAccepted))))),
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u041A\u043E\u043D\u0442\u0440\u0430\u043A\u0442 \u0438 \u043F\u043E\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B\u0438" },
                    react_js_1.default.createElement("div", { className: "key-values" },
                        react_js_1.default.createElement("span", null, "Input"),
                        react_js_1.default.createElement("code", null, component.inputContract),
                        react_js_1.default.createElement("span", null, "Output"),
                        react_js_1.default.createElement("code", null, component.outputContract),
                        react_js_1.default.createElement("span", null, "Scope"),
                        react_js_1.default.createElement("b", null, component.scope),
                        react_js_1.default.createElement("span", null, "Tools"),
                        react_js_1.default.createElement("b", null, component.allowedTools.join(', '))),
                    versions.map(v => { const snapshots = controller_js_1.ui.all('snapshots').filter(s => s.lock.some((l) => l.id === v.id)); return react_js_1.default.createElement("div", { key: v.id },
                        react_js_1.default.createElement("h3", null,
                            "v",
                            v.version),
                        snapshots.map(s => react_js_1.default.createElement("div", { className: "consumer", key: s.id },
                            react_js_1.default.createElement(index_js_1.Digest, { value: s.configurationDigest }),
                            react_js_1.default.createElement("p", null, controller_js_1.ui.entity('definitions', s.definitionId)?.name),
                            react_js_1.default.createElement("small", null,
                                "Runs: ",
                                controller_js_1.ui.all('runs').filter(r => r.snapshotId === s.id).length,
                                " \u00B7 Releases: ",
                                controller_js_1.ui.all('releases').filter(r => r.snapshotId === s.id).length))),
                        !snapshots.length && react_js_1.default.createElement("p", { className: "muted" }, "\u041F\u043E\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B\u0435\u0439 \u043D\u0435\u0442.")); }))));
    }
    return react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u0420\u0410\u0417\u0420\u0410\u0411\u041E\u0422\u041A\u0410 \u0410\u0412\u0422\u041E\u041D\u041E\u041C\u041D\u041E\u0421\u0422\u0418", title: "\u041A\u0430\u0442\u0430\u043B\u043E\u0433 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432", description: "Skills, \u043F\u0440\u0430\u0432\u0438\u043B\u0430, \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u0438, \u0430\u0434\u0430\u043F\u0442\u0435\u0440\u044B \u0438 \u043F\u0440\u043E\u0444\u0438\u043B\u0438. \u041A\u0430\u0442\u0430\u043B\u043E\u0433 \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432 \u043E\u0442\u0434\u0435\u043B\u0451\u043D \u043E\u0442 \u0432\u0435\u0440\u0441\u0438\u0439 \u0432\u0430\u0448\u0435\u0439 \u043A\u043E\u043C\u0430\u043D\u0434\u044B.", actions: react_js_1.default.createElement(index_js_1.Button, { icon: "plus", onClick: () => controller_js_1.ui.open('component') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442") }),
        controller_js_1.ui.scoped('components').length > 0 && react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement("div", { className: "section-title" },
                react_js_1.default.createElement("h2", null, "\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B \u043A\u043E\u043C\u0430\u043D\u0434\u044B")),
            react_js_1.default.createElement("div", { className: "cards-grid" }, controller_js_1.ui.scoped('components').map(c => react_js_1.default.createElement("button", { className: "component-card", key: c.id, onClick: () => controller_js_1.ui.go('components', c.id) },
                react_js_1.default.createElement(index_js_1.Icon, { name: "box", size: 26 }),
                react_js_1.default.createElement("small", null, c.componentType),
                react_js_1.default.createElement("h3", null, c.name),
                react_js_1.default.createElement(index_js_1.Badge, { value: c.status }))))),
        react_js_1.default.createElement("div", { className: "section-title" },
            react_js_1.default.createElement("h2", null, "\u0428\u0430\u0431\u043B\u043E\u043D\u044B \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B"),
            react_js_1.default.createElement("span", { className: "muted" }, "\u0412\u0435\u0440\u0441\u0438\u044F 1.0.0 \u00B7 mock catalogue")),
        react_js_1.default.createElement("div", { className: "catalog-grid" }, controller_js_1.ui.data.catalog.components.map((c) => react_js_1.default.createElement("div", { className: "catalog-card", key: c.id },
            react_js_1.default.createElement("span", { className: "catalog-icon" },
                react_js_1.default.createElement(index_js_1.Icon, { name: c.id === 'knowledge' ? 'book' : c.id === 'team' ? 'team' : c.id === 'workflow' ? 'flow' : 'box', size: 23 })),
            react_js_1.default.createElement("small", null, c.type),
            react_js_1.default.createElement("h3", null, c.name),
            react_js_1.default.createElement("p", null, "\u041A\u043E\u043D\u0442\u0440\u0430\u043A\u0442, owner, \u0432\u0435\u0440\u0441\u0438\u0438 \u0438 \u0442\u043E\u0447\u043D\u044B\u0435 consumers \u043F\u043E\u0441\u043B\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u044D\u043A\u0437\u0435\u043C\u043F\u043B\u044F\u0440\u0430."),
            react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", onClick: () => controller_js_1.ui.open('component', { template: c.id, name: c.name }) },
                "\u0412\u0437\u044F\u0442\u044C \u0437\u0430 \u043E\u0441\u043D\u043E\u0432\u0443 ",
                react_js_1.default.createElement(index_js_1.Icon, { name: "arrow", size: 14 }))))));
}

},
"features/evaluations/EvaluationsPage.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationsPage = EvaluationsPage;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const index_js_1 = require("../../shared/ui/index.js");
function EvaluationsPage() {
    const evaluation = controller_js_1.ui.entity('evaluations', controller_js_1.ui.objectId), evaluations = controller_js_1.ui.scoped('evaluations');
    if (evaluation)
        return react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u0418\u0421\u041F\u042B\u0422\u0410\u041D\u0418\u042F / \u0412\u0415\u0420\u0421\u0418\u041E\u041D\u0418\u0420\u041E\u0412\u0410\u041D\u041D\u0410\u042F \u041A\u041E\u0420\u0417\u0418\u041D\u0410", title: "\u041E\u0442\u0447\u0451\u0442 \u043E\u0431 \u0438\u0441\u043F\u044B\u0442\u0430\u043D\u0438\u044F\u0445", description: `${evaluation.taskClass} · ${evaluation.track} · ${evaluation.basketVersion}`, actions: react_js_1.default.createElement(index_js_1.Button, { disabled: !evaluation.passed, onClick: () => controller_js_1.ui.open('candidate', { evaluationId: evaluation.id }) }, "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442") }),
            react_js_1.default.createElement("div", { className: "info-banner" },
                react_js_1.default.createElement(index_js_1.Icon, { name: "shield" }),
                "\u041C\u0430\u043B\u0430\u044F \u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043A\u043E\u0440\u0437\u0438\u043D\u0430. Policy/duplicate/cancel \u043E\u0431\u043E\u0437\u043D\u0430\u0447\u0435\u043D\u044B fixtures, \u0430 \u043D\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u043E\u0439 \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0445 \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0439."),
            react_js_1.default.createElement("div", { className: "metrics-grid" },
                react_js_1.default.createElement(index_js_1.Metric, { label: "\u0412\u0441\u0435 started", value: evaluation.allStarted, detail: "\u0417\u043D\u0430\u043C\u0435\u043D\u0430\u0442\u0435\u043B\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D" }),
                react_js_1.default.createElement(index_js_1.Metric, { label: "Accepted", value: evaluation.accepted, detail: "\u041F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B" }),
                react_js_1.default.createElement(index_js_1.Metric, { label: "Failures / cancellations", value: `${evaluation.failures} / ${evaluation.cancellations}`, detail: "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0438\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u043E \u0438\u0437 \u043E\u0442\u0447\u0451\u0442\u0430" }),
                react_js_1.default.createElement(index_js_1.Metric, { label: "Maturity", value: evaluation.maturity === 'complete' ? 'Завершена' : 'Предварительно', detail: `${evaluation.pending} pending · интервалы не рассчитаны` })),
            react_js_1.default.createElement(index_js_1.Panel, { title: "\u041F\u0430\u043A\u0435\u0442 \u0438 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B", actions: react_js_1.default.createElement(index_js_1.Badge, { value: evaluation.passed ? 'Accepted' : 'Failed', label: evaluation.passed ? 'Предикаты выполнены' : 'Есть ошибки' }) },
                react_js_1.default.createElement(index_js_1.Digest, { value: evaluation.configurationDigest }),
                react_js_1.default.createElement("div", { className: "table-scroll" },
                    react_js_1.default.createElement("table", null,
                        react_js_1.default.createElement("thead", null,
                            react_js_1.default.createElement("tr", null,
                                react_js_1.default.createElement("th", null, "Fixture"),
                                react_js_1.default.createElement("th", null, "\u0418\u0442\u043E\u0433"),
                                react_js_1.default.createElement("th", null, "\u041E\u0436\u0438\u0434\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043E"),
                                react_js_1.default.createElement("th", null, "\u041F\u0440\u043E\u0438\u0441\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u0435"))),
                        react_js_1.default.createElement("tbody", null, evaluation.results.map((r) => react_js_1.default.createElement("tr", { key: r.id },
                            react_js_1.default.createElement("td", null,
                                react_js_1.default.createElement("b", null, r.title),
                                react_js_1.default.createElement("small", null, r.id)),
                            react_js_1.default.createElement("td", null, r.outcome),
                            react_js_1.default.createElement("td", null,
                                react_js_1.default.createElement(index_js_1.Badge, { value: r.passed ? 'Accepted' : 'Failed' })),
                            react_js_1.default.createElement("td", null,
                                react_js_1.default.createElement("code", null, r.provenance)))))))),
            react_js_1.default.createElement("div", { className: "split-grid" },
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0441\u0430\u043C\u043E\u0433\u043E evaluator" },
                    react_js_1.default.createElement("div", { className: "check-summary" },
                        react_js_1.default.createElement("div", { className: evaluation.mutation.wrongRejected ? 'passed' : 'failed' },
                            react_js_1.default.createElement(index_js_1.Icon, { name: "shield" }),
                            react_js_1.default.createElement("b", null, "\u041D\u0430\u043C\u0435\u0440\u0435\u043D\u043D\u043E \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 diff"),
                            react_js_1.default.createElement("span", null, evaluation.mutation.wrongRejected ? 'Отклонён' : 'Не отклонён')),
                        react_js_1.default.createElement("div", { className: evaluation.mutation.correctAccepted ? 'passed' : 'failed' },
                            react_js_1.default.createElement(index_js_1.Icon, { name: "check" }),
                            react_js_1.default.createElement("b", null, "\u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442"),
                            react_js_1.default.createElement("span", null, evaluation.mutation.correctAccepted ? 'Принят' : 'Не принят'))),
                    react_js_1.default.createElement("pre", { className: "code-block" }, JSON.stringify(evaluation.mutation, null, 2))),
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u041E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u044F evidence" },
                    evaluation.limitations.map((t) => react_js_1.default.createElement("p", { key: t }, t)),
                    react_js_1.default.createElement("p", null, "\u0410\u0440\u0435\u043D\u0430 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u0451\u0442 Admission \u0438\u043B\u0438 Deployment. \u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0448\u0430\u0433 \u2014 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442 \u0438 \u043D\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043C\u044B\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F."),
                    react_js_1.default.createElement(index_js_1.Digest, { value: evaluation.contentDigest, label: "REPORT" }))));
    const f = controller_js_1.ui.form('arena', { selected: [] });
    return react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u041A\u0410\u0427\u0415\u0421\u0422\u0412\u041E / BENCHMARK / ARENA", title: "\u0418\u0441\u043F\u044B\u0442\u0430\u043D\u0438\u044F \u0438 \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435", description: "\u0421\u0440\u0430\u0432\u043D\u0438\u0432\u0430\u0439\u0442\u0435 \u043E\u0434\u0438\u043D \u043A\u043B\u0430\u0441\u0441 \u0437\u0430\u0434\u0430\u0447 \u043D\u0430 \u043E\u0431\u0449\u0435\u0439 \u043A\u043E\u0440\u0437\u0438\u043D\u0435, track \u0438 \u0431\u044E\u0434\u0436\u0435\u0442\u0435.", actions: react_js_1.default.createElement(index_js_1.Button, { icon: "play", disabled: !controller_js_1.ui.scoped('runs').some(r => r.status === 'Accepted' && r.mode === 'trial'), onClick: () => controller_js_1.ui.open('evaluation') }, "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C evaluation") }),
        evaluations.length ? react_js_1.default.createElement(index_js_1.Panel, { title: "\u041F\u0440\u043E\u0432\u0435\u0434\u0451\u043D\u043D\u044B\u0435 \u043E\u0446\u0435\u043D\u043A\u0438" },
            react_js_1.default.createElement("div", { className: "table-scroll" },
                react_js_1.default.createElement("table", null,
                    react_js_1.default.createElement("thead", null,
                        react_js_1.default.createElement("tr", null,
                            react_js_1.default.createElement("th", null, "\u0421\u0440\u0430\u0432\u043D\u0438\u0442\u044C"),
                            react_js_1.default.createElement("th", null, "\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F"),
                            react_js_1.default.createElement("th", null, "Class / track"),
                            react_js_1.default.createElement("th", null, "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442"),
                            react_js_1.default.createElement("th", null, "Started"),
                            react_js_1.default.createElement("th", null, "\u041E\u0442\u0447\u0451\u0442"))),
                    react_js_1.default.createElement("tbody", null, evaluations.slice().reverse().map(e => react_js_1.default.createElement("tr", { key: e.id },
                        react_js_1.default.createElement("td", null,
                            react_js_1.default.createElement("input", { type: "checkbox", "aria-label": 'Сравнить ' + e.id, checked: f.selected.includes(e.id), onChange: (ev) => controller_js_1.ui.set('arena', 'selected', ev.target.checked ? [...f.selected, e.id] : f.selected.filter((id) => id !== e.id)) })),
                        react_js_1.default.createElement("td", null,
                            react_js_1.default.createElement(index_js_1.Digest, { value: e.configurationDigest })),
                        react_js_1.default.createElement("td", null,
                            e.taskClass,
                            " / ",
                            e.track),
                        react_js_1.default.createElement("td", null,
                            react_js_1.default.createElement(index_js_1.Badge, { value: e.passed ? 'Accepted' : 'Failed' })),
                        react_js_1.default.createElement("td", null, e.allStarted),
                        react_js_1.default.createElement("td", null,
                            react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", onClick: () => controller_js_1.ui.go('evaluations', e.id) }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C"))))))),
            react_js_1.default.createElement("div", { className: "panel-action" },
                react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", disabled: f.selected.length < 2, onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('arena.compare', { evaluationIds: f.selected }), 'Отчёт арены сохранён. Автодопуска нет.') }, "\u0421\u0440\u0430\u0432\u043D\u0438\u0442\u044C \u0432 \u0430\u0440\u0435\u043D\u0435"))) : react_js_1.default.createElement(index_js_1.Empty, { icon: "chart", title: "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u2014 \u043F\u0440\u0438\u043D\u044F\u0442\u044B\u0439 Trial", description: "\u041E\u0446\u0435\u043D\u043A\u0430 \u0444\u0438\u043A\u0441\u0438\u0440\u0443\u0435\u0442 snapshot, \u043A\u043B\u0430\u0441\u0441, basket version \u0438 \u0440\u0435\u0436\u0438\u043C \u0443\u0447\u0430\u0441\u0442\u0438\u044F \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430." }),
        controller_js_1.ui.scoped('arenaReports').map(a => react_js_1.default.createElement(index_js_1.Panel, { key: a.id, title: "Arena Report", meta: a.track + ' · ' + a.taskClass },
            react_js_1.default.createElement(index_js_1.Badge, { value: "ReportOnly" }),
            react_js_1.default.createElement("div", { className: "table-scroll" },
                react_js_1.default.createElement("table", null,
                    react_js_1.default.createElement("thead", null,
                        react_js_1.default.createElement("tr", null,
                            react_js_1.default.createElement("th", null, "\u041A\u0430\u043D\u0434\u0438\u0434\u0430\u0442"),
                            react_js_1.default.createElement("th", null, "Correctness"),
                            react_js_1.default.createElement("th", null, "Cost"),
                            react_js_1.default.createElement("th", null, "Hard violation"),
                            react_js_1.default.createElement("th", null, "\u0414\u043E\u043F\u0443\u0441\u0442\u0438\u043C"))),
                    react_js_1.default.createElement("tbody", null, a.rows.map((r) => react_js_1.default.createElement("tr", { key: r.label },
                        react_js_1.default.createElement("td", null, r.label),
                        react_js_1.default.createElement("td", null,
                            Math.round(r.correctness * 100),
                            "%"),
                        react_js_1.default.createElement("td", null, (0, index_js_1.money)(r.cost)),
                        react_js_1.default.createElement("td", null, String(r.hardViolation)),
                        react_js_1.default.createElement("td", null, String(r.eligible))))))),
            react_js_1.default.createElement("p", { className: "muted" }, "\u041F\u0440\u0435\u0434\u043F\u043E\u0447\u0442\u0435\u043D\u0438\u0435 \u2014 \u0442\u043E\u043B\u044C\u043A\u043E evidence. \u0420\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u043B\u043E\u0441\u044C."))));
}

},
"features/knowledge/KnowledgePage.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgePage = KnowledgePage;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const index_js_1 = require("../../shared/ui/index.js");
function KnowledgePage() {
    const pages = controller_js_1.ui.scoped('pages'), page = controller_js_1.ui.entity('pages', controller_js_1.ui.objectId) || pages[0];
    if (!page)
        return react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u0417\u041D\u0410\u041D\u0418\u042F \u0418 \u041F\u0410\u041C\u042F\u0422\u042C", title: "\u041E\u043F\u044B\u0442, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0441 \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0439", description: "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u044B, \u0430\u0442\u043E\u043C\u0430\u0440\u043D\u044B\u0435 \u043F\u0440\u0430\u0432\u0438\u043B\u0430, \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u0435, peer review \u0438 \u0437\u0430\u043A\u0440\u0435\u043F\u043B\u0451\u043D\u043D\u044B\u0435 \u0432\u0435\u0440\u0441\u0438\u0438.", actions: react_js_1.default.createElement(index_js_1.Button, { icon: "plus", onClick: () => controller_js_1.ui.open('knowledge') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443") }),
            react_js_1.default.createElement(index_js_1.Empty, { icon: "book", title: "\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043F\u0435\u0440\u0432\u043E\u0435 \u043F\u0440\u0430\u0432\u0438\u043B\u043E", description: "\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0441\u043E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0438\u043B\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u0437\u0430\u043C\u0435\u0447\u0430\u043D\u0438\u0435 \u0438\u0437 Rework.", action: react_js_1.default.createElement(index_js_1.Button, { onClick: () => controller_js_1.ui.open('knowledge') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443") }));
    const key = 'knowledge:' + page.id;
    const f = controller_js_1.ui.form(key, { title: page.title, content: page.content, baseRevision: page.revision, tab: 'edit' });
    const links = controller_js_1.ui.all('knowledgeLinks').filter(l => l.from === page.id || l.to === page.id), versions = controller_js_1.ui.all('knowledgeVersions').filter(v => v.pageId === page.id), consumers = controller_js_1.ui.all('snapshots').filter(s => s.lock.some((l) => versions.some(v => v.id === l.id)));
    const save = () => void controller_js_1.ui.act(async () => { const updated = await controller_js_1.ui.cmd('knowledge.save', { title: f.title, content: f.content }, page.id, { expectedRevision: f.baseRevision }); f.baseRevision = updated.revision; return updated; }, 'Страница сохранена; опубликованные версии не изменены.');
    return react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u0417\u041D\u0410\u041D\u0418\u042F / WORKSPACE", title: "\u0411\u0430\u0437\u0430 \u0437\u043D\u0430\u043D\u0438\u0439", description: "\u041D\u043E\u0432\u0430\u044F \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F \u043D\u0435 \u043C\u0435\u043D\u044F\u0435\u0442 pinned dependencies \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 Runs.", actions: react_js_1.default.createElement(index_js_1.Button, { icon: "plus", onClick: () => controller_js_1.ui.open('knowledge') }, "\u041D\u043E\u0432\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430") }),
        react_js_1.default.createElement("div", { className: "knowledge-layout" },
            react_js_1.default.createElement("aside", { className: "knowledge-tree" },
                react_js_1.default.createElement("small", null, "\u0421\u0422\u0420\u0410\u041D\u0418\u0426\u042B \u041A\u041E\u041C\u0410\u041D\u0414\u042B"),
                pages.map(p => react_js_1.default.createElement("button", { key: p.id, style: { paddingLeft: p.parentId ? 28 : 12 }, className: p.id === page.id ? 'active' : '', onClick: () => controller_js_1.ui.go('knowledge', p.id) },
                    react_js_1.default.createElement(index_js_1.Icon, { name: "book", size: 16 }),
                    react_js_1.default.createElement("span", null, p.title),
                    p.visibility === 'private' && react_js_1.default.createElement(index_js_1.Icon, { name: "shield", size: 12 }))),
                react_js_1.default.createElement(index_js_1.Button, { variant: "ghost", small: true, icon: "plus", onClick: () => controller_js_1.ui.open('knowledge', { parentId: page.id }) }, "\u0414\u043E\u0447\u0435\u0440\u043D\u044F\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430")),
            react_js_1.default.createElement("section", { className: "knowledge-editor panel" },
                react_js_1.default.createElement("div", { className: "knowledge-document-title" },
                    react_js_1.default.createElement("input", { "aria-label": "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B", value: f.title, onChange: (e) => controller_js_1.ui.set(key, 'title', e.target.value) }),
                    react_js_1.default.createElement("div", null,
                        react_js_1.default.createElement(index_js_1.Badge, { value: page.status }),
                        react_js_1.default.createElement("small", null,
                            page.visibility === 'private' ? 'Личная страница' : 'Командное знание',
                            " \u00B7 revision ",
                            page.revision))),
                react_js_1.default.createElement(index_js_1.Tabs, { items: [{ id: 'edit', label: 'Редактор' }, { id: 'preview', label: 'Просмотр' }, { id: 'versions', label: 'Версии', count: versions.length }, { id: 'graph', label: 'Связи', count: links.length }], current: f.tab, onChange: (v) => controller_js_1.ui.set(key, 'tab', v) }),
                f.tab === 'edit' ? react_js_1.default.createElement(react_js_1.default.Fragment, null,
                    react_js_1.default.createElement("div", { className: "markdown-toolbar" }, [['H2', '\n## Заголовок\n'], ['Список', '\n- Пункт\n'], ['Код', '\n```ts\n// пример\n```\n'], ['Таблица', '\n| Состояние | Поведение |\n| --- | --- |\n| 503 | unavailable |\n'], ['Checklist', '\n- [ ] Проверка\n']].map(([label, insert]) => react_js_1.default.createElement("button", { key: label, onClick: () => controller_js_1.ui.set(key, 'content', f.content + insert) }, label))),
                    react_js_1.default.createElement("textarea", { className: "markdown-source", "aria-label": "\u0421\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B", value: f.content, onChange: (e) => controller_js_1.ui.set(key, 'content', e.target.value), spellCheck: false })) : f.tab === 'preview' ? react_js_1.default.createElement(index_js_1.Markdown, { text: f.content }) : f.tab === 'versions' ? react_js_1.default.createElement("div", { className: "version-list" }, versions.map((v, i) => react_js_1.default.createElement("div", { className: "version-card", key: v.id },
                    react_js_1.default.createElement("h3", null,
                        "\u0412\u0435\u0440\u0441\u0438\u044F ",
                        i + 1),
                    react_js_1.default.createElement(index_js_1.Badge, { value: v.status }),
                    react_js_1.default.createElement(index_js_1.Digest, { value: v.contentDigest }),
                    react_js_1.default.createElement("p", null,
                        "\u0410\u0432\u0442\u043E\u0440 ",
                        v.authorId,
                        " \u00B7 reviewer ",
                        v.reviewerId,
                        " \u00B7 ",
                        (0, index_js_1.date)(v.createdAt)),
                    react_js_1.default.createElement("p", null,
                        "\u0422\u0435\u0441\u0442\u044B: ",
                        v.tests.join(', ')),
                    react_js_1.default.createElement("details", null,
                        react_js_1.default.createElement("summary", null, "\u041D\u0435\u0438\u0437\u043C\u0435\u043D\u044F\u0435\u043C\u044B\u0439 \u0442\u0435\u043A\u0441\u0442"),
                        react_js_1.default.createElement(index_js_1.Markdown, { text: v.content }))))) : react_js_1.default.createElement("div", { className: "knowledge-graph" },
                    react_js_1.default.createElement("div", { className: "graph-center" },
                        react_js_1.default.createElement(index_js_1.Icon, { name: "book" }),
                        react_js_1.default.createElement("b", null, page.title)),
                    links.map(l => react_js_1.default.createElement("button", { className: "knowledge-link-card", key: l.id, onClick: () => controller_js_1.ui.go('knowledge', l.from === page.id ? l.to : l.from) },
                        react_js_1.default.createElement("span", null,
                            l.from === page.id ? '→' : '←',
                            " ",
                            l.kind),
                        react_js_1.default.createElement("b", null, controller_js_1.ui.entity('pages', l.from === page.id ? l.to : l.from)?.title))),
                    !links.length && react_js_1.default.createElement("p", null, "\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0442\u0438\u043F\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0443\u044E \u0441\u0432\u044F\u0437\u044C \u0441 \u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442\u043E\u043C \u0438\u043B\u0438 \u0434\u0440\u0443\u0433\u0438\u043C \u043F\u0440\u0430\u0432\u0438\u043B\u043E\u043C."),
                    react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => controller_js_1.ui.open('knowledge-link', page) }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0432\u044F\u0437\u044C")),
                f.baseRevision !== page.revision && react_js_1.default.createElement("div", { className: "conflict-panel" },
                    react_js_1.default.createElement("h3", null, "\u0421\u0435\u0440\u0432\u0435\u0440\u043D\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0430\u0441\u044C"),
                    react_js_1.default.createElement("p", null,
                        "\u0412\u0430\u0448 \u0442\u0435\u043A\u0441\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D \u0432 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435. \u041D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435 revision ",
                        page.revision,
                        ", \u0432 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435 \u2014 ",
                        f.baseRevision,
                        ". \u0421\u0440\u0430\u0432\u043D\u0438\u0442\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u0435\u0440\u0435\u0434 \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u044B\u043C \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435\u043C."),
                    react_js_1.default.createElement("details", null,
                        react_js_1.default.createElement("summary", null, "\u0410\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u0441\u0435\u0440\u0432\u0435\u0440\u0430"),
                        react_js_1.default.createElement("pre", { className: "code-block" }, page.content)),
                    react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", small: true, onClick: () => { f.baseRevision = page.revision; controller_js_1.ui.error = null; controller_js_1.ui.changed(); } }, "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E revision, \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0432 \u043C\u043E\u0439 \u0442\u0435\u043A\u0441\u0442")),
                react_js_1.default.createElement("div", { className: "editor-footer" },
                    react_js_1.default.createElement("span", null, "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u0435."),
                    react_js_1.default.createElement(index_js_1.Button, { disabled: !['engineer', 'po'].includes(controller_js_1.ui.user?.role || ''), onClick: save }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443"))),
            react_js_1.default.createElement("aside", { className: "knowledge-properties" },
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0438 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F" },
                    react_js_1.default.createElement("div", { className: "key-values" },
                        react_js_1.default.createElement("span", null, "\u0410\u0432\u0442\u043E\u0440"),
                        react_js_1.default.createElement("b", null, page.authorId || page.createdBy),
                        react_js_1.default.createElement("span", null, "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A"),
                        react_js_1.default.createElement("code", null, page.sourceDecisionId?.slice(-12) || 'Авторская страница'),
                        react_js_1.default.createElement("span", null, "\u041F\u043E\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B\u0438"),
                        react_js_1.default.createElement("b", null,
                            consumers.length,
                            " snapshots")),
                    react_js_1.default.createElement("p", { className: "muted small-text" }, "\u041F\u0443\u0431\u043B\u0438\u043A\u0443\u0435\u0442 \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0434\u0443\u043A\u0442-\u0438\u043D\u0436\u0435\u043D\u0435\u0440. \u041F\u043E\u0441\u043B\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0442\u043E\u0447\u043D\u0443\u044E \u0432\u0435\u0440\u0441\u0438\u044E \u0432 Studio."),
                    page.status === 'Draft' && react_js_1.default.createElement(index_js_1.Button, { small: true, disabled: controller_js_1.ui.user?.role !== 'engineer', onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('knowledge.submit', { tests: ['http-states@1'] }, page)) }, "\u041D\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0443"),
                    ['InReview', 'Proposed'].includes(page.status) && react_js_1.default.createElement(index_js_1.Button, { small: true, disabled: controller_js_1.ui.user?.role !== 'engineer' || (page.authorId || page.createdBy) === controller_js_1.ui.user?.id, onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('knowledge.publish', {}, page), 'Версия опубликована независимым reviewer') }, "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C \u0432\u0435\u0440\u0441\u0438\u044E"),
                    page.status === 'Published' && react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", small: true, onClick: () => controller_js_1.ui.go('studio') }, "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0432 Studio"),
                    (page.authorId || page.createdBy) === controller_js_1.ui.user?.id && ['InReview', 'Proposed'].includes(page.status) && react_js_1.default.createElement("small", { className: "review-hint" }, "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u0441\u044C \u043D\u0430 \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u043F\u0440\u043E\u0434\u0443\u043A\u0442-\u0438\u043D\u0436\u0435\u043D\u0435\u0440\u0430 \u0434\u043B\u044F \u043D\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0433\u043E review.")),
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u0421\u0441\u044B\u043B\u043A\u0438 \u0438 \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u0435" },
                    links.map(l => react_js_1.default.createElement("button", { className: "backlink", key: l.id, onClick: () => controller_js_1.ui.go('knowledge', l.from === page.id ? l.to : l.from) },
                        react_js_1.default.createElement("small", null,
                            l.from === page.id ? 'Исходящая' : 'Обратная',
                            " \u00B7 ",
                            l.kind),
                        react_js_1.default.createElement("b", null, controller_js_1.ui.entity('pages', l.from === page.id ? l.to : l.from)?.title))),
                    react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", icon: "plus", onClick: () => controller_js_1.ui.open('knowledge-link', page) }, "\u0421\u0432\u044F\u0437\u0430\u0442\u044C \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443")),
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435" },
                    consumers.map(s => react_js_1.default.createElement("button", { className: "backlink", key: s.id, onClick: () => controller_js_1.ui.go('studio', s.definitionId) },
                        react_js_1.default.createElement("b", null, controller_js_1.ui.entity('definitions', s.definitionId)?.name),
                        react_js_1.default.createElement(index_js_1.Digest, { value: s.configurationDigest }))),
                    !consumers.length && react_js_1.default.createElement("p", { className: "muted small-text" }, "\u0412\u0435\u0440\u0441\u0438\u044F \u0435\u0449\u0451 \u043D\u0435 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u0430 \u0432 snapshot.")))));
}

},
"features/messenger/MessengerPage.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessengerPage = MessengerPage;
exports.AssistantPage = AssistantPage;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const index_js_1 = require("../../shared/ui/index.js");
function ChatMessage({ m }) {
    const gate = controller_js_1.ui.entity('gates', m.gateId), run = controller_js_1.ui.entity('runs', m.runId);
    if (m.kind === 'run' && run)
        return react_js_1.default.createElement("div", { className: "chat-run" },
            react_js_1.default.createElement(index_js_1.RunCard, { run: run }),
            controller_js_1.ui.threadId !== m.threadId && react_js_1.default.createElement("button", { className: "thread-link", onClick: () => controller_js_1.ui.go('channels', m.channelId, m.threadId) },
                "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0440\u0430\u0431\u043E\u0447\u0438\u0439 \u0442\u0440\u0435\u0434 ",
                react_js_1.default.createElement(index_js_1.Icon, { name: "arrow", size: 14 })));
    return react_js_1.default.createElement("article", { className: 'chat-message ' + (m.kind === 'gate' ? 'with-gate' : '') },
        react_js_1.default.createElement(index_js_1.Avatar, { id: m.createdBy, ai: m.ai || m.createdBy === 'system' }),
        react_js_1.default.createElement("div", { className: "message-body" },
            react_js_1.default.createElement("div", { className: "message-author" },
                react_js_1.default.createElement("b", null, m.ai ? m.actorLabel || 'AI-сотрудник' : controller_js_1.ui.data.catalog.users.find((u) => u.id === m.createdBy)?.name || 'КОНТУР'),
                m.ai && react_js_1.default.createElement("span", { className: "ai-label" }, "AI \u00B7 mock@1"),
                react_js_1.default.createElement("time", null, (0, index_js_1.date)(m.createdAt)),
                m.revisions?.length > 0 && react_js_1.default.createElement("small", null, "\u0438\u0437\u043C\u0435\u043D\u0435\u043D\u043E"),
                m.pinned && react_js_1.default.createElement("span", null, "\u2316")),
            react_js_1.default.createElement("p", { className: m.tombstone ? 'tombstone' : '' }, m.text),
            gate && react_js_1.default.createElement("div", { className: "chat-gate" },
                react_js_1.default.createElement("span", null,
                    react_js_1.default.createElement(index_js_1.Badge, { value: gate.status }),
                    react_js_1.default.createElement("small", null,
                        gate.kind === 'input' ? 'Структурированный вопрос' : 'Artifact review',
                        " \u00B7 \u0440\u0435\u0432\u0438\u0437\u0438\u044F ",
                        gate.revision)),
                react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "secondary", disabled: gate.status !== 'Pending', onClick: () => void controller_js_1.ui.openGate(gate.id) }, gate.kind === 'input' ? 'Ответить' : 'Открыть ревью')),
            m.kind === 'text' && !m.tombstone && react_js_1.default.createElement("div", { className: "message-actions" },
                react_js_1.default.createElement("button", { onClick: () => void controller_js_1.ui.act(async () => { const thread = await controller_js_1.ui.cmd('thread.create', {}, m); controller_js_1.ui.go('channels', m.channelId, thread.id); }, '') }, "\u041E\u0442\u0432\u0435\u0442\u0438\u0442\u044C \u0432 \u0442\u0440\u0435\u0434\u0435"),
                react_js_1.default.createElement("button", { onClick: () => controller_js_1.ui.open('task', { message: m }) }, "\u0412 \u0437\u0430\u0434\u0430\u0447\u0443"),
                react_js_1.default.createElement("button", { onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('message.react', { emoji: '👍' }, m), '') },
                    "\uD83D\uDC4D ",
                    m.reactions?.['👍']?.length || ''),
                react_js_1.default.createElement("button", { onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('message.pin', {}, m), '') }, m.pinned ? 'Открепить' : 'Закрепить'),
                m.createdBy === controller_js_1.ui.user?.id && react_js_1.default.createElement("button", { onClick: () => controller_js_1.ui.open('edit-message', m) }, "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C"))));
}
function MessengerPage() {
    const channels = controller_js_1.ui.scoped('channels'), channel = controller_js_1.ui.entity('channels', controller_js_1.ui.channelId) || channels[0];
    if (!channel)
        return react_js_1.default.createElement(index_js_1.Empty, { icon: "chat", title: "\u041A\u0430\u043D\u0430\u043B\u044B \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430" });
    const thread = controller_js_1.ui.entity('threads', controller_js_1.ui.threadId);
    const key = 'composer:' + channel.id + ':' + (thread?.id || 'root');
    const f = controller_js_1.ui.form(key, { text: '', limit: 70 });
    const messages = controller_js_1.ui.all('messages').filter(m => m.channelId === channel.id && !m.privateTo && (thread ? m.threadId === thread.id : !m.threadId || m.kind === 'run' || controller_js_1.ui.all('threads').some(t => t.rootMessageId === m.id)));
    const send = () => void controller_js_1.ui.act(async () => { await controller_js_1.ui.cmd('message.send', { channelId: channel.id, threadId: thread?.id, text: f.text }); controller_js_1.ui.set(key, 'text', ''); setTimeout(() => { const log = document.getElementById('message-log'); log?.scrollTo(0, log.scrollHeight); }, 40); }, 'Сообщение сохранено');
    return react_js_1.default.createElement("div", { className: "messenger-layout" },
        react_js_1.default.createElement("aside", { className: "channel-list" },
            react_js_1.default.createElement("div", { className: "channel-list-title" },
                react_js_1.default.createElement(index_js_1.Icon, { name: "chat" }),
                react_js_1.default.createElement("b", null, "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F")),
            react_js_1.default.createElement("small", null, "\u041A\u0410\u041D\u0410\u041B\u042B \u041A\u041E\u041C\u0410\u041D\u0414\u042B"),
            channels.filter(c => c.kind === 'team').map(c => react_js_1.default.createElement("button", { key: c.id, className: c.id === channel.id ? 'active' : '', onClick: () => controller_js_1.ui.go('channels', c.id) },
                react_js_1.default.createElement("span", null, "#"),
                c.name)),
            react_js_1.default.createElement("small", null, "\u041F\u0420\u041E\u0415\u041A\u0422\u042B"),
            channels.filter(c => c.kind === 'project').map(c => react_js_1.default.createElement("button", { key: c.id, className: c.id === channel.id ? 'active' : '', onClick: () => controller_js_1.ui.go('channels', c.id) },
                react_js_1.default.createElement("span", null, "#"),
                c.name)),
            react_js_1.default.createElement("small", null, "\u041B\u0418\u0427\u041D\u041E\u0415"),
            react_js_1.default.createElement("button", { onClick: () => controller_js_1.ui.go('assistant') },
                react_js_1.default.createElement(index_js_1.Icon, { name: "spark", size: 17 }),
                "\u041C\u043E\u0439 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442")),
        react_js_1.default.createElement("section", { className: "conversation" },
            react_js_1.default.createElement("header", { className: "conversation-head" },
                react_js_1.default.createElement("div", null,
                    react_js_1.default.createElement("h1", null, thread ? react_js_1.default.createElement(react_js_1.default.Fragment, null,
                        react_js_1.default.createElement("button", { className: "icon-button", "aria-label": "\u041D\u0430\u0437\u0430\u0434 \u0432 \u043A\u0430\u043D\u0430\u043B", onClick: () => controller_js_1.ui.go('channels', channel.id) }, "\u2190"),
                        thread.title) : '# ' + channel.name),
                    react_js_1.default.createElement("p", null, thread ? 'Рабочий тред · ' + (thread.rootRunId || 'обсуждение') : 'Люди и AI · ' + controller_js_1.ui.space?.memberIds.length + ' участников · без скрытых решений')),
                react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", icon: "search", onClick: () => controller_js_1.ui.open('search') }, "\u041F\u043E\u0438\u0441\u043A")),
            react_js_1.default.createElement("div", { className: "message-log", id: "message-log", role: "log", "aria-label": "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439" },
                messages.length > f.limit && react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "secondary", onClick: () => controller_js_1.ui.set(key, 'limit', f.limit + 70) }, "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F"),
                messages.slice(-f.limit).map(m => react_js_1.default.createElement(ChatMessage, { key: m.id, m: m })),
                !messages.length && react_js_1.default.createElement("div", { className: "channel-empty" },
                    react_js_1.default.createElement("span", null, "#"),
                    react_js_1.default.createElement("h2", null,
                        "\u041D\u0430\u0447\u0430\u043B\u043E \u043A\u0430\u043D\u0430\u043B\u0430 ",
                        channel.name),
                    react_js_1.default.createElement("p", null, "\u041E\u0431\u0441\u0443\u0436\u0434\u0430\u0439\u0442\u0435 \u0440\u0430\u0431\u043E\u0442\u0443, \u043E\u0431\u0440\u0430\u0449\u0430\u0439\u0442\u0435\u0441\u044C \u043A \u043A\u043E\u043B\u043B\u0435\u0433\u0430\u043C \u0447\u0435\u0440\u0435\u0437 @\u0418\u043C\u044F \u0438 \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0439\u0442\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0432 \u0437\u0430\u0434\u0430\u0447\u0438."))),
            react_js_1.default.createElement("form", { className: "composer", onSubmit: (e) => { e.preventDefault(); send(); } },
                react_js_1.default.createElement("label", { className: "sr-only", htmlFor: "message-input" }, "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0432 \u043A\u0430\u043D\u0430\u043B"),
                react_js_1.default.createElement("textarea", { id: "message-input", rows: 3, value: f.text, onChange: (e) => controller_js_1.ui.set(key, 'text', e.target.value), placeholder: thread ? 'Ответить в треде…' : `Написать в #${channel.name}…`, onKeyDown: (e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            send();
                        }
                    } }),
                react_js_1.default.createElement("div", null,
                    react_js_1.default.createElement("span", null,
                        "\u0422\u0435\u043A\u0441\u0442 \u0438 \u0440\u0435\u0430\u043A\u0446\u0438\u0438 \u043D\u0435 \u044F\u0432\u043B\u044F\u044E\u0442\u0441\u044F approval. ",
                        react_js_1.default.createElement("kbd", null, "Ctrl \u21B5")),
                    react_js_1.default.createElement(index_js_1.Button, { type: "submit", icon: "arrow", disabled: !f.text.trim() || controller_js_1.ui.offline }, "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C")))));
}
function AssistantPage() { const key = 'assistant'; const f = controller_js_1.ui.form(key, { text: '' }); const messages = controller_js_1.ui.all('messages').filter(m => m.privateTo === controller_js_1.ui.user?.id && ['private', 'assistant'].includes(m.kind)); return react_js_1.default.createElement(react_js_1.default.Fragment, null,
    react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u041B\u0418\u0427\u041D\u041E\u0415 / \u0422\u041E\u041B\u042C\u041A\u041E \u0414\u041B\u042F \u0412\u0410\u0421", title: "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442", description: "\u041F\u043E\u043C\u043E\u0433\u0430\u0435\u0442 \u0441 \u043E\u0447\u0435\u0440\u0435\u0434\u044C\u044E \u0438 \u0444\u043E\u0440\u043C\u0443\u043B\u0438\u0440\u043E\u0432\u043A\u0430\u043C\u0438. \u041D\u0435 \u043F\u043E\u0434\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442 approval \u0438 \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0431\u0435\u0437 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F." }),
    react_js_1.default.createElement("div", { className: "assistant-layout" },
        react_js_1.default.createElement(index_js_1.Panel, { title: "\u0412\u0430\u0448 \u0447\u0430\u0441\u0442\u043D\u044B\u0439 \u0434\u0438\u0430\u043B\u043E\u0433", meta: "\u041E\u0442\u0432\u0435\u0442\u044B \u0434\u0435\u0442\u0435\u0440\u043C\u0438\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u044B; \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0430\u044F LLM \u043D\u0435 \u0432\u044B\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F" },
            react_js_1.default.createElement("div", { className: "assistant-messages" }, messages.length ? messages.map(m => react_js_1.default.createElement(ChatMessage, { key: m.id, m: m })) : react_js_1.default.createElement(index_js_1.Empty, { icon: "spark", title: `Чем займёмся, ${controller_js_1.ui.user?.name}?`, description: "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u0435, \u043A\u0430\u043A\u0438\u0435 \u043F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u044F \u043E\u0436\u0438\u0434\u0430\u044E\u0442 \u0432\u0430\u0441, \u0438\u043B\u0438 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C\u0442\u0435 \u043D\u043E\u0432\u0443\u044E \u0437\u0430\u0434\u0430\u0447\u0443." })),
            react_js_1.default.createElement("form", { onSubmit: (e) => { e.preventDefault(); void controller_js_1.ui.act(async () => { await controller_js_1.ui.cmd('message.send', { private: true, text: f.text }); controller_js_1.ui.set(key, 'text', ''); }, ''); } },
                react_js_1.default.createElement(index_js_1.Field, { label: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0443", form: key, field: "text", type: "textarea", placeholder: "\u0427\u0442\u043E \u043E\u0436\u0438\u0434\u0430\u0435\u0442 \u043C\u043E\u0435\u0433\u043E \u0440\u0435\u0448\u0435\u043D\u0438\u044F?" }),
                react_js_1.default.createElement(index_js_1.Button, { type: "submit", disabled: !f.text.trim() }, "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C"))),
        react_js_1.default.createElement(index_js_1.Panel, { title: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u043F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u0435" },
            react_js_1.default.createElement("p", null, "\u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u0441\u043E\u0437\u0434\u0430\u0441\u0442 \u043B\u0438\u0447\u043D\u043E\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435. \u041F\u0440\u043E\u0435\u043A\u0442\u043D\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0441\u043B\u0435 \u0432\u0430\u0448\u0435\u0433\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F."),
            react_js_1.default.createElement(index_js_1.Field, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438", form: key, field: "title", placeholder: "\u0423\u043B\u0443\u0447\u0448\u0438\u0442\u044C \u043F\u043E\u043D\u044F\u0442\u043D\u043E\u0441\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432 \u0437\u0430\u044F\u0432\u043E\u043A" }),
            react_js_1.default.createElement(index_js_1.Button, { disabled: !controller_js_1.ui.project || !f.title?.trim(), onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('assistant.propose', { projectId: controller_js_1.ui.project?.id, title: f.title })) }, "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435"),
            controller_js_1.ui.scoped('assistantProposals').map(p => react_js_1.default.createElement("div", { className: "assistant-proposal", key: p.id },
                react_js_1.default.createElement("h3", null, p.title),
                react_js_1.default.createElement(index_js_1.Badge, { value: p.status }),
                p.status === 'Pending' && react_js_1.default.createElement("div", { className: "inline-actions" },
                    react_js_1.default.createElement(index_js_1.Button, { small: true, onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('assistant.confirm', { confirm: true }, p), 'Задача создана после подтверждения') }, "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C"),
                    react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "secondary", onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('assistant.confirm', { confirm: false }, p), 'Предложение отменено. Задача не создана.') }, "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C"))))))); }

},
"features/operations/OperationsPage.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationsPage = OperationsPage;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const index_js_1 = require("../../shared/ui/index.js");
function OperationsPage() {
    const route = controller_js_1.ui.route;
    if (route === 'costs') {
        const costs = controller_js_1.ui.scoped('costs'), total = costs.reduce((x, c) => x + c.amount, 0), human = costs.filter(c => c.category === 'human').reduce((x, c) => x + c.amount, 0), infra = costs.filter(c => c.category === 'infrastructure').reduce((x, c) => x + c.amount, 0);
        return react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u042D\u041A\u041E\u041D\u041E\u041C\u0418\u041A\u0410", title: "\u0421\u043C\u0435\u0442\u0430, \u0440\u0435\u0437\u0435\u0440\u0432\u044B \u0438 \u0444\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u044B", description: "\u0426\u0435\u043B\u044B\u0435 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0435 \u0435\u0434\u0438\u043D\u0438\u0446\u044B, append-only ledger \u0438 \u043E\u0431\u0449\u0438\u0439 \u0431\u044E\u0434\u0436\u0435\u0442 root Run. \u0412\u0441\u0451 \u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435." }),
            react_js_1.default.createElement("div", { className: "metrics-grid" },
                react_js_1.default.createElement(index_js_1.Metric, { label: "\u0412\u0441\u0435\u0433\u043E", value: (0, index_js_1.money)(total), detail: "\u0417\u0430 \u0432\u0441\u044E \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430" }),
                react_js_1.default.createElement(index_js_1.Metric, { label: "\u0418\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430", value: (0, index_js_1.money)(infra), detail: "Provisioned resources" }),
                react_js_1.default.createElement(index_js_1.Metric, { label: "\u0427\u0435\u043B\u043E\u0432\u0435\u0447\u0435\u0441\u043A\u043E\u0435 \u0432\u0440\u0435\u043C\u044F", value: (0, index_js_1.money)(human), detail: "\u041E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0435 \u0437\u0430\u043F\u0438\u0441\u0438 Human Gate" }),
                react_js_1.default.createElement(index_js_1.Metric, { label: "\u0418\u0441\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 \u0438 \u043E\u0446\u0435\u043D\u043A\u0430", value: (0, index_js_1.money)(total - human - infra), detail: "\u041C\u043E\u0434\u0435\u043B\u044C, \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B \u0438 evaluation" })),
            react_js_1.default.createElement(index_js_1.Panel, { title: "Ledger", meta: "\u041F\u043E\u0432\u0442\u043E\u0440 eventId \u043D\u0435 \u0443\u0434\u0432\u0430\u0438\u0432\u0430\u0435\u0442 \u0440\u0430\u0441\u0445\u043E\u0434\u044B. Adjustment \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u044C, \u043D\u0435 \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442 \u0438\u0441\u0442\u043E\u0440\u0438\u044E." },
                react_js_1.default.createElement("div", { className: "table-scroll" },
                    react_js_1.default.createElement("table", null,
                        react_js_1.default.createElement("thead", null,
                            react_js_1.default.createElement("tr", null,
                                react_js_1.default.createElement("th", null, "\u0412\u0440\u0435\u043C\u044F"),
                                react_js_1.default.createElement("th", null, "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F"),
                                react_js_1.default.createElement("th", null, "\u0421\u0443\u043C\u043C\u0430"),
                                react_js_1.default.createElement("th", null, "Run / \u0440\u0435\u0441\u0443\u0440\u0441"),
                                react_js_1.default.createElement("th", null, "Event / origin"))),
                        react_js_1.default.createElement("tbody", null, costs.slice().reverse().map(c => react_js_1.default.createElement("tr", { key: c.id },
                            react_js_1.default.createElement("td", null, (0, index_js_1.date)(c.createdAt)),
                            react_js_1.default.createElement("td", null, c.category),
                            react_js_1.default.createElement("td", null,
                                react_js_1.default.createElement("b", null, (0, index_js_1.money)(c.amount))),
                            react_js_1.default.createElement("td", null,
                                react_js_1.default.createElement("code", null, c.runId?.slice(-10) || c.resourceId?.slice(-10) || '—')),
                            react_js_1.default.createElement("td", null,
                                react_js_1.default.createElement("code", null, c.originRef || c.eventId))))))),
                !costs.length && react_js_1.default.createElement("p", { className: "muted" }, "\u0420\u0430\u0441\u0445\u043E\u0434\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.")));
    }
    if (route === 'audit')
        return react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u041F\u041B\u0410\u0422\u0424\u041E\u0420\u041C\u0410 / AUDIT", title: "\u0421\u043E\u0431\u044B\u0442\u0438\u044F \u0438 \u0440\u0435\u0448\u0435\u043D\u0438\u044F", description: "\u0421\u043E\u0431\u044B\u0442\u0438\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0443\u0435\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0443\u0441\u0442\u043E\u0439\u0447\u0438\u0432\u043E\u0433\u043E commit. \u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 JSON \u043D\u0435 \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F WORM-\u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435\u043C.", actions: react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => void controller_js_1.ui.loadAudit() }, "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C") }),
            react_js_1.default.createElement(index_js_1.Panel, { title: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 200 \u0441\u043E\u0431\u044B\u0442\u0438\u0439" },
                react_js_1.default.createElement("div", { className: "audit-list" }, controller_js_1.ui.audit.slice().reverse().map(e => react_js_1.default.createElement("div", { className: "audit-row", key: e.eventId },
                    react_js_1.default.createElement("span", { className: "audit-seq" }, e.sequence),
                    react_js_1.default.createElement("div", null,
                        react_js_1.default.createElement("b", null, e.type),
                        react_js_1.default.createElement("small", null,
                            (0, index_js_1.date)(e.recordedAt),
                            " \u00B7 ",
                            e.actorRef,
                            " \u00B7 ",
                            e.aggregateId)),
                    react_js_1.default.createElement("code", null, e.causationId?.slice(-15))))),
                !controller_js_1.ui.audit.length && react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => void controller_js_1.ui.loadAudit() }, "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u043E\u0431\u044B\u0442\u0438\u044F")));
    if (route === 'outcomes')
        return react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u041F\u0420\u041E\u0414\u0423\u041A\u0422 / OUTCOME", title: "\u041E\u0442 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430 \u043A \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u043C\u0443 \u0443\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u044E", description: "\u041C\u0435\u0442\u0440\u0438\u043A\u0438 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430 \u043D\u0435 \u0441\u043C\u0435\u0448\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0441 Benchmark \u0430\u0433\u0435\u043D\u0442\u0430. \u041D\u0430\u0431\u043B\u044E\u0434\u0435\u043D\u0438\u044F \u044F\u0432\u043D\u043E \u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435.", actions: react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'po' || !controller_js_1.ui.scoped('productReleases').some(r => r.status === 'Active'), onClick: () => controller_js_1.ui.open('outcome') }, "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C observation") }),
            controller_js_1.ui.scoped('outcomes').length ? controller_js_1.ui.scoped('outcomes').slice().reverse().map(o => react_js_1.default.createElement(index_js_1.Panel, { key: o.id, title: controller_js_1.ui.entity('projects', o.projectId)?.name, meta: o.metricContract.metric },
                react_js_1.default.createElement("div", { className: "outcome-row" },
                    react_js_1.default.createElement("div", null,
                        react_js_1.default.createElement("strong", null,
                            o.value,
                            "%"),
                        react_js_1.default.createElement("p", null,
                            "\u0426\u0435\u043B\u044C ",
                            o.target,
                            "% \u00B7 baseline ",
                            o.baseline,
                            "%")),
                    react_js_1.default.createElement("div", null,
                        react_js_1.default.createElement(index_js_1.Badge, { value: o.srm || o.guardrailViolation ? 'Blocked' : o.maturity === 'complete' ? 'Completed' : 'Pending', label: o.srm ? 'SRM' : o.guardrailViolation ? 'Guardrail violation' : o.maturity }),
                        react_js_1.default.createElement("p", null,
                            o.observations,
                            " \u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u043D\u0430\u0431\u043B\u044E\u0434\u0435\u043D\u0438\u0439"),
                        react_js_1.default.createElement("small", null, o.provenance))),
                react_js_1.default.createElement("p", null, o.value < o.target ? 'Цель пока не достигнута. Можно сформулировать гипотезу и создать новую in-scope задачу.' : 'Цель достигнута в synthetic dataset. Это не результат реального клиентского исследования.'),
                react_js_1.default.createElement("div", { className: "inline-actions" },
                    react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'po', onClick: () => controller_js_1.ui.open('improvement', o) }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0443\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u0435"),
                    react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", disabled: controller_js_1.ui.user?.role !== 'po', onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('outcome.scale', {}, o), 'Рекомендация сохранена. Автоматический rollout не выполнялся.') }, "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435")))) : react_js_1.default.createElement(index_js_1.Empty, { icon: "chart", title: "\u041D\u0430\u0431\u043B\u044E\u0434\u0435\u043D\u0438\u0439 \u0435\u0449\u0451 \u043D\u0435\u0442", description: "\u0412\u044B\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u043E\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430, \u0437\u0430\u0442\u0435\u043C \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 synthetic dataset." }));
    const envs = controller_js_1.ui.scoped('environments'), activeRuns = controller_js_1.ui.scoped('runs').filter(r => !r.parentRunId && !['Accepted', 'Failed', 'Cancelled'].includes(r.status));
    return react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement(index_js_1.Heading, { eyebrow: route === 'monitoring' ? 'НАБЛЮДЕНИЕ / МОНИТОРИНГ' : 'ПЛАТФОРМА / ОКРУЖЕНИЯ', title: route === 'monitoring' ? 'Состояние рабочего контура' : 'Среды и размещения', description: "Sandbox, UAT \u0438 Production \u043D\u0435 \u043C\u0435\u043D\u044F\u044E\u0442 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044E \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0435\u0433\u043E Run.", actions: react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.exportSpace(), 'Экспорт сохранён без sessions, secrets и private actor memory') }, "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430") }),
        react_js_1.default.createElement("div", { className: "environment-grid" }, envs.map(env => react_js_1.default.createElement(index_js_1.Panel, { key: env.id, title: env.name, meta: "Mock environment" },
            react_js_1.default.createElement(index_js_1.Badge, { value: env.status }),
            react_js_1.default.createElement("div", { className: "key-values" },
                react_js_1.default.createElement("span", null, "Runs \u0432 \u0440\u0430\u0431\u043E\u0442\u0435"),
                react_js_1.default.createElement("b", null, activeRuns.filter(r => r.environmentId === env.id).length),
                react_js_1.default.createElement("span", null, "\u0420\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u044F"),
                react_js_1.default.createElement("b", null, controller_js_1.ui.scoped('deployments').filter(d => d.environmentId === env.id && d.status === 'Active').length),
                react_js_1.default.createElement("span", null, "\u0420\u0435\u0441\u0443\u0440\u0441\u044B"),
                react_js_1.default.createElement("b", null, controller_js_1.ui.scoped('resources').filter(r => r.environmentId === env.id).length)),
            controller_js_1.ui.scoped('deployments').filter(d => d.environmentId === env.id).map(d => react_js_1.default.createElement("div", { className: "deployment-mini", key: d.id },
                react_js_1.default.createElement("b", null, controller_js_1.ui.entity('releases', d.releaseId)?.name),
                react_js_1.default.createElement(index_js_1.Badge, { value: d.status }),
                react_js_1.default.createElement(index_js_1.Digest, { value: d.bindingDigest, label: "BINDINGS" }),
                react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "secondary", disabled: controller_js_1.ui.user?.role !== 'platform', onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('deployment.control', { action: d.status === 'Paused' ? 'resume' : 'pause' }, d)) }, d.status === 'Paused' ? 'Продолжить dispatch' : 'Приостановить dispatch')))))),
        !envs.length && react_js_1.default.createElement(index_js_1.Empty, { icon: "cloud", title: "\u0421\u0440\u0435\u0434\u044B \u0435\u0449\u0451 \u043D\u0435 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043B\u0435\u043D\u044B", action: react_js_1.default.createElement(index_js_1.Button, { onClick: () => controller_js_1.ui.go('setup') }, "\u041D\u0430\u0447\u0430\u0442\u044C setup") }),
        react_js_1.default.createElement(index_js_1.Panel, { title: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u0435\u0439" },
            react_js_1.default.createElement("div", { className: "status-line" },
                react_js_1.default.createElement("span", null,
                    react_js_1.default.createElement("b", null, controller_js_1.ui.data.simulator.auto ? 'Автоматический ход' : 'Ручной ход'),
                    react_js_1.default.createElement("small", null, "\u0428\u0430\u0433\u0438 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442 Node.js, \u0434\u0430\u0436\u0435 \u043A\u043E\u0433\u0434\u0430 \u0432\u043A\u043B\u0430\u0434\u043A\u0430 \u0437\u0430\u043A\u0440\u044B\u0442\u0430.")),
                react_js_1.default.createElement("div", { className: "inline-actions" },
                    react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "secondary", disabled: controller_js_1.ui.user?.role === 'po', onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('simulator.configure', { auto: !controller_js_1.ui.data.simulator.auto })) }, controller_js_1.ui.data.simulator.auto ? 'Ручной режим' : 'Автоматический режим'),
                    react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "secondary", disabled: controller_js_1.ui.user?.role === 'po', onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('simulator.step'), '') }, "\u0412\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u043E\u0434\u0438\u043D \u0448\u0430\u0433")))),
        activeRuns.length > 0 && react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement("div", { className: "section-title" },
                react_js_1.default.createElement("h2", null, "\u0422\u0440\u0435\u0431\u0443\u0435\u0442 \u043D\u0430\u0431\u043B\u044E\u0434\u0435\u043D\u0438\u044F")),
            react_js_1.default.createElement("div", { className: "run-grid" }, activeRuns.map(r => react_js_1.default.createElement(index_js_1.RunCard, { key: r.id, run: r })))),
        react_js_1.default.createElement(index_js_1.Panel, { title: "\u0418\u043D\u0446\u0438\u0434\u0435\u043D\u0442\u044B", actions: react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", onClick: () => controller_js_1.ui.open('incident') }, "\u0417\u0430\u0444\u0438\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0438\u043D\u0446\u0438\u0434\u0435\u043D\u0442") },
            controller_js_1.ui.scoped('incidents').map(i => react_js_1.default.createElement("div", { className: "list-row", key: i.id },
                react_js_1.default.createElement("span", null,
                    react_js_1.default.createElement("b", null, i.title),
                    react_js_1.default.createElement("small", null, i.reason)),
                react_js_1.default.createElement(index_js_1.Badge, { value: i.status }))),
            !controller_js_1.ui.scoped('incidents').length && react_js_1.default.createElement("p", { className: "muted" }, "\u0418\u043D\u0446\u0438\u0434\u0435\u043D\u0442\u043E\u0432 \u043D\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043E. \u041E\u0436\u0438\u0434\u0430\u043D\u0438\u0435 Human Gate \u0441\u0430\u043C\u043E \u043F\u043E \u0441\u0435\u0431\u0435 \u043D\u0435 \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0430\u0432\u0430\u0440\u0438\u0435\u0439.")));
}

},
"features/operations/WorkPage.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkPage = WorkPage;
exports.InboxPage = InboxPage;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const index_js_1 = require("../../shared/ui/index.js");
function WorkPage() { const runs = controller_js_1.ui.scoped('runs').filter(r => !r.parentRunId), active = runs.filter(r => !['Accepted', 'Failed', 'Cancelled'].includes(r.status)); const mine = controller_js_1.ui.scoped('humanTasks').filter(h => h.status === 'Pending' && h.assigneeId === controller_js_1.ui.user?.id); const spend = controller_js_1.ui.scoped('costs').reduce((a, c) => a + c.amount, 0); return react_js_1.default.createElement(react_js_1.default.Fragment, null,
    react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u0420\u0410\u0411\u041E\u0422\u0410 / \u041C\u041E\u0419 \u0414\u0415\u041D\u042C", title: `За работу, ${controller_js_1.ui.user?.name}`, description: "\u0417\u0434\u0435\u0441\u044C \u0433\u043B\u0430\u0432\u043D\u043E\u0435: \u0447\u0442\u043E \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F, \u0433\u0434\u0435 \u043D\u0443\u0436\u0435\u043D \u0432\u0430\u0448 \u043E\u0442\u0432\u0435\u0442 \u0438 \u0447\u0442\u043E \u0443\u0436\u0435 \u043F\u0440\u0438\u043D\u044F\u0442\u043E.", actions: react_js_1.default.createElement(index_js_1.Button, { icon: "plus", disabled: !controller_js_1.ui.project, onClick: () => controller_js_1.ui.open('task') }, "\u041F\u043E\u0440\u0443\u0447\u0438\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443") }),
    react_js_1.default.createElement("div", { className: "work-hero" },
        react_js_1.default.createElement("div", null,
            react_js_1.default.createElement("span", { className: "eyebrow" }, "\u041B\u042E\u0414\u0418 + AI \u00B7 \u041E\u0414\u041D\u0410 \u041A\u041E\u041C\u0410\u041D\u0414\u0410"),
            react_js_1.default.createElement("h2", null, mine.length ? 'Ваше решение продолжит работу.' : active.length ? 'Работа продолжается в вашем контуре.' : 'Хорошая работа начинается с ясной задачи.'),
            react_js_1.default.createElement("p", null, mine.length ? `${mine.length} поручений ожидают вашего участия. Откройте пакет и примите решение по просмотренной версии.` : controller_js_1.ui.all('definitions').length ? 'Запустите черновик в Sandbox. Релиз для пробной работы не нужен.' : 'Подготовьте основу, подключите проект и соберите первый конвейер.'),
            react_js_1.default.createElement(index_js_1.Button, { variant: "light", icon: mine.length ? 'inbox' : 'play', onClick: () => mine.length ? controller_js_1.ui.go('inbox') : controller_js_1.ui.all('definitions').length ? controller_js_1.ui.open('trial') : controller_js_1.ui.go('setup') },
                mine.length ? 'Открыть входящие' : controller_js_1.ui.all('definitions').length ? 'Пробный запуск' : 'Подготовить пространство',
                react_js_1.default.createElement(index_js_1.Icon, { name: "arrow", size: 16 }))),
        react_js_1.default.createElement("div", { className: "hero-orbit", "aria-hidden": "true" },
            react_js_1.default.createElement("div", { className: "orbit-ring ring-one" }),
            react_js_1.default.createElement("div", { className: "orbit-ring ring-two" }),
            react_js_1.default.createElement("span", { className: "orbit-center" },
                react_js_1.default.createElement(index_js_1.Icon, { name: "flow", size: 44 })),
            react_js_1.default.createElement("span", { className: "orbit-node n1" },
                react_js_1.default.createElement(index_js_1.Icon, { name: "team", size: 23 })),
            react_js_1.default.createElement("span", { className: "orbit-node n2" },
                react_js_1.default.createElement(index_js_1.Icon, { name: "shield", size: 23 })),
            react_js_1.default.createElement("span", { className: "orbit-node n3" },
                react_js_1.default.createElement(index_js_1.Icon, { name: "check", size: 23 })),
            react_js_1.default.createElement("span", { className: "orbit-label" }, "\u041A\u043E\u043D\u0442\u0440\u043E\u043B\u044C \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0443 \u043A\u043E\u043C\u0430\u043D\u0434\u044B"))),
    react_js_1.default.createElement("div", { className: "metrics-grid" },
        react_js_1.default.createElement(index_js_1.Metric, { label: "\u041E\u0436\u0438\u0434\u0430\u044E\u0442 \u0432\u0430\u0441", value: mine.length, detail: "\u0412\u043E\u043F\u0440\u043E\u0441\u044B, \u0440\u0435\u0432\u044C\u044E \u0438 \u0431\u044E\u0434\u0436\u0435\u0442", icon: "inbox" }),
        react_js_1.default.createElement(index_js_1.Metric, { label: "\u0412 \u0440\u0430\u0431\u043E\u0442\u0435", value: active.length, detail: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u043A\u043E\u0440\u043D\u0435\u0432\u044B\u0435 Runs", icon: "play" }),
        react_js_1.default.createElement(index_js_1.Metric, { label: "\u041F\u0440\u0438\u043D\u044F\u0442\u043E", value: runs.filter(r => r.status === 'Accepted').length, detail: `Из ${runs.length} начатых · ${runs.some(r => !['Accepted', 'Failed', 'Cancelled'].includes(r.status)) ? 'когорта предварительная' : 'когорта завершена'}`, icon: "check" }),
        react_js_1.default.createElement(index_js_1.Metric, { label: "\u0424\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0437\u0430\u0442\u0440\u0430\u0442\u044B", value: (0, index_js_1.money)(spend), detail: "\u041C\u043E\u0434\u0435\u043B\u044C, \u0438\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u0438 \u0447\u0435\u043B\u043E\u0432\u0435\u043A \u00B7 demo", icon: "chart" })),
    react_js_1.default.createElement("div", { className: "work-columns" },
        react_js_1.default.createElement("div", null,
            react_js_1.default.createElement(index_js_1.Panel, { title: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u044F", meta: mine.length ? 'Решения по актуальным пакетам' : 'Ваша персональная очередь', actions: react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", onClick: () => controller_js_1.ui.go('inbox') },
                    "\u0412\u0441\u0435 \u0432\u0445\u043E\u0434\u044F\u0449\u0438\u0435 ",
                    react_js_1.default.createElement(index_js_1.Icon, { name: "arrow", size: 14 })) }, mine.length ? mine.slice(0, 4).map(h => react_js_1.default.createElement("div", { className: "attention-row", key: h.id },
                react_js_1.default.createElement("span", { className: 'attention-icon ' + (h.kind === 'input' ? 'question' : '') },
                    react_js_1.default.createElement(index_js_1.Icon, { name: h.kind === 'input' ? 'chat' : 'shield' })),
                react_js_1.default.createElement("div", null,
                    react_js_1.default.createElement("b", null, h.title),
                    react_js_1.default.createElement("small", null,
                        controller_js_1.ui.entity('projects', h.projectId)?.name,
                        " \u00B7 ",
                        h.kind === 'input' ? 'Human Input' : h.kind === 'budget' ? 'Решение о бюджете' : 'Human Approval')),
                react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", small: true, onClick: () => h.gateId ? void controller_js_1.ui.openGate(h.gateId) : controller_js_1.ui.open('budget', controller_js_1.ui.entity('runs', h.runId)) }, h.kind === 'input' ? 'Ответить' : 'Открыть'))) : react_js_1.default.createElement("div", { className: "quiet-state" },
                react_js_1.default.createElement(index_js_1.Icon, { name: "check", size: 24 }),
                react_js_1.default.createElement("div", null,
                    react_js_1.default.createElement("b", null, "\u0412\u0441\u0451 \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u043E"),
                    react_js_1.default.createElement("p", null, "\u041A\u043E\u0433\u0434\u0430 \u043F\u043E\u043D\u0430\u0434\u043E\u0431\u0438\u0442\u0441\u044F \u0432\u0430\u0448 \u043E\u0442\u0432\u0435\u0442, \u043F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u0435 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C.")))),
            react_js_1.default.createElement("div", { className: "section-title" },
                react_js_1.default.createElement("h2", null, "\u0420\u0430\u0431\u043E\u0442\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u044B"),
                react_js_1.default.createElement("button", { onClick: () => controller_js_1.ui.go('runs') },
                    "\u0412\u0441\u0435 \u0437\u0430\u043F\u0443\u0441\u043A\u0438 ",
                    react_js_1.default.createElement(index_js_1.Icon, { name: "arrow", size: 15 }))),
            runs.length ? react_js_1.default.createElement("div", { className: "run-grid" }, (active.length ? active : runs.slice().reverse()).slice(0, 4).map(r => react_js_1.default.createElement(index_js_1.RunCard, { key: r.id, run: r }))) : react_js_1.default.createElement(index_js_1.Empty, { icon: "flow", title: "\u041F\u0435\u0440\u0432\u044B\u0439 \u0437\u0430\u043F\u0443\u0441\u043A \u0435\u0449\u0451 \u0432\u043F\u0435\u0440\u0435\u0434\u0438", description: "\u0417\u0434\u0435\u0441\u044C \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0440\u0435\u0430\u043B\u044C\u043D\u043E \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043D\u044B\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u044D\u043C\u0443\u043B\u044F\u0442\u043E\u0440\u0430, \u0431\u0435\u0437 \u0432\u044B\u0434\u0443\u043C\u0430\u043D\u043D\u043E\u0439 \u0438\u0441\u0442\u043E\u0440\u0438\u0438.", action: controller_js_1.ui.scoped('definitions').length ? react_js_1.default.createElement(index_js_1.Button, { onClick: () => controller_js_1.ui.open('trial') }, "\u041D\u0430\u0447\u0430\u0442\u044C \u043F\u0440\u043E\u0431\u043D\u0443\u044E \u0440\u0430\u0431\u043E\u0442\u0443") : react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => controller_js_1.ui.go('studio') }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C Studio") })),
        react_js_1.default.createElement("div", null,
            react_js_1.default.createElement(index_js_1.Panel, { title: "\u0420\u0430\u0431\u043E\u0447\u0438\u0439 \u043A\u043E\u043D\u0442\u0443\u0440", className: "context-panel" },
                react_js_1.default.createElement("div", { className: "context-symbol" },
                    react_js_1.default.createElement(index_js_1.Icon, { name: "layers", size: 28 })),
                react_js_1.default.createElement("h3", null, controller_js_1.ui.space?.name),
                react_js_1.default.createElement("p", null, controller_js_1.ui.space?.goal || 'Командная среда автономной разработки'),
                react_js_1.default.createElement("div", { className: "context-checks" }, [['Ресурсы', controller_js_1.ui.scoped('environments').some(e => e.status === 'Ready'), 'resources'], ['Основа', controller_js_1.ui.scoped('installations').some(e => e.status === 'Ready'), 'installations'], ['Проект', !!controller_js_1.ui.project, 'projects'], ['Конвейер', !!controller_js_1.ui.scoped('definitions').length, 'studio']].map(([label, ready, route]) => react_js_1.default.createElement("button", { key: String(label), onClick: () => controller_js_1.ui.go(String(route)) },
                    react_js_1.default.createElement("span", null,
                        react_js_1.default.createElement(index_js_1.Icon, { name: ready ? 'check' : 'clock', size: 16 }),
                        String(label)),
                    react_js_1.default.createElement("b", null, ready ? 'Готово' : 'Настроить →')))),
                react_js_1.default.createElement("div", { className: "team-avatars" },
                    controller_js_1.ui.space?.memberIds.map((id) => react_js_1.default.createElement(index_js_1.Avatar, { key: id, id: id })),
                    react_js_1.default.createElement("span", null,
                        controller_js_1.ui.space?.memberIds.length,
                        " \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430"))),
            react_js_1.default.createElement("div", { className: "principle-card" },
                react_js_1.default.createElement(index_js_1.Icon, { name: "book", size: 23 }),
                react_js_1.default.createElement("h3", null, "\u041E\u043F\u044B\u0442 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u0437\u043D\u0430\u043D\u0438\u0435\u043C"),
                react_js_1.default.createElement("p", null, "\u0417\u0430\u043C\u0435\u0447\u0430\u043D\u0438\u0435 \u043A \u0440\u0430\u0431\u043E\u0442\u0435 \u043C\u043E\u0436\u043D\u043E \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C, \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0438 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043A \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0439 \u0432\u0435\u0440\u0441\u0438\u0438. \u0422\u0435\u043A\u0443\u0449\u0438\u0439 Run \u043D\u0435 \u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F \u0441\u043A\u0440\u044B\u0442\u043E."),
                react_js_1.default.createElement("button", { onClick: () => controller_js_1.ui.go('knowledge') },
                    "\u0411\u0430\u0437\u0430 \u0437\u043D\u0430\u043D\u0438\u0439 ",
                    react_js_1.default.createElement(index_js_1.Icon, { name: "arrow", size: 15 })))))); }
function InboxPage() { const gates = controller_js_1.ui.scoped('gates').filter(g => g.status === 'Pending'), mine = gates.filter(g => g.assigneeId === controller_js_1.ui.user?.id); const f = controller_js_1.ui.form('inbox', { filter: 'mine' }); const visible = f.filter === 'mine' ? mine : gates; return react_js_1.default.createElement(react_js_1.default.Fragment, null,
    react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u0420\u0410\u0411\u041E\u0422\u0410 / HUMAN INBOX", title: "\u0420\u0435\u0448\u0435\u043D\u0438\u044F \u0438 \u0432\u043E\u043F\u0440\u043E\u0441\u044B", description: "\u041E\u0434\u0438\u043D gateId \u0432 \u0447\u0430\u0442\u0435, \u0432\u0445\u043E\u0434\u044F\u0449\u0438\u0445 \u0438 \u0442\u0440\u0430\u0441\u0441\u0435. \u0420\u0435\u0448\u0435\u043D\u0438\u0435 \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u0440\u0438\u043D\u044F\u0442\u044C \u0434\u0432\u0430\u0436\u0434\u044B." }),
    react_js_1.default.createElement("div", { className: "tabs" },
        react_js_1.default.createElement("button", { className: f.filter === 'mine' ? 'active' : '', onClick: () => controller_js_1.ui.set('inbox', 'filter', 'mine') },
            "\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u044B \u043C\u043D\u0435 ",
            react_js_1.default.createElement("span", null, mine.length)),
        react_js_1.default.createElement("button", { className: f.filter === 'all' ? 'active' : '', onClick: () => controller_js_1.ui.set('inbox', 'filter', 'all') },
            "\u0412\u0441\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430 ",
            react_js_1.default.createElement("span", null, gates.length))),
    visible.length ? react_js_1.default.createElement("div", { className: "inbox-list" }, visible.map(g => react_js_1.default.createElement("div", { className: "inbox-card", key: g.id },
        react_js_1.default.createElement("span", { className: "attention-icon" },
            react_js_1.default.createElement(index_js_1.Icon, { name: g.kind === 'input' ? 'chat' : 'shield', size: 23 })),
        react_js_1.default.createElement("div", null,
            react_js_1.default.createElement("div", { className: "eyebrow" },
                g.kind === 'input' ? 'HUMAN INPUT' : 'ENGINEERING REVIEW',
                " \u00B7 \u041F\u043E\u043F\u044B\u0442\u043A\u0430 ",
                g.attempt),
            react_js_1.default.createElement("h3", null, g.title),
            react_js_1.default.createElement("p", null, controller_js_1.ui.entity('tasks', g.taskId)?.title),
            react_js_1.default.createElement("small", null,
                (0, index_js_1.date)(g.createdAt),
                " \u00B7 ",
                controller_js_1.ui.data.catalog.users.find((u) => u.id === g.assigneeId)?.name || 'Не назначен',
                " \u00B7 revision ",
                g.revision)),
        react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => void controller_js_1.ui.openGate(g.id) }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043A\u0435\u0442")))) : react_js_1.default.createElement(index_js_1.Empty, { icon: "inbox", title: "\u041E\u0436\u0438\u0434\u0430\u044E\u0449\u0438\u0445 \u0440\u0435\u0448\u0435\u043D\u0438\u0439 \u043D\u0435\u0442", description: "\u0412\u043E\u043F\u0440\u043E\u0441\u044B \u0430\u0433\u0435\u043D\u0442\u043E\u0432 \u0438 \u043F\u0430\u043A\u0435\u0442\u044B \u0440\u0435\u0432\u044C\u044E \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u043F\u0443\u0441\u043A\u0430 \u0440\u0430\u0431\u043E\u0442\u044B." })); }

},
"features/platform/PlatformPage.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformPage = PlatformPage;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const index_js_1 = require("../../shared/ui/index.js");
function PlatformPage() {
    const route = controller_js_1.ui.route;
    if (route === 'resources')
        return react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u041F\u041B\u0410\u0422\u0424\u041E\u0420\u041C\u0410", title: "\u0420\u0435\u0441\u0443\u0440\u0441\u044B \u0438 \u0441\u0435\u0440\u0432\u0438\u0441\u044B", description: "\u041F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u043C\u043E\u0435 \u0438 \u0444\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 mock-\u0438\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u044B.", actions: react_js_1.default.createElement(index_js_1.Button, { icon: "cloud", onClick: () => controller_js_1.ui.go('setup') }, "\u041A\u0430\u0442\u0430\u043B\u043E\u0433 \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432") }),
            controller_js_1.ui.scoped('resources').length ? react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement("div", { className: "resource-topology" },
                    react_js_1.default.createElement("div", { className: "topology-core" },
                        react_js_1.default.createElement(index_js_1.Icon, { name: "cloud", size: 36 }),
                        react_js_1.default.createElement("h3", null, controller_js_1.ui.space?.name),
                        react_js_1.default.createElement("span", null, "\u0418\u0437\u043E\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 demo namespace")),
                    react_js_1.default.createElement("div", { className: "topology-services" }, controller_js_1.ui.scoped('resources').map(r => react_js_1.default.createElement("div", { key: r.id },
                        react_js_1.default.createElement(index_js_1.Icon, { name: "box" }),
                        react_js_1.default.createElement("b", null, r.kind),
                        react_js_1.default.createElement(index_js_1.Badge, { value: r.status }))))),
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u0420\u0430\u0437\u0432\u0451\u0440\u043D\u0443\u0442\u044B\u0435 \u0440\u0435\u0441\u0443\u0440\u0441\u044B" },
                    react_js_1.default.createElement("div", { className: "table-scroll" },
                        react_js_1.default.createElement("table", null,
                            react_js_1.default.createElement("thead", null,
                                react_js_1.default.createElement("tr", null,
                                    react_js_1.default.createElement("th", null, "\u0420\u0435\u0441\u0443\u0440\u0441"),
                                    react_js_1.default.createElement("th", null, "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435"),
                                    react_js_1.default.createElement("th", null, "Endpoint alias"),
                                    react_js_1.default.createElement("th", null, "\u0421\u0435\u0442\u044C"),
                                    react_js_1.default.createElement("th", null, "\u0410\u0440\u0435\u043D\u0434\u0430 \u0434\u043E"))),
                            react_js_1.default.createElement("tbody", null, controller_js_1.ui.scoped('resources').map(r => react_js_1.default.createElement("tr", { key: r.id },
                                react_js_1.default.createElement("td", null,
                                    react_js_1.default.createElement("b", null, r.kind),
                                    react_js_1.default.createElement("small", null, r.id)),
                                react_js_1.default.createElement("td", null,
                                    react_js_1.default.createElement(index_js_1.Badge, { value: r.status })),
                                react_js_1.default.createElement("td", null,
                                    react_js_1.default.createElement("code", null, r.endpointAlias)),
                                react_js_1.default.createElement("td", null, r.network),
                                react_js_1.default.createElement("td", null, (0, index_js_1.date)(r.leaseExpiresAt))))))))) : react_js_1.default.createElement(index_js_1.Empty, { icon: "cloud", title: "\u0420\u0435\u0441\u0443\u0440\u0441\u044B \u0435\u0449\u0451 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u044B", action: react_js_1.default.createElement(index_js_1.Button, { onClick: () => controller_js_1.ui.go('setup') }, "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E") }));
    if (route === 'bindings')
        return react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u041F\u041B\u0410\u0422\u0424\u041E\u0420\u041C\u0410 / \u0414\u041E\u0421\u0422\u0423\u041F\u042B", title: "\u0418\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0438 \u0438 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F", description: "Read \u043D\u0435 \u043E\u0437\u043D\u0430\u0447\u0430\u0435\u0442 write. \u041A\u0430\u0436\u0434\u043E\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0438\u043C\u0435\u0435\u0442 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0435 actions, scope \u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0443.", actions: react_js_1.default.createElement(index_js_1.Button, { icon: "plus", disabled: controller_js_1.ui.user?.role !== 'platform' || !controller_js_1.ui.project, onClick: () => controller_js_1.ui.open('binding') }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435") }),
            react_js_1.default.createElement("div", { className: "info-banner" },
                react_js_1.default.createElement(index_js_1.Icon, { name: "shield" }),
                "\u0422\u043E\u043B\u044C\u043A\u043E mock:// endpoints. \u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0435 \u0442\u043E\u043A\u0435\u043D\u044B \u043D\u0435 \u043D\u0443\u0436\u043D\u044B \u0438 \u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442\u0441\u044F."),
            controller_js_1.ui.scoped('bindings').length ? react_js_1.default.createElement("div", { className: "cards-grid" }, controller_js_1.ui.scoped('bindings').map(b => react_js_1.default.createElement(index_js_1.Panel, { key: b.id, title: b.kind === 'model' ? 'Своя LLM / Model Gateway' : b.kind.toUpperCase() },
                react_js_1.default.createElement(index_js_1.Badge, { value: b.status }),
                react_js_1.default.createElement("p", null,
                    react_js_1.default.createElement("code", null, b.endpoint)),
                react_js_1.default.createElement("div", { className: "chip-row" }, b.actions.map((a) => react_js_1.default.createElement("span", { className: "chip", key: a }, a))),
                react_js_1.default.createElement("div", { className: "key-values" },
                    react_js_1.default.createElement("span", null, "\u041F\u0440\u043E\u0435\u043A\u0442"),
                    react_js_1.default.createElement("b", null, controller_js_1.ui.entity('projects', b.projectId)?.name),
                    react_js_1.default.createElement("span", null, "Secret"),
                    react_js_1.default.createElement("code", null, "mock:\u2022\u2022\u2022\u2022\u2022\u2022"),
                    react_js_1.default.createElement("span", null, "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0438"),
                    react_js_1.default.createElement("b", null, "Connection + scope \u00B7 synthetic")),
                react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", small: true, onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('tool.invoke', { action: 'read' }, b), 'Mock-read выполнен') }, "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0447\u0442\u0435\u043D\u0438\u0435")))) : react_js_1.default.createElement(index_js_1.Empty, { title: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B \u043F\u0440\u043E\u0435\u043A\u0442\u0430", description: "\u0414\u043B\u044F \u0437\u0430\u043F\u0443\u0441\u043A\u0430 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u044B repo, CI \u0438 model bindings.", action: react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'platform' || !controller_js_1.ui.project, onClick: () => controller_js_1.ui.open('binding') }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435") }));
    const selected = controller_js_1.ui.entity('installations', controller_js_1.ui.objectId);
    return react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u041F\u041B\u0410\u0422\u0424\u041E\u0420\u041C\u0410 / \u0423\u0421\u0422\u0410\u041D\u041E\u0412\u041B\u0415\u041D\u041D\u042B\u0415 \u0421\u0418\u0421\u0422\u0415\u041C\u042B", title: selected?.name || 'Установленные основы', description: "\u0412\u0435\u0440\u0441\u0438\u044F runtime \u0437\u0430\u043A\u0440\u0435\u043F\u043B\u044F\u0435\u0442\u0441\u044F \u0432 snapshot. \u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0435 \u043F\u043E\u0434\u043C\u0435\u043D\u044F\u0435\u0442 \u0443\u0436\u0435 \u043D\u0430\u0447\u0430\u0442\u0443\u044E \u0440\u0430\u0431\u043E\u0442\u0443.", actions: react_js_1.default.createElement(index_js_1.Button, { onClick: () => controller_js_1.ui.go('setup') }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043E\u0441\u043D\u043E\u0432\u0443") }),
        selected ? react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement("div", { className: "split-grid" },
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0438 \u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442" },
                    react_js_1.default.createElement(index_js_1.Badge, { value: selected.status }),
                    react_js_1.default.createElement("div", { className: "key-values" },
                        react_js_1.default.createElement("span", null, "\u0420\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u0435"),
                        react_js_1.default.createElement("b", null, selected.placement),
                        react_js_1.default.createElement("span", null, "Health"),
                        react_js_1.default.createElement("b", null, selected.health),
                        react_js_1.default.createElement("span", null, "Adapter"),
                        react_js_1.default.createElement("code", null, "kontur-mock@1"),
                        react_js_1.default.createElement("span", null, "\u0422\u0435\u043A\u0443\u0449\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F"),
                        react_js_1.default.createElement("code", null, controller_js_1.ui.entity('installationVersions', selected.currentVersionId)?.version)),
                    react_js_1.default.createElement("h3", null, "\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 controls"),
                    react_js_1.default.createElement("div", { className: "chip-row" }, selected.controls.map((c) => react_js_1.default.createElement("span", { className: "chip", key: c }, c))),
                    react_js_1.default.createElement("h3", null, "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0435 \u0443\u0437\u043B\u044B"),
                    react_js_1.default.createElement("p", null, selected.supportedNodeTypes.join(' · ')),
                    selected.status === 'Failed' && react_js_1.default.createElement(index_js_1.Button, { onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('job.retry', {}, selected.jobId)) }, "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0443")),
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F \u0438 \u0432\u0435\u0440\u0441\u0438\u0438" },
                    selected.composition && react_js_1.default.createElement("pre", { className: "code-block" }, JSON.stringify(selected.composition, null, 2)),
                    controller_js_1.ui.all('installationVersions').filter(v => v.installationId === selected.id).map(v => react_js_1.default.createElement("div", { className: "list-row", key: v.id },
                        react_js_1.default.createElement("b", null, v.version),
                        react_js_1.default.createElement(index_js_1.Digest, { value: v.contentDigest, label: "RUNTIME" }))),
                    react_js_1.default.createElement(index_js_1.Field, { form: 'install:' + selected.id, label: "\u041D\u043E\u0432\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F mock-\u043F\u0430\u043A\u0435\u0442\u0430", field: "version", defaultValue: "demo-2" }),
                    react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'platform', onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('installation.update', { version: controller_js_1.ui.form('install:' + selected.id).version || 'demo-2' }, selected)) }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E revision"))),
            selected.impact && react_js_1.default.createElement(index_js_1.Panel, { title: "\u0412\u043B\u0438\u044F\u043D\u0438\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F" }, selected.impact.map((r) => react_js_1.default.createElement("p", { key: r.runId },
                r.runId,
                ": \u043F\u0440\u0435\u0436\u043D\u0438\u0439 binding \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D (",
                r.pinnedRevisionId,
                ").")))) : controller_js_1.ui.scoped('installations').length ? react_js_1.default.createElement("div", { className: "cards-grid" }, controller_js_1.ui.scoped('installations').map(i => react_js_1.default.createElement("div", { className: "project-card", key: i.id },
            react_js_1.default.createElement("div", { className: "project-top" },
                react_js_1.default.createElement(index_js_1.Icon, { name: i.kind === 'team' ? 'team' : 'flow', size: 28 }),
                react_js_1.default.createElement(index_js_1.Badge, { value: i.status })),
            react_js_1.default.createElement("button", { className: "link-title", onClick: () => controller_js_1.ui.go('installations', i.id) }, i.name),
            react_js_1.default.createElement("p", null, i.placement),
            react_js_1.default.createElement("div", { className: "chip-row" }, i.controls.slice(0, 4).map((c) => react_js_1.default.createElement("span", { className: "chip", key: c }, c))),
            react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => controller_js_1.ui.go('installations', i.id) }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0443")))) : react_js_1.default.createElement(index_js_1.Empty, { icon: "box", title: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u043E\u0439 \u043E\u0441\u043D\u043E\u0432\u044B", action: react_js_1.default.createElement(index_js_1.Button, { onClick: () => controller_js_1.ui.go('setup') }, "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0435") }));
}

},
"features/projects/ProjectsPage.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsPage = ProjectsPage;
exports.TasksPage = TasksPage;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const index_js_1 = require("../../shared/ui/index.js");
function ProjectsPage() { const selected = controller_js_1.ui.entity('projects', controller_js_1.ui.objectId); return react_js_1.default.createElement(react_js_1.default.Fragment, null,
    react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u0420\u0410\u0417\u0420\u0410\u0411\u041E\u0422\u041A\u0410 \u0410\u0412\u0422\u041E\u041D\u041E\u041C\u041D\u041E\u0421\u0422\u0418", title: selected?.name || 'Проекты', description: selected?.goal || 'Цель, команда, задача и способ работы связаны точными идентификаторами.', actions: react_js_1.default.createElement(index_js_1.Button, { icon: "plus", onClick: () => controller_js_1.ui.open('project') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442") }),
    selected ? react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement("div", { className: "metrics-grid" },
            react_js_1.default.createElement(index_js_1.Metric, { label: "\u0426\u0435\u043B\u044C \u043C\u0435\u0442\u0440\u0438\u043A\u0438", value: selected.metricContract.target + '%', detail: selected.metricContract.metric, icon: "chart" }),
            react_js_1.default.createElement(index_js_1.Metric, { label: "\u0411\u044E\u0434\u0436\u0435\u0442 \u043F\u0440\u043E\u0435\u043A\u0442\u0430", value: (0, index_js_1.money)(selected.budget), detail: "\u0421\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043B\u0438\u043C\u0438\u0442", icon: "shield" }),
            react_js_1.default.createElement(index_js_1.Metric, { label: "\u0420\u0430\u0431\u043E\u0447\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438", value: controller_js_1.ui.all('tasks').filter(t => t.projectId === selected.id && !t.parentTaskId).length, detail: "\u0411\u0435\u0437 \u0434\u043E\u0447\u0435\u0440\u043D\u0438\u0445 \u043F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u0439", icon: "tasks" }),
            react_js_1.default.createElement(index_js_1.Metric, { label: "\u0421\u0440\u0435\u0434\u044B", value: controller_js_1.ui.scoped('environments').filter(e => e.status === 'Ready').length, detail: "\u0413\u043E\u0442\u043E\u0432\u044B\u0435 mock environments", icon: "cloud" })),
        react_js_1.default.createElement(index_js_1.Panel, { title: "\u041F\u0430\u0441\u043F\u043E\u0440\u0442 \u043F\u0440\u043E\u0435\u043A\u0442\u0430" },
            react_js_1.default.createElement("div", { className: "key-values" },
                react_js_1.default.createElement("span", null, "\u0412\u043B\u0430\u0434\u0435\u043B\u0435\u0446"),
                react_js_1.default.createElement("b", null,
                    react_js_1.default.createElement(index_js_1.Avatar, { id: selected.ownerId }),
                    " ",
                    controller_js_1.ui.data.catalog.users.find((u) => u.id === selected.ownerId)?.name),
                react_js_1.default.createElement("span", null, "\u041F\u0440\u043E\u0434\u0443\u043A\u0442-\u0438\u043D\u0436\u0435\u043D\u0435\u0440"),
                react_js_1.default.createElement("b", null,
                    react_js_1.default.createElement(index_js_1.Avatar, { id: selected.engineerId }),
                    " ",
                    controller_js_1.ui.data.catalog.users.find((u) => u.id === selected.engineerId)?.name),
                react_js_1.default.createElement("span", null, "\u0420\u0435\u043F\u043E\u0437\u0438\u0442\u043E\u0440\u0438\u0439"),
                react_js_1.default.createElement("code", null, selected.repo),
                react_js_1.default.createElement("span", null, "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u0430\u044F \u043E\u0441\u043D\u043E\u0432\u0430"),
                react_js_1.default.createElement("b", null, controller_js_1.ui.entity('installations', selected.installationId)?.name || 'Не выбрана')),
            react_js_1.default.createElement("div", { className: "inline-actions" },
                react_js_1.default.createElement(index_js_1.Button, { onClick: () => { controller_js_1.ui.projectId = selected.id; controller_js_1.ui.go('tasks'); } }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0434\u043E\u0441\u043A\u0443"),
                react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => controller_js_1.ui.go('channels', selected.channelId) }, "\u041A\u0430\u043D\u0430\u043B \u043F\u0440\u043E\u0435\u043A\u0442\u0430"),
                react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => controller_js_1.ui.open('definition', { projectId: selected.id }) }, "\u0421\u043E\u0431\u0440\u0430\u0442\u044C \u043A\u043E\u043D\u0432\u0435\u0439\u0435\u0440")))) : controller_js_1.ui.scoped('projects').length ? react_js_1.default.createElement("div", { className: "cards-grid" }, controller_js_1.ui.scoped('projects').map(project => react_js_1.default.createElement("div", { className: "project-card", key: project.id },
        react_js_1.default.createElement("div", { className: "project-top" },
            react_js_1.default.createElement("span", { className: "space-symbol small" }, project.name[0]),
            react_js_1.default.createElement(index_js_1.Badge, { value: project.status })),
        react_js_1.default.createElement("button", { className: "link-title", onClick: () => controller_js_1.ui.go('projects', project.id) }, project.name),
        react_js_1.default.createElement("p", null, project.goal),
        react_js_1.default.createElement("div", { className: "project-summary" },
            react_js_1.default.createElement("span", null,
                react_js_1.default.createElement(index_js_1.Icon, { name: "tasks", size: 15 }),
                controller_js_1.ui.all('tasks').filter(t => t.projectId === project.id && !t.parentTaskId).length,
                " \u0437\u0430\u0434\u0430\u0447"),
            react_js_1.default.createElement("span", null,
                react_js_1.default.createElement(index_js_1.Icon, { name: "flow", size: 15 }),
                controller_js_1.ui.all('definitions').filter(d => d.projectId === project.id).length,
                " \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0439")),
        react_js_1.default.createElement("div", { className: "project-bottom" },
            react_js_1.default.createElement(index_js_1.Avatar, { id: project.ownerId }),
            react_js_1.default.createElement(index_js_1.Button, { variant: "ghost", small: true, onClick: () => { controller_js_1.ui.projectId = project.id; controller_js_1.ui.go('tasks'); } },
                "\u041A \u0440\u0430\u0431\u043E\u0442\u0435 ",
                react_js_1.default.createElement(index_js_1.Icon, { name: "arrow", size: 15 })))))) : react_js_1.default.createElement(index_js_1.Empty, { icon: "tasks", title: "\u0423 \u043A\u0430\u0436\u0434\u043E\u0439 \u0440\u0430\u0431\u043E\u0442\u044B \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u0446\u0435\u043B\u044C", description: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0435\u0440\u0432\u044B\u0439 \u043F\u0440\u043E\u0435\u043A\u0442, \u043D\u0430\u0437\u043D\u0430\u0447\u044C\u0442\u0435 \u0432\u043B\u0430\u0434\u0435\u043B\u044C\u0446\u0430 \u0438 \u0441\u0432\u044F\u0436\u0438\u0442\u0435 \u0441 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u043E\u0439 \u043E\u0441\u043D\u043E\u0432\u043E\u0439.", action: react_js_1.default.createElement(index_js_1.Button, { onClick: () => controller_js_1.ui.open('project') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442") })); }
function TasksPage() {
    const task = controller_js_1.ui.entity('tasks', controller_js_1.ui.objectId);
    if (task) {
        const runs = controller_js_1.ui.all('runs').filter(r => r.taskId === task.id);
        return react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u041F\u0420\u041E\u0415\u041A\u0422 / \u0417\u0410\u0414\u0410\u0427\u0410", title: task.title, description: task.description, actions: react_js_1.default.createElement(index_js_1.Button, { onClick: () => controller_js_1.ui.open('trial', { taskId: task.id }), icon: "play" }, "\u041F\u0440\u043E\u0431\u043D\u044B\u0439 \u0437\u0430\u043F\u0443\u0441\u043A") }),
            react_js_1.default.createElement(index_js_1.Panel, { title: "\u041A\u0440\u0438\u0442\u0435\u0440\u0438\u0438 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430" },
                react_js_1.default.createElement("p", null, task.acceptance),
                react_js_1.default.createElement(index_js_1.Badge, { value: task.status }),
                react_js_1.default.createElement("div", { className: "chip-row" },
                    react_js_1.default.createElement("span", { className: "chip" },
                        "\u041A\u043B\u0430\u0441\u0441: ",
                        task.taskClass),
                    task.originMessageId && react_js_1.default.createElement("span", { className: "chip" }, "\u0421\u043E\u0437\u0434\u0430\u043D\u0430 \u0438\u0437 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F"),
                    task.originOutcomeId && react_js_1.default.createElement("span", { className: "chip" }, "\u0421\u043E\u0437\u0434\u0430\u043D\u0430 \u0438\u0437 outcome"))),
            react_js_1.default.createElement(index_js_1.Panel, { title: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0437\u0430\u043F\u0443\u0441\u043A\u043E\u0432" }, runs.map(r => react_js_1.default.createElement("button", { className: "list-row clickable", key: r.id, onClick: () => controller_js_1.ui.go('runs', r.id) },
                react_js_1.default.createElement("span", null,
                    r.mode,
                    " \u00B7 \u041F\u043E\u043F\u044B\u0442\u043A\u0430 ",
                    r.attempt),
                react_js_1.default.createElement(index_js_1.Badge, { value: r.status })))));
    }
    const columns = [['Backlog', 'Бэклог'], ['Ready', 'Готовы к работе'], ['InProgress', 'Выполняются'], ['NeedsInput', 'Нужно участие'], ['Done', 'Завершены']];
    const tasks = controller_js_1.ui.scoped('tasks').filter(t => !t.parentTaskId);
    return react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u0420\u0410\u0411\u041E\u0422\u0410 / \u0414\u041E\u0421\u041A\u0410", title: "\u0417\u0430\u0434\u0430\u0447\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u044B", description: "\u0422\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0441\u0442\u0430\u0442\u0443\u0441 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0435\u0442\u0441\u044F \u0437\u0430\u043F\u0443\u0441\u043A\u043E\u043C. \u041F\u0435\u0440\u0435\u043D\u043E\u0441 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u043D\u0435 \u043E\u0431\u0445\u043E\u0434\u0438\u0442 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u0440\u0435\u0432\u044C\u044E.", actions: react_js_1.default.createElement(index_js_1.Button, { icon: "plus", disabled: !controller_js_1.ui.project, onClick: () => controller_js_1.ui.open('task') }, "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430") }),
        react_js_1.default.createElement("div", { className: "board" }, columns.map(([status, label]) => { const items = tasks.filter(t => status === 'NeedsInput' ? ['NeedsInput', 'InReview'].includes(t.status) : t.status === status); return react_js_1.default.createElement("section", { className: "board-column", key: status },
            react_js_1.default.createElement("h3", null,
                react_js_1.default.createElement("span", { className: 'column-dot ' + status }),
                label,
                react_js_1.default.createElement("small", null, items.length)),
            items.map(t => react_js_1.default.createElement("button", { className: "task-card", key: t.id, onClick: () => controller_js_1.ui.go('tasks', t.id) },
                react_js_1.default.createElement("small", null,
                    t.taskClass?.toUpperCase(),
                    " \u00B7 ",
                    t.id.slice(-5)),
                react_js_1.default.createElement("h4", null, t.title),
                react_js_1.default.createElement("p", null, t.description?.slice(0, 80)),
                react_js_1.default.createElement("div", null,
                    react_js_1.default.createElement(index_js_1.Avatar, { id: t.assigneeId }),
                    react_js_1.default.createElement(index_js_1.Badge, { value: t.status })))),
            !items.length && react_js_1.default.createElement("div", { className: "column-empty" }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0437\u0430\u0434\u0430\u0447")); })));
}

},
"features/releases/ReleasesPage.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleasesPage = ReleasesPage;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const index_js_1 = require("../../shared/ui/index.js");
function ReleasesPage() { const f = controller_js_1.ui.form('releases', { tab: 'capability' }); const candidates = controller_js_1.ui.scoped('candidates'), candidate = controller_js_1.ui.entity('candidates', controller_js_1.ui.objectId) || candidates.at(-1); const envs = controller_js_1.ui.scoped('environments'); const sandbox = envs.find(e => e.kind === 'Sandbox' && e.status === 'Ready'), uat = envs.find(e => e.kind === 'UAT' && e.status === 'Ready'); const uatRun = controller_js_1.ui.entity('runs', candidate?.uatRunId), release = controller_js_1.ui.entity('releases', candidate?.releaseId); return react_js_1.default.createElement(react_js_1.default.Fragment, null,
    react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u0412\u0415\u0420\u0421\u0418\u0418 / \u0414\u041E\u041F\u0423\u0421\u041A / \u0420\u0410\u0417\u041C\u0415\u0429\u0415\u041D\u0418\u0415", title: "\u0422\u0440\u0438 \u0440\u0430\u0437\u043D\u044B\u0445 \u0440\u0435\u043B\u0438\u0437\u0430", description: "\u0421\u043F\u043E\u0441\u043E\u0431 \u0440\u0430\u0431\u043E\u0442\u044B, \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u043E\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430 \u0438 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u2014 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u0430\u043A\u0435\u0442\u044B \u0438 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u043B\u043D\u043E\u043C\u043E\u0447\u0438\u044F." }),
    react_js_1.default.createElement(index_js_1.Tabs, { current: f.tab, items: [{ id: 'capability', label: 'Capability Release', count: controller_js_1.ui.scoped('releases').length }, { id: 'product', label: 'Product Release', count: controller_js_1.ui.scoped('productReleases').length }, { id: 'platform', label: 'Platform Release', count: controller_js_1.ui.scoped('platformReleases').length }], onChange: (v) => controller_js_1.ui.set('releases', 'tab', v) }),
    f.tab === 'capability' ? react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement("div", { className: "section-title" },
            react_js_1.default.createElement("h2", null, "\u0420\u0435\u043B\u0438\u0437 \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u043E\u0439 \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u043E\u0441\u0442\u0438"),
            react_js_1.default.createElement(index_js_1.Button, { icon: "plus", disabled: controller_js_1.ui.user?.role !== 'engineer' || !controller_js_1.ui.scoped('evaluations').some(e => e.passed), onClick: () => controller_js_1.ui.open('candidate') }, "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442")),
        candidate ? react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement("div", { className: "studio-select" },
                react_js_1.default.createElement("select", { "aria-label": "\u041A\u0430\u043D\u0434\u0438\u0434\u0430\u0442", value: candidate.id, onChange: (e) => controller_js_1.ui.go('releases', e.target.value) }, candidates.map(c => react_js_1.default.createElement("option", { key: c.id, value: c.id },
                    c.name,
                    " \u00B7 ",
                    c.status))),
                react_js_1.default.createElement(index_js_1.Badge, { value: candidate.status }),
                react_js_1.default.createElement(index_js_1.Digest, { value: candidate.manifestDigest, label: "MANIFEST" })),
            react_js_1.default.createElement("div", { className: "release-pipeline" }, [['TechnicalReview', 'Technical review', 'engineer'], ['ScopeReview', 'Область и риск', 'po'], ['AwaitingUAT', 'UAT', 'engineer'], ['UATAccepted', 'Допуск', 'po'], ['Admitted', 'Размещение', 'platform']].map(([state, label, who], i) => react_js_1.default.createElement("div", { key: state, className: candidate.status === state ? 'current' : (['TechnicalReview', 'ScopeReview', 'AwaitingUAT', 'UATAccepted', 'Admitted'].indexOf(candidate.status) > i ? 'done' : '') },
                react_js_1.default.createElement("span", null, i + 1),
                react_js_1.default.createElement("h3", null, label),
                react_js_1.default.createElement("p", null, who === 'engineer' ? 'Продукт-инженер' : who === 'po' ? 'Владелец продукта' : 'Платформенный инженер')))),
            react_js_1.default.createElement("div", { className: "split-grid" },
                react_js_1.default.createElement(index_js_1.Panel, { title: candidate.name, meta: candidate.manifest.kind },
                    react_js_1.default.createElement("div", { className: "key-values" },
                        react_js_1.default.createElement("span", null, "\u041A\u043B\u0430\u0441\u0441"),
                        react_js_1.default.createElement("b", null, candidate.manifest.taskClass),
                        react_js_1.default.createElement("span", null, "\u0410\u0432\u0442\u043E\u0440"),
                        react_js_1.default.createElement("b", null, candidate.authorId),
                        react_js_1.default.createElement("span", null, "Track"),
                        react_js_1.default.createElement("b", null, candidate.manifest.track),
                        react_js_1.default.createElement("span", null, "\u0417\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0438"),
                        react_js_1.default.createElement("b", null,
                            candidate.manifest.resolvedLock.length,
                            " \u0442\u043E\u0447\u043D\u044B\u0445 \u0432\u0435\u0440\u0441\u0438\u0439"),
                        react_js_1.default.createElement("span", null, "UAT Run"),
                        react_js_1.default.createElement("b", null, uatRun?.status || 'Не начат')),
                    react_js_1.default.createElement(index_js_1.Digest, { value: candidate.configurationDigest }),
                    react_js_1.default.createElement("p", { className: "muted" }, "\u0410\u0432\u0442\u043E\u0440 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u043F\u0440\u0438\u043D\u044F\u0442\u044C \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 technical review. UAT \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442 \u0442\u043E\u0442 \u0436\u0435 snapshot \u0431\u0435\u0437 \u043F\u043E\u0434\u043C\u0435\u043D\u044B."),
                    candidate.status === 'TechnicalReview' && react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'engineer' || candidate.authorId === controller_js_1.ui.user?.id, onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('candidate.technical', { targetDigest: candidate.manifestDigest }, candidate), 'Техническое заключение сохранено') }, "\u041F\u0440\u0438\u043D\u044F\u0442\u044C technical review"),
                    candidate.status === 'TechnicalReview' && candidate.authorId === controller_js_1.ui.user?.id && react_js_1.default.createElement("div", { className: "info-banner compact" }, "\u0414\u043B\u044F \u043D\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0439 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u0441\u044C \u043D\u0430 \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u043F\u0440\u043E\u0434\u0443\u043A\u0442-\u0438\u043D\u0436\u0435\u043D\u0435\u0440\u0430."),
                    candidate.status === 'ScopeReview' && react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'po', onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('candidate.scope', { targetDigest: candidate.manifestDigest }, candidate), 'Область и остаточный demo-риск приняты') }, "\u041F\u0440\u0438\u043D\u044F\u0442\u044C \u043E\u0431\u043B\u0430\u0441\u0442\u044C \u0438 \u0440\u0438\u0441\u043A"),
                    candidate.status === 'AwaitingUAT' && react_js_1.default.createElement("div", { className: "inline-actions" },
                        !uat && react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", disabled: controller_js_1.ui.user?.role !== 'platform' || !sandbox, onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('environment.create', { sourceId: sandbox?.id, kind: 'UAT' })) }, "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C UAT-\u0441\u0440\u0435\u0434\u0443"),
                        uat && !uatRun && react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'engineer', onClick: () => void controller_js_1.ui.act(async () => { const r = await controller_js_1.ui.cmd('uat.start', { environmentId: uat.id }, candidate); controller_js_1.ui.go('runs', r.id); }, 'UAT запущен на точном snapshot') }, "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C UAT"),
                        uatRun && react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => controller_js_1.ui.go('runs', uatRun.id) }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C UAT Run"),
                        uatRun?.status === 'Accepted' && react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'engineer', onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('uat.accept', { targetDigest: candidate.manifestDigest }, candidate), 'UAT-отчёт принят') }, "\u041F\u0440\u0438\u043D\u044F\u0442\u044C UAT-\u043E\u0442\u0447\u0451\u0442")),
                    candidate.status === 'UATAccepted' && react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'po', onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('release.admit', {}, candidate), 'CapabilityRelease допущен') }, "\u0414\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0440\u0435\u043B\u0438\u0437"),
                    release && react_js_1.default.createElement("div", { className: "inline-actions" },
                        react_js_1.default.createElement(index_js_1.Badge, { value: release.status }),
                        react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'platform', onClick: () => controller_js_1.ui.open('deployment', { releaseId: release.id }) }, "\u0420\u0430\u0437\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u0440\u0435\u043B\u0438\u0437"))),
                react_js_1.default.createElement(index_js_1.Panel, { title: "Manifest \u0438 \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u044F" },
                    react_js_1.default.createElement("details", { open: true },
                        react_js_1.default.createElement("summary", null, "\u0422\u043E\u0447\u043D\u044B\u0439 \u043F\u0430\u043A\u0435\u0442 \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u043E\u0441\u0442\u0438"),
                        react_js_1.default.createElement("pre", { className: "code-block" }, JSON.stringify(candidate.manifest, null, 2))),
                    controller_js_1.ui.all('attestations').filter(a => a.candidateId === candidate.id).map(a => react_js_1.default.createElement("div", { className: "attestation", key: a.id },
                        react_js_1.default.createElement(index_js_1.Icon, { name: "shield", size: 17 }),
                        react_js_1.default.createElement("div", null,
                            react_js_1.default.createElement("b", null, a.kind),
                            react_js_1.default.createElement("small", null,
                                a.reviewerId,
                                " \u00B7 ",
                                (0, index_js_1.date)(a.createdAt)),
                            react_js_1.default.createElement(index_js_1.Digest, { value: a.targetDigest, label: "TARGET" }))))))) : react_js_1.default.createElement(index_js_1.Empty, { icon: "shield", title: "\u0420\u0435\u043B\u0438\u0437 \u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442\u0441\u044F \u0441 evidence", description: "\u041F\u0440\u043E\u0439\u0434\u0438\u0442\u0435 Trial, \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u0435 evaluation \u0438 \u0437\u0430\u0444\u0438\u043A\u0441\u0438\u0440\u0443\u0439\u0442\u0435 \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442. \u0414\u043E\u043F\u0443\u0441\u043A \u043D\u0435 \u0432\u044B\u0434\u0430\u0451\u0442\u0441\u044F \u0437\u0430 \u043E\u0434\u0438\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u044B\u0439 Run." }),
        react_js_1.default.createElement(index_js_1.Panel, { title: "\u0420\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u044F" },
            controller_js_1.ui.scoped('deployments').map(d => react_js_1.default.createElement("div", { className: "list-row", key: d.id },
                react_js_1.default.createElement("span", null,
                    react_js_1.default.createElement("b", null, controller_js_1.ui.entity('releases', d.releaseId)?.name),
                    react_js_1.default.createElement("small", null,
                        controller_js_1.ui.entity('environments', d.environmentId)?.name,
                        " \u00B7 ",
                        d.id)),
                react_js_1.default.createElement(index_js_1.Badge, { value: d.status }),
                react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "secondary", onClick: () => controller_js_1.ui.open('released-run', d) }, "\u041F\u043E\u0440\u0443\u0447\u0438\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u0443"))),
            !controller_js_1.ui.scoped('deployments').length && react_js_1.default.createElement("p", { className: "muted" }, "\u041D\u0435\u0442 \u0440\u0430\u0437\u043C\u0435\u0449\u0451\u043D\u043D\u044B\u0445 \u0441\u043F\u043E\u0441\u043E\u0431\u043D\u043E\u0441\u0442\u0435\u0439."))) : f.tab === 'product' ? react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement("div", { className: "section-title" },
            react_js_1.default.createElement("h2", null, "\u041A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430"),
            react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'engineer' || !controller_js_1.ui.scoped('runs').some(r => r.status === 'Accepted'), onClick: () => controller_js_1.ui.open('product-release') }, "\u041D\u043E\u0432\u044B\u0439 ProductRelease")),
        controller_js_1.ui.scoped('productReleases').length ? controller_js_1.ui.scoped('productReleases').map(r => react_js_1.default.createElement(index_js_1.Panel, { key: r.id, title: r.name, meta: 'Artifact ' + r.artifactDigest?.slice(-12) },
            react_js_1.default.createElement("div", { className: "status-line" },
                react_js_1.default.createElement(index_js_1.Badge, { value: r.status }),
                react_js_1.default.createElement("small", null, r.id)),
            react_js_1.default.createElement("div", { className: "inline-actions" },
                react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "secondary", onClick: () => controller_js_1.ui.go('runs', r.runId) }, "\u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0439 Run"),
                r.status === 'AwaitingPO' && react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'po', onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('productRelease.approve', {}, r)) }, "\u0420\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u044C \u0432\u044B\u043F\u0443\u0441\u043A \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430"),
                r.status === 'Approved' && react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'platform', onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('productRelease.deploy', {}, r)) }, "\u0420\u0430\u0437\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435"),
                r.status === 'Active' && react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'po', onClick: () => controller_js_1.ui.open('outcome', { productReleaseId: r.id }) }, "\u041D\u0430\u0431\u043B\u044E\u0434\u0430\u0442\u044C \u043C\u0435\u0442\u0440\u0438\u043A\u0443")))) : react_js_1.default.createElement(index_js_1.Empty, { title: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442 \u0435\u0449\u0451 \u043D\u0435 \u0432\u044B\u043F\u0443\u0441\u043A\u0430\u043B\u0441\u044F", description: "\u041F\u0440\u0438\u043D\u044F\u0442\u044B\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 Run \u043C\u043E\u0436\u043D\u043E \u043E\u0444\u043E\u0440\u043C\u0438\u0442\u044C \u043A\u0430\u043A \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430." })) : react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement("div", { className: "section-title" },
            react_js_1.default.createElement("h2", null, "\u041F\u0430\u043A\u0435\u0442\u044B \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B"),
            react_js_1.default.createElement(index_js_1.Button, { disabled: controller_js_1.ui.user?.role !== 'platform' || !controller_js_1.ui.scoped('installations').length, onClick: () => controller_js_1.ui.open('platform-release') }, "\u041D\u043E\u0432\u044B\u0439 PlatformRelease")),
        react_js_1.default.createElement("div", { className: "info-banner" },
            react_js_1.default.createElement(index_js_1.Icon, { name: "shield" }),
            "\u0412 \u044D\u0442\u043E\u0439 \u0441\u0431\u043E\u0440\u043A\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0433\u043E platform-\u043F\u0430\u043A\u0435\u0442\u0430. \u041F\u043E\u043B\u043D\u044B\u0439 \u043D\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043C\u044B\u0439 platform approval / rollout \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u043D\u0435\u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043D\u044B\u043C."),
        controller_js_1.ui.scoped('platformReleases').map(r => react_js_1.default.createElement(index_js_1.Panel, { key: r.id, title: r.name },
            react_js_1.default.createElement(index_js_1.Badge, { value: r.status }),
            react_js_1.default.createElement(index_js_1.Digest, { value: r.contentDigest }),
            react_js_1.default.createElement("pre", { className: "code-block" }, JSON.stringify(r.compatibility, null, 2)))))); }

},
"features/review/HumanWorkbench.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HumanWorkbench = HumanWorkbench;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const index_js_1 = require("../../shared/ui/index.js");
function HumanWorkbench() {
    const gate = controller_js_1.ui.entity('gates', controller_js_1.ui.gateId);
    if (!gate)
        return null;
    const run = controller_js_1.ui.entity('runs', gate.runId), task = controller_js_1.ui.entity('tasks', gate.taskId);
    const key = 'gate:' + gate.id;
    const f = controller_js_1.ui.form(key, { tab: 'package', behavior: 'separate', minutes: 1, targetNodeId: 'implement', reviewed: false });
    const artifacts = gate.artifactIds.map((id) => controller_js_1.ui.entity('artifacts', id)).filter(Boolean), checks = gate.checkIds.map((id) => controller_js_1.ui.entity('checks', id)).filter(Boolean);
    const spent = controller_js_1.ui.all('costs').filter(c => c.rootRunId === run?.rootRunId).reduce((a, c) => a + c.amount, 0);
    const allowed = !!controller_js_1.ui.challenge && !controller_js_1.ui.offline && gate.status === 'Pending';
    const graph = controller_js_1.ui.entity('snapshots', run?.snapshotId)?.graph;
    const targets = graph?.edges.filter((e) => e.from === gate.nodeId && e.on === 'rework').map((e) => ({ value: e.to, label: graph.nodes.find((n) => n.id === e.to)?.label || e.to })) || [];
    return react_js_1.default.createElement("div", { className: "overlay", onMouseDown: (e) => {
            if (e.target === e.currentTarget)
                controller_js_1.ui.close();
        } },
        react_js_1.default.createElement("section", { className: "workbench", role: "dialog", "aria-modal": "true", "aria-labelledby": "workbench-title" },
            react_js_1.default.createElement("header", { className: "workbench-head" },
                react_js_1.default.createElement("span", { className: "workbench-icon" },
                    react_js_1.default.createElement(index_js_1.Icon, { name: gate.kind === 'input' ? 'chat' : 'shield', size: 23 })),
                react_js_1.default.createElement("div", null,
                    react_js_1.default.createElement("div", { className: "eyebrow" },
                        gate.kind === 'input' ? 'HUMAN INPUT' : 'HUMAN WORKBENCH',
                        " \u00B7 \u041F\u041E\u041F\u042B\u0422\u041A\u0410 ",
                        gate.attempt),
                    react_js_1.default.createElement("h2", { id: "workbench-title" }, gate.kind === 'input' ? 'Уточнить и продолжить' : 'Инженерное ревью')),
                react_js_1.default.createElement("button", { className: "icon-button", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C Workbench", onClick: () => controller_js_1.ui.close() },
                    react_js_1.default.createElement(index_js_1.Icon, { name: "close" }))),
            react_js_1.default.createElement("div", { className: "workbench-context" },
                react_js_1.default.createElement(index_js_1.Badge, { value: gate.status }),
                react_js_1.default.createElement(index_js_1.Digest, { value: gate.artifactBundleDigest, label: "REVIEW" }),
                react_js_1.default.createElement("span", null,
                    "revision ",
                    controller_js_1.ui.challenge?.expectedRevision ?? gate.revision)),
            react_js_1.default.createElement("div", { className: "workbench-scroll" },
                react_js_1.default.createElement(index_js_1.ErrorBox, null),
                controller_js_1.ui.offline && react_js_1.default.createElement("div", { className: "error-box", role: "alert" }, "\u041D\u0435\u0442 \u0441\u0432\u044F\u0437\u0438 \u0441 \u0441\u0435\u0440\u0432\u0435\u0440\u043E\u043C. Offline-\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F \u0438 \u043D\u0435 \u0441\u0442\u0430\u0432\u044F\u0442\u0441\u044F \u0432 \u043E\u0447\u0435\u0440\u0435\u0434\u044C."),
                react_js_1.default.createElement("div", { className: "review-task" },
                    react_js_1.default.createElement("small", null, controller_js_1.ui.entity('projects', gate.projectId)?.name),
                    react_js_1.default.createElement("h3", null, task?.title),
                    react_js_1.default.createElement("p", null, task?.acceptance || 'Проверить результат по контракту и обязательным checks.')),
                gate.kind === 'input' ? react_js_1.default.createElement("div", { className: "input-gate" },
                    react_js_1.default.createElement("h3", null, gate.title),
                    react_js_1.default.createElement("p", null, "\u041F\u0443\u0441\u0442\u0430\u044F \u0432\u044B\u0434\u0430\u0447\u0430 \u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0439 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u2014 \u0440\u0430\u0437\u043D\u044B\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F. \u041E\u0442\u0432\u0435\u0442 \u0441\u0442\u0430\u043D\u0435\u0442 \u044F\u0432\u043D\u044B\u043C input \u0442\u0435\u043A\u0443\u0449\u0435\u0433\u043E Run, \u0430 \u043D\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0435\u0439 \u043D\u043E\u0432\u043E\u0433\u043E \u0437\u043D\u0430\u043D\u0438\u044F."),
                    react_js_1.default.createElement(index_js_1.Field, { label: "\u041A\u0430\u043A \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0442\u044C \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F?", form: key, field: "behavior", options: [{ value: 'separate', label: 'Три состояния: данные / пусто / недоступно' }, { value: 'empty-on-error', label: 'Показывать пустой список при ошибке' }], "data-autofocus": true, required: true }),
                    react_js_1.default.createElement(index_js_1.Field, { label: "\u041F\u0440\u0430\u0432\u0438\u043B\u043E \u0438 \u043F\u043E\u044F\u0441\u043D\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u0430\u0433\u0435\u043D\u0442\u0430", form: key, field: "explanation", type: "textarea", rows: 6, placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u043F\u0440\u0438 HTTP 503 \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0430 \u0438 \u043A\u043D\u043E\u043F\u043A\u0443 \u043F\u043E\u0432\u0442\u043E\u0440\u0435\u043D\u0438\u044F. \u041F\u0443\u0441\u0442\u043E\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u0440\u0438 \u0443\u0441\u043F\u0435\u0448\u043D\u043E\u043C \u043F\u0443\u0441\u0442\u043E\u043C \u043E\u0442\u0432\u0435\u0442\u0435.", required: true, help: "\u041C\u0438\u043D\u0438\u043C\u0443\u043C 8 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432. \u041E\u0431\u044B\u0447\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u0432 \u0447\u0430\u0442\u0435 \u043D\u0435 \u0437\u0430\u043C\u0435\u043D\u044F\u0435\u0442 \u044D\u0442\u043E\u0442 \u043E\u0442\u0432\u0435\u0442." }),
                    react_js_1.default.createElement("div", { className: "info-banner" },
                        react_js_1.default.createElement(index_js_1.Icon, { name: "flow" }),
                        "\u041F\u043E\u0441\u043B\u0435 \u043E\u0442\u0432\u0435\u0442\u0430 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u0441\u044F \u0442\u043E\u0442 \u0436\u0435 Run \u0438 \u0442\u043E\u0442 \u0436\u0435 snapshot.")) : react_js_1.default.createElement(react_js_1.default.Fragment, null,
                    react_js_1.default.createElement(index_js_1.Tabs, { current: f.tab, items: [{ id: 'package', label: 'Изменения и checks' }, { id: 'history', label: 'История решений' }, { id: 'cost', label: 'Стоимость' }], onChange: (v) => controller_js_1.ui.set(key, 'tab', v) }),
                    f.tab === 'package' ? react_js_1.default.createElement(react_js_1.default.Fragment, null,
                        react_js_1.default.createElement("div", { className: "check-summary" },
                            checks.map((c) => react_js_1.default.createElement("div", { key: c.id, className: c.passed ? 'passed' : 'failed' },
                                react_js_1.default.createElement(index_js_1.Icon, { name: c.passed ? 'check' : 'shield', size: 17 }),
                                react_js_1.default.createElement("b", null, c.oracle),
                                react_js_1.default.createElement("span", null, c.passed ? 'Проверка пройдена' : 'Найдена ошибка'))),
                            !checks.length && react_js_1.default.createElement("div", { className: "error-box" }, "\u041D\u0435\u0442 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0445 checks.")),
                        checks.filter((c) => !c.passed).map((c) => react_js_1.default.createElement("div", { className: "finding", key: c.id },
                            react_js_1.default.createElement("b", null, "\u041A\u043E\u043D\u0442\u0440\u0430\u043A\u0442 \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D"),
                            react_js_1.default.createElement("p", null, c.findings.join('; ')),
                            react_js_1.default.createElement("pre", null, JSON.stringify({ expected: c.expected, observed: c.observed }, null, 2)))),
                        artifacts.map((a) => react_js_1.default.createElement("section", { className: "review-artifact", key: a.id },
                            react_js_1.default.createElement("div", null,
                                react_js_1.default.createElement("b", null, a.name),
                                react_js_1.default.createElement(index_js_1.Digest, { value: a.contentDigest, label: "" })),
                            a.name.endsWith('.diff') ? react_js_1.default.createElement(index_js_1.Diff, { content: a.content }) : react_js_1.default.createElement("details", null,
                                react_js_1.default.createElement("summary", null, "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435"),
                                react_js_1.default.createElement("pre", { className: "code-block" }, a.content)))),
                        react_js_1.default.createElement("label", { className: "checkbox-row" },
                            react_js_1.default.createElement("input", { type: "checkbox", checked: f.reviewed, onChange: (e) => controller_js_1.ui.set(key, 'reviewed', e.target.checked), "data-autofocus": true }),
                            react_js_1.default.createElement("span", null, "\u042F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u043B \u044D\u0442\u0443 \u0432\u0435\u0440\u0441\u0438\u044E \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439 \u0438 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B \u043F\u0440\u043E\u0432\u0435\u0440\u043E\u043A."))) : f.tab === 'history' ? react_js_1.default.createElement("div", null,
                        controller_js_1.ui.all('decisions').filter(d => d.runId === run?.id).map(d => react_js_1.default.createElement("div", { className: "decision-card", key: d.id },
                            react_js_1.default.createElement("b", null,
                                d.decision,
                                " \u00B7 \u043F\u043E\u043F\u044B\u0442\u043A\u0430 ",
                                d.attempt),
                            react_js_1.default.createElement("p", null, d.reason || 'Просмотренная версия принята'),
                            react_js_1.default.createElement("small", null,
                                (0, index_js_1.date)(d.createdAt),
                                " \u00B7 ",
                                d.reviewerId),
                            react_js_1.default.createElement(index_js_1.Digest, { value: d.targetDigest }))),
                        !controller_js_1.ui.all('decisions').some(d => d.runId === run?.id) && react_js_1.default.createElement("p", { className: "muted" }, "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0445 \u0440\u0435\u0448\u0435\u043D\u0438\u0439 \u043D\u0435\u0442.")) : react_js_1.default.createElement("div", { className: "review-cost" },
                        react_js_1.default.createElement("h3", null, "\u041F\u043E\u043B\u043D\u0430\u044F \u0446\u0435\u043D\u0430 \u0434\u043E\u0440\u0430\u0431\u043E\u0442\u043A\u0438"),
                        react_js_1.default.createElement("div", { className: "key-values" },
                            react_js_1.default.createElement("span", null, "\u0423\u0436\u0435 \u043F\u043E\u0442\u0440\u0430\u0447\u0435\u043D\u043E"),
                            react_js_1.default.createElement("b", null, (0, index_js_1.money)(spent)),
                            react_js_1.default.createElement("span", null, "\u041E\u0441\u0442\u0430\u0442\u043E\u043A \u043E\u0431\u0449\u0435\u0433\u043E \u043B\u0438\u043C\u0438\u0442\u0430"),
                            react_js_1.default.createElement("b", null, (0, index_js_1.money)((run?.budget || 0) - spent)),
                            react_js_1.default.createElement("span", null, "AI + check \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0439 \u043F\u043E\u043F\u044B\u0442\u043A\u0438"),
                            react_js_1.default.createElement("b", null, (0, index_js_1.money)(300)),
                            react_js_1.default.createElement("span", null, "\u041F\u043B\u0430\u043D \u0447\u0435\u043B\u043E\u0432\u0435\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438"),
                            react_js_1.default.createElement("b", null,
                                f.minutes,
                                " \u043C\u0438\u043D \u00B7 ",
                                (0, index_js_1.money)(Number(f.minutes) * 120))),
                        react_js_1.default.createElement("p", { className: "muted" }, "\u0420\u0435\u0437\u0435\u0440\u0432\u0430\u0446\u0438\u0438 \u0438 usage \u0443\u0447\u0438\u0442\u044B\u0432\u0430\u044E\u0442\u0441\u044F \u0441\u0435\u0440\u0432\u0435\u0440\u043E\u043C. \u0420\u0435\u0430\u043B\u044C\u043D\u044B\u0435 \u0434\u0435\u043D\u0435\u0436\u043D\u044B\u0435 \u0441\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u043D\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u0443\u044E\u0442\u0441\u044F.")),
                    react_js_1.default.createElement("div", { className: "rework-form" },
                        react_js_1.default.createElement("div", { className: "section-title" },
                            react_js_1.default.createElement("h3", null, "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0441 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u043C \u0437\u0430\u043C\u0435\u0447\u0430\u043D\u0438\u0435\u043C"),
                            react_js_1.default.createElement("small", null, "\u041D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u043F\u0440\u0438 \u043F\u0440\u0438\u043D\u044F\u0442\u0438\u0438")),
                        react_js_1.default.createElement(index_js_1.Field, { form: key, field: "reason", label: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430 Rework", type: "textarea", rows: 3, placeholder: "503 \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043A\u0430\u043A \u043F\u0443\u0441\u0442\u043E\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u0437\u0430\u044F\u0432\u043E\u043A." }),
                        react_js_1.default.createElement(index_js_1.Field, { form: key, field: "expectedFix", label: "\u041E\u0436\u0438\u0434\u0430\u0435\u043C\u043E\u0435 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435", type: "textarea", rows: 3, placeholder: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 unavailable \u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0435\u0433\u043E \u0442\u0435\u0441\u0442\u043E\u043C." }),
                        react_js_1.default.createElement("div", { className: "form-grid" },
                            react_js_1.default.createElement(index_js_1.Field, { form: key, field: "targetNodeId", label: "\u0426\u0435\u043B\u0435\u0432\u043E\u0439 \u044D\u0442\u0430\u043F", options: targets.length ? targets : [{ value: 'implement', label: 'Подготовить изменение' }] }),
                            react_js_1.default.createElement(index_js_1.Field, { form: key, field: "minutes", label: "\u0412\u0440\u0435\u043C\u044F \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430, \u043C\u0438\u043D", type: "number", min: "0", max: "480" })),
                        react_js_1.default.createElement("div", { className: "rework-estimate" },
                            react_js_1.default.createElement(index_js_1.Icon, { name: "chart", size: 17 }),
                            react_js_1.default.createElement("span", null,
                                "\u0424\u0430\u043A\u0442 ",
                                (0, index_js_1.money)(spent),
                                " \u00B7 \u041E\u0441\u0442\u0430\u0442\u043E\u043A ",
                                (0, index_js_1.money)((run?.budget || 0) - spent),
                                " \u00B7 \u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0448\u0430\u0433 \u2248 ",
                                (0, index_js_1.money)(300 + Number(f.minutes) * 120)))))),
            react_js_1.default.createElement("footer", { className: "workbench-footer" },
                gate.kind === 'input' ? react_js_1.default.createElement(react_js_1.default.Fragment, null,
                    react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => controller_js_1.ui.close() }, "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u0432 \u0442\u0440\u0435\u0434"),
                    react_js_1.default.createElement(index_js_1.Button, { disabled: !allowed, icon: "arrow", onClick: () => void controller_js_1.ui.submitGate('answer') }, "\u041E\u0442\u0432\u0435\u0442\u0438\u0442\u044C \u0438 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C")) : react_js_1.default.createElement(react_js_1.default.Fragment, null,
                    react_js_1.default.createElement("div", { className: "inline-actions" },
                        react_js_1.default.createElement(index_js_1.Button, { variant: "ghost", disabled: !allowed, onClick: () => void controller_js_1.ui.submitGate('reject') }, "\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C"),
                        react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", disabled: !allowed, onClick: () => void controller_js_1.ui.submitGate('rework') }, "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u043D\u0430 \u0434\u043E\u0440\u0430\u0431\u043E\u0442\u043A\u0443")),
                    react_js_1.default.createElement(index_js_1.Button, { icon: "check", disabled: !allowed || !f.reviewed || !checks.length || checks.some((c) => !c.passed), onClick: () => void controller_js_1.ui.submitGate('approve') }, "\u041F\u0440\u0438\u043D\u044F\u0442\u044C \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u043D\u0443\u044E \u0432\u0435\u0440\u0441\u0438\u044E")),
                controller_js_1.ui.error?.code === 'StaleReview' && react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => void controller_js_1.ui.openGate(gate.id) }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0430\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0430\u043A\u0435\u0442")),
            gate.assigneeId !== controller_js_1.ui.user?.id && controller_js_1.ui.user?.role === 'engineer' && gate.status === 'Pending' && react_js_1.default.createElement("div", { className: "reassign-bar" },
                react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", onClick: () => void controller_js_1.ui.act(async () => { await controller_js_1.ui.cmd('gate.reassign', { userId: controller_js_1.ui.user.id }, gate); await controller_js_1.ui.openGate(gate.id); }) }, "\u041F\u0435\u0440\u0435\u043D\u0430\u0437\u043D\u0430\u0447\u0438\u0442\u044C \u0433\u0435\u0439\u0442 \u043D\u0430 \u0441\u0435\u0431\u044F"))));
}

},
"features/runs/RunsPage.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunsPage = RunsPage;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const index_js_1 = require("../../shared/ui/index.js");
function RunsPage() {
    const run = controller_js_1.ui.entity('runs', controller_js_1.ui.objectId);
    const runs = controller_js_1.ui.scoped('runs').filter(r => !r.parentRunId);
    if (!run)
        return react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u0418\u0421\u041F\u041E\u041B\u041D\u0415\u041D\u0418\u0415", title: "\u0417\u0430\u043F\u0443\u0441\u043A\u0438 \u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u044F", description: "Trial, UAT \u0438 Released \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u044B. \u041D\u0435\u0443\u0434\u0430\u0447\u043D\u044B\u0435 \u0438 \u043E\u0442\u043C\u0435\u043D\u0451\u043D\u043D\u044B\u0435 Runs \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F \u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438.", actions: react_js_1.default.createElement(index_js_1.Button, { icon: "play", disabled: !controller_js_1.ui.scoped('definitions').length, onClick: () => controller_js_1.ui.open('trial') }, "\u041F\u0440\u043E\u0431\u043D\u044B\u0439 \u0437\u0430\u043F\u0443\u0441\u043A") }),
            runs.length ? react_js_1.default.createElement("div", { className: "run-grid three" }, runs.slice().reverse().map(r => react_js_1.default.createElement(index_js_1.RunCard, { key: r.id, run: r }))) : react_js_1.default.createElement(index_js_1.Empty, { icon: "play", title: "\u041F\u043E\u043A\u0430 \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0443\u0441\u043A\u0430", description: "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0439 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0432 \u0433\u043E\u0442\u043E\u0432\u043E\u0439 Sandbox. \u0420\u0435\u043B\u0438\u0437 \u043D\u0435 \u043D\u0443\u0436\u0435\u043D.", action: react_js_1.default.createElement(index_js_1.Button, { disabled: !controller_js_1.ui.scoped('definitions').length, onClick: () => controller_js_1.ui.open('trial') }, "\u041F\u0440\u043E\u0431\u043D\u044B\u0439 \u0437\u0430\u043F\u0443\u0441\u043A") }));
    const task = controller_js_1.ui.entity('tasks', run.taskId), snapshot = controller_js_1.ui.entity('snapshots', run.snapshotId), gate = controller_js_1.ui.all('gates').find(g => g.runId === run.id && g.status === 'Pending'), costs = controller_js_1.ui.all('costs').filter(c => c.rootRunId === run.rootRunId), spent = costs.reduce((x, c) => x + c.amount, 0), executions = controller_js_1.ui.all('executions').filter(e => e.runId === run.id), artifacts = controller_js_1.ui.all('artifacts').filter(a => a.runId === run.id), f = controller_js_1.ui.form('run:' + run.id, { tab: 'trace', attempt: run.attempt });
    const controlled = (control) => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('run.control', { control }, run));
    return react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement(index_js_1.Heading, { eyebrow: `${run.mode?.toUpperCase()} / ${controller_js_1.ui.entity('environments', run.environmentId)?.name}`, title: task?.title || 'Запуск', description: `Run ${run.id} · попытка ${run.attempt} · ${(0, index_js_1.date)(run.startedAt)}`, actions: react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", icon: "chat", onClick: () => controller_js_1.ui.go('channels', run.channelId, run.threadId) }, "\u0420\u0430\u0431\u043E\u0447\u0438\u0439 \u0442\u0440\u0435\u0434") }),
        react_js_1.default.createElement("div", { className: "run-toolbar" },
            react_js_1.default.createElement(index_js_1.Badge, { value: run.status }),
            react_js_1.default.createElement(index_js_1.Digest, { value: run.configurationDigest }),
            react_js_1.default.createElement("span", { className: "muted small-text" },
                "Epoch ",
                run.controlEpoch),
            react_js_1.default.createElement("div", { className: "toolbar-spacer" }),
            !['Accepted', 'Failed', 'Cancelled'].includes(run.status) && react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "secondary", disabled: controller_js_1.ui.user?.role === 'po', onClick: () => controlled('STEP') }, "\u041E\u0434\u0438\u043D \u0448\u0430\u0433"),
                react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "secondary", onClick: () => controlled(run.status === 'Paused' ? 'RESUME' : 'PAUSE') }, run.status === 'Paused' ? 'Продолжить' : 'Пауза'),
                react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "danger", onClick: () => controller_js_1.ui.open('cancel-run', run) }, "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C"))),
        run.reason && react_js_1.default.createElement("div", { className: run.status === 'Blocked' || run.status === 'InDoubt' ? 'error-box' : 'info-banner' }, run.reason),
        gate && react_js_1.default.createElement("div", { className: "gate-banner" },
            react_js_1.default.createElement("span", { className: "attention-icon" },
                react_js_1.default.createElement(index_js_1.Icon, { name: gate.kind === 'input' ? 'chat' : 'shield' })),
            react_js_1.default.createElement("div", null,
                react_js_1.default.createElement("h3", null, gate.title),
                react_js_1.default.createElement("p", null,
                    "\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u043E: ",
                    controller_js_1.ui.data.catalog.users.find((u) => u.id === gate.assigneeId)?.name || 'не назначено',
                    " \u00B7 ",
                    gate.kind === 'input' ? 'Типизированный ответ' : 'Просмотренный artifact bundle')),
            react_js_1.default.createElement(index_js_1.Button, { onClick: () => void controller_js_1.ui.openGate(gate.id) }, gate.kind === 'input' ? 'Ответить и продолжить' : 'Открыть Workbench')),
        run.status === 'InDoubt' && react_js_1.default.createElement(index_js_1.Button, { onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('run.reconcile', {}, run), 'Read-back выполнен. Второй эффект не создавался.') }, "\u0421\u0432\u0435\u0440\u0438\u0442\u044C \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u044D\u0444\u0444\u0435\u043A\u0442"),
        run.status === 'HumanOwned' && react_js_1.default.createElement(index_js_1.Button, { onClick: () => controller_js_1.ui.open('return-control', run) }, "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0430\u0433\u0435\u043D\u0442\u0443"),
        react_js_1.default.createElement("div", { className: "run-detail-grid" },
            react_js_1.default.createElement(index_js_1.Panel, { title: "\u0418\u0441\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435", className: "trace-panel" },
                react_js_1.default.createElement(index_js_1.Tabs, { items: [{ id: 'trace', label: 'Трасса' }, { id: 'artifacts', label: 'Артефакты', count: artifacts.length }, { id: 'attempts', label: 'Попытки', count: run.attempt }, { id: 'context', label: 'Контекст' }, ...(run.workPlan ? [{ id: 'team', label: 'План команды' }] : [])], current: f.tab, onChange: (v) => controller_js_1.ui.set('run:' + run.id, 'tab', v) }),
                f.tab === 'trace' ? react_js_1.default.createElement("div", { className: "trace-list" }, snapshot?.graph.nodes.map((n) => { const ex = executions.filter(e => e.nodeId === n.id && e.attempt === run.attempt).at(-1); return react_js_1.default.createElement("div", { className: 'trace-node ' + (ex?.status === 'Completed' ? 'done' : ''), key: n.id },
                    react_js_1.default.createElement("span", { className: "trace-dot" }, ex?.status === 'Completed' ? react_js_1.default.createElement(index_js_1.Icon, { name: "check", size: 17 }) : react_js_1.default.createElement(index_js_1.Icon, { name: n.type === 'AI' ? 'spark' : n.type === 'Approval' ? 'shield' : 'box', size: 17 })),
                    react_js_1.default.createElement("div", null,
                        react_js_1.default.createElement("h3", null, n.label),
                        react_js_1.default.createElement("p", null,
                            n.type,
                            " \u00B7 ",
                            n.id),
                        ex && react_js_1.default.createElement("small", null,
                            (0, index_js_1.date)(ex.startedAt),
                            " \u00B7 epoch ",
                            ex.epoch)),
                    ex && react_js_1.default.createElement(index_js_1.Badge, { value: ex.status })); })) : f.tab === 'artifacts' ? react_js_1.default.createElement("div", { className: "artifacts-list" }, artifacts.map(a => react_js_1.default.createElement("details", { key: a.id, open: a.name === 'implementation.diff' && a.attempt === run.attempt },
                    react_js_1.default.createElement("summary", null,
                        react_js_1.default.createElement(index_js_1.Icon, { name: "box", size: 15 }),
                        a.name,
                        " ",
                        react_js_1.default.createElement("span", null,
                            "\u041F\u043E\u043F\u044B\u0442\u043A\u0430 ",
                            a.attempt),
                        react_js_1.default.createElement(index_js_1.Digest, { value: a.contentDigest, label: "" })),
                    a.name.endsWith('.diff') ? react_js_1.default.createElement(index_js_1.Diff, { content: a.content }) : react_js_1.default.createElement("pre", { className: "code-block" }, a.content)))) : f.tab === 'attempts' ? react_js_1.default.createElement("div", null,
                    controller_js_1.ui.all('attempts').filter(a => a.runId === run.id).map(a => react_js_1.default.createElement("div", { className: "attempt-card", key: a.id },
                        react_js_1.default.createElement("h3", null,
                            "\u041F\u043E\u043F\u044B\u0442\u043A\u0430 ",
                            a.number),
                        react_js_1.default.createElement(index_js_1.Badge, { value: a.status }),
                        react_js_1.default.createElement("p", null, a.input || 'Исходное поручение'),
                        react_js_1.default.createElement("small", null, a.sourceDecisionId || a.inputRef))),
                    controller_js_1.ui.all('decisions').filter(d => d.runId === run.id).map(d => react_js_1.default.createElement("div", { className: "decision-card", key: d.id },
                        react_js_1.default.createElement("b", null,
                            d.decision,
                            " \u00B7 ",
                            controller_js_1.ui.data.catalog.users.find((u) => u.id === d.reviewerId)?.name),
                        react_js_1.default.createElement("p", null, d.reason || 'Просмотренный пакет принят'),
                        react_js_1.default.createElement(index_js_1.Digest, { value: d.targetDigest, label: "REVIEW" }),
                        d.decision === 'rework' && react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "secondary", onClick: () => controller_js_1.ui.open('save-knowledge', d) }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0437\u043D\u0430\u043D\u0438\u0435")))) : f.tab === 'team' ? react_js_1.default.createElement(react_js_1.default.Fragment, null,
                    react_js_1.default.createElement("div", { className: "team-plan" },
                        react_js_1.default.createElement("b", null, run.workPlan.taskClass.toUpperCase()),
                        run.workPlan.roles.map((r) => react_js_1.default.createElement("div", { key: r },
                            react_js_1.default.createElement(index_js_1.Icon, { name: "spark" }),
                            react_js_1.default.createElement("b", null, r)))),
                    react_js_1.default.createElement("p", { className: "muted" },
                        "Concurrency ",
                        run.workPlan.concurrency,
                        " \u00B7 \u043E\u0431\u0449\u0438\u0439 root envelope ",
                        (0, index_js_1.money)(run.budget)),
                    controller_js_1.ui.all('runs').filter(r => r.parentRunId === run.id).map(r => react_js_1.default.createElement("div", { className: "list-row", key: r.id },
                        react_js_1.default.createElement("span", null,
                            react_js_1.default.createElement("b", null, r.assignedRole),
                            react_js_1.default.createElement("small", null,
                                r.id,
                                " \u2192 ",
                                r.taskId)),
                        react_js_1.default.createElement(index_js_1.Badge, { value: r.status })))) : controller_js_1.ui.all('contexts').filter(c => c.runId === run.id).map(c => react_js_1.default.createElement("details", { key: c.id },
                    react_js_1.default.createElement("summary", null,
                        c.nodeId,
                        " \u00B7 \u0437\u0430\u043A\u0440\u0435\u043F\u043B\u0451\u043D\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442"),
                    react_js_1.default.createElement("pre", { className: "code-block" }, JSON.stringify(c, null, 2))))),
            react_js_1.default.createElement("aside", null,
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u044B" },
                    react_js_1.default.createElement("div", { className: "cost-total" },
                        (0, index_js_1.money)(spent),
                        react_js_1.default.createElement("span", null, "\u0444\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0437\u0430\u0442\u0440\u0430\u0442\u044B")),
                    react_js_1.default.createElement("div", { className: "key-values" },
                        react_js_1.default.createElement("span", null, "\u041B\u0438\u043C\u0438\u0442"),
                        react_js_1.default.createElement("b", null, (0, index_js_1.money)(run.budget)),
                        react_js_1.default.createElement("span", null, "\u041E\u0441\u0442\u0430\u0442\u043E\u043A"),
                        react_js_1.default.createElement("b", null, (0, index_js_1.money)(run.budget - spent)),
                        react_js_1.default.createElement("span", null, "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 AI + check"),
                        react_js_1.default.createElement("b", null, (0, index_js_1.money)(300)),
                        react_js_1.default.createElement("span", null, "\u0412\u0440\u0435\u043C\u044F \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430"),
                        react_js_1.default.createElement("b", null,
                            Math.round((run.humanTimeMs || 0) / 60000),
                            " \u043C\u0438\u043D")),
                    react_js_1.default.createElement("div", { className: "budget-bar" },
                        react_js_1.default.createElement("span", { style: { width: Math.min(100, spent / run.budget * 100) + '%' } })),
                    react_js_1.default.createElement("small", null, "\u0421\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 rate card demo-1. \u0414\u043E\u0447\u0435\u0440\u043D\u0438\u0435 \u043F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u044F \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442 \u0442\u043E\u0442 \u0436\u0435 \u043B\u0438\u043C\u0438\u0442."),
                    controller_js_1.ui.user?.role === 'po' && react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", small: true, onClick: () => controller_js_1.ui.open('budget', run) }, "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0431\u044E\u0434\u0436\u0435\u0442")),
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0438 \u0433\u0440\u0430\u043D\u0438\u0446\u044B" },
                    react_js_1.default.createElement("div", { className: "key-values" },
                        react_js_1.default.createElement("span", null, "\u041A\u043B\u0430\u0441\u0441"),
                        react_js_1.default.createElement("b", null, run.taskClass),
                        react_js_1.default.createElement("span", null, "Runtime revision"),
                        react_js_1.default.createElement("code", null, run.installationRevisionId?.slice(-12)),
                        react_js_1.default.createElement("span", null, "Workspace"),
                        react_js_1.default.createElement("b", null, controller_js_1.ui.entity('workspaces', run.workspaceId)?.owner || 'Освобождён')),
                    react_js_1.default.createElement("p", { className: "muted small-text" }, "Takeover \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0435\u0442 agent lease, \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442 drain \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 checkpoint \u043F\u0435\u0440\u0435\u0434 \u0432\u044B\u0434\u0430\u0447\u0435\u0439 human lease."),
                    !['Accepted', 'Failed', 'Cancelled', 'HumanOwned', 'TakeoverRequested'].includes(run.status) && react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", disabled: controller_js_1.ui.user?.role !== 'engineer' || run.status === 'InDoubt', onClick: () => controlled('TAKEOVER') }, "\u0417\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u044C Takeover"),
                    run.status === 'Accepted' && react_js_1.default.createElement(react_js_1.default.Fragment, null,
                        react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => controller_js_1.ui.open('evaluation', { snapshotId: run.snapshotId }) }, "\u0418\u0441\u043F\u044B\u0442\u0430\u0442\u044C \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044E"),
                        react_js_1.default.createElement(index_js_1.Button, { variant: "ghost", onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('productRelease.create', { runId: run.id })) }, "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C ProductRelease"))))));
}

},
"features/setup/SetupPage.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpacesPage = SpacesPage;
exports.SetupPage = SetupPage;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const index_js_1 = require("../../shared/ui/index.js");
function SpacesPage() { return react_js_1.default.createElement("div", { className: "spaces-page" },
    react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u041A\u041E\u041C\u0410\u041D\u0414\u041D\u0410\u042F \u0421\u0420\u0415\u0414\u0410", title: "\u041F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430 \u0432\u0430\u0448\u0435\u0439 \u043A\u043E\u043C\u0430\u043D\u0434\u044B", description: "\u041B\u044E\u0434\u0438, AI-\u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0438 \u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C\u044B\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u2014 \u0432 \u043E\u0434\u043D\u043E\u043C \u0440\u0430\u0431\u043E\u0447\u0435\u043C \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0435.", actions: react_js_1.default.createElement(index_js_1.Button, { icon: "plus", disabled: controller_js_1.ui.user?.role !== 'platform', onClick: () => controller_js_1.ui.open('space') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E") }),
    !controller_js_1.ui.all('spaces').length ? react_js_1.default.createElement("div", { className: "welcome-panel" },
        react_js_1.default.createElement("div", { className: "welcome-copy" },
            react_js_1.default.createElement("span", { className: "eyebrow" }, "\u041D\u0410\u0427\u041D\u0418\u0422\u0415 \u0421 \u0427\u0418\u0421\u0422\u041E\u0413\u041E \u041B\u0418\u0421\u0422\u0410"),
            react_js_1.default.createElement("h2", null,
                "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u0430.",
                react_js_1.default.createElement("br", null),
                "\u0417\u0430\u0442\u0435\u043C \u2014 \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u0430\u044F \u0440\u0430\u0431\u043E\u0442\u0430."),
            react_js_1.default.createElement("p", null, "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C\u0442\u0435 \u0440\u0435\u0441\u0443\u0440\u0441\u044B, \u0441\u043E\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043E\u043D\u0432\u0435\u0439\u0435\u0440 \u0438 \u043F\u043E\u0440\u0443\u0447\u0438\u0442\u0435 \u043F\u0435\u0440\u0432\u0443\u044E \u0437\u0430\u0434\u0430\u0447\u0443. \u0410\u0433\u0435\u043D\u0442\u044B \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0442 \u0440\u0430\u0431\u043E\u0442\u0443, \u0430 \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043E\u0441\u0442\u0430\u043D\u0443\u0442\u0441\u044F \u0437\u0430 \u0432\u0430\u043C\u0438."),
            react_js_1.default.createElement("div", { className: "inline-actions" },
                react_js_1.default.createElement(index_js_1.Button, { icon: "plus", disabled: controller_js_1.ui.user?.role !== 'platform', onClick: () => controller_js_1.ui.open('space') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441 \u043D\u0443\u043B\u044F"),
                react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => void controller_js_1.ui.createPrepared() }, "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0439 \u043F\u0440\u0438\u043C\u0435\u0440")),
            react_js_1.default.createElement("small", null, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0441\u043E\u0437\u0434\u0430\u043D\u043D\u044B\u0445 \u043A\u043E\u043C\u0430\u043D\u0434, \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432 \u0438\u043B\u0438 \u0440\u0435\u043B\u0438\u0437\u043E\u0432.")),
        react_js_1.default.createElement("div", { className: "welcome-steps" }, [['01', 'Команда и ресурсы', 'cloud'], ['02', 'Проект и конвейер', 'flow'], ['03', 'Пробный запуск', 'play'], ['04', 'Человек решает', 'shield']].map(([n, t, i]) => react_js_1.default.createElement("div", { className: "welcome-step", key: n },
            react_js_1.default.createElement("span", null, n),
            react_js_1.default.createElement(index_js_1.Icon, { name: i }),
            react_js_1.default.createElement("b", null, t))))) : react_js_1.default.createElement("div", { className: "cards-grid" },
        controller_js_1.ui.all('spaces').map(space => react_js_1.default.createElement("button", { className: "space-card", key: space.id, onClick: () => void controller_js_1.ui.selectSpace(space.id) },
            react_js_1.default.createElement("div", { className: "space-symbol" }, space.name.slice(0, 1)),
            react_js_1.default.createElement(index_js_1.Badge, { value: space.status === 'Готово к проекту' ? 'Ready' : 'Draft', label: space.status }),
            react_js_1.default.createElement("h2", null, space.name),
            react_js_1.default.createElement("p", null, space.goal || 'Общая среда команды'),
            react_js_1.default.createElement("div", { className: "space-card-bottom" },
                react_js_1.default.createElement("span", null,
                    space.memberIds.length,
                    " \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430 \u00B7 ",
                    space.origin === 'prepared-fixture' ? 'Подготовленный fixture' : 'Создано пользователем'),
                react_js_1.default.createElement(index_js_1.Icon, { name: "arrow" })))),
        react_js_1.default.createElement("button", { className: "space-card add-space", onClick: () => controller_js_1.ui.user?.role === 'platform' ? controller_js_1.ui.open('space') : controller_js_1.ui.notice('Создание доступно платформенному инженеру') },
            react_js_1.default.createElement(index_js_1.Icon, { name: "plus", size: 28 }),
            react_js_1.default.createElement("h3", null, "\u041D\u043E\u0432\u043E\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E"),
            react_js_1.default.createElement("p", null, "\u041E\u0442\u0434\u0435\u043B\u044C\u043D\u0430\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430, \u043F\u0440\u0430\u0432\u0430 \u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u044F."))),
    react_js_1.default.createElement("div", { className: "footnote" },
        react_js_1.default.createElement(index_js_1.Icon, { name: "shield", size: 16 }),
        react_js_1.default.createElement("span", null, "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u044F. \u041E\u0431\u043B\u0430\u043A\u043E, \u043C\u043E\u0434\u0435\u043B\u0438 \u0438 \u0432\u043D\u0435\u0448\u043D\u0438\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u044D\u043C\u0443\u043B\u0438\u0440\u0443\u044E\u0442\u0441\u044F. \u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0435 \u0440\u0435\u0441\u0443\u0440\u0441\u044B \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u044E\u0442\u0441\u044F."))); }
function SetupPage() {
    const setup = controller_js_1.ui.entity('setups', controller_js_1.ui.space?.setupId);
    if (!setup)
        return react_js_1.default.createElement(index_js_1.Empty, { title: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E" });
    const formKey = 'setup:' + setup.id;
    const f = controller_js_1.ui.form(formKey, { ...setup.fields });
    const plans = controller_js_1.ui.scoped('plans'), plan = plans.at(-1);
    const job = controller_js_1.ui.scoped('jobs').filter(j => j.kind === 'provision').at(-1);
    const env = controller_js_1.ui.scoped('environments').find(e => e.kind === 'Sandbox' && e.status === 'Ready');
    const installation = controller_js_1.ui.scoped('installations').at(-1);
    const allowed = controller_js_1.ui.user?.role === 'platform';
    return react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u041F\u041B\u0410\u0422\u0424\u041E\u0420\u041C\u0410 / SETUP", title: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u043C \u0440\u0430\u0431\u043E\u0447\u0435\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E", description: "\u0418\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u0438 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u0430\u044F \u043E\u0441\u043D\u043E\u0432\u0430 \u2014 \u0434\u0432\u0430 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0445 \u0448\u0430\u0433\u0430. \u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435." }),
        react_js_1.default.createElement("div", { className: "stepper" }, ['Команда', 'План ресурсов', 'Подготовка', 'Установка основы', 'Проект'].map((t, i) => react_js_1.default.createElement("div", { key: t, className: i < (env ? installation?.status === 'Ready' ? 4 : 3 : plan ? 2 : 1) ? 'done' : '' },
            react_js_1.default.createElement("span", null, i < (env ? installation?.status === 'Ready' ? 4 : 3 : plan ? 2 : 1) ? react_js_1.default.createElement(index_js_1.Icon, { name: "check", size: 14 }) : i + 1),
            t))),
        !allowed && react_js_1.default.createElement("div", { className: "info-banner" },
            react_js_1.default.createElement(index_js_1.Icon, { name: "shield" }),
            "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0438\u043D\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u044B \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u041C\u0430\u043A\u0441\u0438\u043C\u0443 \u2014 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435\u043D\u043D\u043E\u043C\u0443 \u0438\u043D\u0436\u0435\u043D\u0435\u0440\u0443. \u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u043F\u0440\u043E\u0441\u043C\u0430\u0442\u0440\u0438\u0432\u0430\u0442\u044C \u043F\u043B\u0430\u043D."),
        react_js_1.default.createElement("div", { className: "setup-grid" },
            react_js_1.default.createElement(index_js_1.Panel, { title: "01 / \u041F\u043B\u0430\u043D \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432", meta: "\u0422\u043E\u043B\u044C\u043A\u043E \u044D\u043C\u0443\u043B\u044F\u0446\u0438\u044F \u00B7 \u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0441\u043C\u0435\u0442\u0430" },
                react_js_1.default.createElement("div", { className: "template-options" }, controller_js_1.ui.data.catalog.resourceTemplates.map((t) => react_js_1.default.createElement("button", { key: t.id, className: 'template-option ' + (f.template === t.id ? 'selected' : ''), onClick: () => controller_js_1.ui.autosaveSetup(setup, 'template', t.id), disabled: !allowed || controller_js_1.ui.busy },
                    react_js_1.default.createElement(index_js_1.Icon, { name: t.id === 'team' ? 'team' : t.id === 'custom' ? 'box' : 'cloud', size: 23 }),
                    react_js_1.default.createElement("div", null,
                        react_js_1.default.createElement("b", null, t.name),
                        react_js_1.default.createElement("p", null, t.description),
                        react_js_1.default.createElement("small", null,
                            t.sizing,
                            " \u00B7 v",
                            t.version)),
                    react_js_1.default.createElement("strong", null, (0, index_js_1.money)(t.cost))))),
                react_js_1.default.createElement(index_js_1.Field, { label: "\u0421\u0435\u0442\u0435\u0432\u043E\u0439 \u043F\u0440\u043E\u0444\u0438\u043B\u044C", form: formKey, field: "network", options: [{ value: 'isolated', label: 'Изолированный mock namespace' }, { value: 'invalid-network', label: 'Fixture: ошибка сетевой аттестации' }], onChange: (v) => controller_js_1.ui.autosaveSetup(setup, 'network', v), disabled: !allowed }),
                react_js_1.default.createElement("p", { className: "muted small-text" },
                    "\u0427\u0430\u0441\u043E\u0432\u043E\u0439 \u043F\u043E\u044F\u0441: ",
                    controller_js_1.ui.space?.timezone,
                    ". \u041A\u043B\u0430\u0441\u0441\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F: ",
                    controller_js_1.ui.space?.classification,
                    ". \u041B\u0438\u043C\u0438\u0442: ",
                    (0, index_js_1.money)(controller_js_1.ui.space?.budget),
                    "."),
                react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", disabled: !allowed || controller_js_1.ui.busy, onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('plan.create', { template: f.template || 'minimal', network: f.network || 'isolated' })) }, "\u0420\u0430\u0441\u0441\u0447\u0438\u0442\u0430\u0442\u044C \u043F\u043B\u0430\u043D"),
                plan && react_js_1.default.createElement("div", { className: "quote" },
                    react_js_1.default.createElement("div", null,
                        react_js_1.default.createElement("b", null, "\u0421\u043C\u0435\u0442\u0430 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0438"),
                        react_js_1.default.createElement("strong", null, (0, index_js_1.money)(plan.cost))),
                    react_js_1.default.createElement("p", null, plan.items.join(' · ')),
                    react_js_1.default.createElement("small", null, "\u041F\u043B\u0430\u043D \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u0451\u0442 \u0440\u0435\u0441\u0443\u0440\u0441\u044B. \u0424\u0430\u043A\u0442 \u0443\u0447\u0438\u0442\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E."),
                    react_js_1.default.createElement(index_js_1.Button, { icon: "cloud", disabled: !allowed || !!job && job.targetId === plan.id && ['Pending', 'Completed'].includes(job.status), onClick: () => controller_js_1.ui.open('confirm-provision', plan) }, "\u0417\u0430\u043A\u0430\u0437\u0430\u0442\u044C \u0438 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C"))),
            react_js_1.default.createElement(index_js_1.Panel, { title: "02 / \u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430", meta: job ? 'Серверный job · ' + job.id : 'Начнётся после подтверждения' }, job ? react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement("div", { className: "status-line" },
                    react_js_1.default.createElement(index_js_1.Badge, { value: job.status }),
                    react_js_1.default.createElement("span", null,
                        job.steps?.length || 0,
                        " / 4 \u044D\u0442\u0430\u043F\u0430")),
                react_js_1.default.createElement("div", { className: "vertical-steps" }, ['Validating', 'Provisioning', 'Attesting', 'Ready'].map((stage, i) => react_js_1.default.createElement("div", { key: stage, className: job.steps?.some((e) => e.stage === stage) ? 'complete' : '' },
                    react_js_1.default.createElement("span", null, job.steps?.some((e) => e.stage === stage) ? react_js_1.default.createElement(index_js_1.Icon, { name: "check", size: 15 }) : i + 1),
                    react_js_1.default.createElement("div", null,
                        react_js_1.default.createElement("b", null, ['Проверка плана', 'Создание ресурсов', 'Сеть, права и health', 'Готовая среда'][i]),
                        react_js_1.default.createElement("small", null, job.steps?.find((e) => e.stage === stage) ? (0, index_js_1.date)(job.steps.find((e) => e.stage === stage).at) : 'Ожидает выполнения'))))),
                job.reason && react_js_1.default.createElement("div", { className: "error-box" }, job.reason),
                react_js_1.default.createElement("div", { className: "inline-actions" },
                    job.status === 'Pending' && react_js_1.default.createElement(index_js_1.Button, { variant: "danger", disabled: !allowed, onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('job.cancel', {}, job)) }, "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0443"),
                    ['Failed', 'Cancelled'].includes(job.status) && react_js_1.default.createElement(index_js_1.Button, { disabled: !allowed, onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('job.retry', { network: 'isolated' }, job)) }, "\u0418\u0441\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0441\u0435\u0442\u044C \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C")),
                react_js_1.default.createElement("div", { className: "resource-mini" }, controller_js_1.ui.scoped('resources').map(r => react_js_1.default.createElement("div", { key: r.id },
                    react_js_1.default.createElement(index_js_1.Icon, { name: "box", size: 15 }),
                    react_js_1.default.createElement("span", null, r.kind),
                    react_js_1.default.createElement(index_js_1.Badge, { value: r.status }))))) : react_js_1.default.createElement(index_js_1.Empty, { icon: "cloud", title: "\u0420\u0435\u0441\u0443\u0440\u0441\u044B \u0435\u0449\u0451 \u043D\u0435 \u0437\u0430\u043A\u0430\u0437\u0430\u043D\u044B", description: "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0438\u0442\u0435 \u0441\u043C\u0435\u0442\u0443 \u0438 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043F\u043B\u0430\u043D." }))),
        react_js_1.default.createElement(index_js_1.Panel, { title: "03 / \u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u0430\u044F \u043E\u0441\u043D\u043E\u0432\u0430", meta: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0449\u0438\u0439 runtime. \u0412\u0441\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442 \u043D\u0430\u0448\u0438 mock-adapters." },
            react_js_1.default.createElement("div", { className: "profile-grid" }, controller_js_1.ui.data.catalog.profiles.map((p) => react_js_1.default.createElement("button", { className: 'profile-card ' + (f.profile === p.id ? 'selected' : ''), key: p.id, disabled: !allowed, onClick: () => controller_js_1.ui.autosaveSetup(setup, 'profile', p.id) },
                react_js_1.default.createElement("span", { className: "profile-icon" },
                    react_js_1.default.createElement(index_js_1.Icon, { name: p.kind === 'team' ? 'team' : p.kind === 'custom' ? 'box' : 'flow' })),
                react_js_1.default.createElement("div", null,
                    react_js_1.default.createElement("b", null, p.name),
                    react_js_1.default.createElement("p", null, p.description),
                    react_js_1.default.createElement("small", null, p.placement)),
                f.profile === p.id && react_js_1.default.createElement(index_js_1.Icon, { name: "check", size: 17 })))),
            f.profile === 'custom' && react_js_1.default.createElement("div", { className: "composition-box" },
                react_js_1.default.createElement("h3", null, "\u041A\u0442\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0430\u043C\u0438?"),
                react_js_1.default.createElement(index_js_1.Field, { form: formKey, field: "stateOwner", label: "\u0412\u043B\u0430\u0434\u0435\u043B\u0435\u0446 Run state", defaultValue: "workflow-controller", options: ['workflow-controller', 'agent-coordinator', 'bounded-choreography'] }),
                react_js_1.default.createElement("div", { className: "chip-row" }, ['Agent harness', 'State store', 'Human adapter', 'Model gateway', 'Tool gateway', 'Event outbox'].map(t => react_js_1.default.createElement("span", { key: t, className: "chip" },
                    react_js_1.default.createElement(index_js_1.Icon, { name: "box", size: 14 }),
                    t,
                    " @1"))),
                react_js_1.default.createElement("p", { className: "muted" }, "\u041E\u0434\u0438\u043D \u0432\u043B\u0430\u0434\u0435\u043B\u0435\u0446 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F. \u041F\u0440\u043E\u0438\u0437\u0432\u043E\u043B\u044C\u043D\u044B\u0439 \u043A\u043E\u0434 \u043D\u0435 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F.")),
            react_js_1.default.createElement("div", { className: "panel-action" },
                react_js_1.default.createElement(index_js_1.Button, { icon: "box", disabled: !allowed || !env, onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('installation.create', { environmentId: env?.id, profile: f.profile || 'hg', ...(f.profile === 'custom' ? { composition: { stateOwners: [f.stateOwner || 'workflow-controller'], harness: 'bounded-harness@1', store: 'json-state@1', humanAdapter: 'workbench@1' } } : {}) })) }, f.profile === 'frontier' ? 'Создать mock-подключение' : 'Установить основу'),
                !env && react_js_1.default.createElement("small", null, "\u041D\u0443\u0436\u043D\u0430 \u0433\u043E\u0442\u043E\u0432\u0430\u044F Sandbox."),
                installation && react_js_1.default.createElement(index_js_1.Badge, { value: installation.status })),
            installation?.status === 'Ready' && react_js_1.default.createElement("div", { className: "success-banner" },
                react_js_1.default.createElement(index_js_1.Icon, { name: "check" }),
                react_js_1.default.createElement("span", null, "\u041E\u0441\u043D\u043E\u0432\u0430 \u0433\u043E\u0442\u043E\u0432\u0430. \u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0440\u043E\u0435\u043A\u0442 \u0438 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435 repo / CI / model."),
                react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => controller_js_1.ui.open('project') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442"))));
}

},
"features/studio/StudioPage.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudioPage = StudioPage;
exports.ActorsPage = ActorsPage;
const react_js_1 = require("../../shared/react.js");
const controller_js_1 = require("../../app/controller.js");
const api_js_1 = require("../../shared/data/api.js");
const index_js_1 = require("../../shared/ui/index.js");
function canvasGraph(def, f) {
    const graph = f.graph;
    const width = Math.max(1100, ...graph.nodes.map((n) => (n.x || 0) + 200));
    const height = Math.max(390, ...graph.nodes.map((n) => (n.y || 0) + 180));
    return react_js_1.default.createElement("div", { className: "canvas-scroll", role: "region", "aria-label": "\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0433\u0440\u0430\u0444\u0430", tabIndex: 0 },
        react_js_1.default.createElement("div", { className: "flow-canvas", style: { width, height } },
            react_js_1.default.createElement("svg", { className: "flow-edges", width: width, height: height, "aria-hidden": "true" },
                react_js_1.default.createElement("defs", null,
                    react_js_1.default.createElement("marker", { id: "arrowhead", markerWidth: "7", markerHeight: "7", refX: "6", refY: "3.5", orient: "auto" },
                        react_js_1.default.createElement("polygon", { points: "0 0,7 3.5,0 7", fill: "#7e958b" }))),
                graph.edges.map((edge, i) => {
                    const a = graph.nodes.find((n) => n.id === edge.from), b = graph.nodes.find((n) => n.id === edge.to);
                    if (!a || !b)
                        return null;
                    const ax = (a.x || 0) + 164, ay = (a.y || 0) + 51, bx = (b.x || 0), by = (b.y || 0) + 51;
                    return edge.on === 'rework' ? react_js_1.default.createElement("g", { key: i },
                        react_js_1.default.createElement("path", { d: `M ${ax - 82} ${ay + 48} V ${Math.max(ay, by) + 128} H ${bx + 82} V ${by + 52}`, stroke: "#c39559", strokeDasharray: "5 5", fill: "none", markerEnd: "url(#arrowhead)" }),
                        react_js_1.default.createElement("text", { x: (ax + bx) / 2 - 30, y: Math.max(ay, by) + 149, fill: "#9a7445", fontSize: "12" },
                            "Rework \u00B7 max ",
                            edge.maxVisits || '∞')) : react_js_1.default.createElement("path", { key: i, d: `M ${ax} ${ay} C ${ax + 35} ${ay},${bx - 35} ${by},${bx} ${by}`, stroke: "#91a79c", fill: "none", markerEnd: "url(#arrowhead)" });
                })),
            graph.nodes.map((node, i) => react_js_1.default.createElement("button", { key: node.id, className: 'flow-node type-' + node.type + (f.selectedNode === node.id ? ' selected' : ''), style: { left: node.x ?? i * 220 + 40, top: node.y ?? 70 }, onClick: () => controller_js_1.ui.set('studio:' + def.id, 'selectedNode', node.id), draggable: true, onDragStart: (e) => { e.dataTransfer.setData('text/plain', node.id); controller_js_1.ui.form('studio:' + def.id).drag = { x: e.clientX, y: e.clientY, node: node.id, startX: node.x || 0, startY: node.y || 0 }; }, onDragEnd: (e) => {
                    const drag = f.drag;
                    if (drag && e.clientX) {
                        node.x = Math.max(20, drag.startX + e.clientX - drag.x);
                        node.y = Math.max(20, drag.startY + e.clientY - drag.y);
                        controller_js_1.ui.set('studio:' + def.id, 'graph', { ...graph });
                    }
                } },
                react_js_1.default.createElement("div", { className: "node-type" },
                    react_js_1.default.createElement(index_js_1.Icon, { name: node.type === 'AI' ? 'spark' : ['Input', 'Approval'].includes(node.type) ? 'shield' : node.type === 'Terminal' ? 'check' : node.type === 'Command' ? 'box' : 'play', size: 17 }),
                    node.type),
                react_js_1.default.createElement("b", null, node.label),
                react_js_1.default.createElement("small", null, node.protected ? 'Обязательный контроль' : node.actor || node.command || node.id))),
            react_js_1.default.createElement("div", { className: "canvas-caption" },
                react_js_1.default.createElement("span", null, "\u041F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u0439\u0442\u0435 \u0443\u0437\u043B\u044B \u00B7 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u0437\u0435\u043B \u0434\u043B\u044F \u0441\u0432\u043E\u0439\u0441\u0442\u0432"),
                react_js_1.default.createElement("b", null,
                    graph.nodes.length,
                    " \u0443\u0437\u043B\u043E\u0432 / ",
                    graph.edges.length,
                    " \u0441\u0432\u044F\u0437\u0435\u0439"))));
}
function StudioPage() {
    const definitions = controller_js_1.ui.scoped('definitions');
    const def = controller_js_1.ui.entity('definitions', controller_js_1.ui.objectId) || definitions[0];
    if (!def)
        return react_js_1.default.createElement(react_js_1.default.Fragment, null,
            react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "STUDIO", title: "\u0421\u043E\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043F\u043E\u0441\u043E\u0431 \u0440\u0430\u0431\u043E\u0442\u044B", description: "Flow, \u0430\u0434\u0440\u0435\u0441\u0443\u0435\u043C\u044B\u0439 AI-\u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A \u0438\u043B\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u0430 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u043E\u0432. \u041E\u0434\u0438\u043D \u0433\u0440\u0430\u0444 \u0434\u043B\u044F \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0438 \u0438\u0441\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F.", actions: react_js_1.default.createElement(index_js_1.Button, { icon: "plus", disabled: !controller_js_1.ui.project || controller_js_1.ui.user?.role !== 'engineer', onClick: () => controller_js_1.ui.open('definition') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044E") }),
            react_js_1.default.createElement(index_js_1.Empty, { icon: "flow", title: "\u041F\u0435\u0440\u0432\u044B\u0439 \u043A\u043E\u043D\u0432\u0435\u0439\u0435\u0440 \u2014 \u0438\u0437 \u0448\u0430\u0431\u043B\u043E\u043D\u0430", description: "\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0441 SDLC: \u043F\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430, \u0432\u043E\u043F\u0440\u043E\u0441, \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435, checks \u0438 \u0438\u043D\u0436\u0435\u043D\u0435\u0440\u043D\u043E\u0435 \u0440\u0435\u0432\u044C\u044E.", action: react_js_1.default.createElement(index_js_1.Button, { disabled: !controller_js_1.ui.project || controller_js_1.ui.user?.role !== 'engineer', onClick: () => controller_js_1.ui.open('definition') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0438\u0437 \u0448\u0430\u0431\u043B\u043E\u043D\u0430") }));
    const key = 'studio:' + def.id;
    const f = controller_js_1.ui.form(key, { graph: JSON.parse(JSON.stringify(def.graph)), team: JSON.parse(JSON.stringify(def.team)), dependencies: [...def.dependencies], name: def.name, baseRevision: def.revision, selectedNode: def.graph.nodes[0]?.id, tab: 'canvas' });
    const graph = f.graph, node = graph.nodes.find((n) => n.id === f.selectedNode);
    const save = () => controller_js_1.ui.act(async () => { const result = await controller_js_1.ui.cmd('definition.save', { name: f.name, graph: f.graph, team: f.team, dependencies: f.dependencies }, def.id, { expectedRevision: f.baseRevision }); f.baseRevision = result.revision; controller_js_1.ui.persistForms(); return result; }, 'Черновик сохранён. Активные Runs не изменены.');
    return react_js_1.default.createElement(react_js_1.default.Fragment, null,
        react_js_1.default.createElement(index_js_1.Heading, { eyebrow: `STUDIO / ${def.kind.toUpperCase()}`, title: def.name, description: `Черновик revision ${def.revision} · ${controller_js_1.ui.entity('projects', def.projectId)?.name} · ${controller_js_1.ui.entity('installations', def.installationId)?.name}`, actions: react_js_1.default.createElement(react_js_1.default.Fragment, null,
                react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", disabled: controller_js_1.ui.user?.role !== 'engineer', onClick: () => void save() }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A"),
                react_js_1.default.createElement(index_js_1.Button, { icon: "play", disabled: controller_js_1.ui.user?.role !== 'engineer', onClick: () => controller_js_1.ui.open('trial', { definitionId: def.id }) }, "\u041F\u0440\u043E\u0431\u043D\u044B\u0439 \u0437\u0430\u043F\u0443\u0441\u043A")) }),
        react_js_1.default.createElement("div", { className: "studio-select" },
            react_js_1.default.createElement("select", { "aria-label": "\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F Studio", value: def.id, onChange: (e) => controller_js_1.ui.go('studio', e.target.value) }, definitions.map(d => react_js_1.default.createElement("option", { key: d.id, value: d.id },
                d.name,
                " \u00B7 ",
                d.kind))),
            react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", icon: "plus", disabled: controller_js_1.ui.user?.role !== 'engineer', onClick: () => controller_js_1.ui.open('definition') }, "\u041D\u043E\u0432\u0430\u044F \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F"),
            react_js_1.default.createElement(index_js_1.Badge, { value: "Draft" }),
            react_js_1.default.createElement("span", { className: "muted small-text" }, "Trial \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0439 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A.")),
        react_js_1.default.createElement("div", { className: "studio-layout" },
            react_js_1.default.createElement("section", { className: "studio-main panel" },
                react_js_1.default.createElement(index_js_1.Tabs, { current: f.tab, items: [{ id: 'canvas', label: 'Canvas' }, { id: 'list', label: 'Список узлов' }, { id: 'json', label: 'JSON' }, ...(def.kind === 'team' ? [{ id: 'team', label: 'Команда и routing' }] : [])], onChange: (v) => controller_js_1.ui.set(key, 'tab', v) }),
                react_js_1.default.createElement("div", { className: "canvas-toolbar" },
                    react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", icon: "plus", onClick: () => controller_js_1.ui.open('node', { definitionId: def.id }) }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0443\u0437\u0435\u043B"),
                    react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", onClick: () => controller_js_1.ui.open('edge', { definitionId: def.id }) }, "\u0421\u0432\u044F\u0437\u0430\u0442\u044C \u0443\u0437\u043B\u044B"),
                    react_js_1.default.createElement("div", { className: "toolbar-spacer" }),
                    react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", onClick: () => void controller_js_1.ui.act(async () => { const result = await controller_js_1.ui.cmd('definition.validate', { graph: f.graph }, def); controller_js_1.ui.set(key, 'findings', result.findings); return result; }, 'Проверка графа выполнена') }, "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0433\u0440\u0430\u0444"),
                    react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", onClick: () => (0, api_js_1.downloadJSON)(def.name + '.json', f.graph) }, "\u042D\u043A\u0441\u043F\u043E\u0440\u0442")),
                f.tab === 'canvas' ? canvasGraph(def, f) : f.tab === 'list' ? react_js_1.default.createElement("div", { className: "node-table" }, graph.nodes.map((n) => react_js_1.default.createElement("button", { className: "list-row clickable", key: n.id, onClick: () => controller_js_1.ui.set(key, 'selectedNode', n.id) },
                    react_js_1.default.createElement("span", null,
                        react_js_1.default.createElement("b", null, n.label),
                        react_js_1.default.createElement("small", null,
                            n.id,
                            " \u00B7 ",
                            n.type)),
                    react_js_1.default.createElement("span", null, n.actor || n.reviewerRole || n.command || '—')))) : f.tab === 'json' ? react_js_1.default.createElement("div", { className: "json-editor" },
                    react_js_1.default.createElement(index_js_1.Field, { label: "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0439 \u0433\u0440\u0430\u0444 \u00B7 schemaVersion 1", form: key, field: "jsonText", type: "textarea", defaultValue: JSON.stringify(f.graph, null, 2), rows: 18 }),
                    react_js_1.default.createElement("div", { className: "inline-actions" },
                        react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => {
                                void controller_js_1.ui.act(async () => {
                                    const parsed = JSON.parse(f.jsonText ?? JSON.stringify(f.graph));
                                    const result = await controller_js_1.ui.cmd('definition.validate', { graph: parsed }, def);
                                    if (result.findings.length) {
                                        const error = new Error('Импорт не прошёл проверку. Текущий draft сохранён.');
                                        error.fields = { findings: result.findings };
                                        throw error;
                                    }
                                    controller_js_1.ui.open('import-graph', { definitionId: def.id, graph: parsed });
                                }, '');
                            } }, "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0438 \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0438\u043C\u043F\u043E\u0440\u0442"),
                        react_js_1.default.createElement("label", { className: "file-button" },
                            "\u041E\u0442\u043A\u0440\u044B\u0442\u044C JSON-\u0444\u0430\u0439\u043B",
                            react_js_1.default.createElement("input", { type: "file", accept: ".json,application/json", onChange: async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        controller_js_1.ui.set(key, 'jsonText', await file.text());
                                    }
                                } })))) : react_js_1.default.createElement("div", { className: "team-editor" },
                    react_js_1.default.createElement("div", { className: "coordinator" },
                        react_js_1.default.createElement(index_js_1.Icon, { name: "team", size: 29 }),
                        react_js_1.default.createElement("div", null,
                            react_js_1.default.createElement("h3", null, f.team.coordinator),
                            react_js_1.default.createElement("p", null, "\u041E\u0434\u0438\u043D coordinator \u00B7 \u043E\u0431\u0449\u0438\u0439 root budget \u00B7 all-required join"))),
                    Object.entries(f.team.routing).map(([taskClass, roles]) => react_js_1.default.createElement("div", { className: "team-plan", key: taskClass },
                        react_js_1.default.createElement("b", null, taskClass.toUpperCase()),
                        roles.map((r, i) => react_js_1.default.createElement("div", { key: r },
                            react_js_1.default.createElement("span", null, i === 0 ? 'Исполнение' : 'Review'),
                            react_js_1.default.createElement(index_js_1.Icon, { name: "spark" }),
                            react_js_1.default.createElement("b", null, r),
                            react_js_1.default.createElement("small", null, f.team.roles[r]))))),
                    react_js_1.default.createElement(index_js_1.Field, { label: "TeamDefinition JSON", form: key, field: "teamText", type: "textarea", defaultValue: JSON.stringify(f.team, null, 2), rows: 10 }),
                    react_js_1.default.createElement(index_js_1.Button, { variant: "secondary", onClick: () => {
                            try {
                                f.team = JSON.parse(f.teamText || JSON.stringify(f.team));
                                controller_js_1.ui.changed();
                                controller_js_1.ui.notice('Локальная команда изменена. Сохраните черновик.');
                            }
                            catch (e) {
                                controller_js_1.ui.error = e;
                                controller_js_1.ui.changed();
                            }
                        } }, "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F")),
                f.findings && react_js_1.default.createElement("div", { className: f.findings.length ? 'validation-list error' : 'validation-list good' }, f.findings.length ? f.findings.map((e, i) => react_js_1.default.createElement("p", { key: i },
                    react_js_1.default.createElement("b", null,
                        e.nodeId || 'Граф',
                        ":"),
                    " ",
                    e.message)) : react_js_1.default.createElement("p", null,
                    react_js_1.default.createElement(index_js_1.Icon, { name: "check", size: 16 }),
                    " \u0413\u0440\u0430\u0444 \u0432\u0430\u043B\u0438\u0434\u0435\u043D. \u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0433\u0435\u0439\u0442\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B."))),
            react_js_1.default.createElement("aside", { className: "studio-properties" },
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u0421\u0432\u043E\u0439\u0441\u0442\u0432\u0430 \u0443\u0437\u043B\u0430", meta: node?.id || 'Выберите узел' }, node && react_js_1.default.createElement(react_js_1.default.Fragment, null,
                    react_js_1.default.createElement(index_js_1.Field, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", form: key + ':node:' + node.id, field: "label", defaultValue: node.label, onChange: (v) => { node.label = v; controller_js_1.ui.set(key, 'graph', { ...graph }); } }),
                    react_js_1.default.createElement(index_js_1.Field, { label: "\u0418\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C / \u0440\u043E\u043B\u044C", form: key + ':node:' + node.id, field: "actor", defaultValue: node.actor || node.reviewerRole || '', onChange: (v) => { node.actor = v; controller_js_1.ui.set(key, 'graph', { ...graph }); } }),
                    react_js_1.default.createElement(index_js_1.Field, { label: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F", form: key + ':node:' + node.id, field: "instruction", type: "textarea", defaultValue: node.instruction || '', onChange: (v) => { node.instruction = v; controller_js_1.ui.set(key, 'graph', { ...graph }); } }),
                    node.type === 'Command' && react_js_1.default.createElement(index_js_1.Field, { label: "Mock-\u043A\u043E\u043C\u0430\u043D\u0434\u0430", form: key + ':node:' + node.id, field: "command", defaultValue: node.command || 'verify-ui', options: ['verify-ui', 'verify-docs', 'lint', 'test', 'mock-pr', 'policy-probe'], onChange: (v) => { node.command = v; controller_js_1.ui.set(key, 'graph', { ...graph }); } }),
                    node.protected && react_js_1.default.createElement("div", { className: "info-banner compact" },
                        react_js_1.default.createElement(index_js_1.Icon, { name: "shield", size: 17 }),
                        "\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0438\u043D\u0436\u0435\u043D\u0435\u0440\u043D\u044B\u0439 Gate"),
                    react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "danger", disabled: node.protected, onClick: () => { f.graph = { ...graph, nodes: graph.nodes.filter((n) => n.id !== node.id), edges: graph.edges.filter((e) => e.from !== node.id && e.to !== node.id) }; f.selectedNode = null; controller_js_1.ui.changed(); } }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0443\u0437\u0435\u043B"))),
                react_js_1.default.createElement(index_js_1.Panel, { title: "\u0417\u0430\u043A\u0440\u0435\u043F\u043B\u044F\u0435\u043C\u044B\u0435 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0438", meta: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0430\u044E\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043A \u043D\u043E\u0432\u043E\u0439 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438" },
                    [...controller_js_1.ui.scoped('knowledgeVersions'), ...controller_js_1.ui.scoped('componentVersions')].filter(v => v.status === 'Published').map(v => react_js_1.default.createElement("label", { className: "dependency-option", key: v.id },
                        react_js_1.default.createElement("input", { type: "checkbox", checked: f.dependencies.includes(v.id), onChange: (e) => controller_js_1.ui.set(key, 'dependencies', e.target.checked ? [...f.dependencies, v.id] : f.dependencies.filter((id) => id !== v.id)) }),
                        react_js_1.default.createElement("span", null,
                            react_js_1.default.createElement("b", null, v.title || v.name),
                            react_js_1.default.createElement(index_js_1.Digest, { value: v.contentDigest, label: "VERSION" })))),
                    ![...controller_js_1.ui.scoped('knowledgeVersions'), ...controller_js_1.ui.scoped('componentVersions')].some(v => v.status === 'Published') && react_js_1.default.createElement("p", { className: "muted small-text" }, "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0432\u0435\u0440\u0441\u0438\u0439 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u0418\u0445 \u043C\u043E\u0436\u043D\u043E \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u0441\u043B\u0435 review \u0437\u043D\u0430\u043D\u0438\u044F \u0438\u043B\u0438 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0430."),
                    react_js_1.default.createElement(index_js_1.Button, { variant: "ghost", small: true, onClick: () => controller_js_1.ui.go('knowledge') },
                        "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0437\u043D\u0430\u043D\u0438\u044F ",
                        react_js_1.default.createElement(index_js_1.Icon, { name: "arrow", size: 13 }))))));
}
function ActorsPage() { return react_js_1.default.createElement(react_js_1.default.Fragment, null,
    react_js_1.default.createElement(index_js_1.Heading, { eyebrow: "\u0420\u0410\u0417\u0420\u0410\u0411\u041E\u0422\u041A\u0410 \u0410\u0412\u0422\u041E\u041D\u041E\u041C\u041D\u041E\u0421\u0422\u0418", title: "AI-\u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0438", description: "\u0423\u0441\u0442\u043E\u0439\u0447\u0438\u0432\u0430\u044F identity, \u0432\u043B\u0430\u0434\u0435\u043B\u0435\u0446, \u043E\u0431\u043B\u0430\u0441\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u044B \u0438 \u043F\u0443\u0441\u0442\u0430\u044F \u0447\u0430\u0441\u0442\u043D\u0430\u044F \u043F\u0430\u043C\u044F\u0442\u044C \u043F\u0440\u0438 \u043A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0438.", actions: react_js_1.default.createElement(index_js_1.Button, { icon: "plus", disabled: !['engineer', 'platform'].includes(controller_js_1.ui.user?.role || ''), onClick: () => controller_js_1.ui.open('actor') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C AI-\u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430") }),
    controller_js_1.ui.scoped('actors').length ? react_js_1.default.createElement("div", { className: "cards-grid" }, controller_js_1.ui.scoped('actors').map(a => react_js_1.default.createElement(index_js_1.Panel, { key: a.id },
        react_js_1.default.createElement("div", { className: "actor-head" },
            react_js_1.default.createElement(index_js_1.Avatar, { ai: true }),
            react_js_1.default.createElement("div", null,
                react_js_1.default.createElement("h3", null, a.name),
                react_js_1.default.createElement("small", null,
                    "AI \u00B7 ",
                    a.template)),
            react_js_1.default.createElement(index_js_1.Badge, { value: a.status })),
        react_js_1.default.createElement("p", null, a.instruction),
        react_js_1.default.createElement("div", { className: "key-values" },
            react_js_1.default.createElement("span", null, "\u0412\u043B\u0430\u0434\u0435\u043B\u0435\u0446"),
            react_js_1.default.createElement("b", null, controller_js_1.ui.data.catalog.users.find((u) => u.id === a.ownerId)?.name),
            react_js_1.default.createElement("span", null, "\u041A\u043B\u0430\u0441\u0441\u044B"),
            react_js_1.default.createElement("b", null, a.taskClasses.join(', ')),
            react_js_1.default.createElement("span", null, "\u041C\u043E\u0434\u0435\u043B\u044C"),
            react_js_1.default.createElement("code", null, a.modelProfile),
            react_js_1.default.createElement("span", null, "\u041F\u0430\u043C\u044F\u0442\u044C"),
            react_js_1.default.createElement("b", null,
                "\u0427\u0430\u0441\u0442\u043D\u0430\u044F \u00B7 ",
                a.privateMemory?.length ?? 'недоступно',
                " \u0437\u0430\u043F\u0438\u0441\u0435\u0439")),
        react_js_1.default.createElement("div", { className: "inline-actions" },
            react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "secondary", onClick: () => void controller_js_1.ui.act(() => controller_js_1.ui.cmd('actor.clone', {}, a), 'Новая identity создана. Память и grants не скопированы.') }, "\u041A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0440\u043E\u043B\u044C"),
            react_js_1.default.createElement(index_js_1.Button, { small: true, variant: "ghost", onClick: () => controller_js_1.ui.open('definition', { kind: 'actor', actorId: a.id }) }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C Workflow"))))) : react_js_1.default.createElement(index_js_1.Empty, { icon: "team", title: "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u0435 \u043F\u0435\u0440\u0432\u043E\u0433\u043E AI-\u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430", description: "\u042D\u0442\u043E \u0430\u0434\u0440\u0435\u0441\u0443\u0435\u043C\u044B\u0439 mock Actor, \u0430 \u043D\u0435 \u0447\u0435\u043B\u043E\u0432\u0435\u043A \u0438 \u043D\u0435 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0430\u044F LLM.", action: react_js_1.default.createElement(index_js_1.Button, { onClick: () => controller_js_1.ui.open('actor') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C AI-\u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430") })); }

},
"shared/data/api.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIError = void 0;
exports.request = request;
exports.downloadJSON = downloadJSON;
class APIError extends Error {
    code;
    fields;
    constructor(error) { super(error.message || 'Ошибка сервера'); this.code = error.code; this.fields = error.fields || {}; }
}
exports.APIError = APIError;
async function request(path, body) {
    const response = await fetch('/api/v1' + path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    let json;
    try {
        json = await response.json();
    }
    catch {
        throw new APIError({ code: 'InvalidResponse', message: 'Сервер вернул некорректный ответ' });
    }
    if (!response.ok)
        throw new APIError(json.error || { message: 'HTTP ' + response.status });
    return json;
}
function downloadJSON(name, data) { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }

},
"shared/react.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactDOM = exports.React = void 0;
/** The distribution vendors React 16.0.0 / ReactDOM 16.0.1 locally. No CDN calls. */
exports.React = globalThis.React;
// React 16.0 supports returning arrays but predates the named Fragment API.
if (!exports.React.Fragment)
    exports.React.Fragment = function Fragment({ children }) { return children || null; };
exports.ReactDOM = globalThis.ReactDOM;
exports.default = exports.React;

},
"shared/ui/index.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusLabel = exports.short = exports.date = exports.money = void 0;
exports.Badge = Badge;
exports.Icon = Icon;
exports.Button = Button;
exports.Heading = Heading;
exports.Empty = Empty;
exports.Field = Field;
exports.SelectField = SelectField;
exports.ErrorBox = ErrorBox;
exports.Panel = Panel;
exports.Tabs = Tabs;
exports.Metric = Metric;
exports.Digest = Digest;
exports.Avatar = Avatar;
exports.RunCard = RunCard;
exports.Markdown = Markdown;
exports.Diff = Diff;
const react_js_1 = require("../react.js");
const controller_js_1 = require("../../app/controller.js");
const money = (amount = 0) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(amount / 100) + ' d₽';
exports.money = money;
const date = (value) => value ? new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
exports.date = date;
const short = (value = '') => value.replace('sha256:', '').slice(0, 12);
exports.short = short;
const labels = { Ready: 'Готово', Pending: 'Ожидает', Running: 'Выполняется', WaitingInput: 'Нужен ответ', WaitingApproval: 'На ревью', Accepted: 'Принято', Failed: 'Ошибка', Cancelled: 'Отменено', Blocked: 'Заблокировано', Paused: 'На паузе', Draft: 'Черновик', Published: 'Опубликовано', Proposed: 'Предложено', InReview: 'На проверке', Approved: 'Одобрено', Answered: 'Ответ получен', ReworkRequested: 'Доработка', Superseded: 'Заменено', Revoked: 'Отозвано', Configured: 'Настроен', Admitted: 'Допущен', Active: 'Активно', Completed: 'Завершено', Installing: 'Установка', TechnicalReview: 'Техническое ревью', ScopeReview: 'Решение PO', AwaitingUAT: 'Ожидает UAT', UATAccepted: 'UAT принят', Backlog: 'Бэклог', InProgress: 'В работе', NeedsInput: 'Нужен ответ', InDoubt: 'Эффект неизвестен', HumanOwned: 'Управляет человек', TakeoverRequested: 'Передача управления', Done: 'Готово', Planned: 'План', AwaitingPO: 'Решение PO', Suspended: 'Приостановлено', Validating: 'Проверка', Provisioning: 'Подготовка', Attesting: 'Аттестация', Provisioned: 'Создано', ReportOnly: 'Только отчёт' };
const statusLabel = (value) => labels[value] || value;
exports.statusLabel = statusLabel;
function Badge({ value, label }) { const tone = ['Accepted', 'Ready', 'Published', 'Admitted', 'Active', 'Completed', 'Done', 'Approved', 'Answered'].includes(value) ? 'good' : ['Failed', 'Revoked', 'Blocked', 'InDoubt', 'Cancelled'].includes(value) ? 'bad' : ['Pending', 'WaitingInput', 'WaitingApproval', 'ReworkRequested', 'InReview', 'ScopeReview', 'AwaitingPO'].includes(value) ? 'warn' : 'muted'; return react_js_1.default.createElement("span", { className: 'badge ' + tone },
    react_js_1.default.createElement("span", { className: "badge-dot" }),
    label || (0, exports.statusLabel)(value)); }
function Icon({ name, size = 20 }) { const paths = { home: react_js_1.default.createElement("path", { d: "m3 11 9-8 9 8M5 10v11h5v-6h4v6h5V10" }), chat: react_js_1.default.createElement("path", { d: "M21 15a3 3 0 0 1-3 3H8l-5 4V5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z M7 8h10M7 12h7" }), tasks: react_js_1.default.createElement("g", null,
        react_js_1.default.createElement("rect", { x: "4", y: "3", width: "16", height: "18", rx: "3" }),
        react_js_1.default.createElement("path", { d: "m7 9 1 1 2-3m2 2h5m-10 7 1 1 2-3m2 2h5" })), inbox: react_js_1.default.createElement("g", null,
        react_js_1.default.createElement("path", { d: "m4 4-2 10v6h20v-6L20 4Z M2 14h6l1 3h6l1-3h6" })), flow: react_js_1.default.createElement("g", null,
        react_js_1.default.createElement("rect", { x: "2", y: "3", width: "6", height: "6", rx: "1" }),
        react_js_1.default.createElement("rect", { x: "16", y: "3", width: "6", height: "6", rx: "1" }),
        react_js_1.default.createElement("rect", { x: "9", y: "16", width: "6", height: "6", rx: "1" }),
        react_js_1.default.createElement("path", { d: "M8 6h8M12 6v10" })), layers: react_js_1.default.createElement("path", { d: "m12 3 10 5-10 5L2 8Z M2 12l10 5 10-5M2 16l10 5 10-5" }), book: react_js_1.default.createElement("g", null,
        react_js_1.default.createElement("path", { d: "M12 5v16M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z" })), play: react_js_1.default.createElement("path", { d: "m8 4 12 8L8 20Z" }), box: react_js_1.default.createElement("g", null,
        react_js_1.default.createElement("path", { d: "m12 2 10 5v10l-10 5-10-5V7Z M2 7l10 5 10-5M12 12v10M7 4l10 5" })), cloud: react_js_1.default.createElement("path", { d: "M6 19a5 5 0 0 1-1-10 7 7 0 0 1 13-2 6 6 0 0 1 0 12Z" }), team: react_js_1.default.createElement("g", null,
        react_js_1.default.createElement("circle", { cx: "9", cy: "8", r: "3" }),
        react_js_1.default.createElement("path", { d: "M2 21v-3a7 7 0 0 1 14 0v3M16 5a3 3 0 0 1 0 6m3 3a6 6 0 0 1 3 5v2" })), spark: react_js_1.default.createElement("g", null,
        react_js_1.default.createElement("path", { d: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" })), chart: react_js_1.default.createElement("path", { d: "M3 3v18h18M7 16l4-5 4 2 6-8" }), check: react_js_1.default.createElement("path", { d: "m5 12 4 4L19 6" }), close: react_js_1.default.createElement("path", { d: "m6 6 12 12M6 18 18 6" }), plus: react_js_1.default.createElement("path", { d: "M12 4v16M4 12h16" }), arrow: react_js_1.default.createElement("path", { d: "M4 12h16m-6-6 6 6-6 6" }), search: react_js_1.default.createElement("g", null,
        react_js_1.default.createElement("circle", { cx: "10", cy: "10", r: "6" }),
        react_js_1.default.createElement("path", { d: "m15 15 6 6" })), menu: react_js_1.default.createElement("path", { d: "M3 6h18M3 12h18M3 18h18" }), shield: react_js_1.default.createElement("path", { d: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Zm-5 9 3 3 7-7" }), clock: react_js_1.default.createElement("g", null,
        react_js_1.default.createElement("circle", { cx: "12", cy: "12", r: "9" }),
        react_js_1.default.createElement("path", { d: "M12 6v6l4 2" })), settings: react_js_1.default.createElement("g", null,
        react_js_1.default.createElement("path", { d: "M4 6h16M4 12h16M4 18h16" }),
        react_js_1.default.createElement("circle", { cx: "8", cy: "6", r: "2" }),
        react_js_1.default.createElement("circle", { cx: "16", cy: "12", r: "2" }),
        react_js_1.default.createElement("circle", { cx: "9", cy: "18", r: "2" })), logout: react_js_1.default.createElement("path", { d: "M9 3H3v18h6m5-15 6 6-6 6M7 12h13" }) }; return react_js_1.default.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.65", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, paths[name] || paths.box); }
function Button({ children, onClick, variant = 'primary', icon, disabled = false, type = 'button', small = false, ...props }) { return react_js_1.default.createElement("button", { type: type, className: 'btn ' + variant + (small ? ' small' : ''), onClick: onClick, disabled: disabled || controller_js_1.ui.busy, ...props },
    icon && react_js_1.default.createElement(Icon, { name: icon, size: 17 }),
    react_js_1.default.createElement("span", null, children)); }
function Heading({ eyebrow, title, description, actions }) { return react_js_1.default.createElement("div", { className: "page-heading" },
    react_js_1.default.createElement("div", null,
        eyebrow && react_js_1.default.createElement("div", { className: "eyebrow" }, eyebrow),
        react_js_1.default.createElement("h1", null, title),
        description && react_js_1.default.createElement("p", null, description)),
    actions && react_js_1.default.createElement("div", { className: "heading-actions" }, actions)); }
function Empty({ icon = 'box', title, description, action }) { return react_js_1.default.createElement("div", { className: "empty" },
    react_js_1.default.createElement("div", { className: "empty-icon" },
        react_js_1.default.createElement(Icon, { name: icon, size: 30 })),
    react_js_1.default.createElement("h3", null, title),
    react_js_1.default.createElement("p", null, description),
    action); }
function Field({ label, form, field, defaultValue = '', type = 'text', options, placeholder, required = false, help, rows = 4, onChange, ...rest }) { const f = controller_js_1.ui.form(form), value = f[field] ?? defaultValue; const change = (e) => onChange ? onChange(e.target.value) : controller_js_1.ui.set(form, field, type === 'checkbox' ? e.target.checked : e.target.value); const id = (form + '-' + field).replace(/[^a-z0-9_-]/gi, '-'); return react_js_1.default.createElement("label", { className: "field", htmlFor: id },
    react_js_1.default.createElement("span", null,
        label,
        required && react_js_1.default.createElement("b", { className: "required" }, " *")),
    options ? react_js_1.default.createElement("select", { id: id, value: value, onChange: change, ...rest }, options.map((o) => react_js_1.default.createElement("option", { key: o.value ?? o.id ?? o, value: o.value ?? o.id ?? o }, o.label ?? o.name ?? o))) : type === 'textarea' ? react_js_1.default.createElement("textarea", { id: id, value: value, rows: rows, placeholder: placeholder, onChange: change, ...rest }) : react_js_1.default.createElement("input", { id: id, type: type, value: type === 'checkbox' ? undefined : value, checked: type === 'checkbox' ? Boolean(value) : undefined, onChange: change, placeholder: placeholder, required: required, ...rest }),
    " ",
    help && react_js_1.default.createElement("small", null, help)); }
function SelectField({ label, value, onChange, items, placeholder, ...props }) { return react_js_1.default.createElement("label", { className: "field" },
    react_js_1.default.createElement("span", null, label),
    react_js_1.default.createElement("select", { value: value || '', onChange: (e) => onChange(e.target.value), ...props },
        placeholder && react_js_1.default.createElement("option", { value: "" }, placeholder),
        items.map((e) => react_js_1.default.createElement("option", { key: e.id ?? e.value, value: e.id ?? e.value }, e.name ?? e.title ?? e.label)))); }
function ErrorBox() {
    if (!controller_js_1.ui.error)
        return null;
    return react_js_1.default.createElement("div", { className: "error-box", role: "alert" },
        react_js_1.default.createElement(Icon, { name: "shield" }),
        react_js_1.default.createElement("div", null,
            react_js_1.default.createElement("b", null, controller_js_1.ui.error.message || 'Ошибка'),
            controller_js_1.ui.error.code && react_js_1.default.createElement("small", null, controller_js_1.ui.error.code),
            Object.entries(controller_js_1.ui.error.fields || {}).map(([key, value]) => react_js_1.default.createElement("p", { key: key },
                key,
                ": ",
                typeof value === 'string' ? value : JSON.stringify(value)))));
}
function Panel({ title, meta, actions, children, className = '' }) { return react_js_1.default.createElement("section", { className: 'panel ' + className },
    title && react_js_1.default.createElement("div", { className: "panel-head" },
        react_js_1.default.createElement("div", null,
            react_js_1.default.createElement("h2", null, title),
            meta && react_js_1.default.createElement("small", null, meta)),
        actions),
    children); }
function Tabs({ items, current, onChange }) { return react_js_1.default.createElement("div", { className: "tabs" }, items.map((it) => react_js_1.default.createElement("button", { key: it.id, className: current === it.id ? 'active' : '', onClick: () => onChange(it.id) },
    it.label,
    it.count !== undefined && react_js_1.default.createElement("span", null, it.count)))); }
function Metric({ label, value, detail, icon }) { return react_js_1.default.createElement("div", { className: "metric-card" },
    react_js_1.default.createElement("div", { className: "metric-top" },
        label,
        icon && react_js_1.default.createElement(Icon, { name: icon, size: 18 })),
    react_js_1.default.createElement("strong", null, value),
    react_js_1.default.createElement("small", null, detail)); }
function Digest({ value, label = 'SNAPSHOT' }) { return react_js_1.default.createElement("span", { className: "digest", title: value },
    label,
    " ",
    react_js_1.default.createElement("code", null, (0, exports.short)(value) || '—')); }
function Avatar({ id, ai = false, name }) { const u = controller_js_1.ui.data?.catalog.users.find((u) => u.id === id); return react_js_1.default.createElement("span", { className: 'avatar ' + (ai ? 'ai' : id || ''), title: name || u?.name }, ai ? react_js_1.default.createElement(Icon, { name: "spark", size: 18 }) : u?.initials || name?.slice(0, 2) || 'К'); }
function RunCard({ run, compact = false }) { const task = controller_js_1.ui.entity('tasks', run.taskId), def = controller_js_1.ui.entity('definitions', controller_js_1.ui.entity('snapshots', run.snapshotId)?.definitionId), env = controller_js_1.ui.entity('environments', run.environmentId); const gate = controller_js_1.ui.all('gates').find(g => g.runId === run.id && g.status === 'Pending'); return react_js_1.default.createElement("div", { className: 'run-card ' + (compact ? 'compact' : '') },
    react_js_1.default.createElement("div", { className: "run-card-top" },
        react_js_1.default.createElement("span", { className: "run-type" },
            react_js_1.default.createElement(Icon, { name: def?.kind === 'team' ? 'team' : 'flow', size: 17 }),
            run.mode?.toUpperCase(),
            " ",
            react_js_1.default.createElement("span", null, "\u00B7"),
            " ",
            env?.name || 'Sandbox'),
        react_js_1.default.createElement(Badge, { value: run.status })),
    react_js_1.default.createElement("button", { className: "link-title", onClick: () => controller_js_1.ui.go('runs', run.id) }, task?.title || 'Запуск'),
    react_js_1.default.createElement("p", null, def?.name || run.assignedRole || 'Зафиксированная конфигурация'),
    react_js_1.default.createElement("div", { className: "run-meta" },
        react_js_1.default.createElement(Digest, { value: run.configurationDigest }),
        react_js_1.default.createElement("span", null,
            "\u041F\u043E\u043F\u044B\u0442\u043A\u0430 ",
            run.attempt)),
    !compact && react_js_1.default.createElement("div", { className: "run-card-footer" },
        react_js_1.default.createElement("span", { className: "people" },
            react_js_1.default.createElement(Avatar, { id: run.reviewerId }),
            react_js_1.default.createElement("span", null, (0, exports.date)(run.startedAt || run.createdAt))),
        gate ? react_js_1.default.createElement(Button, { variant: "secondary", small: true, onClick: () => void controller_js_1.ui.openGate(gate.id) }, gate.kind === 'input' ? 'Ответить' : 'Открыть ревью') : react_js_1.default.createElement(Button, { variant: "ghost", small: true, onClick: () => controller_js_1.ui.go('channels', run.channelId, run.threadId) },
            "\u041A \u043E\u0431\u0441\u0443\u0436\u0434\u0435\u043D\u0438\u044E ",
            react_js_1.default.createElement(Icon, { name: "arrow", size: 14 })))); }
function Markdown({ text = '' }) {
    let code = false;
    return react_js_1.default.createElement("div", { className: "markdown" }, text.split('\n').map((line, i) => {
        if (line.startsWith('```')) {
            code = !code;
            return react_js_1.default.createElement("div", { className: "code-boundary", key: i });
        }
        if (code)
            return react_js_1.default.createElement("pre", { key: i }, line || ' ');
        if (line.startsWith('### '))
            return react_js_1.default.createElement("h4", { key: i }, line.slice(4));
        if (line.startsWith('## '))
            return react_js_1.default.createElement("h3", { key: i }, line.slice(3));
        if (line.startsWith('# '))
            return react_js_1.default.createElement("h2", { key: i }, line.slice(2));
        if (line.startsWith('- '))
            return react_js_1.default.createElement("p", { key: i },
                "\u2022 ",
                line.slice(2));
        return react_js_1.default.createElement("p", { key: i }, line || '\u00a0');
    }));
}
function Diff({ content = '' }) { return react_js_1.default.createElement("pre", { className: "diff", tabIndex: 0, "aria-label": "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u043E \u0441\u0442\u0440\u043E\u043A\u0430\u043C" }, content.split('\n').map((line, i) => react_js_1.default.createElement("span", { key: i, className: line.startsWith('+') && !line.startsWith('+++') ? 'add' : line.startsWith('-') && !line.startsWith('---') ? 'remove' : line.startsWith('@@') ? 'hunk' : '' },
    react_js_1.default.createElement("i", null, i + 1),
    line || ' ',
    '\n'))); }

}},cache={};function resolve(from,name){const parts=(from.slice(0,from.lastIndexOf('/')+1)+name).split('/'),out=[];for(const part of parts){if(part==='..')out.pop();else if(part!=='.'&&part)out.push(part);}return out.join('/');}function load(id){if(cache[id])return cache[id].exports;if(!modules[id])throw Error('Unknown module '+id);const module=cache[id]={exports:{}};modules[id](name=>load(resolve(id,name)),module,module.exports);return module.exports;}load('app/App.js');})();