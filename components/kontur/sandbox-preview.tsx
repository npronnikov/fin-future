'use client';
import {useState} from 'react';
import {ArrowRight, Bot, Boxes, GitBranch, Layers, Lock, Monitor, Network, Server, Shield, Workflow} from 'lucide-react';
import type {Item, Team} from '@/lib/domain';
import {KV, Pill} from './ui';

export function resourceTypeLabel(type: string) {return type === 'Repository' ? 'Git-репозиторий' : type === 'CI' ? 'Jenkins CI' : type;}
export function bindingPermissions(binding: Item): string[] {
  if (Array.isArray(binding.permissions)) return binding.permissions.filter((value: unknown): value is string => typeof value === 'string');
  return [binding.read ? 'read' : '', binding.write ? 'write' : '', binding.createPr ? 'create_pr' : ''].filter(Boolean);
}
const permissionNames: Record<string, string> = {read: 'Чтение (read)', write: 'Запись (write)', admin: 'Администрирование (admin)', create_pr: 'Создание pull request (create_pr)'};

export default function SandboxPreview({team, form, confirmed = false}: {team: Team; form: Item; confirmed?: boolean}) {
  const [selected, setSelected] = useState('boundary');
  const bindings = team.bindings.filter(binding => ['Repository', 'Task Tracker', 'CI'].includes(binding.type));
  const nodes = [
    {id: 'interface', name: 'Интерфейс автоматизации', role: 'Рабочая поверхность команды', description: 'Задачи, конфигурации, события запусков и переходы в Human Gates.', icon: Monitor},
    {id: 'runtime', name: form.automation || 'Automation', role: form.automation === 'AI Manager' ? 'Manager-agent · координатор' : 'Среда оркестрации · координатор', description: form.automation === 'AI Manager' ? 'Выбирает действия и handoffs в пределах заданной конфигурации.' : 'Управляет последовательностью этапов и фиксирует события исполнения.', icon: form.automation === 'AI Manager' ? Bot : Workflow},
    {id: 'worker', name: form.automation === 'AI Manager' ? 'Worker agents' : 'Кодинг-агент', role: 'Исполнение задач', description: 'Исполняет задачу с выбранными skills, context и разрешёнными ресурсами.', icon: Bot},
  ];
  const node = nodes.find(item => item.id === selected);
  const binding = bindings.find(item => item.id === selected);
  return <section className="studio-preview" aria-label="Предварительная схема инфраструктуры">
    <header className="studio-preview-head"><div><span className="eyebrow">ПРЕДВАРИТЕЛЬНАЯ СХЕМА</span><h2>Инфраструктура команды</h2></div><Pill tone={confirmed ? 'green' : ''}>{confirmed ? 'Environment Ready · demo' : 'Preview · demo'}</Pill></header>
    <div className="studio-preview-metrics"><span><Server size={15}/><strong>3</strong> компонента</span><span><Network size={15}/><strong>{bindings.length}</strong> внешних ресурсов</span><span><Layers size={15}/>{form.automation || 'Основа не выбрана'}</span></div>
    <div className="studio-preview-graph">
      <div className="studio-sandbox">
        <button className={`sandbox-boundary-label ${selected === 'boundary' ? 'active' : ''}`} onClick={() => setSelected('boundary')} type="button"><Shield size={15}/><span>ИНФРАСТРУКТУРА<strong>{team.environment.name}</strong></span><Lock size={13}/></button>
        <div className="studio-server-grid">{nodes.map((item, index) => <div className="studio-server-wrap" key={item.id}>
          <button type="button" className={`studio-server ${selected === item.id ? 'active' : ''}`} onClick={() => setSelected(item.id)} aria-pressed={selected === item.id}><span className="studio-server-icon"><item.icon size={22}/></span><span className="studio-node-number">0{index + 1}</span><strong>{item.name}</strong><small>{item.role}</small><span className="studio-node-state"><i/>{confirmed ? 'Готов · имитация' : 'Будет настроен'}</span></button>
          {index < nodes.length - 1 && <span className="studio-internal-link"><ArrowRight size={17}/></span>}
        </div>)}</div>
        <div className="sandbox-boundary-foot"><Lock size={12}/>{form.isolation} · {form.network}</div>
      </div>
      <div className="studio-external-list"><p className="eyebrow">ВНЕШНИЕ РЕСУРСЫ</p>{bindings.length ? bindings.map(item => <button type="button" className={selected === item.id ? 'active' : ''} key={item.id} onClick={() => setSelected(item.id)} aria-pressed={selected === item.id}><span className="external-connector-line"/><span className="external-icon">{item.type === 'Repository' ? <GitBranch size={18}/> : <Boxes size={18}/>}</span><span><strong>{item.name}</strong><small>{resourceTypeLabel(item.type)}{item.scope ? ` · ${item.scope}` : ''}</small></span><ArrowRight size={13}/></button>) : <div className="studio-external-empty">Подключите ресурсы на шаге Resources.</div>}</div>
    </div>
    <div className="studio-preview-inspector" aria-live="polite">
      <div className="preview-inspector-title"><span className="icon-tile">{binding ? <GitBranch size={18}/> : node ? <Server size={18}/> : <Shield size={18}/>}</span><div><p className="eyebrow">{binding ? 'RESOURCE BINDING' : node ? 'КОМПОНЕНТ' : 'ГРАНИЦА ОКРУЖЕНИЯ'}</p><h3>{binding?.name || node?.name || 'Инфраструктура'}</h3></div></div>
      {binding ? <><div className="preview-inspector-grid"><KV label="Размещение">Внешний ресурс</KV><KV label="Тип">{resourceTypeLabel(binding.type)}</KV><KV label="Связь">{form.automation} → {binding.name}</KV></div>{binding.type === 'Repository' ? <KV label="Permissions">{bindingPermissions(binding).map(value => permissionNames[value] || value).join(' · ') || 'Нет разрешений'}</KV> : <KV label={binding.type === 'Task Tracker' ? 'Проект (Scope)' : 'Pipeline / Job (Scope)'}><span className="mono">{binding.scope || binding.name}</span></KV>}</> : node ? <><p className="subtext">{node.description}</p><div className="preview-inspector-grid"><KV label="Runtime">{form.automation} @{form.runtimeVersion}</KV><KV label="Доступы">Подключённые ресурсы команды</KV><KV label="Сеть">{form.internet}</KV></div></> : <><p className="subtext">Предварительная схема исполнения команды. Конкретная технология изоляции выбирается при реализации среды. Внешние ресурсы доступны в пределах сохранённых Permissions и Scope.</p><div className="preview-inspector-grid"><KV label="Ресурсы">{form.cpu} CPU · {form.ram} GB RAM · {form.disk} GB disk</KV><KV label="Ограничения">TTL {form.ttl} h · {form.parallel} параллельных запусков</KV><KV label="Network policy">{form.internet}</KV></div></>}
    </div>
    <footer className="studio-preview-footer"><span><i/>Выберите компонент или внешний ресурс, чтобы посмотреть его роль и доступы.</span><span>Демонстрационная топология</span></footer>
  </section>;
}
