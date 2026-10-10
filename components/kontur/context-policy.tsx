'use client';
import {useMemo,useState} from 'react';
import {ArrowRight,FileCheck,FileText,ShieldCheck} from 'lucide-react';
import {policyKey} from '@/lib/domain';
import {useKontur} from './context';
import {Button,Card,Notice,Pick,Pill,Status} from './ui';

export default function ContextPolicy(){
 const{state,team,go,act,busy,can}=useKontur();
 const systems=useMemo(()=>[...new Set(team.bindings.filter(item=>item.type==='Repository'&&item.system).map(item=>item.system!))],[team]);
 const[system,setSystem]=useState(systems[0]||'');
 const segment=team.bindings.find(item=>item.type==='Repository'&&item.system===system)?.segment||'';
 const policies=state.policies.filter(item=>item.segment===segment).sort((a,b)=>a.direction.localeCompare(b.direction)||b.version-a.version);
 const regulator=can('Regulator');
 return <div className="context-stage stack">
  <div className="context-stage-toolbar"><div><span className="eyebrow">POLICY SELECTION</span><h2>{system||'Техническая система'}</h2><p>{segment||'Сначала классифицируйте систему'}</p></div><Pick label="Система для Policy" value={system} onChange={setSystem} options={systems}/></div>
  <div className="context-policy-summary"><div><ShieldCheck size={20}/><strong>{policies.length}</strong><span>версий пакетов</span></div><div><FileText size={20}/><strong>{policies.reduce((sum,item)=>sum+item.requirements.length,0)}</strong><span>текстовых требований</span></div><div><FileCheck size={20}/><strong>{policies.reduce((sum,item)=>sum+item.evidence.length,0)}</strong><span>правил evidence</span></div></div>
  <div className="stack">{policies.map(policy=><Card key={policyKey(policy)} title={<span className="row wrap"><span className="mono">{policyKey(policy)}</span><Pill>{policy.direction}</Pill></span>} action={<Status value={policy.status}/>}><p className="subtext">{policy.changelog}</p><div className="context-requirements">{policy.requirements.map(requirement=><article key={`${requirement.id}@${requirement.version}`}><div className="row between wrap"><strong>{requirement.id}@{requirement.version}</strong><span className="task-sub">{requirement.owner}</span></div><p>{requirement.text}</p><div className="row wrap mt-3"><Pill>{policy.segment}</Pill>{policy.applicability.filter(rule=>!rule.requirement||rule.requirement===`${requirement.id}@${requirement.version}`).map((rule,index)=><Pill tone="blue" key={index}>{rule.workType||'all work types'}</Pill>)}</div></article>)}</div>{policy.status==='Draft'&&<div className="actions"><Button disabled={!regulator||busy} onClick={()=>act('policy_status',{policyKey:policyKey(policy),status:'Current'})}>Опубликовать пакет</Button></div>}</Card>)}{!policies.length&&<Notice title="Для сегмента нет Policy Package">Создайте пакет в рабочем пространстве регулятора или выберите другую систему.</Notice>}</div>
  <div className="row between wrap"><Notice tone="blue" title="Обязательства выбираются детерминированно">Similarity search не определяет применимость. Используются segment, work type и опубликованная версия пакета.</Notice><Button variant="outline" onClick={()=>go('regulation',policies[0]?policyKey(policies[0]):'')}><ShieldCheck size={15}/>Открыть рабочее пространство регулятора <ArrowRight size={14}/></Button></div>
  {!regulator&&<Notice title="Публикация доступна Regulator">Просмотр открыт всем ролям в scope. Для изменения жизненного цикла переключите демонстрационную роль.</Notice>}
 </div>;
}
