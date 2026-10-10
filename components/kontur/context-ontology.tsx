'use client';
import {useMemo,useState} from 'react';
import {BookOpen,Building2,CircleUserRound,FileText} from 'lucide-react';
import {useKontur} from './context';
import {Card,Detail,Pick,Pill} from './ui';
import type {ProductConcept} from '@/lib/domain';

export default function ContextOntology(){
 const{state,product,go}=useKontur();
 const categories=useMemo(()=>state.conceptCategories.filter(item=>item.productId===product.id).sort((a,b)=>a.order-b.order),[state,product.id]);
 const[category,setCategory]=useState('all'),[variant,setVariant]=useState('all'),[selected,setSelected]=useState<ProductConcept|null>(null);
 const concepts=state.concepts.filter(item=>item.productId===product.id&&item.status==='approved'&&(category==='all'||item.categoryId===category)&&(variant==='all'||item.variant==='all'||item.variant===variant));
 return <div className="context-stage stack">
  <section className="ontology-hero"><div><span className="eyebrow">PRODUCT CONCEPT GRAPH</span><h2>Онтология продукта «{product.name}»</h2><p>Продуктовые понятия живут независимо от технической сегментации и связывают знания с проверяемыми источниками.</p></div><div className="ontology-hero-count"><strong>{concepts.length}</strong><span>понятий в выбранном scope</span></div></section>
  <div className="row wrap"><Pick label="Категория онтологии" value={category} onChange={setCategory} options={[{value:'all',label:'Все категории'},...categories.map(item=>({value:item.id,label:item.title}))]}/><Pick label="Сценарий клиента" value={variant} onChange={setVariant} options={[{value:'all',label:'Все сценарии'},{value:'individual',label:'Физические лица'},{value:'corporate',label:'Юридические лица'}]}/></div>
  <div className="ontology-grid">{categories.filter(item=>category==='all'||item.id===category).map(item=>{const rows=concepts.filter(concept=>concept.categoryId===item.id);return <Card key={item.id} title={item.title} action={<Pill>{rows.length}</Pill>}><p className="subtext mb-4">{item.description}</p><div className="ontology-concepts">{rows.map(concept=><button type="button" key={concept.id} onClick={()=>setSelected(concept)}><span className={`concept-variant ${concept.variant}`}>{concept.variant==='corporate'?<Building2 size={14}/>:concept.variant==='individual'?<CircleUserRound size={14}/>:<BookOpen size={14}/>}</span><span><strong>{concept.label}</strong><small>{concept.description}</small></span></button>)}{!rows.length&&<p className="subtext">Нет понятий для выбранного сценария.</p>}</div></Card>})}</div>
  <button type="button" className="context-doc-link" onClick={()=>go('documentation','knowledge-graph')}><FileText size={15}/>Как онтология хранится в Knowledge Graph</button>
  <Detail open={!!selected} onClose={()=>setSelected(null)} title={selected?.label||'Понятие'} description={`${selected?.categoryId||''} · ${selected?.variant||''}`}>{selected&&<div className="stack"><p className="leading-7">{selected.description}</p><div><span className="eyebrow">ИСТОЧНИКИ</span><div className="stack gap-2 mt-3">{selected.sourceRefs.map(source=><div className="context-source-ref" key={source}><FileText size={15}/><span>{source}</span></div>)}</div></div><div className="row"><Pill tone="green">Approved</Pill><Pill>v{selected.version}</Pill></div></div>}</Detail>
 </div>;
}
