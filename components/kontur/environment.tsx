'use client';
import {useEffect, useState} from 'react';
import {ArrowLeft, ArrowRight, Bot, Check, GitBranch, Loader2, Lock, Plus, Server, Workflow} from 'lucide-react';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Progress} from '@/components/ui/progress';
import {RUNTIME_PLATFORMS, runtimeResources, runtimeVersions, PROVISION_STEPS, REPOSITORIES, type Item, type Runtime} from '@/lib/domain';
import {useKontur} from './context';
import SandboxPreview, {bindingPermissions, resourceTypeLabel} from './sandbox-preview';
import {Button, Input, Card, PageHead, Pill, Status, Pick, Modal, Field, KV, Notice, Toggle, Table, TableHeader, TableHead, TableBody, TableRow, TableCell} from './ui';

const RESOURCE_TYPES = ['Repository', 'Task Tracker', 'CI'];
const TRACKER_PROJECTS = [{value: 'LC-TRADE', label: 'Аккредитив · Trade Finance (LC-TRADE)'}, {value: 'LC-RETAIL', label: 'Аккредитив · Retail (LC-RETAIL)'}, {value: 'PAYMENTS', label: 'Платежи (PAYMENTS)'}];
const CI_SCOPES = ['kopilka/build-and-test', 'growth/quality-checks', 'payments/build-and-test'];
const GIT_PERMISSIONS = [{value: 'read', label: 'Чтение (read)'}, {value: 'write', label: 'Запись (write)'}, {value: 'admin', label: 'Администрирование (admin)'}, {value: 'create_pr', label: 'Создание pull request (create_pr)'}];
const ENV_FIELDS = [{key: 'isolation', label: 'Isolation profile'}, {key: 'network', label: 'Network zone'}, {key: 'cpu', label: 'CPU', number: true}, {key: 'ram', label: 'RAM · GB', number: true}, {key: 'disk', label: 'Disk · GB', number: true}, {key: 'ttl', label: 'TTL · hours', number: true}, {key: 'parallel', label: 'Максимум параллельных запусков', number: true}, {key: 'quota', label: 'Quota', number: true}, {key: 'modelGateway', label: 'Model Gateway'}, {key: 'runtimeVersion', label: 'Runtime version'}, {key: 'internet', label: 'Network / internet constraints'}, {key: 'uatBindings', label: 'UAT environment bindings'}];
const SANDBOX_FIELDS = [{key: 'cpu', label: 'CPU', number: true}, {key: 'ram', label: 'RAM · GB', number: true}, {key: 'disk', label: 'Disk · GB', number: true}];
const WIZARD_STEPS = [{key:'automation',title:'Платформа исполнения',description:'Оркестратор и его компоненты'},{key:'resources',title:'Доступы к ресурсам',description:'Только для выбранной платформы'},{key:'sandbox',title:'Инфраструктура',description:'Схема и настройка окружения'}];
const PROMOTION_STEPS = ['Validating changes','Reserving additional resources','Updating orchestrator','Applying environment settings','Verifying deployment'];

function newBinding(type: string, system: string): Item {
  if (type === 'Repository') return {type, name: REPOSITORIES[0].name, system, permissions: ['read', 'write', 'create_pr']};
  if (type === 'Task Tracker') return {type, name: 'Jira', scope: TRACKER_PROJECTS[0].value};
  return {type: 'CI', name: 'Jenkins CI', scope: CI_SCOPES[0]};
}

export default function Environment() {
  const {team, product, go, tab, act, can, busy} = useKontur();
  const [form, setForm] = useState<Item>({...team.environment, automation: team.automation || 'HG SDLC'});
  const [binding, setBinding] = useState<Item | null>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [deploymentMode, setDeploymentMode] = useState<'create'|'promote'>('create');
  const [provisionStep, setProvisionStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [showReadyNotice, setShowReadyNotice] = useState(false);
  const enabled = can('Platform Engineer');
  const resources = team.bindings.filter(item => RESOURCE_TYPES.includes(item.type));
  const resourcesReady = !!team.automation && runtimeResources(team.automation).every(type => resources.some(item => item.type === type && item.status === 'connected' && item.platform===team.automation));
  const furthestStep = !team.automation ? 0 : !resourcesReady ? 1 : 2;
  const [entryStep, setEntryStep] = useState(furthestStep);
  const requestedStep = WIZARD_STEPS.findIndex(item => item.key === tab || item.key === 'sandbox' && tab === 'finish' || item.key === 'automation' && tab === 'platform');
  const activeStep = Math.min(requestedStep < 0 ? entryStep : requestedStep, furthestStep);
  const provisioned = team.environment.status === 'ready';
  const ready = resourcesReady && team.environment.status === 'ready' && form.automation === team.automation && ENV_FIELDS.every(item => form[item.key] === (team.environment as unknown as Item)[item.key]);
  const deploymentSteps = deploymentMode === 'promote' ? PROMOTION_STEPS : PROVISION_STEPS;
  const nextResource = RESOURCE_TYPES.find(type => !resources.some(item => item.type === type && item.status === 'connected')) || 'Repository';

  useEffect(() => {
    setForm({...team.environment, automation: team.automation || 'HG SDLC'});
    setEntryStep(furthestStep);
    setCreateDialog(false); setBinding(null); setProvisionStep(-1); setShowReadyNotice(false);
  }, [team.id]);

  useEffect(() => {
    if (!showReadyNotice) return;
    const timeout = window.setTimeout(() => setShowReadyNotice(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [showReadyNotice]);

  function field(key: string, value: any) {setForm(current => ({...current, [key]: value}));}
  function selectAutomation(automation: string) {
    const versions = runtimeVersions(automation as Runtime);
    setForm(current => ({...current, automation, runtimeVersion: versions.includes(current.runtimeVersion) ? current.runtimeVersion : versions[0]}));
  }
  async function save() {return await act('save_environment', form);}
  async function provision() {
    if (!enabled || busy || running || provisioned || !resourcesReady) return;
    setDeploymentMode('create');
    setCreateDialog(true); setRunning(true); setProvisionStep(0);
    const saved = await save();
    if (!saved?.ok) {setRunning(false); setProvisionStep(-1); setCreateDialog(false); return;}
    for (let index = 0; index < PROVISION_STEPS.length; index++) {
      setProvisionStep(index);
      await new Promise(resolve => setTimeout(resolve, 190));
    }
    const result = await act('provision', {topologyConfirmed: true});
    setProvisionStep(result?.ok ? PROVISION_STEPS.length : -1);
    if (result?.ok) {
      setShowReadyNotice(true);
    }
    setRunning(false);
  }
  async function promote() {
    if (!enabled || busy || running || !provisioned || ready || !resourcesReady) return;
    setDeploymentMode('promote');
    setCreateDialog(true); setRunning(true); setProvisionStep(0);
    for (let index = 0; index < PROMOTION_STEPS.length; index++) {
      setProvisionStep(index);
      await new Promise(resolve => setTimeout(resolve, 190));
    }
    const result = await act('promote_environment', form);
    setProvisionStep(result?.ok ? PROMOTION_STEPS.length : -1);
    if (result?.ok) setShowReadyNotice(true);
    setRunning(false);
  }
  function permission(value: string, checked: boolean) {
    if (!binding) return;
    let permissions = bindingPermissions(binding);
    permissions = checked ? [...new Set([...permissions, value])] : permissions.filter(item => item !== value);
    if (value === 'admin' && checked) permissions = [...new Set([...permissions, 'read', 'write', 'create_pr'])];
    if (!checked && ['read', 'write', 'create_pr'].includes(value)) permissions = permissions.filter(item => item !== 'admin');
    setBinding({...binding, permissions});
  }

  return <div className="page environment-wizard">
    <PageHead title={provisioned ? 'Рабочее окружение' : 'Setup environment'} description={provisioned ? `${product.name} / ${team.name}` : `${product.name} / ${team.name} · Platform Engineer`} actions={<Status value={team.environment.status}/>}/>
    {!provisioned && <nav aria-label="Шаги настройки Environment" className="environment-wizard-nav">
      <ol>{WIZARD_STEPS.map((item, index) => {
        const completed = index === 0 ? !!team.automation : index === 1 ? resourcesReady : ready;
        return <li key={item.key} className={`${activeStep === index ? 'active' : ''} ${completed ? 'complete' : ''}`}>
          <button type="button" onClick={() => go('environment', '', item.key)} disabled={index > furthestStep || busy || running} aria-current={activeStep === index ? 'step' : undefined}>
            <span className="environment-step-number">{completed && activeStep !== index ? <Check size={17}/> : index + 1}</span><span><strong>{item.title}</strong><small>{item.description}</small></span>
          </button>
        </li>;
      })}</ol>
    </nav>}
    {!provisioned && !enabled && <Notice tone="blue" title="Настройку выполняет Platform Engineer">Параметры доступны для просмотра. Для подключения ресурсов и Provisioning выберите Platform Engineer команды.</Notice>}

    {!provisioned && activeStep === 1 && <section className="environment-wizard-stage" aria-label="Шаг 2 · Resources">
      <div className="environment-stage-head"><div><p className="eyebrow">ШАГ 2 / 3</p><h2>Подключите ресурсы</h2><p className="subtext">Ресурсы компонентов {team.automation}: Git-репозиторий, Task Tracker и Jenkins CI.</p></div><Button onClick={() => setBinding(newBinding(nextResource, product.name))} disabled={!enabled || busy}><Plus size={16}/>{resources.length ? 'Подключить ресурс' : 'Подключить ресурсы'}</Button></div>
      <div className="environment-resource-progress">{RESOURCE_TYPES.map(type => <span key={type} className={resources.some(item => item.type === type && item.status === 'connected') ? 'connected' : ''}>{resources.some(item => item.type === type && item.status === 'connected') ? <Check size={15}/> : <span className="environment-resource-dot"/>}{resourceTypeLabel(type)}</span>)}</div>
      <Card body={false}>
        {resources.length ? <Table className="data-table environment-resources-table"><TableHeader><TableRow><TableHead>Ресурс</TableHead><TableHead>Permissions / Scope</TableHead><TableHead>Статус</TableHead><TableHead/></TableRow></TableHeader><TableBody>{resources.map(item => <TableRow key={item.id}>
          <TableCell><div className="row"><span className="icon-tile">{item.type === 'Repository' ? <GitBranch size={20}/> : item.type === 'CI' ? <Server size={20}/> : <Workflow size={20}/>}</span><div><p className="task-title">{item.name}</p><p className="task-sub">{resourceTypeLabel(item.type)}</p></div></div></TableCell>
          <TableCell>{item.type === 'Repository' ? <div className="environment-permission-chips">{GIT_PERMISSIONS.filter(option => bindingPermissions(item).includes(option.value)).map(option => <Pill key={option.value}>{option.label}</Pill>)}</div> : <div><p className="task-sub">{item.type === 'Task Tracker' ? 'Проект в Task Tracker' : 'Pipeline / Job'}</p><span className="mono">{(item as unknown as Item).scope || item.name}</span></div>}</TableCell>
          <TableCell><Pill tone={item.status==='connected'&&item.platform===team.automation?'green':'amber'}>{item.status==='connected'&&item.platform===team.automation?`${item.platform} · подключён`:'Нужно переподключить'}</Pill></TableCell><TableCell><Button variant="ghost" size="sm" disabled={!enabled || busy} onClick={() => setBinding({...item, ...(item.type === 'Repository' ? {system: product.id === 'accreditive' ? item.system : product.name, permissions: bindingPermissions(item)} : {scope: (item as unknown as Item).scope || item.name})})}>Настроить</Button></TableCell>
        </TableRow>)}</TableBody></Table> : <div className="environment-resources-empty"><span className="icon-tile"><GitBranch size={23}/></span><h3>Ресурсы ещё не подключены</h3><p>Добавьте три подключения. Для каждого сохраните Permissions или Scope.</p></div>}
      </Card>
      <div className="environment-wizard-footer"><p>{resourcesReady ? 'Доступы подключены к выбранной платформе. Далее — параметры инфраструктуры.' : 'Для продолжения подключите Git-репозиторий, Task Tracker и Jenkins CI.'}</p><Button disabled={!enabled || busy || !resourcesReady} onClick={() => go('environment', '', 'sandbox')}>Далее · Инфраструктура<ArrowRight size={16}/></Button></div>
    </section>}

    {!provisioned && activeStep === 0 && <section className="environment-wizard-stage" aria-label="Шаг 1 · Workflow Platform">
      <div className="environment-stage-head"><div><p className="eyebrow">ШАГ 1 / 3</p><h2>Выберите платформу исполнения</h2><p className="subtext">Платформа управляет выполнением Flow в инфраструктуре команды.</p></div></div>
      <RadioGroup value={form.automation} onValueChange={selectAutomation} className="runtime-platform-grid" disabled={!enabled || busy}>{RUNTIME_PLATFORMS.map(platform => <label key={platform.id} className={`provider-card ${form.automation === platform.id ? 'selected' : ''} ${!platform.available?'unavailable':''}`}>
        <div className="row between"><span className="icon-tile">{platform.available?<Workflow size={25}/>:<Bot size={25}/>}</span><RadioGroupItem value={platform.id} aria-label={platform.id} disabled={!enabled||busy||!platform.available}/></div><h2>{platform.id}</h2><Pill tone={platform.available?'blue':''}>{platform.mode}</Pill>{!platform.available&&<Pill>Пока недоступна</Pill>}
        <p className="subtext mt-4">{platform.available?'Внешний оркестратор управляет шагами Workflow и вызовами агента.':'Manager-agent выбирает действия и передачи управления.'}</p><div className="provider-checks">{platform.components.map(value=><span key={value}><Check size={14}/>{value}</span>)}</div>
        {platform.available&&<p className="runtime-resources">После выбора: Git · Task Tracker · Jenkins CI. Доступы привязываются к этой платформе.</p>}
      </label>)}</RadioGroup>
      <div className="environment-wizard-footer"><p>Настройку выполняет только Platform Engineer.</p><Button onClick={async () => {const result = await save(); if (result?.ok) go('environment', '', 'resources');}} disabled={!enabled || busy || !RUNTIME_PLATFORMS.some(item=>item.id===form.automation&&item.available)}>Далее · Доступы к ресурсам<ArrowRight size={16}/></Button></div>
    </section>}

    {(provisioned || activeStep === 2) && <section className="environment-wizard-stage" aria-label={provisioned ? 'Рабочее окружение' : 'Шаг 3 · Finish'}>
      {!provisioned && <div className="environment-stage-head"><div><p className="eyebrow">ШАГ 3 / 3</p><h2>Инфраструктура</h2><p className="subtext">Проверьте инфраструктуру, сохраните конфигурацию и выполните Provisioning.</p></div></div>}
      {showReadyNotice && <Notice tone="green" title={deploymentMode==='promote'?'Environment обновлён':'Environment готов'}>{deploymentMode==='promote'?'Новая конфигурация ресурсов и оркестратора применена.':'Следующий шаг — на главной создать доску задач и добавить задачи команды.'}</Notice>}
      <div className="sandbox-config-layout"><div className="stack"><Card title="Конфигурация инфраструктуры"><div className="form-grid">{SANDBOX_FIELDS.map(item => <Field key={item.key} label={item.label}><Input value={form[item.key] ?? ''} type="number" min={1} onChange={event => field(item.key, Number(event.target.value))} disabled={!enabled || busy || running}/></Field>)}</div></Card><Card title="Оркестратор"><div className="form-grid"><Field label="Название оркестратора"><Input value={form.automation ?? ''} disabled/></Field><Field label="Версия оркестратора">{runtimeVersions(form.automation as Runtime).length > 1 ? <Pick label="Версия оркестратора" value={form.runtimeVersion} onChange={value => field('runtimeVersion', value)} options={runtimeVersions(form.automation as Runtime)} disabled={!enabled || busy || running}/> : <Input value={form.runtimeVersion ?? ''} disabled/>}</Field><Field label="Максимум параллельных запусков"><Input value={form.parallel ?? ''} type="number" min={1} onChange={event => field('parallel', Number(event.target.value))} disabled={!enabled || busy || running}/></Field></div></Card></div><div className="stack"><SandboxPreview team={team} form={form} confirmed={ready}/>{!provisioned && <Notice tone="blue" title="Проверьте конфигурацию">Предварительная схема показывает инфраструктуру, платформу и подключённые ресурсы. Provisioning создаёт среду в демонстрационном контуре.</Notice>}</div></div>
      <div className="environment-finish-actions">{provisioned?<Button data-action="promote" onClick={promote} disabled={!enabled || busy || running || ready}><Server size={16}/>{running&&deploymentMode==='promote'?'Промоут…':'Промоут'}</Button>:<><Button variant="outline" onClick={save} disabled={!enabled || busy || running}>Сохранить конфигурацию</Button><Button data-action="provision" onClick={provision} disabled={!enabled || busy || running}><Server size={16}/>{running ? 'Создание…' : 'Создать'}</Button></>}</div>
      {!provisioned && <div className="environment-wizard-footer"><Button variant="outline" onClick={() => go('environment', '', 'resources')} disabled={busy || running}><ArrowLeft size={16}/>Назад</Button><p>После Provisioning вернитесь на главную к созданию доски и задач.</p></div>}
    </section>}

    <Modal open={!!binding} onClose={() => !busy && setBinding(null)} title={binding?.id ? 'Настроить ресурс' : 'Подключить ресурс'} description="Демонстрационная интеграция · Platform Engineer" wide>{binding && <form onSubmit={async event => {event.preventDefault(); const result = await act('save_binding', binding); if (result?.ok) setBinding(null);}} className="stack">
      <div className="form-grid"><Field label="Тип ресурса"><Pick label="Тип ресурса" value={binding.type} onChange={value => setBinding({...newBinding(value, product.name), ...(value === binding.type && binding.id ? {id: binding.id} : {})})} options={RESOURCE_TYPES.map(type => ({value: type, label: resourceTypeLabel(type)}))} disabled={busy}/></Field>
        {binding.type === 'Repository' ? <Field label="Git-репозиторий"><Pick label="Git-репозиторий" value={binding.name} onChange={value => setBinding({...binding, name: value})} options={REPOSITORIES.map(item => item.name)} disabled={busy}/></Field> : binding.type === 'Task Tracker' ? <><Field label="Task Tracker"><Input value={binding.name} disabled/></Field><Field label="Проект в Task Tracker (Scope)"><Pick label="Проект в Task Tracker" value={binding.scope} onChange={value => setBinding({...binding, scope: value})} options={[...TRACKER_PROJECTS, ...(!TRACKER_PROJECTS.some(item => item.value === binding.scope) && binding.scope ? [{value: binding.scope, label: binding.scope}] : [])]} disabled={busy}/></Field></> : <><Field label="CI"><Input value={binding.name} disabled/></Field><Field label="Pipeline / Job (Scope)"><Pick label="Jenkins CI scope" value={binding.scope} onChange={value => setBinding({...binding, scope: value})} options={[...CI_SCOPES, ...(!CI_SCOPES.includes(binding.scope) && binding.scope ? [binding.scope] : [])]} disabled={busy}/></Field></>}
      </div>
      {binding.type === 'Repository' && <><Field label="System"><Input value={binding.system || product.name} onChange={event => setBinding({...binding, system: event.target.value})} required disabled={busy}/></Field><div className="environment-binding-permissions"><p className="eyebrow">Permissions</p><div className="grid-2">{GIT_PERMISSIONS.map(option => <Toggle key={option.value} label={option.label} checked={bindingPermissions(binding).includes(option.value)} onChange={checked => permission(option.value, checked)} disabled={busy}/>)}</div></div><div className="environment-binding-meta"><KV label="Segment"><span className="row"><Lock size={13}/>{REPOSITORIES.find(item => item.name === binding.name)?.segment}</span></KV></div></>}
      <div className="actions"><Button variant="outline" type="button" disabled={busy} onClick={() => setBinding(null)}>Отмена</Button><Button type="submit" disabled={busy || !enabled}>Сохранить биндинг</Button></div>
    </form>}</Modal>

    <Modal open={createDialog} onClose={() => !running && setCreateDialog(false)} title={deploymentMode==='promote'?'Промоут окружения':'Создание окружения'} description={`${product.name} / ${team.name} · ${form.automation} @${form.runtimeVersion}`}>
      {provisionStep >= 0 && <div className="stack"><Progress value={Math.min(100, provisionStep / deploymentSteps.length * 100)}/><div className="grid-2 gap-2">{deploymentSteps.map((item, index) => <div className={`row text-sm ${index === provisionStep ? 'text-[#628057]' : 'muted'}`} key={item}>{index < provisionStep ? <Check size={15} className="text-[#608149]"/> : index === provisionStep ? <Loader2 size={15} className="animate-spin"/> : <span className="w-[15px]"/>}{item}</div>)}</div></div>}
      <div className="actions"><Button disabled={running} onClick={() => setCreateDialog(false)}>{provisionStep === deploymentSteps.length ? 'Готово' : 'Закрыть'}</Button></div>
    </Modal>
  </div>;
}
