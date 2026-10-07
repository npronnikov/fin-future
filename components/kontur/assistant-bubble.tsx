'use client';
import {useEffect,useRef,useState} from 'react';
import {Popover} from 'radix-ui';
import {ArrowUp,MessageCircle,Sparkles,X} from 'lucide-react';
import {useKontur} from './context';
import {Button,Textarea} from './ui';
import type {Item} from '@/lib/domain';

export default function AssistantBubble(){
 const {actor,product,team,state,screen,ref,go,ask}=useKontur();
 const [open,setOpen]=useState(screen==='assistant'),[text,setText]=useState(''),[messages,setMessages]=useState<Item[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const end=useRef<HTMLDivElement>(null),input=useRef<HTMLTextAreaElement>(null),alive=useRef(true),sending=useRef(false);
 const run=screen==='run'?state.runs.find(item=>item.id===ref&&item.teamId===team.id):undefined;
 const gate=run?.gates.findLast(item=>item.status==='pending');
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 useEffect(()=>{if(screen==='assistant')setOpen(true)},[screen]);
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'})},[messages,loading,open]);
 function changeOpen(value:boolean){setOpen(value);if(!value&&screen==='assistant')go('home')}
 async function send(question:string){
  if(!question.trim()||sending.current)return;
  sending.current=true;setLoading(true);setError('');setText('');
  setMessages(items=>[...items,{text:question.trim(),mine:true}]);
  try{
   const reply=await ask(question.trim(),screen==='assistant'?'home':screen,run?.snapshot.runtime==='HG SDLC'?'HG SDLC':undefined,run?.id,gate?.id);
   if(alive.current)setMessages(items=>[...items,{text:reply.text,target:reply.target,ref:reply.ref,tab:reply.tab,mine:false}]);
  }catch{if(alive.current)setError('Не удалось получить ответ. Отправьте вопрос ещё раз.')}
  finally{sending.current=false;if(alive.current)setLoading(false)}
 }
 const labels:Record<string,string>={tasks:'Открыть доски',automation:'Открыть автоматизацию',capabilities:'Открыть возможности',capability:'Открыть возможность',run:'Открыть запуск',environment:'Открыть среду',settings:'Открыть настройки',regulation:'Открыть регулирование',messenger:'Открыть сообщения',catalog:'Открыть каталог'};
 return <Popover.Root open={open} onOpenChange={changeOpen}>
  <Popover.Trigger asChild><button type="button" className="assistant-bubble-button" aria-label={open?'Свернуть чат ассистента':'Открыть чат ассистента'}>{open?<X size={23}/>:<MessageCircle size={25}/>}<span className="assistant-bubble-spark"><Sparkles size={11}/></span></button></Popover.Trigger>
  <Popover.Portal><Popover.Content side="top" align="end" sideOffset={12} collisionPadding={12} className="assistant-bubble-panel" aria-label="Чат ассистента" onOpenAutoFocus={event=>{event.preventDefault();input.current?.focus()}}>
   <header className="assistant-bubble-head"><span className="assistant-bubble-avatar"><Sparkles size={19}/></span><div><strong>Ассистент</strong><span>{product.name} · {team.name}</span></div><Popover.Close asChild><button type="button" className="icon-btn" aria-label="Закрыть чат ассистента"><X size={18}/></button></Popover.Close></header>
   <div className="assistant-bubble-context">{run?`${run.id} · попытка ${run.attempt}`:'Контекст текущего экрана'}<span>Демонстрационный режим</span></div>
   <div className="assistant-bubble-messages" role="log" aria-live="polite" aria-label="Переписка с ассистентом">
    {!messages.length&&<div className="assistant-bubble-welcome"><Sparkles size={28}/><h3>Чем помочь?</h3><p>{run?'Могу объяснить состояние запуска, артефакты и текущий гейт.':'Могу подсказать следующий шаг и помочь разобраться в рабочем пространстве.'}</p>{(run?['Что происходит в этом запуске?','Почему нужен этот Approval?']:['Что мне сейчас делать?','Что автоматизировать первым?']).map(question=><button type="button" key={question} onClick={()=>{void send(question)}}>{question}</button>)}</div>}
    {messages.map((message,index)=><article key={index} className={`assistant-bubble-message ${message.mine?'mine':''}`}><small>{message.mine?actor.name:'Ассистент'}</small><p>{message.text}</p>{message.target&&labels[message.target]&&<Button variant="outline" size="sm" onClick={()=>go(message.target,message.ref||'',message.tab||'')}>{labels[message.target]}</Button>}</article>)}
    {loading&&<div className="assistant-bubble-typing" aria-label="Ассистент готовит ответ"><i/><i/><i/></div>}{error&&<p className="form-error" role="alert">{error}</p>}<div ref={end}/>
   </div>
   <form className="assistant-bubble-compose" onSubmit={event=>{event.preventDefault();void send(text)}}><Textarea ref={input} aria-label="Вопрос ассистенту" placeholder="Напишите вопрос…" rows={2} value={text} onChange={event=>setText(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();void send(text)}}}/><Button type="submit" disabled={loading||!text.trim()} aria-label="Отправить вопрос ассистенту"><ArrowUp size={18}/></Button></form>
  </Popover.Content></Popover.Portal>
 </Popover.Root>
}
