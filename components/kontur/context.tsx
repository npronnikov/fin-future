'use client';
import {createContext,useContext} from 'react';
import type {State,Person,Team,Product,Item} from '@/lib/domain';
export interface AppContext {state:State;actor:Person;team:Team;product:Product;screen:string;ref:string;tab:string;busy:boolean;go:(screen:string,ref?:string,tab?:string)=>void;act:(action:string,payload?:Item)=>Promise<Item|undefined>;reload:()=>Promise<void>;can:(...roles:string[])=>boolean;has:(assignment:string)=>boolean;ask:(text:string,surface:string,provider?:string,runId?:string,gateId?:string)=>Promise<Item>;setScope:(productId:string,teamId:string)=>void}
export const KonturContext=createContext<AppContext|null>(null);
export const useKontur=()=>{const ctx=useContext(KonturContext);if(!ctx)throw new Error('Missing DevPlane context');return ctx};
