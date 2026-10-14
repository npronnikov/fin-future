'use client';
import {useEffect, useState} from 'react';
import {ArrowRight, FolderKanban, Play, ShieldCheck, Tag} from 'lucide-react';
import {useKontur} from './context';
import {Button, Field, KV, Modal, Notice, Pick, Pill, Status} from './ui';
import {currentRelease, flowIssues, getFlowNodes, shortConfig, type Capability, type Config} from '@/lib/domain';

export default function FlowLaunch({open, onClose, cap, config, dirty, save}: {
  open: boolean; onClose: () => void; cap: Capability; config: Config; dirty: boolean; save: () => Promise<boolean>;
}) {
  const {state, actor, team, product, act, can, busy, go} = useKontur();
  const release = currentRelease(cap);
  const [boardId, setBoardId] = useState('all');
  const [taskId, setTaskId] = useState('');
  const [launching, setLaunching] = useState(false);
  const tasks = state.tasks.filter(task => task.productId === cap.productId && task.teamId === team.id && task.tag === cap.tag);
  const boards = state.boards.filter(board => board.teamId === team.id && board.productId === cap.productId && tasks.some(task => task.boardId === board.id));
  const activeRun = (id: string) => state.runs.find(run => run.taskId === id && run.teamId === team.id && !run.completedAt && !['failed', 'cancelled'].includes(run.status));
  const executionConfig = cap.draft ? config : release?.snapshot.config || config;
  useEffect(() => {
    if (!open) return;
    setBoardId('all');
    const first = tasks.find(task => task.status !== 'done' && executionConfig.repos.includes(task.repo) && !activeRun(task.id)) || tasks.find(task => executionConfig.repos.includes(task.repo) && !activeRun(task.id));
    setTaskId(first?.id || '');
  }, [open, cap.id, team.id]);
  const task = tasks.find(item => item.id === taskId);
  const filtered = tasks.filter(item => boardId === 'all' || item.boardId === boardId);
  const pending = task && activeRun(task.id);
  const activeCount = state.runs.filter(run => run.teamId === team.id && !run.completedAt && !['failed', 'cancelled'].includes(run.status)).length;
  const reviewers = state.people.filter(person => team.people.includes(person.id) && person.assignments.includes('capability.review'));
  const gateAssignee = reviewers.find(person => person.id === actor.id) || reviewers.find(person => person.id === executionConfig.gateAssignee) || reviewers[0];
  const reasons = [
    !can('Product Engineer') ? 'Для запуска требуется Product Engineer этой команды.' : '',
    team.environment.status !== 'ready' ? 'Environment ещё не готов.' : '',
    activeCount >= team.environment.parallel ? `Достигнут лимит: ${activeCount} из ${team.environment.parallel} активных запусков.` : '',
    executionConfig.runtime !== team.automation ? 'Платформа Flow отличается от платформы команды.' : '',
    !task ? 'Выберите задачу с тегом этого Flow.' : '',
    pending ? `Для этой задачи уже выполняется ${pending.id}.` : '',
    task && !executionConfig.repos.includes(task.repo) ? 'Git-репозиторий задачи не подключён к этому Flow.' : '',
    !gateAssignee ? 'Добавьте участнику команды разрешение на проверку capability (capability.review).' : '',
    ...flowIssues(executionConfig, {allowLegacyExecutors: !cap.draft}),
  ].filter(Boolean);
  const saveBeforeRun = cap.teamId === team.id && !!cap.draft && dirty;
  async function launch() {
    if (!task || reasons.length || launching) return;
    setLaunching(true);
    try {
      if (saveBeforeRun && !(await save())) return;
      const result = await act('start_run', {taskId: task.id, capabilityId: cap.id, mode: 'supervised'});
      if (result?.id) {onClose(); go('run', result.id);}
    } finally {setLaunching(false);}
  }
  return <Modal open={open} onClose={() => {if (!launching) onClose();}} title="Запустить задачу" description={`${cap.name} · #${cap.tag} · ${product.name} / ${team.name}`} wide>
    <div className="flow-launch-grid">
      <div className="stack"><Field label="Доска задач"><Pick label="Доска запуска" value={boardId} onChange={value => {setBoardId(value); if (value !== 'all' && task?.boardId !== value) setTaskId('');}} options={[{value: 'all', label: 'Все доски моей команды'}, ...boards.map(board => ({value: board.id, label: board.name}))]} disabled={launching}/></Field>
        <div className="flow-launch-task-list" aria-label="Задачи для запуска Flow">{filtered.map(item => {
          const active = activeRun(item.id), outside = !executionConfig.repos.includes(item.repo);
          return <button type="button" key={item.id} className={`flow-launch-task-card ${taskId === item.id ? 'selected' : ''}`} aria-pressed={taskId === item.id} disabled={launching || !!active || outside} onClick={() => setTaskId(item.id)}><div className="row between"><span className="mono">{item.externalId || item.id}</span><Status value={item.status}/></div><strong>{item.title}</strong><span className="flow-launch-repo">{item.repo}</span><small>{boards.find(board => board.id === item.boardId)?.name}{item.mock ? ' · Mock' : ''}</small>{(active || outside) && <span className="flow-launch-disabled">{active ? `Активный ${active.id}` : 'Git-репозиторий не подключён к Flow'}</span>}</button>;
        })}{!filtered.length && <div className="flow-launch-empty"><FolderKanban size={24}/><h3>Нет задач для этого тега</h3><p>Добавьте задачи с тегом #{cap.tag} на доску вашей команды.</p></div>}</div>
        <Button type="button" variant="outline" disabled={launching} onClick={() => {onClose(); go('tasks', boardId === 'all' ? '' : boardId);}}>Открыть доску задач<ArrowRight size={15}/></Button>
      </div>
      <div className="flow-launch-summary stack"><div><p className="flow-launch-mode-label">Режим запуска</p><div className="flow-launch-mode"><ShieldCheck size={17}/><strong>Supervised</strong></div><p className="flow-inspector-hint">Запуск выбранной задачи с участием человека.</p></div>
        <div className="row wrap"><Pill tone="green"><Tag size={12}/>#{cap.tag}</Pill><Pill>{executionConfig.runtime}</Pill></div>
        <div><KV label="Конфигурация">{shortConfig(executionConfig)}</KV><KV label="Шаги">{getFlowNodes(executionConfig).length}</KV><KV label="Ответственный за проверку">{gateAssignee?.name || 'Не назначен'}</KV><KV label="Environment">{team.environment.name}</KV></div>
        {saveBeforeRun && <Notice tone="blue" title="Flow изменён">Перед запуском будут сохранены текущие настройки Flow и узлов. Запуск получит снимок сохранённой конфигурации.</Notice>}
        {reasons.length > 0 && <div className="flow-launch-reasons" role="status"><strong>Для запуска:</strong><ul>{reasons.map((reason, index) => <li key={`${reason}-${index}`}>{reason}</li>)}</ul></div>}
        <p className="flow-launch-note">Демонстрационное исполнение. После запуска откроется запуск с Timeline, Human Gates и артефактами.</p>
      </div>
    </div>
    <div className="actions"><Button variant="outline" disabled={launching} onClick={onClose}>Отмена</Button><Button disabled={busy || launching || reasons.length > 0} onClick={() => {void launch();}}><Play size={16}/>{launching ? 'Запуск…' : saveBeforeRun ? 'Сохранить и запустить сценарий' : 'Запустить сценарий'}</Button></div>
  </Modal>;
}
