import {BookOpen} from 'lucide-react';
import {Card,Pill,Flow,Code} from './ui';
import type {Run,Item} from '@/lib/domain';
export function RunKnowledge({run}:{run:Run}){
 const receipt=run.execution.knowledgeDelivery;
 if(!receipt)return null;
 return <Card title={<span className="row"><BookOpen size={18}/>Доставка знаний · Knowledge MCP</span>} action={<Pill tone="green">{receipt.delivered?'Доставлено в Implementation':'Подготовлено'}</Pill>}><Flow nodes={receipt.steps}/><div className="knowledge-receipt-grid"><div><h3>Текст задачи</h3><p className="subtext">{receipt.request}</p><h3>Запрос в Context Supply Chain</h3><Code>{receipt.query}</Code><p className="subtext">{receipt.planner.productReason}</p></div><div><h3>Полученные знания</h3>{receipt.fragments.map((f:Item,i:number)=><div className="knowledge-fragment" key={`${f.id}-${i}`}><div className="row wrap"><Pill>{f.kind==='policy'?`Сегмент ${f.segment}`:f.kind==='team'?'Командное знание':'Продуктовое знание'}</Pill><span className="mono task-sub">{f.id}{f.version?` · v${f.version}`:''}</span></div><p>{f.content}</p><small>Назначение: {f.stage} · {f.package||f.sourceRefs?.join(', ')||'Опубликованное знание'}</small></div>)}{!receipt.fragments.length&&<p className="subtext">Подходящих опубликованных знаний не найдено.</p>}</div></div><p className="task-sub">Демонстрационный MCP / LLM trace · попытка {receipt.attempt}. Использованы версии знаний из снимка этого запуска.</p></Card>
}
