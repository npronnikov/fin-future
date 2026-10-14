'use client';
import {ArrowLeft,ArrowRight,BookOpen,ExternalLink,Home,X} from 'lucide-react';
import {useKontur} from './context';
import {Button,PageHead} from './ui';
import ContextSupplyNav,{CONTEXT_STEPS,type ContextStepId} from './context-supply-nav';
import ContextOverview from './context-overview';
import ContextSegmentation from './context-segmentation';
import ContextPolicy from './context-policy';
import ContextOntology from './context-ontology';
import ContextPublication from './context-publication';
import ContextGraph from './context-graph';
import ContextDelivery from './context-delivery';

const LEGACY:Record<string,ContextStepId>={product:'publication',team:'publication',proposals:'publication'};
const STEP_HINTS:Record<ContextStepId,string>={
 overview:'Сверьте три источника контекста и убедитесь, что у каждого материала видно происхождение.',
 segmentation:'Определите технический сегмент и вариант продукта — от них зависит дальнейший выбор политик.',
 policy:'Проверьте применимые политики и причины, по которым они вошли в пакет.',
 ontology:'Свяжите термины продукта с корпоративными и техническими понятиями.',
 publication:'Добавьте продуктовое и командное знание и отправьте материалы на проверку.',
 graph:'Проверьте связи и найдите разрывы между источниками, понятиями и политиками.',
 delivery:'Соберите итоговый Context Bundle и проверьте, что именно получит агент.',
};

export default function Knowledge({guideOpen=true,onCloseGuide=()=>{}}:{guideOpen?:boolean;onCloseGuide?:()=>void}){
 const{tab,go}=useKontur();
 const requested=LEGACY[tab]||tab;
 const active=(CONTEXT_STEPS.some(step=>step.id===requested)?requested:'overview') as ContextStepId;
 const change=(id:ContextStepId)=>go('knowledge','',id);
 const activeIndex=CONTEXT_STEPS.findIndex(step=>step.id===active);
 const activeStep=CONTEXT_STEPS[activeIndex];
 const screens:Record<ContextStepId,React.ReactNode>={overview:<ContextOverview/>,segmentation:<ContextSegmentation/>,policy:<ContextPolicy/>,ontology:<ContextOntology/>,publication:<ContextPublication/>,graph:<ContextGraph/>,delivery:<ContextDelivery/>};
 return <div className="page knowledge-supply-page"><PageHead title="Управление знаниями" description="Context Supply Chain · от источника до неизменяемого пакета для агента" actions={<><Button variant="ghost" onClick={()=>go('home')}><Home size={15}/>На главную</Button><Button variant="outline" onClick={()=>go('documentation','context-supply-chain')}><BookOpen size={15}/>Документация <ExternalLink size={13}/></Button></>}/><div className="context-route-layout"><ContextSupplyNav active={active} onChange={change}/><main className="context-route-content"><header className="context-stage-head"><span>ЭТАП {activeStep.number} · CONTEXT SUPPLY CHAIN</span><strong>{activeStep.title}</strong></header>{screens[active]}</main></div>{guideOpen&&<section className="context-journey-guide" aria-label="Гид по Context Supply Chain"><div className="context-journey-count"><strong>{activeIndex+1}</strong><span>из {CONTEXT_STEPS.length}</span></div><div className="context-journey-copy"><span>МАРШРУТ CONTEXT SUPPLY CHAIN</span><h2>{activeStep.title}</h2><p>{STEP_HINTS[active]}</p></div><div className="context-journey-actions"><Button variant="outline" size="sm" disabled={activeIndex===0} onClick={()=>change(CONTEXT_STEPS[activeIndex-1].id)}><ArrowLeft size={14}/>Назад</Button><Button size="sm" disabled={activeIndex===CONTEXT_STEPS.length-1} onClick={()=>change(CONTEXT_STEPS[activeIndex+1].id)}>Дальше<ArrowRight size={14}/></Button></div><button type="button" className="context-journey-close" aria-label="Скрыть весь гид" title="Скрыть весь гид" onClick={onCloseGuide}><X size={16}/></button></section>}</div>;
}
