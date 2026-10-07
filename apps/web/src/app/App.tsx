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
const routeName = (route: string) => route === 'spaces' ? 'Пространства' : groups.flatMap(g => g.items).find(i => i[0] === route)?.[1] || 'Работа';
function Sidebar() { const pending = ui.scoped('humanTasks').filter(h => h.assigneeId === ui.user?.id && h.status === 'Pending').length; return <><div className={'nav-shade ' + (ui.navOpen ? 'open' : '')} onClick={() => { ui.navOpen = false; ui.changed(); }}/><aside className={'sidebar ' + (ui.navOpen ? 'open' : '')} aria-label="Главная навигация"><button className="brand" onClick={() => ui.go('spaces')} aria-label="КОНТУР — пространства"><span className="brand-mark"><i /><i /><i /></span><span><b>КОНТУР</b><small>TEAM SPACE</small></span><span className="brand-version">6.0</span></button><div className="space-switch"><label htmlFor="space-select">Рабочее пространство</label><select id="space-select" value={ui.spaceId} onChange={(e: any) => e.target.value ? void ui.selectSpace(e.target.value) : ui.go('spaces')}><option value="">Все пространства</option>{ui.all('spaces').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><nav className="nav-scroll">{groups.map(group => <div className="nav-group" key={group.label}><h2>{group.label}</h2>{group.items.map(([route, label, icon]) => <button key={route} className={'nav-item ' + (ui.route === route ? 'active' : '')} disabled={!ui.spaceId} onClick={() => ui.go(route, route === 'channels' ? ui.scoped('channels')[0]?.id || '' : '')}><Icon name={icon} size={18}/><span>{label}</span>{route === 'inbox' && pending > 0 && <b className="nav-count">{pending}</b>}</button>)}</div>)}</nav><div className="sidebar-footer"><span className={'status-dot ' + (ui.offline ? 'offline' : '')}/><div><b>{ui.offline ? 'Соединение потеряно' : 'Локальный mock-runtime'}</b><small>Внешние эффекты — эмуляция</small></div><Icon name="shield" size={16}/></div></aside></>; }
function Page() { if (ui.route === 'spaces')
    return <SpacesPage />; if (!ui.spaceId)
    return <SpacesPage />; switch (ui.route) {
    case 'work': return <WorkPage />;
    case 'inbox': return <InboxPage />;
    case 'setup': return <SetupPage />;
    case 'projects': return <ProjectsPage />;
    case 'tasks': return <TasksPage />;
    case 'studio': return <StudioPage />;
    case 'actors': return <ActorsPage />;
    case 'runs': return <RunsPage />;
    case 'channels': return <MessengerPage />;
    case 'assistant': return <AssistantPage />;
    case 'knowledge': return <KnowledgePage />;
    case 'components': return <ComponentsPage />;
    case 'evaluations': return <EvaluationsPage />;
    case 'releases': return <ReleasesPage />;
    case 'resources':
    case 'installations':
    case 'bindings': return <PlatformPage />;
    default: return <OperationsPage />;
} }
function App() { return <><a className="skip-link" href="#main-scroll">Перейти к содержимому</a><Sidebar /><div className="app-main"><header className="topbar"><button className="icon-button mobile-menu" aria-label="Открыть навигацию" aria-expanded={ui.navOpen} onClick={() => { ui.navOpen = !ui.navOpen; ui.changed(); }}><Icon name="menu"/></button><div className="breadcrumbs"><span>{ui.space?.name || 'Командная среда'}</span><i>/</i><b>{routeName(ui.route)}</b></div><div className="topbar-tools">{ui.spaceId && <><select className="project-select" aria-label="Фильтр проекта" value={ui.projectId} onChange={(e: any) => { ui.projectId = e.target.value; ui.changed(); }}><option value="">Все проекты</option>{ui.all('projects').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="icon-button top-search" aria-label="Поиск по пространству" onClick={() => ui.open('search')}><Icon name="search"/></button></>}<span className="demo-pill">MOCK</span><div className="identity"><Avatar id={ui.user?.id}/><select disabled={ui.busy || ui.loading} aria-label="Демонстрационный профиль" value={ui.user?.id || 'maxim'} onChange={(e: any) => void ui.identity(e.target.value)}>{(ui.data?.catalog.users || [{ id: 'maxim', name: 'Максим', title: 'Платформенный инженер' }, { id: 'ivan', name: 'Иван', title: 'Продукт-инженер' }, { id: 'maria', name: 'Мария', title: 'Продукт-инженер' }, { id: 'anna', name: 'Анна', title: 'Владелец продукта' }]).map((u: any) => <option key={u.id} value={u.id}>{u.name} · {u.title}</option>)}</select></div></div></header>{ui.offline && <div className="offline-banner" role="status">Нет связи с сервером. Данные могут быть устаревшими; изменения и approval запрещены. <button onClick={() => void ui.refresh()}>Повторить подключение</button></div>}{ui.data?.recovery && <div className="recovery-banner"><b>Recovery mode</b> {ui.data.recovery.reason}<Button small disabled={ui.user?.role !== 'platform'} onClick={() => void ui.act(() => ui.cmd('storage.recover'), 'Проверенный backup восстановлен')}>Восстановить backup</Button></div>}<main id="main-scroll" className={'page ' + (ui.route === 'channels' ? 'messenger-page' : '')} tabIndex={-1}>{ui.loading || !ui.data ? <div className="loading-screen"><div className="spinner"/><h2>Открываем рабочее пространство</h2><p>{ui.loadingText || 'Загрузка сохранённого состояния…'}</p>{ui.error && <ErrorBox />}</div> : <>{!ui.modal && !ui.gateId && <ErrorBox />}<Page /></>}</main><div className="app-foot"><span>КОНТУР · TEAM SPACE</span><span>Три роли · серверные решения · синтетические данные</span></div></div>{ui.modal && <Modals />}{ui.gateId && <HumanWorkbench />}{ui.toast && !ui.modal && !ui.gateId && <div className="toast" role="status"><Icon name="check" size={18}/>{ui.toast}</div>}{ui.loadingText && <div className="busy-overlay"><div className="spinner"/><b>{ui.loadingText}</b></div>}</>; }
class RenderBridge extends React.Component {
    unsubscribe: any;
    constructor(props: any) { super(props); this.state = { revision: 0 }; }
    componentDidMount() { this.unsubscribe = ui.subscribe(() => this.setState((state: any) => ({ revision: state.revision + 1 }))); void ui.init().catch(e => { ui.error = e; ui.loading = false; ui.changed(); }); }
    componentWillUnmount() { this.unsubscribe?.(); }
    render() { return <App />; }
}
ReactDOM.render(<RenderBridge />, document.getElementById('root'));
