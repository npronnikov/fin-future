'use client';
import {useEffect, useState} from 'react';
import {Coins, Layers, Play, Plus, Save, Settings2, Workflow} from 'lucide-react';
import {useKontur} from './context';
import FlowEditor from './flow-editor';
import FlowLaunch from './flow-launch';
import {Button, Input, Card, Pill, Pick, Field, Notice, Blank, KV} from './ui';
import {copy, currentRelease, estimateTokenCost, flowIssues, getEditableFlowNodes, getFlowNodes, isRetiredPolicyStatus, normalizePolicyStatus, MODEL_OPTIONS, policyKey, shortConfig, type Capability, type Config} from '@/lib/domain';

const policyStatusLabels: Record<string, string> = {Draft: 'Черновик', Current: 'Действует', Deprecating: 'Выводится из эксплуатации', Retired: 'Выведена из эксплуатации'};

function editableConfig(config: Config, editable = true): Config {return {...copy(config), nodeConfigs: editable ? getEditableFlowNodes(config) : getFlowNodes(config)};}

export default function Configuration({cap}: {cap: Capability}) {
  const {state, team, product, act, can, busy, go} = useKontur();
  const release = currentRelease(cap);
  const source = cap.draft || release?.snapshot.config;
  const ownerTeam = state.teams.find(item => item.id === cap.teamId) || team;
  const owner = cap.teamId === team.id;
  const [form, setForm] = useState<Config | undefined>(source ? editableConfig(source, !!cap.draft) : undefined);
  const [name, setName] = useState(cap.name);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {if (source) setForm(editableConfig(source, !!cap.draft)); setName(cap.name);}, [cap.draft?.revision, cap.name, release?.id]);
  if (!form || !source) return <Blank title="Конфигурация отсутствует"/>;
  const cfg = form;
  const editable = owner && !!cap.draft && can('Product Engineer');
  const materialize = editable && !cap.draft?.nodeConfigs;
  const hasEdits = editable && (name !== cap.name || JSON.stringify(cfg) !== JSON.stringify(editableConfig(cap.draft!)));
  const dirty = materialize || hasEdits;
  const issues = [...flowIssues(cfg, {allowLegacyExecutors: !editable}), ...(!name.trim() ? ['Укажите название Flow.'] : []), ...(cfg.tokenLimit !== undefined && (!Number.isInteger(cfg.tokenLimit) || cfg.tokenLimit <= 0 || cfg.tokenLimit > 10000000) ? ['Лимит токенов должен быть целым числом от 1 до 10 000 000.'] : [])];
  const latestRun = state.runs.filter(run => run.capabilityId === cap.id && run.teamId === team.id && run.productId === product.id && !run.uat).slice().reverse()[0];
  function change<K extends keyof Config>(key: K, value: Config[K]) {setForm({...cfg, [key]: value}); setSaved(false);}
  async function save() {
    if (!cap.draft || !editable || issues.length) return false;
    if (!dirty) return true;
    const result = await act('save_config', {capabilityId: cap.id, expectedRevision: cap.draft.revision, name: name.trim(), config: cfg});
    if (result?.ok) {setSaved(true); return true;}
    return false;
  }
  const models = MODEL_OPTIONS.map(model => ({value: model.id, label: model.name}));
  if (!models.some(model => model.value === cfg.model)) models.push({value: cfg.model, label: `Текущий профиль · ${cfg.model}`});
  const cost = cfg.tokenLimit && cfg.tokenLimit > 0 ? estimateTokenCost(cfg.model, cfg.tokenLimit) : undefined;
  return <div className="stack">
    {!owner && <Notice tone="blue" title={`Общий Flow продукта · владелец ${ownerTeam.name}`}>Конфигурацию меняет команда-владелец. Вы можете запускать задачи своей команды с тегом #{cap.tag}.</Notice>}
    {owner && !cap.draft && <Notice tone="blue" title="Released configuration · immutable" action={<Button size="sm" disabled={!can('Product Engineer') || busy} onClick={() => {void act('clone_release', {capabilityId: cap.id, releaseId: release?.id});}}><Plus size={14}/>Новая версия</Button>}>Изменения сохраняются в новой версии Flow.</Notice>}
    <header className="flow-editor-header"><div className="flow-editor-basis"><span className="icon-tile"><Workflow size={19}/></span><div><strong>{cfg.runtime} · {shortConfig(cfg)}</strong><div className="row wrap"><Pill tone="green">#{cap.tag}</Pill><Pill>Командное пространство · {ownerTeam.name}</Pill><Pill tone={cfg.mode === 'SDD' ? 'purple' : 'blue'}>{cfg.mode}</Pill><span className={dirty ? 'flow-save-pending' : 'flow-save-complete'}>{hasEdits ? 'Есть несохранённые изменения' : materialize ? 'Настройки узлов готовы к сохранению' : saved ? `Сохранено в пространстве команды · v${cfg.version}` : cap.draft ? `Сохранено в пространстве команды · v${cfg.version}` : 'Released snapshot'}</span></div></div></div>
      <div className="row wrap"><Button variant="outline" disabled={busy} onClick={() => go('catalog', encodeURIComponent(cap.tag), 'Flow')}><Layers size={15}/>Каталог сценариев</Button>{editable && <Button variant="outline" disabled={busy || !dirty || issues.length > 0} onClick={() => {void save();}}><Save size={15}/>Сохранить сценарий</Button>}<Button onClick={() => setLaunchOpen(true)} disabled={busy || !can('Product Engineer')}><Play size={16}/>Запустить задачу</Button></div>
    </header>
    <FlowEditor config={cfg} savedConfig={source} flowName={name} ownerTeam={ownerTeam} onNameChange={value => {setName(value); setSaved(false);}} editable={editable} busy={busy} dirty={dirty} onChange={config => {setForm(config); setSaved(false);}} onSave={save}/>
    <div className="flow-under-actions">{editable && <span className="flow-version-note">Каждое сохранение изменений создаёт следующую версию Flow в пространстве {ownerTeam.name}.</span>}<Button variant="ghost" onClick={() => go('tasks')}>Открыть задачи на доске</Button>{latestRun && <Button variant="outline" onClick={() => go('run', latestRun.id)}>Последний запуск · {latestRun.id}</Button>}{editable && hasEdits && <Button variant="ghost" disabled={busy} onClick={() => {setForm(editableConfig(cap.draft!)); setName(cap.name); setSaved(false);}}>Отменить изменения</Button>}</div>
    <details className="flow-common-settings"><summary><span className="row"><Settings2 size={18}/><strong>Общие настройки Flow</strong></span><span>Context Supply Chain · Экономика</span></summary><div className="flow-settings-v14-grid">
      <Card title="Context Supply Chain" body={false}>
        <div className="context-layer"><span className="layer-num">01</span><div className="flex-1"><h3>Знания продукта</h3><p className="task-sub mb-3">Единый approved graph продукта {product.name}</p><Pick label="Product Knowledge version" value={String(cfg.productKnowledge)} onChange={value => change('productKnowledge', Number(value))} disabled={!editable} options={Array.from({length: product.knowledgeVersion}, (_, index) => ({value: String(index + 1), label: `Product Knowledge @${index + 1}`}))}/></div></div>
        <div className="context-layer"><span className="layer-num">02</span><div className="flex-1"><h3>Regulatory Context</h3><p className="task-sub mb-3">Точные версии Policy Packages</p><div className="stack gap-3">{Array.from(new Set(ownerTeam.bindings.filter(binding => binding.type === 'Repository' && cfg.repos.includes(binding.name)).map(binding => binding.segment))).flatMap(segment => ['Information Security', 'Reliability', 'Risk'].map(direction => ({segment, direction}))).map(({segment, direction}) => {const policies = state.policies.filter(policy => policy.direction === direction && policy.segment === segment); return <Field key={`${segment}-${direction}`} label={`${segment} · ${direction}`}><Pick label={`${segment} · ${direction}`} value={cfg.policies.find(key => policies.some(policy => policyKey(policy) === key)) || ''} onChange={value => change('policies', [...cfg.policies.filter(key => !policies.some(policy => policyKey(policy) === key)), value])} disabled={!editable} options={policies.map(policy => ({value: policyKey(policy), label: `${policyKey(policy)} · ${policyStatusLabels[normalizePolicyStatus(policy.status)] || policy.status}`, disabled: policy.status === 'Draft' || isRetiredPolicyStatus(policy.status)}))}/></Field>;})}</div></div></div>
        <div className="context-layer"><span className="layer-num">03</span><div className="flex-1"><h3>Знания команды</h3><p className="task-sub mb-3">Conventions, подтверждённые lessons и patterns команды {ownerTeam.name}</p><Pick label="Team Knowledge version" value={String(cfg.teamKnowledge)} onChange={value => change('teamKnowledge', Number(value))} disabled={!editable} options={Array.from({length: ownerTeam.knowledgeVersion}, (_, index) => ({value: String(index + 1), label: `Team Knowledge @${index + 1}`}))}/></div></div>
        <div className="card-foot text-xs muted">Task, состояние запуска, artifacts и workflow state добавляются runtime как operational context.</div>
      </Card>
      <Card title={<span className="row"><Coins size={18}/>Экономика</span>} className="flow-economics"><div className="stack"><Field label="Модель"><Pick label="Модель Flow" value={cfg.model} onChange={value => change('model', value)} disabled={!editable || busy} options={models}/></Field><Field label="Лимит токенов на задачу" hint="Общий бюджет токенов для одного запуска Flow."><Input aria-label="Лимит токенов на задачу" type="number" min={1} max={10000000} step={1} value={cfg.tokenLimit ?? ''} placeholder="100000" onChange={event => change('tokenLimit', event.target.value ? Number(event.target.value) : undefined)} disabled={!editable || busy}/></Field><div className="flow-economics-estimate"><span>Приблизительная стоимость лимита</span><strong>{cost === undefined ? '—' : `≈ ${cost.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽`}</strong><small>{cost === undefined ? 'Задайте лимит токенов для расчёта.' : `${cfg.tokenLimit!.toLocaleString('ru-RU')} токенов на задачу`}</small></div><p className="flow-inspector-hint">Демонстрационный расчёт по условным тарифам. Это оценка бюджета, а не фактическая стоимость модели.</p>{cfg.tokenLimit !== undefined && issues.some(issue => issue.includes('токенов')) && <Notice title="Проверьте лимит">Лимит должен быть целым числом от 1 до 10 000 000.</Notice>}</div></Card>
    </div>{editable && <div className="actions"><Button disabled={busy || !dirty || issues.length > 0} onClick={() => {void save();}}><Save size={15}/>Сохранить сценарий</Button></div>}</details>
    <FlowLaunch open={launchOpen} onClose={() => setLaunchOpen(false)} cap={cap} config={cfg} dirty={dirty} save={save}/>
  </div>;
}
