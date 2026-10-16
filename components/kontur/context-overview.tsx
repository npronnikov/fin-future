'use client';
import {ArrowRight,BookOpen,CheckCircle2,ClipboardList,GitBranch,ShieldCheck,Sparkles,Users,Waypoints} from 'lucide-react';
import {useKontur} from './context';
import {Button,Card,Notice,Pill} from './ui';

export default function ContextOverview(){
 const{state,team,product,go}=useKontur();
 const productKnowledge=state.knowledge.filter(item=>item.productId===product.id&&item.layer==='Product'&&item.status==='approved');
 const teamKnowledge=state.knowledge.filter(item=>item.teamId===team.id&&item.layer==='Team'&&item.status==='approved');
 const tasks=state.tasks.filter(item=>item.teamId===team.id&&item.productId===product.id);
 const segments=[...new Set(team.bindings.filter(item=>item.type==='Repository').map(item=>item.segment).filter(Boolean))];
 const policies=state.policies.filter(item=>segments.includes(item.segment)&&['Current','Deprecating'].includes(item.status));
 return <div className="context-stage stack">
  <section className="context-overview-trace" aria-label="Task-driven Context Supply Chain">
   <div className="context-overview-trace-head"><div><span className="eyebrow">РЕКОМЕНДОВАННЫЙ СКВОЗНОЙ ПОКАЗ</span><h2>Task → Planner → Resolver → Flow → Verification</h2></div><Pill tone="blue">Simulation</Pill></div>
   <div className="context-overview-steps">
    <div><ClipboardList size={18}/><strong>Task</strong><span>{tasks.length} задач · scope из Repository</span></div><ArrowRight size={15}/>
    <div><Sparkles size={18}/><strong>Planner</strong><span>Probabilistic planning тем и stages</span></div><ArrowRight size={15}/>
    <div><ShieldCheck size={18}/><strong>Resolver</strong><span>Deterministic Policy resolution</span></div><ArrowRight size={15}/>
    <div><Waypoints size={18}/><strong>Flow</strong><span>Product / Team только по assignments</span></div><ArrowRight size={15}/>
    <div><CheckCircle2 size={18}/><strong>Verification</strong><span>PASS / FAIL / INCONCLUSIVE</span></div>
   </div>
  </section>
  <section className="context-convergence" aria-label="Три источника Context Supply Chain">
   <div className="context-source product"><BookOpen size={20}/><span>Product Knowledge</span><strong>{productKnowledge.length}</strong><small>{product.name} · без сегмента</small></div>
   <div className="context-source policy"><ShieldCheck size={20}/><span>Regulatory Policy</span><strong>{policies.length}</strong><small>{segments.join(' · ')||'Сегмент не определён'}</small></div>
   <div className="context-source team"><Users size={20}/><span>Team Knowledge</span><strong>{teamKnowledge.length}</strong><small>{team.name} · без сегмента</small></div>
   <div className="context-convergence-lines" aria-hidden="true"><i/><i/><i/></div>
   <div className="context-receipt"><Pill tone="green">Resolved context</Pill><GitBranch size={26}/><h2>Точные fragments с provenance</h2><p>LLM предлагает темы и stages; обязательная Policy выбирается независимо и детерминированно.</p></div>
  </section>
  <div className="grid-3">
   <Card title="1 · Классифицируйте систему"><p className="subtext">Repository связывается с IT-сегментом только для разрешения регуляторных требований.</p><Button variant="outline" className="mt-4" onClick={()=>go('regulation','','segmentation')}>К сегментации <ArrowRight size={14}/></Button></Card>
   <Card title="2 · Опубликуйте контекст"><p className="subtext">Policy Package и Knowledge проходят review и получают версию.</p><Button variant="outline" className="mt-4" onClick={()=>go('knowledge','','publication')}>К публикации <ArrowRight size={14}/></Button></Card>
   <Card title="3 · Запустите Delivery Trace"><p className="subtext">Task превращается в объяснимое распределение контекста по узлам Flow и preview финальной проверки.</p><Button className="mt-4" onClick={()=>go('knowledge','','delivery')}>Открыть Delivery Trace <ArrowRight size={14}/></Button></Card>
  </div>
  <Notice tone="blue" title="Сегмент применяется только к регуляторному слою">Product и Team Knowledge выбираются по продукту, теме и команде. IT-сегмент управляет только применимостью требований ИБ, надёжности и рисков.</Notice>
 </div>;
}
