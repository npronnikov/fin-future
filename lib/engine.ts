import {ASSIGNMENTS,PROVISION_STEPS,REPOSITORIES,SEGMENTS,TASK_STATUSES,FLOW_TEMPLATES,POLICY_STATUSES,isDependencyFlow,isRetiredPolicyStatus,addGate,configKey,copy,currentRelease,defaultConfig,defaultEnvironment,event,finishRun,flowIssues,generateArtifacts,getFlowNodes,getEditableFlowNodes,nextFlowVersion,releaseRiskAssessment,snapshotTestBaskets,makePlan,makeRun,makeSnapshot,policyKey,sameExecutionConfiguration,snapshotTag,trackerTaskTemplates,type State,type Person,type Item,type Config,type ContextBundle,type FlowNode,type Capability,type Run,type Policy,type Binding,type Snapshot,type Task} from './domain.ts';
import {compileContextBundle,compileContextDeliveryTrace} from './context-supply.ts';
export class DomainError extends Error {status:number;constructor(message:string,status=400){super(message);this.status=status}}
const required=(v:any,label:string,max=20000)=>{if(typeof v!=='string'||!v.trim())throw new DomainError(`Заполните «${label}».`);if(v.length>max)throw new DomainError(`Поле «${label}» слишком длинное.`);return v.trim()};
const get=<T extends Item>(items:T[],id:string,label:string):T=>{const x=items.find(i=>i.id===id);if(!x)throw new DomainError(`${label} не найден.`,404);return x};
const must=(yes:any,msg:string)=>{if(!yes)throw new DomainError(msg,409)};
const role=(actor:Person,...roles:string[])=>{if(!roles.includes(actor.role))throw new DomainError(`Действие доступно: ${roles.join(', ')}.`,403)};
const permission=(actor:Person,p:string)=>{if(!actor.assignments.includes(p))throw new DomainError(`Требуется Permission ${p}.`,403)};
const teamAccess=(actor:Person,teamId:string)=>{if(!actor.teams.includes(teamId)&&actor.role!=='Regulator')throw new DomainError('Нет доступа к Team Space.',403)};
const uid=(prefix:string)=>`${prefix}-${crypto.randomUUID().slice(0,8)}`;
const CONFIG_FIELDS=['description','tokenLimit','nodes','nodeConfigs','instructions','skills','blueprints','workers','handoffs','constraints','checks','model','limit','humanInput','humanApproval','gateAssignee','policies','productKnowledge','teamKnowledge','scope','repos','template','workflow','mode'] as const;
const NODE_FIELDS=['id','type','name','executor','input','output','instructions','skills','subagents','rule','criteria','maxRetries','verification'] as const;
const nodeContent=(node:FlowNode)=>Object.fromEntries(NODE_FIELDS.map(key=>[key,node[key]]));
const stableValue=(value:any):any=>Array.isArray(value)?value.map(stableValue):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(key=>value[key]!==undefined).map(key=>[key,stableValue(value[key])])):value;
const sameValue=(a:any,b:any)=>JSON.stringify(stableValue(a))===JSON.stringify(stableValue(b));
function scopeMatch(entity:{teamId:string;productId:string},payload:Item){
 must(!payload.teamId||payload.teamId===entity.teamId,'Объект не принадлежит выбранной Team.');
 must(!payload.productId||payload.productId===entity.productId,'Объект не принадлежит выбранному Product.');
}
function workspaceScope(s:State,actor:Person,teamId:string,productId:string){
 const team=get(s.teams,teamId,'Team');get(s.products,productId,'Product');teamAccess(actor,teamId);
 must(s.responsibilities.some(link=>link.teamId===teamId&&link.productId===productId),'Team не связана с выбранным Product.');
 return team;
}
function setConfigFields(original:Config,partial:Item|undefined){
 const config=copy(original);
 if(partial!==undefined){
  must(partial&&typeof partial==='object'&&!Array.isArray(partial),'Configuration должна быть объектом.');
  for(const key of CONFIG_FIELDS)if(partial[key]!==undefined)(config as any)[key]=copy(partial[key]);
 }
 if(Array.isArray(config.nodeConfigs)){
  const previous=getFlowNodes(original);
  config.nodeConfigs=config.nodeConfigs.map(node=>{
   if(!node||typeof node!=='object'||Array.isArray(node))return node;
   const content=nodeContent(node),before=previous.find(item=>item.id===node.id);
   const revision=before?(Number.isInteger(before.revision)&&before.revision>0?before.revision:1)+(!sameValue(content,nodeContent(before))?1:0):1;
   return {...content,revision} as FlowNode;
  });
  config.nodes=config.nodeConfigs.map(node=>node?.name);
 }
 return config;
}
function taskAssignee(s:State,teamId:string,assigneeId:unknown){
 if(assigneeId===undefined||assigneeId===null||assigneeId==='')return undefined;
 must(typeof assigneeId==='string','Выберите assignee.');
 const person=get(s.people,assigneeId as string,'Assignee');
 const team=get(s.teams,teamId,'Team');
 must(team.people.includes(person.id)&&person.teams.includes(teamId),'Assignee должен быть участником команды.');
 return person.id;
}
function notify(s:State,kind:string,title:string,text:string,teamId:string,productId:string,target='capability',ref=''){s.notifications.unshift({id:uid('notice'),kind,title,text,teamId,productId,target,ref,time:new Date().toISOString(),read:false})}
function gateNotice(s:State,r:Run){
 const g=r.gates.at(-1);
 if(g?.status!=='pending')return;
 const kind=g.type==='input'?'Human Input':'Human Approval',title=`${r.taskId} · ${g.type==='input'?'Input':'Approval'} required`;
 notify(s,kind,title,g.question,r.teamId,r.productId,'run',r.id);
 if(!s.messages.some(message=>message.gateId===g.id))s.messages.push({id:uid('message'),thread:r.id,teamId:r.teamId,productId:r.productId,actor:'automation',kind:'gate',title,text:g.question,runId:r.id,gateId:g.id,assigneeId:g.assignee,time:g.createdAt});
}
export function pathAllowed(path:string,grants:string){return grants.split(/[\n,]+/).map(s=>s.trim()).some(g=>g==='/**'||g===path||(g.endsWith('/**')&&path.startsWith(g.slice(0,-2))))}
function validateFlowConfiguration(s:State,cap:Capability,cfg:Config,allowLegacyExecutors=false){
 const problems=flowIssues(cfg,{allowLegacyExecutors});must(!problems.length,problems.join(' '));
 if(!cfg.nodeConfigs)return;
 const team=get(s.teams,cap.teamId,'Team');
 for(const node of cfg.nodeConfigs){
  for(const agent of node.subagents||[])must(s.assets.some(asset=>`${asset.id}@${asset.version}`===agent&&asset.type==='Subagents'&&asset.runtimes.includes(cfg.runtime)),`Шаг «${node.name}»: Subagent ${agent} отсутствует или несовместим с runtime.`);
  for(const skill of node.skills)must(s.assets.some(asset=>`${asset.id}@${asset.version}`===skill&&asset.type==='Skills'&&asset.runtimes.includes(cfg.runtime)),`Шаг «${node.name}»: Skill ${skill} отсутствует или несовместим с runtime.`);
  if(node.executor==='ci'||node.type==='checks'&&node.verification==='ci')must(team.bindings.some(binding=>binding.type==='CI'&&binding.status==='connected'),`Шаг «${node.name}»: подключите CI в Resource Bindings или выберите локальную проверку.`);
 }
}
function validateConfig(s:State,cap:Capability,cfg:Config,reviewerOverride=false,allowLegacyExecutors=false){validateFlowConfiguration(s,cap,cfg,allowLegacyExecutors);if(cfg.description!==undefined)must(typeof cfg.description==='string'&&cfg.description.length<=20000,'Описание Flow должно содержать до 20000 символов.');if(cfg.tokenLimit!==undefined)must(Number.isInteger(cfg.tokenLimit)&&cfg.tokenLimit>0&&cfg.tokenLimit<=10000000,'Лимит токенов — целое число от 1 до 10 000 000.');for(const key of ['nodes','skills','blueprints','policies','repos'] as const)must(Array.isArray(cfg[key])&&cfg[key].every(value=>typeof value==='string'),'Configuration: ожидается список строк '+key);for(const key of ['instructions','workers','handoffs','constraints','checks','model','gateAssignee','scope','template','workflow'] as const)must(typeof cfg[key]==='string','Configuration: ожидается строка '+key);must(typeof cfg.humanInput==='boolean'&&typeof cfg.humanApproval==='boolean','Human Gates должны иметь boolean значения.');must(Number.isFinite(cfg.limit)&&Number.isFinite(cfg.productKnowledge)&&Number.isFinite(cfg.teamKnowledge),'Некорректные limits или версии Knowledge.');required(cfg.scope,'Scope');const team=get(s.teams,cap.teamId,'Team');must(cfg.runtime===team.automation,'Runtime конфигурации должен совпадать с Automation команды.');must(['SDD','non-SDD'].includes(cfg.mode),'Неизвестный workflow mode.');must(cfg.repos.length>0,'Выберите Repository из Resource Bindings.');for(const repo of cfg.repos){const b=team.bindings.find(b=>b.type==='Repository'&&b.name===repo);must(b&&b.status==='connected',`Repository ${repo} не подключён.`);for(const scope of cfg.scope.split(/[\n,]+/).filter(Boolean))must(pathAllowed(scope.trim(),b!.write),`Scope ${scope} выходит за grants для ${repo}.`)}must(cfg.limit>0&&cfg.limit<=team.environment.quota,'Limits не могут превышать Environment quota.');if(!reviewerOverride){must(team.people.includes(cfg.gateAssignee),'Gate assignee должен быть участником команды.');const a=get(s.people,cfg.gateAssignee,'Assignee');must(a.assignments.includes('capability.review'),'Gate assignee должен иметь capability.review.');}for(const key of cfg.skills)must(s.assets.some(a=>`${a.id}@${a.version}`===key&&a.type==='Skills'&&a.runtimes.includes(cfg.runtime)),`Skill ${key} отсутствует или несовместим с runtime.`);for(const key of cfg.policies)must(s.policies.some(p=>policyKey(p)===key),`Policy ${key} не найдена.`);must(cfg.policies.length>0,'Зафиксируйте Regulatory Context.');const selectedPackages=s.policies.filter(p=>cfg.policies.includes(policyKey(p)));must(new Set(selectedPackages.map(p=>p.id)).size===selectedPackages.length,'Для одного Policy Package выбирается одна точная версия.');for(const segment of new Set(team.bindings.filter(b=>b.type==='Repository'&&cfg.repos.includes(b.name)).map(b=>b.segment))){for(const direction of ['Information Security','Reliability','Risk'])must(selectedPackages.some(p=>p.segment===segment&&p.direction===direction),`Для ${segment} требуется Policy Package: ${direction}.`)}must(cfg.nodes.length>0,'Workflow должен содержать узлы.');must(!cfg.nodes.some(n=>/before run|after run/i.test(n)),'До запуска и После запуска — системные стадии runtime.');must(cfg.productKnowledge>0&&cfg.teamKnowledge>0,'Выберите версии Knowledge.');}
export function policyHealth(s:State,snap:Snapshot){const list=snap.config.policies.map(k=>s.policies.find(p=>policyKey(p)===k));if(list.some(p=>!p||isRetiredPolicyStatus(p.status)||(p.status==='Deprecating'&&p.sunset&&Date.now()>Date.parse(`${p.sunset}T23:59:59Z`))))return 'suspended';if(list.some(p=>p?.status==='Deprecating'))return 'migration_required';return 'active'}
export function refreshHealth(s:State){for(const c of s.capabilities)for(const r of c.releases)if(r.stage==='production'&&r.status!=='superseded'){const status=policyHealth(s,r.snapshot);if(r.status!==status){r.status=status;if(status==='suspended')notify(s,'Capability suspended',`${c.name} v${r.snapshot.config.version}`,`Новые автономные запуски запрещены: зависимость от отозванной policy или истёкшего grace period.`,c.teamId,c.productId,'capability',c.id)}}resumeLegacyUat(s);}
/** Resume UATs saved by older versions at a human gate without changing their frozen snapshot. */
function resumeLegacyUat(s:State){
 for(const cap of s.capabilities)for(const release of cap.releases){
  if(release.stage!=='uat_running'||release.uat?.status!=='RUNNING')continue;
  const run=s.runs.find(run=>run.id===release.uat!.runId&&run.uat&&!run.completedAt);
  if(!run||!run.gates.some(gate=>['pending','taken_over'].includes(gate.status)))continue;
  const priorSnapshot=run.snapshot;
  try{
   executionGrants(s,priorSnapshot);
   for(const gate of run.gates)if(gate.status==='pending')gate.status='bypassed_uat';
   if(run.execution.flow?.waiting){const trace=run.execution.flow.trace[run.execution.flow.waiting.traceIndex];if(trace)trace.status='bypassed_uat';}
   run.attempts.at(-1)!.artifacts=copy(run.artifacts);run.attempts.at(-1)!.status='uat_legacy_resumed';
   run.attempt++;run.artifactRevision++;run.attempts.push({number:run.attempt,revision:run.artifactRevision,status:'running',comment:'Автоматическое продолжение UAT без Human Gates.'});
   run.writer='automation';run.artifacts={};run.workspace.checked=false;run.execution.uatAutoMigrated=true;
   event(run,'UAT continued automatically','Прежний UAT продолжен на том же snapshot без Human Gates.');startExecution(s,run);
  }catch(error){
   if(!(error instanceof DomainError))throw error;
   release.uat.status='FAIL';release.stage='rejected';run.status='failed';run.writer='none';run.completedAt=new Date().toISOString();
   for(const gate of run.gates)if(gate.status==='pending')gate.status='cancelled';
   event(run,'UAT failed',error.message,'red');notify(s,'UAT decisions',`${cap.name} · UAT FAIL`,error.message,cap.teamId,cap.productId,'capability',cap.id);
  }
 }
}
function completeRun(s:State,r:Run){
 finishRun(r);
 if(r.uat){
  const cap=s.capabilities.find(cap=>cap.id===r.capabilityId),release=cap?.releases.find(item=>item.id===r.releaseId);
  if(release){
   const baskets=snapshotTestBaskets(s,release.snapshot).map(basket=>{
    const passed=basket.cases.filter(item=>item.confirmed&&item.pr&&item.base&&item.golden).length;
    return {id:basket.id,version:basket.version,name:basket.name,total:basket.cases.length,passed,status:passed===basket.cases.length?'PASS':'FAIL'};
   });
   const report={demo:true,tests:{status:r.evidence?.status==='PASS'?'PASS':'FAIL',count:148,passed:r.evidence?.status==='PASS'?148:0},baskets,basketCount:baskets.length,basketCaseCount:baskets.reduce((count,basket)=>count+basket.total,0)};
   const status=report.tests.status==='PASS'&&baskets.every(basket=>basket.status==='PASS')?'PASS':'FAIL';
   r.execution.uatReport=copy(report);event(r,'UAT tests completed',`148 тестов · ${report.basketCount?`${report.basketCaseCount} задач тестовой корзины`:'нет тестовой корзины'} · ${status}`,status==='PASS'?'green':'red');
   release.uat={status,snapshotId:release.snapshot.id,binding:release.snapshot.uatBindings,runId:r.id,time:new Date().toISOString(),report};
   release.stage=status==='PASS'?'uat_passed':'rejected';
   if(status==='FAIL'){r.status='failed';r.attempts.at(-1)!.status='failed';}
   notify(s,'UAT decisions',`${cap!.name} · UAT ${status}`,release.snapshot.id,cap!.teamId,cap!.productId,'capability',cap!.id);
  }
 }else{const task=s.tasks.find(task=>task.id===r.taskId);if(task)task.status='done';}
}
function traceFlowNode(r:Run,node:FlowNode,status:string){
 const flow=r.execution.flow;
 const trace={nodeId:node.id,nodeRevision:node.revision,name:node.name,type:node.type,executor:node.executor,input:node.input,output:node.output,instructions:node.instructions,skills:copy(node.skills),subagents:copy(node.subagents||[]),rule:node.rule,criteria:node.criteria,maxRetries:node.maxRetries,verification:node.verification,attempt:r.attempt,artifactRevision:r.artifactRevision,status,demo:true,time:new Date().toISOString()};
 flow.trace.push(trace);flow.activeNodeId=node.id;
 return trace;
}
function openFlowGate(s:State,r:Run,node:FlowNode,kind:'input'|'approval'|'final',phase:string,nextCursor:number){
 const flow=r.execution.flow;
 const trace=traceFlowNode(r,node,kind==='input'?'input_required':'approval_required');
 const gate=addGate(r,kind==='input'?'input':'approval',phase);
 gate.nodeId=node.id;gate.nodeRevision=node.revision;
 if(kind==='input'&&node.type==='input'){gate.question=node.instructions||node.input;gate.options=undefined;}
 if(kind==='approval'&&phase!=='Specification')gate.question=`Принять результат шага «${node.name}»?`;
 Object.assign(trace,{gateId:gate.id});
 flow.waiting={kind,phase,nodeId:node.id,cursor:flow.cursor,nextCursor,traceIndex:flow.trace.length-1};
 gateNotice(s,r);
}
/** Deterministic demo execution follows the saved sequence; it never calls external systems. */
function advanceFlow(s:State,r:Run){
 const cfg=r.snapshot.config,flow=r.execution.flow,nodes=getFlowNodes(cfg),task=get(s.tasks,r.taskId,'Task'),automatic=r.mode==='production'||!!r.uat||r.mode==='uat';
 must(flow&&!flow.waiting&&r.writer!=='human','Flow не может продолжиться до решения текущего Gate.');
 r.writer='automation';r.status='running';
 while(flow.cursor<nodes.length){
  const node=nodes[flow.cursor];
  if(node.type==='implementation'){
   must(automatic||cfg.mode!=='SDD'||flow.specificationApproved,'SDD: требуется явный Approval текущей Specification.');
   if(!automatic&&cfg.humanInput&&cfg.mode!=='SDD'&&!flow.inputSatisfied){openFlowGate(s,r,node,'input','Implementation',flow.cursor);return;}
  }
  if(node.type==='approval'||node.type==='input'){
   if(automatic){
    const trace=traceFlowNode(r,node,r.uat?'bypassed_uat':'bypassed_released');Object.assign(trace,{automatic:true,reason:r.uat?'UAT executes tests automatically without Human Gates.':'Released Flow executes without Human Gates; no human approval recorded.'});
    event(r,r.uat?'UAT · Human Gate bypassed':'Released Flow · Human Gate bypassed',`${node.name} · автоматический прогон без решения человека`);flow.cursor++;continue;
   }
   if(node.type==='input'){openFlowGate(s,r,node,'input',`Шаг: ${node.name}`,flow.cursor+1);return;}
   const phase=cfg.mode==='SDD'&&!flow.specificationApproved&&nodes.slice(0,flow.cursor).some(node=>node.type==='specification')?'Specification':`Шаг: ${node.name}`;
   openFlowGate(s,r,node,'approval',phase,flow.cursor+1);return;
  }
  if(node.type==='result'){
   must(flow.checkedArtifactRevision===r.artifactRevision&&r.workspace.checked,'Flow: Checks должны проверить текущую artifact revision перед Result.');
   if(!automatic&&(r.mode==='supervised'||cfg.humanApproval)){openFlowGate(s,r,node,'final','Result',flow.cursor+1);return;}
  }
  const trace=traceFlowNode(r,node,'running');
  event(r,'Flow node started',`${node.name} · ${node.id}@${node.revision} · ${node.executor}`);
  if(node.type==='task')r.artifacts.task={id:task.id,title:task.title,tag:task.tag,repository:task.repo,baseRevision:task.base};
  if(node.type==='analysis'){
   r.artifacts.analysis=`${task.title}\n${node.instructions}\n${node.output}`;
   event(r,'Analysis completed',node.name);
  }
  if(node.type==='specification'){
   const comment=r.attempts.at(-1)?.comment;
   r.artifacts.specification=`${task.id} · ${task.title}\n${cfg.instructions}\n${node.instructions}\n${node.output}\nКритерии: ${node.criteria}${comment?`\nRework: ${comment}`:''}`;
   flow.specificationApproved=false;
   event(r,'Specification prepared',`${node.name} · artifact revision ${r.artifactRevision}`);
  }
  if(node.type==='implementation'){
   event(r,'Implementation started',`${node.name} · Attempt ${r.attempt}`);
   if(flow.preserveHumanDiff&&r.artifacts.diff)event(r,'Human artifacts preserved',`${node.name} · artifact revision ${r.artifactRevision}`);
   else generateArtifacts(r);
   r.workspace.checked=false;flow.checkedArtifactRevision=0;
   event(r,'Implementation completed',`${node.name} · artifact revision ${r.artifactRevision}`);
  }
  if(node.type==='checks'){
   must(!!r.artifacts.diff,'Flow: до Checks должен быть подготовлен результат Implementation.');
   const verification=node.verification==='ci'?'CI · non-prod':'Local · Sandbox';
   const existing=r.artifacts.tests?.startsWith('Human workspace checks')?`${r.artifacts.tests}\n`:'';
   r.artifacts.tests=`${existing}compatibility-suite #12991\n148 / 148 passed\n${node.name} · ${verification} · demo PASS\nКритерии: ${node.criteria}`;
   r.workspace.checked=true;flow.checkedArtifactRevision=r.artifactRevision;
   event(r,'Checks completed',`${node.name} · ${verification} · demo PASS · automatic retries 0/${node.maxRetries}`,'green');
  }
  r.artifacts.nodeOutputs={...(r.artifacts.nodeOutputs||{}),[node.id]:{nodeRevision:node.revision,output:node.output,criteria:node.criteria,artifactRevision:r.artifactRevision,demo:true}};
  trace.status='completed';
  r.attempts.at(-1)!.artifacts=copy(r.artifacts);
  event(r,'Flow node completed',`${node.name} · ${node.id}@${node.revision}`,'green');
  flow.cursor++;
 }
 flow.activeNodeId=null;flow.completed=true;completeRun(s,r);
}
function resumeFlow(s:State,r:Run,decision:'input'|'approve'){
 const flow=r.execution.flow,waiting=flow?.waiting;
 must(waiting,'В Flow отсутствует ожидающий узел.');
 const trace=flow.trace[waiting.traceIndex];
 if(trace)trace.status=decision==='input'?'answered':'approved';
 if(decision==='input')flow.inputSatisfied=true;
 if(decision==='approve'&&waiting.phase==='Specification')flow.specificationApproved=true;
 flow.cursor=waiting.nextCursor;flow.waiting=null;
 if(waiting.kind==='final'){
  must(flow.checkedArtifactRevision===r.artifactRevision&&r.workspace.checked,'Проверки текущей artifact revision не завершены.');
  flow.activeNodeId=null;flow.completed=true;completeRun(s,r);
 }else advanceFlow(s,r);
}
/** Rework always starts a new complete attempt while retaining every prior node trace. */
function reworkFlow(s:State,r:Run,comment:string){
 const flow=r.execution.flow;
 if(flow?.waiting){const trace=flow.trace[flow.waiting.traceIndex];if(trace)trace.status='rework_requested';}
 r.artifacts={};r.workspace.checked=false;r.workspace.content='';r.evidence=null;
 event(r,'Flow restarted for Rework',`Попытка ${r.attempt} · весь сценарий с первого узла · ${comment}`,'amber');
 startExecution(s,r);
}
function executeToApproval(s:State,r:Run){r.writer='automation';r.status='running';event(r,'Implementation started',`Attempt ${r.attempt}`);generateArtifacts(r);event(r,'Implementation completed',`Attempt ${r.attempt} · artifact revision ${r.artifactRevision}`);r.attempts.at(-1)!.artifacts=copy(r.artifacts);event(r,'Checks completed',r.artifacts.tests,'green');if(r.mode==='supervised'||r.snapshot.config.humanApproval){addGate(r,'approval','Result');gateNotice(s,r)}else completeRun(s,r)}
function startExecution(s:State,r:Run){
 r.plans.push(makePlan(r,r.attempt===1?'До запуска':`До запуска · attempt ${r.attempt}`));event(r,'Regulatory Plan created',r.plans.at(-1)!.id);
 if(r.mode==='production'){r.execution.autonomous=true;event(r,'Released Flow emulation','Демонстрационный прогон опубликованного snapshot без Human Input и Human Approval.');}
 if(r.uat){r.execution.autonomous=true;event(r,'UAT automatic execution','Эмуляция тестов и зафиксированной тестовой корзины без Human Gates.');}
 const trace=r.execution.flow?.trace||[];
 r.execution.flow={cursor:0,trace,inputSatisfied:false,specificationApproved:false,checkedArtifactRevision:0,waiting:null,completed:false};
 advanceFlow(s,r);
}
function executionGrants(s:State,snap:Snapshot){const t=get(s.teams,snap.teamId,'Team');must(t.environment.status==='ready','Environment не готов.');must(t.automation===snap.runtime&&t.environment.runtimeVersion===snap.runtimeVersion,'Environment не соответствует frozen runtime requirements. Требуется re-evaluation.');must(snap.config.limit<=t.environment.quota,'Frozen limits превышают текущую quota.');if(snap.config.nodeConfigs){const problems=flowIssues(snap.config,{allowLegacyExecutors:true});must(!problems.length,problems.join(' '));if(snap.config.nodeConfigs.some(node=>node.executor==='ci'||node.type==='checks'&&node.verification==='ci'))must(t.bindings.some(binding=>binding.type==='CI'&&binding.status==='connected'),'Текущий CI binding недоступен для выбранного Flow.');}for(const old of snap.bindings.filter(b=>b.type==='Repository')){const current=t.bindings.find(b=>b.type==='Repository'&&b.name===old.name&&b.status==='connected');must(current,`Resource binding ${old.name} недоступен.`);for(const path of snap.config.scope.split(/[\n,]+/).filter(Boolean))must(pathAllowed(path.trim(),current!.write),`Текущие grants запрещают ${path} в ${old.name}.`);must(!old.createPr||current!.createPr,'Текущий binding запрещает Create PR.');must(!old.merge||current!.merge,'Текущий binding запрещает Merge.')}}
function configureResources(s:State,teamId:string,cfg:Config){
 const team=get(s.teams,teamId,'Team'),repositories=team.bindings.filter(binding=>binding.type==='Repository'&&binding.status==='connected'&&binding.read&&binding.write);
 must(repositories.length,'Разрешите чтение и запись Git-репозитория в Permissions ресурсов.');
 cfg.repos=repositories.map(binding=>binding.name);
 const preferred=isDependencyFlow(cfg)?[...new Set(repositories.map(binding=>binding.name.includes('retail')?'/package.json':'/pom.xml'))]:[cfg.mode==='SDD'?'/src/letters-of-credit/**':'/src/automation/**'];
 const common=(scope:string)=>repositories.every(binding=>pathAllowed(scope,binding.write));
 if(preferred.every(common))cfg.scope=preferred.join('\n');
 else{
  const fallback=[cfg.scope,...repositories.flatMap(binding=>binding.write.split(/[\n,]+/))].map(scope=>scope.trim()).find(scope=>scope&&common(scope));
  must(fallback,'Git-репозитории не имеют общего write scope. Настройте Permissions ресурсов.');cfg.scope=fallback!;
 }
 cfg.policies=[...new Set(repositories.map(binding=>binding.segment))].flatMap(segment=>['Information Security','Reliability','Risk'].map(direction=>{
  const policy=s.policies.filter(policy=>policy.segment===segment&&policy.direction===direction&&['Current','Deprecating'].includes(policy.status)).sort((a,b)=>Number(b.status==='Current')-Number(a.status==='Current')||b.version-a.version)[0];
  must(policy,`Для ${segment} отсутствует действующий Policy Package: ${direction}.`);return policyKey(policy!);
 }));
}
/** Hidden inherited defaults are repaired only in editable drafts and only inside current grants. */
function repairEditableDefaults(s:State,actor:Person,cap:Capability,cfg:Config,original?:Config){
 const team=get(s.teams,cap.teamId,'Team');
 if((!original||cfg.limit===original.limit)&&(!Number.isFinite(cfg.limit)||cfg.limit<=0||cfg.limit>team.environment.quota))cfg.limit=Math.min(100,team.environment.quota);
 const reviewer=s.people.find(person=>person.id===cfg.gateAssignee&&team.people.includes(person.id)&&person.teams.includes(team.id)&&person.assignments.includes('capability.review'));
 if(!reviewer&&(!original||cfg.gateAssignee===original.gateAssignee)){
  const reviewers=s.people.filter(person=>team.people.includes(person.id)&&person.teams.includes(team.id)&&person.assignments.includes('capability.review'));
  cfg.gateAssignee=(reviewers.find(person=>person.id===actor.id)||reviewers[0])?.id||cfg.gateAssignee;
 }
 const resourcesValid=cfg.repos.length>0&&cfg.repos.every(name=>{
  const binding=team.bindings.find(binding=>binding.type==='Repository'&&binding.name===name&&binding.status==='connected');
  return binding&&cfg.scope.split(/[\n,]+/).filter(Boolean).every(scope=>pathAllowed(scope.trim(),binding.write));
 });
 if(!resourcesValid&&(!original||JSON.stringify(cfg.repos)===JSON.stringify(original.repos)&&cfg.scope===original.scope))configureResources(s,team.id,cfg);
}
function createTaskRun(s:State,actor:Person,cap:Capability,task:Task,mode:'supervised'|'production',now:string):Run{
 must(cap.productId===task.productId,'Flow не принадлежит Product задачи.');
 must(cap.tag===task.tag,'Тег Task не соответствует тегу Flow.');
 const board=get(s.boards,task.boardId,'Доска');must(board.teamId===task.teamId&&board.productId===task.productId,'Доска не относится к команде и продукту задачи.');
 const team=get(s.teams,task.teamId,'Team');
 must(s.responsibilities.some(link=>link.productId===task.productId&&link.teamId===team.id),'Team не связана с Product задачи.');
 must(team.environment.status==='ready','Environment команды задачи не готов.');
 must(s.runs.filter(run=>run.teamId===team.id&&!run.completedAt&&!['cancelled','failed'].includes(run.status)).length<team.environment.parallel,'Достигнут максимум параллельных запусков.');
 must(!s.runs.some(run=>run.taskId===task.id&&!run.completedAt&&!['cancelled','failed'].includes(run.status)),'Для Task уже есть активный запуск.');
 const release=currentRelease(cap);
 if(mode==='production')must(release&&['active','migration_required'].includes(policyHealth(s,release.snapshot)),'Нет активной Trusted Capability. Автономный запуск запрещён.');
 const cfg=mode==='production'?release!.snapshot.config:cap.draft||release?.snapshot.config;
 must(cfg,'Capability configuration отсутствует.');
 if(mode==='supervised')validateConfig(s,cap,cfg!,true,!cap.draft);
 must(cfg!.repos.includes(task.repo),'Repository Task находится вне scope этой Capability.');
 const run=makeRun(s,cap,cfg!,task,uid('RUN'),now,mode,mode==='production'?release:undefined);
 executionGrants(s,run.snapshot);
 if(team.id!==cap.teamId){
  must(team.automation===run.snapshot.runtime&&team.environment.runtimeVersion===run.snapshot.runtimeVersion,'Environment команды задачи не соответствует runtime общего Flow.');
  must(cfg!.limit<=team.environment.quota,'Лимит Flow превышает quota команды задачи.');
  for(const type of ['Task Tracker','CI'])must(team.bindings.some(binding=>binding.type===type&&binding.status==='connected'),`В команде задачи не подключён ${type}.`);
  const local=team.bindings.find(binding=>binding.type==='Repository'&&binding.name===task.repo&&binding.status==='connected');
  must(local,`Git-репозиторий ${task.repo} не подключён в команде задачи.`);
  for(const scope of cfg!.scope.split(/[\n,]+/).filter(Boolean))must(pathAllowed(scope.trim(),local!.write),`Текущие grants команды задачи запрещают ${scope}.`);
  const frozen=run.snapshot.bindings.find(binding=>binding.type==='Repository'&&binding.name===task.repo);
  must(!frozen?.createPr||local!.createPr,'Текущий binding команды задачи запрещает Create PR.');
  must(!frozen?.merge||local!.merge,'Текущий binding команды задачи запрещает Merge.');
 }
 if(mode==='supervised'){
  const reviewers=s.people.filter(person=>team.people.includes(person.id)&&person.teams.includes(team.id)&&person.assignments.includes('capability.review'));
  const reviewer=reviewers.find(person=>person.id===actor.id)||reviewers.find(person=>person.id===cfg!.gateAssignee)||reviewers[0];
  must(reviewer,'Назначьте участнику команды задачи Permission capability.review.');
  if(reviewer!.id!==cfg!.gateAssignee)run.execution.gateAssignee=reviewer!.id;
 }
 run.execution.model=cfg!.model;run.execution.tokenLimit=cfg!.tokenLimit||100000;
 s.runs.push(run);task.status='in_progress';startExecution(s,run);
 return run;
}
function onlyPolicyMigration(s:State,cap:Capability):boolean{if(!cap.migrationFrom||!cap.draft)return false;const base=cap.releases.find(r=>r.id===cap.migrationFrom);if(!base||base.stage!=='production'||!base.snapshot.historyRefs.length)return false;const candidate=makeSnapshot(s,cap,cap.draft,'comparison','');if(JSON.stringify(candidate.config.policies)===JSON.stringify(base.snapshot.config.policies))return false;candidate.config.version=base.snapshot.config.version;candidate.config.revision=base.snapshot.config.revision;candidate.config.policies=copy(base.snapshot.config.policies);return sameExecutionConfiguration(candidate,base.snapshot)}
export function applyAction(source:State,actor:Person,action:string,p:Item,identity:string):{state:State;result?:Item}{const s=copy(source);const now=new Date().toISOString();let result:Item|undefined;refreshHealth(s);
 if(p.teamId)teamAccess(actor,p.teamId);
 const cap=p.capabilityId?get(s.capabilities,p.capabilityId,'Capability'):undefined;if(cap){if(action==='start_run'){must(!p.productId||p.productId===cap.productId,'Flow не относится к выбранному Product.');must(s.responsibilities.some(link=>link.productId===cap.productId&&actor.teams.includes(link.teamId)),'Нет доступа к Product этого Flow.');}else{teamAccess(actor,cap.teamId);scopeMatch(cap,p)}}
 const run=p.runId?get(s.runs,p.runId,'Запуск'):undefined;if(run){teamAccess(actor,run.teamId);scopeMatch(run,p)}
 switch(action){
 case 'create_product':{role(actor,'Product Owner');const id=uid('product');s.products.push({id,name:required(p.name,'Название',160),description:required(p.description,'Описание'),owner:actor.id,goals:p.goals||'',...(p.metrics!==undefined?{metrics:String(p.metrics)}:{}),knowledgeVersion:1});result={id};break}
 case 'update_product':{role(actor,'Product Owner');const product=get(s.products,p.productId,'Product');product.name=required(p.name,'Название',160);product.description=required(p.description,'Описание');product.goals=p.goals||'';if(p.metrics!==undefined)product.metrics=String(p.metrics);break}
 case 'create_team':{role(actor,'Product Owner');get(s.products,p.productId,'Product');const id=uid('team'),name=required(p.name,'Team',100);s.teams.push({id,name,spaceId:uid('space'),knowledgeVersion:1,people:[actor.id],bindings:[],automation:null,environment:defaultEnvironment(name)});s.responsibilities.push({productId:p.productId,teamId:id,scope:required(p.scope,'Responsibility').split(/[,\n]+/).map((s:string)=>s.trim()).filter(Boolean)});get(s.people,actor.id,'Person').teams.push(id);result={id,productId:p.productId};break}
 case 'connect_team':{role(actor,'Product Owner');get(s.products,p.productId,'Product');get(s.teams,p.connectTeamId,'Team');must(!s.responsibilities.some(r=>r.teamId===p.connectTeamId&&r.productId===p.productId),'Team уже подключена к Product.');s.responsibilities.push({productId:p.productId,teamId:p.connectTeamId,scope:required(p.scope,'Responsibility').split(/[,\n]+/).map((x:string)=>x.trim()).filter(Boolean)});result={id:p.connectTeamId};break}
 case 'update_team':{role(actor,'Product Owner');const t=get(s.teams,p.teamId,'Team');t.name=required(p.name,'Team',100);const r=s.responsibilities.find(r=>r.teamId===p.teamId&&r.productId===p.productId);must(r,'Responsibility Scope не найден.');r!.scope=required(p.scope,'Responsibility').split(/[,\n]+/).map((x:string)=>x.trim()).filter(Boolean);break}
 case 'add_person':{role(actor,'Product Owner');permission(actor,'team.admin');const t=get(s.teams,p.teamId,'Team');must(['Product Owner','Platform Engineer','Product Engineer'].includes(p.role),'Выберите одну из трёх базовых ролей.');let person=p.personId?s.people.find(x=>x.id===p.personId):undefined;if(person){must(person.role!=='Regulator','Regulator находится в отдельном control functions контуре.');if(!person.teams.includes(t.id))person.teams.push(t.id);if(Array.isArray(p.assignments))person.assignments=p.assignments.filter((a:string)=>ASSIGNMENTS.includes(a));}else{person={id:uid('person'),name:required(p.name,'Имя',160),role:p.role,assignments:(p.assignments||[]).filter((a:string)=>ASSIGNMENTS.includes(a)),teams:[t.id]};s.people.push(person)}if(!t.people.includes(person.id))t.people.push(person.id);break}
 case 'update_assignments':{role(actor,'Product Owner');permission(actor,'team.admin');const person=get(s.people,p.personId,'Person');must(person.teams.includes(p.teamId),'Person не участвует в Team.');person.assignments=(p.assignments||[]).filter((a:string)=>ASSIGNMENTS.includes(a));break}
 case 'save_binding':{
  role(actor,'Platform Engineer');const t=workspaceScope(s,actor,p.teamId,p.productId);
  const type=p.type==='Git Repository'?'Repository':p.type==='Jenkins CI'?'CI':required(p.type,'Тип');
  must(['Repository','Task Tracker','CI'].includes(type),'Неизвестный тип Resource Binding.');
  const name=required(p.name,type==='Repository'?'Git-репозиторий':type==='Task Tracker'?'Task Tracker':'CI');
  const existing=t.bindings.find(binding=>p.id?binding.id===p.id:binding.type===type&&binding.name===name);
  if(p.id)must(existing,'Resource Binding не найден в выбранной команде.');
  let b:Binding={id:existing?.id||uid('binding'),type,name,read:p.read??existing?.read??'',write:p.write??existing?.write??'',createPr:p.createPr===undefined?!!existing?.createPr:!!p.createPr,merge:p.merge===undefined?!!existing?.merge:!!p.merge,status:'connected'};
  if(type==='Repository'){
   const meta=REPOSITORIES.find(repo=>repo.name===name);must(meta,'Repository должен существовать в каталоге систем.');b={...b,...meta};
   if(p.permissions!==undefined){
    must(Array.isArray(p.permissions)&&p.permissions.every((code:unknown)=>['read','write','admin','create_pr'].includes(String(code))),'Неизвестные Permissions Git-репозитория.');
    const permissions=[...new Set<string>(p.permissions)];
    if(permissions.includes('admin'))for(const code of ['read','write'])if(!permissions.includes(code))permissions.push(code);
    const before=existing?.permissions||[...(existing?.read?['read']:[]),...(existing?.write?['write']:[]),...(existing?.createPr?['create_pr']:[])];
    const unchanged=existing&&existing.type===type&&existing.name===name&&JSON.stringify([...before].sort())===JSON.stringify([...permissions].sort());
    b.permissions=permissions;
    if(!unchanged){b.read=permissions.includes('read')?'/**':'';b.write=permissions.includes('write')?'/**':'';b.createPr=permissions.includes('create_pr')||permissions.includes('admin');b.merge=false;}
   }else if(existing?.permissions)b.permissions=[...existing.permissions];
   must(!!b.read,'Разрешите чтение Git-репозитория.');
  }else{
   if(p.scope!==undefined)b.scope=required(p.scope,'Scope',160);
   else if(existing?.scope)b.scope=existing.scope;
  }
  const semantic=(binding:Binding|undefined)=>binding?JSON.stringify(Object.fromEntries(Object.keys(binding).filter(key=>key!=='permissions').sort().map(key=>[key,(binding as Item)[key]]))):'';
  const changed=semantic(existing)!==semantic(b);
  const index=t.bindings.findIndex(binding=>binding.id===b.id);
  if(index>=0)t.bindings[index]=b;else t.bindings.push(b);
  if(changed&&t.environment.status==='ready'){t.environment.status='configured';t.environment.provisionSteps=[];}
 result={id:b.id};break
 }
 case 'classify_system':{
  role(actor,'Platform Engineer');const t=workspaceScope(s,actor,p.teamId,p.productId),system=required(p.system,'Техническая система',160),segment=required(p.segment,'Сегмент',80);
  must(SEGMENTS.includes(segment),'Выберите поддерживаемый сегмент.');
  const bindings=t.bindings.filter(binding=>binding.type==='Repository'&&binding.system===system);
  must(bindings.length>0,'Техническая система не найдена.');
  for(const binding of bindings)binding.segment=segment;
  if(t.environment.status==='ready'){t.environment.status='configured';t.environment.provisionSteps=[];}
  result={id:system,segment};break
 }
 case 'save_environment':{role(actor,'Platform Engineer');const t=get(s.teams,p.teamId,'Team');must(['HG SDLC','AI Manager'].includes(p.automation),'Выберите HG SDLC или AI Manager.');for(const k of ['cpu','ram','disk','ttl','parallel','quota'])must(Number.isFinite(Number(p[k]))&&Number(p[k])>0,`Некорректное значение ${k}.`);const changed=t.automation!==p.automation||['cpu','ram','disk','ttl','parallel','quota','isolation','network','modelGateway','internet','runtimeVersion','uatBindings'].some(k=>String((t.environment as any)[k])!==String(p[k]));t.automation=p.automation;for(const k of ['cpu','ram','disk','ttl','parallel','quota'])(t.environment as any)[k]=Number(p[k]);for(const k of ['isolation','network','modelGateway','internet','runtimeVersion','uatBindings'])(t.environment as any)[k]=required(p[k],k,1000);if(changed){t.environment.status='configured';t.environment.provisionSteps=[]}break}
 case 'provision':{role(actor,'Platform Engineer');const t=get(s.teams,p.teamId,'Team');must(t.automation,'Сначала выберите Automation.');for(const type of ['Repository','Task Tracker','CI'])must(t.bindings.some(b=>b.type===type&&b.status==='connected'),`Сначала подключите ${type}.`);must(p.topologyConfirmed===true,'Сначала просмотрите topology.');t.environment.status='ready';t.environment.provisionSteps=[...PROVISION_STEPS];notify(s,'Environment Ready',t.environment.name,`${t.automation} · Automation Ready`,t.id,p.productId,'environment');break}
 case 'create_project':
 case 'create_board':{
  role(actor,'Product Owner','Product Engineer');workspaceScope(s,actor,p.teamId,p.productId);
  const id=uid('board');
  s.boards.push({id,teamId:p.teamId,productId:p.productId,name:required(p.name,'Название доски',160),description:typeof p.description==='string'?p.description.trim().slice(0,20000):''});
  result={id};break
 }
 case 'add_mock_tasks':{
  role(actor,'Product Owner','Product Engineer');
  const board=get(s.boards,p.boardId||p.projectId,'Доска');scopeMatch(board,p);
  const team=workspaceScope(s,actor,board.teamId,board.productId);
  const template=p.template||'mixed';
  must(['mixed','dep-update','statement-doc'].includes(template),'Выберите набор моков задач.');
  const sources=trackerTaskTemplates().filter(task=>template==='mixed'||task.tag===template);
  const count=p.count===undefined?sources.length:Number(p.count);
  must(Number.isInteger(count)&&count>=1&&count<=24,'Количество моков должно быть от 1 до 24.');
  const repositories=team.bindings.filter(binding=>binding.type==='Repository'&&binding.status==='connected');
  must(repositories.length>0,'Сначала подключите Repository.');
  const assigneeId=taskAssignee(s,team.id,p.assigneeId),taskIds:string[]=[];
  const offset=s.tasks.filter(task=>task.mock).length;
  for(let index=0;index<count;index++){
   const source=sources[index%sources.length],id=uid('TASK'),externalId=`MOCK-${offset+index+1}`;
   s.tasks.push({...copy(source),id,externalId,productId:board.productId,teamId:board.teamId,boardId:board.id,assigneeId,mock:true,status:'backlog',repo:repositories.some(binding=>binding.name===source.repo)?source.repo:repositories[0].name,pr:`Mock PR · ${externalId}`});
   taskIds.push(id);
  }
  result={id:board.id,boardId:board.id,taskIds,count};break
 }
 case 'update_task':{
  role(actor,'Product Owner','Product Engineer');
  const task=get(s.tasks,p.taskId,'Task');scopeMatch(task,p);workspaceScope(s,actor,task.teamId,task.productId);
  const active=s.runs.some(item=>item.taskId===task.id&&!item.completedAt&&!['cancelled','failed'].includes(item.status));
  must(['status','assigneeId','tag'].some(key=>Object.hasOwn(p,key)),'Выберите изменение задачи.');
  if(Object.hasOwn(p,'status')){
   must(TASK_STATUSES.includes(p.status),'Неизвестная колонка Kanban.');
   must(!active||p.status===task.status,'Статус задачи управляется активным запуском.');
   task.status=p.status;
  }
  if(Object.hasOwn(p,'tag')){
   must(typeof p.tag==='string'&&p.tag.length<=100,'Тег должен содержать не более 100 символов.');
   const tag=p.tag.trim();
   must(!active||tag===task.tag,'Нельзя менять тег задачи во время активного запуска.');
   task.tag=tag;
  }
  if(Object.hasOwn(p,'assigneeId'))task.assigneeId=taskAssignee(s,task.teamId,p.assigneeId);
  result={id:task.id};break
 }
 case 'create_capability':{
  role(actor,'Product Engineer');
  const team=workspaceScope(s,actor,p.teamId,p.productId),tag=required(p.tag,'Тег задачи',100);
  must(s.tasks.some(task=>task.teamId===team.id&&task.productId===p.productId&&task.tag===tag),'Выберите существующий тег на задаче.');
  must(!s.capabilities.some(item=>item.productId===p.productId&&item.tag===tag),'Flow для этого тега уже существует.');
  must(team.automation,'Сначала Platform Engineer должен выбрать Automation.');
  if(p.template!==undefined)must(FLOW_TEMPLATES.includes(p.template),'Выберите доступный шаблон Flow.');
  let cfg=defaultConfig(tag,team.automation!,p.template);
  cfg.gateAssignee=actor.assignments.includes('capability.review')?actor.id:s.people.find(person=>team.people.includes(person.id)&&person.teams.includes(team.id)&&person.assignments.includes('capability.review'))?.id||actor.id;
  configureResources(s,team.id,cfg);
  cfg.productKnowledge=get(s.products,p.productId,'Product').knowledgeVersion;cfg.teamKnowledge=team.knowledgeVersion;
  cfg.limit=Math.min(cfg.limit,team.environment.quota);
  cfg=setConfigFields(cfg,p.config);
  const id=uid('cap'),capability:Capability={id,tag,teamId:team.id,productId:p.productId,name:p.name?required(p.name,'Название Flow',160):tag==='dep-update'?'Dependency Update':tag==='statement-doc'?'Statements & Certificates':tag,draft:cfg,releases:[]};
  validateConfig(s,capability,cfg);s.capabilities.push(capability);result={id};break
 }
 case 'clone_release':{role(actor,'Product Engineer');must(cap,'Capability не найдена.');must(!cap!.draft,'Новая Draft уже существует.');const rel=cap!.releases.find(r=>r.id===p.releaseId)||currentRelease(cap!);must(rel,'Release не найден.');const cfg=copy(rel!.snapshot.config);const [major,minor]=cfg.version.split('.').map(Number);cfg.version=`${major}.${(minor||0)+1}`;cfg.revision=1;if(cfg.nodeConfigs)cfg.nodeConfigs=getEditableFlowNodes(cfg);cfg.runtime=get(s.teams,cap!.teamId,'Team').automation||cfg.runtime;repairEditableDefaults(s,actor,cap!,cfg);cap!.draft=cfg;cap!.migrationFrom=rel!.id;result={id:cap!.id};break}
 case 'save_config':{role(actor,'Product Engineer');must(cap?.draft,'Создайте новую версию для редактирования.');const original=cap!.draft!;must(p.expectedRevision===original.revision,'Draft уже изменена. Обновите экран.');const cfg=setConfigFields(original,p.config);repairEditableDefaults(s,actor,cap!,cfg,original);validateConfig(s,cap!,cfg);const name=p.name===undefined?cap!.name:required(p.name,'Название Flow',160);if(!sameValue(cfg,original)||name!==cap!.name){cfg.version=nextFlowVersion(original.version);cfg.revision++;cap!.draft=cfg;cap!.name=name}break}
 case 'start_run':{
  role(actor,'Product Engineer');const task=get(s.tasks,p.taskId,'Task');teamAccess(actor,task.teamId);scopeMatch(task,p);
  must(cap,'Capability не найдена.');must(p.mode===undefined||['supervised','production'].includes(p.mode),'Неизвестный режим запуска.');
  const r=createTaskRun(s,actor,cap!,task,p.mode==='production'?'production':'supervised',now);result={id:r.id};break
 }
 case 'emulate_release':{
  role(actor,'Product Engineer');must(cap,'Capability не найдена.');
  must(!cap!.legacyDuplicateOf,`Для тега используется общий Flow ${cap!.legacyDuplicateOf}.`);
  const rel=currentRelease(cap!);must(rel&&['active','migration_required'].includes(policyHealth(s,rel.snapshot)),'Нет активной Trusted Capability. Автономная эмуляция запрещена.');
  executionGrants(s,rel!.snapshot);
  const id=uid('EMULATION'),results:Item[]=[],runIds:string[]=[];
  const tasks=s.tasks.filter(task=>task.productId===cap!.productId&&task.tag===cap!.tag);
  for(const task of tasks){
   const row:Item={taskId:task.id,boardId:task.boardId,teamId:task.teamId};
   if(task.status==='done'){results.push({...row,status:'skipped',reason:'Задача уже завершена.'});continue;}
   if(s.runs.some(run=>run.taskId===task.id&&!run.completedAt&&!['cancelled','failed'].includes(run.status))){results.push({...row,status:'skipped',reason:'У задачи уже есть активный запуск.'});continue;}
   const isolated=copy(s);
   try{
    const currentCap=get(isolated.capabilities,cap!.id,'Capability'),currentTask=get(isolated.tasks,task.id,'Task');
    const run=createTaskRun(isolated,actor,currentCap,currentTask,'production',now);
    must(run.status==='accepted'&&run.gates.length===0,'Автономная эмуляция не завершила Flow.');
    run.execution.emulationId=id;Object.assign(s,isolated);runIds.push(run.id);results.push({...row,status:'completed',runId:run.id});
   }catch(error){
    if(!(error instanceof DomainError))throw error;
    results.push({...row,status:'skipped',reason:error.message});
   }
  }
  result={id,capabilityId:cap!.id,releaseId:rel!.id,tag:cap!.tag,completed:runIds.length,skipped:results.filter(row=>row.status==='skipped').length,failed:0,runIds,results};
  notify(s,'Эмуляция Capability завершена',`${cap!.name} · ${runIds.length} задач выполнено`,`Тег ${cap!.tag}. Пропущено: ${result.skipped}. Демонстрационный автоматический прогон без Human Gates.`,cap!.teamId,cap!.productId,'capability',cap!.id);
  break
 }
 case 'gate_decision':{
  must(run,'Запуск не найден.');permission(actor,'capability.review');
  const r=run!,g=get(r.gates,p.gateId,'Gate');
  must(g.assignee===actor.id,'Gate назначен другому пользователю.');
  must(g.status==='pending'&&g.revision===p.gateRevision&&g.artifactRevision===p.artifactRevision&&r.artifactRevision===p.artifactRevision,'Gate / artifact revision устарела. Обновите данные.');
  must(r.writer!=='human','Workspace уже передан человеку.');
  must(['input','approve','rework','takeover'].includes(p.decision),'Неизвестное решение.');
  if(p.decision==='input')must(g.type==='input','Этот Gate требует Approval.');
  if(['approve','rework'].includes(p.decision))must(g.type==='approval','Human Input не является Approval.');
  if(p.decision==='input')required(p.value,'Human Input');
  if(p.decision==='rework')required(p.comment,'Что исправить');
  if(p.decision==='takeover')required(p.comment,'Комментарий при передаче управления');
  g.status=p.decision==='input'?'answered':p.decision==='approve'?'approved':p.decision==='rework'?'rework_requested':'taken_over';
  g.decision={action:p.decision,actor:actor.id,identity,time:now,value:p.value||'',comment:p.comment||'',...(p.decision==='rework'?{returnTo:'Начало Flow',restart:'full'}:{}),gateRevision:g.revision,artifactRevision:g.artifactRevision,scope:g.scope};
  r.metrics.humanTime++;
  if(p.decision==='takeover'){
   event(r,'Takeover requested',actor.name,'amber');event(r,'Automation paused','Automation writer released','amber');
   r.writer='human';r.status='takeover';r.workspace.checked=false;r.metrics.takeover++;
   if(r.execution.flow?.waiting){const trace=r.execution.flow.trace[r.execution.flow.waiting.traceIndex];if(trace)trace.status='taken_over';}
   r.execution.comments=[...(r.execution.comments||[]),{id:uid('comment'),kind:'takeover',actor:actor.id,identity,time:now,text:p.comment,attempt:r.attempt}];
   event(r,'Human workspace granted',r.workspace.path,'amber');event(r,'Управление передано человеку','Идите в IDE и редактируйте проект там, а потом верните управление.','amber');notify(s,'Takeover',`${r.taskId} · управление у человека`,actor.name,r.teamId,r.productId,'run',r.id);
  }else if(p.decision==='rework'){
   r.metrics.rework++;r.attempts.at(-1)!.artifacts=copy(r.artifacts);r.attempts.at(-1)!.status='rework_requested';r.attempts.at(-1)!.decision=copy(g.decision);
   r.attempt++;r.artifactRevision++;r.attempts.push({number:r.attempt,revision:r.artifactRevision,status:'running',comment:p.comment,returnTo:'Начало Flow',restart:'full'});
   event(r,'Rework requested',p.comment,'amber');notify(s,'Rework',`${r.taskId} · Attempt ${r.attempt}`,p.comment,r.teamId,r.productId,'run',r.id);
   reworkFlow(s,r,p.comment);
  }else if(p.decision==='input'){
   r.metrics.input++;const inputNode=g.nodeId?getFlowNodes(r.snapshot.config).find(node=>node.id===g.nodeId&&node.type==='input'):undefined;
   if(inputNode)r.artifacts.inputs={...(r.artifacts.inputs||{}),[inputNode.id]:{value:p.value,nodeRevision:inputNode.revision,attempt:r.attempt}};else r.artifacts.inputChoice=p.value;
   event(r,'Input received',p.value,'green');
   if(r.execution.flow)resumeFlow(s,r,'input');else executeToApproval(s,r);
  }else{
   r.metrics.approval++;event(r,'Human Approval received',`${g.phase} · revision ${g.artifactRevision}`,'green');
   if(r.execution.flow)resumeFlow(s,r,'approve');else if(g.phase==='Specification')executeToApproval(s,r);else completeRun(s,r);
  }
  break;
 }
 case 'workspace_save':{must(run&&run.writer==='human','Workspace доступен для записи только после Takeover.');permission(actor,'capability.review');must(run!.gates.some(g=>g.status==='taken_over'&&g.decision?.actor===actor.id),'Takeover принадлежит другому пользователю.');run!.workspace.content=required(p.content,'Изменения artifacts');run!.workspace.checked=false;run!.artifactRevision++;const gate=run!.gates.filter(g=>g.status==='taken_over').at(-1);if(gate?.phase==='Specification')run!.artifacts.specification=p.content;else{run!.artifacts.diff=p.content;const versions=[...p.content.matchAll(/<version>([^<]+)<\/version>/g)];if(versions.length)run!.artifacts.manifest=`dependency ${versions.at(-1)![1]}`;else if(snapshotTag(run!.snapshot)==='dep-update')run!.artifacts.manifest='Manifest требует verification';}event(run!,'Human changed artifacts',`artifact revision ${run!.artifactRevision}`);break}
 case 'workspace_checks':{must(run&&run.writer==='human','Сначала получите workspace через Takeover.');must(run!.gates.some(g=>g.status==='taken_over'&&g.decision?.actor===actor.id),'Takeover принадлежит другому пользователю.');must(!!run!.workspace.content,'Сначала сохраните изменения artifacts.');run!.workspace.checked=true;run!.artifacts.tests='Human workspace checks · PASS';if(run!.execution.flow){const flow=run!.execution.flow;flow.humanChecks=[...(flow.humanChecks||[]),{artifactRevision:run!.artifactRevision,actor:actor.id,time:now,status:'PASS',demo:true}];}event(run!,'Human workspace checks completed','PASS','green');break}
 case 'return_control':{
  must(run&&run.writer==='human','Сначала заберите управление.');permission(actor,'capability.review');
  const r=run!,takeover=r.gates.filter(gate=>gate.status==='taken_over').at(-1);
  must(takeover?.decision?.actor===actor.id,'Takeover принадлежит другому пользователю.');
  const comment=required(p.comment,'Комментарий при возврате управления');
  r.execution.comments=[...(r.execution.comments||[]),{id:uid('comment'),kind:'return_control',actor:actor.id,identity,time:now,text:comment,attempt:r.attempt}];
  r.attempts.at(-1)!.artifacts=copy(r.artifacts);r.attempts.at(-1)!.status='taken_over';
  r.writer='none';event(r,'Human workspace writer released',comment);r.writer='automation';event(r,'Control returned to automation',comment);
  r.attempt++;r.artifactRevision++;r.attempts.push({number:r.attempt,revision:r.artifactRevision,status:'running',comment});
  if(r.execution.flow){
   const flow=r.execution.flow,waiting=flow.waiting,node=getFlowNodes(r.snapshot.config).find(node=>node.id===waiting?.nodeId);
   must(waiting&&node,'Flow: отсутствует узел возврата после Takeover.');
   flow.inputSatisfied=true;flow.preserveHumanDiff=!!r.artifacts.diff;
   if(waiting.kind==='input'){
    flow.waiting=null;flow.cursor=waiting.nextCursor;flow.checkedArtifactRevision=0;r.workspace.checked=false;advanceFlow(s,r);
   }else{
    if(takeover?.phase!=='Specification'){
     if(!r.artifacts.diff)generateArtifacts(r);
     r.artifacts.tests='IDE return verification · demo PASS';r.workspace.checked=true;flow.checkedArtifactRevision=r.artifactRevision;
     event(r,'Automation verified IDE changes',`artifact revision ${r.artifactRevision} · demo PASS`,'green');
    }
    openFlowGate(s,r,node!,waiting.kind==='final'?'final':'approval',waiting.phase,waiting.nextCursor);
   }
  }else{
   if(takeover?.phase!=='Specification'){if(!r.artifacts.diff)generateArtifacts(r);r.artifacts.tests='IDE return verification · demo PASS';r.workspace.checked=true;event(r,'Automation verified IDE changes',`artifact revision ${r.artifactRevision} · demo PASS`,'green');}
   addGate(r,'approval',takeover?.phase==='Specification'?'Specification':'Result');gateNotice(s,r);
  }
  break;
 }
 case 'cancel_run':{role(actor,'Product Engineer');must(run&&!run.completedAt,'Запуск уже завершён.');run!.status='cancelled';run!.writer='none';run!.completedAt=now;for(const g of run!.gates)if(g.status==='pending')g.status='cancelled';event(run!,'Запуск отменён',actor.name,'amber');if(run!.uat){const c=s.capabilities.find(c=>c.id===run!.capabilityId),rel=c?.releases.find(r=>r.id===run!.releaseId);if(rel){rel.stage='rejected';if(rel.uat)rel.uat.status='CANCELLED';notify(s,'UAT decisions',`${c!.name} · UAT cancelled`,run!.id,run!.teamId,run!.productId,'capability',c!.id)}}else get(s.tasks,run!.taskId,'Task').status='backlog';break}
 case 'extend_run_scope':{role(actor,'Product Engineer');must(run&&!run.completedAt&&run.writer!=='human','Scope нельзя изменить в текущем состоянии запуска.');const t=get(s.teams,run!.teamId,'Team');const b=t.bindings.find(b=>b.name===p.repository&&b.type==='Repository');must(b,'Нет resource binding для нового Repository.');must(run!.snapshot.config.repos.includes(p.repository),'Новый Repository находится вне frozen Capability scope. Создайте новую конфигурацию и запуск.');must(!run!.scope.repositories.includes(p.repository),'Repository уже присутствует в Regulatory Plan.');run!.scope.repositories.push(p.repository);const plan=makePlan(run!,'new repository detected');run!.plans.push(plan);event(run!,'Regulatory Plan updated',`${plan.id} · ${p.repository}`);break}
 case 'message':{required(p.text,'Сообщение',10000);must(p.thread===`team-${p.teamId}`||s.runs.some(r=>r.id===p.thread&&r.teamId===p.teamId&&r.productId===p.productId),'Thread не принадлежит текущему scope.');s.messages.push({id:uid('message'),thread:p.thread,teamId:p.teamId,productId:p.productId,actor:actor.id,text:p.text,time:now});break}
 case 'mark_notification':{const n=get(s.notifications,p.id,'Notification');teamAccess(actor,n.teamId);scopeMatch(n as {teamId:string;productId:string},p);n.read=true;break}
 case 'mark_all_notifications':{for(const notice of s.notifications)if(actor.teams.includes(notice.teamId)&&(!p.teamId||notice.teamId===p.teamId)&&(!p.productId||notice.productId===p.productId))notice.read=true;break}
 case 'knowledge_propose':{permission(actor,'knowledge.contribute');const layer=p.layer==='Team'?'Team':'Product';const product=get(s.products,p.productId,'Product');const t=get(s.teams,p.teamId,'Team');const conceptIds=Array.isArray(p.conceptIds)?[...new Set<string>(p.conceptIds)]:[];must(conceptIds.every((id:string)=>s.concepts.some(concept=>concept.id===id&&concept.productId===product.id)),'Понятие не относится к выбранному Product.');const sourceRefs=Array.isArray(p.sourceRefs)?p.sourceRefs.map((value:unknown)=>String(value).trim()).filter(Boolean).slice(0,40):[];s.knowledge.push({id:uid('knowledge'),productId:product.id,teamId:layer==='Team'?t.id:undefined,layer,title:required(p.title,'Название',180),content:required(p.content,'Содержание'),summary:typeof p.summary==='string'?p.summary.trim().slice(0,500):undefined,conceptIds,sourceRefs,status:'proposed',version:1,author:actor.id,sourceRun:p.sourceRun||undefined});break}
 case 'knowledge_review':{permission(actor,'knowledge.review');const k=get(s.knowledge,p.id,'Knowledge');must(k.status==='proposed','Proposal уже рассмотрен.');if(k.teamId)teamAccess(actor,k.teamId);k.status=p.approve?'approved':'rejected';k.reviewer=actor.id;if(p.approve){k.publishedAt=now;if(k.layer==='Product'){const product=get(s.products,k.productId,'Product');product.knowledgeVersion++;k.version=product.knowledgeVersion}else{const t=get(s.teams,k.teamId!,'Team');t.knowledgeVersion++;k.version=t.knowledgeVersion}}break}
 case 'save_context_bundle':{
  permission(actor,'knowledge.contribute');workspaceScope(s,actor,p.teamId,p.productId);
  if(p.taskId){
   const task=get(s.tasks,p.taskId,'Task');scopeMatch(task,p);
   const trace=compileContextDeliveryTrace(s,task.id);must(!trace.blocking.length,trace.blocking.join(' '));
   const product=get(s.products,task.productId,'Product'),team=get(s.teams,task.teamId,'Team');
   const productIds=new Set(trace.fragments.filter(item=>item.kind==='product').map(item=>item.sourceId));
   const teamIds=new Set(trace.fragments.filter(item=>item.kind==='team').map(item=>item.sourceId));
   const policyIds=new Set(trace.fragments.filter(item=>item.kind==='policy').map(item=>item.sourceId));
   const topics=new Set(trace.plannerResult.topics),id=uid('SIM').toUpperCase();
   const agentContext=[
    `# Context Delivery Trace · ${trace.simulationId}`,
    'Simulation only · no runtime delivery was performed.',
    ...trace.stages.flatMap(stage=>[
     '',`## ${stage.name}`,
     ...[...stage.product,...stage.team,...stage.policy].map(item=>`- ${item.kind.toUpperCase()} · ${item.title} · ${item.sourceId}@${item.version}`),
    ]),
   ].join('\n');
   const bundle:ContextBundle={
    id,hash:trace.hash,simulation:true,taskId:task.id,
    input:{productId:task.productId,teamId:task.teamId,system:trace.task.system,productTopic:trace.plannerResult.topics.join(', ')||'planner-unknown',workType:trace.task.workTypes[0]||'implementation',stage:'implementation'},
    segment:trace.task.segment,product:{id:product.id,name:product.name,knowledgeVersion:product.knowledgeVersion},team:{id:team.id,name:team.name,knowledgeVersion:team.knowledgeVersion},
    productKnowledge:copy(s.knowledge.filter(item=>productIds.has(item.id))),teamKnowledge:copy(s.knowledge.filter(item=>teamIds.has(item.id))),
    policies:copy(s.policies.filter(item=>policyIds.has(policyKey(item)))),concepts:copy(s.concepts.filter(item=>topics.has(item.categoryId))),
    selectionReasons:trace.fragments.map(item=>({kind:item.kind,id:item.id,reason:item.reason,stageIds:[...item.stageIds]})),sourceVersions:trace.fragments.map(item=>`${item.sourceId}@${item.version}`).sort(),
    unknown:[...trace.unknown],blocking:[...trace.blocking],
    agentContext,
    createdAt:now,createdBy:actor.id,receiptStatus:trace.unknown.length?'incomplete':'ready',plannerResult:copy(trace.plannerResult),stageSlices:copy(trace.stages),verificationPreview:copy(trace.verification),
   };
   s.contextBundles.unshift(copy(bundle));result={id,bundle};break;
  }
  must(['plan','implementation','verification'].includes(p.stage),'Неизвестный момент доставки.');
  const input={productId:p.productId,teamId:p.teamId,system:required(p.system,'Техническая система',160),productTopic:required(p.productTopic,'Тема продукта',100),workType:required(p.workType,'Вид работы',100),stage:p.stage};
  const id=uid('bundle'),bundle=compileContextBundle(s,input,{id,createdAt:now,createdBy:actor.id});must(!bundle.blocking.length,bundle.blocking.join(' '));s.contextBundles.unshift(copy(bundle));result={id,bundle};break;
 }
 case 'save_suite':{role(actor,'Product Engineer');const team=workspaceScope(s,actor,p.teamId,p.productId),tag=required(p.tag,'Тег задачи',100);const cases=p.cases||[];must(Array.isArray(cases)&&cases.length>0,'Добавьте хотя бы один Case.');for(const c of cases){const task=get(s.tasks,c.taskId,'Task');must(task.tag===tag&&task.teamId===team.id&&task.productId===p.productId,'Case не относится к тегу или scope Test Suite.');required(c.pr,'PR');required(c.base,'Base revision');required(c.golden,'Golden revision');must(c.confirmed===true,'Подтвердите Golden revision как эталонное исполнение.')}must(s.assets.some(a=>a.type==='Judge Profiles'&&`${a.id}@${a.version}`===p.judgeId),'Judge Profile не найден.');const id=p.id||uid('suite');const versions=s.suites.filter(x=>x.id===id);must(versions.every(item=>item.teamId===team.id&&item.productId===p.productId&&item.tag===tag),'Test Suite принадлежит другому scope или тегу.');s.suites.push({id,version:versions.length?Math.max(...versions.map(x=>x.version))+1:1,name:required(p.name,'Test Suite'),tag,teamId:team.id,productId:p.productId,cases:copy(cases),judgeId:p.judgeId});result={id};break}
 case 'save_judge':{role(actor,'Product Engineer');const schema=p.schema;must(schema&&typeof schema==='object'&&!Array.isArray(schema)&&Object.keys(schema).length>0,'Output Schema должна быть объектом с полями.');for(const value of Object.values(schema))must(['number','text','array','PASS | FAIL','boolean'].includes(String(value)),'Поддерживаемые типы schema: number, text, array, boolean, PASS | FAIL.');const id=p.id||uid('judge');const versions=s.assets.filter(a=>a.id===id);s.assets.push({id,version:versions.length?Math.max(...versions.map(x=>x.version))+1:1,type:'Judge Profiles',name:required(p.name,'Name'),owner:actor.name,status:'Current',runtimes:['HG SDLC','AI Manager'],changelog:required(p.changelog||'Обновлён Judge Profile','Changelog'),instruction:required(p.instruction,'Instruction'),skills:p.skills||[],schema:copy(schema)});break}
 case 'benchmark':{role(actor,'Product Engineer');must(cap,'Capability не найдена.');const suite=s.suites.find(x=>x.id===p.suiteId&&x.version===p.suiteVersion);must(suite&&suite.tag===cap!.tag&&suite.teamId===cap!.teamId&&suite.productId===cap!.productId,'Выберите Test Suite для тега и scope Flow.');must(suite!.cases.every(c=>c.confirmed),'Все Golden revisions должны быть подтверждены.');const cfg=p.releaseId?cap!.releases.find(r=>r.id===p.releaseId)?.snapshot.config:cap!.draft||currentRelease(cap!)?.snapshot.config;must(cfg,'Configuration не найдена.');const selectedRelease=p.releaseId?cap!.releases.find(r=>r.id===p.releaseId):!cap!.draft?currentRelease(cap!):undefined;const snapshot=selectedRelease?copy(selectedRelease.snapshot):makeSnapshot(s,cap!,cfg!,uid('BENCH-SNAP'),now);const judge=s.assets.find(a=>`${a.id}@${a.version}`===suite!.judgeId)!;const id=uid('BENCH');const reports=suite!.cases.map((c,i)=>{const values=[[96,100,92,95],[91,100,98,87],[78,72,94,61]][i%3];const verdict=i%3===2?'FAIL':'PASS';const task=get(s.tasks,c.taskId,'Task');const runtimeInput={taskId:task.id,task:task.title,baseRevision:c.base,configuration:copy(cfg),sandbox:uid('sandbox')};const actual={diff:`--- base:${c.base}\n+++ actual:${task.id}\n+ dependency update`,createdAt:now};const judgeInput={actual,goldenRevision:c.golden,profile:`${judge.id}@${judge.version}`};const fields:Item={};Object.entries(judge.schema||{}).forEach(([k,type],n)=>fields[k]=type==='number'?values[n%4]:type==='array'?verdict==='PASS'?[]:['Изменения вышли за dependency scope.']:type==='boolean'?verdict==='PASS':type==='PASS | FAIL'?verdict:`${verdict}: ${task.title}`);return{taskId:c.taskId,runtimeInput,actual,judgeInput,fields,verdict,goldenDiff:`--- base:${c.base}\n+++ golden:${c.golden}\n+ accepted dependency update`,findings:verdict==='PASS'?['Scope соблюдён; стандартные checks выполнены.']:['Scope control: обнаружены изменения вне dependency.','Minimal change требует Rework.'],runId:`${id}-${i+1}`,artifacts:['actual diff','golden diff','judge report'],events:['Fresh Sandbox from Base','Selected Capability Snapshot','Actual result produced','Golden provided to Judge','Structured Judge Report']}});s.benchmarks.unshift({id,capabilityId:cap!.id,teamId:cap!.teamId,productId:cap!.productId,suiteId:suite!.id,suiteVersion:suite!.version,snapshot,judge:copy(judge),createdAt:now,reports,passed:reports.filter(r=>r.verdict==='PASS').length,total:reports.length,summary:`${reports.filter(r=>r.verdict==='PASS').length} / ${reports.length} PASS. Benchmark evidence; admission не выполнялся.`});result={id};break}
 case 'freeze_release':{role(actor,'Product Engineer');must(cap?.draft,'Для Release нужна Capability Draft.');validateConfig(s,cap!,cap!.draft!);const draftSnapshot=makeSnapshot(s,cap!,cap!.draft!,'comparison',now);const history=s.runs.filter(r=>r.capabilityId===cap!.id&&!r.uat&&sameExecutionConfiguration(r.snapshot,draftSnapshot));const migration=onlyPolicyMigration(s,cap!);const baseline=cap!.releases.find(r=>r.id===cap!.migrationFrom);must(history.length>0||migration&&baseline,'Нужна история запусков текущей конфигурации. Запустите реальную Task в supervised mode.');must(!cap!.releases.some(r=>r.stage!=='production'&&r.stage!=='rejected'&&configKey(r.snapshot.config)===configKey(cap!.draft!)),'Release Snapshot этой конфигурации уже существует.');const snapshot=makeSnapshot(s,cap!,cap!.draft!,uid('SNAP'),now);snapshot.historyRefs=history.map(r=>r.id);snapshot.historyRunCount=history.filter(run=>!!run.completedAt).length;if(migration&&baseline)snapshot.baselineReleaseId=baseline.id;const refs=Array.isArray(p.benchmarkRefs)?p.benchmarkRefs:[];for(const ref of refs)must(s.benchmarks.some(b=>b.id===ref&&b.capabilityId===cap!.id&&sameExecutionConfiguration(b.snapshot,draftSnapshot)),'Benchmark не относится к выпускаемой конфигурации.');snapshot.benchmarkRefs=refs;const id=uid('RELEASE');cap!.releases.unshift({id,snapshot,stage:'frozen',status:'draft',autonomyScope:snapshot.config.scope});result={id};break}
 case 'run_uat':{
  role(actor,'Product Engineer');must(cap,'Capability не найдена.');const release=get(cap!.releases,p.releaseId,'Release');
  must(release.stage==='frozen','UAT доступен для frozen Release Snapshot.');must(!!release.snapshot.uatBindings,'Настройте UAT environment bindings.');executionGrants(s,release.snapshot);
  const task=s.tasks.find(task=>task.tag===snapshotTag(release.snapshot)&&task.teamId===cap!.teamId&&task.productId===cap!.productId&&release.snapshot.config.repos.includes(task.repo));
  must(task,'Нет подходящей Task для UAT.');
  const run=makeRun(s,cap!,release.snapshot.config,task!,uid('UAT'),now,'uat',release);run.uat=true;event(run,'UAT environment bound',release.snapshot.uatBindings);
  s.runs.push(run);release.uat={status:'RUNNING',snapshotId:release.snapshot.id,binding:release.snapshot.uatBindings,runId:run.id,time:now};release.stage='uat_running';
  startExecution(s,run);result={id:run.id};break;
 }
 case 'risk_decision':{
  permission(actor,'risk.accept');must(cap,'Capability не найдена.');const release=get(cap!.releases,p.releaseId,'Release');
  must(release.stage==='uat_passed'&&release.uat?.status==='PASS'&&release.uat.snapshotId===release.snapshot.id,'Risk decision доступен после UAT того же snapshot.');
  must(typeof p.accepted==='boolean','Примите или отклоните риск.');
  const assessment=releaseRiskAssessment(s,release),acknowledgements=Array.isArray(p.acknowledgements)?p.acknowledgements:[];
  if(p.accepted)must(assessment.risks.every(risk=>acknowledgements.includes(risk.id)),'Подтвердите ознакомление со всеми рисками выпуска.');
  release.risk={accepted:p.accepted,actor:actor.id,identity,comment:required(p.comment,'Риски и решение'),time:now,snapshotId:release.snapshot.id,acknowledgements:p.accepted?assessment.risks.map(risk=>risk.id):[],assessment};
  release.stage=p.accepted?'admitted':'rejected';notify(s,'release approvals',`${cap!.name} · ${p.accepted?'Риск принят':'Риск отклонён'}`,release.risk.comment,cap!.teamId,cap!.productId,'capability',cap!.id);break;
 }
 case 'promote':{role(actor,'Product Engineer');must(cap,'Capability не найдена.');const rel=get(cap!.releases,p.releaseId,'Release');must(rel.stage==='admitted'&&rel.uat?.status==='PASS'&&rel.risk?.accepted&&rel.uat.snapshotId===rel.snapshot.id&&rel.risk.snapshotId===rel.snapshot.id,'Требуются успешный UAT и принятый risk decision того же Release Snapshot.');must(policyHealth(s,rel.snapshot)!=='suspended','Policy dependency запрещает новые автономные запуски.');for(const old of cap!.releases)if(old.stage==='production')old.status='superseded';rel.stage='production';rel.status=policyHealth(s,rel.snapshot);rel.releasedAt=now;if(cap!.draft&&configKey(cap!.draft)===configKey(rel.snapshot.config))cap!.draft=null;notify(s,'release approvals',`${cap!.name} v${rel.snapshot.config.version} · Production`,rel.snapshot.id,cap!.teamId,cap!.productId,'capability',cap!.id);break}
 case 'save_policy':{
  role(actor,'Regulator');must(actor.directions?.includes(p.direction),'Нет Regulator scope для этого направления.');must(SEGMENTS.includes(p.segment),'Неизвестный Segment.');
  const id=required(p.id,'Policy ID',150),versions=s.policies.filter(policy=>policy.id===id),version=versions.length?Math.max(...versions.map(policy=>policy.version))+1:1;
  must(versions.every(policy=>policy.direction===p.direction&&policy.segment===p.segment),'Policy ID уже используется для другого направления или сегмента.');
  must(Array.isArray(p.requirements)&&p.requirements.length>0&&p.requirements.length<=100,'Добавьте от 1 до 100 текстовых правил политики.');
  const keys=new Set<string>();
  const requirements=p.requirements.map((source:Item)=>{
   must(source&&typeof source==='object'&&!Array.isArray(source),'Правило должно содержать текст.');
   const item=copy(source);item.id=required(item.id,'ID правила',150);item.text=required(item.text,'Текст правила');
   must(Number.isInteger(item.version)&&item.version>0,'Версия правила должна быть положительным целым числом.');
   const key=`${item.id}@${item.version}`;must(!keys.has(key),'Правило повторяется в пакете.');keys.add(key);return item;
  });
  const selectedAssets=(value:any,type:string)=>{
   must(Array.isArray(value)&&value.length<=100&&value.every(item=>typeof item==='string'),'Выберите точные версии '+type+' из каталога.');
   must(new Set(value).size===value.length,'Версия '+type+' выбрана повторно.');
   for(const key of value)must(s.assets.some(asset=>`${asset.id}@${asset.version}`===key&&asset.type===type&&!['Withdrawn','Revoked','Superseded'].includes(asset.status)),`${type}: версия ${key} недоступна в каталоге.`);
   return copy(value) as string[];
  };
  const skills=selectedAssets(p.skills||[],'Skills'),subagents=selectedAssets(p.subagents||[],'Subagents');
  const rules=(value:any,label:string)=>{
   must(Array.isArray(value)&&value.length<=300,label+': ожидается список правил.');
   for(const rule of value){must(rule&&typeof rule==='object'&&!Array.isArray(rule),label+': правило должно быть объектом.');must(!rule.requirement||keys.has(rule.requirement),label+': правило ссылается на отсутствующее требование.');if(rule.verificationSkill)selectedAssets([rule.verificationSkill],'Skills');}
   return copy(value);
  };
  const policy:Policy={id,version,direction:p.direction,segment:p.segment,status:'Draft',sunset:'',effective:p.effective||now.slice(0,10),owner:p.direction,supersedes:versions.length?`${id}@${version-1}`:'',requirements,applicability:rules(p.applicability||[],'Применимость'),skills,subagents,evidence:rules(p.evidence||[],'Evidence'),changelog:required(p.changelog,'Changelog')};
  s.policies.push(policy);result={id:policyKey(policy)};break;
 }
 case 'policy_status':{role(actor,'Regulator');const pol=s.policies.find(x=>policyKey(x)===p.policyKey);must(pol,'Policy Package не найден.');must(actor.directions?.includes(pol!.direction),'Нет Regulator scope для этого направления.');must(POLICY_STATUSES.includes(p.status),'Неизвестный Policy status.');if(p.status==='Deprecating')required(p.sunset,'Sunset');pol!.status=p.status;pol!.sunset=p.status==='Deprecating'?p.sunset:'';for(const c of s.capabilities){const affected=c.releases.some(r=>r.stage==='production'&&r.status!=='superseded'&&r.snapshot.config.policies.includes(p.policyKey));if(affected){notify(s,p.status==='Deprecating'?'Policy migration required':p.status==='Retired'?'Capability suspended':'Policy lifecycle',`${p.policyKey} · ${p.status}`,pol!.sunset?`Sunset: ${pol!.sunset}`:pol!.changelog,c.teamId,c.productId,'capability',c.id);if(pol!.sunset)notify(s,'Policy sunset',p.policyKey,pol!.sunset,c.teamId,c.productId,'regulation',p.policyKey)}}refreshHealth(s);break}
 case 'create_initiative':{role(actor,'Product Owner');workspaceScope(s,actor,p.teamId,p.productId);const id=uid('initiative');s.initiatives.push({id,teamId:p.teamId,productId:p.productId,name:required(p.name,'Initiative'),description:p.description||'',taskIds:[]});result={id};break}
 case 'task_initiative':{role(actor,'Product Owner');const task=get(s.tasks,p.taskId,'Task');teamAccess(actor,task.teamId);if(p.initiativeId){const initiative=get(s.initiatives,p.initiativeId,'Initiative');must(initiative.teamId===task.teamId&&initiative.productId===task.productId,'Инициатива не относится к доске и команде задачи.');}task.initiativeId=p.initiativeId||undefined;break}
 default:throw new DomainError('Неизвестное действие.');}
 s.revision=source.revision+1;s.audit.push({id:uid('audit'),action,actor:actor.id,identity,time:now,scope:{teamId:p.teamId||cap?.teamId||run?.teamId,productId:p.productId||cap?.productId||run?.productId},ref:result?.id||p.runId||p.capabilityId});return{state:s,result}}
