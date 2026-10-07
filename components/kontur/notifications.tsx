'use client';
import {useState} from 'react';
import {Popover} from 'radix-ui';
import {ArrowRight, Bell, Check, CheckCheck, Filter, Inbox, Search, X} from 'lucide-react';
import {useKontur} from './context';
import {Blank, Button, Card, DateText, Input, PageHead, Pick, Pill, Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from './ui';
import type {Item} from '@/lib/domain';

function scopedNotifications(items: Item[], productId: string, teamId: string) {
  return items.filter(item => item.productId === productId && item.teamId === teamId)
    .slice().sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
}

export function NotificationBell() {
  const {state, product, team, act, go, busy} = useKontur();
  const [open, setOpen] = useState(false);
  const notifications = scopedNotifications(state.notifications, product.id, team.id);
  const unread = notifications.filter(item => !item.read).length;
  async function select(item: Item) {
    if (!item.read && !(await act('mark_notification', {id: item.id}))?.ok) return;
    setOpen(false); go('notifications', item.id);
  }
  return <Popover.Root open={open} onOpenChange={setOpen}>
    <Popover.Trigger asChild><button type="button" className="icon-btn notification-bell" aria-label={`Уведомления: ${unread} непрочитанных`}><Bell size={19}/>{unread > 0 && <span className="notification-count">{unread > 99 ? '99+' : unread}</span>}</button></Popover.Trigger>
    <Popover.Portal><Popover.Content align="end" sideOffset={12} collisionPadding={12} className="notification-menu" aria-label="Lifecycle notifications">
      <header className="notification-menu-head"><div><strong>Уведомления</strong><span>{unread ? `${unread} непрочитанных` : 'Всё прочитано'}</span></div><Popover.Close asChild><button type="button" className="icon-btn" aria-label="Закрыть уведомления"><X size={16}/></button></Popover.Close></header>
      {notifications.length ? <ul className="notification-menu-list">{notifications.slice(0, 6).map(item => <li key={item.id}><button type="button" className={`notification-menu-item ${item.read ? '' : 'unread'}`} disabled={busy} onClick={() => {void select(item);}}><span className="notification-unread-dot"/><span><small>{item.kind}</small><strong>{item.title}</strong><span className="notification-excerpt">{item.text}</span><time><DateText value={item.time}/></time></span><ArrowRight size={14}/></button></li>)}</ul> : <div className="notification-menu-empty"><Inbox size={26}/><strong>Уведомлений пока нет</strong><p>События Environment, запуски и Capability появятся здесь.</p></div>}
      <footer className="notification-menu-foot"><Button variant="ghost" size="sm" disabled={busy || !unread} onClick={() => {void act('mark_all_notifications');}}><CheckCheck size={14}/>Прочитать все</Button><Button variant="outline" size="sm" onClick={() => {setOpen(false); go('notifications');}}>Реестр уведомлений<ArrowRight size={14}/></Button></footer>
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}

export default function Notifications() {
  const {state, product, team, ref, act, go, busy} = useKontur();
  const [status, setStatus] = useState('all');
  const [kind, setKind] = useState('all');
  const [query, setQuery] = useState('');
  const notifications = scopedNotifications(state.notifications, product.id, team.id);
  const unread = notifications.filter(item => !item.read).length;
  const kinds = Array.from(new Set(notifications.map(item => String(item.kind))));
  const filtered = notifications.filter(item => (status === 'all' || (status === 'unread' ? !item.read : item.read)) && (kind === 'all' || item.kind === kind) && `${item.kind} ${item.title} ${item.text}`.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')));
  const selected = notifications.find(item => item.id === ref);
  function availableTarget(item: Item) {
    if (item.target === 'run') return state.runs.some(run => run.id === item.ref && run.teamId === team.id && run.productId === product.id);
    if (item.target === 'capability') return state.capabilities.some(cap => cap.id === item.ref && cap.productId === product.id);
    return ['home', 'tasks', 'environment', 'automation', 'settings', 'knowledge', 'benchmark', 'regulation', 'catalog', 'messenger'].includes(item.target);
  }
  async function select(item: Item) {
    if (!item.read && !(await act('mark_notification', {id: item.id}))?.ok) return;
    go('notifications', item.id);
  }
  async function openTarget(item: Item) {
    if (!availableTarget(item)) return;
    if (!item.read && !(await act('mark_notification', {id: item.id}))?.ok) return;
    go(item.target, item.ref || '');
  }
  return <div className="page notifications-page">
    <PageHead title="Уведомления" description={`Реестр событий · ${product.name} / ${team.name}`} actions={<Button variant="outline" disabled={busy || !unread} onClick={() => {void act('mark_all_notifications');}}><CheckCheck size={16}/>Отметить все прочитанными</Button>}/>
    <div className="notification-register-toolbar"><div className="row wrap"><Filter size={16}/><Pick label="Статус уведомления" value={status} onChange={setStatus} options={[{value: 'all', label: 'Все уведомления'}, {value: 'unread', label: 'Непрочитанные'}, {value: 'read', label: 'Прочитанные'}]}/><Pick label="Тип уведомления" value={kind} onChange={setKind} options={[{value: 'all', label: 'Все события'}, ...kinds.map(value => ({value, label: value}))]}/></div><div className="notification-search"><Search size={15}/><Input aria-label="Поиск уведомлений" placeholder="Найти уведомление" value={query} onChange={event => setQuery(event.target.value)}/></div><Pill>{filtered.length}</Pill></div>
    {selected && <Card className="notification-selected" title={<span className="row"><Bell size={18}/>{selected.kind}</span>} action={<Button variant="ghost" size="sm" onClick={() => go('notifications')} aria-label="Закрыть выбранное уведомление"><X size={15}/></Button>}><div className="row between wrap"><h2>{selected.title}</h2><Pill tone={selected.read ? '' : 'green'}>{selected.read ? 'Прочитано' : 'Новое'}</Pill></div><p className="notification-full-text">{selected.text}</p><div className="row between wrap"><span className="task-sub"><DateText value={selected.time}/></span>{availableTarget(selected) && <Button variant="outline" disabled={busy} onClick={() => {void openTarget(selected);}}>Перейти к объекту<ArrowRight size={15}/></Button>}</div></Card>}
    <Card body={false}>{filtered.length ? <Table><TableHeader><TableRow><TableHead className="notification-state-cell">Статус</TableHead><TableHead>Событие</TableHead><TableHead>Уведомление</TableHead><TableHead>Дата</TableHead><TableHead className="text-right">Действие</TableHead></TableRow></TableHeader><TableBody>{filtered.map(item => <TableRow key={item.id} className={`${item.read ? '' : 'notification-unread-row'} ${selected?.id === item.id ? 'notification-active-row' : ''}`}><TableCell className="notification-state-cell">{item.read ? <span className="notification-read"><Check size={14}/>Прочитано</span> : <Pill tone="green">Новое</Pill>}</TableCell><TableCell><span className="notification-kind">{item.kind}</span></TableCell><TableCell><button type="button" className="notification-title-button" disabled={busy} onClick={() => {void select(item);}}><strong>{item.title}</strong><span>{item.text}</span></button></TableCell><TableCell className="notification-time"><DateText value={item.time}/></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" disabled={busy} onClick={() => {void select(item);}}>Открыть<ArrowRight size={14}/></Button></TableCell></TableRow>)}</TableBody></Table> : <Blank title={notifications.length ? 'Уведомлений по этим фильтрам нет' : 'Уведомлений пока нет'} text="События жизненного цикла среды, запусков и Capability сохраняются в этом реестре."/>}</Card>
  </div>;
}
