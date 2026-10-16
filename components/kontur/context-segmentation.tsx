'use client';
import {useMemo,useState} from 'react';
import {Box,CheckCircle2,GitBranch,Server} from 'lucide-react';
import {SEGMENTS} from '@/lib/domain';
import {useKontur} from './context';
import {Button,Card,Notice,Pick,Pill} from './ui';

export default function ContextSegmentation(){
 const{team,product,act,busy,can,go}=useKontur();
 const systems=useMemo(()=>[...new Set(team.bindings.filter(item=>item.type==='Repository'&&item.system).map(item=>item.system!))],[team]);
 const[selected,setSelected]=useState(systems[0]||'');
 const bindings=team.bindings.filter(item=>item.type==='Repository'&&item.system===selected);
 const current=bindings.find(item=>item.segment)?.segment||'';
 const[segment,setSegment]=useState(current||'corporate.backend');
 const editable=can('Regulator');
 async function save(){await act('classify_system',{system:selected,segment});}
 return <div className="context-stage context-two-column">
  <div className="stack">
   <Card title="Техническая система" action={<Pill>{bindings.length} repositories</Pill>}><div className="stack">
    <Pick label="Техническая система" value={selected} onChange={value=>{setSelected(value);const next=team.bindings.find(item=>item.type==='Repository'&&item.system===value)?.segment;setSegment(next||'corporate.backend')}} options={systems}/>
    <div className="context-lineage"><div><GitBranch size={18}/><span>Repository</span><strong>{bindings.map(item=>item.name).join(', ')||'—'}</strong></div><b>→</b><div><Server size={18}/><span>System</span><strong>{selected||'—'}</strong></div><b>→</b><div><Box size={18}/><span>Segment</span><strong>{current||'Не определён'}</strong></div></div>
    <label className="form-field field-wide"><span>IT-сегмент</span><Pick label="IT-сегмент" value={segment} onChange={setSegment} options={SEGMENTS}/><small className="form-hint">Сегмент выбирает обязательные Policy Package; он не описывает тип клиента.</small></label>
    <div className="actions"><Button variant="outline" onClick={()=>go('environment','','resources')}>Открыть Resource Bindings</Button><Button disabled={!editable||busy||!selected||segment===current} onClick={save}><CheckCircle2 size={15}/>Сохранить классификацию</Button></div>
   </div></Card>
   {!editable&&<Notice title="Требуется роль Regulator">Этап доступен для чтения. Переключите демонстрационную роль в верхней панели, чтобы изменить сегмент.</Notice>}
  </div>
  <Card title="Как возник сегмент"><ol className="context-explainer-list"><li><span>01</span><div><strong>Repository подключён к Team Space</strong><p>Binding задаёт доступы, систему и технический контур.</p></div></li><li><span>02</span><div><strong>Система классифицирована</strong><p>{selected||'Выберите систему'} относится к {segment}.</p></div></li><li><span>03</span><div><strong>Policy вычисляется</strong><p>Regulatory Context отбирается по segment и виду работы.</p></div></li></ol><Button variant="outline" className="mt-5" onClick={()=>go('documentation','context-supply-chain')}>Подробнее в документации</Button></Card>
 </div>;
}
