'use client';
import {useEffect,useMemo,useState} from 'react';
import {Box,CheckCircle2,GitBranch,Server} from 'lucide-react';
import {Binding,SEGMENTS} from '@/lib/domain';
import {useKontur} from './context';
import {Button,Card,Notice,Pick,Pill} from './ui';

export default function ContextSegmentation(){
 const{team,product,act,busy,can,go}=useKontur();
 const groups=useMemo(()=>{
  const grouped=new Map<string,Binding[]>();
  for(const binding of team.bindings.filter(item=>item.type==='Repository')){
   // The bundled LC scenario contains two real systems. A product created from
   // scratch owns its technical system name, even if an old binding still has
   // catalog demo metadata attached to it.
   const system=product.id==='accreditive'?(binding.system||product.name):product.name;
   grouped.set(system,[...(grouped.get(system)||[]),binding]);
  }
  return [...grouped].map(([system,bindings])=>({system,bindings}));
 },[team.bindings,product.id,product.name]);
 const systems=groups.map(item=>item.system);
 const groupKey=groups.map(item=>`${item.system}:${item.bindings.map(binding=>`${binding.id}:${binding.segment||''}`).join(',')}`).join('|');
 const[selected,setSelected]=useState(systems[0]||'');
 const bindings=(groups.find(item=>item.system===selected)||groups[0])?.bindings||[];
 const current=bindings.find(item=>item.segment)?.segment||'';
 const[segment,setSegment]=useState(current||'corporate.backend');
 const editable=can('Regulator');
 useEffect(()=>{
  const next=groups.find(item=>item.system===selected)||groups[0];
  setSelected(next?.system||'');
  setSegment(next?.bindings.find(item=>item.segment)?.segment||'corporate.backend');
 // selected is intentionally preserved when the selected repository group still exists.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[team.id,product.id,groupKey]);
 function selectSystem(value:string){
  setSelected(value);
  setSegment(groups.find(item=>item.system===value)?.bindings.find(item=>item.segment)?.segment||'corporate.backend');
 }
 async function save(){await act('classify_system',{system:selected,segment,repositories:bindings.map(item=>item.name)});}
 return <div className="context-stage context-two-column">
  <div className="stack">
   <Card title="Сегментация репозиториев" action={<Pill>{product.name} · {bindings.length} repositories</Pill>}><div className="stack">
    {systems.length>1&&<Pick label="Техническая система продукта" value={selected} onChange={selectSystem} options={systems}/>}
    <div className="context-lineage"><div><GitBranch size={18}/><span>Repository</span><strong>{bindings.map(item=>item.name).join(', ')||'—'}</strong></div><b>→</b><div><Server size={18}/><span>Product · System</span><strong>{selected||product.name}</strong></div><b>→</b><div><Box size={18}/><span>Segment</span><strong>{current||'Не определён'}</strong></div></div>
    <label className="form-field field-wide"><span>IT-сегмент</span><Pick label="IT-сегмент" value={segment} onChange={setSegment} options={SEGMENTS}/><small className="form-hint">Сегмент выбирает обязательные Policy Package; он не описывает тип клиента.</small></label>
    <div className="actions"><Button variant="outline" onClick={()=>go('environment','','resources')}>Открыть Resource Bindings</Button><Button disabled={!editable||busy||!selected||segment===current} onClick={save}><CheckCircle2 size={15}/>Сохранить классификацию</Button></div>
   </div></Card>
   {!systems.length&&<Notice title="Сначала подключите Repository">Сегментация строится из репозиториев текущего продукта. Подключите Repository в Resource Bindings.</Notice>}
   {!editable&&<Notice title="Требуется роль Regulator">Этап доступен для чтения. Переключите демонстрационную роль в верхней панели, чтобы изменить сегмент.</Notice>}
  </div>
  <Card title="Как возник сегмент"><ol className="context-explainer-list"><li><span>01</span><div><strong>Repository подключён к Team Space</strong><p>Binding задаёт доступы, систему и технический контур.</p></div></li><li><span>02</span><div><strong>Система классифицирована</strong><p>{selected||'Выберите систему'} относится к {segment}.</p></div></li><li><span>03</span><div><strong>Policy вычисляется</strong><p>Regulatory Context отбирается по segment и виду работы.</p></div></li></ol><Button variant="outline" className="mt-5" onClick={()=>go('documentation','context-supply-chain')}>Подробнее в документации</Button></Card>
 </div>;
}
