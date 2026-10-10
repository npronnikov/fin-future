'use client';
import {ArrowRight,BookOpen,GitBranch,ShieldCheck,Users} from 'lucide-react';
import {useKontur} from './context';
import {Button,Card,Notice,Pill} from './ui';

export default function ContextOverview(){
 const{state,team,product,go}=useKontur();
 const productKnowledge=state.knowledge.filter(item=>item.productId===product.id&&item.layer==='Product'&&item.status==='approved');
 const teamKnowledge=state.knowledge.filter(item=>item.teamId===team.id&&item.layer==='Team'&&item.status==='approved');
 const segments=[...new Set(team.bindings.filter(item=>item.type==='Repository').map(item=>item.segment).filter(Boolean))];
 const policies=state.policies.filter(item=>segments.includes(item.segment)&&['Current','Deprecating'].includes(item.status));
 return <div className="context-stage stack">
  <section className="context-convergence" aria-label="Три источника Context Supply Chain">
   <div className="context-source product"><BookOpen size={20}/><span>Product Knowledge</span><strong>{productKnowledge.length}</strong><small>{product.name} · v{product.knowledgeVersion}</small></div>
   <div className="context-source policy"><ShieldCheck size={20}/><span>Regulatory Policy</span><strong>{policies.length}</strong><small>{segments.join(' · ')||'Сегмент не определён'}</small></div>
   <div className="context-source team"><Users size={20}/><span>Team Knowledge</span><strong>{teamKnowledge.length}</strong><small>{team.name} · v{team.knowledgeVersion}</small></div>
   <div className="context-convergence-lines" aria-hidden="true"><i/><i/><i/></div>
   <div className="context-receipt"><Pill tone="green">Context Bundle</Pill><GitBranch size={26}/><h2>Контекст с происхождением</h2><p>Продукт отвечает «что», команда — «как», политика — «что обязательно».</p></div>
  </section>
  <div className="grid-3">
   <Card title="1 · Классифицируйте систему"><p className="subtext">Repository связывается с технической системой и IT-сегментом.</p><Button variant="outline" className="mt-4" onClick={()=>go('knowledge','','segmentation')}>К сегментации <ArrowRight size={14}/></Button></Card>
   <Card title="2 · Опубликуйте контекст"><p className="subtext">Policy Package и Knowledge проходят review и получают версию.</p><Button variant="outline" className="mt-4" onClick={()=>go('knowledge','','publication')}>К публикации <ArrowRight size={14}/></Button></Card>
   <Card title="3 · Соберите пакет"><p className="subtext">Scope превращается в объяснимый, неизменяемый snapshot для агента.</p><Button className="mt-4" onClick={()=>go('knowledge','','delivery')}>Собрать bundle <ArrowRight size={14}/></Button></Card>
  </div>
  <Notice tone="blue" title="Product variant не равен IT-сегменту">Сценарии individual/corporate описывают продукт. Сегменты retail.backend/corporate.backend классифицируют технические системы и управляют применимостью Policy.</Notice>
 </div>;
}
