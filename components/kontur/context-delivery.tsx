'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight,Box,Clipboard,Download,FileText,GitBranch,History,Play,RefreshCw,Save,ShieldCheck,Sparkles} from 'lucide-react';
import {compileContextDeliveryTrace,contextBundleHash} from '@/lib/context-supply';
import type {ContextBundle,ContextDeliveryTrace,ContextFragment} from '@/lib/domain';
import {useKontur} from './context';
import {Blank,Button,Card,Code,DateText,Notice,Pick,Pill,Status} from './ui';

const kindLabel={product:'Product Knowledge',team:'Team Knowledge',policy:'Regulatory Policy'} as const;
const kindTone={product:'green',team:'green',policy:'purple'} as const;

function stageText(trace:ContextDeliveryTrace,stageId:string){
 const stage=trace.stages.find(item=>item.id===stageId);
 if(!stage)return '';
 return [`# ${stage.name} · Context Stage Slice`,...(['product','team','policy'] as const).flatMap(kind=>['',`## ${kindLabel[kind]}`,...stage[kind].map(item=>`- ${item.title} · ${item.sourceId}@${item.version}\n  ${item.content}`)])].join('\n');
}

function compareBundle(bundle:ContextBundle|undefined,trace:ContextDeliveryTrace|null){
 if(!bundle||!trace)return null;
 const previous=new Map(bundle.selectionReasons.map(item=>[String(item.id),(item.stageIds||[]).slice().sort().join('|')]));
 const current=new Map(trace.fragments.map(item=>[item.id,item.stageIds.slice().sort().join('|')]));
 return {
  added:[...current.keys()].filter(id=>!previous.has(id)),
  removed:[...previous.keys()].filter(id=>!current.has(id)),
  changed:[...current.keys()].filter(id=>previous.has(id)&&previous.get(id)!==current.get(id)),
 };
}

function traceSourceSignature(state:ReturnType<typeof useKontur>['state'],team:ReturnType<typeof useKontur>['team'],productId:string,taskId:string){
 return contextBundleHash({task:state.tasks.find(item=>item.id===taskId),bindings:team.bindings,knowledge:state.knowledge.filter(item=>item.productId===productId),policies:state.policies,capabilities:state.capabilities.filter(item=>item.productId===productId)});
}

function FragmentRow({fragment}:{fragment:ContextFragment}){
 return <article className={`context-fragment ${fragment.kind}`}>
  <div className="row between wrap"><Pill tone={kindTone[fragment.kind]}>{kindLabel[fragment.kind]}</Pill><Status value={fragment.status}/></div>
  <h4>{fragment.title}</h4>
  <div className="context-fragment-source"><span className="mono">{fragment.sourceId}@{fragment.version}</span><span>{fragment.reason}</span></div>
  <p>{fragment.content}</p>
  {!!fragment.provenance.length&&<small>Provenance · {fragment.provenance.join(' · ')}</small>}
  {fragment.details?.sunset&&<small className="context-warning">Sunset · {fragment.details.sunset}</small>}
 </article>;
}

export default function ContextDelivery(){
 const{state,team,product,actor,act,busy,has,go}=useKontur();
 const tasks=useMemo(()=>state.tasks.filter(item=>item.teamId===team.id&&item.productId===product.id),[state.tasks,team.id,product.id]);
 const defaultTaskId=tasks[0]?.id||'';
 const[taskId,setTaskId]=useState(defaultTaskId);
 const sourceSignature=useMemo(()=>traceSourceSignature(state,team,product.id,taskId),[state,team,product.id,taskId]);
 const scopePreview=useMemo(()=>taskId?compileContextDeliveryTrace(state,taskId).task:null,[state,taskId]);
 const[trace,setTrace]=useState<ContextDeliveryTrace|null>(null);
 const[generatedSignature,setGeneratedSignature]=useState('');
 const[phase,setPhase]=useState<'idle'|'request'|'planning'|'resolving'|'ready'>('idle');
 const[selectedStageId,setSelectedStageId]=useState('');
 const[verificationOpen,setVerificationOpen]=useState(false);
 const[historyId,setHistoryId]=useState('');
 const[showCompare,setShowCompare]=useState(false);
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
 useEffect(()=>{
  if(tasks.some(item=>item.id===taskId))return;
  timers.current.forEach(clearTimeout);timers.current=[];setTaskId(tasks[0]?.id||'');setTrace(null);setGeneratedSignature('');setPhase('idle');setSelectedStageId('');setVerificationOpen(false);setHistoryId('');setShowCompare(false);
 },[tasks,taskId]);
 const stale=!!trace&&generatedSignature!==sourceSignature;
 const selectedStage=trace?.stages.find(item=>item.id===selectedStageId)||trace?.stages[0];
 const history=state.contextBundles.filter(item=>item.input.productId===product.id&&item.input.teamId===team.id);
 const selectedHistory=history.find(item=>item.id===historyId);
 const comparison=useMemo(()=>compareBundle(selectedHistory,trace),[selectedHistory,trace]);
 const phaseLabel={idle:'Ожидает Task',request:'Формируем request',planning:'LLM Context Planner',resolving:'Deterministic Resolver',ready:'Trace готов'}[phase];

 function changeTask(value:string){
  timers.current.forEach(clearTimeout);timers.current=[];setTaskId(value);setTrace(null);setPhase('idle');setSelectedStageId('');setVerificationOpen(false);setHistoryId('');setShowCompare(false);
 }
 function generate(){
  if(!taskId)return;timers.current.forEach(clearTimeout);setTrace(null);setVerificationOpen(false);setPhase('request');
  timers.current=[setTimeout(()=>setPhase('planning'),260),setTimeout(()=>setPhase('resolving'),620),setTimeout(()=>{const next=compileContextDeliveryTrace(state,taskId);setTrace(next);setGeneratedSignature(sourceSignature);setSelectedStageId(next.stages[0]?.id||'');setPhase('ready')},980)];
 }
 function reuseTask(value:string){
  timers.current.forEach(clearTimeout);timers.current=[];const next=compileContextDeliveryTrace(state,value);setTaskId(value);setTrace(next);setGeneratedSignature(traceSourceSignature(state,team,product.id,value));setSelectedStageId(next.stages[0]?.id||'');setVerificationOpen(false);setPhase('ready');setShowCompare(false);
 }
 async function save(){if(!trace||stale)return;const result=await act('save_context_bundle',{teamId:team.id,productId:product.id,taskId});if(result?.id)setHistoryId(result.id)}
 async function copyStage(){if(trace&&typeof navigator!=='undefined')await navigator.clipboard.writeText(stageText(trace,selectedStage?.id||''))}
 function download(){if(!trace||typeof document==='undefined')return;const url=URL.createObjectURL(new Blob([JSON.stringify(trace,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=`delivery-trace-${trace.simulationId}.json`;link.click();URL.revokeObjectURL(url)}

 if(!tasks.length)return <div className="context-stage"><Card><Blank title="Нет задачи для Delivery Trace" text="Создайте задачу на доске текущей команды. Симуляция начинается с Task, а не с ручного выбора темы." action={<Button onClick={()=>go('tasks')}>Открыть доску задач</Button>}/></Card></div>;

 return <div className="context-stage context-delivery-trace">
  <header className="context-trace-title"><div><span className="eyebrow">TASK-DRIVEN CONTEXT SUPPLY CHAIN</span><h2>Delivery Trace</h2><p>Сквозная демонстрация: Task → LLM Context Planner → deterministic Resolver → Flow → Regulatory Verification.</p></div><div className="row wrap"><Pill tone="blue">LLM simulation</Pill><Pill>Не runtime</Pill></div></header>
  <Notice tone="blue" title="Демонстрационный интерфейс">Simulation показывает состав и маршрутизацию контекста, но не создаёт Run, Gate или фактическую доставку агенту и не является доказательством compliance.</Notice>

  <div className="context-trace-top">
   <Card title="1 · Task и technical scope" action={<Pill tone="blue">{phaseLabel}</Pill>}><div className="stack">
    <label className="form-field field-wide"><span>Задача текущей команды</span><Pick label="Task для Delivery Trace" value={taskId} onChange={changeTask} options={tasks.map(item=>({value:item.id,label:`${item.id} · ${item.title}`}))}/></label>
    {scopePreview?<div className="context-scope-grid"><div><span>Repository</span><strong>{scopePreview.repository}</strong></div><div><span>System</span><strong>{scopePreview.system||'не определена'}</strong></div><div><span>Segment</span><strong>{scopePreview.segment||'не определён'}</strong></div><div><span>Task tag</span><strong>#{scopePreview.tag||'без тега'}</strong></div><div><span>Work types</span><strong>{scopePreview.workTypes.join(' · ')}</strong></div><div><span>Flow</span><strong>{scopePreview.capabilityName} · v{scopePreview.flowVersion}</strong></div></div>:<p className="subtext">Scope будет выведен из Task → Repository Binding → System → Segment.</p>}
    <Button onClick={generate} disabled={busy||phase==='request'||phase==='planning'||phase==='resolving'}>{phase==='ready'?<RefreshCw size={15}/>:<Sparkles size={15}/>}Сформировать Context Request</Button>
   </div></Card>

   <Card title="2 · LLM Context Planner" action={<Pill tone="purple">LLM simulation</Pill>}><div className="stack">
    <div className="context-planner-progress"><span className={phase!=='idle'?'active':''}>Request</span><ArrowRight size={14}/><span className={['planning','resolving','ready'].includes(phase)?'active':''}>Planner</span><ArrowRight size={14}/><span className={['resolving','ready'].includes(phase)?'active':''}>Resolver</span></div>
    {trace?<><div><span className="eyebrow">STRUCTURED REQUEST</span><Code>{JSON.stringify(trace.request,null,2)}</Code></div><div><span className="eyebrow">STRUCTURED RESPONSE · НЕ ИСТОЧНИК ЗНАНИЙ</span><Code>{JSON.stringify(trace.plannerResult,null,2)}</Code></div></>:<div className="context-planner-wait"><Sparkles size={24}/><strong>{phaseLabel}</strong><span>{phase==='idle'?'Запустите симуляцию для выбранной задачи.':'Planner классифицирует темы и назначает только Product / Team Knowledge.'}</span></div>}
   </div></Card>
  </div>

  {trace&&<>
   {stale&&<Notice title="Trace устарел" action={<Button size="sm" onClick={generate}>Сформировать заново</Button>}>Task, Flow или опубликованные источники изменились. Сохранение отключено до нового Context Request.</Notice>}
   {trace.unknown.length>0&&<Notice title="Unknown / warning">{trace.unknown.join(' ')}</Notice>}
   {trace.blocking.length>0&&<Notice tone="red" title="Simulation snapshot заблокирован">{trace.blocking.join(' ')}</Notice>}

   <section className="context-resolver" aria-label="Deterministic Resolver"><div className="row between wrap"><div><span className="eyebrow">3 · DETERMINISTIC RESOLVER</span><h3>Точные опубликованные fragments</h3></div><Pill tone="green">{trace.fragments.length} resolved</Pill></div>
    <div className="context-source-lanes"><div className="product"><Box size={18}/><span>Product Knowledge</span><strong>{trace.fragments.filter(item=>item.kind==='product').length}</strong><small>Только stages из Planner</small></div><div className="team"><Box size={18}/><span>Team Knowledge</span><strong>{trace.fragments.filter(item=>item.kind==='team').length}</strong><small>Только stages из Planner</small></div><div className="policy"><ShieldCheck size={18}/><span>Regulatory Policy</span><strong>{trace.fragments.filter(item=>item.kind==='policy').length}</strong><small>Обязательно · независимо от LLM</small></div></div>
   </section>

   <div className="context-trace-workspace">
    <div className="stack">
     <Card title="4 · Flow context cubes" action={<Pill>{trace.stages.length} stages</Pill>}><div className="context-flow-cubes">{trace.stages.map((stage,index)=><div className="context-flow-step" key={stage.id}>{index>0&&<ArrowRight size={15}/>}<button type="button" className={selectedStage?.id===stage.id?'active':''} onClick={()=>setSelectedStageId(stage.id)} aria-pressed={selectedStage?.id===stage.id}><span>{String(index+1).padStart(2,'0')}</span><strong>{stage.name}</strong><small>P {stage.product.length} · T {stage.team.length} · R {stage.policy.length}</small></button></div>)}</div></Card>
     <Card title="5 · Regulatory Verification" action={<Pill tone={trace.verification.status==='PASS'?'green':trace.verification.status==='FAIL'?'red':'amber'}>{trace.verification.status}</Pill>}><div className="stack">
      <p className="subtext">Демонстрационная проверка Build/Checks: diff, manifest, test report и registry reference против Evidence Rules.</p>
      <div className="context-verification-artifacts">{trace.verification.artifacts.map(item=><div key={item.id}><FileText size={15}/><span>{item.title}</span><Pill tone={item.present?'green':'amber'}>{item.present?'available':'missing'}</Pill></div>)}</div>
      <Button variant="outline" onClick={()=>setVerificationOpen(true)}><Play size={14}/>Запустить демонстрационную проверку</Button>
      {verificationOpen&&<><div className="context-verification-results">{trace.verification.results.map(item=><article key={item.requirement}><div className="row between"><strong>{item.requirement}</strong><Pill tone={item.status==='PASS'?'green':item.status==='FAIL'?'red':'amber'}>{item.status}</Pill></div><p>Evidence · {item.observed.join(' · ')||'недостаточно данных'}</p><small>Verification Skill · {item.verificationSkill||'не задан'}</small></article>)}</div><div className={`context-verification-route ${trace.verification.status.toLowerCase()}`}><strong>{trace.verification.status}</strong><ArrowRight size={18}/><strong>{trace.verification.route}</strong><small>{trace.verification.route==='Human Approval Gate'?'Будущий визуальный маршрут; настоящий Gate не создан.':'Маршрут показан только внутри simulation.'}</small></div></>}
     </div></Card>
    </div>

    <div className="stack">
     <Card title="Инспектор узла" action={selectedStage&&<Pill tone="blue">{selectedStage.name}</Pill>}><div className="stack">
      {selectedStage&&<><div className="context-inspector-summary"><span>Product {selectedStage.product.length}</span><span>Team {selectedStage.team.length}</span><span>Policy {selectedStage.policy.length}</span></div>{[...selectedStage.product,...selectedStage.team,...selectedStage.policy].map(fragment=><FragmentRow key={fragment.id} fragment={fragment}/>)}{![...selectedStage.product,...selectedStage.team,...selectedStage.policy].length&&<p className="subtext">Planner не назначил optional fragments этому узлу.</p>}</>}
      <div className="bundle-actions"><Button variant="outline" onClick={copyStage}><Clipboard size={14}/>Копировать stage slice</Button><Button variant="outline" onClick={download}><Download size={14}/>Trace JSON</Button></div>
      <Button disabled={busy||stale||!has('knowledge.contribute')||!!trace.blocking.length} onClick={save}><Save size={14}/>Зафиксировать Simulation snapshot</Button>
     </div></Card>
     <Button variant="ghost" className="w-full" onClick={()=>go('documentation','context-service-api')}><GitBranch size={14}/>API-контракт Context Service</Button>
    </div>
   </div>
  </>}

  <Card title={<span className="row"><History size={17}/>История snapshots</span>} action={<Pill>{history.length}</Pill>} body={false}><div className="context-history-list">{history.map(bundle=><button type="button" className={historyId===bundle.id?'bundle-history-row active':'bundle-history-row'} key={`${bundle.id}-${bundle.createdAt}`} onClick={()=>{setHistoryId(bundle.id);setShowCompare(false)}}><span><strong>{bundle.id}</strong><small>{bundle.taskId?`${bundle.taskId} · ${bundle.hash}`:`Legacy snapshot · ${bundle.input.system}`}</small></span><span><DateText value={bundle.createdAt}/><Pill tone={bundle.simulation?'blue':'amber'}>{bundle.simulation?'Simulation snapshot':'Legacy snapshot'}</Pill></span></button>)}</div>{!history.length&&<div className="card-body"><p className="subtext">Сохранённых snapshots пока нет.</p></div>}
   {selectedHistory&&<div className="context-history-detail"><div className="row between wrap"><div><span className="eyebrow">FROZEN SNAPSHOT</span><h3>{selectedHistory.id}</h3></div><div className="row wrap">{selectedHistory.taskId&&<Button variant="outline" size="sm" onClick={()=>reuseTask(selectedHistory.taskId!)}><RefreshCw size={13}/>Повторить для Task</Button>}<Button size="sm" variant="outline" disabled={!trace} onClick={()=>setShowCompare(value=>!value)}>Сравнить с preview</Button></div></div>
    {selectedHistory.simulation?<div className="context-history-summary"><span>Task · {selectedHistory.taskId}</span><span>Stages · {selectedHistory.stageSlices?.length||0}</span><span>Verification · {selectedHistory.verificationPreview?.status} → {selectedHistory.verificationPreview?.route}</span></div>:<Code>{selectedHistory.agentContext}</Code>}
    {showCompare&&comparison&&<div className="context-compare-grid"><div><strong>Добавлено</strong>{comparison.added.map(item=><span key={item}>{item}</span>)}{!comparison.added.length&&<small>Нет</small>}</div><div><strong>Удалено</strong>{comparison.removed.map(item=><span key={item}>{item}</span>)}{!comparison.removed.length&&<small>Нет</small>}</div><div><strong>Изменены stages</strong>{comparison.changed.map(item=><span key={item}>{item}</span>)}{!comparison.changed.length&&<small>Нет</small>}</div></div>}
   </div>}
  </Card>
 </div>;
}
