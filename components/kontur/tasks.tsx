'use client';
import {useEffect, useState} from 'react';
import {Filter, FolderKanban, GripVertical, Plus, Play, Tag, UserRound, Workflow} from 'lucide-react';
import {useKontur} from './context';
import {Button, Input, Textarea, Card, PageHead, Pill, Status, Pick, Modal, Detail, Field, KV, Blank, Notice, TextLink, DateText} from './ui';
import {capabilityForTag, currentRelease, shortConfig, snapshotTag, type Task} from '@/lib/domain';

const columns = [
  {id: 'backlog', name: 'Backlog'},
  {id: 'todo', name: 'К работе'},
  {id: 'in_progress', name: 'В работе'},
  {id: 'review', name: 'На проверке'},
  {id: 'done', name: 'Готово'},
];
const mockSets = [
  {value: 'mixed', label: 'Смешанный backlog · 12 примеров'},
  {value: 'dep-update', label: 'Обновление зависимостей · 4 примера'},
  {value: 'statement-doc', label: 'Выписки и справки · 4 примера'},
];
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(word => word[0]).join('');

export default function Tasks() {
  const {state, team, product, ref, tab, go, act, can, busy} = useKontur();
  const boards = state.boards.filter(board => board.teamId === team.id && board.productId === product.id);
  const tasks = state.tasks.filter(task => task.teamId === team.id && task.productId === product.id);
  const members = state.people.filter(person => team.people.includes(person.id));
  const caps = state.capabilities.filter(cap => cap.productId === product.id && !cap.legacyDuplicateOf);
  const [boardId, setBoardId] = useState(boards.some(board => board.id === ref) ? ref : 'all');
  const [tagFilter, setTagFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [boardOpen, setBoardOpen] = useState(false);
  const [boardForm, setBoardForm] = useState({name: '', description: ''});
  const [mockOpen, setMockOpen] = useState(false);
  const [mockForm, setMockForm] = useState({boardId: '', template: 'mixed', count: 12, assigneeId: 'unassigned'});
  const [selected, setSelected] = useState('');
  const [taskForm, setTaskForm] = useState({status: 'backlog', assigneeId: 'unassigned', tag: ''});
  const [dropColumn, setDropColumn] = useState('');
  useEffect(() => {if (boards.some(board => board.id === ref)) setBoardId(ref);}, [ref]);
  const tags = Array.from(new Set(tasks.map(task => task.tag).filter(Boolean))).sort();
  const selectedTag = tagFilter.startsWith('tag:') ? tagFilter.slice(4) : '';
  const filtered = tasks.filter(task =>
    (boardId === 'all' || task.boardId === boardId) &&
    (tagFilter === 'all' || (tagFilter === 'untagged' ? !task.tag : task.tag === selectedTag)) &&
    (assigneeFilter === 'all' || (assigneeFilter === 'unassigned' ? !task.assigneeId : task.assigneeId === assigneeFilter)));
  const currentBoard = boards.find(board => board.id === boardId);
  const boardTasks = tasks.filter(task => boardId === 'all' || task.boardId === boardId);
  const newTag = boardTasks.find(task => task.tag && !caps.some(cap => cap.tag === task.tag))?.tag || '';
  const selectedTagCap = capabilityForTag(state, product.id, selectedTag);
  const task = tasks.find(task => task.id === selected);
  const cap = task && capabilityForTag(state, product.id, task.tag);
  const release = cap && currentRelease(cap);
  const run = task && (state.runs.find(item => item.taskId === task.id && !item.completedAt && !['cancelled', 'failed'].includes(item.status)) || state.runs.filter(item => item.taskId === task.id && !item.uat).at(-1));
  const running = !!run && !run.completedAt && !['cancelled', 'failed'].includes(run.status);
  const editable = can('Product Owner', 'Product Engineer');
  const ready = team.environment.status === 'ready';
  const assigneeOptions = [{value: 'unassigned', label: 'Не назначен'}, ...members.map(person => ({value: person.id, label: person.name}))];

  function openTask(value: Task) {
    setSelected(value.id);
    setTaskForm({status: value.status, assigneeId: value.assigneeId || 'unassigned', tag: value.tag});
  }
  function openMocks() {
    setMockForm({boardId: currentBoard?.id || boards[0]?.id || '', template: 'mixed', count: 12, assigneeId: 'unassigned'});
    setMockOpen(true);
  }
  useEffect(() => {if (tab === 'new' && ready && editable) setBoardOpen(true); if (tab === 'add' && ready && editable && boards.length) {setMockForm({boardId: boards.some(board => board.id === ref) ? ref : currentBoard?.id || boards[0].id, template: 'mixed', count: 12, assigneeId: 'unassigned'});setMockOpen(true);}}, [tab, ref]);
  function addFlow(tag = newTag) {go('catalog', encodeURIComponent(tag), 'Flow');}
  async function start() {
    if (!task || !cap) return;
    const result = await act('start_run', {taskId: task.id, capabilityId: cap.id, mode: 'supervised'});
    if (result?.id) {setSelected(''); go('run', result.id);}
  }
  async function moveTask(taskId: string, status: string) {
    const value = tasks.find(item => item.id === taskId);
    if (!value || value.status === status || !editable || busy) return;
    if (state.runs.some(item => item.taskId === taskId && !item.completedAt && !['cancelled', 'failed'].includes(item.status))) return;
    await act('update_task', {taskId, status});
  }

  return <div className="page task-board-page">
    <PageHead title="Доски задач" description={`${product.name} · ${team.name} · доски и задачи команды`} actions={<>
      <Button variant="outline" disabled={busy || !editable || !ready} onClick={() => {setBoardForm({name: '', description: ''}); setBoardOpen(true);}}><FolderKanban size={16}/>Новая доска</Button>
      <Button disabled={busy || !editable || !boards.length || !ready} onClick={openMocks}><Plus size={16}/>Добавить моковые задачи</Button>
    </>}/>
    {!ready && <Notice tone="blue" title="Сначала подготовьте Automation" action={<Button variant="outline" onClick={() => go('environment', '', 'resources')}>Настроить среду</Button>}>После подготовки среды создайте доску, добавьте задачи и настройте Flow.</Notice>}
    {ready && boards.length === 0 && <Card><Blank title="Создайте первую доску" text="Добавьте на доску моковые задачи, а затем выберите Flow для нужного тега." action={<Button disabled={!editable || busy} onClick={() => setBoardOpen(true)}><Plus size={16}/>Новая доска</Button>}/></Card>}
    {boards.length > 0 && <>
      <div className="board-toolbar">
        <div className="row wrap"><Filter size={16}/>
          <Pick label="Доска задач" value={boardId} onChange={setBoardId} options={[{value: 'all', label: 'Все доски'}, ...boards.map(board => ({value: board.id, label: board.name}))]}/>
          <Pick label="Фильтр по assignee" value={assigneeFilter} onChange={setAssigneeFilter} options={[{value: 'all', label: 'Все исполнители'}, ...assigneeOptions]}/>
          <Pick label="Фильтр по тегу" value={tagFilter} onChange={setTagFilter} options={[{value: 'all', label: 'Все теги'}, ...tags.map(tag => ({value: `tag:${tag}`, label: `#${tag}`})), {value: 'untagged', label: 'Без тега'}]}/>
        </div>
        <div className="row wrap"><span className="task-sub">{filtered.length} задач</span><Button variant="outline" disabled={!newTag || !can('Product Engineer') || busy || !ready} onClick={() => addFlow()}><Workflow size={15}/>Добавить сценарий</Button></div>
      </div>
      {currentBoard && <div className="board-project-heading"><div><h2>{currentBoard.name}</h2>{currentBoard.description && <p className="subtext">{currentBoard.description}</p>}</div><Pill>{boardTasks.length} задач</Pill></div>}
      {selectedTagCap && <div className="board-tag-summary"><span><Tag size={14}/>#{selectedTag} · {state.runs.filter(item => item.teamId === team.id && item.productId === product.id && !item.uat && snapshotTag(item.snapshot) === selectedTag).length} запусков</span><TextLink onClick={() => go('capability', selectedTagCap.id, 'history')}>Flow и статистика по тегу</TextLink></div>}
      <div className="kanban-board" aria-label="Канбан задач">
        {columns.map(column => {
          const columnTasks = filtered.filter(item => item.status === column.id);
          return <section key={column.id} className={`kanban-column ${dropColumn === column.id ? 'drop-active' : ''}`} aria-label={`${column.name}: ${columnTasks.length}`} onDragOver={event => {if (editable && !busy && event.dataTransfer.types.includes('text/kontur-task')) {event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropColumn(column.id);}}} onDragLeave={event => {if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropColumn('');}} onDrop={event => {event.preventDefault(); setDropColumn(''); void moveTask(event.dataTransfer.getData('text/kontur-task'), column.id);}}>
            <header className="kanban-column-head"><span className={`kanban-status-dot ${column.id}`}/><h3>{column.name}</h3><span className="kanban-count">{columnTasks.length}</span></header>
            <div className="kanban-column-body">{columnTasks.map(item => {
              const assignee = members.find(person => person.id === item.assigneeId);
              const activeRun = state.runs.find(candidate => candidate.taskId === item.id && !candidate.completedAt && !['cancelled', 'failed'].includes(candidate.status));
              return <article key={item.id} className="kanban-task" draggable={editable && !busy && !activeRun} onDragStart={event => {event.dataTransfer.setData('text/kontur-task', item.id); event.dataTransfer.effectAllowed = 'move';}} onDragEnd={() => setDropColumn('')}>
                <button className="kanban-task-open" onClick={() => openTask(item)} aria-label={`Открыть ${item.externalId || item.id}: ${item.title}`}>
                  <div className="kanban-task-top"><span className="mono">{item.externalId || item.id}</span>{item.mock && <span className="mock-label">MOCK</span>}{editable && !activeRun && <GripVertical size={13}/>}</div>
                  <h3>{item.title}</h3><p className="kanban-repo">{item.repo}</p>
                  <div className="row wrap"><Pill tone={item.tag === 'statement-doc' ? 'purple' : item.tag ? 'green' : ''}>{item.tag ? `#${item.tag}` : 'Без тега'}</Pill>{activeRun && <Status value={activeRun.status}/>}</div>
                  <footer><span className="kanban-project">{boards.find(board => board.id === item.boardId)?.name}</span><span className="kanban-assignee" title={assignee?.name || 'Не назначен'}>{assignee ? <><span className="avatar tiny">{initials(assignee.name)}</span><span>{assignee.name.split(' ')[0]}</span></> : <><UserRound size={14}/><span>Не назначен</span></>}</span></footer>
                </button>
              </article>;
            })}{!columnTasks.length && <div className="kanban-empty">Нет задач</div>}</div>
          </section>;
        })}
      </div>
      {!filtered.length && tasks.length > 0 && <div className="board-empty-filter"><span>С выбранными фильтрами задач нет.</span><Button variant="ghost" onClick={() => {setBoardId('all'); setTagFilter('all'); setAssigneeFilter('all');}}>Сбросить фильтры</Button></div>}
    </>}

    <Modal open={boardOpen} onClose={() => setBoardOpen(false)} title="Новая доска" description={`${product.name} / ${team.name}`}><form className="stack" onSubmit={async event => {event.preventDefault(); const result = await act('create_board', boardForm); if (result?.id) {setBoardOpen(false); setBoardId(result.id); setTagFilter('all'); setAssigneeFilter('all'); go('tasks', result.id);}}}>
      <Field label="Название доски"><Input value={boardForm.name} onChange={event => setBoardForm({...boardForm, name: event.target.value})} required maxLength={160} autoFocus/></Field>
      <Field label="Описание доски"><Textarea value={boardForm.description} onChange={event => setBoardForm({...boardForm, description: event.target.value})} rows={3}/></Field>
      <div className="actions"><Button type="button" variant="outline" onClick={() => setBoardOpen(false)}>Отмена</Button><Button disabled={busy || !editable || !boardForm.name.trim()} type="submit">Создать доску</Button></div>
    </form></Modal>

    <Modal open={mockOpen} onClose={() => setMockOpen(false)} title="Добавить моковые задачи" description="Демонстрационные задачи сохраняются на выбранной доске команды."><form className="stack" onSubmit={async event => {event.preventDefault(); const result = await act('add_mock_tasks', {...mockForm, assigneeId: mockForm.assigneeId === 'unassigned' ? '' : mockForm.assigneeId}); if (result?.ok) {setMockOpen(false); setBoardId(mockForm.boardId); setTagFilter('all'); setAssigneeFilter('all'); go('tasks', mockForm.boardId);}}}>
      <Field label="Доска"><Pick label="Доска для моковых задач" value={mockForm.boardId} onChange={value => setMockForm({...mockForm, boardId: value})} options={boards.map(board => ({value: board.id, label: board.name}))}/></Field>
      <Field label="Набор задач"><Pick label="Набор моковых задач" value={mockForm.template} onChange={value => setMockForm({...mockForm, template: value, count: value === 'mixed' ? 12 : 4})} options={mockSets}/></Field>
      <div className="form-grid"><Field label="Количество"><Input type="number" min={1} max={12} value={mockForm.count} onChange={event => setMockForm({...mockForm, count: Number(event.target.value)})}/></Field><Field label="Исполнитель"><Pick label="Исполнитель моковых задач" value={mockForm.assigneeId} onChange={value => setMockForm({...mockForm, assigneeId: value})} options={assigneeOptions}/></Field></div>
      <div className="actions"><Button type="button" variant="outline" onClick={() => setMockOpen(false)}>Отмена</Button><Button type="submit" disabled={busy || !editable || !mockForm.boardId}>Добавить задачи</Button></div>
    </form></Modal>

    <Detail open={!!task} onClose={() => setSelected('')} title={task?.externalId || task?.id || 'Task'} description={task?.title}>{task && <>
      <div className="row mb-5"><Status value={task.status}/><Pill tone="green">{task.tag ? `#${task.tag}` : 'Без тега'}</Pill>{task.mock && <Pill>Mock</Pill>}</div>
      <KV label="Product">{product.name}</KV><KV label="Team">{team.name}</KV><KV label="Доска">{boards.find(board => board.id === task.boardId)?.name || '—'}</KV><KV label="Repository"><span className="mono">{task.repo}</span></KV>
      <div className="detail-title">Задача на доске</div>
      <form className="stack" onSubmit={async event => {event.preventDefault(); await act('update_task', {taskId: task.id, assigneeId: taskForm.assigneeId === 'unassigned' ? '' : taskForm.assigneeId, ...(!running ? {status: taskForm.status, tag: taskForm.tag} : {})});}}>
        <Field label="Статус задачи"><Pick label="Статус задачи" value={taskForm.status} onChange={value => setTaskForm({...taskForm, status: value})} options={columns.map(column => ({value: column.id, label: column.name}))} disabled={!editable || running}/></Field>
        <Field label="Assignee"><Pick label="Assignee задачи" value={taskForm.assigneeId} onChange={value => setTaskForm({...taskForm, assigneeId: value})} options={assigneeOptions} disabled={!editable}/></Field>
        <Field label="Тег задачи" hint="Flow общий для продукта и тега; задачи и статистика команды видны на её досках."><Input value={taskForm.tag} onChange={event => setTaskForm({...taskForm, tag: event.target.value})} disabled={!editable || running} maxLength={80}/></Field>
        {running && <p className="state-note">Во время запуска статус и тег фиксированы. Статус обновляется по результату исполнения.</p>}
        {editable && <Button variant="outline" type="submit" disabled={busy}>Сохранить задачу</Button>}
      </form>
      <KV label="Initiative">{task.initiativeId ? state.initiatives.find(item => item.id === task.initiativeId)?.name : 'Не назначена · optional'}</KV>
      {can('Product Owner') && <div className="mt-4"><Pick value={task.initiativeId || 'none'} label="Initiative" options={[{value: 'none', label: 'Без Initiative'}, ...state.initiatives.map(item => ({value: item.id, label: item.name}))]} onChange={value => {void act('task_initiative', {taskId: task.id, initiativeId: value === 'none' ? '' : value});}}/></div>}
      <div className="detail-title">Execution / Flow</div>
      {cap ? <><KV label="Flow по тегу"><TextLink onClick={() => {setSelected(''); go('capability', cap.id);}}>{cap.name}</TextLink></KV><KV label="Configuration">{cap.draft ? shortConfig(cap.draft) : release ? shortConfig(release.snapshot.config) : '—'}</KV>{release && <KV label="Trusted Capability"><Pill tone="green">#{snapshotTag(release.snapshot)}</Pill><Status value={release.status}/><span className="block mono mt-2">{release.snapshot.id}</span></KV>}
        {running && run ? <Notice tone="blue" title={`${run.id} · ${run.status}`} action={<TextLink onClick={() => go('run', run.id)}>Открыть запуск</TextLink>}>Для задачи уже выполняется запуск.</Notice> : <div className="stack mt-5"><div className="row"><span className="subtext">Режим запуска</span><Pill tone="blue">Supervised</Pill></div><Button onClick={start} disabled={busy || !can('Product Engineer') || !ready}><Play size={15}/>Запустить задачу</Button></div>}
      </> : <Blank title={task.tag ? `Flow для #${task.tag} ещё не создан` : 'Добавьте тег задаче'} text="Выберите и настройте сценарий для тега, затем запустите задачу." action={task.tag ? <Button variant="outline" disabled={!can('Product Engineer') || !ready} onClick={() => {setSelected(''); addFlow(task.tag);}}>Выбрать и настроить</Button> : undefined}/>}
      <div className="detail-title">История запусков / Evidence</div>
      {state.runs.filter(item => item.taskId === task.id && !item.uat).slice(-6).reverse().map(item => <button className="item-row w-full px-0 text-left" key={item.id} onClick={() => go('run', item.id)}><div className="item-main"><h3 className="mono">{item.id}</h3><p>{shortConfig(item.snapshot.config)} · #{snapshotTag(item.snapshot)} · {item.mode} · <DateText value={item.startedAt}/></p></div><Status value={item.status}/></button>)}
    </>}</Detail>
  </div>;
}
