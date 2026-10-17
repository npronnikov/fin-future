'use client';
import {DEFAULT_SECURITY_RULE} from '@/lib/demo-v16';
import ContextSegmentation from './context-segmentation';
import EvidenceRegistry from './evidence-registry';
import {useEffect, useState} from 'react';
import {Check, ChevronDown, FileCheck, FileText, Layers, Lock, Plus, Search, Trash2, Users} from 'lucide-react';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog';
import {useKontur} from './context';
import {Button, Input, Textarea, Card, PageHead, Pill, Status, Pick, Modal, Field, Tabs, TabsList, TabsTrigger, TabsContent, KV, Notice, TextLink, Blank} from './ui';
import {copy, normalizePolicyStatus, POLICY_STATUSES, POLICY_STAGE_IDS, policyKey, policyStageAssignments, type Asset, type Item, type Policy, type PolicyStageId} from '@/lib/domain';

interface RuleDraft {
  key: string;
  original?: Item;
  text: string;
  references: string;
  applicability: Item[];
  evidence: Item[];
}
interface PackageDraft {
  id: string;
  existing: boolean;
  direction: string;
  segment: string;
  effective: string;
  changelog: string;
  rules: RuleDraft[];
  stages: Record<PolicyStageId, {skills: string[]; subagents: string[]}>;
  sharedApplicability: Item[];
  sharedEvidence: Item[];
}
let nextRule = 0;
const newRule = (): RuleDraft => ({key: `new-rule-${++nextRule}`, text: DEFAULT_SECURITY_RULE, references: 'Approved Component Registry', applicability: [{tag:'dep-update',workType:'dependency_change',artifactType:'dependency manifest'}], evidence: [{artifacts:'Итоговый manifest; approved registry reference; Jenkins test report; vulnerability report',verificationSkill:''}]});
const assetKey = (asset: Asset) => `${asset.id}@${asset.version}`;
const directionLabels: Record<string, string> = {'Information Security': 'Информационная безопасность', Reliability: 'Надёжность', Risk: 'Риск'};
const assetTypeLabels: Record<string, string> = {Skills: 'Скиллы', Subagents: 'Сабагенты'};
const statusLabels: Record<string, string> = {Draft: 'Черновик', Current: 'Действует', Deprecating: 'Выводится из эксплуатации', Retired: 'Выведена из эксплуатации', Withdrawn: 'Выведена из эксплуатации', Revoked: 'Выведена из эксплуатации', Superseded: 'Выведена из эксплуатации'};
const policyStageMeta: Record<PolicyStageId, {label: string; description: string}> = {
  requirements: {label: 'Требования', description: 'Разобрать задачу, применить текст политики и сформировать обязательные требования.'},
  implementation: {label: 'Реализация', description: 'Применять политику во время изменений и удерживать реализацию в разрешённых границах.'},
  checks: {label: 'Проверки', description: 'Проверить соблюдение политики и собрать подтверждающие артефакты.'},
};
const workTypes = [
  {value: '__all', label: 'Любая работа'},
  {value: 'dependency_change', label: 'Изменение зависимостей'},
  {value: 'implementation', label: 'Реализация'},
  {value: 'verification', label: 'Проверки'},
  {value: 'implementation, verification', label: 'Реализация и проверки'},
];
const workLabel = (value: string) => workTypes.find(item => item.value === value)?.label || value;

function AssetPicker({type, assets, selected, onChange, disabled}: {type: 'Skills' | 'Subagents'; assets: Asset[]; selected: string[]; onChange: (value: string[]) => void; disabled: boolean}) {
  const [search, setSearch] = useState('');
  const catalog = assets.filter(asset => asset.type === type);
  const shown = catalog.filter(asset => `${asset.name} ${assetKey(asset)} ${asset.instruction || ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const Icon = type === 'Skills' ? FileCheck : Users;
  function toggle(key: string) {onChange(selected.includes(key) ? selected.filter(item => item !== key) : [...selected, key]);}
  return <div className="policy-asset-picker">
    <div className="policy-composer-description"><h3>{type === 'Skills' ? 'Скиллы для выполнения политик' : 'Сабагенты для выполнения политик'}</h3><p>Выберите элементы из каталога. В пакет сохраняются точные версии.</p></div>
    <div className="policy-asset-search"><Search size={16}/><Input aria-label={`Поиск: ${assetTypeLabels[type]}`} placeholder={`Найти: ${assetTypeLabels[type].toLowerCase()}`} value={search} onChange={event => setSearch(event.target.value)}/></div>
    <div className="policy-asset-grid">{shown.map(asset => {
      const key = assetKey(asset), active = selected.includes(key), unavailable = ['Withdrawn', 'Revoked', 'Superseded'].includes(asset.status);
      return <button className={`policy-asset-option ${active ? 'selected' : ''}`} type="button" key={key} aria-pressed={active} aria-label={`${active ? 'Убрать' : 'Добавить'} ${key}`} disabled={disabled || unavailable && !active} onClick={() => toggle(key)}>
        <span className="policy-asset-option-top"><Icon size={18}/><span className="policy-asset-version">v{asset.version}</span><span className="policy-asset-check">{active ? <Check size={13}/> : <Plus size={13}/>}</span></span>
        <strong>{asset.name}</strong><small>{key}</small><p>{asset.instruction || asset.changelog}</p><span className="policy-asset-status">{asset.status}{unavailable ? ' · недоступен для новой версии' : ''}</span>
      </button>;
    })}</div>
    {selected.filter(key => !catalog.some(asset => assetKey(asset) === key)).map(key => <div className="policy-missing-asset" key={key}><Lock size={15}/><span>{key}<small>Закреплённая версия отсутствует в каталоге.</small></span><Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => toggle(key)}>Убрать</Button></div>)}
    {!shown.length && <p className="subtext">{search ? 'По запросу ничего не найдено.' : `В каталоге пока нет раздела «${assetTypeLabels[type]}».`}</p>}
  </div>;
}

function PackageAssets({type, keys, assets, onOpen}: {type: 'Skills' | 'Subagents'; keys: string[]; assets: Asset[]; onOpen: (key: string) => void}) {
  const Icon = type === 'Skills' ? FileCheck : Users;
  return <Card title={assetTypeLabels[type]} action={<Pill>{keys.length}</Pill>}><div className="policy-package-assets">{keys.map(key => {
    const asset = assets.find(item => assetKey(item) === key);
    return <button type="button" key={key} className="policy-package-asset" onClick={() => onOpen(key)}><span className="policy-package-asset-icon"><Icon size={18}/></span><span><strong>{asset?.name || key}</strong><small>{key}</small>{asset?.instruction && <p>{asset.instruction}</p>}</span></button>;
  })}{!keys.length && <p className="subtext">{assetTypeLabels[type]} не подключены.</p>}</div></Card>;
}

export default function Regulation() {
  const {state, actor, team, product, go, ref, tab: regTab, act, can, busy} = useKontur();
  const referenced = state.policies.find(policy => policyKey(policy) === ref);
  const workspaceSegment = team.bindings.find(binding => binding.type === 'Repository')?.segment || product.segment || 'retail.backend';
  const [segment, setSegment] = useState(referenced?.segment || workspaceSegment);
  const allowedDirections=actor.role==='Regulator'?(actor.directions||[]).slice(0,1):['Information Security','Reliability','Risk'];
  const [direction, setDirection] = useState(referenced?.direction || allowedDirections[0] || 'Information Security');
  const [selected, setSelected] = useState(ref || 'IS-corporate-backend@7');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState('rules');
  const [statusForm, setStatusForm] = useState<Item | null>(null);
  const [editor, setEditor] = useState<PackageDraft | null>(null);
  const [editorTab, setEditorTab] = useState('rules');
  const [visitedStages, setVisitedStages] = useState<PolicyStageId[]>([]);
  const [error, setError] = useState('');
  const [critical, setCritical] = useState(false);
  useEffect(() => {if (referenced&&allowedDirections.includes(referenced.direction)) {setSegment(referenced.segment); setDirection(referenced.direction); setSelected(policyKey(referenced));}else {setSegment(workspaceSegment);if(!allowedDirections.includes(direction)&&allowedDirections[0])setDirection(allowedDirections[0]);}}, [ref,actor.id,team.id,product.id,workspaceSegment]);
  const policies = state.policies.filter(policy => policy.segment === segment && policy.direction === direction);
  const policy = policies.find(policy => policyKey(policy) === selected) || policies[0];
  const editable = can('Regulator') && actor.directions?.includes(direction);
  const key = policy && policyKey(policy);
  const affected = state.capabilities.filter(capability => capability.releases.some(release => release.stage === 'production' && release.status !== 'superseded' && release.snapshot.config.policies.includes(key || '')));
  const teams = new Set(affected.map(capability => capability.teamId));
  const repos = new Set(affected.flatMap(capability => capability.releases.filter(release => release.stage === 'production' && release.status !== 'superseded').flatMap(release => release.snapshot.config.repos)));
  const verificationSkills = state.assets.filter(asset => asset.type === 'Skills' && !['Withdrawn', 'Revoked', 'Superseded'].includes(asset.status));
  const nextVersion = editor ? Math.max(0, ...state.policies.filter(policy => policy.id === editor.id.trim()).map(policy => policy.version)) + 1 : 1;

  function edit(source?: Policy) {
    const references = new Set((source?.requirements || []).map(requirement => `${requirement.id}@${requirement.version}`));
    setError(''); setEditorTab('rules'); setVisitedStages([]);
    const assignments = policyStageAssignments(source || {skills: [], subagents: []});
    setEditor({
      id: source?.id || `IS-DEPENDENCY-${Date.now().toString(36).toUpperCase()}`, existing: !!source, direction, segment: source?.segment || workspaceSegment, effective: new Date().toISOString().slice(0, 10), changelog: '',
      rules: source?.requirements.length ? source.requirements.map(requirement => {
        const key = `${requirement.id}@${requirement.version}`;
        return {key, original: copy(requirement), text: requirement.text || '', references: requirement.references || '', applicability: copy(source.applicability.filter(rule => rule.requirement === key)), evidence: copy(source.evidence.filter(rule => rule.requirement === key))};
      }) : [newRule()],
      stages: Object.fromEntries(assignments.map(item => [item.stage, {skills: [...item.skills], subagents: [...item.subagents]}])) as PackageDraft['stages'],
      sharedApplicability: copy((source?.applicability || []).filter(rule => !references.has(rule.requirement))),
      sharedEvidence: copy((source?.evidence || []).filter(rule => !references.has(rule.requirement))),
    });
  }
  function updateRule(index: number, patch: Partial<RuleDraft>) {
    setEditor(current => current ? {...current, rules: current.rules.map((rule, position) => position === index ? {...rule, ...patch} : rule)} : current);
  }
  async function savePolicy(event: React.FormEvent) {
    event.preventDefault();
    if (!editor) return;
    setError('');
    if (!editor.rules.length || editor.rules.some(rule => !rule.text.trim())) {setError('Заполните текст каждого правила или удалите пустую карточку.'); setEditorTab('rules'); return;}
    for (const stage of POLICY_STAGE_IDS) {
      if (!visitedStages.includes(stage)) {setError(`Пройдите этап «${policyStageMeta[stage].label}» и настройте его применение.`); setEditorTab(stage); setVisitedStages(current => current.includes(stage) ? current : [...current, stage]); return;}
      if (!editor.stages[stage].skills.length) {setError(`Этап «${policyStageMeta[stage].label}»: добавьте хотя бы один скилл.`); setEditorTab(stage); return;}
    }
    try {
      const ids = new Set(editor.rules.map(rule => rule.original?.id).filter(Boolean));
      let sequence = 0;
      const requirements: Item[] = [], applicability: Item[] = copy(editor.sharedApplicability), evidence: Item[] = copy(editor.sharedEvidence);
      for (const rule of editor.rules) {
        let id = rule.original?.id;
        if (!id) {do {id = `${editor.id.trim().slice(0, 110)}-R${String(++sequence).padStart(3, '0')}`;} while (ids.has(id)); ids.add(id);}
        const changed = rule.original && (rule.original.text?.trim() !== rule.text.trim() || (rule.original.references || '') !== rule.references);
        const version = rule.original ? Number(rule.original.version) + (changed ? 1 : 0) : 1;
        const requirementKey = `${id}@${version}`;
        requirements.push({...rule.original, id, version, text: rule.text.trim(), references: rule.references, owner: rule.original?.owner || editor.direction, segment: editor.segment, effective: changed || !rule.original ? editor.effective : rule.original.effective, status: changed || !rule.original ? 'Draft' : rule.original.status, supersedes: changed ? `${id}@${rule.original?.version}` : rule.original?.supersedes || ''});
        applicability.push(...rule.applicability.map(item => ({...item, requirement: requirementKey})));
        evidence.push(...rule.evidence.map(item => ({...item, requirement: requirementKey})));
      }
      const stages = POLICY_STAGE_IDS.map(stage => ({stage, skills: editor.stages[stage].skills, subagents: editor.stages[stage].subagents}));
      const result = await act('save_policy', {id: editor.id, direction: editor.direction, segment: editor.segment, effective: editor.effective, changelog: editor.changelog, requirements, applicability, evidence, stages});
      if (result?.ok) {setSelected(result.id); setEditor(null);}
    } catch (caught) {setError(caught instanceof Error ? caught.message : 'Не удалось сохранить пакет политик.');}
  }
  async function statusSave() {
    if (!statusForm) return;
    const result = await act('policy_status', statusForm);
    if (result?.ok) {setStatusForm(null); setCritical(false);}
  }

  const statusPolicy = state.policies.find(item=>policyKey(item)===statusForm?.policyKey);
  const peerReviewer = state.people.find(person=>person.role==='Regulator'&&person.id!==statusPolicy?.createdBy&&person.directions?.includes(statusPolicy?.direction||direction));
  const simulatedPeerApproval = statusPolicy?.createdBy===actor.id&&!!peerReviewer;
  if(regTab==='evidence')return <EvidenceRegistry/>;
  if(regTab==='segmentation')return <div className="page"><PageHead title="Регуляторы · сегментация систем" actions={<Button variant="outline" onClick={()=>go('regulation')}>Пакеты политик</Button>}/><ContextSegmentation/></div>;
  return <div className="page policy-page"><PageHead title="Регуляторы" description={actor.role==='Regulator'?`${actor.name} · персональный контур «${directionLabels[direction]}»`:'Все политики безопасности, рисков и надёжности · только чтение'} actions={<>{actor.role==='Regulator'&&<Button variant="outline" onClick={()=>go('regulation','','evidence')}><FileCheck size={15}/>Evidence Registry</Button>}{(actor.role!=='Regulator'||allowedDirections.includes('Information Security'))&&<Button variant="outline" onClick={()=>go('regulation','','segmentation')}>Сегментация систем</Button>}<Button disabled={!editable} onClick={() => edit()}><Plus size={16}/>Новый пакет политик</Button></>}/>
    <div className="row wrap mb-6"><Pick label="Бизнес-направление" value={segment.split('.')[0]} onChange={value => setSegment(`${value}.${segment.split('.')[1]}`)} options={[{value: 'retail', label: 'Розница'}, {value: 'corporate', label: 'Корпоративный'}]}/><span className="muted">/</span><Pick label="Тип платформы" value={segment.split('.')[1]} onChange={value => setSegment(`${segment.split('.')[0]}.${value}`)} options={[{value: 'frontend', label: 'Фронтенд'}, {value: 'backend', label: 'Бэкенд'}, {value: 'data', label: 'Данные'}]}/><Pill><Lock size={12}/>{segment}</Pill><div className="flex-1"/><span className="task-sub">{editable ? 'Рабочее пространство регулятора' : 'Только чтение'}</span></div>
    <Tabs value={direction} onValueChange={setDirection} className="section-tabs"><TabsList>{allowedDirections.map(item => <TabsTrigger key={item} value={item}>{directionLabels[item]}</TabsTrigger>)}</TabsList></Tabs>
    <div className="mt-6">{policy ? <div className="main-grid"><div className="stack">
      <Card title="Пакет политик" action={<Status value={policy.status}/>}><div className="row between wrap"><Pick label="Версия пакета политик" value={key || ''} onChange={setSelected} options={policies.map(policy => ({value: policyKey(policy), label: `${policyKey(policy)} · ${statusLabels[policy.status] || policy.status}`}))}/><Button variant="outline" size="sm" disabled={!editable} onClick={() => edit(policy)}>Новая версия</Button></div>
        <div className="policy-composition-summary"><div><FileText size={18}/><strong>{policy.requirements.length}</strong><span>Текст политики</span></div><div><Layers size={18}/><strong>3</strong><span>Этапа применения</span></div><div><Users size={18}/><strong>{policy.skills.length + (policy.subagents?.length || 0)}</strong><span>Закреплённых skills и subagents</span></div></div>
        <div className="grid-2 mt-4"><div><KV label="Владелец">{directionLabels[policy.owner] || policy.owner}</KV><KV label="Сегмент">{policy.segment}</KV></div><div><KV label="Дата вступления">{policy.effective}</KV><KV label="Заменяет">{policy.supersedes || '—'}</KV></div></div>
        {policy.sunset && <div className="mt-4"><Notice title={`Дата прекращения: ${new Date(policy.sunset).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'})}`}>Статус «Выводится из эксплуатации» разрешает работу в течение переходного периода. Выпущенные возможности сохраняют закреплённую версию политики.</Notice></div>}
        <p className="subtext mt-4">{policy.changelog}</p><div className="actions"><Button variant="outline" onClick={() => {setDetailsTab('rules');setDetailsOpen(true);}}><FileText size={15}/>Просмотреть состав</Button><Button variant="outline" disabled={!editable} onClick={() => setStatusForm({policyKey: key, status: normalizePolicyStatus(policy.status), sunset: policy.sunset})}>Изменить статус жизненного цикла</Button></div>
      </Card>
    </div><div className="stack"><Card title="Анализ влияния"><p className="mono text-sm text-[#365b40] mb-5">{key}</p><div className="graph-row flex-wrap"><div className="graph-box"><strong>{repos.size}</strong><p>Репозитории</p></div><div className="graph-box"><strong>{teams.size}</strong><p>Команды</p></div></div><div className="graph-box mt-3"><strong>{affected.length}</strong><p>Доверенные возможности</p></div><div className="divider"/>{affected.map(capability => <div className="py-3" key={capability.id}><TextLink onClick={() => go('capability', capability.id, 'releases')}>{capability.name}</TextLink><p className="task-sub">{state.teams.find(team => team.id === capability.teamId)?.name}</p></div>)}{!affected.length && <p className="subtext">Нет зависимых выпусков.</p>}</Card>
      <Card title="Жизненный цикл политики"><div className="stack gap-3">{POLICY_STATUSES.map(status => <div key={status} className="row"><span className={`step-circle ${normalizePolicyStatus(policy.status) === status ? 'bg-[#628057]! text-white!' : ''}`}>{normalizePolicyStatus(policy.status) === status ? <Check size={13}/> : <span className="w-1 h-1 rounded-full bg-[#ccd8c3]"/>}</span><span className="text-sm">{statusLabels[status]}</span></div>)}</div></Card><Notice tone="blue" title="Закрепление версии политики">Новая версия пакета не заменяет версию действующего выпуска. Для изменения нужна новая конфигурация возможности.</Notice>
    </div></div> : <Card><Blank title={`Нет пакетов политик · ${segment}`} text={`${directionLabels[direction] || direction}: задайте текст политики и её применение на этапах требований, реализации и проверок.`} action={<Button disabled={!editable} onClick={() => edit()}>Создать пакет политик</Button>}/></Card>}</div>

    <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Состав пакета политик" description={key || ''} wide>{policy && <Tabs value={detailsTab} onValueChange={setDetailsTab}><TabsList className="policy-composer-tabs"><TabsTrigger value="rules"><FileText size={14}/>Текст политики · {policy.requirements.length}</TabsTrigger><TabsTrigger value="application"><Layers size={14}/>Применение · 3 этапа</TabsTrigger></TabsList>
      <TabsContent value="rules"><div className="policy-rule-list">{policy.requirements.map((requirement, index) => {
        const requirementKey = `${requirement.id}@${requirement.version}`, rules = policy.applicability.filter(rule => !rule.requirement || rule.requirement === requirementKey), evidence = policy.evidence.filter(rule => rule.requirement === requirementKey);
        return <article className="policy-rule-read" key={requirementKey}><div className="policy-rule-read-head"><span className="policy-rule-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{requirementKey}</h3><small>{requirement.owner || policy.owner}</small></div>{requirement.status && <Status value={requirement.status}/>}</div><p className="policy-rule-text">{requirement.text}</p>
          <div className="policy-rule-metadata"><KV label="Дата вступления">{requirement.effective || policy.effective}</KV><KV label="Заменяет">{requirement.supersedes || '—'}</KV></div>
          <div className="policy-rule-context"><span className="policy-rule-context-label">Применимость</span>{rules.length ? rules.map((rule, position) => <div key={position} className="row wrap"><Pill>{rule.segment || policy.segment}</Pill>{(rule.tag || rule.taskClass) && <Pill tone="blue">#{rule.tag || rule.taskClass}</Pill>}{rule.workType && <span>{workLabel(rule.workType)}</span>}{rule.artifactType && <span>· {rule.artifactType}</span>}</div>) : <p>Все задачи в сегменте {policy.segment}.</p>}</div>
          {!!evidence.length && <div className="policy-rule-context"><span className="policy-rule-context-label">Подтверждение выполнения</span>{evidence.map((rule, position) => <div key={position}><p>{rule.artifacts}</p>{rule.verificationSkill && <TextLink onClick={() => go('catalog', rule.verificationSkill, 'Skills')}>{rule.verificationSkill}</TextLink>}</div>)}</div>}
          {requirement.references && <div className="policy-rule-context"><span className="policy-rule-context-label">Источники</span><p>{requirement.references}</p></div>}
        </article>;
      })}{!policy.requirements.length && <p className="subtext">В этой версии текстовые правила не заданы.</p>}</div></TabsContent>
      <TabsContent value="application"><Notice tone="blue" title="Контракт оркестратора">Текст политики передаётся в контекст каждого этапа. Оркестратор должен подключить закреплённые версии skills и subagents на соответствующем этапе.</Notice><div className="policy-stage-read-list">{policyStageAssignments(policy).map((assignment, index) => <section className="policy-stage-read" key={assignment.stage}><header><span className="policy-rule-number">{index + 1}</span><div><strong>{policyStageMeta[assignment.stage].label}</strong><p>{policyStageMeta[assignment.stage].description}</p></div></header><div className="policy-assets-read-grid"><PackageAssets type="Skills" keys={assignment.skills} assets={state.assets} onOpen={asset => go('catalog', asset, 'Skills')}/><PackageAssets type="Subagents" keys={assignment.subagents} assets={state.assets} onOpen={asset => go('catalog', asset, 'Subagents')}/></div></section>)}</div></TabsContent>
    </Tabs>}</Modal>

    <Modal open={!!statusForm} onClose={() => setStatusForm(null)} title="Жизненный цикл политики" description={statusForm?.policyKey}>{statusForm && <div className="stack"><Notice tone={simulatedPeerApproval?'amber':'blue'} title={simulatedPeerApproval?'Демо: вторая рука эмулируется':'Контроль направления'}>{simulatedPeerApproval?`Подтверждение будет записано от имени «${peerReviewer?.name}» без переключения роли. В реальном приложении второй регулятор подтверждает решение самостоятельно.`:`Направление закреплено за ролью «${actor.name}». Решение и личность регулятора сохраняются в аудите.`}</Notice><Field label="Статус"><Pick label="Статус жизненного цикла политики" value={statusForm.status} onChange={value => setStatusForm({...statusForm, status: value})} options={POLICY_STATUSES.map(value => ({value, label: statusLabels[value]}))}/></Field>{statusForm.status === 'Deprecating' && <Field label="Дата прекращения"><Input type="date" value={statusForm.sunset} onChange={event => setStatusForm({...statusForm, sunset: event.target.value})}/></Field>}{statusForm.status === 'Retired' && <Notice tone="red" title="Новые автономные запуски будут запрещены">Зависимые доверенные возможности будут приостановлены. Исторические запуски и выпуски останутся доступны.</Notice>}<div className="actions"><Button variant="outline" onClick={() => setStatusForm(null)}>Отмена</Button><Button disabled={busy||!can('Regulator')} onClick={() => statusForm.status === 'Retired' ? setCritical(true) : statusSave()}>Применить статус</Button></div></div>}</Modal>
    <AlertDialog open={critical} onOpenChange={setCritical}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{statusForm ? statusLabels[statusForm.status] || statusForm.status : ''} · {statusForm?.policyKey}</AlertDialogTitle><AlertDialogDescription>Действие приостановит зависимые возможности и запретит новые автономные запуски. Затронуто возможностей: {affected.length}. В демо подтверждение второй рукой эмулируется.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction onClick={statusSave}>Подтвердить изменение</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

    <Modal open={!!editor} onClose={() => setEditor(null)} title={editor?.existing ? 'Пакет политик · новая версия' : 'Собрать пакет политик'} description="Текст политики и применение на трёх этапах" wide>{editor && <form onSubmit={savePolicy} className="stack policy-composer">
      <div className="form-grid"><Field label="Идентификатор политики"><Input value={editor.id} readOnly={editor.existing} onChange={event => setEditor({...editor, id: event.target.value})} required/></Field><Field label="Дата вступления"><Input type="date" value={editor.effective} onChange={event => setEditor({...editor, effective: event.target.value})} required/></Field></div>
      <div className="row wrap"><Pill>{editor.segment}</Pill><Pill>{directionLabels[editor.direction] || editor.direction}</Pill><Pill tone="blue">Черновик · v{nextVersion}</Pill></div>
      <Tabs value={editorTab} onValueChange={value => {setEditorTab(value); if (POLICY_STAGE_IDS.includes(value as PolicyStageId)) setVisitedStages(current => current.includes(value as PolicyStageId) ? current : [...current, value as PolicyStageId]);}}><TabsList className="policy-composer-tabs"><TabsTrigger value="rules"><FileText size={14}/>Политика · текст</TabsTrigger>{POLICY_STAGE_IDS.map((stage, index) => {const complete=visitedStages.includes(stage)&&editor.stages[stage].skills.length>0;return <TabsTrigger value={stage} key={stage}>{complete?<Check size={14}/>:<span className="policy-stage-index">{index + 1}</span>}{policyStageMeta[stage].label}</TabsTrigger>;})}</TabsList>
        <TabsContent value="rules"><div className="policy-composer-description"><h3>Текст политики</h3><p>Сформулируйте обязательные правила. Этот текст всегда будет передан в контекст каждого из трёх этапов.</p></div><div className="policy-rule-editor-list">{editor.rules.map((rule, index) => <section className="policy-rule-editor" key={rule.key}>
          <header><span className="policy-rule-number">{String(index + 1).padStart(2, '0')}</span><strong>Правило {index + 1}</strong>{rule.original && <small>{rule.original.id}@{rule.original.version}</small>}<Button type="button" size="icon" variant="ghost" aria-label={`Удалить правило ${index + 1}`} disabled={busy} onClick={() => setEditor({...editor, rules: editor.rules.filter((_, position) => position !== index)})}><Trash2 size={15}/></Button></header>
          <Field label={`Текст правила ${index + 1}`}><Textarea rows={4} value={rule.text} onChange={event => updateRule(index, {text: event.target.value})} placeholder="Например: при обновлении библиотек использовать только сертифицированные версии."/></Field>
          <details className="policy-rule-options"><summary>Применимость и проверка<ChevronDown size={14}/></summary><div className="policy-rule-options-body">
            <div className="policy-rule-options-section"><h4>Применимость</h4>{!rule.applicability.length && <p className="form-hint">Правило применяется ко всем задачам выбранного сегмента.</p>}{rule.applicability.map((condition, position) => <div className="policy-condition-row" key={position}><div className="form-grid"><Field label={`Тег · правило ${index + 1} · условие ${position + 1}`}><Input value={condition.tag ?? condition.taskClass ?? ''} placeholder="Любой тег" onChange={event => updateRule(index, {applicability: rule.applicability.map((item, order) => order === position ? {...item, tag: event.target.value, taskClass: undefined} : item)})}/></Field><Field label="Вид работы"><Pick label={`Вид работы · правило ${index + 1} · условие ${position + 1}`} value={condition.workType || '__all'} onChange={value => updateRule(index, {applicability: rule.applicability.map((item, order) => order === position ? {...item, workType: value === '__all' ? '' : value} : item)})} options={condition.workType && !workTypes.some(item => item.value === condition.workType) ? [...workTypes, {value: condition.workType, label: condition.workType}] : workTypes}/></Field></div><Field label={`Тип артефакта · правило ${index + 1} · условие ${position + 1}`}><Input value={condition.artifactType || ''} placeholder="Любой артефакт" onChange={event => updateRule(index, {applicability: rule.applicability.map((item, order) => order === position ? {...item, artifactType: event.target.value} : item)})}/></Field><Button type="button" size="sm" variant="ghost" onClick={() => updateRule(index, {applicability: rule.applicability.filter((_, order) => order !== position)})}>Убрать условие</Button></div>)}<Button type="button" variant="outline" size="sm" onClick={() => updateRule(index, {applicability: [...rule.applicability, {segment: editor.segment, tag: '', workType: '', artifactType: ''}]})}><Plus size={13}/>Добавить условие</Button></div>
            <div className="policy-rule-options-section"><h4>Подтверждение выполнения</h4>{rule.evidence.map((verification, position) => <div className="policy-condition-row" key={position}><Field label={`Подтверждение · правило ${index + 1} · проверка ${position + 1}`}><Textarea rows={2} value={verification.artifacts || ''} placeholder="Например: итоговый манифест и ссылка на разрешённую версию в реестре." onChange={event => updateRule(index, {evidence: rule.evidence.map((item, order) => order === position ? {...item, artifacts: event.target.value} : item)})}/></Field><Field label="Скилл проверки"><Pick label={`Скилл проверки · правило ${index + 1} · проверка ${position + 1}`} value={verification.verificationSkill || '__none'} onChange={value => updateRule(index, {evidence: rule.evidence.map((item, order) => order === position ? {...item, verificationSkill: value === '__none' ? '' : value} : item)})} options={[{value: '__none', label: 'Не выбран'}, ...verificationSkills.map(asset => ({value: assetKey(asset), label: `${asset.name} · v${asset.version}`})), ...(verification.verificationSkill && !verificationSkills.some(asset => assetKey(asset) === verification.verificationSkill) ? [{value: verification.verificationSkill, label: `${verification.verificationSkill} · закреплённая версия`}] : [])]}/></Field><Button type="button" size="sm" variant="ghost" onClick={() => updateRule(index, {evidence: rule.evidence.filter((_, order) => order !== position)})}>Убрать проверку</Button></div>)}<Button type="button" variant="outline" size="sm" onClick={() => updateRule(index, {evidence: [...rule.evidence, {artifacts: '', verificationSkill: ''}]})}><Plus size={13}/>Добавить проверку</Button></div>
            <Field label={`Источники · правило ${index + 1}`}><Input value={rule.references} placeholder="Документ или реестр" onChange={event => updateRule(index, {references: event.target.value})}/></Field>
          </div></details>
        </section>)}</div><Button type="button" className="policy-add-rule" variant="outline" disabled={busy} onClick={() => setEditor({...editor, rules: [...editor.rules, newRule()]})}><Plus size={15}/>Добавить текстовое правило</Button>
          {(!!editor.sharedApplicability.length || !!editor.sharedEvidence.length) && <p className="policy-inherited-note">Общие условия применимости и проверки исходного пакета будут сохранены в новой версии.</p>}
        </TabsContent>
        {POLICY_STAGE_IDS.map((stage, index) => <TabsContent value={stage} key={stage}><div className="policy-stage-editor-head"><span className="policy-rule-number">{index + 1}</span><div><h3>{policyStageMeta[stage].label}</h3><p>{policyStageMeta[stage].description}</p></div></div><Notice tone="blue" title="Политика всегда в контексте">Оркестратор получает текст политики на этом этапе и подключает выбранные ниже версии skills. Subagents можно добавить при необходимости.</Notice><div className="policy-stage-asset-groups"><AssetPicker type="Skills" assets={state.assets} selected={editor.stages[stage].skills} onChange={skills => setEditor({...editor, stages: {...editor.stages, [stage]: {...editor.stages[stage], skills}}})} disabled={busy}/><AssetPicker type="Subagents" assets={state.assets} selected={editor.stages[stage].subagents} onChange={subagents => setEditor({...editor, stages: {...editor.stages, [stage]: {...editor.stages[stage], subagents}}})} disabled={busy}/></div></TabsContent>)}
      </Tabs>
      <Field label="История изменений"><Textarea rows={2} value={editor.changelog} onChange={event => setEditor({...editor, changelog: event.target.value})} placeholder="Необязательно"/></Field>
      {error && <p className="form-error" role="alert">{error}</p>}<div className="actions"><Button variant="outline" type="button" onClick={() => setEditor(null)}>Отмена</Button><Button disabled={busy}><Layers size={15}/>Сохранить черновик</Button></div>
    </form>}</Modal>
  </div>;
}
