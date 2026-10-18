'use client';
import {useEffect, useState} from 'react';
import {ChevronDown, Code2, Coins, FileCheck, FileText, Layers, Play, Plus, Save, Settings2, ShieldCheck, Workflow} from 'lucide-react';
import {useKontur} from './context';
import FlowEditor from './flow-editor';
import FlowLaunch from './flow-launch';
import {Button, Input, Card, Pill, Pick, Field, Notice, Blank, KV} from './ui';
import {copy, currentRelease, estimateTokenCost, flowIssues, getEditableFlowNodes, getFlowNodes, isDraftSaved, isRetiredPolicyStatus, normalizePolicyStatus, MODEL_OPTIONS, policyKey, policyStageAssignments, shortConfig, type Capability, type Config, type Policy, type PolicyStageId} from '@/lib/domain';

const policyStatusLabels: Record<string, string> = {Draft: 'Черновик', Current: 'Действует', Deprecating: 'Выводится из эксплуатации', Retired: 'Выведена из эксплуатации'};
const policyStageMeta: Record<PolicyStageId, {title:string; nodes:string; icon:typeof FileText}> = {
  requirements: {title: 'Требования', nodes: 'Анализ и Specification', icon: FileText},
  implementation: {title: 'Реализация', nodes: 'Implementation', icon: Code2},
  checks: {title: 'Проверки', nodes: 'Checks и Evidence', icon: FileCheck},
};

function editableConfig(config: Config, editable = true): Config {return {...copy(config), nodeConfigs: editable ? getEditableFlowNodes(config) : getFlowNodes(config)};}
function PolicyDeltaValues({current,previous,compared,empty}:{current:string[];previous:string[];compared:boolean;empty:string}) {
  const items = compared ? [...previous.filter(value=>!current.includes(value)).map(value=>({value,kind:'removed'})), ...current.map(value=>({value,kind:previous.includes(value)?'unchanged':'added'}))] : current.map(value=>({value,kind:'unchanged'}));
  return <div className="flow-policy-stage-values">{items.length?items.map(item=><span className={`flow-policy-stage-value ${item.kind}`} key={`${item.kind}-${item.value}`}>{item.kind==='added'&&<b>+</b>}{item.kind==='removed'&&<b>−</b>}<span>{item.value}</span></span>):<em>{empty}</em>}</div>;
}

export default function Configuration({cap}: {cap: Capability}) {
  const {state, team, product, act, can, busy, go} = useKontur();
  const release = currentRelease(cap);
  const source = cap.draft || release?.snapshot.config;
  const ownerTeam = state.teams.find(item => item.id === cap.teamId) || team;
  const owner = cap.teamId === team.id;
  const previousRelease = cap.draft ? cap.releases.find(item => item.id === cap.migrationFrom) || release : undefined;
  const [form, setForm] = useState<Config | undefined>(source ? editableConfig(source, !!cap.draft) : undefined);
  const [name, setName] = useState(cap.name);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [policyImpactOpen, setPolicyImpactOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {if (source) setForm(editableConfig(source, !!cap.draft)); setName(cap.name);}, [cap.draft?.revision, cap.name, release?.id]);
  if (!form || !source) return <Blank title="Конфигурация отсутствует"/>;
  const cfg = form;
  const editable = owner && !!cap.draft && can('Product Engineer');
  const materialize = editable && !cap.draft?.nodeConfigs;
  const hasEdits = editable && (name !== cap.name || JSON.stringify(cfg) !== JSON.stringify(editableConfig(cap.draft!)));
  const initialSaveRequired = editable && !isDraftSaved(cap);
  const dirty = initialSaveRequired || materialize || hasEdits;
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
  const policies = cfg.policies.map(key => state.policies.find(policy => policyKey(policy) === key)).filter((policy): policy is Policy => !!policy);
  const missingPolicies = cfg.policies.filter(key => !policies.some(policy => policyKey(policy) === key));
  const previousPolicyKeys = previousRelease?.snapshot.config.policies || [];
  const previousPolicies = previousPolicyKeys.map(key => state.policies.find(policy => policyKey(policy) === key)).filter((policy): policy is Policy => !!policy);
  const policyStages = (Object.keys(policyStageMeta) as PolicyStageId[]).map(stage => {
    const assignments = policies.map(policy => ({policy, assignment: policyStageAssignments(policy).find(item => item.stage === stage)!}));
    const previousAssignments = previousPolicies.map(policy => policyStageAssignments(policy).find(item => item.stage === stage)!);
    return {stage, skills: [...new Set(assignments.flatMap(item => item.assignment.skills))], subagents: [...new Set(assignments.flatMap(item => item.assignment.subagents))], previousSkills: [...new Set(previousAssignments.flatMap(item=>item.skills))], previousSubagents: [...new Set(previousAssignments.flatMap(item=>item.subagents))]};
  });
  const policyEvidence = [...new Set(policies.flatMap(policy=>policy.evidence.map(rule=>String(rule.artifacts||rule.verificationSkill||'')).filter(Boolean)))];
  const previousPolicyEvidence = [...new Set(previousPolicies.flatMap(policy=>policy.evidence.map(rule=>String(rule.artifacts||rule.verificationSkill||'')).filter(Boolean)))];
  return <div className="stack">
    {!owner && <Notice tone="blue" title={`Общий Flow продукта · владелец ${ownerTeam.name}`}>Конфигурацию меняет команда-владелец. Вы можете запускать задачи своей команды с тегом #{cap.tag}.</Notice>}
    {owner && !cap.draft && <Notice tone="blue" title="Released configuration · immutable" action={<Button size="sm" disabled={!can('Product Engineer') || busy} onClick={() => {void act('clone_release', {capabilityId: cap.id, releaseId: release?.id});}}><Plus size={14}/>Новая версия</Button>}>Изменения сохраняются в новой версии Flow.</Notice>}
    <header className="flow-editor-header"><div className="flow-editor-basis"><span className="icon-tile"><Workflow size={19}/></span><div><strong>{cfg.runtime} · {shortConfig(cfg)}</strong><div className="row wrap"><Pill tone="green">#{cap.tag}</Pill><Pill>Командное пространство · {ownerTeam.name}</Pill><Pill tone={cfg.mode === 'SDD' ? 'purple' : 'blue'}>{cfg.mode}</Pill><span className={dirty ? 'flow-save-pending' : 'flow-save-complete'}>{hasEdits ? 'Есть несохранённые изменения' : materialize ? 'Настройки узлов готовы к сохранению' : initialSaveRequired ? 'Workflow ещё не сохранён' : saved ? `Сохранено в пространстве команды · v${cfg.version}` : cap.draft ? `Сохранено в пространстве команды · v${cfg.version}` : 'Released snapshot'}</span></div></div></div>
      <div className="row wrap"><Button variant="outline" disabled={busy} onClick={() => go('catalog', encodeURIComponent(cap.tag), 'Flow')}><Layers size={15}/>Каталог сценариев</Button>{editable && <Button variant="outline" disabled={busy || !dirty || issues.length > 0} onClick={() => {void save();}}><Save size={15}/>Сохранить сценарий</Button>}<Button title={dirty ? 'Сначала сохраните Workflow' : undefined} onClick={() => setLaunchOpen(true)} disabled={busy || dirty || !can('Product Engineer')}><Play size={16}/>Запустить задачу</Button></div>
    </header>
    <details className="flow-policy-impact" aria-label="Влияние политик на Flow" open={policyImpactOpen} onToggle={event=>setPolicyImpactOpen(event.currentTarget.open)}>
      <summary><span className="flow-policy-impact-icon"><ShieldCheck size={19}/></span><div><span className="eyebrow">POLICY IMPACT</span><h2>Как политики влияют на Flow</h2><p>Текст политики действует на все шаги; инструменты назначаются по этапам.</p></div><Pill tone={missingPolicies.length ? 'amber' : 'green'}>{cfg.policies.length} Policy Package</Pill><ChevronDown className="flow-policy-impact-chevron" size={17}/></summary>
      <div className="flow-policy-impact-body">{policies.length ? <><div className="flow-policy-context"><strong>Текст политики · все шаги</strong>{policies.flatMap(policy => policy.requirements.map(requirement => <article key={`${policyKey(policy)}-${requirement.id}-${requirement.version}`}><span className="mono">{policyKey(policy)}</span><p>{requirement.text || requirement.title || requirement.id}</p></article>))}</div><div className="flow-policy-stages">{policyStages.map(({stage, skills, subagents, previousSkills, previousSubagents}) => {const meta=policyStageMeta[stage], Icon=meta.icon;return <article key={stage}><header><span><Icon size={16}/></span><div><strong>{meta.title}</strong><small>{meta.nodes}</small></div></header><div><span>Skills</span><PolicyDeltaValues current={skills} previous={previousSkills} compared={!!previousRelease} empty="Без дополнительных skills"/></div><div><span>Subagents</span><PolicyDeltaValues current={subagents} previous={previousSubagents} compared={!!previousRelease} empty="Не назначены"/></div>{stage==='checks'&&<div><span>Evidence</span><PolicyDeltaValues current={policyEvidence} previous={previousPolicyEvidence} compared={!!previousRelease} empty="Отчёт по требованиям политики"/></div>}</article>})}</div></> : <Notice title="Политики не подключены">Выберите действующий Policy Package в Regulatory Context. Без него влияние требований и регуляторные проверки не будут зафиксированы в версии Flow.</Notice>}{!!missingPolicies.length&&<p className="flow-policy-missing">Не найдены версии: {missingPolicies.join(', ')}</p>}</div>
    </details>
    <FlowEditor config={cfg} savedConfig={source} flowName={name} ownerTeam={ownerTeam} onNameChange={value => {setName(value); setSaved(false);}} editable={editable} busy={busy} dirty={dirty} onChange={config => {setForm(config); setSaved(false);}} onSave={save}/>
    <div className="flow-under-actions">{editable && <span className="flow-version-note">Каждое сохранение изменений создаёт следующую версию Flow в пространстве {ownerTeam.name}.</span>}<Button variant="ghost" onClick={() => go('tasks')}>Открыть задачи на доске</Button>{latestRun && <Button variant="outline" onClick={() => go('run', latestRun.id)}>Последний запуск · {latestRun.id}</Button>}{editable && hasEdits && <Button variant="ghost" disabled={busy} onClick={() => {setForm(editableConfig(cap.draft!)); setName(cap.name); setSaved(false);}}>Отменить изменения</Button>}</div>
    <details className="flow-common-settings"><summary><span className="row"><Settings2 size={18}/><strong>Общие настройки Flow</strong></span><span>Context Supply Chain · Экономика</span></summary><div className="flow-settings-v14-grid">
      <Card title="Context Supply Chain" body={false}>
        <div className="context-layer"><span className="layer-num">01</span><div className="flex-1"><h3>Знания продукта</h3><p className="task-sub mb-3">Единый approved graph продукта {product.name}</p><Pick label="Product Knowledge version" value={String(cfg.productKnowledge)} onChange={value => change('productKnowledge', Number(value))} disabled={!editable} options={Array.from({length: product.knowledgeVersion}, (_, index) => ({value: String(index + 1), label: `Product Knowledge @${index + 1}`}))}/></div></div>
        <div className="context-layer"><span className="layer-num">02</span><div className="flex-1"><h3>Regulatory Context</h3><p className="task-sub mb-3">Для каждого сегмента достаточно одного действующего пакета информационной безопасности.</p><div className="stack gap-3">{Array.from(new Set(ownerTeam.bindings.filter(binding => binding.type === 'Repository' && cfg.repos.includes(binding.name)).map(binding => binding.segment))).map(segment => {const policies = state.policies.filter(policy => policy.direction === 'Information Security' && policy.segment === segment); return <Field key={`${segment}-Information Security`} label={`${segment} · Information Security`}><Pick label={`${segment} · Information Security`} value={cfg.policies.find(key => policies.some(policy => policyKey(policy) === key)) || ''} onChange={value => change('policies', [...cfg.policies.filter(key => !policies.some(policy => policyKey(policy) === key)), value])} disabled={!editable} options={policies.map(policy => ({value: policyKey(policy), label: `${policyKey(policy)} · ${policyStatusLabels[normalizePolicyStatus(policy.status)] || policy.status}`, disabled: policy.status === 'Draft' || isRetiredPolicyStatus(policy.status)}))}/></Field>;})}</div></div></div>
        <div className="context-layer"><span className="layer-num">03</span><div className="flex-1"><h3>Знания команды</h3><p className="task-sub mb-3">Conventions, подтверждённые lessons и patterns команды {ownerTeam.name}</p><Pick label="Team Knowledge version" value={String(cfg.teamKnowledge)} onChange={value => change('teamKnowledge', Number(value))} disabled={!editable} options={Array.from({length: ownerTeam.knowledgeVersion}, (_, index) => ({value: String(index + 1), label: `Team Knowledge @${index + 1}`}))}/></div></div>
        <div className="card-foot text-xs muted">Task, состояние запуска, artifacts и workflow state добавляются runtime как operational context.</div>
      </Card>
      <Card title={<span className="row"><Coins size={18}/>Экономика</span>} className="flow-economics"><div className="stack"><Field label="Модель"><Pick label="Модель Flow" value={cfg.model} onChange={value => change('model', value)} disabled={!editable || busy} options={models}/></Field><Field label="Лимит токенов на задачу" hint="Общий бюджет токенов для одного запуска Flow."><Input aria-label="Лимит токенов на задачу" type="number" min={1} max={10000000} step={1} value={cfg.tokenLimit ?? ''} placeholder="100000" onChange={event => change('tokenLimit', event.target.value ? Number(event.target.value) : undefined)} disabled={!editable || busy}/></Field><div className="flow-economics-estimate"><span>Приблизительная стоимость лимита</span><strong>{cost === undefined ? '—' : `≈ ${cost.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽`}</strong><small>{cost === undefined ? 'Задайте лимит токенов для расчёта.' : `${cfg.tokenLimit!.toLocaleString('ru-RU')} токенов на задачу`}</small></div><p className="flow-inspector-hint">Демонстрационный расчёт по условным тарифам. Это оценка бюджета, а не фактическая стоимость модели.</p>{cfg.tokenLimit !== undefined && issues.some(issue => issue.includes('токенов')) && <Notice title="Проверьте лимит">Лимит должен быть целым числом от 1 до 10 000 000.</Notice>}</div></Card>
    </div>{editable && <div className="actions"><Button disabled={busy || !dirty || issues.length > 0} onClick={() => {void save();}}><Save size={15}/>Сохранить сценарий</Button></div>}</details>
    <FlowLaunch open={launchOpen} onClose={() => setLaunchOpen(false)} cap={cap} config={source} dirty={dirty}/>
  </div>;
}
