'use client';
import {useMemo,useState} from 'react';
import {Maximize2,Play,RotateCcw,Search} from 'lucide-react';
import {contextGraph} from '@/lib/context-supply';
import {useKontur} from './context';
import {Button,Card,Code,Pill} from './ui';

const QUERIES={
 product:'MATCH (p:Product)-[:HAS_CATEGORY]->(:ConceptCategory)-[:CONTAINS]->(c:Concept) RETURN c',
 segment:'MATCH (r:Requirement)-[:APPLIES_TO]->(s:Segment {id: $segment}) RETURN r',
 fees:'MATCH (k:Knowledge)-[:DESCRIBES]->(c:Concept {category: "fees"}) RETURN k,c',
 team:'MATCH (t:Team)-[:HAS_KNOWLEDGE]->(k:Knowledge) RETURN t,k',
} as const;

export default function ContextGraph(){
 const{state,product,team,go}=useKontur();
 const graph=useMemo(()=>contextGraph(state,product.id,team.id),[state,product.id,team.id]);
 const[filter,setFilter]=useState('all'),[selected,setSelected]=useState(graph.nodes[0]?.id||''),[query,setQuery]=useState<keyof typeof QUERIES>('product'),[ran,setRan]=useState(false);
 const visible=graph.nodes.filter(node=>filter==='all'||node.type===filter).slice(0,36);
 const ids=new Set(visible.map(node=>node.id));
 const positions=new Map(visible.map((node,index)=>[node.id,{x:105+(index%5)*178,y:70+Math.floor(index/5)*98}]));
 const current=graph.nodes.find(node=>node.id===selected);
 const queryRows=query==='segment'?graph.nodes.filter(node=>node.type==='policy'):query==='team'?graph.nodes.filter(node=>node.type==='knowledge'&&graph.links.some(link=>link.target===node.id&&String(link.source).startsWith('team:'))):query==='fees'?graph.nodes.filter(node=>node.type==='concept'&&/комисс/i.test(node.label)):graph.nodes.filter(node=>node.type==='concept');
 const filters=[['all','Все'],['concept','Понятия'],['knowledge','Knowledge'],['system','Системы'],['policy','Policy'],['team','Team']];
 return <div className="context-stage stack">
  <div className="context-stage-toolbar"><div><span className="eyebrow">COMPUTED VIEW</span><h2>Исследователь графа</h2><p>{graph.nodes.length} узлов · {graph.links.length} связей · JavaScript-эмуляция Cypher</p></div><Button variant="outline" onClick={()=>go('documentation','knowledge-graph')}><Search size={15}/>Модель графа</Button></div>
  <div className="graph-filters">{filters.map(([id,label])=><button type="button" className={filter===id?'active':''} key={id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
  <div className="context-graph-layout"><Card className="context-graph-card"><div className="graph-toolbar"><Pill>{visible.length} visible</Pill><div><button type="button" title="Сбросить фильтр" onClick={()=>setFilter('all')}><RotateCcw size={15}/></button><button type="button" title="Показать целиком"><Maximize2 size={15}/></button></div></div><svg className="knowledge-graph" viewBox={`0 0 1000 ${Math.max(520,170+Math.ceil(visible.length/5)*98)}`} role="img" aria-label="Граф знаний аккредитива">{graph.links.filter(link=>ids.has(link.source)&&ids.has(link.target)).map((link,index)=>{const a=positions.get(link.source)!,b=positions.get(link.target)!;return <g key={`${link.source}-${link.target}-${index}`}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y}/><text x={(a.x+b.x)/2} y={(a.y+b.y)/2-5}>{link.label}</text></g>})}{visible.map(node=>{const point=positions.get(node.id)!;return <g key={node.id} className={`graph-node ${node.type} ${selected===node.id?'selected':''}`} tabIndex={0} role="button" aria-label={node.label} onClick={()=>setSelected(node.id)} onKeyDown={event=>(event.key==='Enter'||event.key===' ')&&setSelected(node.id)}><circle cx={point.x} cy={point.y} r={selected===node.id?29:24}/><text className="node-label" x={point.x} y={point.y+42}>{String(node.label).length>24?`${String(node.label).slice(0,23)}…`:node.label}</text></g>})}</svg><div className="graph-legend">{filters.slice(1).map(([id,label])=><span key={id}><i className={id}/>{label}</span>)}</div></Card>
   <aside className="stack"><Card title="Инспектор узла" action={current&&<Pill>{current.type}</Pill>}>{current?<div className="stack gap-3"><h3>{current.label}</h3><p className="subtext whitespace-pre-wrap">{current.detail}</p><span className="mono task-sub">{current.id}</span></div>:<p className="subtext">Выберите узел графа.</p>}</Card><Card title="Готовые Cypher-запросы"><div className="cypher-picker">{Object.keys(QUERIES).map(key=><button type="button" className={query===key?'active':''} key={key} onClick={()=>{setQuery(key as keyof typeof QUERIES);setRan(false)}}>{key==='product'?'Знания по аккредитиву':key==='segment'?'Политики по сегменту':key==='fees'?'Комиссии аккредитива':'Практики команды'}</button>)}</div><Code>{QUERIES[query]}</Code><Button className="w-full" onClick={()=>setRan(true)}><Play size={14}/>Выполнить учебный запрос</Button>{ran&&<div className="query-result"><strong>{queryRows.length} результатов</strong>{queryRows.slice(0,6).map(node=><button type="button" key={node.id} onClick={()=>setSelected(node.id)}>{node.label}</button>)}</div>}<p className="task-sub mt-3">Запрос не соединяется с Neo4j: результат вычислен из общего state приложения.</p></Card></aside>
  </div>
 </div>;
}
