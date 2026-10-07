import React, {useState} from 'react';
import {Boxes, Building2, Check, Database, Layers, Plus, Server, ShieldCheck, Trash2, Users, Workflow} from 'lucide-react';
import {capabilityForTag, type State, type Person, type Product, type Team, type Item} from '@/lib/domain';
import {useKontur} from './context';
import {Button, Card, Field, Input, Textarea, Pick, Notice, Pill, Modal} from './ui';

export function Brand() {
  return <><span className="brand-mark" aria-hidden="true"><i/><i/><i/><i/></span><span className="brand-copy"><strong>КОНТУР</strong><small>TEAM SPACE</small></span></>;
}

export function ResetSetupButton({busy, reset}: {busy: boolean; reset: () => Promise<boolean>}) {
  const [open, setOpen] = useState(false);
  return <><Button variant="ghost" disabled={busy} onClick={() => setOpen(true)}><Trash2 size={15}/>Очистить данные</Button><Modal open={open} onClose={() => !busy && setOpen(false)} title="Очистить сценарий «С нуля»?" description="Продукты, команды, доски, задачи, Flow и история этого сценария будут удалены."><div className="stack"><p className="subtext">Настройка начнётся с создания Product. Сценарий с демонстрационными данными сохранится.</p><div className="actions"><Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Отмена</Button><Button variant="destructive" disabled={busy} onClick={async () => {if (await reset()) setOpen(false);}}><Trash2 size={15}/>Очистить и начать заново</Button></div></div></Modal></>;
}

export function ScenarioScreen({busy, choose, onBack}: {busy: boolean; choose: (scenario: 'demo' | 'empty') => void; onBack?: () => void}) {
  return <div className="entry-shell">
    <aside className="entry-aside"><div className="brand"><Brand/></div><div className="entry-aside-copy"><span className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</span><h2>Выберите сценарий работы</h2><p>Демонстрация возможностей или последовательная настройка своей команды.</p></div><div className="entry-aside-foot"><ShieldCheck size={17}/><span>Локальное приложение<br/>React + Node.js</span></div></aside>
    <main className="entry-main"><header className="entry-topbar"><span>Командная среда <i>/</i> <strong>Сценарии</strong></span>{onBack && <Button variant="ghost" onClick={onBack}>Вернуться в пространство</Button>}</header><div className="entry-content">
      <p className="eyebrow">КОНТУР / НАЧАЛО РАБОТЫ</p><h1>Как начнём?</h1><p className="entry-description">Оба сценария доступны в одном приложении. Данные и прогресс каждого сохраняются отдельно.</p>
      <div className="scenario-grid">
        <section className="scenario-card"><div className="scenario-symbol"><Database size={26}/></div><Pill tone="green">Данные готовы</Pill><h2>С демонстрационными данными</h2><p>Продукт «Копилка», команда Growth, задачи, конфигурации и история запусков.</p><ul><li><Check size={15}/>Рабочий Team Space и Environment</li><li><Check size={15}/>Input, Approval, Rework и Takeover</li><li><Check size={15}/>Benchmarks, Releases и Monitoring</li></ul><Button disabled={busy} onClick={() => choose('demo')} data-scenario="demo">Открыть с данными</Button></section>
        <section className="scenario-card"><div className="scenario-symbol outline"><Plus size={28}/></div><Pill>Пошаговая настройка</Pill><h2>С нуля</h2><p>Создайте Product и Team, назначьте участников, подключите ресурсы и выполните первый запуск.</p><ul><li><Check size={15}/>Без готовых продуктов, задач и запусков</li><li><Check size={15}/>Общий каталог и policies доступны</li><li><Check size={15}/>Продолжение с сохранённого шага</li></ul><Button variant="outline" disabled={busy} onClick={() => choose('empty')} data-scenario="empty">Открыть настройку с нуля</Button></section>
      </div><p className="entry-footnote"><ShieldCheck size={16}/>Внешние интеграции и исполнения работают в демонстрационном режиме.</p>
    </div></main>
  </div>;
}

type BootstrapProps = {
  state: State; actor: Person; product?: Product; busy: boolean;
  act: (action: string, payload?: Item) => Promise<any>;
  setScope: (product: string, team: string) => void;
  go: (screen: string, ref?: string, tab?: string) => void;
  onScenario: () => void;
  onReset?: () => Promise<boolean>;
};

export function Bootstrap({state, actor, product, busy, act, setScope, go, onScenario, onReset}: BootstrapProps) {
  const [form, setForm] = useState({name: '', description: '', goals: ''});
  const [team, setTeam] = useState({name: '', scope: ''});
  const owner = state.people.find(person => person.role === 'Product Owner');
  const allowed = actor.role === 'Product Owner';
  const step = product ? 2 : 1;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = product
      ? await act('create_team', {...team, productId: product.id, teamId: ''})
      : await act('create_product', {...form, productId: '', teamId: ''});
    if (!result?.id) return;
    setScope(product?.id || result.id, product ? result.id : '');
    go('home');
  }
  return <div className="entry-shell bootstrap-shell">
    <aside className="entry-aside"><button className="brand" onClick={onScenario}><Brand/></button><div className="bootstrap-steps"><p className="eyebrow">НАСТРОЙКА С НУЛЯ</p>{[{name: 'Создать продукт', icon: Building2}, {name: 'Создать Team', icon: Users}, {name: 'Участники и ресурсы', icon: Layers}, {name: 'Среда и первый запуск', icon: Workflow}].map((item, index) => <div className={`bootstrap-step ${index + 1 === step ? 'active' : ''} ${index + 1 < step ? 'done' : ''}`} key={item.name}><span>{index + 1 < step ? <Check size={15}/> : `0${index + 1}`}</span><div><item.icon size={16}/>{item.name}</div></div>)}</div><div className="entry-aside-foot"><ShieldCheck size={17}/><span>Настройка сохраняется<br/>после каждого действия</span></div></aside>
    <main className="entry-main"><header className="entry-topbar"><span>Командная среда <i>/</i> <strong>Настройка</strong></span><div className="entry-tools">{onReset && <ResetSetupButton busy={busy} reset={onReset}/>}<Button variant="ghost" onClick={onScenario}>Сценарии</Button><Pick label="Демонстрационная роль" value={actor.id} onChange={actorId => {void act('select_actor', {actorId});}} options={state.people.map(person => ({value: person.id, label: person.name}))}/></div></header>
      <div className="entry-content bootstrap-content"><p className="eyebrow">ШАГ {step} / 4 · PRODUCT OWNER</p><h1>{product ? 'Создайте команду продукта' : 'Начните со своего продукта'}</h1><p className="entry-description">{product ? 'Команда получает Team Space сразу. Среду исполнения вы подключите на следующем этапе.' : 'Задайте продукт, за который отвечает команда. Его знания, задачи и результаты будут связаны с этим контекстом.'}</p>
        <div className="bootstrap-grid"><Card title={product ? 'Team & Responsibility' : 'Product'}><form className="stack" onSubmit={submit}>
          {product ? <><Field label="Название Team"><Input value={team.name} onChange={event => setTeam({...team, name: event.target.value})} required disabled={!allowed} placeholder="Название команды"/></Field><Field label="Responsibility Scope" hint="Области ответственности команды. По одной на строку."><Textarea rows={4} value={team.scope} onChange={event => setTeam({...team, scope: event.target.value})} required disabled={!allowed}/></Field></> : <><Field label="Название Product"><Input value={form.name} onChange={event => setForm({...form, name: event.target.value})} required disabled={!allowed} placeholder="Название продукта"/></Field><Field label="Описание"><Textarea rows={3} value={form.description} onChange={event => setForm({...form, description: event.target.value})} required disabled={!allowed}/></Field><Field label="Цели"><Textarea rows={2} value={form.goals} onChange={event => setForm({...form, goals: event.target.value})} disabled={!allowed}/></Field></>}
          {!allowed && <Notice title="Требуется Product Owner" tone="blue">{owner && <Button type="button" variant="outline" disabled={busy} onClick={() => act('select_actor', {actorId: owner.id})}>Переключиться на владельца продукта</Button>}</Notice>}
          <div className="actions"><Button type="submit" disabled={!allowed || busy}><Plus size={16}/>{product ? 'Создать команду и пространство' : 'Создать продукт'}</Button></div>
        </form></Card><div className="stack">
          {product ? <Card title="Product создан"><div className="row"><span className="scenario-symbol small"><Building2 size={21}/></span><h2>{product.name}</h2></div><p className="subtext mt-4">{product.description}</p><div className="divider"/><Button variant="ghost" onClick={() => go('settings', '', 'product')}>Настройки продукта</Button></Card> : <Card title="Чистое рабочее пространство"><div className="setup-empty-stat"><strong>0</strong><span>продуктов, команд и запусков</span></div><p className="subtext">Общий каталог, Regulatory Context и демонстрационные профили доступны для настройки.</p></Card>}
          <div className="bootstrap-note"><ShieldCheck size={20}/><div><h3>Права сохраняются на каждом шаге</h3><p>Product Owner определяет продукт и команду. Platform Engineer настраивает ресурсы и среду. Product Engineer готовит Capability и запускает задачи.</p></div></div>
        </div></div>
      </div>
    </main>
  </div>;
}

export function isSetupComplete(state: State, team: Team, product: Product) {
  const members = state.people.filter(person => team.people.includes(person.id));
  const boards = state.boards.filter(item => item.teamId === team.id && item.productId === product.id);
  const tasks = state.tasks.filter(item => item.teamId === team.id && item.productId === product.id);
  const capabilities = Array.from(new Set(tasks.map(task => task.tag).filter(Boolean)))
    .map(tag => capabilityForTag(state, product.id, tag))
    .filter(Boolean);
  const runs = state.runs.filter(run => run.teamId === team.id && run.productId === product.id && !run.uat);
  return ['Platform Engineer', 'Product Engineer'].every(role => members.some(person => person.role === role))
    && ['Repository', 'Task Tracker', 'CI'].every(type => team.bindings.some(binding => binding.type === type && binding.status === 'connected'))
    && team.environment.status === 'ready'
    && boards.length > 0
    && tasks.length > 0
    && capabilities.length > 0
    && runs.some(run => run.status === 'accepted');
}

export function SetupChecklist() {
  const {state, team, product, actor, act, go, busy} = useKontur();
  const members = state.people.filter(person => team.people.includes(person.id));
  const boards = state.boards.filter(item => item.teamId === team.id && item.productId === product.id);
  const tasks = state.tasks.filter(item => item.teamId === team.id && item.productId === product.id);
  const capabilities = Array.from(new Set(tasks.map(task => task.tag).filter(Boolean))).map(tag => capabilityForTag(state, product.id, tag)).filter((item): item is NonNullable<typeof item> => !!item);
  const runs = state.runs.filter(run => run.teamId === team.id && run.productId === product.id && !run.uat);
  const required = ['Repository', 'Task Tracker', 'CI'];
  const steps = [
    {title: 'Назначьте участников', text: 'Добавьте Platform Engineer и Product Engineer в People.', done: ['Platform Engineer', 'Product Engineer'].every(role => members.some(person => person.role === role)), role: 'Product Owner', screen: 'settings', tab: 'people', button: 'Открыть участников'},
    {title: 'Подключите ресурсы', text: 'Git-репозиторий с Permissions, проект в Task Tracker и pipeline в Jenkins CI.', done: required.every(type => team.bindings.some(binding => binding.type === type && binding.status === 'connected')), role: 'Platform Engineer', screen: 'environment', tab: 'resources', button: 'Подключить ресурсы'},
    {title: 'Подготовьте Environment', text: 'Пройдите Workflow Platform → Finish: выберите платформу, проверьте Preview и выполните Provisioning.', done: team.environment.status === 'ready', role: 'Platform Engineer', screen: 'environment', tab: team.automation ? 'sandbox' : 'automation', button: 'Настроить среду'},
    {title: 'Создайте доску и задачи', text: 'Создайте Task Board команды и добавьте моковые задачи с тегами и исполнителями.', done: boards.length > 0 && tasks.length > 0, role: 'Product Engineer', screen: 'tasks', tab: '', button: 'Открыть доску задач'},
    {title: 'Выберите и настройте Flow', text: 'Откройте каталог, выберите Flow и создайте свою копию. Настройте узлы и сохраните конфигурацию.', done: capabilities.length > 0, role: 'Product Engineer', screen: 'catalog', tab: 'Flow', button: 'Выбрать процесс в каталоге'},
    {title: 'Выполните первый запуск', text: 'Запустите задачу из Configuration в supervised mode и пройдите Input / Approval.', done: runs.some(run => run.status === 'accepted'), role: 'Product Engineer', screen: runs.some(run => ['input_required', 'approval_required', 'takeover'].includes(run.status)) ? 'messenger' : 'capability', tab: 'configuration', button: runs.length ? 'Продолжить работу' : 'Открыть процесс и запустить'},
  ];
  const done = steps.filter(step => step.done).length;
  if (done === steps.length) return null;
  async function open(step: typeof steps[number]) {
    if (actor.role !== step.role) {
      const target = members.find(person => person.role === step.role);
      if (!target || !(await act('select_actor', {actorId: target.id}))?.ok) return;
    }
    go(step.screen, step.screen === 'capability' ? capabilities[0]?.id || '' : '', step.screen === 'messenger' ? '' : step.tab);
  }
  return <section className="setup-checklist section-gap"><header><div><p className="eyebrow">СЦЕНАРИЙ / С НУЛЯ</p><h2>Подготовьте команду к первому запуску</h2><p>Product и Team Space созданы. Прогресс определяется текущими данными.</p></div><Pill tone="green">{done} из {steps.length}</Pill></header><div className="setup-progress" aria-label={`Выполнено ${done} из ${steps.length}`}><span style={{width: `${done / steps.length * 100}%`}}/></div><div>{steps.map((step, index) => {
    const current = steps.slice(0, index).every(item => item.done);
    const canContinue = current && !busy && (actor.role === step.role || members.some(person => person.role === step.role));
    return <div className={`setup-check-row ${step.done ? 'done' : current ? 'current' : 'waiting'}`} key={step.title}><span className="setup-number">{step.done ? <Check size={16}/> : index + 1}</span><div className="setup-check-copy"><h3>{step.title}</h3><p>{step.text}</p><small>{step.role}</small></div>{step.done ? <span className="setup-done"><Check size={16}/>Готово</span> : current ? <Button variant="outline" size="sm" disabled={!canContinue} onClick={() => open(step)}>{step.button}</Button> : <span className="setup-waiting">После предыдущего шага</span>}</div>;
  })}</div></section>;
}
