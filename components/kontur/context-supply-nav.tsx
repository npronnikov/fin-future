'use client';
import {BookOpen,Boxes,GitBranch,Network,PackageCheck,Route,ShieldCheck} from 'lucide-react';

export const CONTEXT_STEPS=[
 {id:'overview',number:'01',title:'Обзор',icon:Route},
 {id:'segmentation',number:'02',title:'Сегментация систем',icon:Boxes},
 {id:'policy',number:'03',title:'Policy Package',icon:ShieldCheck},
 {id:'ontology',number:'04',title:'Онтология аккредитива',icon:BookOpen},
 {id:'publication',number:'05',title:'Публикация знаний',icon:PackageCheck},
 {id:'graph',number:'06',title:'Граф знаний',icon:Network},
 {id:'delivery',number:'07',title:'Доставка агенту',icon:GitBranch},
] as const;

export type ContextStepId=typeof CONTEXT_STEPS[number]['id'];

export default function ContextSupplyNav({active,onChange}:{active:ContextStepId;onChange:(id:ContextStepId)=>void}){
 return <nav className="context-route-nav" aria-label="Этапы Context Supply Chain">{CONTEXT_STEPS.map(step=>{const Icon=step.icon;return <button key={step.id} type="button" className={active===step.id?'active':''} onClick={()=>onChange(step.id)} aria-current={active===step.id?'step':undefined}><span className="context-step-number">{step.number}</span><Icon size={16}/><span>{step.title}</span></button>})}</nav>;
}
