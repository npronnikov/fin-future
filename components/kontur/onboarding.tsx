import React, {useState} from 'react';
import {Popover} from 'radix-ui';
import {ArrowRight, Boxes, Building2, Check, Database, Home, Layers, MoreHorizontal, Plus, RefreshCw, Server, ShieldCheck, Trash2, Users, Workflow, X} from 'lucide-react';
import {capabilityForTag, type State, type Person, type Product, type Team, type Item} from '@/lib/domain';
import {useKontur} from './context';
import {Button, Card, Field, Input, Textarea, Pick, Notice, Pill, Modal} from './ui';

export function Brand() {
  return <><span className="brand-mark" aria-hidden="true"><i/><i/><i/><i/></span><span className="brand-copy"><strong>КОНТУР</strong><small>TEAM SPACE</small></span></>;
}

export function ResetSetupButton({busy, reset, menu = false}: {busy: boolean; reset: () => Promise<boolean>; menu?: boolean}) {
  const [open, setOpen] = useState(false);
  return <>{menu ? <button type="button" className="workspace-menu-item danger" disabled={busy} onClick={() => setOpen(true)}><Trash2 size={15}/><span>Очистить данные</span></button> : <Button variant="ghost" disabled={busy} onClick={() => setOpen(true)}><Trash2 size={15}/>Очистить данные</Button>}<Modal open={open} onClose={() => !busy && setOpen(false)} title="Очистить сценарий «С нуля»?" description="Продукты, команды, доски, задачи, Flow и история этого сценария будут удалены."><div className="stack"><p className="subtext">Настройка начнётся с создания Product. Сценарий с демонстрационными данными сохранится.</p><div className="actions"><Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Отмена</Button><Button variant="destructive" disabled={busy} onClick={async () => {if (await reset()) setOpen(false);}}><Trash2 size={15}/>Очистить и начать заново</Button></div></div></Modal></>;
}

export type SetupStep = {title:string;text:string;done:boolean;role:string;screen:string;tab:string;button:string;ref?:string;actorId?:string};

export const JOURNEY_STAGES = [
 ['Продукт','Product Owner','Название, описание и цели продукта'],
 ['Команда и участники','Product Owner','Ответственность команды и персональные разрешения'],
 ['Платформа исполнения','Platform Engineer','HG SDLC, Maestro или AI Conductor'],
 ['Доступы и инфраструктура','Platform Engineer','Ресурсы только выбранной платформы; проверка предварительной схемы'],
 ['Доска и 8 задач','Product Engineer','Backlog для Dependency Update'],
 ['Пакет политик','Regulator','Правила ИБ, навыки и проверка вторым регулятором'],
 ['Workflow и 2 запуска','Product Engineer','Автоматизация → Workflow → Supervised → принять результат'],
 ['Benchmarks и судья','Product Engineer','Успешные задачи → тестовый набор → судья → сравнительный отчёт'],
 ['Выпуск автономности','Product Engineer / Product Owner','Снимок → UAT → принятие риска → выпуск'],
 ['Наблюдение','Product Engineer','Остальные задачи выполняются автономно; смотрим результаты'],
 ['Обновление политик','Regulator','Новая версия пакета и независимое подтверждение'],
 ['Перевыпуск','Product Engineer / Product Owner','Новый Workflow, проверки и новая версия автономности'],
];
export function JourneyDiagram(){return <><div className="journey-diagram" aria-label="Последовательность демосценария">{JOURNEY_STAGES.map(([title,role,text],i)=><div className="journey-node" key={title}><span className="journey-index">{String(i+1).padStart(2,'0')}</span><h3>{title}</h3><p>{text}</p><small>{role}</small></div>)}</div><div className="journey-roles" aria-label="Роли платформы">{[['Regulator','Политики, сегментация, проверка другим регулятором'],['Product Owner','Продукт, команда и принятие риска'],['Product Engineer','Задачи, Workflow, знания, бенчмарки и наблюдение'],['Platform Engineer','Выбор платформы, ресурсы, доступы и инфраструктура']].map(([name,text])=><div key={name}><strong>{name}</strong><span>{text}</span></div>)}</div></>}

export function getSetupSteps(state:State,team:Team,product:Product):SetupStep[]{
 const members=state.people.filter(person=>team.people.includes(person.id));
 const boards=state.boards.filter(item=>item.teamId===team.id&&item.productId===product.id);
 const tasks=state.tasks.filter(item=>item.teamId===team.id&&item.productId===product.id);
 const caps=state.capabilities.filter(item=>item.productId===product.id&&item.teamId===team.id&&!item.legacyDuplicateOf);
 const cap=caps.find(item=>item.tag==='dep-update')||caps[0];
 const runs=state.runs.filter(item=>item.teamId===team.id&&item.productId===product.id&&!item.uat&&item.capabilityId===cap?.id);
 const accepted=new Set(runs.filter(item=>item.status==='accepted'&&item.mode==='supervised').map(item=>item.taskId));
 const pending=runs.find(item=>['input_required','approval_required','takeover'].includes(item.status));
 const segments=team.bindings.filter(item=>item.type==='Repository').map(item=>item.segment);
 const packages=state.policies.filter(item=>item.createdBy&&item.productId===product.id&&segments.includes(item.segment));
 const authored=packages[0];
 const author=state.people.find(person=>person.id===authored?.createdBy);
 const checker=state.people.find(person=>person.role==='Regulator'&&person.id!==authored?.createdBy&&person.directions?.includes('Information Security'));
 const suites=state.suites.filter(item=>item.teamId===team.id&&item.productId===product.id&&item.tag===cap?.tag);
 const reports=state.benchmarks.filter(item=>item.capabilityId===cap?.id);
 const production=cap?.releases.filter(item=>item.stage==='production')||[];
 const observed=state.runs.some(item=>item.teamId===team.id&&item.mode==='production'&&!!item.completedAt);
 return [
  {title:'Добавьте участников',text:'Назначьте Platform Engineer и Product Engineer. Инженеру продукта нужно разрешение capability.review.',done:['Platform Engineer','Product Engineer'].every(role=>members.some(person=>person.role===role))&&members.some(person=>person.role==='Product Engineer'&&person.assignments.includes('capability.review')),role:'Product Owner',screen:'settings',tab:'people',button:'Добавить участников'},
  {title:'Выберите платформу исполнения',text:'Сначала выбирается платформа. Только затем настраиваются доступы её компонентов.',done:!!team.automation,role:'Platform Engineer',screen:'environment',tab:'automation',button:'Выбрать платформу'},
  {title:'Подключите ресурсы платформы',text:'Git, Task Tracker и Jenkins CI с явными Permissions и Scope.',done:!!team.automation&&['Repository','Task Tracker','CI'].every(type=>team.bindings.some(item=>item.type===type&&item.status==='connected'&&item.platform===team.automation)),role:'Platform Engineer',screen:'environment',tab:'resources',button:'Настроить доступы'},
  {title:'Настройте инфраструктуру',text:'Проверьте предварительную схему, параметры среды и создайте инфраструктуру.',done:team.environment.status==='ready',role:'Platform Engineer',screen:'environment',tab:'sandbox',button:'Настроить окружение'},
  {title:'Создайте доску задач',text:'Создайте доску вашей команды.',done:boards.length>0,role:'Product Engineer',screen:'tasks',tab:'',button:'Создать доску'},
  {title:'Добавьте 8 задач Dependency Update',text:'Добавить задачи → Обновление зависимостей. Две задачи пройдут Supervised, остальные — автономно.',done:tasks.some(item=>item.tag==='dep-update'),role:'Product Engineer',screen:'tasks',ref:boards[0]?.id,tab:'',button:'Добавить задачи'},
  {title:'Создайте регуляторный пакет',text:'Переключитесь на регулятора ИБ. Создайте текстовые правила, выберите навыки и сохраните черновик.',done:packages.length>0,role:'Regulator',screen:'regulation',tab:'',button:'Создать пакет политик'},
  {title:'Подтвердите политики направления',text:'Ответственный регулятор переводит пакет в статус «Действует». Решение и версия сохраняются в аудите.',done:packages.some(item=>item.status==='Current'&&item.approvedBy),role:'Regulator',actorId:checker?.id||author?.id,screen:'regulation',ref:authored?`${authored.id}@${authored.version}`:'',tab:'',button:'Подтвердить пакет'},
  {title:'Создайте Workflow из Автоматизации',text:'Выберите Dependency Update или соберите сценарий. Проверьте Regulatory Plan, Evidence и доступы. Сохранение изменений создаёт новую версию.',done:!!cap,role:'Product Engineer',screen:'automation',tab:'',button:'Открыть Автоматизацию'},
  {title:'Выполните 2 Supervised запуска',text:'Выберите задачи из backlog, пройдите Input / Approval. В Implementation откройте Knowledge MCP и журнал доставки знаний.',done:accepted.size>=2,role:'Product Engineer',screen:pending?'run':'capability',ref:pending?.id||cap?.id,tab:'configuration',button:pending?'Завершить запуск':'Запустить следующую задачу'},
  {title:'Создайте тестовый набор и судью',text:'Выберите успешно решённые Workflow задачи. На следующем шаге выберите версию судьи или сохраните нового.',done:suites.length>0,role:'Product Engineer',screen:'benchmark',ref:cap?.id,tab:'lab',button:'Перейти к Benchmarks'},
  {title:'Прогоните сравнительную оценку',text:'Повторите задачи на выбранной версии Workflow. Судья сравнит результаты с эталонами по полноте, корректности, тестам и критическим проблемам.',done:reports.some(item=>item.passed===item.total&&item.total>0),role:'Product Engineer',screen:'benchmark',ref:cap?.id,tab:'lab',button:'Запустить оценку'},
  {title:'Выпустите автономность',text:'Зафиксируйте снимок, выполните UAT, получите принятие риска Product Owner и ИБ-допуск Безника. После выпуска PROD автоматически эмулирует доступные задачи.',done:production.length>0,role:'Product Engineer',screen:'capability',ref:cap?.id,tab:'releases',button:'К автономному выпуску'},
  {title:'Проверьте PROD Monitoring',text:'Автоматическая эмуляция после выпуска уже создала статистику. Проверьте результаты, знания, политики и метрики.',done:observed,role:'Product Engineer',screen:'capability',ref:cap?.id,tab:'monitoring',button:'Открыть наблюдение'},
  {title:'Обновите политики',text:'Создайте новую версию своего пакета и зафиксируйте её статус; прежнюю версию можно вывести из эксплуатации.',done:packages.some(item=>item.version>1&&item.status==='Current'&&item.approvedBy),role:'Regulator',screen:'regulation',ref:authored?`${authored.id}@${authored.version}`:'',tab:'',button:'Обновить пакет'},
  {title:'Перевыпустите автономность',text:'Создайте нового кандидата, подключите новую политику, повторите Supervised / Benchmarks, UAT и решение о риске. Действующий снимок не изменяется.',done:production.length>=2,role:'Product Engineer',screen:'capability',ref:cap?.id,tab:'releases',button:'Подготовить перевыпуск'},
 ];
}
function actorForStep(state:State,team:Team,step:SetupStep){return state.people.find(person=>step.actorId?person.id===step.actorId:person.role===step.role&&(step.role==='Regulator'?person.directions?.includes('Information Security'):team.people.includes(person.id)));}
async function followStep(state:State,team:Team,actor:Person,step:SetupStep,act:(action:string,payload?:Item)=>Promise<any>,go:(screen:string,ref?:string,tab?:string)=>void){
 const target=actorForStep(state,team,step);if(!target)return;
 if(actor.id!==target.id&&!(await act('select_actor',{actorId:target.id}))?.ok)return;
 go(step.screen,step.ref||'',step.tab);
}
export function SetupGuide({onClose}:{onClose:()=>void}){
 const {state,team,product,actor,screen,act,go,busy}=useKontur();const steps=getSetupSteps(state,team,product),index=steps.findIndex(step=>!step.done);if(index<0)return null;const step=steps[index],target=actorForStep(state,team,step),here=screen===step.screen&&actor.id===target?.id;
 return <aside className="setup-route-guide" aria-label="Гид по первоначальной настройке"><span className="setup-route-guide-mark">{index+3}</span><div className="setup-route-guide-copy"><span>СЛЕДУЮЩИЙ ШАГ</span><strong>{step.title}</strong><p>{step.text} <small>{step.role}</small></p></div><div className="setup-route-guide-actions"><Button variant="ghost" size="sm" onClick={()=>go('home')}><Home size={14}/>К плану на главной</Button>{!here?<Button size="sm" disabled={busy||!target} onClick={()=>followStep(state,team,actor,step,act,go)}>{target&&actor.id!==target.id?'Переключить роль и продолжить':'Перейти к шагу'}<ArrowRight size={14}/></Button>:<span className="setup-route-guide-here">Вы на нужном экране</span>}</div><button className="setup-route-guide-close" onClick={onClose} aria-label="Скрыть весь гид"><X size={16}/></button></aside>;
}
export function JourneyOverview(){const {go}=useKontur();return <div className="page"><p className="eyebrow">00 · НАСТРОЙКА С НУЛЯ</p><h1>От продукта к доверенной автономности</h1><p className="subtext mb-5">Полный демонстрационный маршрут. Роли переключаются явно; результаты каждого шага сохраняются.</p><JourneyDiagram/><div className="actions"><Button onClick={()=>go('home')}>Продолжить по плану<ArrowRight size={16}/></Button></div><SetupChecklist/></div>}
export function isSetupComplete(state:State,team:Team,product:Product){return getSetupSteps(state,team,product).every(step=>step.done);}
export function SetupChecklist(){
 const {state,team,product,actor,act,go,busy}=useKontur();const steps=getSetupSteps(state,team,product),done=steps.filter(step=>step.done).length,first=steps.findIndex(step=>!step.done);
 if(first<0)return null;
 return <section className="setup-checklist section-gap"><header><div><p className="eyebrow">СЦЕНАРИЙ / С НУЛЯ</p><h2>Подготовьте команду к первому запуску</h2><p>Затем пройдите путь до выпуска и обновления автономности.</p></div><Button variant="outline" onClick={()=>go('journey')}>00 · Сценарий и роли</Button></header><div className="setup-progress"><span style={{width:`${done/steps.length*100}%`}}/></div><div>{steps.map((step,index)=><div className={`setup-check-row ${step.done?'done':first===index?'current':'waiting'}`} key={step.title}><span className="setup-number">{step.done?<Check size={16}/>:index+3}</span><div className="setup-check-copy"><h3>{step.title}</h3><p>{step.text}</p><small>{step.role}</small></div>{step.done?<span className="setup-done"><Check size={16}/>Готово</span>:first===index?<Button variant="outline" size="sm" disabled={busy||!actorForStep(state,team,step)} onClick={()=>followStep(state,team,actor,step,act,go)}>{step.button}</Button>:<span className="setup-waiting">После предыдущего шага</span>}</div>)}</div></section>;
}

export function ScenarioScreen({busy, choose, onBack}: {busy: boolean; choose: (scenario: 'demo' | 'empty') => void; onBack?: () => void}) {
  return <div className="entry-shell">
    <aside className="entry-aside"><div className="brand"><Brand/></div><div className="entry-aside-copy"><span className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</span><h2>Выберите сценарий работы</h2><p>Демонстрация возможностей или последовательная настройка своей команды.</p></div><div className="entry-aside-foot"><ShieldCheck size={17}/><span>Локальное приложение<br/>React + Node.js</span></div></aside>
    <main className="entry-main"><header className="entry-topbar"><span>Командная среда <i>/</i> <strong>Сценарии</strong></span>{onBack && <Button variant="ghost" onClick={onBack}>Вернуться в пространство</Button>}</header><div className="entry-content">
      <p className="eyebrow">КОНТУР / НАЧАЛО РАБОТЫ</p><h1>Как начнём?</h1><p className="entry-description">Оба сценария доступны в одном приложении. Данные и прогресс каждого сохраняются отдельно.</p>
      <div className="scenario-grid">
        <section className="scenario-card"><div className="scenario-symbol"><Database size={26}/></div><Pill tone="green">Данные готовы</Pill><h2>С демонстрационными данными</h2><p>Продукт «Аккредитив», команды Trade Finance и LC Retail, задачи, знания, политики и история запусков.</p><ul><li><Check size={15}/>Связанный Context Supply Chain</li><li><Check size={15}/>Input, Approval, Rework и Takeover</li><li><Check size={15}/>Benchmarks, Releases и Monitoring</li></ul><Button disabled={busy} onClick={() => choose('demo')} data-scenario="demo">Открыть с данными</Button></section>
        <section className="scenario-card"><div className="scenario-symbol outline"><Plus size={28}/></div><Pill>Пошаговая настройка</Pill><h2>С нуля</h2><p>Создайте продукт и команду, выберите платформу, настройте доступы и пройдите путь до выпуска автономности.</p><ul><li><Check size={15}/>Без готовых продуктов, задач и запусков</li><li><Check size={15}/>Общий каталог и policies доступны</li><li><Check size={15}/>Продолжение с сохранённого шага</li></ul><Button variant="outline" disabled={busy} onClick={() => choose('empty')} data-scenario="empty">Открыть настройку с нуля</Button></section>
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
  const [showIntro,setShowIntro]=useState(false);
  const step = !state.setupIntroSeen||showIntro ? 0 : product ? 2 : 1;
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
    <aside className="entry-aside"><button className="brand" onClick={onScenario}><Brand/></button><div className="bootstrap-steps"><p className="eyebrow">НАСТРОЙКА С НУЛЯ</p>{[{name: 'Сценарий и роли', icon: Workflow},{name: 'Создать продукт', icon: Building2}, {name: 'Создать Team', icon: Users}, {name: 'Участники', icon: Users}, {name: 'Платформа и ресурсы', icon: Layers}, {name: 'Инфраструктура и доска', icon: Layers}, {name: 'Политики и Workflow', icon: ShieldCheck}, {name: 'Проверка и автономность', icon: Workflow}].map((item, index) => <div className={`bootstrap-step ${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`} key={item.name} onClick={()=>index===0&&setShowIntro(true)} role={index===0?'button':undefined} tabIndex={index===0?0:undefined} onKeyDown={event=>{if(index===0&&['Enter',' '].includes(event.key))setShowIntro(true)}}><span>{index < step ? <Check size={15}/> : `0${index}`}</span><div><item.icon size={16}/>{item.name}</div></div>)}</div><div className="entry-aside-foot"><ShieldCheck size={17}/><span>Настройка сохраняется<br/>после каждого действия</span></div></aside>
    <main className="entry-main"><header className="entry-topbar"><span>Командная среда <i>/</i> <strong>Настройка</strong></span><div className="entry-tools"><span className="scenario-indicator" aria-label="Текущий режим данных">С нуля</span><Popover.Root><Popover.Trigger asChild><button type="button" className="icon-btn workspace-menu-trigger" aria-label="Действия рабочего пространства"><MoreHorizontal size={19}/></button></Popover.Trigger><Popover.Portal><Popover.Content align="end" sideOffset={10} collisionPadding={12} className="workspace-menu" aria-label="Меню рабочего пространства"><Popover.Close asChild><button type="button" className="workspace-menu-item" onClick={onScenario}><RefreshCw size={15}/><span>Сменить сценарий данных</span></button></Popover.Close>{onReset && <ResetSetupButton menu busy={busy} reset={onReset}/>}</Popover.Content></Popover.Portal></Popover.Root><Pick label="Демонстрационная роль" value={actor.id} onChange={actorId => {void act('select_actor', {actorId});}} options={state.people.map(person => ({value: person.id, label: `${person.name} · ${person.role}`}))}/></div></header>
      <div className="entry-content bootstrap-content">{step===0?<><p className="eyebrow">ШАГ 00 · СЦЕНАРИЙ И РОЛИ</p><h1>Как мы дойдём до автономности</h1><p className="entry-description">Dependency Update: настройка, два Supervised запуска, бенчмарк, выпуск, наблюдение и перевыпуск после изменения политик.</p><JourneyDiagram/><div className="actions"><Button disabled={busy||!allowed} onClick={async()=>{if(!state.setupIntroSeen&&!(await act('complete_setup_intro',{}))?.ok)return;setShowIntro(false);}}>Начать · создание продукта<ArrowRight size={16}/></Button>{!allowed&&owner&&<Button variant="outline" onClick={()=>act('select_actor',{actorId:owner.id})}>Переключиться на Product Owner</Button>}</div></>:<><p className="eyebrow">ШАГ {step} · PRODUCT OWNER</p><h1>{product ? 'Создайте команду продукта' : 'Начните со своего продукта'}</h1><p className="entry-description">{product ? 'Команда получает Team Space сразу. Среду исполнения вы подключите на следующем этапе.' : 'Задайте продукт, за который отвечает команда. Его знания, задачи и результаты будут связаны с этим контекстом.'}</p>
        <div className="bootstrap-grid"><Card title={product ? 'Команда и ответственность' : 'Product'}><form className="stack" onSubmit={submit}>
          {product ? <><Field label="Название Team"><Input value={team.name} onChange={event => setTeam({...team, name: event.target.value})} required disabled={!allowed} placeholder="Название команды"/></Field><Field label="Ответственность команды" hint="Области ответственности команды. По одной на строку."><Textarea rows={4} value={team.scope} onChange={event => setTeam({...team, scope: event.target.value})} required disabled={!allowed}/></Field></> : <><Field label="Название Product"><Input value={form.name} onChange={event => setForm({...form, name: event.target.value})} required disabled={!allowed} placeholder="Название продукта"/></Field><Field label="Описание"><Textarea rows={3} value={form.description} onChange={event => setForm({...form, description: event.target.value})} required disabled={!allowed}/></Field><Field label="Цели"><Textarea rows={2} value={form.goals} onChange={event => setForm({...form, goals: event.target.value})} disabled={!allowed}/></Field></>}
          {!allowed && <Notice title="Требуется Product Owner" tone="blue">{owner && <Button type="button" variant="outline" disabled={busy} onClick={() => act('select_actor', {actorId: owner.id})}>Переключиться на владельца продукта</Button>}</Notice>}
          <div className="actions"><Button type="submit" disabled={!allowed || busy}><Plus size={16}/>{product ? 'Создать команду и пространство' : 'Создать продукт'}</Button></div>
        </form></Card><div className="stack">
          {product ? <Card title="Product создан"><div className="row"><span className="scenario-symbol small"><Building2 size={21}/></span><h2>{product.name}</h2></div><p className="subtext mt-4">{product.description}</p><div className="divider"/><Button variant="ghost" onClick={() => go('settings', '', 'product')}>Настройки продукта</Button></Card> : <Card title="Чистое рабочее пространство"><div className="setup-empty-stat"><strong>0</strong><span>продуктов, команд и запусков</span></div><p className="subtext">Общий каталог и демонстрационные профили доступны для настройки. Пакет политик создадим в регуляторном шаге.</p></Card>}
          <div className="bootstrap-note"><ShieldCheck size={20}/><div><h3>Права сохраняются на каждом шаге</h3><p>Product Owner определяет продукт и команду. Platform Engineer настраивает ресурсы и среду. Product Engineer готовит Capability и запускает задачи.</p></div></div>
        </div></div>
      </>}
      </div>
    </main>
  </div>;
}
