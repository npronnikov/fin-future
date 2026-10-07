import React, { ReactDOM } from '../shared/react.js';
import { ui } from './controller.js';
import { Modals } from './Modals.js';
import { SpacesPage, SetupPage } from '../features/setup/SetupPage.js';
import { WorkPage, InboxPage } from '../features/operations/WorkPage.js';
import { ProjectsPage, TasksPage } from '../features/projects/ProjectsPage.js';
import { StudioPage, ActorsPage } from '../features/studio/StudioPage.js';
import { RunsPage } from '../features/runs/RunsPage.js';
import { MessengerPage, AssistantPage } from '../features/messenger/MessengerPage.js';
import { HumanWorkbench } from '../features/review/HumanWorkbench.js';
import { KnowledgePage } from '../features/knowledge/KnowledgePage.js';
import { ComponentsPage } from '../features/components/ComponentsPage.js';
import { EvaluationsPage } from '../features/evaluations/EvaluationsPage.js';
import { ReleasesPage } from '../features/releases/ReleasesPage.js';
import { PlatformPage } from '../features/platform/PlatformPage.js';
import { OperationsPage } from '../features/operations/OperationsPage.js';
import { Icon, Avatar, ErrorBox, Button } from '../shared/ui/index.js';
const groups = [{ label: 'РАБОТА', items: [['work', 'Мой день', 'home'], ['channels', 'Сообщения', 'chat'], ['tasks', 'Задачи', 'tasks'], ['inbox', 'Human Inbox', 'inbox'], ['assistant', 'Мой ассистент', 'spark']] }, { label: 'РАЗРАБОТКА АВТОНОМНОСТИ', items: [['projects', 'Проекты', 'box'], ['actors', 'AI-сотрудники', 'team'], ['studio', 'Studio', 'flow'], ['runs', 'Запуски', 'play'], ['components', 'Компоненты', 'layers'], ['knowledge', 'Знания', 'book'], ['evaluations', 'Испытания и арена', 'chart'], ['releases', 'Релизы', 'shield']] }, { label: 'ПЛАТФОРМА', items: [['setup', 'Подготовка пространства', 'settings'], ['resources', 'Ресурсы и сервисы', 'cloud'], ['installations', 'Установленные основы', 'layers'], ['bindings', 'Интеграции и доступы', 'box'], ['environments', 'Среды и размещения', 'cloud'], ['monitoring', 'Мониторинг', 'chart'], ['outcomes', 'Метрики продукта', 'chart'], ['costs', 'Затраты', 'chart'], ['audit', 'Аудит', 'shield']] }];
const routeName = (route) => route === 'spaces' ? 'Пространства' : groups.flatMap(g => g.items).find(i => i[0] === route)?.[1] || 'Работа';
function Sidebar() { const pending = ui.scoped('humanTasks').filter(h => h.assigneeId === ui.user?.id && h.status === 'Pending').length; return React.createElement(React.Fragment, null,
    React.createElement("div", { className: 'nav-shade ' + (ui.navOpen ? 'open' : ''), onClick: () => { ui.navOpen = false; ui.changed(); } }),
    React.createElement("aside", { className: 'sidebar ' + (ui.navOpen ? 'open' : ''), "aria-label": "\u0413\u043B\u0430\u0432\u043D\u0430\u044F \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F" },
        React.createElement("button", { className: "brand", onClick: () => ui.go('spaces'), "aria-label": "\u041A\u041E\u041D\u0422\u0423\u0420 \u2014 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430" },
            React.createElement("span", { className: "brand-mark" },
                React.createElement("i", null),
                React.createElement("i", null),
                React.createElement("i", null)),
            React.createElement("span", null,
                React.createElement("b", null, "\u041A\u041E\u041D\u0422\u0423\u0420"),
                React.createElement("small", null, "TEAM SPACE")),
            React.createElement("span", { className: "brand-version" }, "6.0")),
        React.createElement("div", { className: "space-switch" },
            React.createElement("label", { htmlFor: "space-select" }, "\u0420\u0430\u0431\u043E\u0447\u0435\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E"),
            React.createElement("select", { id: "space-select", value: ui.spaceId, onChange: (e) => e.target.value ? void ui.selectSpace(e.target.value) : ui.go('spaces') },
                React.createElement("option", { value: "" }, "\u0412\u0441\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430"),
                ui.all('spaces').map(s => React.createElement("option", { key: s.id, value: s.id }, s.name)))),
        React.createElement("nav", { className: "nav-scroll" }, groups.map(group => React.createElement("div", { className: "nav-group", key: group.label },
            React.createElement("h2", null, group.label),
            group.items.map(([route, label, icon]) => React.createElement("button", { key: route, className: 'nav-item ' + (ui.route === route ? 'active' : ''), disabled: !ui.spaceId, onClick: () => ui.go(route, route === 'channels' ? ui.scoped('channels')[0]?.id || '' : '') },
                React.createElement(Icon, { name: icon, size: 18 }),
                React.createElement("span", null, label),
                route === 'inbox' && pending > 0 && React.createElement("b", { className: "nav-count" }, pending)))))),
        React.createElement("div", { className: "sidebar-footer" },
            React.createElement("span", { className: 'status-dot ' + (ui.offline ? 'offline' : '') }),
            React.createElement("div", null,
                React.createElement("b", null, ui.offline ? 'Соединение потеряно' : 'Локальный mock-runtime'),
                React.createElement("small", null, "\u0412\u043D\u0435\u0448\u043D\u0438\u0435 \u044D\u0444\u0444\u0435\u043A\u0442\u044B \u2014 \u044D\u043C\u0443\u043B\u044F\u0446\u0438\u044F")),
            React.createElement(Icon, { name: "shield", size: 16 })))); }
function Page() {
    if (ui.route === 'spaces')
        return React.createElement(SpacesPage, null);
    if (!ui.spaceId)
        return React.createElement(SpacesPage, null);
    switch (ui.route) {
        case 'work': return React.createElement(WorkPage, null);
        case 'inbox': return React.createElement(InboxPage, null);
        case 'setup': return React.createElement(SetupPage, null);
        case 'projects': return React.createElement(ProjectsPage, null);
        case 'tasks': return React.createElement(TasksPage, null);
        case 'studio': return React.createElement(StudioPage, null);
        case 'actors': return React.createElement(ActorsPage, null);
        case 'runs': return React.createElement(RunsPage, null);
        case 'channels': return React.createElement(MessengerPage, null);
        case 'assistant': return React.createElement(AssistantPage, null);
        case 'knowledge': return React.createElement(KnowledgePage, null);
        case 'components': return React.createElement(ComponentsPage, null);
        case 'evaluations': return React.createElement(EvaluationsPage, null);
        case 'releases': return React.createElement(ReleasesPage, null);
        case 'resources':
        case 'installations':
        case 'bindings': return React.createElement(PlatformPage, null);
        default: return React.createElement(OperationsPage, null);
    }
}
function App() { return React.createElement(React.Fragment, null,
    React.createElement("a", { className: "skip-link", href: "#main-scroll" }, "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u043C\u0443"),
    React.createElement(Sidebar, null),
    React.createElement("div", { className: "app-main" },
        React.createElement("header", { className: "topbar" },
            React.createElement("button", { className: "icon-button mobile-menu", "aria-label": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044E", "aria-expanded": ui.navOpen, onClick: () => { ui.navOpen = !ui.navOpen; ui.changed(); } },
                React.createElement(Icon, { name: "menu" })),
            React.createElement("div", { className: "breadcrumbs" },
                React.createElement("span", null, ui.space?.name || 'Командная среда'),
                React.createElement("i", null, "/"),
                React.createElement("b", null, routeName(ui.route))),
            React.createElement("div", { className: "topbar-tools" },
                ui.spaceId && React.createElement(React.Fragment, null,
                    React.createElement("select", { className: "project-select", "aria-label": "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u0440\u043E\u0435\u043A\u0442\u0430", value: ui.projectId, onChange: (e) => { ui.projectId = e.target.value; ui.changed(); } },
                        React.createElement("option", { value: "" }, "\u0412\u0441\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u044B"),
                        ui.all('projects').map(p => React.createElement("option", { key: p.id, value: p.id }, p.name))),
                    React.createElement("button", { className: "icon-button top-search", "aria-label": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0443", onClick: () => ui.open('search') },
                        React.createElement(Icon, { name: "search" }))),
                React.createElement("span", { className: "demo-pill" }, "MOCK"),
                React.createElement("div", { className: "identity" },
                    React.createElement(Avatar, { id: ui.user?.id }),
                    React.createElement("select", { disabled: ui.busy || ui.loading, "aria-label": "\u0414\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043F\u0440\u043E\u0444\u0438\u043B\u044C", value: ui.user?.id || 'maxim', onChange: (e) => void ui.identity(e.target.value) }, (ui.data?.catalog.users || [{ id: 'maxim', name: 'Максим', title: 'Платформенный инженер' }, { id: 'ivan', name: 'Иван', title: 'Продукт-инженер' }, { id: 'maria', name: 'Мария', title: 'Продукт-инженер' }, { id: 'anna', name: 'Анна', title: 'Владелец продукта' }]).map((u) => React.createElement("option", { key: u.id, value: u.id },
                        u.name,
                        " \u00B7 ",
                        u.title)))))),
        ui.offline && React.createElement("div", { className: "offline-banner", role: "status" },
            "\u041D\u0435\u0442 \u0441\u0432\u044F\u0437\u0438 \u0441 \u0441\u0435\u0440\u0432\u0435\u0440\u043E\u043C. \u0414\u0430\u043D\u043D\u044B\u0435 \u043C\u043E\u0433\u0443\u0442 \u0431\u044B\u0442\u044C \u0443\u0441\u0442\u0430\u0440\u0435\u0432\u0448\u0438\u043C\u0438; \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0438 approval \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u044B. ",
            React.createElement("button", { onClick: () => void ui.refresh() }, "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435")),
        ui.data?.recovery && React.createElement("div", { className: "recovery-banner" },
            React.createElement("b", null, "Recovery mode"),
            " ",
            ui.data.recovery.reason,
            React.createElement(Button, { small: true, disabled: ui.user?.role !== 'platform', onClick: () => void ui.act(() => ui.cmd('storage.recover'), 'Проверенный backup восстановлен') }, "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C backup")),
        React.createElement("main", { id: "main-scroll", className: 'page ' + (ui.route === 'channels' ? 'messenger-page' : ''), tabIndex: -1 }, ui.loading || !ui.data ? React.createElement("div", { className: "loading-screen" },
            React.createElement("div", { className: "spinner" }),
            React.createElement("h2", null, "\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u043C \u0440\u0430\u0431\u043E\u0447\u0435\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E"),
            React.createElement("p", null, ui.loadingText || 'Загрузка сохранённого состояния…'),
            ui.error && React.createElement(ErrorBox, null)) : React.createElement(React.Fragment, null,
            !ui.modal && !ui.gateId && React.createElement(ErrorBox, null),
            React.createElement(Page, null))),
        React.createElement("div", { className: "app-foot" },
            React.createElement("span", null, "\u041A\u041E\u041D\u0422\u0423\u0420 \u00B7 TEAM SPACE"),
            React.createElement("span", null, "\u0422\u0440\u0438 \u0440\u043E\u043B\u0438 \u00B7 \u0441\u0435\u0440\u0432\u0435\u0440\u043D\u044B\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u00B7 \u0441\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435"))),
    ui.modal && React.createElement(Modals, null),
    ui.gateId && React.createElement(HumanWorkbench, null),
    ui.toast && !ui.modal && !ui.gateId && React.createElement("div", { className: "toast", role: "status" },
        React.createElement(Icon, { name: "check", size: 18 }),
        ui.toast),
    ui.loadingText && React.createElement("div", { className: "busy-overlay" },
        React.createElement("div", { className: "spinner" }),
        React.createElement("b", null, ui.loadingText))); }
class RenderBridge extends React.Component {
    unsubscribe;
    constructor(props) { super(props); this.state = { revision: 0 }; }
    componentDidMount() { this.unsubscribe = ui.subscribe(() => this.setState((state) => ({ revision: state.revision + 1 }))); void ui.init().catch(e => { ui.error = e; ui.loading = false; ui.changed(); }); }
    componentWillUnmount() { this.unsubscribe?.(); }
    render() { return React.createElement(App, null); }
}
ReactDOM.render(React.createElement(RenderBridge, null), document.getElementById('root'));
