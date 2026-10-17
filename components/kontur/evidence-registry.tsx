'use client';
import {useEffect, useMemo, useState} from 'react';
import {CheckCircle2, Clock3, Database, ListChecks, RefreshCw, Search, Server, ShieldCheck} from 'lucide-react';
import type {EvidenceRegistryRecord} from '@/lib/evidence-registry';
import {useKontur} from './context';
import {Blank, Button, DateText, Input, KV, Modal, Notice, PageHead, Pick, Pill, Status} from './ui';

type RegistryResponse = {
  service: string;
  storage: string;
  total: number;
  summary: {reports: number; checks: number; pass: number; fail: number; tasks: number; policyPackages: number; lastReceivedAt: string | null};
  records: EvidenceRegistryRecord[];
};

function valueText(value: unknown) {
  if (Array.isArray(value)) return value.join(' · ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

export default function EvidenceRegistry() {
  const {actor, state, go, ref} = useKontur();
  const [response, setResponse] = useState<RegistryResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [policy, setPolicy] = useState('__all');
  const [status, setStatus] = useState('__all');
  const [selected, setSelected] = useState<EvidenceRegistryRecord | null>(null);

  async function load() {
    if (actor.role !== 'Regulator') return;
    setLoading(true); setError('');
    try {
      const result = await fetch('/api/evidence?limit=500', {headers: {Accept: 'application/json'}});
      const body = await result.json();
      if (!result.ok) throw new Error(body.error || 'Evidence Registry недоступен.');
      setResponse(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Evidence Registry недоступен.');
    } finally { setLoading(false); }
  }

  useEffect(() => {void load();}, [actor.id, state.revision]);
  const policies = useMemo(() => [...new Set((response?.records || []).map(record => record.policyPackage))].sort(), [response]);
  const records = useMemo(() => (response?.records || []).filter(record => {
    const query = search.trim().toLocaleLowerCase();
    return (policy === '__all' || record.policyPackage === policy) && (status === '__all' || record.status === status) && (!query || `${record.taskId} ${record.taskTitle} ${record.runId} ${record.evidenceId} ${record.requirement} ${record.verificationSkill} ${record.teamName}`.toLocaleLowerCase().includes(query));
  }), [response, policy, status, search]);
  useEffect(() => {if(ref&&response){const record=response.records.find(item=>item.id===ref||item.evidenceId===ref);if(record)setSelected(record);}}, [ref,response]);
  const profileDirection = actor.directions?.[0] || 'Regulator';

  if (actor.role !== 'Regulator') return <div className="page"><PageHead title="Evidence Registry" actions={<Button variant="outline" onClick={() => go('regulation')}>Пакеты политик</Button>}/><Notice title="Нужен профиль Regulator">Evidence Registry содержит полную трассировку проверок по задачам и доступен только роли Regulator.</Notice></div>;
  const summary = response?.summary;
  return <div className="page evidence-registry-page">
    <PageHead title="Evidence Registry" description="Единый журнал результатов регуляторных проверок" actions={<><Button variant="outline" disabled={loading} onClick={() => void load()}><RefreshCw className={loading?'evidence-registry-spin':''} size={15}/>Обновить</Button><Button variant="outline" onClick={() => go('regulation')}>Пакеты политик</Button></>}/>
    <section className="evidence-registry-hero"><div className="evidence-registry-hero-icon"><ShieldCheck size={25}/></div><div><span className="evidence-registry-eyebrow">REGULATORY CONTROL PLANE</span><h2>Проверка доказуема до конкретного запуска</h2><p>Каждая запись связывает Policy Package и requirement с задачей, Run, исполнителем проверки и полученными артефактами.</p><div className="evidence-registry-profile"><span>{actor.name}</span><Pill>{profileDirection}</Pill></div></div><div className="evidence-registry-service"><span className="evidence-registry-online"><i/>Service online</span><code><Server size={14}/>GET /api/evidence</code><code><Database size={14}/>{response?.storage || 'SQLite'}</code></div></section>
    {error && <Notice title="Evidence Registry недоступен">{error}</Notice>}
    <div className="evidence-registry-summary">
      <article><span className="evidence-registry-summary-icon"><Database size={16}/></span><div><small>Отчёты</small><strong>{summary?.reports ?? '—'}</strong><p>завершённых Run</p></div></article>
      <article><span className="evidence-registry-summary-icon"><ListChecks size={16}/></span><div><small>Проверки политик</small><strong>{summary?.checks ?? '—'}</strong><p>{summary?.policyPackages ?? 0} Policy Packages</p></div></article>
      <article><span className="evidence-registry-summary-icon pass"><CheckCircle2 size={16}/></span><div><small>PASS / FAIL</small><strong>{summary ? `${summary.pass} / ${summary.fail}` : '—'}</strong><p>{summary?.tasks ?? 0} задач</p></div></article>
      <article><span className="evidence-registry-summary-icon"><Clock3 size={16}/></span><div><small>Последняя запись</small><strong className="evidence-registry-date">{summary?.lastReceivedAt ? <DateText value={summary.lastReceivedAt}/> : '—'}</strong><p>новые записи сверху</p></div></article>
    </div>
    <section className="evidence-registry-ledger"><header><div><h2>Журнал проверок</h2><p>Записи доступны только для направления текущего профиля.</p></div><Pill>{records.length} записей</Pill></header><div className="evidence-registry-filters"><label className="evidence-registry-search"><span>Поиск</span><div><Search size={15}/><Input aria-label="Search Evidence Registry" value={search} onChange={event => setSearch(event.target.value)} placeholder="Задача, Run, requirement или skill"/></div></label><label><span>Policy Package</span><Pick label="Policy Package" value={policy} onChange={setPolicy} options={[{value:'__all',label:'Все пакеты'}, ...policies.map(value => ({value,label:value}))]}/></label><label><span>Статус</span><Pick label="Evidence status" value={status} onChange={setStatus} options={[{value:'__all',label:'Все статусы'},{value:'PASS',label:'PASS'},{value:'FAIL',label:'FAIL'},{value:'INCONCLUSIVE',label:'INCONCLUSIVE'}]}/></label></div>
      <div className="evidence-registry-table"><div className="evidence-registry-table-head"><span>Получено</span><span>Policy / requirement</span><span>Задача</span><span>Проверка</span><span>Run / report</span><span/></div>{records.map(record => <article key={record.id} className="evidence-registry-row"><div><DateText value={record.createdAt}/><Status value={record.status}/></div><div><strong>{record.policyPackage}</strong><small>{record.requirement} · {record.segment}</small></div><div><strong>{record.taskId}</strong><small>{record.taskTitle}</small></div><div><strong>{record.verificationSkill || record.runtime}</strong><small>{record.runtime} · {record.teamName}</small></div><div><strong>{record.runId}</strong><small>{record.evidenceId}</small></div><Button size="sm" variant="ghost" aria-label={`Открыть ${record.evidenceId}`} onClick={() => setSelected(record)}>Открыть</Button></article>)}</div>
      {!loading && !records.length && <Blank title="Записей нет" text={response?.records.length ? 'Для выбранных фильтров ничего не найдено.' : 'Verification skills ещё не отправляли отчёты.'}/>} 
    </section>
    <Modal open={!!selected} onClose={() => setSelected(null)} title="Evidence record" description={selected?.id} wide>{selected && <div className="stack"><div className="row wrap"><Status value={selected.status}/><Pill>{selected.policyPackage}</Pill><Pill>{selected.requirement}</Pill></div><div className="grid-2"><div><KV label="Задача">{selected.taskId} · {selected.taskTitle}</KV><KV label="Run">{selected.runId}</KV><KV label="Evidence report">{selected.evidenceId}</KV><KV label="Получено"><DateText value={selected.createdAt}/></KV></div><div><KV label="Runtime">{selected.runtime}</KV><KV label="Verification skill">{selected.verificationSkill || '—'}</KV><KV label="Команда">{selected.teamName}</KV><KV label="Сегмент">{selected.segment}</KV></div></div><div className="evidence-registry-payload"><span>Observed</span><p>{valueText(selected.observed)}</p><span>Evidence artifacts</span><p>{valueText(selected.artifacts)}</p><span>Required artifacts</span><p>{valueText(selected.requiredArtifacts)}</p>{!!selected.subagents.length && <><span>Subagents</span><p>{selected.subagents.join(' · ')}</p></>}</div></div>}</Modal>
  </div>;
}
