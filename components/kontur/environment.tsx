'use client';
import {useEffect, useState} from 'react';
import {ArrowLeft, ArrowRight, Bot, Check, FileCode2, GitBranch, KeyRound, Loader2, Server, ShieldCheck, Workflow} from 'lucide-react';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Progress} from '@/components/ui/progress';
import {ORCHESTRATOR_RESOURCE_REQUEST, RUNTIME_PLATFORMS, resourceRequestYaml, runtimeResources, runtimeVersions, PROVISION_STEPS, REPOSITORIES, type Item, type Runtime} from '@/lib/domain';
import {useKontur} from './context';
import SandboxPreview, {bindingPermissions, resourceTypeLabel} from './sandbox-preview';
import {Button, Input, Card, PageHead, Pill, Status, Pick, Modal, Field, Notice, Table, TableHeader, TableHead, TableBody, TableRow, TableCell} from './ui';

const RESOURCE_TYPES = ['Repository', 'Task Tracker', 'CI'];
const GIT_PERMISSIONS = [{value: 'read', label: 'Чтение (read)'}, {value: 'write', label: 'Запись (write)'}, {value: 'admin', label: 'Администрирование (admin)'}, {value: 'create_pr', label: 'Создание pull request (create_pr)'}];
const ENV_FIELDS = [{key: 'isolation', label: 'Isolation profile'}, {key: 'network', label: 'Network zone'}, {key: 'cpu', label: 'CPU', number: true}, {key: 'ram', label: 'RAM · GB', number: true}, {key: 'disk', label: 'Disk · GB', number: true}, {key: 'ttl', label: 'TTL · hours', number: true}, {key: 'parallel', label: 'Максимум параллельных запусков', number: true}, {key: 'quota', label: 'Quota', number: true}, {key: 'modelGateway', label: 'Model Gateway'}, {key: 'runtimeVersion', label: 'Runtime version'}, {key: 'internet', label: 'Network / internet constraints'}, {key: 'uatBindings', label: 'UAT environment bindings'}];
const SANDBOX_FIELDS = [{key: 'cpu', label: 'CPU', number: true}, {key: 'ram', label: 'RAM · GB', number: true}, {key: 'disk', label: 'Disk · GB', number: true}];
const WIZARD_STEPS = [{key:'automation',title:'Платформа исполнения',description:'Оркестратор и его компоненты'},{key:'resources',title:'Доступы к ресурсам',description:'Только для выбранной платформы'},{key:'sandbox',title:'Инфраструктура',description:'Схема и настройка окружения'}];
const PROMOTION_STEPS = ['Validating changes','Reserving additional resources','Updating orchestrator','Applying environment settings','Verifying deployment'];

export default function Environment() {
  const {team, product, go, tab, act, can, busy} = useKontur();
  const [form, setForm] = useState<Item>({...team.environment, automation: team.automation || 'HG SDLC'});
  const [requestOpen, setRequestOpen] = useState(false);
  const [resourceInputs, setResourceInputs] = useState({repository: team.bindings.find(item => item.type === 'Repository')?.name || REPOSITORIES[0].name, teamSpace: team.bindings.find(item => item.type === 'Task Tracker')?.scope || team.name, jenkinsToken: ''});
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

  useEffect(() => {
    setForm({...team.environment, automation: team.automation || 'HG SDLC'});
    setEntryStep(furthestStep);
    setResourceInputs({repository: team.bindings.find(item => item.type === 'Repository')?.name || REPOSITORIES[0].name, teamSpace: team.bindings.find(item => item.type === 'Task Tracker')?.scope || team.name, jenkinsToken: ''});
    setCreateDialog(false); setRequestOpen(false); setProvisionStep(-1); setShowReadyNotice(false);
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
  async function approveResourceRequest() {
    const result = await act('approve_resource_request', resourceInputs);
    if (result?.ok) {setRequestOpen(false); setResourceInputs(current => ({...current, jenkinsToken: ''}));}
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
      <div className="environment-stage-head"><div><p className="eyebrow">ШАГ 2 / 3</p><h2>Ресурсы оркестратора</h2><p className="subtext">{team.automation} декларирует нужные ресурсы в YAML. Проверьте запрос и подтвердите подключение всего набора.</p></div><Button onClick={() => setRequestOpen(true)} disabled={!enabled || busy}><FileCode2 size={16}/>{resourcesReady ? 'Посмотреть запрос' : 'Открыть запрос'}</Button></div>
      <div className="environment-resource-progress">{RESOURCE_TYPES.map(type => {const connected=resources.some(item => item.type === type && item.status === 'connected' && item.platform === team.automation);return <span key={type} className={connected ? 'connected' : ''}>{connected ? <Check size={15}/> : <span className="environment-resource-dot"/>}{resourceTypeLabel(type)}</span>})}</div>
      <Card body={false}>
        {resources.length ? <Table className="data-table environment-resources-table"><TableHeader><TableRow><TableHead>Ресурс</TableHead><TableHead>Доступ из YAML</TableHead><TableHead>Статус</TableHead></TableRow></TableHeader><TableBody>{resources.map(item => <TableRow key={item.id}>
          <TableCell><div className="row"><span className="icon-tile">{item.type === 'Repository' ? <GitBranch size={20}/> : item.type === 'CI' ? <Server size={20}/> : <Workflow size={20}/>}</span><div><p className="task-title">{item.name}</p><p className="task-sub">{resourceTypeLabel(item.type)}</p></div></div></TableCell>
          <TableCell>{item.type === 'Repository' ? <div className="environment-permission-chips">{GIT_PERMISSIONS.filter(option => bindingPermissions(item).includes(option.value)).map(option => <Pill key={option.value}>{option.label}</Pill>)}</div> : <div><p className="task-sub">{item.type === 'Task Tracker' ? 'Командное пространство' : 'Jenkins credential'}</p><span className="mono">{item.type === 'CI' ? item.credentialStatus === 'configured' ? 'Token · настроен' : 'Ожидает подтверждения' : (item as unknown as Item).scope || item.name}</span></div>}</TableCell>
          <TableCell><Pill tone={item.status==='connected'&&item.platform===team.automation?'green':'amber'}>{item.status==='connected'&&item.platform===team.automation?`${item.platform} · подключён`:'Нужно подтвердить запрос'}</Pill></TableCell>
        </TableRow>)}</TableBody></Table> : <div className="environment-resources-empty"><span className="icon-tile"><GitBranch size={23}/></span><h3>Оркестратор запросил 3 ресурса</h3><p>Откройте YAML-запрос, укажите три значения и подтвердите подключение.</p></div>}
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

    <Modal open={requestOpen} onClose={() => !busy && setRequestOpen(false)} title="Запрос ресурсов от оркестратора" description={`${team.automation} · resources.yaml · Platform Engineer`} wide><form onSubmit={async event => {event.preventDefault(); await approveResourceRequest();}} className="resource-request-dialog">
      <div className="resource-request-message orchestrator"><span className="resource-message-avatar"><Workflow size={18}/></span><div><div className="row between"><strong>{team.automation}</strong><Pill tone="amber">Требует подтверждения</Pill></div><p>Для выполнения Workflow мне нужны следующие подключения. Состав и права заданы декларацией.</p><pre className="resource-yaml">{resourceRequestYaml(team.automation)}</pre></div></div>
      <div className="resource-request-list">{ORCHESTRATOR_RESOURCE_REQUEST.resources.map(resource => <div key={resource.type}><span className="icon-tile">{resource.type === 'Repository' ? <GitBranch size={18}/> : resource.type === 'CI' ? <Server size={18}/> : <Workflow size={18}/>}</span><div><strong>{resourceTypeLabel(resource.type)}</strong><small>{resource.permissions.join(' · ')}</small></div><Check size={16}/></div>)}</div>
      <div className="resource-request-message approval"><span className="resource-message-avatar"><ShieldCheck size={18}/></span><div><strong>Подтверждение Platform Engineer</strong><p>Укажите только значения для запрошенных ресурсов. Permissions и pipeline определяет YAML оркестратора.</p><div className="resource-request-fields"><Field label="Имя репозитория"><Input value={resourceInputs.repository} onChange={event => setResourceInputs({...resourceInputs, repository: event.target.value})} placeholder="org/repository" required disabled={busy}/></Field><Field label="Командное пространство Task Tracker"><Input value={resourceInputs.teamSpace} onChange={event => setResourceInputs({...resourceInputs, teamSpace: event.target.value})} placeholder="TEAM-SPACE" required disabled={busy}/></Field><Field label="Jenkins token"><div className="resource-token-input"><KeyRound size={16}/><Input type="password" autoComplete="new-password" value={resourceInputs.jenkinsToken} onChange={event => setResourceInputs({...resourceInputs, jenkinsToken: event.target.value})} placeholder="••••••••••••" minLength={8} required disabled={busy}/></div></Field></div><p className="resource-secret-note">Токен передаётся Jenkins при подключении и не сохраняется в открытом виде.</p></div></div>
      <div className="actions"><Button variant="outline" type="button" disabled={busy} onClick={() => setRequestOpen(false)}>Отмена</Button><Button type="submit" disabled={busy || !enabled || !resourceInputs.repository.trim() || !resourceInputs.teamSpace.trim() || resourceInputs.jenkinsToken.length < 8}><ShieldCheck size={16}/>Одобрить и подключить</Button></div>
    </form></Modal>

    <Modal open={createDialog} onClose={() => !running && setCreateDialog(false)} title={deploymentMode==='promote'?'Промоут окружения':'Создание окружения'} description={`${product.name} / ${team.name} · ${form.automation} @${form.runtimeVersion}`}>
      {provisionStep >= 0 && <div className="stack"><Progress value={Math.min(100, provisionStep / deploymentSteps.length * 100)}/><div className="grid-2 gap-2">{deploymentSteps.map((item, index) => <div className={`row text-sm ${index === provisionStep ? 'text-[#628057]' : 'muted'}`} key={item}>{index < provisionStep ? <Check size={15} className="text-[#608149]"/> : index === provisionStep ? <Loader2 size={15} className="animate-spin"/> : <span className="w-[15px]"/>}{item}</div>)}</div></div>}
      <div className="actions"><Button disabled={running} onClick={() => setCreateDialog(false)}>{provisionStep === deploymentSteps.length ? 'Готово' : 'Закрыть'}</Button></div>
    </Modal>
  </div>;
}
