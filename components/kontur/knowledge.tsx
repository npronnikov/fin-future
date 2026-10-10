'use client';
import {BookOpen,ExternalLink} from 'lucide-react';
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

export default function Knowledge(){
 const{tab,go}=useKontur();
 const requested=LEGACY[tab]||tab;
 const active=(CONTEXT_STEPS.some(step=>step.id===requested)?requested:'overview') as ContextStepId;
 const change=(id:ContextStepId)=>go('knowledge','',id);
 const screens:Record<ContextStepId,React.ReactNode>={overview:<ContextOverview/>,segmentation:<ContextSegmentation/>,policy:<ContextPolicy/>,ontology:<ContextOntology/>,publication:<ContextPublication/>,graph:<ContextGraph/>,delivery:<ContextDelivery/>};
 return <div className="page knowledge-supply-page"><PageHead title="Управление знаниями" description="Context Supply Chain · от источника до неизменяемого пакета для агента" actions={<Button variant="outline" onClick={()=>go('documentation','context-supply-chain')}><BookOpen size={15}/>Документация <ExternalLink size={13}/></Button>}/><div className="context-route-layout"><ContextSupplyNav active={active} onChange={change}/><main className="context-route-content"><header className="context-stage-head"><span>ЭТАП {CONTEXT_STEPS.find(step=>step.id===active)?.number} · CONTEXT SUPPLY CHAIN</span><strong>{CONTEXT_STEPS.find(step=>step.id===active)?.title}</strong></header>{screens[active]}</main></div></div>;
}
