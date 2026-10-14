'use client';
import {useEffect,useRef,useState} from 'react';
import {AtSign,Hash,MessageSquare,Search,Send,ShieldAlert,Users} from 'lucide-react';
import {useKontur} from './context';
import {Button,Input,Textarea,PageHead,Pill,Blank,DateText} from './ui';

export function Messenger(){
 const {state,actor,team,product,tab,ref,go,act,busy}=useKontur();
 const [text,setText]=useState(''),[query,setQuery]=useState('');
 const end=useRef<HTMLDivElement>(null);
 const runs=state.runs.filter(run=>run.teamId===team.id&&run.productId===product.id&&!run.fixture);
 const pending=runs.flatMap(run=>run.gates.filter(gate=>gate.status==='pending'&&gate.assignee===actor.id).map(gate=>({run,gate}))).sort((a,b)=>Date.parse(b.gate.createdAt)-Date.parse(a.gate.createdAt));
 const channels=[{id:`team-${team.id}`,title:team.name,subtitle:'Общий канал команды',run:false,pending:0},...runs.slice().reverse().map(run=>({id:run.id,title:run.taskId,subtitle:run.id,run:true,pending:run.gates.filter(gate=>gate.status==='pending'&&gate.assignee===actor.id).length}))];
 const thread=channels.some(channel=>channel.id===ref)?ref:pending[0]?.run.id||`team-${team.id}`;
 const selected=channels.find(channel=>channel.id===thread)!;
 const channelIds=new Set(channels.map(channel=>channel.id));
 const teamMessages=state.messages.filter(message=>{const messageRun=runs.find(run=>run.id===message.thread),legacyInScope=message.thread===`team-${team.id}`||!!messageRun;return (message.teamId===team.id&&message.productId===product.id||!message.teamId&&!message.productId&&legacyInScope)&&message.kind!=='assistant'&&channelIds.has(message.thread)});
 const mentions=teamMessages.filter(message=>message.assigneeId===actor.id||message.text.includes(`@${actor.id}`)||message.text.includes(`@${actor.name}`));
 const showMentions=tab==='mentions';
 const messages=(showMentions?mentions:teamMessages.filter(message=>message.thread===thread)).filter(message=>!query.trim()||`${message.text} ${state.people.find(person=>person.id===message.actor)?.name||''}`.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru'))).slice().sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
 const people=state.people.filter(person=>team.people.includes(person.id));
 useEffect(()=>{setText('');setQuery('')},[thread,showMentions]);
 useEffect(()=>{if(!query.trim())end.current?.scrollIntoView({block:'nearest'})},[messages.length,thread,query]);
 async function send(event:React.FormEvent){event.preventDefault();if(!text.trim()||busy)return;const result=await act('message',{thread,text});if(result?.ok)setText('')}
 return <div className="page messenger-page">
  <PageHead title="Сообщения" description={`${product.name} · общение команды ${team.name}`}/>
  <section className="messenger-workspace" aria-label="Чат команды">
   <aside className="messenger-channels">
    <div className="messenger-workspace-title"><span className="messenger-workspace-avatar">{team.name.slice(0,1)}</span><div><strong>{team.name}</strong><span>{people.length} участников</span></div></div>
    <button type="button" className={`messenger-channel ${showMentions?'active':''}`} onClick={()=>go('messenger',thread,'mentions')}><AtSign size={17}/><span>Упоминания</span>{mentions.length>0&&<small>{mentions.length}</small>}</button>
    <p className="messenger-channel-heading">Каналы</p>
    {channels.filter(channel=>!channel.run).map(channel=><button type="button" className={`messenger-channel ${!showMentions&&thread===channel.id?'active':''}`} key={channel.id} onClick={()=>go('messenger',channel.id,'messages')}><Hash size={17}/><span>{channel.title}</span></button>)}
    <p className="messenger-channel-heading">Обсуждения задач</p>
    <div className="messenger-run-channels">{channels.filter(channel=>channel.run).map(channel=><button type="button" className={`messenger-channel ${!showMentions&&thread===channel.id?'active':''}`} key={channel.id} onClick={()=>go('messenger',channel.id,'messages')}><MessageSquare size={16}/><span>{channel.title}<small>{channel.subtitle}</small></span>{channel.pending>0&&<small title="Ожидает вашего решения">{channel.pending}</small>}</button>)}{!runs.length&&<p className="messenger-channel-empty">Обсуждение появится после запуска задачи.</p>}</div>
    <div className="messenger-members"><Users size={15}/><span>{people.map(person=>person.name).join(', ')}</span></div>
   </aside>
   <div className="messenger-conversation">
    <header className="messenger-conversation-head"><div><h2>{showMentions?<AtSign size={22}/>:<Hash size={22}/>} {showMentions?'Упоминания':selected.title}</h2><p>{showMentions?'Сообщения, адресованные вам':selected.subtitle}</p></div><div className="row wrap">{selected.run&&!showMentions&&<Button variant="outline" size="sm" onClick={()=>go('run',thread)}>Открыть запуск</Button>}<Pill>{messages.length} сообщений</Pill></div></header>
    <div className="messenger-search"><Search size={16}/><Input aria-label="Поиск сообщений" placeholder={showMentions?'Поиск в упоминаниях':'Поиск в канале'} value={query} onChange={event=>setQuery(event.target.value)}/></div>
    <div className="messenger-message-list" role="log" aria-label={showMentions?'Упоминания':'Сообщения канала'} aria-live="polite">
     {messages.length?messages.map((message,index)=>{
      const person=state.people.find(item=>item.id===message.actor),date=new Date(message.time).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long'});
      const previousDate=index?new Date(messages[index-1].time).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long'}):'';
      const gateRun=message.kind==='gate'?runs.find(run=>run.id===(message.runId||message.thread)):undefined,gate=gateRun?.gates.find(item=>item.id===message.gateId),gateAssigned=gate?.status==='pending'&&gate.assignee===actor.id;
      return <div key={message.id}>{date!==previousDate&&<div className="messenger-date"><span>{date}</span></div>}<article className={`messenger-message ${message.actor===actor.id?'own':''} ${message.kind==='gate'?'system':''}`}><span className="messenger-person-avatar">{message.kind==='gate'?<ShieldAlert size={17}/>:((person?.name||message.actor||'?').split(' ').slice(0,2).map((part:string)=>part[0]).join(''))}</span><div className="messenger-message-content"><div className="messenger-message-meta"><strong>{message.kind==='gate'?'КОНТУР · Automation':person?.name||message.actor}</strong><time><DateText value={message.time}/></time>{showMentions&&<button type="button" onClick={()=>go('messenger',message.thread,'messages')}>#{channels.find(channel=>channel.id===message.thread)?.title}</button>}</div>{message.title&&<strong className="messenger-system-title">{message.title}</strong>}<p>{message.text}</p>{message.kind==='gate'&&gateRun&&<div className="messenger-gate-action"><Pill tone={gate?.status==='pending'?'amber':'green'}>{gate?.status==='pending'?'Ожидает решения':'Решение принято'}</Pill><Button variant="outline" size="sm" onClick={()=>gateAssigned?go('automation','','gates'):go('run',gateRun.id,'gates')}>{gateAssigned?'Открыть в автоматизации':'Открыть запуск'}</Button></div>}</div></article></div>
     }):<Blank title={query?'Сообщений по запросу нет':showMentions?'Вас пока не упоминали':`Добро пожаловать в #${selected.title}`} text={query?'Попробуйте другой запрос.':showMentions?`Упоминания @${actor.id} и @${actor.name} появятся здесь.`:'Обсудите задачу или напишите сообщение команде.'}/>}<div ref={end}/>
    </div>
    {!showMentions&&<form className="messenger-compose" onSubmit={send}><Textarea aria-label="Сообщение в Messenger" placeholder={`Сообщение в #${selected.title}`} value={text} rows={3} onChange={event=>setText(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();void send(event)}}}/><div className="messenger-compose-footer"><span>Enter — отправить · Shift + Enter — новая строка</span><Button type="submit" disabled={busy||!text.trim()} aria-label="Отправить сообщение"><Send size={16}/>Отправить</Button></div></form>}
   </div>
  </section>
 </div>
}
