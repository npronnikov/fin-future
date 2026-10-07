'use client';
import {useEffect, useState} from 'react';
import {ArrowLeft, ArrowRight, Bot, Check, FileCode2, FileCheck, GitBranch, Layers, Lock, Scale, Settings2, ShieldCheck, Sparkles, Tag, Users, Workflow} from 'lucide-react';
import {useKontur} from './context';
import {Button, Card, PageHead, Pill, Status, Detail, Tabs, TabsList, TabsTrigger, TabsContent, KV, Blank, Code, TextLink, Field, Pick, Input, Notice} from './ui';
import {currentRelease, defaultConfig, getFlowNodes, type Asset, type Config} from '@/lib/domain';

const catalogTypes = ['Flow', 'Skills', 'Subagents', 'AI Agent Blueprints', 'Judge Profiles'];
const catalogTypeLabels: Record<string, string> = {Flow: 'Процессы', Skills: 'Навыки', Subagents: 'Субагенты', 'AI Agent Blueprints': 'Шаблоны ИИ-агентов', 'Judge Profiles': 'Профили проверки'};
const templateInfo: Record<string, {description: string; output: string; icon: typeof Workflow}> = {
  'dependency-update@1': {description: 'Анализ задачи, обновление зависимостей и проверка результата.', output: 'Изменение зависимостей и результаты проверок', icon: GitBranch},
  'sdd-statements@1': {description: 'Подготовка Specification, согласование, реализация и проверки.', output: 'Согласованная Specification и реализация', icon: Layers},
  custom: {description: 'Последовательность шагов, которую можно настроить под задачи продукта.', output: 'Настроенный Flow для выбранного тега', icon: Settings2},
};
function decodeTag(value: string) {try {return decodeURIComponent(value);} catch {return value;}}
function templateId(asset: Asset) {return String(asset.schema?.template || `${asset.id}@${asset.version}`);}
function assetDescription(asset: Asset) {return String(asset.schema?.description || asset.instruction || templateInfo[templateId(asset)]?.description || asset.changelog);}

export default function Catalog({initialType}: {initialType?: string} = {}) {
  const {state, product, team, tab, ref, go} = useKontur();
  const type = catalogTypes.includes(tab) ? tab : initialType || 'Flow';
  const [selection, setSelection] = useState(type === 'Flow' ? '' : ref || '');
  const [flowId, setFlowId] = useState('');
  useEffect(() => {setSelection(type === 'Flow' ? '' : ref || ''); setFlowId('');}, [type, ref, product.id, team.id]);
  const asset = state.assets.find(item => `${item.id}@${item.version}` === selection);
  const flows = state.assets.filter(item => item.type === 'Flow');
  const flow = flows.find(item => `${item.id}@${item.version}` === flowId);
  const runtime = team.automation || 'HG SDLC';
  const productFlows = state.capabilities.filter(cap => cap.productId === product.id && !cap.legacyDuplicateOf);
  const icons: Record<string, typeof Workflow> = {Skills: FileCode2, Subagents: Users, 'AI Agent Blueprints': Bot, 'Judge Profiles': Scale, Flow: Workflow};
  const Icon = icons[type] || Workflow;
  if (flow && type === 'Flow') return <CatalogFlowDetail key={`${flowId}-${team.id}-${product.id}`} asset={flow} suggestedTag={decodeTag(ref)} onBack={() => setFlowId('')}/>;
  return <div className="page flow-catalog-page">
    <PageHead title="Catalog" description="Flow, skills и subagents для задач продукта" actions={type === 'Judge Profiles' ? <Button variant="outline" onClick={() => go('benchmark', '', 'judges')}>Настроить профили проверки</Button> : undefined}/>
    <Tabs className="section-tabs" value={type} onValueChange={value => go('catalog', value === 'Flow' ? ref : '', value)}><TabsList>{catalogTypes.map(item => <TabsTrigger key={item} value={item}>{catalogTypeLabels[item]}</TabsTrigger>)}</TabsList>
      <TabsContent value="Flow">
        <div className="flow-catalog-intro"><div><h2>Выберите основу Flow</h2><p>Откройте детали, выберите Flow и создайте свою конфигурацию для тега задач.</p></div><Pill>{runtime}</Pill></div>
        <div className="flow-template-grid">{flows.map((item, index) => {
          const id = templateId(item), preview = defaultConfig(id === 'sdd-statements@1' ? 'statement-doc' : decodeTag(ref) || 'dep-update', runtime, id), InfoIcon = templateInfo[id]?.icon || Workflow;
          return <button key={`${item.id}@${item.version}`} type="button" className="flow-template-card flow-catalog-template" onClick={() => setFlowId(`${item.id}@${item.version}`)} aria-label={`Открыть процесс: ${item.name}`}>
            <div className="flow-template-top"><Pill tone={preview.mode === 'SDD' ? 'purple' : 'green'}>{id === 'custom' ? 'Настраиваемый' : preview.mode}</Pill><span className="mono">v{item.version}</span></div>
            <div className="flow-template-mini">{getFlowNodes(preview).filter(node => !['task', 'result'].includes(node.type)).slice(0, 4).map(node => <span className="flow-template-step" key={node.id}><InfoIcon size={14}/><span>{node.name}</span></span>)}</div>
            <div className="flow-template-body"><span className="eyebrow">0{index + 1} / ПРОЦЕСС</span><h2>{item.name}</h2><p>{assetDescription(item)}</p><span className="flow-catalog-open">Посмотреть процесс <ArrowRight size={15}/></span></div>
          </button>;
        })}</div>
        {!flows.length && <Card><Blank title="В каталоге пока нет Flow"/></Card>}
        {productFlows.length > 0 && <section className="flow-catalog-existing"><div className="flow-catalog-intro"><div><h2>Flow продукта {product.name}</h2><p>Общие Flow маршрутизируют задачи по тегу с разных досок. Вы видите задачи своей команды.</p></div></div><div className="grid-2">{productFlows.map(cap => {const release = currentRelease(cap), config = cap.draft || release?.snapshot.config, owner = state.teams.find(item => item.id === cap.teamId); return <Card key={cap.id}><div className="row between wrap"><span className="row"><Workflow size={18}/><strong>{cap.name}</strong></span><Status value={release?.status || 'draft'}/></div><p className="subtext mt-3">{config?.description || 'Flow для задач с выбранным тегом.'}</p><div className="row between wrap mt-4"><Pill tone="green">#{cap.tag}</Pill><span className="task-sub">Владелец: {owner?.name || 'Команда продукта'}</span></div><div className="actions"><Button variant="outline" onClick={() => go('capability', cap.id, 'configuration')}>Открыть процесс<ArrowRight size={15}/></Button></div></Card>;})}</div></section>}
      </TabsContent>
      {catalogTypes.filter(item => item !== 'Flow').map(item => <TabsContent key={item} value={item}><div className="catalog-grid">{state.assets.filter(value => value.type === item).map(value => <button className="card catalog-card text-left hover:border-[#bed394]" key={`${value.id}-${value.version}`} onClick={() => setSelection(`${value.id}@${value.version}`)}><div className="row between"><span className="icon-tile"><Icon size={22}/></span><Status value={value.status}/></div><h3>{value.name}</h3><span className="mono text-[#628057]">{value.id}@{value.version}</span><p className="subtext">{value.changelog}</p><div className="mt-auto pt-4 border-t border-[#edf2e9]"><p className="task-sub">Владелец: {value.owner}</p><div className="row wrap mt-3">{value.runtimes.map(value => <Pill key={value}>{value}</Pill>)}</div></div></button>)}</div></TabsContent>)}
    </Tabs>
    <Detail open={!!asset} onClose={() => setSelection('')} title={asset?.name || 'Catalog asset'} description={asset ? `${asset.id}@${asset.version}` : ''}>{asset && <><Status value={asset.status}/><KV label="ID">{asset.id}</KV><KV label="Version">{asset.version}</KV><KV label="Owner">{asset.owner}</KV><KV label="Type">{asset.type}</KV><KV label="Compatible runtimes">{asset.runtimes.join(', ')}</KV><KV label="Changelog">{asset.changelog}</KV>{asset.instruction && <><div className="detail-title">{asset.type === 'Subagents' ? 'Описание subagent' : 'Instruction'}</div><p className="text-sm">{asset.instruction}</p></>}{asset.skills && <KV label="Skills">{asset.skills.join(', ')}</KV>}{asset.schema && <><div className="detail-title">Output Schema</div><Code>{JSON.stringify(asset.schema, null, 2)}</Code></>}{asset.owner === 'Information Security' && <div className="mt-5"><Pill tone="purple"><ShieldCheck size={12}/>Regulatory Skill · control owner</Pill></div>}{asset.type === 'Subagents' && <Notice tone="blue" title="Подключение к шагу">Откройте нужный Flow, выберите узел и подключите эту версию на вкладке Subagents.</Notice>}</>}</Detail>
  </div>;
}

function CatalogFlowDetail({asset, suggestedTag, onBack}: {asset: Asset; suggestedTag: string; onBack: () => void}) {
  const {state, team, product, go, act, can, busy} = useKontur();
  const tasks = state.tasks.filter(task => task.teamId === team.id && task.productId === product.id);
  const tags = Array.from(new Set(tasks.map(task => task.tag).filter(Boolean)));
  const [chosen, setChosen] = useState(false);
  const [tag, setTag] = useState(tags.includes(suggestedTag) ? suggestedTag : tags[0] || '');
  const [name, setName] = useState(asset.name);
  const template = templateId(asset), runtime = team.automation || 'HG SDLC';
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
    <div className="mb-5"><TextLink onClick={onBack}><span className="row"><ArrowLeft size={14}/>Каталог процессов</span></TextLink></div>
    <PageHead title={asset.name} description={description} actions={<div className="row"><Pill tone={config.mode === 'SDD' ? 'purple' : 'green'}>{template === 'custom' ? 'Настраиваемый' : config.mode}</Pill><Status value={asset.status}/></div>}/>
    <div className="flow-catalog-detail-layout">
      <div className="stack"><Card className="flow-catalog-schema" title={<span className="row"><Workflow size={18}/>Структура Flow</span>} action={<Pill>v{asset.version}</Pill>} body={false}><TemplatePreview config={config}/></Card><Card title="О Flow"><p className="subtext">{description}</p><div className="mt-4"><KV label="Результат">{templateInfo[template]?.output || 'Результат задачи и подтверждающие артефакты'}</KV><KV label="Платформа">{runtime}</KV><KV label="Владелец шаблона">{asset.owner}</KV><KV label="Версия в каталоге">{asset.id}@{asset.version}</KV></div><p className="state-note">При создании появится самостоятельная конфигурация Flow продукта. В ней можно менять узлы, skills, subagents и экономику исполнения.</p></Card></div>
      <div className={`flow-catalog-selection ${chosen ? 'selected' : ''}`}>
        <div className="flow-catalog-selection-head"><span className="icon-tile">{chosen ? <Check size={22}/> : <Workflow size={22}/>}</span><p className="eyebrow">{chosen ? 'ВЫБРАННЫЙ FLOW' : 'FLOW ИЗ КАТАЛОГА'}</p><h2>{asset.name}</h2><p>{description}</p></div>
        {!chosen ? <div className="flow-catalog-selection-body"><div className="row wrap">{asset.runtimes.map(item => <Pill key={item}>{item}</Pill>)}</div><Button onClick={() => setChosen(true)}>Выбрать процесс<ArrowRight size={16}/></Button></div> : <form className="flow-catalog-selection-body stack" onSubmit={create}>
          <Field label="Тег задач" hint="Flow будет работать с этим тегом на досках продукта."><Pick label="Тег для Flow" value={tag} onChange={setTag} disabled={busy || !tags.length} options={tags.map(value => ({value, label: `#${value} · ${tasks.filter(task => task.tag === value).length} задач моей команды`}))}/></Field>
          <Field label="Название Flow"><Input value={name} onChange={event => setName(event.target.value)} maxLength={160} required disabled={busy}/></Field>
          <div className="row wrap"><Pill tone="green"><Tag size={12}/>{tag ? `#${tag}` : 'Выберите тег'}</Pill><span className="task-sub">{product.name} / {team.name}</span></div>
          {existing ? <><Notice tone="blue" title="Flow для этого тега уже есть">Все доски продукта используют общий Flow по тегу. Откройте его конфигурацию, чтобы запустить задачу своей команды.</Notice><Button type="button" onClick={() => go('capability', existing.id, 'configuration')}>Открыть существующий процесс<ArrowRight size={15}/></Button></> : <Button type="submit" disabled={!enabled || busy || !name.trim()}>Создать и настроить<ArrowRight size={16}/></Button>}
          {!tags.length && <Notice tone="blue" title="Сначала добавьте задачи">Создайте доску и добавьте задачи с тегами.<br/><TextLink onClick={() => go('tasks')}>Открыть доску задач</TextLink></Notice>}
          {!!tags.length && team.environment.status !== 'ready' && <Notice tone="blue" title="Environment ещё не готов">Завершите настройку ресурсов и Provisioning.</Notice>}
          {!!tags.length && team.environment.status === 'ready' && !can('Product Engineer') && <Notice tone="blue" title="Требуется Product Engineer">Создать и настроить Flow может Product Engineer команды.</Notice>}
        </form>}
      </div>
    </div>
  </div>;
}

function TemplatePreview({config}: {config: Config}) {
  const nodes = getFlowNodes(config);
  const icons: Record<string, typeof Workflow> = {analysis: Sparkles, specification: FileCode2, approval: Users, implementation: Bot, checks: FileCheck, result: Check, task: Tag};
  return <div className="flow-template-preview" aria-label="Предварительная схема Flow"><div className="flow-preview-system"><Lock size={14}/><span>До запуска<strong>Regulatory Plan</strong></span><ShieldCheck size={16}/></div><div className="flow-preview-nodes">{nodes.map((node, index) => {const Icon = icons[node.type] || Workflow; return <div className={`flow-preview-node ${node.type}`} key={node.id}><div><span className={`workflow-node-icon ${node.type}`}><Icon size={19}/></span><span className="mono">{String(index + 1).padStart(2, '0')}</span></div><strong>{node.name}</strong><small>{node.executor === 'human' ? 'Human · supervised' : node.executor === 'ci' ? 'CI · проверки' : config.runtime}</small>{index < nodes.length - 1 && <ArrowRight size={15} className="flow-preview-next"/>}</div>;})}</div><div className="flow-preview-system"><Lock size={14}/><span>После запуска<strong>Regulatory Evidence</strong></span><ShieldCheck size={16}/></div></div>;
}
