export type Role = 'Product Owner' | 'Platform Engineer' | 'Product Engineer' | 'Regulator';
export type Runtime = 'HG SDLC' | 'AI Manager';
export type Item = Record<string, any>;
export interface Person {id:string;name:string;role:Role;assignments:string[];teams:string[];directions?:string[]}
export interface Product {id:string;name:string;description:string;owner:string;goals:string;metrics?:string;knowledgeVersion:number}
export interface Board {id:string;productId:string;teamId:string;name:string;description:string}
export interface Team {id:string;name:string;spaceId:string;knowledgeVersion:number;people:string[];bindings:Binding[];environment:Environment;automation:Runtime|null}
export interface Binding {id:string;type:string;name:string;system?:string;segment?:string;read:string;write:string;createPr:boolean;merge:boolean;status:string;permissions?:string[];scope?:string}
export interface Environment {status:string;name:string;isolation:string;network:string;cpu:number;ram:number;disk:number;ttl:number;parallel:number;modelGateway:string;internet:string;quota:number;runtimeVersion:string;uatBindings:string;provisionSteps:string[]}
export interface Task {id:string;externalId?:string;title:string;tag:string;productId:string;teamId:string;boardId:string;assigneeId?:string;mock?:boolean;repo:string;status:string;initiativeId?:string;pr?:string;base:string;golden:string}
/** Kept only inside immutable snapshots made by earlier app versions. */
interface LegacyTaskClass {id:string;tag:string;name:string;description:string;teamId:string;productId:string}
export type FlowNodeType = 'task'|'analysis'|'specification'|'input'|'approval'|'implementation'|'checks'|'result'|'custom';
export interface FlowNode {id:string;revision:number;type:FlowNodeType;name:string;executor:'automation'|'agent'|'ci'|'human';input:string;output:string;instructions:string;skills:string[];subagents?:string[];rule:string;criteria:string;maxRetries:number;verification:'local'|'ci'}
export interface Config {description?:string;tokenLimit?:number;version:string;revision:number;runtime:Runtime;workflow:string;mode:'SDD'|'non-SDD';nodes:string[];nodeConfigs?:FlowNode[];instructions:string;skills:string[];blueprints:string[];workers:string;handoffs:string;constraints:string;checks:string;model:string;limit:number;humanInput:boolean;humanApproval:boolean;gateAssignee:string;policies:string[];productKnowledge:number;teamKnowledge:number;scope:string;repos:string[];template:string}
export interface Snapshot {id:string;config:Config;capabilityId:string;tag?:string;taskClass?:LegacyTaskClass;productId:string;teamId:string;productName:string;teamName:string;runtime:Runtime;runtimeVersion:string;environment:Environment;bindings:Binding[];createdAt:string;createdBy:string;historyRefs:string[];historyRunCount?:number;benchmarkRefs:string[];testBaskets?:Suite[];baselineReleaseId?:string;uatBindings:string;policyPackages:Policy[]}
export interface ReleaseRiskAssessment {runCount:number;minimumRuns:number;basketCount:number;basketCaseCount:number;highRisk:boolean;risks:{id:string;title:string;detail:string}[]}
export interface Release {riskAssessment?:ReleaseRiskAssessment;id:string;snapshot:Snapshot;stage:string;status:string;uat?:{status:string;snapshotId:string;binding:string;runId:string;time:string;report?:Item};risk?:{accepted:boolean;actor:string;identity:string;comment:string;time:string;snapshotId:string;acknowledgements?:string[];assessment?:Item};releasedAt?:string;autonomyScope:string}
export interface Capability {id:string;tag:string;teamId:string;productId:string;name:string;draft:Config|null;releases:Release[];migrationFrom?:string;legacyDuplicateOf?:string}
export interface Gate {id:string;runId:string;type:'input'|'approval';phase:string;revision:number;artifactRevision:number;assignee:string;status:string;question:string;options?:string[];scope:string;createdAt:string;decision?:Item;nodeId?:string;nodeRevision?:number}
export interface Run {id:string;taskId:string;teamId:string;productId:string;capabilityId:string;snapshot:Snapshot;releaseId?:string;mode:string;status:string;startedAt:string;completedAt?:string;events:{time:string;title:string;detail?:string;kind?:string}[];gates:Gate[];attempts:Item[];attempt:number;artifactRevision:number;writer:'automation'|'human'|'none';workspace:{checkout:string;branch:string;path:string;content:string;checked:boolean};plans:Item[];evidence:Item|null;artifacts:Item;metrics:{latency:number;cost:number;humanTime:number;tokens:number;rework:number;takeover:number;input:number;approval:number;outOfScope:number};fixture?:boolean;uat?:boolean;execution:Item;scope:{repositories:string[];workTypes:string[]}}
export interface Policy {id:string;version:number;direction:string;segment:string;status:string;sunset:string;effective:string;owner:string;supersedes:string;requirements:Item[];applicability:Item[];skills:string[];subagents?:string[];evidence:Item[];changelog:string}
export const POLICY_STATUSES=['Draft','Current','Deprecating','Retired'] as const;
export const isRetiredPolicyStatus=(status:string)=>['Retired','Withdrawn','Revoked','Superseded'].includes(status);
export const normalizePolicyStatus=(status:string)=>isRetiredPolicyStatus(status)?'Retired':status;
export interface Knowledge {id:string;productId:string;teamId?:string;layer:'Product'|'Team';title:string;content:string;status:string;version:number;author:string;reviewer?:string;sourceRun?:string}
export interface Suite {id:string;version:number;name:string;tag:string;teamId:string;productId:string;cases:{taskId:string;pr:string;base:string;golden:string;confirmed:boolean}[];judgeId:string}
export interface Asset {id:string;version:number;type:string;name:string;owner:string;status:string;runtimes:Runtime[];changelog:string;instruction?:string;skills?:string[];schema?:Item}
export interface State {revision:number;products:Product[];boards:Board[];teams:Team[];responsibilities:{productId:string;teamId:string;scope:string[]}[];people:Person[];tasks:Task[];capabilities:Capability[];runs:Run[];policies:Policy[];knowledge:Knowledge[];suites:Suite[];assets:Asset[];benchmarks:Item[];messages:Item[];notifications:Item[];initiatives:Item[];audit:Item[]}
export const ROLE_LABELS:Record<string,Role>={po:'Product Owner',platform:'Platform Engineer',engineer:'Product Engineer',regulator:'Regulator'};
export const ASSIGNMENTS=['knowledge.contribute','knowledge.review','capability.review','risk.accept','team.admin','incident.respond'];
export const PERMISSION_LABELS:Record<string,string>={'knowledge.contribute':'Пополнение знаний','knowledge.review':'Проверка знаний','capability.review':'Проверка результатов Flow','risk.accept':'Принятие риска','team.admin':'Управление командой','incident.respond':'Обработка инцидентов'};
export const permissionLabel=(code:string)=>`${PERMISSION_LABELS[code]||code} (${code})`;
export const MODEL_OPTIONS=[{id:'glm',name:'GLM',rublesPerMillion:60},{id:'gpt',name:'GPT',rublesPerMillion:180},{id:'claude-sonnet',name:'Claude Sonnet',rublesPerMillion:240}];
/** Demonstration rates only, not vendor prices. */
export const estimateTokenCost=(model:string,tokenLimit:number)=>Math.round(tokenLimit*(MODEL_OPTIONS.find(option=>option.id===model)?.rublesPerMillion||180)/1000000*100)/100;
export const PROVISION_STEPS=['Validating configuration','Reserving resources','Creating sandbox','Installing runtime','Connecting Git','Connecting CI','Connecting Task Tracker','Applying platform settings','Verifying access'];
export const SEGMENTS=['retail.frontend','retail.backend','retail.data','corporate.frontend','corporate.backend','corporate.data'];
export const REPOSITORIES=[{name:'bank/savings-api',system:'Savings Core',segment:'retail.backend'},{name:'bank/savings-web',system:'Копилка',segment:'retail.frontend'}];
export const TASK_STATUSES=['backlog','todo','in_progress','review','done'] as const;
export const FLOW_TEMPLATES=['dependency-update@1','sdd-statements@1','custom'] as const;
export const copy=<T,>(x:T):T=>JSON.parse(JSON.stringify(x));
export const configKey=(c:Config)=>`${c.version}#${c.revision}`;
export const shortConfig=(c:Config)=>`v${c.version} · r${c.revision}`;
export const policyKey=(p:Policy)=>`${p.id}@${p.version}`;
export const snapshotTag=(snapshot:Snapshot)=>snapshot.tag??snapshot.taskClass?.tag??'';
export function currentRelease(c:Capability|undefined){return c?.releases.find(r=>r.stage==='production'&&r.status!=='superseded')}
export function defaultEnvironment(name:string):Environment{return{status:'not_configured',name:`${name} Sandbox`,isolation:'Isolated workspace',network:'Corporate',cpu:4,ram:8,disk:40,ttl:24,parallel:4,modelGateway:'Model Gateway',internet:'Approved connectors only',quota:100,runtimeVersion:'1.0',uatBindings:'UAT',provisionSteps:[]}}
export function defaultConfig(tag:string,runtime:Runtime='HG SDLC',template?:string):Config{const custom=template==='custom',sdd=template?template==='sdd-statements@1':tag==='statement-doc';return{version:'1.0',revision:1,runtime,workflow:custom?'custom':sdd?'sdd-statements@1':'dependency-update@1',mode:sdd?'SDD':'non-SDD',nodes:sdd?['Task','Specification','Human Approval','Implementation','Checks','Result']:['Analyze','Implement','Checks','Result'],instructions:custom?`Выполнить задачу с тегом ${tag} в пределах выбранного scope.`:sdd?'Добавление и изменение клиентских выписок и справок. Согласовать Specification до Implementation.':'Обновление зависимостей приложения. Изменять только dependency; не менять retry logic.',skills:custom||sdd?['code-diff-analysis@4']:['dependency-review@5','certified-dependency-selection@5'],blueprints:['product-engineer@1'],workers:'Implementation, Checks',handoffs:'Manager → Implementation → Checks',constraints:'В пределах Resource Bindings. Merge запрещён.',checks:'Compatibility suite; scope control; regulatory verification',description:'',model:'glm',tokenLimit:100000,limit:100,humanInput:!sdd&&!custom,humanApproval:true,gateAssignee:'engineer',policies:['IS-retail-backend@7','REL-retail-backend@4','RISK-retail-backend@3'],productKnowledge:1,teamKnowledge:1,scope:sdd?'/src/onboarding/**':'/pom.xml',repos:['bank/savings-api'],template:custom?'custom':sdd?'sdd-statements@1':'dependency-update@1'}}
export const FLOW_NODE_TYPES:FlowNodeType[]=['task','analysis','specification','input','approval','implementation','checks','result','custom'];
const FLOW_NODE_NAMES:Record<FlowNodeType,string>={task:'Task',analysis:'Analyze',specification:'Specification',input:'Human Input',approval:'Human Approval',implementation:'Implementation',checks:'Checks',result:'Result',custom:'Новый шаг'};
/** Defaults are derived on read. Opening an older release never mutates its snapshot. */
export function createFlowNode(type:FlowNodeType,id:string,cfg:Config):FlowNode{
 const descriptions:Record<FlowNodeType,{input:string;output:string;criteria:string}>={
  task:{input:'Task, выбранный Repository и Base revision.',output:'Задача и её scope переданы следующим шагам.',criteria:'Тег задачи и Repository соответствуют Flow.'},
  analysis:{input:'Task, Product / Team Knowledge, Regulatory Plan.',output:'План изменения в пределах выбранного scope.',criteria:'План учитывает задачу, ограничения и применимые требования.'},
  specification:{input:'Task, результаты анализа, Product / Team Knowledge.',output:'Specification для явного Human Approval.',criteria:'Описание решения и критерии приёмки готовы к согласованию.'},
  input:{input:'Контекст задачи и вопрос, требующий уточнения человеком.',output:'Ответ назначенного участника команды для следующих шагов.',criteria:'Получен явный ответ на вопрос узла.'},
  approval:{input:'Артефакт предыдущего шага и его текущая revision.',output:'Явное решение назначенного участника команды.',criteria:'Получено Approval для текущей artifact revision.'},
  implementation:{input:cfg.mode==='SDD'?'Согласованная Specification, Task и Repository.':'Task, план изменения и разрешённый Repository.',output:'Diff и артефакты реализации.',criteria:'Результат соответствует задаче и не выходит за Resource Bindings.'},
  checks:{input:'Текущая revision diff и критерии завершения.',output:'Отчёт проверок текущей revision артефактов.',criteria:cfg.checks||'Проверки пройдены, scope соблюдён.'},
  result:{input:'Проверенный результат и отчёты предыдущих шагов.',output:'Результат для истории запусков и Regulatory Verification.',criteria:'Все обязательные проверки и Human Gates завершены.'},
  custom:{input:'Результат предыдущего шага.',output:'Артефакт шага в пределах задачи.',criteria:'Выполнены инструкции шага и ограничения Flow.'}
 };
 const human=type==='input'||type==='approval',agent=!human;
 return {id,revision:1,type,name:FLOW_NODE_NAMES[type],executor:human?'human':'agent',...descriptions[type],instructions:type==='input'?'Уточнить вводные задачи у назначенного участника команды.':type==='approval'?'Проверить артефакт и принять явное решение.':type==='result'?'Сохранить проверенный результат выполнения задачи.':cfg.instructions,skills:agent?(cfg.skills.length?[...cfg.skills]:['code-diff-analysis@4']):[],subagents:[],rule:cfg.constraints,maxRetries:type==='checks'?2:0,verification:type==='checks'?'ci':'local'};
}
export function getFlowNodes(cfg:Config):FlowNode[]{
 if(Array.isArray(cfg.nodeConfigs))return copy(cfg.nodeConfigs);
 return cfg.nodes.map((name,index)=>{
  const normalized=name.trim().toLowerCase();
  const type:FlowNodeType=normalized==='task'?'task':/^(analyze|analysis)$/.test(normalized)?'analysis':normalized==='specification'?'specification':normalized==='human input'?'input':normalized==='human approval'?'approval':/^(implement|implementation)$/.test(normalized)?'implementation':normalized==='checks'?'checks':normalized==='result'?'result':'custom';
  return {...createFlowNode(type,`node-${index+1}`,cfg),name};
 });
}
/** Editable drafts use two executor kinds; historical snapshots are never normalized. */
export function getEditableFlowNodes(cfg:Config):FlowNode[]{
 return getFlowNodes(cfg).map(node=>{
  const editable=copy(node);
  if(editable.executor==='automation'||editable.executor==='ci')editable.executor='agent';
  if(editable.executor==='agent'&&!editable.skills.length)editable.skills=['code-diff-analysis@4'];
  return editable;
 });
}
export function nextFlowVersion(version:string){const parts=version.split('.').map(Number);if(parts.length<2||parts.some(value=>!Number.isInteger(value)||value<0))return '1.1';parts[parts.length-1]++;return parts.join('.');}
/** Structural validation shared by the editor and the authoritative action handler. */
export function flowIssues(cfg:Config,options:{allowLegacyExecutors?:boolean}={}):string[]{
 const nodes=cfg.nodeConfigs;
 if(nodes===undefined)return [];
 if(!Array.isArray(nodes))return ['Flow: ожидается список настроек узлов.'];
 const errors:string[]=[];
 if(!nodes.length||nodes.length>24)errors.push('Flow должен содержать от 1 до 24 узлов.');
 const ids=new Set<string>();
 for(const [index,node] of nodes.entries()){
  const label=`Шаг ${index+1}`;
  if(!node||typeof node!=='object'||Array.isArray(node)){errors.push(`${label}: настройки должны быть объектом.`);continue;}
  if(typeof node.id!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(node.id)||ids.has(node.id))errors.push(`${label}: требуется уникальный стабильный id.`);
  ids.add(node.id);
  if(!FLOW_NODE_TYPES.includes(node.type))errors.push(`${label}: неизвестный тип узла.`);
  if(typeof node.name!=='string'||!node.name.trim()||node.name.length>160)errors.push(`${label}: укажите название до 160 символов.`);
  if(typeof node.name==='string'&&/before run|after run/i.test(node.name))errors.push('До запуска и После запуска — системные стадии runtime.');
  if(!(options.allowLegacyExecutors?['automation','agent','ci','human']:['agent','human']).includes(node.executor))errors.push(`${label}: исполнитель — только Coding-agent или Human.`);
  if(['input','approval'].includes(node.type)&&node.executor!=='human'||!['input','approval'].includes(node.type)&&node.executor==='human')errors.push(`${label}: Human обязателен для Human Input / Human Approval и доступен только этим узлам.`);
  if(options.allowLegacyExecutors&&node.executor==='ci'&&node.type!=='checks')errors.push(`${label}: CI доступен только для узла Checks.`);
  for(const key of ['input','output','instructions','rule','criteria'] as const)if(typeof node[key]!=='string'||node[key].length>20000)errors.push(`${label}: поле ${key} должно содержать текст до 20000 символов.`);
  if(node.executor==='agent'&&typeof node.instructions==='string'&&!node.instructions.trim())errors.push(`${label}: заполните основной Skill / инструкции агента.`);
  if(!Array.isArray(node.skills)||node.skills.length>24||node.skills.some(skill=>typeof skill!=='string'||!skill.trim()))errors.push(`${label}: skills должны быть списком точных версий.`);
  else if(node.executor==='agent'&&!node.skills.length)errors.push(`${label}: назначьте хотя бы один Skill агенту.`);
  if(node.subagents!==undefined&&(!Array.isArray(node.subagents)||node.subagents.length>24||node.subagents.some(agent=>typeof agent!=='string'||!agent.trim())))errors.push(`${label}: Subagents должны быть списком точных версий.`);
  if(!Number.isInteger(node.maxRetries)||node.maxRetries<0||node.maxRetries>5)errors.push(`${label}: лимит автоматических доработок — целое число от 0 до 5.`);
  if(!['local','ci'].includes(node.verification))errors.push(`${label}: выберите среду проверки.`);
  if(node.type!=='checks'&&node.verification!=='local')errors.push(`${label}: среда CI задаётся только для Checks.`);
  if(options.allowLegacyExecutors&&node.type==='checks'&&node.executor==='ci'&&node.verification!=='ci')errors.push(`${label}: для исполнителя CI выберите проверку в CI.`);
 }
 if(errors.length)return errors;
 if(!Number.isFinite(cfg.limit)||cfg.limit<=0)errors.push('Flow: limit должен быть положительным числом.');
 const types=nodes.map(node=>node.type),implementation=types.indexOf('implementation'),lastImplementation=types.lastIndexOf('implementation'),checks=types.indexOf('checks');
 if(implementation<0)errors.push('Flow должен содержать шаг Implementation.');
 if(checks<0||checks<lastImplementation)errors.push('Добавьте Checks после всех шагов Implementation.');
 if(types.at(-1)!=='result'||types.filter(type=>type==='result').length!==1)errors.push('Flow должен завершаться одним шагом Result.');
 if(cfg.mode==='SDD'){
  const specification=types.indexOf('specification'),approval=types.findIndex((type,index)=>type==='approval'&&index>specification&&index<implementation);
  if(specification<0||specification>implementation||approval<0)errors.push('SDD: Specification и явный Human Approval должны предшествовать Implementation.');
  const unapprovedSpec=types.some((type,index)=>type==='specification'&&!types.slice(index+1,implementation).includes('approval'));
  if(unapprovedSpec)errors.push('SDD: каждая Specification должна быть согласована до Implementation.');
 }
 return errors;
}
/** Exact, frozen nodes that can be revisited without jumping beyond the awaiting gate. */
export function flowReworkNodes(cfg:Config,gateNodeId?:string):FlowNode[]{
 if(!cfg.nodeConfigs||!gateNodeId)return [];
 const nodes=getFlowNodes(cfg),gateIndex=nodes.findIndex(node=>node.id===gateNodeId);
 if(gateIndex<0)return [];
 let end=gateIndex;
 const implementation=nodes.findIndex(node=>node.type==='implementation');
 if(cfg.mode==='SDD'&&nodes[gateIndex].type==='approval'&&gateIndex<implementation){
  const specification=nodes.slice(0,gateIndex).map(node=>node.type).lastIndexOf('specification');
  if(specification>=0)end=specification;
 }
 return nodes.slice(0,end+1).filter(node=>['analysis','specification','implementation','checks','custom'].includes(node.type));
}
export function getStats(runs:Run[]){return{started:runs.length,accepted:runs.filter(r=>r.status==='accepted').length,failed:runs.filter(r=>r.status==='failed').length,cancelled:runs.filter(r=>r.status==='cancelled').length,rework:runs.reduce((n,r)=>n+r.metrics.rework,0),takeover:runs.reduce((n,r)=>n+r.metrics.takeover,0),input:runs.reduce((n,r)=>n+r.metrics.input,0),approval:runs.reduce((n,r)=>n+r.metrics.approval,0),latency:runs.length?Math.round(runs.reduce((n,r)=>n+r.metrics.latency,0)/runs.length):0,cost:runs.reduce((n,r)=>n+r.metrics.cost,0),humanTime:runs.reduce((n,r)=>n+r.metrics.humanTime,0),tokens:runs.reduce((n,r)=>n+r.metrics.tokens,0),outOfScope:runs.reduce((n,r)=>n+r.metrics.outOfScope,0),verified:runs.filter(r=>r.evidence?.status==='PASS').length}}
/** The applicable basket versions and cases are captured together with a new snapshot. */
export function latestTestBaskets(s:State,cap:Capability):Suite[]{
 const latest=new Map<string,Suite>();
 for(const suite of s.suites)if(suite.teamId===cap.teamId&&suite.productId===cap.productId&&suite.tag===cap.tag&&suite.cases.length&&suite.cases.every(item=>item.confirmed)){
  if(!latest.has(suite.id)||latest.get(suite.id)!.version<suite.version)latest.set(suite.id,suite);
 }
 return copy([...latest.values()]);
}
/** Older frozen snapshots can only refer to an explicitly attached, versioned benchmark basket. */
export function snapshotTestBaskets(s:State,snapshot:Snapshot):Suite[]{
 if(snapshot.testBaskets!==undefined)return copy(snapshot.testBaskets);
 const selected=new Map<string,Suite>();
 for(const benchmark of s.benchmarks)if(snapshot.benchmarkRefs.includes(benchmark.id)){
  const suite=s.suites.find(item=>item.id===benchmark.suiteId&&item.version===benchmark.suiteVersion&&item.productId===snapshot.productId&&item.teamId===snapshot.teamId&&item.tag===snapshotTag(snapshot));
  if(suite)selected.set(`${suite.id}@${suite.version}`,suite);
 }
 return copy([...selected.values()]);
}
export function releaseRiskAssessment(s:State,release:Release):ReleaseRiskAssessment{
 if(release.riskAssessment)return copy(release.riskAssessment);
 const snapshot=release.snapshot,baskets=snapshotTestBaskets(s,snapshot),refs=new Set(snapshot.historyRefs);
 const runCount=snapshot.historyRunCount??s.runs.filter(run=>refs.has(run.id)&&run.capabilityId===snapshot.capabilityId&&!run.uat&&!!run.completedAt).length;
 const basketCount=baskets.length,basketCaseCount=baskets.reduce((count,basket)=>count+basket.cases.length,0);
 const risks:Array<{id:string;title:string;detail:string}>=[];
 if(!basketCount)risks.push({id:'no_test_basket',title:'Нет тестовой корзины',detail:'Для этого snapshot нет тестовой корзины: сравнение с эталонными задачами не выполнено.'});
 if(runCount<100)risks.push({id:'insufficient_history',title:'Большой риск из-за малой статистики',detail:`Завершено ${runCount} прогонов этой конфигурации; для оценки требуется не менее 100.`});
 if(snapshot.benchmarkRefs.some(id=>s.benchmarks.some(report=>report.id===id&&report.passed<report.total)))risks.push({id:'failed_benchmark',title:'Есть непройденные тесты корзины',detail:'Приложенные отчёты тестовой корзины содержат результаты FAIL.'});
 risks.push({id:'autonomous_execution',title:'Автоматическое выполнение без гейтов',detail:'После выпуска задачи продукта с выбранным тегом выполняются без Human Input и Human Approval в рамках разрешённых ресурсов.'});
 return {runCount,minimumRuns:100,basketCount,basketCaseCount,highRisk:runCount<100||!basketCount||risks.some(risk=>risk.id==='failed_benchmark'),risks};
}
export function makeSnapshot(s:State,cap:Capability,cfg:Config,id:string,time:string):Snapshot{const team=s.teams.find(t=>t.id===cap.teamId)!;const product=s.products.find(p=>p.id===cap.productId)!;return{id,config:copy(cfg),capabilityId:cap.id,tag:cap.tag,productId:cap.productId,teamId:cap.teamId,productName:product.name,teamName:team.name,runtime:cfg.runtime,runtimeVersion:team.environment.runtimeVersion,environment:copy(team.environment),bindings:copy(team.bindings.filter(b=>b.type!=='Repository'||cfg.repos.includes(b.name))),createdAt:time,createdBy:cfg.runtime,historyRefs:[],benchmarkRefs:[],testBaskets:latestTestBaskets(s,cap),uatBindings:team.environment.uatBindings,policyPackages:copy(s.policies.filter(p=>cfg.policies.includes(policyKey(p))))}}
export function makePlan(run:Run,reason='До запуска'):Item{const dep=run.scope.workTypes.includes('dependency_change');const repos=run.snapshot.bindings.filter(b=>b.type==='Repository'&&run.scope.repositories.includes(b.name));const segments=repos.map(b=>b.segment);const workTypes=run.scope.workTypes;const applicable:Item[]=[],notApplicable:Item[]=[];for(const p of run.snapshot.policyPackages||[]){for(const req of p.requirements){const key=`${req.id}@${req.version}`;const rules=p.applicability.filter((a:Item)=>!a.requirement||a.requirement===key);const applies=segments.includes(p.segment)&&(!rules.length||rules.some((r:Item)=>(!(r.tag??r.taskClass)||(r.tag??r.taskClass)===snapshotTag(run.snapshot))&&(!r.segment||segments.includes(r.segment))&&(!r.workType||String(r.workType).split(',').some(x=>workTypes.includes(x.trim())))));if(!applies){notApplicable.push({requirement:key,reason:!segments.includes(p.segment)?'Repository segment не входит в scope package':'Тег задачи / work type не соответствует Applicability Rules'});continue}const rule=p.evidence.find((x:Item)=>x.requirement===key);applicable.push({requirement:key,reason:dep?'third-party dependency change':run.snapshot.config.mode==='SDD'?'изменение по Specification':'реализация задачи в scope Flow',apply:run.snapshot.runtime==='AI Manager'?`work_type = ${workTypes.join(' | ')}`:dep?'implementation, verification':'Specification, Implementation, Checks',skill:p.skills[0]||'',skills:copy(p.skills),subagents:copy(p.subagents||[]),guidance:req.text,evidence:rule?.artifacts||'Evidence Rules package',verificationSkill:rule?.verificationSkill||''})}}return{version:run.plans.length+1,id:`PLAN-${run.id}-${run.plans.length+1}`,reason,createdAt:new Date().toISOString(),policies:[...run.snapshot.config.policies],repositories:repos.map(b=>({repository:b.name,system:b.system,segment:b.segment})),applicable,notApplicable}}
export function sameExecutionConfiguration(a:Snapshot,b:Snapshot){const normalize=(x:Snapshot)=>JSON.stringify({config:x.config,runtimeVersion:x.runtimeVersion,environment:Object.fromEntries(Object.entries(x.environment).filter(([k])=>!['status','provisionSteps'].includes(k))),bindings:x.bindings.filter(b=>['Repository','Task Tracker','CI'].includes(b.type))});return normalize(a)===normalize(b)}
export function makeRun(s:State,cap:Capability,cfg:Config,task:Task,id:string,time:string,mode='supervised',release?:Release):Run{const snap=release?copy(release.snapshot):makeSnapshot(s,cap,cfg,`EXEC-${id}`,time);return{id,taskId:task.id,teamId:task.teamId,productId:task.productId,capabilityId:cap.id,snapshot:snap,releaseId:release?.id,mode,status:'running',startedAt:time,events:[{time,title:'Запуск начат',detail:mode},{time,title:'Execution snapshot frozen',detail:snap.id}],gates:[],attempts:[{number:1,revision:1,status:'running',comment:''}],attempt:1,artifactRevision:1,writer:'automation',workspace:{checkout:`${task.repo}@${task.base||'847ac2'}`,branch:`run/${task.id}`,path:`workspaces/${id}`,content:'',checked:false},plans:[],evidence:null,artifacts:{},metrics:{latency:0,cost:0,humanTime:0,tokens:0,rework:0,takeover:0,input:0,approval:0,outOfScope:0},execution:{id:`EXEC-${id}`,createdBy:snap.runtime,configurationSnapshotId:snap.id,releaseSnapshotId:release?.snapshot.id||null,repositoryRevisions:[{repository:task.repo,revision:task.base||'847ac2'}],frozenAt:time},scope:{repositories:[task.repo],workTypes:isDependencyFlow(cfg,snapshotTag(snap))?['dependency_change','implementation','verification']:['implementation','verification']}}}
export function event(run:Run,title:string,detail='',kind='blue',time=new Date().toISOString()){run.events.push({time,title,detail,kind})}
export function addGate(run:Run,type:'input'|'approval',phase:string,time=new Date().toISOString()){const g:Gate={id:`GATE-${run.id}-${run.gates.length+1}`,runId:run.id,type,phase,revision:run.gates.length+1,artifactRevision:run.artifactRevision,assignee:run.execution.gateAssignee||run.snapshot.config.gateAssignee,status:'pending',question:type==='input'?'Какую допустимую версию использовать?':phase==='Specification'?'Согласовать Specification перед Implementation?':'Принять результат выполнения задачи?',options:type==='input'?['2.17.3','2.17.4','Другое']:undefined,scope:phase==='Specification'?'Specification':run.snapshot.config.scope,createdAt:time};run.gates.push(g);run.status=type==='input'?'input_required':'approval_required';run.writer='none';event(run,type==='input'?'Human Input requested':'Human Approval requested',`${g.id} · revision ${g.revision} · ${phase}`,'amber',time);return g}
/** Task tags route work; the selected template determines which mock artifacts are produced. */
export function isDependencyFlow(cfg:Config,tag=''){return cfg.template==='dependency-update@1'||!cfg.template&&tag==='dep-update';}
const scopeContains=(scope:string,path:string)=>scope==='/**'||scope===path||scope.endsWith('/**')&&path.startsWith(scope.slice(0,-2));
export function generatedArtifactPath(run:Run){
 const cfg=run.snapshot.config,dependency=isDependencyFlow(cfg,snapshotTag(run.snapshot));
 const repository=run.scope.repositories[0]||'',file=dependency?(repository.endsWith('-web')?'package.json':'pom.xml'):cfg.mode==='SDD'?'statement.ts':'task-result.ts';
 const preferred=dependency?`/${file}`:cfg.mode==='SDD'?`/src/onboarding/${file}`:`/src/automation/${file}`;
 const scopes=cfg.scope.split(/[\n,]+/).map(scope=>scope.trim()).filter(Boolean);
 if(scopes.some(scope=>scopeContains(scope,preferred)))return preferred;
 const directory=scopes.find(scope=>scope.endsWith('/**'));
 return directory?`${directory.slice(0,-2)}${file}`:scopes[0]||preferred;
}
export function generateArtifacts(run:Run){
 const dep=isDependencyFlow(run.snapshot.config,snapshotTag(run.snapshot)),selected=run.artifacts.inputChoice||'2.17.4';
 const path=generatedArtifactPath(run),relative=path.replace(/^\//,'');
 const change=dep?(path.endsWith('.xml')?`- <version>previous</version>\n+ <version>${selected}</version>`:`- {"demo-dependency":"previous"}\n+ {"demo-dependency":"${selected}"}`):run.snapshot.config.mode==='SDD'?`+ // ${run.taskId}: implementation follows ${run.mode==='production'?'released Flow specification':'approved specification'}`:`+ // ${run.taskId}: mock result of the configured Flow`;
 run.artifacts={...run.artifacts,diff:`--- a/${relative}\n+++ b/${relative}\n${change}`,changedPaths:[path],demo:true,tests:'compatibility-suite #12991\n148 / 148 passed',logs:run.events.map(event=>`${event.time} ${event.title}`).join('\n'),manifest:dep?`${path.endsWith('.xml')?'jackson-databind':'demo-dependency'} ${selected}`:run.snapshot.config.mode==='SDD'?'Generated statement document':'Configured Flow result',registry:'Approved Component Registry · certified versions: 2.17.3, 2.17.4',specification:run.artifacts.specification||(run.snapshot.config.mode==='SDD'?`Task: ${run.taskId}\nTag: ${snapshotTag(run.snapshot)}\nSpecification: ${run.snapshot.config.instructions}`:undefined)};
 run.workspace.content=run.artifacts.diff;run.workspace.checked=true;
}
function recordDemoEconomics(run:Run){
 const cfg=run.snapshot.config;
 if(!Number.isInteger(cfg.tokenLimit)||!cfg.tokenLimit||cfg.tokenLimit<=0)return;
 const steps=run.execution.flow?.trace.filter((step:Item)=>step.status==='completed').length||getFlowNodes(cfg).length*run.attempt;
 const tokens=Math.min(cfg.tokenLimit,4200+steps*900),cost=estimateTokenCost(cfg.model,tokens);
 run.metrics.tokens=tokens;run.metrics.cost=cost;
 run.execution.economics={demo:true,source:'deterministic mock estimate',model:cfg.model,tokenLimit:cfg.tokenLimit,tokens,costRubles:cost};
}
export function finishRun(run:Run,time=new Date().toISOString()){if(!run.artifacts.diff)generateArtifacts(run);run.attempts.at(-1)!.artifacts=copy(run.artifacts);event(run,'После запуска · Regulatory Verification','Regulatory Plan, attempts, diff, tests, Evidence Rules','blue',time);run.evidence={id:`EVIDENCE-${run.id}-${run.attempt}`,runId:run.id,planId:run.plans.at(-1)?.id,status:'PASS',createdAt:time,results:run.plans.at(-1)?.applicable.map((a:Item)=>({requirement:a.requirement,status:'PASS',observed:a.requirement.startsWith('SEC')?run.artifacts.manifest:run.artifacts.tests,evidence:a.requirement.startsWith('SEC')?[generatedArtifactPath(run).replace(/^\//,''),'approved registry snapshot']:['compatibility-suite #12991'],verificationSkill:a.verificationSkill||'dependency-evidence-check@3',requiredArtifacts:a.evidence,subagents:copy(a.subagents||[])}))||[]};if(run.execution.flow)run.evidence.flow={demo:true,status:'completed',trace:copy(run.execution.flow.trace),humanChecks:copy(run.execution.flow.humanChecks||[])};recordDemoEconomics(run);run.status='accepted';run.writer='none';run.completedAt=time;run.attempts.at(-1)!.status='accepted';run.metrics.latency=Math.max(1,Math.round((Date.parse(time)-Date.parse(run.startedAt))/60000));event(run,'Regulatory Evidence Report created','PASS','green',time);event(run,'Запуск принят','Результат сохранён в истории запусков текущей конфигурации','green',time)}
export function trackerTaskTemplates():Task[]{
 const tasks=[['BANK-1842','Update Spring Boot','dep-update'],['BANK-1857','Update JDBC driver','dep-update'],['BANK-1891','Update React Router','dep-update'],['BANK-1924','Update Jackson','dep-update'],['BANK-2012','Statement for arbitrary period','statement-doc'],['BANK-2031','Balance certificate','statement-doc'],['BANK-2048','PDF certificate','statement-doc'],['BANK-2075','Statement presentation rules','statement-doc'],['BANK-2090','Fix tooltip','ui-fix'],['BANK-2103','Add API metric','telemetry'],['BANK-2111','Optimize DB index','db-performance'],['BANK-2120','Fix authorization text','']];
 return tasks.map(([id,title,tag],i)=>({id,title,tag,productId:'savings',teamId:'growth',boardId:'board-savings',assigneeId:i%3===0?'engineer':i%3===1?'po':undefined,mock:true,repo:i===2||i===8?'bank/savings-web':'bank/savings-api',status:i===0||i===4?'in_progress':'backlog',pr:i<8?`PR · ${id}`:undefined,base:'8ac31d',golden:'93f20a'}));
}
export function createSeed():State{const time='2026-10-06T11:02:00.000Z';const team:Team={id:'growth',name:'Growth',spaceId:'space-growth',knowledgeVersion:1,people:['po','platform','engineer'],bindings:[{id:'repo-api',type:'Repository',name:'bank/savings-api',system:'Savings Core',segment:'retail.backend',read:'/**',write:'/pom.xml\n/src/onboarding/**',createPr:true,merge:false,status:'connected'},{id:'repo-web',type:'Repository',name:'bank/savings-web',system:'Копилка',segment:'retail.frontend',read:'/**',write:'/src/onboarding/**',createPr:true,merge:false,status:'connected'},...['Task Tracker','CI'].map((type,i)=>({id:`binding-${i}`,type,name:type,read:'',write:'',createPr:false,merge:false,status:'connected'}))],environment:{...defaultEnvironment('Growth'),status:'ready',provisionSteps:[...PROVISION_STEPS]},automation:'HG SDLC'};
 const s:State={revision:1,boards:[{id:'board-savings',productId:'savings',teamId:'growth',name:'Копилка',description:'Задачи продукта Копилка.'}],products:[{id:'savings',name:'Копилка',description:'Долговременная продуктовая и клиентская ответственность.',owner:'po',goals:'Onboarding · Activation · First Funding',metrics:'Activation · First Funding',knowledgeVersion:1}],teams:[team],responsibilities:[{productId:'savings',teamId:'growth',scope:['Onboarding','Activation','First Funding']}],people:[{id:'po',name:'Product Owner',role:'Product Owner',assignments:['team.admin','risk.accept','knowledge.review'],teams:['growth']},{id:'platform',name:'Platform Engineer',role:'Platform Engineer',assignments:['incident.respond'],teams:['growth']},{id:'engineer',name:'Product Engineer',role:'Product Engineer',assignments:['knowledge.contribute','knowledge.review','capability.review','incident.respond'],teams:['growth']},{id:'regulator',name:'Regulator',role:'Regulator',assignments:[],teams:[],directions:['Information Security','Reliability','Risk']}],tasks:[],capabilities:[],runs:[],policies:[],knowledge:[{id:'pk-1',productId:'savings',layer:'Product',title:'Копилка · Product Knowledge',content:'Product: Копилка\nResponsibility: Onboarding, Activation, First Funding\nКлиентские выписки и справки согласуются через Specification.',status:'approved',version:1,author:'po',reviewer:'po'},{id:'tk-1',productId:'savings',teamId:'growth',layer:'Team',title:'Dependency update · инженерные conventions',content:'Обновлять только dependency. Не менять retry logic. Выполнять compatibility suite. Публиковать результат через PR; merge не разрешён.',status:'approved',version:1,author:'engineer',reviewer:'engineer'}],suites:[],assets:[],benchmarks:[],messages:[],notifications:[],initiatives:[],audit:[]};
 s.tasks=trackerTaskTemplates();
 const requirement={id:'SEC-DEP-014',version:3,owner:'Information Security',status:'Current',segment:'retail.backend',effective:'2026-10-01',supersedes:'SEC-DEP-014@2',references:'Approved Component Registry',text:'При обновлении библиотек разрешено использовать только сертифицированные версии.'};
 for(const [id,version,direction] of [['IS-retail-backend',7,'Information Security'],['IS-retail-backend',8,'Information Security'],['REL-retail-backend',4,'Reliability'],['RISK-retail-backend',3,'Risk']] as [string,number,string][]){s.policies.push({id,version,direction,segment:'retail.backend',status:version===7?'Deprecating':'Current',sunset:version===7?'2026-11-30':'',effective:'2026-10-01',owner:direction,supersedes:version===8?'IS-retail-backend@7':'',requirements:id.startsWith('IS')?[copy(requirement)]:id.startsWith('REL')?[{...copy(requirement),id:'REL-COMPAT-004',version:5,owner:'Reliability',text:'Preserve API compatibility. Compatibility suite is required.'}]:[],applicability:id.startsWith('IS')?[{requirement:'SEC-DEP-014@3',tag:'dep-update',segment:'retail.backend',workType:'dependency_change',artifactType:'dependency manifest'}]:id.startsWith('REL')?[{requirement:'REL-COMPAT-004@5',segment:'retail.backend',workType:'implementation, verification'}]:[],skills:id.startsWith('IS')?['certified-dependency-selection@5']:['dependency-evidence-check@3'],evidence:id.startsWith('IS')?[{requirement:'SEC-DEP-014@3',artifacts:'final dependency manifest; approved registry reference',verificationSkill:'dependency-evidence-check@3'}]:id.startsWith('REL')?[{requirement:'REL-COMPAT-004@5',artifacts:'compatibility report',verificationSkill:'dependency-evidence-check@3'}]:[],changelog:version===8?'Новая версия Policy Package. Требуется re-evaluation зависимых Capabilities.':'Версия из демонстрационного набора.'})}
 mergeRepositoryPolicies(s);
 const cfg={...defaultConfig('dep-update'),version:'1.4',humanInput:false,humanApproval:false};const cap:Capability={id:'cap-dep',tag:'dep-update',teamId:'growth',productId:'savings',name:'Dependency Update',draft:null,releases:[]};s.capabilities.push(cap);const snap=makeSnapshot(s,cap,cfg,'SNAP-DEP-1.4',time);const rel:Release={id:'REL-DEP-1.4',snapshot:snap,stage:'production',status:'migration_required',uat:{status:'PASS',snapshotId:snap.id,binding:'UAT',runId:'UAT-DEP-1.4',time},risk:{accepted:true,actor:'po',identity:'demo:Product Owner',comment:'Риск принят в пределах dependency update и Resource Bindings.',time,snapshotId:snap.id},releasedAt:time,autonomyScope:cfg.scope};cap.releases.push(rel);
 for(let i=0;i<42;i++){const t=s.tasks[[0,1,3][i%3]];const r=makeRun(s,cap,cfg,t,`RUN-${850+i}`,new Date(Date.parse(time)-(43-i)*3600000).toISOString(),'supervised');r.plans.push(makePlan(r));finishRun(r,new Date(Date.parse(r.startedAt)+18*60000).toISOString());r.fixture=true;r.metrics.rework=i>=38&&i<41?1:0;r.metrics.takeover=i===41?1:0;r.metrics.approval=1;r.metrics.humanTime=4;r.metrics.latency=18;if(i>=38){r.status=i<41?'reworked':'taken_over'}s.runs.push(r);snap.historyRefs.push(r.id)}
 const stCap:Capability={id:'cap-statement',tag:'statement-doc',teamId:'growth',productId:'savings',name:'Statements & Certificates',draft:defaultConfig('statement-doc'),releases:[]};s.capabilities.push(stCap);
 const seededUat=makeRun(s,cap,cfg,s.tasks[0],'UAT-DEP-1.4',time,'uat',rel);seededUat.uat=true;seededUat.fixture=true;seededUat.plans.push(makePlan(seededUat));finishRun(seededUat);s.runs.push(seededUat);const active=makeRun(s,cap,cfg,s.tasks[0],'RUN-912',time);active.plans.push(makePlan(active));event(active,'Regulatory Plan created','PLAN-RUN-912-1');event(active,'Analysis completed');event(active,'Implementation started');addGate(active,'input','Implementation',new Date(Date.parse(time)+7*60000).toISOString());s.runs.push(active);
 const statement=makeRun(s,stCap,stCap.draft!,s.tasks[4],'RUN-913',new Date(Date.parse(time)+8*60000).toISOString());statement.plans.push(makePlan(statement));event(statement,'Regulatory Plan created');statement.artifacts.specification='BANK-2012 · Statement for arbitrary period\nСформировать выписку за произвольный период.\nДо Implementation требуется Human Approval.\nRegulatory Plan: REL-COMPAT-004@5.';addGate(statement,'approval','Specification',new Date(Date.parse(time)+12*60000).toISOString());s.runs.push(statement);
 s.assets=[...['code-diff-analysis@4','dependency-review@5','certified-dependency-selection@5','dependency-evidence-check@3','hg-sdlc-run-diagnostics@1'].map(k=>{const[id,v]=k.split('@');return{id,version:Number(v),type:'Skills',name:id,owner:id.includes('certified')||id.includes('evidence')?'Information Security':'Product Engineer',status:'Current',runtimes:['HG SDLC','AI Manager'] as Runtime[],changelog:'Versioned reusable asset'}}),{id:'dependency-update',version:1,type:'Workflow Templates',name:'Dependency Update · non-SDD',owner:'Product Engineer',status:'Current',runtimes:['HG SDLC'],changelog:'Analyze → Implement → Checks → Result'},{id:'sdd-statements',version:1,type:'Workflow Templates',name:'Statements & Certificates · SDD',owner:'Product Engineer',status:'Current',runtimes:['HG SDLC'],changelog:'Task → Specification → Human Approval → Implementation → Checks → Result'},{id:'product-engineer',version:1,type:'AI Agent Blueprints',name:'Product Engineer',owner:'Product Engineer',status:'Current',runtimes:['AI Manager'],changelog:'Workers, handoffs, instructions, constraints'},{id:'dependency-judge',version:1,type:'Judge Profiles',name:'Dependency Review Judge',owner:'Product Engineer',status:'Current',runtimes:['HG SDLC','AI Manager'],changelog:'Структурированная оценка Actual ↔ Golden',instruction:'Сравнить actual result и golden result. Проверить correctness, scope control, test quality и minimal change.',skills:['code-diff-analysis@4','dependency-review@5'],schema:{correctness:'number',scope_control:'number',test_quality:'number',minimal_change:'number',verdict:'PASS | FAIL',summary:'text',findings:'array'}}];
 mergeCatalogAssets(s);
 s.suites=[{id:'dep-update-suite',version:3,name:'Dependency Update',tag:'dep-update',teamId:'growth',productId:'savings',cases:s.tasks.slice(0,3).map(t=>({taskId:t.id,pr:t.pr!,base:t.base,golden:t.golden,confirmed:true})),judgeId:'dependency-judge@1'}];
 s.messages=[{id:'msg-1',thread:'RUN-912',actor:'engineer',text:'Обнови только dependency. Не меняй retry logic.',time},{id:'msg-2',thread:'team-growth',actor:'po',text:'Responsibility команды: Onboarding, Activation, First Funding.',time}];
 s.notifications=[{id:'n-policy',kind:'Policy migration required',title:'IS-retail-backend@7 · Deprecating',text:'Dependency Update v1.4 требует migration. Sunset: 30 November 2026.',teamId:'growth',productId:'savings',target:'regulation',ref:'IS-retail-backend@7',time,read:false},{id:'n-gate-1',kind:'Human Input',title:'BANK-1842 · Input required',text:'Какую допустимую версию использовать?',teamId:'growth',productId:'savings',target:'run',ref:'RUN-912',time,read:false},{id:'n-gate-2',kind:'Human Approval',title:'BANK-2012 · Approval required',text:'Specification готова к согласованию.',teamId:'growth',productId:'savings',target:'run',ref:'RUN-913',time,read:false}];return s}

/** Empty user workspace; platform catalog, policies and demo identities remain available. */
export function createEmptyState():State{
 const seed=createSeed();
 return {...seed,revision:1,products:[],boards:[],teams:[],responsibilities:[],people:seed.people.map(person=>({...person,teams:[]})),tasks:[],capabilities:[],runs:[],knowledge:[],suites:[],benchmarks:[],messages:[],notifications:[],initiatives:[],audit:[]};
}

/** Demo counterparts cover both repositories offered by the resource wizard. */
function mergeRepositoryPolicies(state:State){
 for(const [prefix,direction] of [['IS','Information Security'],['REL','Reliability'],['RISK','Risk']]){
  const id=`${prefix}-retail-frontend`;
  if(state.policies.some(policy=>policy.id===id))continue;
  const base=state.policies.filter(policy=>policy.direction===direction&&policy.segment==='retail.backend').sort((a,b)=>b.version-a.version)[0];
  if(!base)continue;
  const policy=copy(base);
  Object.assign(policy,{id,version:1,segment:'retail.frontend',status:'Current',sunset:'',supersedes:'',changelog:'Демонстрационный Policy Package для Git-репозитория frontend.'});
  policy.requirements=policy.requirements.map(requirement=>({...requirement,segment:'retail.frontend'}));
  policy.applicability=policy.applicability.map(rule=>({...rule,segment:'retail.frontend'}));
  state.policies.push(policy);
 }
}
/** Current reusable assets are merged into mutable catalog data only. */
export function catalogFlowAssets():Asset[]{
 const runtimes:Runtime[]=['HG SDLC','AI Manager'];
 return [
  {id:'dependency-update',version:1,type:'Flow',name:'Dependency Update',owner:'Product Engineer',status:'Current',runtimes,changelog:'Анализ, обновление зависимостей, проверки и результат.',schema:{template:'dependency-update@1',description:'Обновление зависимостей приложения с проверкой совместимости.'}},
  {id:'sdd-statements',version:1,type:'Flow',name:'Statements & Certificates',owner:'Product Engineer',status:'Current',runtimes,changelog:'Specification, согласование, реализация, проверки и результат.',schema:{template:'sdd-statements@1',description:'Изменение выписок и справок по согласованной спецификации.'}},
  {id:'custom',version:1,type:'Flow',name:'Custom Flow',owner:'Product Engineer',status:'Current',runtimes,changelog:'Настраиваемая последовательность анализа, реализации и проверок.',schema:{template:'custom',description:'Базовая структура для настройки собственного Flow.'}},
  ...[{id:'analysis-agent',name:'Агент анализа',instruction:'Проанализировать задачу, контекст и ограничения Flow.'},{id:'implementation-agent',name:'Агент реализации',instruction:'Подготовить изменение в пределах предоставленных разрешений.'},{id:'checks-agent',name:'Агент проверок',instruction:'Проверить текущую версию результата по критериям узла.'}].map(item=>({...item,version:1,type:'Subagents',owner:'Product Engineer',status:'Current',runtimes,changelog:'Версия демонстрационного сабагента.'}))
 ];
}
function mergeCatalogAssets(state:State){
 for(const asset of catalogFlowAssets()){
  const index=state.assets.findIndex(item=>item.id===asset.id&&item.version===asset.version);
  if(index<0)state.assets.push(asset);
  else if(state.assets[index].type==='Workflow Templates')state.assets[index]=asset;
 }
}
/** Product + tag resolves to one shared Flow; old duplicate histories remain addressable. */
export function capabilityForTag(state:State,productId:string,tag:string){
 return state.capabilities.find(cap=>cap.productId===productId&&cap.tag===tag&&!cap.legacyDuplicateOf)
  ||state.capabilities.find(cap=>cap.productId===productId&&cap.tag===tag);
}
/** Upgrade mutable workspace data while leaving every historical snapshot unchanged. */
export function migrateState(source:Item):{state:State;changed:boolean}{
 const state=copy(source);
 const legacyClasses:Array<Item>=Array.isArray(state.classes)?state.classes:[];
 if(!Array.isArray(state.boards))state.boards=Array.isArray(state.projects)?copy(state.projects):[];
 const boardFor=(productId:string,teamId:string)=>{
  let board=state.boards.find((item:Board)=>item.productId===productId&&item.teamId===teamId);
  if(!board){
   const base=`board-${productId}-${teamId}`;
   let id=base,index=2;
   while(state.boards.some((item:Board)=>item.id===id))id=`${base}-${index++}`;
   board={id,productId,teamId,name:state.products.find((item:Product)=>item.id===productId)?.name||'Доска задач',description:''};
   state.boards.push(board);
  }
  return board;
 };
 for(const task of state.tasks){
  task.boardId=task.boardId||task.projectId;
  if(!state.boards.some((board:Board)=>board.id===task.boardId&&board.productId===task.productId&&board.teamId===task.teamId))task.boardId=boardFor(task.productId,task.teamId).id;
  delete task.projectId;
 }
 const shared=new Map<string,string>();
 for(const capability of state.capabilities){
  const legacy=legacyClasses.find(item=>item.id===capability.classId);
  capability.tag=capability.tag??legacy?.tag??capability.releases[0]?.snapshot.tag??capability.releases[0]?.snapshot.taskClass?.tag??'';
  delete capability.classId;
  if(capability.draft?.nodeConfigs)capability.draft.nodeConfigs=getEditableFlowNodes(capability.draft);
  const key=`${capability.productId}\0${capability.tag}`;
  if(shared.has(key))capability.legacyDuplicateOf=shared.get(key);
  else {shared.set(key,capability.id);delete capability.legacyDuplicateOf;}
 }
 for(const suite of state.suites){
  const legacy=legacyClasses.find(item=>item.id===suite.classId);
  const task=state.tasks.find((item:Task)=>item.id===suite.cases[0]?.taskId);
  suite.tag=suite.tag??legacy?.tag??task?.tag??'';
  suite.teamId=suite.teamId??legacy?.teamId??task?.teamId??'';
  suite.productId=suite.productId??legacy?.productId??task?.productId??'';
  delete suite.classId;
 }
 for(const team of state.teams)team.bindings=team.bindings.filter((binding:Binding)=>['Repository','Task Tracker','CI'].includes(binding.type));
 for(const policy of state.policies){
  for(const rule of policy.applicability){
   if(rule.taskClass!==undefined){rule.tag=rule.tag??rule.taskClass;delete rule.taskClass;}
  }
 }
 delete state.classes;delete state.projects;
 mergeCatalogAssets(state as State);mergeRepositoryPolicies(state as State);
 return {state:state as State,changed:JSON.stringify(source)!==JSON.stringify(state)};
}
