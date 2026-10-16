import {Pill,Flow,Code} from './ui';
import type {Run,Item} from '@/lib/domain';
import {KNOWLEDGE_GRAPH_QUERIES,knowledgeGraphQueryParams} from '@/lib/knowledge-graph-queries';
export function RunKnowledgeDetails({run}:{run:Run}){
 const receipt=run.execution.knowledgeDelivery;
 if(!receipt)return null;
 const knowledge=receipt.fragments.filter((fragment:Item)=>fragment.kind!=='policy');
 const policies=receipt.fragments.filter((fragment:Item)=>fragment.kind==='policy');
 const legacyQuery=typeof receipt.query==='string'&&!receipt.query.trim().startsWith('MATCH')?receipt.query:'';
 const graphQuery=receipt.graphQuery||(legacyQuery?KNOWLEDGE_GRAPH_QUERIES.implementation.cypher:receipt.query);
 const binding=run.snapshot.bindings.find(item=>item.type==='Repository'&&run.scope.repositories.includes(item.name));
 const queryParams=receipt.queryParams||knowledgeGraphQueryParams(run.productId,run.teamId,binding?.segment||'','Implementation');
 const fragment=(item:Item,index:number)=><div className={`knowledge-fragment ${item.kind==='policy'?'policy':''}`} key={`${item.id}-${index}`}><div className="row wrap"><Pill>{item.kind==='policy'?`Сегмент ${item.segment}`:item.kind==='team'?'Командное знание':'Продуктовое знание'}</Pill><span className="mono task-sub">{item.id}{item.version?` · v${item.version}`:''}</span></div><p>{item.content}</p><small>Назначение: {item.stage} · {item.package||item.sourceRefs?.join(', ')||'Опубликованное знание'}</small></div>;
 return <div className="timeline-knowledge-receipt"><Flow nodes={receipt.steps}/><div className="knowledge-receipt-grid"><div><h3>Текст задачи</h3><p className="subtext">{receipt.request}</p>{(receipt.plannerRequest||legacyQuery)&&<p className="task-sub">Planner: {receipt.plannerRequest||legacyQuery}</p>}<h3>Запрос к графу</h3><Code>{graphQuery}</Code><h3>Параметры запроса</h3><Code>{JSON.stringify(queryParams,null,2)}</Code><p className="subtext">{receipt.planner.productReason}</p></div><div><h3>Знания продукта и команды</h3>{knowledge.map(fragment)}{!knowledge.length&&<p className="subtext">Для этой задачи Product / Team Knowledge не выбраны.</p>}<h3>Требования регуляторов в Implementation</h3>{policies.map(fragment)}{!policies.length&&<p className="subtext">Применимые требования отсутствуют.</p>}</div></div><p className="task-sub">Демонстрационный MCP / LLM trace · попытка {receipt.attempt}. Использованы версии из снимка этого запуска.</p></div>
}
