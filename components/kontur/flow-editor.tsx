'use client';
import {useEffect, useId, useRef, useState} from 'react';
import {ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bot, Box, Check, CheckCircle2, Code2, FileCheck, FileText, Grip, Layers, Lock, Maximize2, Minus, Network, Plus, Save, Settings2, ShieldCheck, Sparkles, Trash2, Users, Workflow} from 'lucide-react';
import {useKontur} from './context';
import {Button, Field, Input, Textarea, Pick, Pill, Modal, Notice, Toggle} from './ui';
import SandboxPreview from './sandbox-preview';
import {createFlowNode, flowIssues, getFlowNodes, getEditableFlowNodes, type Config, type FlowNode, type FlowNodeType, type Team} from '@/lib/domain';

const typeNames: Record<FlowNodeType, string> = {task: 'Входная задача', analysis: 'Анализ', specification: 'Specification', input: 'Input gate', approval: 'Approval gate', implementation: 'Реализация', checks: 'Проверки', result: 'Результат', custom: 'Свой шаг'};
const nodeIcons = {task: Box, analysis: Sparkles, specification: FileText, input: Users, approval: Users, implementation: Code2, checks: FileCheck, result: CheckCircle2, custom: Workflow};
const NODE_WIDTH = 208, NODE_HEIGHT = 158, STEP_X = 264, STEP_Y = 222, WORLD_WIDTH = 880;
function position(index: number) {const row = Math.floor(index / 3); return {x: 72 + (row % 2 === 0 ? index % 3 : 2 - index % 3) * STEP_X, y: 104 + row * STEP_Y};}
function executorName(node: FlowNode, _runtime: string) {return node.executor === 'human' ? `Человек · ${node.type === 'input' ? 'Input gate' : 'Approval gate'}` : 'Кодинг-агент';}
function nodeReady(node: FlowNode) {return !!node.name.trim() && (node.executor !== 'agent' || !!node.skills.length && !!node.instructions.trim());}

export default function FlowEditor({config, savedConfig, flowName, ownerTeam, onNameChange, editable, busy, dirty, onChange, onSave}: {
  config: Config; savedConfig: Config; flowName: string; ownerTeam: Team; onNameChange: (name: string) => void; editable: boolean; busy: boolean; dirty: boolean;
  onChange: (config: Config) => void; onSave: () => Promise<boolean>;
}) {
  const {state} = useKontur();
  const team = ownerTeam;
  const nodes = editable ? getEditableFlowNodes(config) : getFlowNodes(config);
  const savedNodes = editable ? getEditableFlowNodes(savedConfig) : getFlowNodes(savedConfig);
  const [selectedId, setSelectedId] = useState(nodes.find(node => !['task', 'result'].includes(node.type))?.id || nodes[0]?.id || '');
  const [inspectorTab, setInspectorTab] = useState('settings');
  const [surface, setSurface] = useState('flow');
  const [adding, setAdding] = useState(false);
  const [addType, setAddType] = useState<FlowNodeType>('analysis');
  const selected = nodes.find(node => node.id === selectedId) || nodes[0];
  const savedNode = savedNodes.find(node => node.id === selected?.id);
  const nodeDirty = !!selected && JSON.stringify(selected) !== JSON.stringify(savedNode);
  const issues = [...flowIssues(config, {allowLegacyExecutors: !editable}), ...(!flowName.trim() ? ['Укажите название Flow.'] : []), ...(config.tokenLimit !== undefined && (!Number.isInteger(config.tokenLimit) || config.tokenLimit <= 0 || config.tokenLimit > 10000000) ? ['Лимит токенов должен быть целым числом от 1 до 10 000 000.'] : [])];
  const skills = state.assets.filter(asset => asset.type === 'Skills' && asset.runtimes.includes(config.runtime) && !['Withdrawn', 'Revoked'].includes(asset.status));
  const subagents = state.assets.filter(asset => asset.type === 'Subagents' && asset.runtimes.includes(config.runtime) && !['Withdrawn', 'Revoked'].includes(asset.status));
  const availableCI = team.bindings.some(binding => binding.type === 'CI' && binding.status === 'connected');
  function updateNodes(next: FlowNode[]) {onChange({...config, nodeConfigs: next, nodes: next.map(node => node.name)});}
  function edit<K extends keyof FlowNode>(key: K, value: FlowNode[K]) {if (!selected || !editable) return; updateNodes(nodes.map(node => node.id === selected.id ? {...node, [key]: value} : node));}
  function move(delta: number) {
    if (!selected) return;
    const index = nodes.findIndex(node => node.id === selected.id), target = index + delta;
    if (target < 0 || target >= nodes.length || selected.type === 'task' || selected.type === 'result' || ['task', 'result'].includes(nodes[target].type)) return;
    const next = [...nodes]; [next[index], next[target]] = [next[target], next[index]]; updateNodes(next);
  }
  function remove() {
    if (!selected || ['task', 'result'].includes(selected.type)) return;
    const index = nodes.findIndex(node => node.id === selected.id);
    const next = nodes.filter(node => node.id !== selected.id);
    updateNodes(next); setSelectedId(next[Math.min(index, next.length - 1)]?.id || '');
  }
  function add() {
    const node = createFlowNode(addType, `node-${crypto.randomUUID()}`, config);
    const index = Math.min(Math.max(1, nodes.findIndex(item => item.id === selected?.id) + 1), Math.max(0, nodes.length - 1));
    const next = [...nodes]; next.splice(index, 0, node); updateNodes(next); setSelectedId(node.id); setInspectorTab('settings'); setAdding(false);
  }
  const selectedIndex = nodes.findIndex(node => node.id === selected?.id);
  const fixedStep = (node?: FlowNode) => !node || ['task', 'result'].includes(node.type);
  const canMoveEarlier = !fixedStep(selected) && !fixedStep(nodes[selectedIndex - 1]);
  const canMoveLater = !fixedStep(selected) && !fixedStep(nodes[selectedIndex + 1]);
  const Icon = selected ? nodeIcons[selected.type] || Workflow : Workflow;

  return <section className="flow-editor" aria-label="Редактор Flow">
    <div className="flow-workspace">
      <div className="flow-workspace-main">
        <div className="flow-canvas-card">
          <header className="flow-canvas-toolbar"><div className="flow-canvas-tabs" role="tablist" aria-label="Рабочая поверхность Flow"><button type="button" role="tab" aria-selected={surface === 'flow'} className={surface === 'flow' ? 'active' : ''} onClick={() => setSurface('flow')}><Workflow size={15}/>Сценарий</button><button type="button" role="tab" aria-selected={surface === 'topology'} className={surface === 'topology' ? 'active' : ''} onClick={() => setSurface('topology')}><Network size={15}/>Контур и доступы</button></div><div className="flow-canvas-tools"><span>{nodes.length} шагов</span>{editable && <Button variant="outline" size="sm" disabled={busy || nodes.length >= 24} onClick={() => setAdding(true)}><Plus size={14}/>Добавить шаг</Button>}</div></header>
          {surface === 'flow' ? <FlowGraph nodes={nodes} runtime={config.runtime} selectedId={selected?.id || ''} onSelect={id => {setSelectedId(id);}} readOnly={!editable}/> : <div className="flow-topology"><SandboxPreview team={team} form={{...team.environment, automation: config.runtime}} confirmed={team.environment.status === 'ready'}/></div>}
          <footer className="flow-canvas-footer"><span><Lock size={12}/>До запуска и После запуска — системные стадии</span><span>{editable ? 'Выберите шаг для настройки' : 'Только просмотр'}</span></footer>
        </div>
        {issues.length > 0 && <div className="flow-validation" role="status"><ShieldCheck size={18}/><div><strong>Проверьте Flow перед сохранением</strong><ul>{issues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}</ul></div></div>}
        <div className="flow-editor-note"><Settings2 size={16}/><span>Порядок шагов задаёт последовательность исполнения. Skills, Subagents и параметры узлов сохраняются в конфигурации и Snapshot каждого запуска.</span></div>
      </div>
      <aside className="flow-node-inspector" aria-label="Настройки выбранного узла">
        {selected ? <>
          <div className="flow-inspector-tabs" role="tablist" aria-label="Вкладки настройки узла">{[{id: 'settings', name: 'Настроить'}, {id: 'skills', name: `Навыки · ${selected.skills.length}`}, {id: 'subagents', name: `Субагенты · ${selected.subagents?.length || 0}`} ].map(tab => <button key={tab.id} type="button" role="tab" aria-selected={inspectorTab === tab.id} className={inspectorTab === tab.id ? 'active' : ''} onClick={() => setInspectorTab(tab.id)}>{tab.name}</button>)}</div>
          <div className="flow-inspector-header"><div><span className={`workflow-node-icon ${selected.type}`}><Icon size={23}/></span><Pill>{!editable && <Lock size={11}/>}Шаг {selectedIndex + 1} · r{savedNode?.revision || 1}</Pill></div><h2>{selected.name || typeNames[selected.type]}</h2><p>{typeNames[selected.type]} · {executorName(selected, config.runtime)}</p></div>
          <div className="flow-inspector-body">
            {inspectorTab === 'settings' && <div className="stack">
              <div className="flow-inspector-flow-info stack"><h3>Сценарий</h3><Field label="Название Flow"><Input value={flowName} onChange={event => onNameChange(event.target.value)} maxLength={160} disabled={!editable || busy}/></Field><Field label="Описание Flow"><Textarea rows={3} value={config.description || ''} onChange={event => onChange({...config, description: event.target.value})} maxLength={20000} disabled={!editable || busy} placeholder="Что делает Flow и для каких задач он предназначен"/></Field></div><div className="flow-inspector-subtitle">Выбранный шаг</div>
              <Field label="Название шага"><Input value={selected.name} onChange={event => edit('name', event.target.value)} maxLength={160} disabled={!editable || busy}/></Field>
              <Field label="Исполнитель"><Pick label="Исполнитель шага" value={selected.executor === 'human' ? 'human' : 'agent'} onChange={value => edit('executor', value as FlowNode['executor'])} options={['input', 'approval'].includes(selected.type) ? [{value: 'human', label: 'Человек'}] : [{value: 'agent', label: 'Кодинг-агент'}]} disabled={!editable || busy}/></Field>
              {['input', 'approval'].includes(selected.type) && <Field label="Тип гейта"><Pick label="Тип Human Gate" value={selected.type} onChange={value => {const next = {...selected, type: value as FlowNodeType, executor: 'human' as const}; updateNodes(nodes.map(node => node.id === selected.id ? next : node));}} options={[{value: 'input', label: 'Input gate · ввод от человека'}, {value: 'approval', label: 'Approval gate · согласование'}]} disabled={!editable || busy}/></Field>}
              <Field label="Вход шага"><Textarea rows={3} value={selected.input} onChange={event => edit('input', event.target.value)} disabled={!editable || busy}/></Field>
              <Field label="Результат шага"><Textarea rows={3} value={selected.output} onChange={event => edit('output', event.target.value)} disabled={!editable || busy}/></Field>
              {selected.type === 'checks' && <Field label="Среда проверки"><Pick label="Среда проверки" value={selected.verification} onChange={value => edit('verification', value as FlowNode['verification'])} options={[{value: 'local', label: 'Локально в Sandbox'}, {value: 'ci', label: 'CI · подключённый ресурс', disabled: !availableCI}]} disabled={!editable || busy}/></Field>}
              <Field label="Лимит автоматических доработок" hint="От 0 до 5. Параметр сохраняется в Snapshot запуска."><Input type="number" min={0} max={5} value={selected.maxRetries} onChange={event => edit('maxRetries', Number(event.target.value))} disabled={!editable || busy}/></Field>
              {['input', 'approval'].includes(selected.type) && <Notice tone="blue" title="Human Gate">В Supervised решение принимает участник команды с разрешением на проверку capability (capability.review). В UAT и Production участие человека не запрашивается.</Notice>}
            </div>}
            {inspectorTab === 'skills' && <div className="stack"><Field label="Основной skill · инструкции шага"><Textarea rows={8} value={selected.instructions} onChange={event => edit('instructions', event.target.value)} disabled={!editable || busy}/></Field><div className="flow-inspector-section"><h3>Подключённые skills</h3><p className="flow-inspector-hint">Точные версии из Catalog для {config.runtime}.</p><div className="flow-node-skills">{skills.map(skill => {const key = `${skill.id}@${skill.version}`, active = selected.skills.includes(key); return <button key={key} type="button" className={`flow-skill-item ${active ? 'active' : ''}`} aria-pressed={active} disabled={!editable || busy} onClick={() => edit('skills', active ? selected.skills.filter(value => value !== key) : [...selected.skills, key])}><span className="flow-skill-mark">{active ? <Check size={14}/> : <Plus size={14}/>}</span><span><strong>{skill.name}</strong><small>{key}</small></span></button>;})}{selected.skills.filter(key => !skills.some(skill => `${skill.id}@${skill.version}` === key)).map(key => <button type="button" className="flow-skill-item active" key={key} aria-label={`Убрать skill ${key}`} disabled={!editable || busy} onClick={() => edit('skills', selected.skills.filter(value => value !== key))}><Lock size={14}/><span><strong>{key}</strong><small>{editable ? 'Недоступен для выбора · нажмите, чтобы убрать' : 'Закреплённая версия'}</small></span></button>)}</div></div></div>}
            {inspectorTab === 'subagents' && <div className="stack"><div className="flow-inspector-section"><h3>Subagents шага</h3><p className="flow-inspector-hint">Выберите помощников из каталога. К узлу подключается точная версия subagent.</p><div className="flow-node-skills">{subagents.map(agent => {const key = `${agent.id}@${agent.version}`, attached = selected.subagents || [], active = attached.includes(key); return <button key={key} type="button" className={`flow-skill-item flow-subagent-item ${active ? 'active' : ''}`} aria-pressed={active} disabled={!editable || busy} onClick={() => edit('subagents', active ? attached.filter(value => value !== key) : [...attached, key])}><span className="flow-skill-mark">{active ? <Check size={14}/> : <Plus size={14}/>}</span><span><strong>{agent.name}</strong><small>{key}</small><p>{agent.instruction || agent.changelog}</p></span></button>;})}{(selected.subagents || []).filter(key => !subagents.some(agent => `${agent.id}@${agent.version}` === key)).map(key => <button key={key} type="button" className="flow-skill-item active" aria-label={`Убрать subagent ${key}`} disabled={!editable || busy} onClick={() => edit('subagents', (selected.subagents || []).filter(value => value !== key))}><Lock size={14}/><span><strong>{key}</strong><small>{editable ? 'Недоступен для выбора · нажмите, чтобы убрать' : 'Закреплённая версия'}</small></span></button>)}</div>{!subagents.length && !(selected.subagents || []).length && <p className="flow-inspector-hint">Для этой платформы в каталоге пока нет subagents.</p>}</div><div className="flow-node-rules"><Users size={17}/><p>Подключённые subagents и их версии входят в снимок конфигурации запуска.</p></div></div>}
          </div>
          <footer className="flow-inspector-actions">
            {editable ? <><Button disabled={busy || !dirty || issues.length > 0} onClick={() => {void onSave();}}><Save size={15}/>{nodeDirty ? 'Сохранить шаг' : 'Сохранить сценарий'}</Button><p className="flow-inspector-hint">Изменения сохраняются в следующей версии Flow в командном пространстве.</p><div className="flow-step-actions"><button type="button" className="icon-btn" aria-label="Переместить шаг раньше" title="Переместить шаг раньше" disabled={busy || !canMoveEarlier} onClick={() => move(-1)}><ArrowUp size={15}/></button><button type="button" className="icon-btn" aria-label="Переместить шаг позже" title="Переместить шаг позже" disabled={busy || !canMoveLater} onClick={() => move(1)}><ArrowDown size={15}/></button><span/><button type="button" className="icon-btn danger" aria-label="Удалить выбранный шаг" title="Удалить шаг" disabled={busy || ['task', 'result'].includes(selected.type)} onClick={remove}><Trash2 size={15}/></button></div></> : <p className="flow-inspector-hint"><Lock size={12}/>Настройка шагов доступна Product Engineer в редактируемой Draft.</p>}
          </footer>
        </> : <div className="flow-inspector-body"><p>Добавьте шаг, чтобы настроить его.</p></div>}
      </aside>
    </div>
    <Modal open={adding} onClose={() => setAdding(false)} title="Добавить шаг Flow" description="Новый шаг появится после выбранного, перед Result."><div className="stack"><Field label="Тип шага"><Pick label="Тип нового шага" value={addType} onChange={value => setAddType(value as FlowNodeType)} options={(['analysis', 'specification', 'input', 'approval', 'implementation', 'checks', 'custom'] as FlowNodeType[]).map(type => ({value: type, label: typeNames[type]}))}/></Field><p className="subtext">После добавления настройте исполнителя, skills, subagents, входы и результаты. Порядок проверяется при сохранении.</p><div className="actions"><Button variant="outline" onClick={() => setAdding(false)}>Отмена</Button><Button onClick={add} disabled={!editable || busy}>Добавить шаг</Button></div></div></Modal>
  </section>;
}

function FlowGraph({nodes, runtime, selectedId, onSelect, readOnly}: {nodes: FlowNode[]; runtime: string; selectedId: string; onSelect: (id: string) => void; readOnly: boolean}) {
  const viewport = useRef<HTMLDivElement>(null);
  const gesture = useRef<{x: number; y: number; originX: number; originY: number} | null>(null);
  const [view, setView] = useState({scale: .72, x: 15, y: 10});
  const arrowId = `flow-arrow-${useId().replace(/:/g, '')}`;
  const worldHeight = Math.max(490, 104 + Math.ceil(nodes.length / 3) * STEP_Y + 52);
  function fit() {
    const width = viewport.current?.clientWidth || 880, height = viewport.current?.clientHeight || 535;
    const scale = Math.max(.35, Math.min(1, (width - 32) / WORLD_WIDTH, (height - 32) / worldHeight));
    setView({scale, x: Math.max(12, (width - WORLD_WIDTH * scale) / 2), y: Math.max(12, (height - worldHeight * scale) / 2)});
  }
  useEffect(() => {fit(); const observer = new ResizeObserver(fit); if (viewport.current) observer.observe(viewport.current); return () => observer.disconnect();}, [worldHeight]);
  function zoom(factor: number) {
    setView(previous => {const scale = Math.max(.35, Math.min(1.6, previous.scale * factor)), centerX = (viewport.current?.clientWidth || 880) / 2, centerY = (viewport.current?.clientHeight || 535) / 2; return {scale, x: centerX - (centerX - previous.x) * scale / previous.scale, y: centerY - (centerY - previous.y) * scale / previous.scale};});
  }
  const paths = nodes.slice(1).map((node, index) => {
    const a = position(index), b = position(index + 1);
    if (a.y === b.y) {const right = b.x > a.x, x1 = a.x + (right ? NODE_WIDTH : 0), x2 = b.x + (right ? 0 : NODE_WIDTH), y = a.y + NODE_HEIGHT / 2; return {id: node.id, d: `M ${x1} ${y} C ${(x1 + x2) / 2} ${y}, ${(x1 + x2) / 2} ${y}, ${x2} ${y}`};}
    const x = a.x + NODE_WIDTH / 2, y1 = a.y + NODE_HEIGHT, y2 = b.y; return {id: node.id, d: `M ${x} ${y1} C ${x} ${(y1 + y2) / 2}, ${x} ${(y1 + y2) / 2}, ${x} ${y2}`};
  });
  const first = nodes.length ? position(0) : null, last = nodes.length ? position(nodes.length - 1) : null;
  let returnPath = '';
  if (last) {
    const x = last.x + NODE_WIDTH / 2, bottom = last.y + NODE_HEIGHT, loopY = bottom + 25;
    returnPath = `M ${x} ${bottom} C ${x} ${loopY}, ${x} ${loopY}, ${x - 28} ${loopY} L 45 ${loopY} Q 26 ${loopY}, 26 ${loopY - 20} L 26 56 Q 26 36, 46 36 L 310 36`;
  }
  return <div className="flow-graph-viewport" ref={viewport} aria-label="Схема Flow" onPointerDown={event => {if ((event.target as HTMLElement).closest('button') || event.button !== 0) return; gesture.current = {x: event.clientX, y: event.clientY, originX: view.x, originY: view.y}; event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event => {if (!gesture.current) return; const start = gesture.current; setView(previous => ({...previous, x: start.originX + event.clientX - start.x, y: start.originY + event.clientY - start.y}));}} onPointerUp={() => {gesture.current = null;}} onPointerCancel={() => {gesture.current = null;}}>
    <div className="flow-graph-label"><span/>WORKING FLOW <i>/</i> {readOnly ? 'READ ONLY' : 'DRAFT'}</div>
    <div className="flow-graph-world" style={{width: WORLD_WIDTH, height: worldHeight, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`}}>
      <svg className="flow-graph-edges" width={WORLD_WIDTH} height={worldHeight} aria-hidden="true"><defs><marker id={arrowId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="currentColor" strokeWidth="1.2"/></marker></defs>{paths.map(path => <path className="flow-graph-edge" key={path.id} d={path.d} markerEnd={`url(#${arrowId})`}/>)}{first && <path className="flow-graph-edge system" d={`M 440 60 C 440 83, ${first.x + NODE_WIDTH / 2} 80, ${first.x + NODE_WIDTH / 2} ${first.y}`} markerEnd={`url(#${arrowId})`}/>} {last && <path className="flow-graph-edge system" d={`M ${last.x + NODE_WIDTH / 2} ${last.y + NODE_HEIGHT} C ${last.x + NODE_WIDTH / 2} ${worldHeight - 75}, 440 ${worldHeight - 80}, 440 ${worldHeight - 60}`} markerEnd={`url(#${arrowId})`}/>} {returnPath && <path className="flow-graph-edge rework" d={returnPath} markerEnd={`url(#${arrowId})`}><title>Rework: новая попытка всего Flow с сохранением истории</title></path>}</svg>
      <div className="flow-system-node" style={{left: 310, top: 12}}><Lock size={15}/><span>До запуска<strong>Regulatory Plan</strong></span><ShieldCheck size={16}/></div>
      {nodes.map((node, index) => {const at = position(index), Icon = nodeIcons[node.type] || Workflow; return <button type="button" className={`workflow-node-card ${selectedId === node.id ? 'selected' : ''} ${readOnly ? 'locked' : ''}`} key={node.id} style={{left: at.x, top: at.y, width: NODE_WIDTH, height: NODE_HEIGHT}} data-kind={node.type} data-node-id={node.id} aria-pressed={selectedId === node.id} aria-label={`Настроить шаг ${index + 1}: ${node.name}`} onClick={() => onSelect(node.id)}><span className="workflow-node-port top"/><span className="workflow-node-port bottom"/><span className="workflow-node-port left"/><span className="workflow-node-port right"/><span className="workflow-node-top"><span className={`workflow-node-icon ${node.type}`}><Icon size={21}/></span><span className="workflow-node-index">{String(index + 1).padStart(2, '0')}</span></span><strong className="workflow-node-title">{node.name || 'Шаг без названия'}</strong><span className="workflow-node-executor">{executorName(node, runtime)}</span><span className={`workflow-node-status ${nodeReady(node) ? '' : 'incomplete'}`}><i/>{readOnly ? 'Только просмотр' : nodeReady(node) ? 'Настроен' : 'Требует настройки'}<span>r{node.revision}</span></span></button>;})}
      <div className="flow-system-node finish" style={{left: 310, top: worldHeight - 60}}><Lock size={15}/><span>После запуска<strong>Regulatory Evidence</strong></span><CheckCircle2 size={16}/></div>
    </div>
    <div className="flow-canvas-controls"><button type="button" aria-label="Увеличить схему" onClick={() => zoom(1.2)}><Plus size={15}/></button><button type="button" aria-label="Уменьшить схему" onClick={() => zoom(1 / 1.2)}><Minus size={15}/></button><button type="button" aria-label="Показать Flow целиком" onClick={fit}><Maximize2 size={14}/></button><span>{Math.round(view.scale * 100)}%</span></div><div className="flow-pan-hint"><Grip size={13}/>Перетащите фон для перемещения</div>
  </div>;
}
