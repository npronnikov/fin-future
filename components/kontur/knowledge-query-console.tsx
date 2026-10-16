'use client';
import {useState} from 'react';
import {Play} from 'lucide-react';
import {KNOWLEDGE_GRAPH_QUERIES,KNOWLEDGE_GRAPH_QUERY_ORDER,knowledgeGraphQueryParams,runKnowledgeGraphQuery,type KnowledgeGraphQueryId} from '@/lib/knowledge-graph-queries';
import type {Item} from '@/lib/domain';
import {useKontur} from './context';
import {Button,Card,Code,Pill} from './ui';

export default function KnowledgeQueryConsole({onSelect}:{onSelect:(result:Item)=>void}){
 const{state,product,team}=useKontur();
 const[queryId,setQueryId]=useState<KnowledgeGraphQueryId>('product');
 const[results,setResults]=useState<Item[]|null>(null);
 const preset=KNOWLEDGE_GRAPH_QUERIES[queryId];
 const params=knowledgeGraphQueryParams(product.id,team.id,team.bindings.find(binding=>binding.type==='Repository')?.segment||'');
 return <Card title="Готовые запросы к графу" action={<Pill>JavaScript-эмуляция Cypher</Pill>}>
  <div className="knowledge-query-layout">
   <div>
    <div className="cypher-picker">{KNOWLEDGE_GRAPH_QUERY_ORDER.map(id=><button type="button" className={queryId===id?'active':''} key={id} onClick={()=>{setQueryId(id);setResults(null)}}>{KNOWLEDGE_GRAPH_QUERIES[id].title}</button>)}</div>
    <p className="subtext">{preset.description}</p>
   </div>
   <div className="stack">
    <Code>{preset.cypher}</Code>
    <details className="knowledge-query-params"><summary>Параметры запроса</summary><Code>{JSON.stringify(params,null,2)}</Code></details>
    <Button className="self-start" onClick={()=>setResults(runKnowledgeGraphQuery(state,queryId,product.id,team.id))}><Play size={14}/>Выполнить учебный запрос</Button>
    {results&&<div className="query-result"><strong>{results.length} результатов</strong>{results.map(result=><button type="button" key={result.id} onClick={()=>onSelect(result)}><span>{result.label}</span><small>{result.type==='concept'?'Понятие':result.layer==='Team'?'Командное знание':'Продуктовое знание'}</small></button>)}{!results.length&&<p className="task-sub">В текущем scope ничего не найдено.</p>}</div>}
    <p className="task-sub">Запрос не соединяется с Neo4j: результат вычисляется из опубликованного state приложения.</p>
   </div>
  </div>
 </Card>;
}
