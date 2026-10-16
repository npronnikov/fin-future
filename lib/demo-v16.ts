import type {State, Runtime, Run, Item, Knowledge} from './domain.ts';

export const DEFAULT_JUDGE_SCHEMA = {
  completeness: 'number', correctness: 'number', test_coverage: 'number',
  critical_vulnerabilities: 'number', critical_errors: 'number',
  verdict: 'PASS | FAIL', summary: 'text', findings: 'array',
};
export const DEFAULT_JUDGE_PROMPT = `Сравни результат выполнения задачи Workflow с эталоном успешно решённой задачи.
Оцени полноту решения, корректность исполнения и покрытие тестами по шкале от 0 до 100.
Отдельно укажи количество критических уязвимостей и критических ошибок. Ноль означает их отсутствие в предоставленных материалах, а не результат реального сканирования.
Учитывай только задачу, фактические артефакты, отчёт тестов и эталон. Не выдумывай отсутствующие доказательства. При недостаточных данных укажи это в findings и верни FAIL.
Выведи таблицу сравнения: задача, Workflow и его версия, вариант (эталон / проверяемый запуск), полнота, корректность, покрытие тестами, критические уязвимости, критические ошибки, вердикт.
PASS допускается только при полноте и корректности не ниже 90, покрытии тестами не ниже 80 и отсутствии критических проблем. Ответ верни по сохранённой выходной схеме.`;
export const DEFAULT_SECURITY_RULE = 'При обновлении зависимостей используй только сертифицированные версии из Approved Component Registry. Не изменяй бизнес-логику продукта. Подтверди совместимость тестами Jenkins и приложи итоговый manifest, ссылку на разрешённую версию и отчёт проверки критических уязвимостей. При критической уязвимости или недостающих подтверждениях останови выполнение и запроси проверку.';
export const DEFAULT_TEAM_KNOWLEDGE = 'При обновлении зависимостей не выполняй локальную сборку. Отправь изменение в Jenkins, дождись сборки и тестов pipeline и используй их результат для проверки. Это знание должно поступать на этапе Implementation.';
const RUNTIMES: Runtime[] = ['HG SDLC','Maestro','AI Conductor','AI Manager'];

/** Additive, idempotent migration. Frozen executions, reports and release snapshots stay untouched. */
export function upgradeDemoState(state: State): void {
  if ((state.demoVersion || 0) >= 19) return;
  state.people ||= [];
  const productOwner = state.people.find(person => person.id === 'po');
  if (productOwner) productOwner.name = 'Владелец продукта';
  const platformEngineer = state.people.find(person => person.id === 'platform');
  if (platformEngineer) platformEngineer.name = 'Инженер платформы';
  const productEngineer = state.people.find(person => person.id === 'engineer');
  if (productEngineer) productEngineer.name = 'Инженер продукта';
  const security = state.people.find(person => person.id === 'regulator');
  if (security) Object.assign(security,{name:'Эксперт безопасности',role:'Regulator',teams:[],assignments:[],directions:['Information Security']});
  const risk = state.people.find(person => person.id === 'regulator-reviewer');
  if (risk) Object.assign(risk,{name:'Эксперт рисков',role:'Regulator',teams:[],assignments:[],directions:['Risk']});
  else state.people.push({id:'regulator-reviewer',name:'Эксперт рисков',role:'Regulator',teams:[],assignments:[],directions:['Risk']});
  const reliability = state.people.find(person => person.id === 'regulator-reliability');
  if (reliability) Object.assign(reliability,{name:'Эксперт надежности',role:'Regulator',teams:[],assignments:[],directions:['Reliability']});
  else state.people.push({id:'regulator-reliability',name:'Эксперт надежности',role:'Regulator',teams:[],assignments:[],directions:['Reliability']});
  const po = state.people.find(person => person.id === 'po');
  if (po && !po.assignments.includes('knowledge.contribute')) po.assignments.push('knowledge.contribute');
  for (const asset of state.assets || []) {
    // Runtime adapters expose the same catalog contract in this demonstrator.
    if (asset.runtimes.includes('HG SDLC')) asset.runtimes = [...new Set([...asset.runtimes,'Maestro','AI Conductor'])] as Runtime[];
  }
  if (!state.assets.some(asset => asset.id === 'knowledge-mcp')) state.assets.push({
    id:'knowledge-mcp',version:1,type:'Skills',name:'Knowledge MCP',owner:'Platform Engineer',status:'Current',runtimes:[...RUNTIMES],
    changelog:'Доставка знаний из Context Supply Chain в узел Workflow.',
    instruction:'Возьми текст задачи, запланируй необходимые внешние и командные знания, сформируй запрос MCP и доставь точные опубликованные версии знаний в Implementation. Обязательные политики сегмента добавляются независимо от решения модели.',
  });
  if (!state.assets.some(asset => asset.id === 'dependency-judge' && asset.version === 2)) state.assets.push({
    id:'dependency-judge',version:2,type:'Judge Profiles',name:'Dependency Update · судья',owner:'Product Engineer',status:'Current',runtimes:[...RUNTIMES],
    instruction:DEFAULT_JUDGE_PROMPT,schema:{...DEFAULT_JUDGE_SCHEMA},skills:['code-diff-analysis@4','dependency-review@5'],changelog:'Полнота, корректность, покрытие тестами и критические проблемы.',
  });
  for (const team of state.teams || []) {
    for (const binding of team.bindings) if (!binding.platform && team.automation) binding.platform = team.automation;
    team.environment.name = team.environment.name.replace(/\sSandbox$/, ' · инфраструктура');
  }
  state.demoVersion = 19;
}

/** Build an immutable receipt for this run, not a page-level context delivery mock. */
export function buildKnowledgeReceipt(state: State, run: Run): Item {
  const task = state.tasks.find(item => item.id === run.taskId)!;
  const dependency = run.scope.workTypes.includes('dependency_change');
  const binding = run.snapshot.bindings.find(item => item.type === 'Repository' && item.name === task.repo);
  const published = run.snapshot.knowledgePackages || state.knowledge.filter(item => item.status === 'approved' && item.productId === task.productId &&
    (item.layer === 'Product' ? item.version <= run.snapshot.config.productKnowledge : item.teamId === task.teamId && item.version <= run.snapshot.config.teamKnowledge));
  const product = dependency ? [] : published.filter(item => item.layer === 'Product');
  const team = published.filter(item => item.layer === 'Team' && item.teamId === task.teamId && (!dependency || /зависим|dependenc|jenkins/i.test(`${item.title} ${item.content}`)));
  const keys = new Set((run.plans.at(-1)?.applicable || []).map((item: Item) => item.requirement));
  const policies = run.snapshot.policyPackages.filter(item => item.segment === binding?.segment && item.status !== 'Draft').flatMap(policy => policy.requirements.filter(req => keys.has(`${req.id}@${req.version}`)).map(req => ({id:`${req.id}@${req.version}`,package:`${policy.id}@${policy.version}`,title:policy.direction,content:req.text,segment:policy.segment,stage:'Implementation',kind:'policy'})));
  const fragment = (item:Knowledge) => ({id:item.id,version:item.version,title:item.title,content:item.content,kind:item.layer.toLowerCase(),stage:'Implementation',sourceRefs:item.sourceRefs || []});
  const query = `${task.title}. Нужны: ${dependency ? 'командные правила обновления зависимостей, Jenkins, сертифицированные версии библиотек' : 'понятия продукта и инженерные правила команды'}. product=${task.productId}; team=${task.teamId}; segment=${binding?.segment || 'unknown'}; stage=Implementation`;
  return {
    simulation:true,transport:'MCP',skill:'knowledge-mcp@1',service:'Context Supply Chain',taskId:task.id,request:task.title,
    planner:{model:'LLM Context Planner · demo',needs:dependency?['Team knowledge','Security segment policies']:['Product knowledge','Team knowledge','Segment policies'],productReason:dependency?'Продуктовые знания не нужны для этой задачи обновления зависимости.':'Требуются продуктовые понятия.',mandatoryPolicies:true},
    query,product:product.map(fragment),team:team.map(fragment),policies,
    fragments:[...product.map(fragment),...team.map(fragment),...policies],
    targetStage:'Implementation',delivered:false,attempt:run.attempt,
    steps:['Текст задачи','LLM: какие знания нужны','Запрос через Knowledge MCP','Context Supply Chain: опубликованные версии','Инъекция в Implementation'],
  };
}
