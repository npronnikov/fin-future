'use client';
import React, {useEffect, useState} from 'react';
import {ArrowLeft, ArrowRight, Bot, Check, FileCode2, FileCheck, GitBranch, Layers, Lock, Plus, Scale, Settings2, ShieldCheck, Sparkles, Tag, Trash2, Users, Workflow} from 'lucide-react';
import {useKontur} from './context';
import {Button, Card, PageHead, Pill, Status, Detail, Tabs, TabsList, TabsTrigger, TabsContent, KV, Blank, Code, TextLink, Field, Pick, Input, Notice} from './ui';
import {createFlowNode, currentRelease, defaultConfig, getFlowNodes, type Asset, type Config, type FlowNodeType} from '@/lib/domain';

const catalogTypes = ['Flow', 'Skills', 'Subagents', 'AI Agent Blueprints', 'Judge Profiles'];
const catalogTypeLabels: Record<string, string> = {Flow: 'Сценарии', Skills: 'Скиллы', Subagents: 'Сабагенты', 'AI Agent Blueprints': 'Шаблоны ИИ-агентов', 'Judge Profiles': 'Профили проверки'};
const templateInfo: Record<string, {name: string; description: string; output: string; icon: typeof Workflow}> = {
  'dependency-update@1': {name: 'Обновление зависимостей', description: 'Анализ задачи, обновление зависимостей и проверка результата.', output: 'Изменение зависимостей и результаты проверок', icon: GitBranch},
  'sdd-statements@1': {name: 'Выписки и справки', description: 'Подготовка спецификации, согласование, реализация и проверки.', output: 'Согласованная спецификация и реализация', icon: Layers},
  custom: {name: 'Настраиваемый сценарий', description: 'Последовательность шагов, которую можно настроить под задачи продукта.', output: 'Настроенный сценарий для выбранного тега', icon: Settings2},
};
const nodeTypeLabels: Record<string, string> = {task: 'Задача', analysis: 'Анализ', specification: 'Спецификация', input: 'Ввод человека', approval: 'Согласование', implementation: 'Реализация', checks: 'Проверки', result: 'Результат'};
function decodeTag(value: string) {try {return decodeURIComponent(value);} catch {return value;}}
function templateId(asset: Asset) {return String(asset.schema?.template || `${asset.id}@${asset.version}`);}
function localizeCatalogText(value: string) {return value.replace(/\bFlow\b/g, 'сценария').replace(/\bSpecification\b/g, 'спецификации').replace(/\bVersioned reusable asset\b/g, 'Версионируемый переиспользуемый элемент');}
function assetDescription(asset: Asset) {return localizeCatalogText(String(asset.schema?.description || asset.instruction || templateInfo[templateId(asset)]?.description || asset.changelog));}
function catalogOwner(value: string) {return value === 'Information Security' ? 'Информационная безопасность' : value === 'Product Engineer' ? 'Инженер продукта' : value;}

export default function Catalog({initialType}: {initialType?: string} = {}) {
  const {state, product, team, tab, ref, go} = useKontur();
  const type = catalogTypes.includes(tab) ? tab : initialType || 'Flow';
  const [selection, setSelection] = useState(type === 'Flow' ? '' : ref || '');
  const [flowId, setFlowId] = useState('');
  useEffect(() => {setSelection(type === 'Flow' ? '' : ref || ''); setFlowId('');}, [type, ref, product.id, team.id]);
  const asset = state.assets.find(item => `${item.id}@${item.version}` === selection);
  const configuredRuntime = team.automation;
  const runtime = configuredRuntime || 'HG SDLC';
  const flows = configuredRuntime && team.environment.status === 'ready' ? state.assets.filter(item => item.type === 'Flow' && item.runtimes.includes(configuredRuntime)) : [];
  const flow = flows.find(item => `${item.id}@${item.version}` === flowId);
  const productFlows = state.capabilities.filter(cap => cap.productId === product.id && !cap.legacyDuplicateOf);
  const icons: Record<string, typeof Workflow> = {Skills: FileCode2, Subagents: Users, 'AI Agent Blueprints': Bot, 'Judge Profiles': Scale, Flow: Workflow};
  const Icon = icons[type] || Workflow;
  if (flow && type === 'Flow') return <CatalogFlowDetail key={`${flowId}-${team.id}-${product.id}`} asset={flow} suggestedTag={decodeTag(ref)} onBack={() => setFlowId('')}/>;
  return <div className="page flow-catalog-page">
    <PageHead title="Каталог" description="Сценарии, скиллы и сабагенты для задач продукта" actions={type === 'Judge Profiles' ? <Button variant="outline" onClick={() => go('benchmark', '', 'judges')}>Настроить профили проверки</Button> : undefined}/>
    <Tabs className="section-tabs" value={type} onValueChange={value => go('catalog', value === 'Flow' ? ref : '', value)}><TabsList>{catalogTypes.map(item => <TabsTrigger key={item} value={item}>{catalogTypeLabels[item]}</TabsTrigger>)}</TabsList>
      <TabsContent value="Flow">
        {!configuredRuntime && <Card><Blank title="Сначала выберите оркестратор" text="Настройте Sandbox, чтобы каталог показал совместимые сценарии." action={<Button onClick={() => go('environment', '', 'sandbox')}>Настроить Sandbox</Button>}/></Card>}
        {configuredRuntime && team.environment.status !== 'ready' && <Card><Blank title="Завершите настройку Sandbox" text={`После создания среды здесь появятся сценарии ${configuredRuntime}.`} action={<Button onClick={() => go('environment', '', 'sandbox')}>Открыть Sandbox</Button>}/></Card>}
        {!!configuredRuntime && team.environment.status === 'ready' && <CustomScenarioBuilder runtime={runtime} suggestedTag={decodeTag(ref)}/>}
        <div className="flow-template-grid">{flows.map((item, index) => {
          const id = templateId(item), preview = defaultConfig(id === 'sdd-statements@1' ? 'statement-doc' : decodeTag(ref) || 'dep-update', runtime, id), InfoIcon = templateInfo[id]?.icon || Workflow;
          return <button key={`${item.id}@${item.version}`} type="button" className="flow-template-card flow-catalog-template" onClick={() => setFlowId(`${item.id}@${item.version}`)} aria-label={`Открыть сценарий: ${templateInfo[id]?.name || item.name}`}>
            <div className="flow-template-top"><Pill tone={preview.mode === 'SDD' ? 'purple' : 'green'}>{id === 'custom' ? 'Настраиваемый' : preview.mode}</Pill><span className="mono">{runtime} · v{item.version}</span></div>
            <div className="flow-template-mini">{getFlowNodes(preview).filter(node => !['task', 'result'].includes(node.type)).slice(0, 4).map(node => <span className="flow-template-step" key={node.id}><InfoIcon size={14}/><span>{nodeTypeLabels[node.type] || node.name}</span></span>)}</div>
            <div className="flow-template-body"><span className="eyebrow">0{index + 1} / СЦЕНАРИЙ</span><h2>{templateInfo[id]?.name || item.name}</h2><p>{assetDescription(item)}</p><span className="flow-catalog-open">Открыть сценарий <ArrowRight size={15}/></span></div>
          </button>;
        })}</div>
        {!!configuredRuntime && team.environment.status === 'ready' && !flows.length && <Card><Blank title={`Для ${runtime} пока нет сценариев`}/></Card>}
        {productFlows.length > 0 && <section className="flow-catalog-existing"><div className="flow-catalog-intro"><div><h2>Сценарии продукта {product.name}</h2><p>Общие сценарии маршрутизируют задачи по тегу с разных досок. Вы видите задачи своей команды.</p></div></div><div className="grid-2">{productFlows.map(cap => {const release = currentRelease(cap), config = cap.draft || release?.snapshot.config, owner = state.teams.find(item => item.id === cap.teamId), scenarioName = config ? templateInfo[config.template]?.name || cap.name : cap.name; return <Card key={cap.id}><div className="row between wrap"><span className="row"><Workflow size={18}/><strong>{scenarioName}</strong></span><Status value={release?.status || 'draft'}/></div><p className="subtext mt-3">{config?.description ? localizeCatalogText(config.description) : 'Сценарий для задач с выбранным тегом.'}</p><div className="row between wrap mt-4"><Pill tone="green">#{cap.tag}</Pill><span className="task-sub">Владелец: {owner?.name || 'Команда продукта'}</span></div><div className="actions"><Button variant="outline" onClick={() => go('capability', cap.id, 'configuration')}>Открыть сценарий<ArrowRight size={15}/></Button></div></Card>;})}</div></section>}
      </TabsContent>
      {catalogTypes.filter(item => item !== 'Flow').map(item => <TabsContent key={item} value={item}><div className="catalog-grid">{state.assets.filter(value => value.type === item).map(value => <button className="card catalog-card text-left hover:border-[#bed394]" key={`${value.id}-${value.version}`} onClick={() => setSelection(`${value.id}@${value.version}`)}><div className="row between"><span className="icon-tile"><Icon size={22}/></span><Status value={value.status}/></div><h3>{value.name}</h3><span className="mono text-[#628057]">{value.id}@{value.version}</span><p className="subtext">{localizeCatalogText(value.changelog)}</p><div className="mt-auto pt-4 border-t border-[#edf2e9]"><p className="task-sub">Владелец: {catalogOwner(value.owner)}</p><div className="row wrap mt-3">{value.runtimes.map(value => <Pill key={value}>{value}</Pill>)}</div></div></button>)}</div></TabsContent>)}
    </Tabs>
    <Detail open={!!asset} onClose={() => setSelection('')} title={asset?.name || 'Элемент каталога'} description={asset ? `${asset.id}@${asset.version}` : ''}>{asset && <><Status value={asset.status}/><KV label="Идентификатор">{asset.id}</KV><KV label="Версия">{asset.version}</KV><KV label="Владелец">{catalogOwner(asset.owner)}</KV><KV label="Тип">{catalogTypeLabels[asset.type] || asset.type}</KV><KV label="Совместимые оркестраторы">{asset.runtimes.join(', ')}</KV><KV label="История изменений">{localizeCatalogText(asset.changelog)}</KV>{asset.instruction && <><div className="detail-title">{asset.type === 'Subagents' ? 'Описание сабагента' : 'Инструкция'}</div><p className="text-sm">{localizeCatalogText(asset.instruction)}</p></>}{asset.skills && <KV label="Скиллы">{asset.skills.join(', ')}</KV>}{asset.schema && <><div className="detail-title">Схема результата</div><Code>{JSON.stringify(asset.schema, null, 2)}</Code></>}{asset.owner === 'Information Security' && <div className="mt-5"><Pill tone="purple"><ShieldCheck size={12}/>Регуляторный скилл · владелец контроля</Pill></div>}{asset.type === 'Subagents' && <Notice tone="blue" title="Подключение к шагу">Откройте нужный сценарий, выберите узел и подключите эту версию на вкладке «Сабагенты».</Notice>}</>}</Detail>
  </div>;
}

function CatalogFlowDetail({asset, suggestedTag, onBack}: {asset: Asset; suggestedTag: string; onBack: () => void}) {
  const {state, team, product, go, act, can, busy} = useKontur();
  const tasks = state.tasks.filter(task => task.teamId === team.id && task.productId === product.id);
  const tags = Array.from(new Set(tasks.map(task => task.tag).filter(Boolean)));
  const [chosen, setChosen] = useState(false);
  const [tag, setTag] = useState(tags.includes(suggestedTag) ? suggestedTag : tags[0] || '');
  const template = templateId(asset), runtime = team.automation || 'HG SDLC';
  const displayName = templateInfo[template]?.name || asset.name;
  const [name, setName] = useState(displayName);
  const config = defaultConfig(tag, runtime, template), description = assetDescription(asset);
  const existing = state.capabilities.find(cap => cap.productId === product.id && cap.tag === tag && !cap.legacyDuplicateOf);
  const enabled = can('Product Engineer') && team.environment.status === 'ready' && !!tag && !existing;
  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!enabled || busy || !name.trim()) return;
    const result = await act('create_capability', {tag, template, name: name.trim(), config: {description}});
    if (result?.id) go('capability', result.id, 'configuration');
  }
  return <div className="page flow-catalog-page">
    <div className="mb-5"><TextLink onClick={onBack}><span className="row"><ArrowLeft size={14}/>Каталог сценариев</span></TextLink></div>
    <PageHead title={displayName} description={description} actions={<div className="row"><Pill tone={config.mode === 'SDD' ? 'purple' : 'green'}>{template === 'custom' ? 'Настраиваемый' : config.mode}</Pill><Status value={asset.status}/></div>}/>
    <div className="flow-catalog-detail-layout">
      <div className="stack"><Card className="flow-catalog-schema" title={<span className="row"><Workflow size={18}/>Структура сценария</span>} action={<Pill>v{asset.version}</Pill>} body={false}><TemplatePreview config={config}/></Card><Card title="О сценарии"><p className="subtext">{description}</p><div className="mt-4"><KV label="Результат">{templateInfo[template]?.output || 'Результат задачи и подтверждающие артефакты'}</KV><KV label="Оркестратор">{runtime}</KV><KV label="Владелец шаблона">{asset.owner}</KV><KV label="Версия в каталоге">{asset.id}@{asset.version}</KV></div><p className="state-note">При создании появится самостоятельная конфигурация сценария продукта. В ней можно менять узлы, скиллы, сабагентов и экономику исполнения.</p></Card></div>
      <div className={`flow-catalog-selection ${chosen ? 'selected' : ''}`}>
        <div className="flow-catalog-selection-head"><span className="icon-tile">{chosen ? <Check size={22}/> : <Workflow size={22}/>}</span><p className="eyebrow">{chosen ? 'ВЫБРАННЫЙ СЦЕНАРИЙ' : 'СЦЕНАРИЙ ИЗ КАТАЛОГА'}</p><h2>{displayName}</h2><p>{description}</p></div>
        {!chosen ? <div className="flow-catalog-selection-body"><div className="row wrap">{asset.runtimes.map(item => <Pill key={item}>{item}</Pill>)}</div><Button onClick={() => setChosen(true)}>Выбрать и настроить<ArrowRight size={16}/></Button></div> : <form className="flow-catalog-selection-body stack" onSubmit={create}>
          <Field label="Тег задач" hint="Сценарий будет работать с этим тегом на досках продукта."><Pick label="Тег для сценария" value={tag} onChange={setTag} disabled={busy || !tags.length} options={tags.map(value => ({value, label: `#${value} · ${tasks.filter(task => task.tag === value).length} задач моей команды`}))}/></Field>
          <Field label="Название сценария"><Input value={name} onChange={event => setName(event.target.value)} maxLength={160} required disabled={busy}/></Field>
          <div className="row wrap"><Pill tone="green"><Tag size={12}/>{tag ? `#${tag}` : 'Выберите тег'}</Pill><span className="task-sub">{product.name} / {team.name}</span></div>
          {existing ? <><Notice tone="blue" title="Сценарий для этого тега уже есть">Все доски продукта используют общий сценарий по тегу. Откройте его конфигурацию, чтобы запустить задачу своей команды.</Notice><Button type="button" onClick={() => go('capability', existing.id, 'configuration')}>Открыть существующий сценарий<ArrowRight size={15}/></Button></> : <Button type="submit" disabled={!enabled || busy || !name.trim()}>Создать и настроить<ArrowRight size={16}/></Button>}
          {!tags.length && <Notice tone="blue" title="Сначала добавьте задачи">Создайте доску и добавьте задачи с тегами.<br/><TextLink onClick={() => go('tasks')}>Открыть доску задач</TextLink></Notice>}
          {!!tags.length && team.environment.status !== 'ready' && <Notice tone="blue" title="Environment ещё не готов">Завершите настройку ресурсов и Provisioning.</Notice>}
          {!!tags.length && team.environment.status === 'ready' && !can('Product Engineer') && <Notice tone="blue" title="Требуется инженер продукта">Создать и настроить сценарий может инженер продукта команды.</Notice>}
        </form>}
      </div>
    </div>
  </div>;
}

const customBlocks: {type: FlowNodeType; label: string; hint: string; icon: typeof Workflow}[] = [
  {type: 'analysis', label: 'Анализ', hint: 'Разобрать задачу и ограничения', icon: Sparkles},
  {type: 'specification', label: 'Спецификация', hint: 'Описать ожидаемое изменение', icon: FileCode2},
  {type: 'input', label: 'Ввод человека', hint: 'Запросить недостающие данные', icon: Users},
  {type: 'approval', label: 'Согласование', hint: 'Получить явное решение', icon: Check},
  {type: 'implementation', label: 'Реализация', hint: 'Внести изменение', icon: Settings2},
  {type: 'checks', label: 'Проверки', hint: 'Проверить результат', icon: FileCheck},
];

function CustomScenarioBuilder({runtime, suggestedTag}: {runtime: Config['runtime']; suggestedTag: string}) {
  const {state, team, product, go, act, can, busy} = useKontur();
  const tasks = state.tasks.filter(task => task.teamId === team.id && task.productId === product.id);
  const tags = Array.from(new Set(tasks.map(task => task.tag).filter(Boolean)));
  const [tag, setTag] = useState(tags.includes(suggestedTag) ? suggestedTag : tags[0] || '');
  const [name, setName] = useState('Мой сценарий');
  const [steps, setSteps] = useState<FlowNodeType[]>(['analysis', 'implementation', 'checks']);
  useEffect(() => {if (tags.includes(suggestedTag)) setTag(suggestedTag);}, [suggestedTag]);
  const base = defaultConfig(tag || 'task', runtime, 'custom');
  const nodes = [
    createFlowNode('task', 'builder-task', base),
    ...steps.map((type, index) => createFlowNode(type, `builder-${type}-${index + 1}`, base)),
    createFlowNode('result', 'builder-result', base),
  ];
  const implementation = steps.indexOf('implementation');
  const lastImplementation = steps.lastIndexOf('implementation');
  const checks = steps.indexOf('checks');
  const structureReady = implementation >= 0 && checks > lastImplementation;
  const existing = state.capabilities.find(capability => capability.productId === product.id && capability.tag === tag && !capability.legacyDuplicateOf);
  const enabled = can('Product Engineer') && !!tag && !!name.trim() && structureReady && !existing && team.environment.status === 'ready';
  function add(type: FlowNodeType) {setSteps(current => [...current, type]);}
  function remove(index: number) {setSteps(current => current.filter((_, itemIndex) => itemIndex !== index));}
  function move(index: number, delta: number) {setSteps(current => {const target = index + delta; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next;});}
  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!enabled || busy) return;
    const config = {
      description: 'Собственный сценарий, собранный из блоков в каталоге.',
      nodes: nodes.map(node => node.name),
      nodeConfigs: nodes,
      humanInput: steps.includes('input'),
      humanApproval: steps.includes('approval'),
    };
    const result = await act('create_capability', {tag, template: 'custom', name: name.trim(), config});
    if (result?.id) go('capability', result.id, 'configuration');
  }
  return <section className="custom-scenario-builder" aria-label="Конструктор собственного сценария">
    <header className="custom-scenario-head"><div><span className="eyebrow">СВОЙ СЦЕНАРИЙ</span><h2>Соберите последовательность из блоков</h2><p>Добавьте нужные шаги, расставьте их по порядку и продолжите настройку в полном редакторе.</p></div><Pill tone="green">{runtime}</Pill></header>
    <div className="custom-scenario-layout">
      <div className="custom-scenario-workbench">
        <div className="custom-block-palette" aria-label="Доступные блоки">{customBlocks.map(block => <button type="button" key={block.type} disabled={busy || steps.length >= 22} onClick={() => add(block.type)}><block.icon size={17}/><span><strong>{block.label}</strong><small>{block.hint}</small></span><Plus size={14}/></button>)}</div>
        <div className="custom-block-canvas" aria-label="Последовательность сценария">
          <div className="custom-flow-block endpoint"><Tag size={17}/><strong>Задача</strong><small>Вход</small></div>
          {steps.map((type, index) => {const block = customBlocks.find(item => item.type === type)!; return <React.Fragment key={`${type}-${index}`}><ArrowRight className="custom-block-arrow" size={15}/><div className={`custom-flow-block ${type}`}><block.icon size={17}/><strong>{block.label}</strong><span className="custom-block-controls"><button type="button" aria-label={`Переместить ${block.label} раньше`} disabled={busy || index === 0} onClick={() => move(index, -1)}><ArrowLeft size={12}/></button><button type="button" aria-label={`Переместить ${block.label} позже`} disabled={busy || index === steps.length - 1} onClick={() => move(index, 1)}><ArrowRight size={12}/></button><button type="button" aria-label={`Удалить ${block.label}`} disabled={busy} onClick={() => remove(index)}><Trash2 size={12}/></button></span></div></React.Fragment>;})}
          <ArrowRight className="custom-block-arrow" size={15}/><div className="custom-flow-block endpoint"><Check size={17}/><strong>Результат</strong><small>Выход</small></div>
        </div>
        {!structureReady && <Notice tone="blue" title="Завершите структуру">Добавьте «Реализацию», а после последней реализации — «Проверки».</Notice>}
      </div>
      <form className="custom-scenario-form" onSubmit={create}>
        <Field label="Тег задач" hint="Сценарий будет запускаться для задач с этим тегом."><Pick label="Тег для сценария" value={tag} onChange={setTag} disabled={busy || !tags.length} options={tags.map(value => ({value, label: `#${value} · ${tasks.filter(task => task.tag === value).length} задач`}))}/></Field>
        <Field label="Название сценария"><Input value={name} onChange={event => setName(event.target.value)} maxLength={160} required disabled={busy}/></Field>
        {existing && <Notice tone="blue" title="Для тега уже есть сценарий"><TextLink onClick={() => go('capability', existing.id, 'configuration')}>Открыть существующий сценарий</TextLink></Notice>}
        {!tags.length && <Notice tone="blue" title="Сначала добавьте задачи">На доске должна быть хотя бы одна задача с тегом.</Notice>}
        {!can('Product Engineer') && <Notice tone="blue" title="Требуется инженер продукта">Создание сценария доступно роли Product Engineer.</Notice>}
        <Button type="submit" disabled={!enabled || busy}>Создать и настроить<ArrowRight size={16}/></Button>
      </form>
    </div>
  </section>;
}

function TemplatePreview({config}: {config: Config}) {
  const nodes = getFlowNodes(config);
  const icons: Record<string, typeof Workflow> = {analysis: Sparkles, specification: FileCode2, approval: Users, implementation: Bot, checks: FileCheck, result: Check, task: Tag};
  return <div className="flow-template-preview" aria-label="Предварительная схема сценария"><div className="flow-preview-system"><Lock size={14}/><span>До запуска<strong>Регуляторный план</strong></span><ShieldCheck size={16}/></div><div className="flow-preview-nodes">{nodes.map((node, index) => {const Icon = icons[node.type] || Workflow; return <div className={`flow-preview-node ${node.type}`} key={node.id}><div><span className={`workflow-node-icon ${node.type}`}><Icon size={19}/></span><span className="mono">{String(index + 1).padStart(2, '0')}</span></div><strong>{nodeTypeLabels[node.type] || node.name}</strong><small>{node.executor === 'human' ? 'Человек · под контролем' : node.executor === 'ci' ? 'CI · проверки' : config.runtime}</small>{index < nodes.length - 1 && <ArrowRight size={15} className="flow-preview-next"/>}</div>;})}</div><div className="flow-preview-system"><Lock size={14}/><span>После запуска<strong>Регуляторные подтверждения</strong></span><ShieldCheck size={16}/></div></div>;
}
