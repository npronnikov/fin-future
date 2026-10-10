import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as d from '../lib/domain.ts';
import * as e from '../lib/engine.ts';
import * as c from '../lib/context-supply.ts';
const act=(s,who,action,p={})=>e.applyAction(s,s.people.find(x=>x.id===who),action,{teamId:'growth',productId:'accreditive',...p},'test-owner').state;
const decision=(s,id,kind,more={})=>{const r=s.runs.find(r=>r.id===id),g=r.gates.at(-1);return act(s,'engineer','gate_decision',{runId:id,gateId:g.id,gateRevision:g.revision,artifactRevision:g.artifactRevision,decision:kind,...more})};
const depId='cap-dep';
function migration(){let s=d.createSeed();s=act(s,'engineer','clone_release',{capabilityId:depId});const cfg=d.copy(s.capabilities[0].draft);cfg.policies=cfg.policies.map(x=>x==='IS-corporate-backend@7'?'IS-corporate-backend@8':x);s=act(s,'engineer','save_config',{capabilityId:depId,expectedRevision:1,config:cfg});return s}
function frozen(){let s=migration();s=act(s,'engineer','freeze_release',{capabilityId:depId});return s}
test('demo has nine-domain separation, exact mixed backlog and both SDD/non-SDD flows linked by tag',()=>{const s=d.createSeed();assert.equal(s.tasks.length,12);assert.equal(s.teams[0].spaceId,'space-trade-finance');assert.equal(s.teams[0].environment.status,'ready');assert.equal(s.people.filter(p=>p.role!=='Regulator').length,3);assert.equal(s.capabilities[1].draft.mode,'SDD');assert.equal(s.capabilities[0].releases[0].snapshot.config.mode,'non-SDD')});
test('stored original demo migrates to Accreditive without losing execution history',()=>{
 const old=d.createSeed(),history=old.runs.length;
 old.products[0]={...old.products[0],id:'savings',name:'Копилка',description:'Legacy demo'};
 old.teams=old.teams.filter(team=>team.id==='growth');old.teams[0].name='Growth';old.teams[0].spaceId='space-growth';old.teams[0].environment.name='Growth Sandbox';
 old.boards=old.boards.filter(board=>board.teamId==='growth').map(board=>({...board,id:'board-savings',productId:'savings',name:'Копилка'}));
 for(const task of old.tasks){task.productId='savings';task.boardId='board-savings';task.repo=task.repo==='bank/lc-trade-api'?'bank/savings-api':'bank/savings-web';}
 for(const capability of old.capabilities)capability.productId='savings';for(const run of old.runs)run.productId='savings';
 old.knowledge=[{id:'pk-1',productId:'savings',layer:'Product',title:'Копилка · Product Knowledge',content:'Копилка',status:'approved',version:1,author:'po'}];old.conceptCategories=[];old.concepts=[];
 old.policies.push({...d.copy(old.policies.find(policy=>policy.id==='IS-corporate-backend'&&policy.version===8)),version:1,changelog:'Демонстрационный пакет политик для corporate.backend.'});
 const migrated=d.migrateState(old).state;
 assert.equal(migrated.products[0].id,'accreditive');assert.equal(migrated.products[0].name,'Аккредитив');assert.equal(migrated.runs.length,history);
 assert.ok(migrated.teams.some(team=>team.id==='retail-lc'));assert.ok(migrated.boards.some(board=>board.id==='board-lc-retail'));
 assert.ok(migrated.tasks.every(task=>task.productId==='accreditive'&&!task.repo.includes('savings')));assert.ok(migrated.knowledge.some(item=>item.id==='pk-lc-foundation'));
 assert.ok(!migrated.policies.some(policy=>policy.id==='IS-corporate-backend'&&policy.version===1));assert.equal(d.migrateState(migrated).changed,false);
});
test('Flow must use an existing task tag, without a Task Class entity',()=>{const s=d.createSeed();assert.equal('classes' in s,false);assert.ok(s.capabilities.every(cap=>cap.tag&&!('classId' in cap)));assert.ok(s.tasks.every(task=>s.boards.some(project=>project.id===task.boardId)));assert.throws(()=>act(s,'engineer','create_capability',{tag:'arbitrary',name:'x'}),/существующий тег/)});
test('Product Engineer cannot grant repository write access',()=>{assert.throws(()=>act(d.createSeed(),'engineer','save_binding',{type:'Repository',name:'bank/lc-trade-api',read:'/**',write:'/**'}),/Platform Engineer/)});
test('new Product and Team stay empty until explicit project and mock-task creation',()=>{
 let s=act(d.createSeed(),'po','create_product',{name:'Карты',description:'Product'});const productId=s.products.at(-1).id;
 assert.equal(s.products.at(-1).knowledgeVersion,1);
 s=act(s,'po','create_team',{productId,name:'Team',scope:'Activation'});const teamId=s.teams.at(-1).id;
 assert.ok(s.teams.at(-1).spaceId);assert.equal(s.teams.at(-1).environment.status,'not_configured');
 s=act(s,'po','add_person',{teamId,productId,personId:'platform',role:'Platform Engineer'});
 s=act(s,'platform','save_binding',{teamId,productId,type:'Task Tracker',name:'Task Tracker'});
 assert.equal(s.tasks.filter(task=>task.teamId===teamId&&task.productId===productId).length,0);
 s=act(s,'platform','save_binding',{teamId,productId,type:'Repository',name:'bank/lc-trade-api',read:'/**',write:'/pom.xml'});
 s=act(s,'po','create_project',{teamId,productId,name:'Новый проект'});const projectId=s.boards.at(-1).id;
 s=act(s,'po','add_mock_tasks',{teamId,productId,projectId,template:'mixed'});
 const tasks=s.tasks.filter(task=>task.boardId===projectId);
 assert.equal(tasks.length,12);assert.ok(tasks.every(task=>task.mock&&task.status==='backlog'&&task.repo==='bank/lc-trade-api'));
 assert.equal(new Set(s.tasks.map(task=>task.id)).size,s.tasks.length);
});
test('chat text cannot approve Gate or release Capability',()=>{let s=d.createSeed();const before=JSON.stringify(s.runs.find(r=>r.id==='RUN-912').gates);s=act(s,'engineer','message',{thread:'RUN-912',text:'согласен, выпусти capability'});assert.equal(JSON.stringify(s.runs.find(r=>r.id==='RUN-912').gates),before);assert.equal(s.capabilities[0].releases.length,1)});
test('Human Input affects actual manifest and does not count as Approval',()=>{const s=decision(d.createSeed(),'RUN-912','input',{value:'2.17.3'}),r=s.runs.find(r=>r.id==='RUN-912');assert.equal(r.metrics.input,1);assert.equal(r.metrics.approval,0);assert.equal(r.artifacts.manifest,'jackson-databind 2.17.3');assert.equal(r.gates.at(-1).type,'approval')});
test('stale Gate revision is rejected without corrupting state',()=>{let s=d.createSeed();const g=s.runs.find(r=>r.id==='RUN-912').gates[0];s=decision(s,'RUN-912','input',{value:'2.17.4'});assert.throws(()=>act(s,'engineer','gate_decision',{runId:'RUN-912',gateId:g.id,gateRevision:g.revision,artifactRevision:g.artifactRevision,decision:'input',value:'2.17.3'}),/устарела/)});
test('Rework preserves Task, Run, earlier decision, artifacts and new approval',()=>{let s=decision(d.createSeed(),'RUN-912','input',{value:'2.17.3'});const before=s.runs.find(r=>r.id==='RUN-912');const oldDiff=before.artifacts.diff;s=decision(s,'RUN-912','rework',{comment:'Не меняй retry logic.',returnTo:'Implementation'});const r=s.runs.find(r=>r.id==='RUN-912');assert.equal(r.taskId,before.taskId);assert.equal(r.attempt,2);assert.equal(r.attempts[0].artifacts.diff,oldDiff);assert.equal(r.gates.at(-2).status,'rework_requested');assert.equal(r.gates.at(-1).status,'pending');assert.notEqual(r.gates.at(-2).artifactRevision,r.gates.at(-1).artifactRevision)});
test('SDD Rework keeps the approved Specification through implementation',()=>{let s=decision(d.createSeed(),'RUN-913','rework',{comment:'Уточнить период в Specification',returnTo:'Specification'});s=decision(s,'RUN-913','approve');const r=s.runs.find(r=>r.id==='RUN-913');assert.match(r.artifacts.specification,/Уточнить период/);assert.equal(r.gates.at(-1).phase,'Result')});
test('Takeover keeps exactly one writer, persists human artifact through final Approval',()=>{let s=decision(d.createSeed(),'RUN-912','takeover',{comment:'Исправлю проект в IDE.'});let r=s.runs.find(r=>r.id==='RUN-912');assert.equal(r.writer,'human');const text='--- a/pom.xml\n+++ b/pom.xml\n+ <version>2.17.3</version>\n+ <!-- human change -->';s=act(s,'engineer','workspace_save',{runId:r.id,content:text});assert.throws(()=>act(s,'engineer','return_control',{runId:r.id}),/Комментарий/);s=act(s,'engineer','return_control',{runId:r.id,comment:'Изменения в IDE завершены.'});assert.equal(s.runs.find(x=>x.id===r.id).writer,'none');s=decision(s,r.id,'approve');r=s.runs.find(x=>x.id===r.id);assert.equal(r.artifacts.diff,text);assert.equal(r.artifacts.tests,'IDE return verification · demo PASS');assert.equal(r.status,'accepted')});
test('Takeover at Specification resumes Specification Approval before implementation',()=>{let s=decision(d.createSeed(),'RUN-913','takeover',{comment:'Исправлю проект в IDE.'});s=act(s,'engineer','workspace_save',{runId:'RUN-913',content:'Human Specification'});s=act(s,'engineer','return_control',{runId:'RUN-913',comment:'Спецификация исправлена в IDE.'});let r=s.runs.find(r=>r.id==='RUN-913');assert.equal(r.gates.at(-1).phase,'Specification');s=decision(s,r.id,'approve');r=s.runs.find(r=>r.id==='RUN-913');assert.equal(r.artifacts.specification,'Human Specification');assert.equal(r.gates.at(-1).phase,'Result')});
test('Regulatory Plan derives obligations only from frozen Policy Packages',()=>{const s=d.createSeed(),cap=s.capabilities[0],cfg=d.copy(cap.releases[0].snapshot.config);cfg.policies=['IS-corporate-backend@7'];const r=d.makeRun(s,cap,cfg,s.tasks[0],'check',new Date().toISOString());r.plans.push(d.makePlan(r));assert.deepEqual(r.plans[0].applicable.map(x=>x.requirement),['SEC-DEP-014@3'])});
test('editing Draft cannot change an in-flight execution snapshot',()=>{let s=d.createSeed();const r=s.runs.find(r=>r.id==='RUN-913');const saved=JSON.stringify(r.snapshot);const cfg=d.copy(s.capabilities[1].draft);cfg.instructions+=' New instruction';s=act(s,'engineer','save_config',{capabilityId:'cap-statement',expectedRevision:1,config:cfg});assert.equal(JSON.stringify(s.runs.find(r=>r.id==='RUN-913').snapshot),saved)});
test('release requires history from exact current runtime and bindings',()=>{let s=d.createSeed();s.teams[0].environment.runtimeVersion='2.0';assert.throws(()=>act(s,'engineer','freeze_release',{capabilityId:'cap-statement'}),/история запусков/);s=migration();s.teams[0].environment.runtimeVersion='2.0';assert.throws(()=>act(s,'engineer','freeze_release',{capabilityId:depId}),/история запусков/)});
test('policy migration can freeze with baseline history without a Benchmark',()=>{const s=frozen(),r=s.capabilities[0].releases[0];assert.equal(r.stage,'frozen');assert.equal(r.snapshot.benchmarkRefs.length,0);assert.equal(r.snapshot.baselineReleaseId,'REL-DEP-1.4');assert.equal(r.snapshot.historyRefs.length,0)});
test('Benchmark receives no Golden in execution input and never admits capability',()=>{let s=d.createSeed();s=act(s,'engineer','benchmark',{capabilityId:depId,suiteId:'dep-update-suite',suiteVersion:3,releaseId:'REL-DEP-1.4'});const b=s.benchmarks[0];assert.ok(b.reports.every(r=>!JSON.stringify(r.runtimeInput).includes('93f20a')));assert.ok(b.reports.every(r=>r.judgeInput.goldenRevision==='93f20a'));assert.equal(s.capabilities[0].releases.length,1);assert.equal(b.passed,2)});
test('Benchmark selected release preserves released environment rather than current Team',()=>{let s=d.createSeed();s.teams[0].environment.runtimeVersion='2.0';s=act(s,'engineer','benchmark',{capabilityId:depId,suiteId:'dep-update-suite',suiteVersion:3,releaseId:'REL-DEP-1.4'});assert.equal(s.benchmarks[0].snapshot.runtimeVersion,'1.0');assert.equal(s.benchmarks[0].snapshot.id,'SNAP-DEP-1.4')});
test('UAT executes the exact SDD frozen graph automatically without gates or task status changes',()=>{
 let s=d.createSeed();s=act(s,'engineer','freeze_release',{capabilityId:'cap-statement'});
 const release=s.capabilities[1].releases[0],frozenSnapshot=JSON.stringify(release.snapshot),tasks=JSON.stringify(s.tasks),notifications=s.notifications.length;
 s=act(s,'engineer','run_uat',{capabilityId:'cap-statement',releaseId:release.id});
 const saved=s.capabilities[1].releases[0],run=s.runs.find(run=>run.id===saved.uat.runId);
 assert.equal(saved.stage,'uat_passed');assert.equal(run.status,'accepted');assert.equal(run.gates.length,0);
 assert.equal(JSON.stringify(run.snapshot),frozenSnapshot);assert.equal(JSON.stringify(saved.snapshot),frozenSnapshot);assert.equal(JSON.stringify(s.tasks),tasks);
 assert.equal(run.metrics.approval,0);assert.equal(run.metrics.input,0);assert.ok(run.execution.flow.trace.some(node=>node.type==='approval'&&node.status==='bypassed_uat'));
 assert.equal(saved.uat.report.tests.passed,148);assert.equal(s.notifications.length,notifications+1);
});
test('risk rejection blocks promotion',()=>{let s=frozen();const id=s.capabilities[0].releases[0].id;s=act(s,'engineer','run_uat',{capabilityId:depId,releaseId:id});s=act(s,'po','risk_decision',{capabilityId:depId,releaseId:id,accepted:false,comment:'Риск отклонён.'});assert.throws(()=>act(s,'engineer','promote',{capabilityId:depId,releaseId:id}),/UAT/)});
test('release without Benchmark succeeds after same-snapshot UAT and explicit risk acceptance',()=>{let s=frozen();const id=s.capabilities[0].releases[0].id,snapshot=JSON.stringify(s.capabilities[0].releases[0].snapshot);s=act(s,'engineer','run_uat',{capabilityId:depId,releaseId:id});s=act(s,'po','risk_decision',{capabilityId:depId,releaseId:id,accepted:true,acknowledgements:d.releaseRiskAssessment(s,s.capabilities[0].releases[0]).risks.map(risk=>risk.id),comment:'Риск принят в указанном scope.'});s=act(s,'engineer','promote',{capabilityId:depId,releaseId:id});assert.equal(s.capabilities[0].releases[0].stage,'production');assert.equal(s.capabilities[0].releases[1].status,'superseded');assert.equal(JSON.stringify(s.capabilities[0].releases[0].snapshot),snapshot);assert.equal(s.capabilities[0].releases[1].snapshot.config.policies[0],'IS-corporate-backend@7')});
test('Production Run uses released snapshot despite newer Draft',()=>{let s=d.createSeed();s=act(s,'engineer','clone_release',{capabilityId:depId});const cfg=d.copy(s.capabilities[0].draft);cfg.instructions='New draft instructions';s=act(s,'engineer','save_config',{capabilityId:depId,expectedRevision:1,config:cfg});s=act(s,'engineer','start_run',{capabilityId:depId,taskId:'BANK-1857',mode:'production'});assert.equal(s.runs.at(-1).snapshot.id,'SNAP-DEP-1.4');assert.notEqual(s.runs.at(-1).snapshot.config.instructions,cfg.instructions)});
test('current Platform grants cannot be bypassed by an older release',()=>{const s=d.createSeed();s.teams[0].bindings[0].write='';assert.throws(()=>act(s,'engineer','start_run',{capabilityId:depId,taskId:'BANK-1857',mode:'production'}),/grants/)});
test('retired policy suspends capability and stops new autonomous runs',()=>{const s=act(d.createSeed(),'regulator','policy_status',{policyKey:'IS-corporate-backend@7',status:'Retired'});assert.equal(s.capabilities[0].releases[0].status,'suspended');assert.throws(()=>act(s,'engineer','start_run',{capabilityId:depId,taskId:'BANK-1857',mode:'production'}),/запрещён/);assert.ok(s.runs.length>0);assert.equal(s.capabilities[0].releases[0].snapshot.config.policies[0],'IS-corporate-backend@7')});
test('Run history is never automatically published as Knowledge',()=>{let s=d.createSeed();const count=s.knowledge.length;s=decision(s,'RUN-912','input',{value:'2.17.4'});s=decision(s,'RUN-912','approve');assert.equal(s.knowledge.length,count)});

test('Model Gateway is runtime configuration, not a required or writable Resource Binding',()=>{
 let s=d.createSeed();
 assert.ok(s.teams[0].bindings.every(binding=>binding.type!=='Model Gateway'));
 assert.equal(s.teams[0].environment.modelGateway,'Model Gateway');
 assert.throws(()=>act(s,'platform','save_binding',{type:'Model Gateway',name:'gateway'}),/тип Resource Binding/);
 s.teams[0].environment.status='configured';
 s=act(s,'platform','provision',{topologyConfirmed:true});
 assert.equal(s.teams[0].environment.status,'ready');
});

test('Kanban updates persist status and team assignee, and retagging preserves past execution tags',()=>{
 let s=d.createSeed();const history=JSON.stringify(s.runs);
 s=act(s,'po','update_task',{taskId:'BANK-1857',status:'todo',assigneeId:'platform',tag:'maintenance'});
 let task=s.tasks.find(task=>task.id==='BANK-1857');
 assert.equal(task.status,'todo');assert.equal(task.assigneeId,'platform');assert.equal(task.tag,'maintenance');
 assert.equal(JSON.stringify(s.runs),history);
 assert.ok(s.runs.filter(run=>run.taskId===task.id).every(run=>d.snapshotTag(run.snapshot)==='dep-update'));
 s=act(s,'engineer','update_task',{taskId:task.id,status:'review',assigneeId:''});
 task=s.tasks.find(item=>item.id===task.id);assert.equal(task.status,'review');assert.equal(task.assigneeId,undefined);
 s=act(s,'engineer','update_task',{taskId:task.id,status:'done'});
 assert.equal(s.tasks.find(item=>item.id===task.id).status,'done');
 assert.throws(()=>act(s,'engineer','update_task',{taskId:task.id,status:'invented'}),/колонка Kanban/);
 assert.throws(()=>act(s,'engineer','update_task',{taskId:task.id,assigneeId:'regulator'}),/участником команды/);
});

test('an active Run owns task status and tag; task reassignment does not move its frozen Gate',()=>{
 let s=d.createSeed();const frozen=JSON.stringify(s.runs.find(run=>run.id==='RUN-912'));
 assert.throws(()=>act(s,'po','update_task',{taskId:'BANK-1842',status:'done'}),/активным запуском/);
 assert.throws(()=>act(s,'engineer','update_task',{taskId:'BANK-1842',tag:'new-tag'}),/активного запуска/);
 s=act(s,'po','update_task',{taskId:'BANK-1842',assigneeId:'platform'});
 assert.equal(s.tasks.find(task=>task.id==='BANK-1842').assigneeId,'platform');
 assert.equal(JSON.stringify(s.runs.find(run=>run.id==='RUN-912')),frozen);
});

test('project, mock-task and Kanban actions enforce roles and Product/Team scope',()=>{
 let s=d.createSeed();
 assert.throws(()=>act(s,'platform','create_project',{name:'Denied'}),/Product Owner, Product Engineer/);
 s=act(s,'po','create_product',{name:'Другой продукт',description:'Изолированный scope'});const productId=s.products.at(-1).id;
 assert.throws(()=>act(s,'engineer','create_project',{productId,name:'Denied'}),/не связана/);
 assert.throws(()=>act(s,'engineer','add_mock_tasks',{productId,boardId:s.boards[0].id}),/выбранному Product/);
 assert.throws(()=>act(s,'po','update_task',{productId,taskId:'BANK-1857',status:'todo'}),/выбранному Product/);
 assert.throws(()=>act(s,'engineer','add_mock_tasks',{boardId:s.boards[0].id,assigneeId:'regulator'}),/участником команды/);
 assert.throws(()=>act(s,'engineer','add_mock_tasks',{boardId:s.boards[0].id,count:100}),/Количество моков/);
 assert.throws(()=>act(s,'engineer','create_capability',{productId,tag:'telemetry'}),/не связана/);
});

test('new projects reuse a Flow by task tag without creating a second entity or Flow',()=>{
 let s=act(d.createSeed(),'engineer','create_project',{name:'Новая поставка'});const projectId=s.boards.at(-1).id;
 s=act(s,'engineer','add_mock_tasks',{projectId,template:'dep-update',count:4,assigneeId:'engineer'});
 const task=s.tasks.find(item=>item.boardId===projectId);
 assert.equal(task.tag,'dep-update');assert.equal(task.assigneeId,'engineer');assert.equal(s.capabilities.length,2);
 assert.throws(()=>act(s,'engineer','create_capability',{tag:'dep-update'}),/уже существует/);
 s=act(s,'engineer','start_run',{taskId:task.id,capabilityId:'cap-dep',mode:'production'});
 assert.equal(d.snapshotTag(s.runs.at(-1).snapshot),'dep-update');
 assert.equal(s.runs.at(-1).snapshot.id,'SNAP-DEP-1.4');
});

test('all Flow choices support existing tags and safe customization without overriding protected configuration',()=>{
 for(const template of d.FLOW_TEMPLATES){
  const s=act(d.createSeed(),'engineer','create_capability',{tag:'telemetry',name:'Новый Flow',template,config:{instructions:'Только заданный scope.',version:'99.0',revision:999,runtime:'AI Manager'}});
  const capability=s.capabilities.at(-1),cfg=capability.draft;
  assert.equal(capability.tag,'telemetry');assert.equal(cfg.template,template);assert.equal(cfg.instructions,'Только заданный scope.');
  assert.equal(cfg.version,'1.0');assert.equal(cfg.revision,1);assert.equal(cfg.runtime,'HG SDLC');assert.equal(capability.releases.length,0);
  assert.equal(cfg.mode,template==='sdd-statements@1'?'SDD':'non-SDD');
 }
 assert.throws(()=>act(d.createSeed(),'engineer','create_capability',{tag:'telemetry',template:'invented'}),/шаблон Flow/);
 assert.throws(()=>act(d.createSeed(),'engineer','create_capability',{tag:'telemetry',template:'custom',config:{scope:'/**'}}),/grants/);
 assert.throws(()=>act(d.createSeed(),'engineer','create_capability',{tag:'telemetry',template:'custom',config:{gateAssignee:'regulator'}}),/участником команды/);
});

test('Test Suites are scoped by tag and reject cases from a different tag',()=>{
 let s=d.createSeed();const task=s.tasks[0];
 const payload={name:'Tag suite',tag:task.tag,cases:[{taskId:task.id,pr:task.pr,base:task.base,golden:task.golden,confirmed:true}],judgeId:'dependency-judge@1'};
 s=act(s,'engineer','save_suite',payload);const suite=s.suites.at(-1);
 assert.equal(suite.tag,'dep-update');assert.equal(suite.teamId,'growth');assert.equal(suite.productId,'accreditive');assert.equal('classId' in suite,false);
 assert.throws(()=>act(s,'engineer','save_suite',{...payload,tag:'statement-doc'}),/тегу или scope/);
 assert.throws(()=>act(s,'engineer','benchmark',{capabilityId:'cap-statement',suiteId:suite.id,suiteVersion:suite.version}),/тега и scope/);
});

function legacyState(){
 const state=d.createSeed();
 state.classes=state.capabilities.map(cap=>({id:`class-${cap.tag}`,name:cap.name,description:'Legacy class',tag:cap.tag,teamId:cap.teamId,productId:cap.productId}));
 const gateway={id:'legacy-gateway',type:'Model Gateway',name:'Model Gateway',read:'',write:'',createPr:false,merge:false,status:'connected'};
 for(const team of state.teams)team.bindings.push(d.copy(gateway));
 const snapshots=[...state.capabilities.flatMap(cap=>cap.releases.map(release=>release.snapshot)),...state.runs.map(run=>run.snapshot)];
 for(const snapshot of snapshots){
  snapshot.taskClass=d.copy(state.classes.find(item=>item.tag===snapshot.tag));delete snapshot.tag;
  snapshot.bindings.push(d.copy(gateway));
  for(const policy of snapshot.policyPackages)for(const rule of policy.applicability)if(rule.tag!==undefined){rule.taskClass=rule.tag;delete rule.tag;}
 }
 for(const cap of state.capabilities){cap.classId=state.classes.find(item=>item.tag===cap.tag).id;delete cap.tag;}
 for(const suite of state.suites){suite.classId=state.classes.find(item=>item.tag===suite.tag).id;delete suite.tag;delete suite.teamId;delete suite.productId;}
 for(const policy of state.policies)for(const rule of policy.applicability)if(rule.tag!==undefined){rule.taskClass=rule.tag;delete rule.tag;}
 delete state.boards;for(const task of state.tasks)delete task.boardId;
 return state;
}

test('legacy workspace migration removes Task Class bindings while preserving every frozen snapshot byte-for-byte',()=>{
 const legacy=legacyState(),before=JSON.stringify(legacy);
 const history=JSON.stringify(legacy.runs.map(run=>run.snapshot));
 const releases=JSON.stringify(legacy.capabilities.flatMap(cap=>cap.releases.map(release=>release.snapshot)));
 const {state,changed}=d.migrateState(legacy);
 assert.equal(changed,true);assert.equal(JSON.stringify(legacy),before);
 assert.equal('classes' in state,false);assert.ok(state.capabilities.every(cap=>cap.tag&&!('classId' in cap)));
 assert.equal(state.suites[0].tag,'dep-update');assert.equal(state.suites[0].productId,'accreditive');
 assert.equal(state.boards.length,1);assert.ok(state.tasks.every(task=>task.boardId===state.boards[0].id));
 assert.ok(state.teams[0].bindings.every(binding=>binding.type!=='Model Gateway'));
 assert.equal(JSON.stringify(state.runs.map(run=>run.snapshot)),history);
 assert.equal(JSON.stringify(state.capabilities.flatMap(cap=>cap.releases.map(release=>release.snapshot))),releases);
 assert.ok(state.runs.every(run=>d.snapshotTag(run.snapshot)));
 assert.equal(state.policies[0].applicability[0].tag,'dep-update');
 assert.equal(state.runs[0].snapshot.policyPackages[0].applicability[0].taskClass,'dep-update');
 assert.equal(d.migrateState(state).changed,false);assert.equal(d.migrateState(d.createEmptyState()).changed,false);
});

test('legacy snapshots still support policy migration and released execution after binding cleanup',()=>{
 let s=d.migrateState(legacyState()).state;
 const plan=d.makePlan(s.runs[0]);assert.ok(plan.applicable.some(item=>item.requirement==='SEC-DEP-014@3'));
 s=act(s,'engineer','clone_release',{capabilityId:depId});const cfg=d.copy(s.capabilities[0].draft);
 cfg.policies=cfg.policies.map(key=>key==='IS-corporate-backend@7'?'IS-corporate-backend@8':key);
 s=act(s,'engineer','save_config',{capabilityId:depId,expectedRevision:1,config:cfg});
 s=act(s,'engineer','freeze_release',{capabilityId:depId});
 assert.equal(s.capabilities[0].releases[0].snapshot.baselineReleaseId,'REL-DEP-1.4');
 assert.equal(s.capabilities[0].releases[0].snapshot.tag,'dep-update');
 s=act(s,'engineer','start_run',{capabilityId:depId,taskId:'BANK-1857',mode:'production'});
 assert.equal(d.snapshotTag(s.runs.at(-1).snapshot),'dep-update');
 assert.equal(s.runs.at(-1).snapshot.id,'SNAP-DEP-1.4');
});

function configuredDraft(tag='dep-update',edit=()=>{}){
 let state=d.createSeed();const id=tag==='dep-update'?'cap-dep':'cap-statement';
 if(tag==='dep-update')state=act(state,'engineer','clone_release',{capabilityId:id});
 const cap=state.capabilities.find(cap=>cap.id===id),cfg=d.copy(cap.draft);
 cfg.nodeConfigs=d.getFlowNodes(cfg);edit(cfg);
 state=act(state,'engineer','save_config',{capabilityId:id,expectedRevision:cap.draft.revision,config:cfg});
 return {state,id};
}
function startConfigured(state,id,taskId='BANK-1857',mode='supervised'){
 state=act(state,'engineer','start_run',{capabilityId:id,taskId,mode});
 return {state,runId:state.runs.at(-1).id};
}

test('Flow node defaults read legacy snapshots without modifying them',()=>{
 const s=d.createSeed(),snapshot=s.capabilities[0].releases[0].snapshot,before=JSON.stringify(snapshot);
 const nodes=d.getFlowNodes(snapshot.config);
 assert.equal(JSON.stringify(snapshot),before);assert.equal(snapshot.config.nodeConfigs,undefined);
 assert.deepEqual(nodes.map(node=>node.type),['analysis','implementation','checks','result']);
 assert.ok(nodes.every(node=>node.id&&node.revision===1));
 nodes[0].instructions='Edited locally';nodes[0].skills.push('invented@1');
 assert.equal(JSON.stringify(snapshot),before);
 assert.deepEqual(d.getFlowNodes(snapshot.config).map(node=>node.id),['node-1','node-2','node-3','node-4']);
});

test('Flow node settings follow stable ids through rename, reorder and removal with server controlled revisions',()=>{
 let {state:s,id}=configuredDraft();let cap=s.capabilities.find(cap=>cap.id===id),cfg=d.copy(cap.draft);
 const extra=d.createFlowNode('custom','custom-audit',cfg);extra.name='Проверка контракта';extra.instructions='Проверить контракт API.';extra.skills=['dependency-review@5'];extra.revision=999;
 cfg.nodeConfigs.splice(1,0,extra);cfg.nodeConfigs[0].name='Анализ задачи';cfg.nodeConfigs[0].revision=999;
 s=act(s,'engineer','save_config',{capabilityId:id,expectedRevision:cap.draft.revision,config:cfg});
 cap=s.capabilities.find(cap=>cap.id===id);let saved=cap.draft.nodeConfigs;
 assert.equal(saved[0].revision,2);assert.equal(saved[1].revision,1);assert.deepEqual(cap.draft.nodes,saved.map(node=>node.name));
 const oldById=Object.fromEntries(saved.map(node=>[node.id,JSON.stringify(node)]));
 cfg=d.copy(cap.draft);[cfg.nodeConfigs[0],cfg.nodeConfigs[1]]=[cfg.nodeConfigs[1],cfg.nodeConfigs[0]];
 s=act(s,'engineer','save_config',{capabilityId:id,expectedRevision:cap.draft.revision,config:cfg});
 cap=s.capabilities.find(cap=>cap.id===id);
 assert.ok(cap.draft.nodeConfigs.every(node=>JSON.stringify(node)===oldById[node.id]));
 cfg=d.copy(cap.draft);cfg.nodeConfigs=cfg.nodeConfigs.filter(node=>node.id!=='node-1');
 s=act(s,'engineer','save_config',{capabilityId:id,expectedRevision:cap.draft.revision,config:cfg});
 const preserved=s.capabilities.find(cap=>cap.id===id).draft.nodeConfigs.find(node=>node.id==='custom-audit');
 assert.equal(JSON.stringify(preserved),oldById['custom-audit']);assert.equal(preserved.skills[0],'dependency-review@5');
});

test('Flow validates structure, exact skills, agent instructions and executor bindings on the server',()=>{
 const {state:s,id}=configuredDraft();const cap=s.capabilities.find(cap=>cap.id===id);
 const rejected=(mutate,pattern)=>{const cfg=d.copy(cap.draft);mutate(cfg);assert.throws(()=>act(s,'engineer','save_config',{capabilityId:id,expectedRevision:cfg.revision,config:cfg}),pattern);};
 rejected(cfg=>cfg.nodeConfigs[0].id=cfg.nodeConfigs[1].id,/уникальный/);
 rejected(cfg=>cfg.nodeConfigs[0].instructions='  ',/инструкции/);
 rejected(cfg=>cfg.nodeConfigs[0].skills=['missing@4'],/Skill missing@4/);
 rejected(cfg=>cfg.nodeConfigs[0].executor='human',/Human Approval/);
 rejected(cfg=>cfg.nodeConfigs[0].executor='ci',/Coding-agent или Human/);
 rejected(cfg=>cfg.nodeConfigs[2].maxRetries=6,/от 0 до 5/);
 rejected(cfg=>cfg.nodeConfigs.reverse(),/Checks|Result/);
 rejected(cfg=>cfg.nodeConfigs=cfg.nodeConfigs.filter(node=>node.type!=='implementation'),/Implementation/);
 rejected(cfg=>cfg.nodeConfigs=[null],/объектом/);
 rejected(cfg=>cfg.scope='/**',/grants/);
 const noCi=d.copy(s);noCi.teams[0].bindings=noCi.teams[0].bindings.filter(binding=>binding.type!=='CI');
 assert.throws(()=>act(noCi,'engineer','start_run',{capabilityId:id,taskId:'BANK-1857'}),/подключите CI/);
 assert.throws(()=>act(s,'platform','save_config',{capabilityId:id,expectedRevision:cap.draft.revision,config:cap.draft}),/Product Engineer/);
});

test('configured execution follows renamed node order and records settings in frozen trace and evidence',()=>{
 let {state:s,id}=configuredDraft('dep-update',cfg=>{
  cfg.humanInput=false;cfg.humanApproval=false;
  const custom=d.createFlowNode('custom','api-contract',cfg);custom.name='API contract';custom.instructions='Сверить контракт API.';custom.input='Исходный контракт';custom.output='Отчёт по контракту';custom.rule='Не менять публичный API.';custom.criteria='Совместимость сохранена.';custom.skills=['code-diff-analysis@4'];
  cfg.nodeConfigs.splice(1,0,custom);cfg.nodeConfigs.find(node=>node.type==='implementation').name='Изменить зависимости';
  const check=cfg.nodeConfigs.find(node=>node.type==='checks');check.executor='agent';check.verification='local';check.maxRetries=3;
 });
 let started=startConfigured(s,id);s=started.state;let r=s.runs.find(run=>run.id===started.runId);
 assert.equal(r.gates.at(-1).phase,'Result');assert.equal(r.status,'approval_required');
 assert.deepEqual(r.execution.flow.trace.map(node=>node.nodeId),r.snapshot.config.nodeConfigs.map(node=>node.id));
 assert.equal(r.execution.flow.trace.find(node=>node.nodeId==='api-contract').instructions,'Сверить контракт API.');
 assert.equal(r.execution.flow.trace.find(node=>node.type==='checks').maxRetries,3);assert.match(r.artifacts.tests,/Local · Sandbox/);
 const snapshot=JSON.stringify(r.snapshot);
 const cap=s.capabilities.find(cap=>cap.id===id),changed=d.copy(cap.draft);changed.nodeConfigs[0].instructions+=' Новое условие.';
 s=act(s,'engineer','save_config',{capabilityId:id,expectedRevision:cap.draft.revision,config:changed});
 assert.equal(JSON.stringify(s.runs.find(run=>run.id===r.id).snapshot),snapshot);
 s=decision(s,r.id,'approve');r=s.runs.find(run=>run.id===r.id);
 assert.equal(r.status,'accepted');assert.equal(r.evidence.flow.demo,true);assert.equal(r.evidence.flow.trace.at(-1).status,'approved');
 assert.equal(r.evidence.flow.trace.find(node=>node.nodeId==='api-contract').rule,'Не менять публичный API.');
 assert.equal(s.tasks.find(task=>task.id===r.taskId).status,'done');
});

test('SDD node identity preserves mandatory Specification approval after rename and rework',()=>{
 let {state:s,id}=configuredDraft('statement-doc',cfg=>{cfg.humanApproval=false;cfg.nodeConfigs.find(node=>node.type==='specification').name='Спецификация решения';cfg.nodeConfigs.find(node=>node.type==='approval').name='Ревью решения';});
 let started=startConfigured(s,id,'BANK-2031');s=started.state;let r=s.runs.find(run=>run.id===started.runId);
 assert.equal(r.gates.at(-1).phase,'Specification');assert.equal(r.artifacts.diff,undefined);
 assert.ok(!r.execution.flow.trace.some(node=>node.type==='implementation'));
 s=decision(s,r.id,'rework',{comment:'Уточнить границы периода.',returnTo:'Checks'});r=s.runs.find(run=>run.id===r.id);
 assert.equal(r.gates.at(-1).phase,'Specification');assert.equal(r.artifacts.diff,undefined);assert.match(r.artifacts.specification,/Уточнить границы/);
 s=decision(s,r.id,'approve');r=s.runs.find(run=>run.id===r.id);
 assert.equal(r.gates.at(-1).phase,'Result');assert.ok(r.artifacts.diff);
 const firstImplementation=r.events.findIndex(event=>event.title==='Implementation started');const approval=r.events.findIndex(event=>event.title==='Human Approval received');
 assert.ok(firstImplementation>approval);
 s=decision(s,r.id,'rework',{comment:'Уточнить спецификацию ещё раз.',returnTo:'Specification'});r=s.runs.find(run=>run.id===r.id);
 assert.equal(r.gates.at(-1).phase,'Specification');assert.equal(r.execution.flow.specificationApproved,false);
 s=decision(s,r.id,'approve');s=decision(s,r.id,'approve');assert.equal(s.runs.find(run=>run.id===r.id).status,'accepted');
});

test('SDD graph cannot save an absent, automated or late Specification approval',()=>{
 const {state:s,id}=configuredDraft('statement-doc'),cap=s.capabilities.find(cap=>cap.id===id);
 const mutations=[cfg=>cfg.nodeConfigs=cfg.nodeConfigs.filter(node=>node.type!=='approval'),cfg=>cfg.nodeConfigs.find(node=>node.type==='approval').executor='agent',cfg=>{const [approval]=cfg.nodeConfigs.splice(2,1);cfg.nodeConfigs.splice(4,0,approval);}];
 for(const mutate of mutations){const cfg=d.copy(cap.draft);mutate(cfg);assert.throws(()=>act(s,'engineer','save_config',{capabilityId:id,expectedRevision:cfg.revision,config:cfg}),/SDD|Human Approval/);}
});

test('Rework at an early configured Approval cannot jump forward over the rejecting gate',()=>{
 let {state:s,id}=configuredDraft('dep-update',cfg=>{cfg.humanInput=false;const review=d.createFlowNode('approval','early-review',cfg);review.name='Specification';cfg.nodeConfigs.splice(1,0,review);});
 let started=startConfigured(s,id);s=started.state;let r=s.runs.find(run=>run.id===started.runId);
 assert.equal(r.gates.at(-1).phase,'Шаг: Specification');assert.equal(r.artifacts.diff,undefined);
 s=decision(s,r.id,'rework',{comment:'Уточнить анализ.',returnTo:'Checks'});r=s.runs.find(run=>run.id===r.id);
 assert.equal(r.gates.at(-1).nodeId,'early-review');assert.equal(r.artifacts.diff,undefined);
 s=decision(s,r.id,'approve');r=s.runs.find(run=>run.id===r.id);assert.equal(r.gates.at(-1).phase,'Result');assert.ok(r.artifacts.diff);
});

test('Takeover from configured Input records comments and runs automatic checks after IDE return',()=>{
 let {state:s,id}=configuredDraft('dep-update',cfg=>{cfg.humanInput=true;});
 let started=startConfigured(s,id);s=started.state;let run=s.runs.find(run=>run.id===started.runId),frozen=JSON.stringify(run.snapshot);
 assert.equal(run.gates.at(-1).type,'input');s=decision(s,run.id,'takeover',{comment:'Исправлю зависимость в IDE.'});
 const content='--- a/pom.xml\n+++ b/pom.xml\n+ <version>2.17.3</version>\n+ <!-- controlled human edit -->';
 s=act(s,'engineer','workspace_save',{runId:run.id,content});
 assert.throws(()=>act(s,'engineer','return_control',{runId:run.id}),/Комментарий/);
 s=act(s,'engineer','return_control',{runId:run.id,comment:'Исправления готовы, возвращаю управление.'});
 run=s.runs.find(item=>item.id===run.id);
 assert.equal(run.gates.at(-1).phase,'Result');assert.equal(run.artifacts.diff,content);assert.match(run.artifacts.tests,/demo PASS/);
 assert.ok(run.execution.flow.trace.some(node=>node.type==='checks'&&node.artifactRevision===run.artifactRevision&&node.status==='completed'));
 assert.equal(run.execution.comments.length,2);assert.equal(run.execution.comments[0].kind,'takeover');assert.equal(run.execution.comments[1].kind,'return_control');
 s=decision(s,run.id,'approve');run=s.runs.find(item=>item.id===run.id);assert.equal(run.status,'accepted');assert.equal(run.artifacts.diff,content);assert.equal(JSON.stringify(run.snapshot),frozen);
 assert.deepEqual(run.evidence.flow.humanChecks,[]);
});

test('Takeover at a configured Specification keeps the specification gate and resumes saved node settings',()=>{
 let {state:s,id}=configuredDraft('statement-doc');let started=startConfigured(s,id,'BANK-2031');s=started.state;const runId=started.runId;
 s=decision(s,runId,'takeover',{comment:'Исправлю проект в IDE.'});s=act(s,'engineer','workspace_save',{runId,content:'Human Specification · explicit task boundary'});s=act(s,'engineer','return_control',{runId,comment:'Спецификация исправлена в IDE.'});
 let r=s.runs.find(run=>run.id===runId);assert.equal(r.gates.at(-1).phase,'Specification');assert.equal(r.artifacts.diff,undefined);
 s=decision(s,runId,'approve');r=s.runs.find(run=>run.id===runId);assert.equal(r.artifacts.specification,'Human Specification · explicit task boundary');assert.equal(r.gates.at(-1).phase,'Result');assert.ok(r.execution.flow.trace.some(node=>node.type==='checks'));
});

test('node configuration changes require fresh exact-history while UAT uses the frozen graph',()=>{
 let {state:s,id}=configuredDraft('dep-update',cfg=>{cfg.humanInput=false;cfg.humanApproval=false;});let started=startConfigured(s,id);s=decision(started.state,started.runId,'approve');
 s=act(s,'engineer','freeze_release',{capabilityId:id});let cap=s.capabilities.find(cap=>cap.id===id),release=cap.releases[0],frozen=JSON.stringify(release.snapshot);
 const cfg=d.copy(cap.draft);cfg.nodeConfigs.find(node=>node.type==='checks').criteria='Новый критерий без изменения предыдущего релиза.';
 s=act(s,'engineer','save_config',{capabilityId:id,expectedRevision:cfg.revision,config:cfg});
 assert.throws(()=>act(s,'engineer','freeze_release',{capabilityId:id}),/история запусков/);
 s=act(s,'engineer','run_uat',{capabilityId:id,releaseId:release.id});cap=s.capabilities.find(cap=>cap.id===id);release=cap.releases.find(item=>item.id===release.id);
 const uat=s.runs.find(run=>run.id===release.uat.runId);assert.equal(uat.status,'accepted');assert.equal(JSON.stringify(release.snapshot),frozen);assert.equal(uat.snapshot.id,release.snapshot.id);
 assert.notEqual(uat.execution.flow.trace.find(node=>node.type==='checks').criteria,cfg.nodeConfigs.find(node=>node.type==='checks').criteria);
 s=act(s,'po','risk_decision',{capabilityId:id,releaseId:release.id,accepted:true,acknowledgements:d.releaseRiskAssessment(s,release).risks.map(risk=>risk.id),comment:'Согласованный scope.'});s=act(s,'engineer','promote',{capabilityId:id,releaseId:release.id});
 s.teams[0].bindings=s.teams[0].bindings.filter(binding=>binding.type!=='CI');
 assert.throws(()=>act(s,'engineer','start_run',{capabilityId:id,taskId:'BANK-1924',mode:'production'}),/CI binding/);
});

test('Rework node choices use frozen work nodes and keep Specification rework before its approval',()=>{
 const cfg=d.defaultConfig('statement-doc');cfg.nodeConfigs=d.getFlowNodes(cfg);
 const extra=d.createFlowNode('custom','post-spec-note',cfg);cfg.nodeConfigs.splice(2,0,extra);
 const approval=cfg.nodeConfigs.find(node=>node.type==='approval'),before=JSON.stringify(cfg);
 const eligible=d.flowReworkNodes(cfg,approval.id);
 assert.deepEqual(eligible.map(node=>node.type),['specification']);
 assert.ok(!eligible.some(node=>node.id==='post-spec-note'));
 eligible[0].name='Local edit';assert.equal(JSON.stringify(cfg),before);
 assert.deepEqual(d.flowReworkNodes(cfg,'unknown'),[]);assert.deepEqual(d.flowReworkNodes(d.defaultConfig('dep-update'),'node-1'),[]);
 const result=d.flowReworkNodes(cfg,cfg.nodeConfigs.at(-1).id);assert.ok(result.every(node=>!['task','approval','result'].includes(node.type)));
});

test('Rework reruns all nodes on each attempt despite old partial-return fields and preserves the earlier trace',()=>{
 let {state:s,id}=configuredDraft('dep-update',cfg=>{
  cfg.humanInput=false;
  const custom=d.createFlowNode('custom','contract-audit',cfg);custom.name='Контракт';cfg.nodeConfigs.splice(1,0,custom);
  const implementation=d.createFlowNode('implementation','implementation-second',cfg);implementation.name='Реализация';cfg.nodeConfigs.find(node=>node.type==='implementation').name='Реализация';cfg.nodeConfigs.splice(3,0,implementation);
 });
 let started=startConfigured(s,id);s=started.state;const runId=started.runId;
 const before=s.runs.find(run=>run.id===runId),oldArtifacts=d.copy(before.artifacts),snapshot=JSON.stringify(before.snapshot),ids=before.snapshot.config.nodeConfigs.map(node=>node.id);
 s=decision(s,runId,'rework',{comment:'Доработать второй шаг реализации.',returnToNodeId:'implementation-second'});
 let run=s.runs.find(run=>run.id===runId),trace=run.execution.flow.trace.filter(node=>node.attempt===2);
 assert.deepEqual(trace.map(node=>node.nodeId),ids);assert.equal(run.attempts.at(-1).restart,'full');assert.equal(run.attempts.at(-1).returnTo,'Начало Flow');
 assert.equal(run.gates.at(-2).decision.restart,'full');assert.deepEqual(run.attempts[0].artifacts,oldArtifacts);
 const firstTrace=d.copy(run.execution.flow.trace.filter(node=>node.attempt===1));
 s=decision(s,runId,'rework',{comment:'Повторить custom audit.',returnToNodeId:'contract-audit'});
 run=s.runs.find(run=>run.id===runId);trace=run.execution.flow.trace.filter(node=>node.attempt===3);
 assert.deepEqual(trace.map(node=>node.nodeId),ids);assert.deepEqual(run.execution.flow.trace.filter(node=>node.attempt===1),firstTrace);
 assert.equal(run.gates.at(-1).phase,'Result');assert.equal(run.writer,'none');assert.equal(JSON.stringify(run.snapshot),snapshot);
 s=decision(s,runId,'approve');run=s.runs.find(run=>run.id===runId);assert.equal(run.evidence.flow.trace.length,ids.length*3);assert.equal(run.plans.length,3);
});

test('old unknown and forward Rework targets cannot skip an early gate and do not alter source state',()=>{
 let {state:s,id}=configuredDraft('dep-update',cfg=>{cfg.humanInput=false;cfg.nodeConfigs.splice(1,0,d.createFlowNode('approval','early-gate',cfg));});
 let started=startConfigured(s,id);s=started.state;const runId=started.runId,before=JSON.stringify(s);
 for(const nodeId of ['not-in-snapshot','node-2','node-3','node-4','early-gate']){
  const changed=decision(s,runId,'rework',{comment:'Весь сценарий сначала.',returnToNodeId:nodeId}),run=changed.runs.find(run=>run.id===runId);
  assert.deepEqual(run.execution.flow.trace.filter(node=>node.attempt===2).map(node=>node.nodeId),['node-1','early-gate']);
  assert.equal(run.gates.at(-1).nodeId,'early-gate');assert.equal(run.artifacts.diff,undefined);assert.equal(JSON.stringify(s),before);
 }
});

test('full SDD Rework restarts with Task and needs a new Specification approval before implementation',()=>{
 let {state:s,id}=configuredDraft('statement-doc',cfg=>{
  const analysis=d.createFlowNode('analysis','sdd-analysis',cfg);analysis.name='Разобрать период';cfg.nodeConfigs.splice(1,0,analysis);
  const annotation=d.createFlowNode('custom','after-spec',cfg);cfg.nodeConfigs.splice(3,0,annotation);
 });
 let started=startConfigured(s,id,'BANK-2031');s=started.state;const runId=started.runId;
 s=decision(s,runId,'rework',{comment:'Уточнить анализ периода.',returnToNodeId:'after-spec'});
 let run=s.runs.find(run=>run.id===runId),trace=run.execution.flow.trace.filter(node=>node.attempt===2);
 assert.equal(trace[0].nodeId,'node-1');assert.ok(trace.some(node=>node.nodeId==='sdd-analysis'));assert.ok(trace.some(node=>node.type==='specification'));
 assert.equal(run.gates.at(-1).phase,'Specification');assert.equal(run.artifacts.diff,undefined);assert.equal(run.execution.flow.specificationApproved,false);
 s=decision(s,runId,'approve');run=s.runs.find(run=>run.id===runId);assert.equal(run.gates.at(-1).phase,'Result');
});

test('an initial Approval without earlier work can repeat via legacy fallback without a forward jump',()=>{
 let {state:s,id}=configuredDraft('dep-update',cfg=>{cfg.humanInput=false;cfg.nodeConfigs.unshift(d.createFlowNode('approval','initial-gate',cfg));});
 let started=startConfigured(s,id);s=started.state;const runId=started.runId;
 let r=s.runs.find(run=>run.id===runId);assert.deepEqual(d.flowReworkNodes(r.snapshot.config,r.gates.at(-1).nodeId),[]);
 s=decision(s,runId,'rework',{comment:'Повторить входное согласование.',returnTo:'Implementation'});r=s.runs.find(run=>run.id===runId);
 assert.equal(r.gates.at(-1).nodeId,'initial-gate');assert.equal(r.artifacts.diff,undefined);assert.equal(r.attempt,2);
});

function sharedProductWorkspace() {
 const s=d.createSeed(),team=d.copy(s.teams[0]);
 Object.assign(team,{id:'delivery',name:'Delivery',spaceId:'space-delivery',people:['delivery-engineer']});
 team.bindings=team.bindings.map(binding=>({...binding,id:`delivery-${binding.id}`}));
 s.teams.push(team);
 s.people.push({id:'delivery-engineer',name:'Delivery Engineer',role:'Product Engineer',assignments:['capability.review','knowledge.contribute'],teams:['delivery']});
 s.responsibilities.push({productId:'accreditive',teamId:'delivery',scope:['Delivery']});
 s.boards.push({id:'board-delivery',productId:'accreditive',teamId:'delivery',name:'Delivery board',description:'Private tasks'});
 s.tasks.push({...d.copy(s.tasks[1]),id:'DELIVERY-1',externalId:'DELIVERY-1',teamId:'delivery',boardId:'board-delivery',title:'Private delivery dependency update',status:'todo',assigneeId:'delivery-engineer'});
 return s;
}

test('boards are canonical; old project IDs and all frozen history migrate once without rewriting snapshots',()=>{
 const legacy=d.createSeed();
 legacy.projects=d.copy(legacy.boards);delete legacy.boards;
 for(const task of legacy.tasks){task.projectId=task.boardId;delete task.boardId;}
 const snapshots=state=>JSON.stringify([...state.runs.map(run=>run.snapshot),...state.capabilities.flatMap(cap=>cap.releases.map(release=>release.snapshot))]);
 const before=snapshots(legacy),migrated=d.migrateState(legacy);
 assert.ok(migrated.changed);assert.equal('projects' in migrated.state,false);
 assert.equal(migrated.state.boards[0].id,'board-accreditive');
 assert.ok(migrated.state.tasks.every(task=>task.boardId==='board-accreditive'&&!('projectId' in task)));
 assert.equal(snapshots(migrated.state),before);
 assert.equal(d.migrateState(migrated.state).changed,false);
 const created=e.applyAction(migrated.state,migrated.state.people[0],'create_board',{teamId:'growth',productId:'accreditive',name:'Second board'},'test');
 assert.ok(created.state.boards.some(board=>board.id===created.result.id));
});

test('Flow and versioned Subagents catalog, per-node attachment and economics persist with immutable run snapshots',()=>{
 let s=d.createSeed();
 assert.deepEqual(s.assets.filter(asset=>asset.type==='Flow').map(asset=>asset.schema.template),[...d.FLOW_TEMPLATES]);
 assert.equal(s.assets.filter(asset=>asset.type==='Subagents').length,3);
 const cap=s.capabilities.find(cap=>cap.id==='cap-statement'),cfg=d.copy(cap.draft);
 cfg.nodeConfigs=d.getFlowNodes(cfg);cfg.nodeConfigs.find(node=>node.type==='implementation').subagents=['implementation-agent@1'];
 cfg.description='Flow description';cfg.model='claude-sonnet';cfg.tokenLimit=250000;
 const old=JSON.stringify(s.runs.map(run=>run.snapshot));
 s=act(s,'engineer','save_config',{capabilityId:cap.id,name:'Проверенный Flow',expectedRevision:1,config:cfg});
 assert.equal(s.capabilities.find(item=>item.id==='cap-statement').name,'Проверенный Flow');
 assert.equal(s.capabilities[1].draft.tokenLimit,250000);
 assert.equal(s.capabilities[1].draft.description,'Flow description');
 assert.equal(d.estimateTokenCost('claude-sonnet',250000),60);
 assert.equal(JSON.stringify(s.runs.map(run=>run.snapshot)),old);
 const bad=d.copy(s.capabilities[1].draft);bad.nodeConfigs.find(node=>node.type==='implementation').subagents=['implementation-agent@999'];
 assert.throws(()=>act(s,'engineer','save_config',{capabilityId:'cap-statement',expectedRevision:bad.revision,config:bad}),/Subagent/);
 bad.nodeConfigs.find(node=>node.type==='implementation').subagents=[];bad.tokenLimit=0;
 assert.throws(()=>act(s,'engineer','save_config',{capabilityId:'cap-statement',expectedRevision:bad.revision,config:bad}),/Лимит токенов/);
});

test('Git Permissions derive grants, preserve unchanged legacy scope and require re-provision only on semantic change',()=>{
 let s=d.createSeed();const oldScope=s.teams[0].bindings[0].write;
 s=act(s,'platform','save_binding',{id:'repo-api',type:'Repository',name:'bank/lc-trade-api',permissions:['read','write','create_pr']});
 assert.equal(s.teams[0].bindings[0].write,oldScope);
 assert.equal(s.teams[0].environment.status,'ready');
 s=act(s,'platform','save_binding',{id:'repo-api',type:'Repository',name:'bank/lc-trade-api',permissions:['admin']});
 assert.equal(s.teams[0].bindings[0].write,'/**');assert.equal(s.teams[0].bindings[0].read,'/**');assert.equal(s.teams[0].bindings[0].createPr,true);
 assert.equal(s.teams[0].environment.status,'configured');assert.deepEqual(s.teams[0].environment.provisionSteps,[]);
 s=act(s,'platform','save_binding',{type:'Task Tracker',name:'Jira',scope:'KOPILKA'});
 assert.equal(s.teams[0].bindings.find(binding=>binding.name==='Jira').scope,'KOPILKA');
 s=act(s,'platform','save_binding',{type:'CI',name:'Jenkins CI',scope:'kopilka/build-and-test'});
 assert.equal(s.teams[0].bindings.find(binding=>binding.name==='Jenkins CI').scope,'kopilka/build-and-test');
 for(const type of ['Artifact Repository','Approved Connector','Secret'])assert.throws(()=>act(s,'platform','save_binding',{type,name:type}),/тип Resource Binding/);
 assert.throws(()=>act(s,'platform','save_binding',{type:'Repository',name:'bank/lc-trade-api',permissions:['owner']}),/Permissions/);
});

test('Product metric is optional and adding an existing participant can set Russian-labeled Permissions',()=>{
 let s=act(d.createSeed(),'po','create_product',{name:'Без метрик',description:'Описание',goals:'Цель'});
 assert.equal('metrics' in s.products.at(-1),false);
 const old=s.products[0].metrics;
 s=act(s,'po','update_product',{name:'Аккредитив',description:'Описание',goals:''});assert.equal(s.products[0].metrics,old);
 s=act(s,'po','add_person',{personId:'platform',role:'Platform Engineer',assignments:['knowledge.review']});
 assert.deepEqual(s.people.find(person=>person.id==='platform').assignments,['knowledge.review']);
 assert.equal(d.permissionLabel('risk.accept'),'Принятие риска (risk.accept)');
});

test('one product-tag Flow is shared across boards and teams while config stays owner-managed and gates stay local',()=>{
 let s=sharedProductWorkspace();
 assert.throws(()=>act(s,'delivery-engineer','create_capability',{teamId:'delivery',tag:'dep-update'}),/уже существует/);
 assert.throws(()=>act(s,'delivery-engineer','clone_release',{teamId:'delivery',capabilityId:'cap-dep'}),/Нет доступа/);
 const frozen=JSON.stringify(s.capabilities[0].releases[0].snapshot);
 s=act(s,'delivery-engineer','start_run',{teamId:'delivery',capabilityId:'cap-dep',taskId:'DELIVERY-1',mode:'supervised'});
 const run=s.runs.at(-1),gate=run.gates.at(-1);
 assert.equal(run.teamId,'delivery');assert.equal(run.status,'approval_required');
 assert.equal(gate.assignee,'delivery-engineer');assert.equal(run.execution.gateAssignee,'delivery-engineer');
 assert.equal(run.snapshot.teamId,'growth');assert.equal(run.snapshot.config.gateAssignee,'engineer');
 assert.equal(JSON.stringify(s.capabilities[0].releases[0].snapshot),frozen);
 assert.throws(()=>act(s,'engineer','gate_decision',{runId:run.id,gateId:gate.id,gateRevision:gate.revision,artifactRevision:gate.artifactRevision,decision:'approve'}),/Нет доступа/);
 s=act(s,'delivery-engineer','gate_decision',{teamId:'delivery',runId:run.id,gateId:gate.id,gateRevision:gate.revision,artifactRevision:gate.artifactRevision,decision:'approve'});
 assert.equal(s.tasks.find(task=>task.id==='DELIVERY-1').status,'done');
});

test('released emulation solves all eligible product-tag tasks across teams without gates, skips active/done/scope and is idempotent',()=>{
 let s=sharedProductWorkspace();
 s.tasks.find(task=>task.id==='BANK-1857').status='done';
 s.tasks.push({...d.copy(s.tasks.find(task=>task.id==='DELIVERY-1')),id:'DELIVERY-OUT',title:'Out-of-scope private task',repo:'outside/repository'});
 const frozen=JSON.stringify(s.capabilities[0].releases[0].snapshot),historical=JSON.stringify(s.runs);
 let output=e.applyAction(s,s.people.find(person=>person.id==='engineer'),'emulate_release',{teamId:'growth',productId:'accreditive',capabilityId:'cap-dep'},'test');
 s=output.state;
 assert.equal(output.result.completed,2);assert.equal(output.result.skipped,4);
 assert.ok(output.result.results.some(row=>row.taskId==='DELIVERY-1'&&row.status==='completed'));
 assert.match(output.result.results.find(row=>row.taskId==='DELIVERY-OUT').reason,/Repository/);
 assert.match(output.result.results.find(row=>row.taskId==='BANK-1842').reason,/активный запуск/);
 assert.match(output.result.results.find(row=>row.taskId==='BANK-1857').reason,/завершена/);
 for(const id of output.result.runIds){
  const run=s.runs.find(run=>run.id===id);
  assert.equal(run.status,'accepted');assert.equal(run.mode,'production');assert.equal(run.writer,'none');assert.deepEqual(run.gates,[]);
  assert.equal(run.metrics.input,0);assert.equal(run.metrics.approval,0);assert.equal(run.metrics.humanTime,0);
  assert.equal(JSON.stringify(run.snapshot),frozen);assert.equal(run.evidence.status,'PASS');
  assert.ok(run.execution.autonomous);assert.ok(run.execution.flow.completed);assert.ok(run.execution.flow.trace.every(row=>row.demo));
 }
 assert.equal(JSON.stringify(s.runs.slice(0,JSON.parse(historical).length)),historical);
 output=e.applyAction(s,s.people.find(person=>person.id==='engineer'),'emulate_release',{teamId:'growth',productId:'accreditive',capabilityId:'cap-dep'},'test');
 assert.equal(output.result.completed,0);assert.equal(output.state.runs.length,s.runs.length);
});

test('released SDD explicitly bypasses human nodes without inventing approvals and preserves the immutable released configuration',()=>{
 let s=d.createSeed();const cap=s.capabilities[1],cfg=d.copy(cap.draft);
 cfg.nodeConfigs=d.getFlowNodes(cfg);cfg.humanInput=true;cfg.humanApproval=true;
 cfg.nodeConfigs.find(node=>node.type==='implementation').subagents=['implementation-agent@1'];
 const snapshot=d.makeSnapshot(s,cap,cfg,'SNAP-SDD-AUTO',new Date().toISOString());
 cap.releases=[{id:'REL-SDD-AUTO',stage:'production',status:'active',snapshot,autonomyScope:cfg.scope}];cap.draft=null;
 const frozen=JSON.stringify(snapshot);
 s=act(s,'engineer','start_run',{capabilityId:cap.id,taskId:'BANK-2031',mode:'production'});
 const run=s.runs.at(-1);
 assert.equal(run.status,'accepted');assert.deepEqual(run.gates,[]);assert.equal(run.metrics.approval,0);assert.equal(run.metrics.input,0);
 const approval=run.execution.flow.trace.find(node=>node.type==='approval');
 assert.equal(approval.status,'bypassed_released');assert.equal(approval.automatic,true);
 assert.ok(!run.events.some(event=>event.title==='Human Approval requested'||event.title==='Human Input requested'));
 assert.ok(!run.execution.flow.trace.some(node=>node.status==='approved'));
 assert.deepEqual(run.execution.flow.trace.find(node=>node.type==='implementation').subagents,['implementation-agent@1']);
 assert.equal(JSON.stringify(run.snapshot),frozen);assert.equal(run.evidence.status,'PASS');
});

test('bulk emulation checks owner authority, policy status and each task team current grants',()=>{
 let s=sharedProductWorkspace();
 assert.throws(()=>act(s,'po','emulate_release',{capabilityId:'cap-dep'}),/Product Engineer/);
 assert.throws(()=>act(s,'delivery-engineer','emulate_release',{teamId:'delivery',capabilityId:'cap-dep'}),/Нет доступа/);
 s.teams.find(team=>team.id==='delivery').bindings.find(binding=>binding.type==='Repository').write='';
 const output=e.applyAction(s,s.people.find(person=>person.id==='engineer'),'emulate_release',{teamId:'growth',productId:'accreditive',capabilityId:'cap-dep'},'test');
 assert.match(output.result.results.find(row=>row.taskId==='DELIVERY-1').reason,/grants/);
 assert.ok(!output.state.runs.some(run=>run.taskId==='DELIVERY-1'));
 s=act(s,'regulator','policy_status',{policyKey:'IS-corporate-backend@7',status:'Retired'});
 assert.throws(()=>act(s,'engineer','emulate_release',{capabilityId:'cap-dep'}),/запрещена/);
});

test('legacy duplicate product-tag Flows retain histories while shared lookup remains stable and new duplicates are blocked',()=>{
 const s=sharedProductWorkspace(),duplicate=d.copy(s.capabilities[0]);
 duplicate.id='legacy-delivery-flow';duplicate.teamId='delivery';s.capabilities.push(duplicate);
 const frozen=JSON.stringify(s.capabilities.flatMap(cap=>cap.releases.map(release=>release.snapshot)));
 const migrated=d.migrateState(s).state;
 assert.equal(migrated.capabilities.at(-1).legacyDuplicateOf,'cap-dep');
 assert.equal(d.capabilityForTag(migrated,'accreditive','dep-update').id,'cap-dep');
 assert.equal(JSON.stringify(migrated.capabilities.flatMap(cap=>cap.releases.map(release=>release.snapshot))),frozen);
 assert.throws(()=>act(migrated,'delivery-engineer','emulate_release',{teamId:'delivery',capabilityId:duplicate.id}),/общий Flow cap-dep/);
});

test('notification read actions are isolated to current team/product and never change another team notification',()=>{
 let s=sharedProductWorkspace();
 s.notifications.push({id:'delivery-notice',teamId:'delivery',productId:'accreditive',title:'Private notice',text:'Private',target:'tasks',ref:'',read:false});
 s.notifications.push({id:'other-product-notice',teamId:'growth',productId:'other-product',title:'Other product',text:'Other',target:'tasks',ref:'',read:false});
 s=act(s,'engineer','mark_notification',{id:'n-gate-1'});
 assert.equal(s.notifications.find(notice=>notice.id==='n-gate-1').read,true);
 assert.equal(s.notifications.find(notice=>notice.id==='n-policy').read,false);
 assert.throws(()=>act(s,'engineer','mark_notification',{id:'delivery-notice'}),/Нет доступа/);
 assert.throws(()=>act(s,'engineer','mark_notification',{id:'other-product-notice'}),/выбранному Product/);
 s=act(s,'engineer','mark_all_notifications');
 assert.ok(s.notifications.filter(notice=>notice.teamId==='growth'&&notice.productId==='accreditive').every(notice=>notice.read));
 assert.equal(s.notifications.find(notice=>notice.id==='delivery-notice').read,false);
 assert.equal(s.notifications.find(notice=>notice.id==='other-product-notice').read,false);
});

test('offered catalog combinations create and supervise from API/web repositories without hidden configuration edits',()=>{
 for(const runtime of ['HG SDLC','AI Manager'])for(const repository of d.REPOSITORIES)for(const template of d.FLOW_TEMPLATES){
  let s=d.createSeed();s.capabilities=[];s.runs=[];s.teams[0].automation=runtime;
  s.teams[0].bindings=s.teams[0].bindings.filter(binding=>binding.type!=='Repository'||binding.name===repository.name);
  const binding=s.teams[0].bindings.find(binding=>binding.type==='Repository');binding.read='/**';binding.write='/**';
  const task={...d.copy(s.tasks[1]),id:'MATRIX-TASK',tag:'custom-catalog-tag',repo:repository.name,status:'todo'};s.tasks=[task];
  const created=e.applyAction(s,s.people.find(person=>person.id==='engineer'),'create_capability',{teamId:'growth',productId:'accreditive',tag:task.tag,template,name:'Matrix Flow',config:{description:'Catalog description'}},'test');
  s=created.state;const id=created.result.id;let cfg=d.copy(s.capabilities[0].draft);
  assert.ok(cfg.repos.includes(repository.name));assert.equal(cfg.model,'glm');assert.equal(cfg.tokenLimit,100000);
  assert.ok(cfg.policies.every(key=>s.policies.find(policy=>d.policyKey(policy)===key).segment===repository.segment));
  cfg.nodeConfigs=d.getFlowNodes(cfg);s=act(s,'engineer','save_config',{capabilityId:id,expectedRevision:cfg.revision,config:cfg});
  s=act(s,'engineer','start_run',{capabilityId:id,taskId:task.id,mode:'supervised'});
  const runId=s.runs.at(-1).id;
  for(let step=0;step<4;step++){
   const run=s.runs.find(run=>run.id===runId),gate=run.gates.at(-1);
   if(run.completedAt)break;
   assert.equal(gate?.status,'pending',`${runtime}/${repository.name}/${template}: gate`);
   s=decision(s,runId,gate.type==='input'?'input':'approve',gate.type==='input'?{value:'2.17.3'}:{});
  }
  const run=s.runs.find(run=>run.id===runId);
  assert.equal(run.status,'accepted',`${runtime}/${repository.name}/${template}`);
  const paths=[...run.artifacts.diff.matchAll(/^\+\+\+ b\/(.+)$/gm)].map(match=>`/${match[1]}`);
  assert.equal(paths.length,1);
  assert.ok(paths.every(path=>e.pathAllowed(path,run.snapshot.config.scope)&&e.pathAllowed(path,binding.write)));
  assert.equal(run.scope.workTypes.includes('dependency_change'),template==='dependency-update@1');
  assert.equal(run.artifacts.manifest.includes('Generated statement'),template==='sdd-statements@1');
  assert.ok(run.plans[0].applicable.length>0,'Actual repository segment has regulatory requirements.');
  assert.equal(run.evidence.status,'PASS');assert.ok(run.metrics.tokens>0);
  assert.equal(run.execution.economics.demo,true);
  assert.equal(run.execution.economics.costRubles,d.estimateTokenCost(cfg.model,run.metrics.tokens));
 }
});

test('new mixed-repository Flow includes both connected repositories and generates artifacts inside their common grants',()=>{
 let s=d.createSeed();s.capabilities=[];s.runs=[];
 s.tasks=s.tasks.slice(1,3).map(task=>({...task,tag:'shared-dependency-tag',status:'todo'}));
 const created=e.applyAction(s,s.people.find(person=>person.id==='engineer'),'create_capability',{teamId:'growth',productId:'accreditive',tag:'shared-dependency-tag',template:'dependency-update@1'},'test');
 s=created.state;const id=created.result.id,cfg=s.capabilities[0].draft;
 assert.deepEqual(cfg.repos,['bank/lc-trade-api','bank/lc-retail-api']);assert.equal(cfg.scope,'/src/letters-of-credit/**');
 assert.ok(cfg.policies.some(key=>key.includes('retail-backend')));
 for(const task of s.tasks){
  s=act(s,'engineer','start_run',{capabilityId:id,taskId:task.id,mode:'supervised'});const runId=s.runs.at(-1).id;
  s=decision(s,runId,'input',{value:'2.17.3'});s=decision(s,runId,'approve');
  const run=s.runs.find(run=>run.id===runId),path=d.generatedArtifactPath(run);
  assert.equal(run.status,'accepted');assert.ok(e.pathAllowed(path,cfg.scope));
  assert.ok(s.teams[0].bindings.filter(binding=>binding.type==='Repository').every(binding=>e.pathAllowed(path,binding.write)));
 }
});

test('hidden legacy reviewer and quota defaults are repaired in editable drafts while frozen snapshots remain unchanged',()=>{
 let s=d.createSeed();const cap=s.capabilities[1],before=JSON.stringify(s.runs.map(run=>run.snapshot));
 cap.draft.gateAssignee='removed-reviewer';s.teams[0].environment.quota=25;
 const cfg=d.copy(cap.draft);cfg.nodeConfigs=d.getFlowNodes(cfg);cfg.description='Editable description';
 s=act(s,'engineer','save_config',{capabilityId:cap.id,expectedRevision:cfg.revision,config:cfg});
 assert.equal(s.capabilities[1].draft.gateAssignee,'engineer');assert.equal(s.capabilities[1].draft.limit,25);
 assert.equal(JSON.stringify(s.runs.map(run=>run.snapshot)),before);
 const forged=d.copy(s.capabilities[1].draft);forged.gateAssignee='regulator';
 assert.throws(()=>act(s,'engineer','save_config',{capabilityId:cap.id,expectedRevision:forged.revision,config:forged}),/участником команды/);
});

test('readonly released Flow can supervise with a current local reviewer without changing a stale frozen assignee',()=>{
 let s=d.createSeed();s.capabilities[0].releases[0].snapshot.config.gateAssignee='removed-reviewer';
 const before=JSON.stringify(s.capabilities[0].releases[0].snapshot);
 s=act(s,'engineer','start_run',{capabilityId:'cap-dep',taskId:'BANK-1857',mode:'supervised'});
 const run=s.runs.at(-1);assert.equal(run.status,'approval_required');assert.equal(run.gates.at(-1).assignee,'engineer');
 assert.equal(run.snapshot.config.gateAssignee,'removed-reviewer');assert.equal(run.execution.gateAssignee,'engineer');
 assert.equal(JSON.stringify(s.capabilities[0].releases[0].snapshot),before);
});

test('demo token economics uses the same completion calculation for supervised and released runs without provider billing',()=>{
 let s=d.createSeed();s.runs=[];const cfg=s.capabilities[0].releases[0].snapshot.config;cfg.tokenLimit=6000;cfg.model='gpt';
 s=act(s,'engineer','start_run',{capabilityId:'cap-dep',taskId:'BANK-1857',mode:'supervised'});const supervised=s.runs.at(-1).id;
 assert.equal(s.runs.at(-1).execution.economics,undefined,'Pending human gate is not counted as a completed run.');
 s=decision(s,supervised,'approve');
 s=act(s,'engineer','start_run',{capabilityId:'cap-dep',taskId:'BANK-1924',mode:'production'});
 for(const run of s.runs){
  assert.equal(run.metrics.tokens,6000);assert.equal(run.metrics.cost,1.08);assert.equal(run.execution.economics.demo,true);
  assert.equal(run.execution.economics.source,'deterministic mock estimate');assert.equal(run.execution.economics.costRubles,1.08);
 }
});

test('changed Flow saves increment the visible version and no-op saves keep both Flow and node revisions',()=>{
 let {state:s,id}=configuredDraft();let cap=s.capabilities.find(cap=>cap.id===id);
 const initial=d.copy(cap.draft),catalog=JSON.stringify(s.assets),snapshots=JSON.stringify(s.runs.map(run=>run.snapshot));
 s=act(s,'engineer','save_config',{capabilityId:id,name:cap.name,expectedRevision:initial.revision,config:d.copy(initial)});
 cap=s.capabilities.find(cap=>cap.id===id);assert.deepEqual(cap.draft,initial);
 const cfg=d.copy(cap.draft);cfg.nodeConfigs[0].instructions+=' Дополнительная проверка.';
 s=act(s,'engineer','save_config',{capabilityId:id,expectedRevision:cfg.revision,config:cfg});cap=s.capabilities.find(cap=>cap.id===id);
 assert.equal(cap.draft.version,d.nextFlowVersion(initial.version));assert.equal(cap.draft.revision,initial.revision+1);
 assert.equal(cap.draft.nodeConfigs[0].revision,initial.nodeConfigs[0].revision+1);assert.equal(cap.draft.nodeConfigs[1].revision,initial.nodeConfigs[1].revision);
 const version=cap.draft.version;s=act(s,'engineer','save_config',{capabilityId:id,name:'Командный Flow',expectedRevision:cap.draft.revision,config:cap.draft});
 cap=s.capabilities.find(cap=>cap.id===id);assert.equal(cap.draft.version,d.nextFlowVersion(version));assert.equal(cap.teamId,'growth');
 assert.equal(JSON.stringify(s.assets),catalog);assert.equal(JSON.stringify(s.runs.map(run=>run.snapshot)),snapshots);
});

test('editable executors are Coding-agent or Human and an explicit Input uses its configured free-text question',()=>{
 let {state:s,id}=configuredDraft('dep-update',cfg=>{
  cfg.humanInput=false;
  const input=d.createFlowNode('input','owner-input',cfg);input.instructions='Уточните допустимое окно выпуска.';cfg.nodeConfigs.splice(1,0,input);
 });
 const cfg=s.capabilities.find(cap=>cap.id===id).draft;
 assert.ok(cfg.nodeConfigs.every(node=>['agent','human'].includes(node.executor)));assert.deepEqual(d.flowIssues(cfg),[]);
 const started=startConfigured(s,id);s=started.state;let run=s.runs.find(run=>run.id===started.runId),gate=run.gates.at(-1);
 assert.equal(gate.type,'input');assert.equal(gate.question,'Уточните допустимое окно выпуска.');assert.equal(gate.options,undefined);
 assert.throws(()=>decision(s,run.id,'approve'),/Human Input/);
 s=decision(s,run.id,'input',{value:'После закрытия операционного дня.'});run=s.runs.find(item=>item.id===run.id);
 assert.equal(run.artifacts.inputs['owner-input'].value,'После закрытия операционного дня.');assert.equal(run.artifacts.inputChoice,undefined);
 assert.equal(run.gates.at(-1).phase,'Result');assert.equal(run.metrics.input,1);assert.equal(run.metrics.approval,0);
});

test('legacy executor migration changes only editable drafts and keeps configured frozen releases executable',()=>{
 let s=d.createSeed(),cap=s.capabilities[0],release=cap.releases[0];
 release.snapshot.config.nodeConfigs=d.getFlowNodes(release.snapshot.config).map(node=>({...node,executor:node.type==='checks'?'ci':node.type==='result'?'automation':node.executor}));
 cap.draft=d.copy(release.snapshot.config);const frozen=JSON.stringify(release.snapshot),version=cap.draft.version;
 const migrated=d.migrateState(s);s=migrated.state;cap=s.capabilities[0];
 assert.equal(migrated.changed,true);assert.equal(cap.draft.version,version);assert.ok(cap.draft.nodeConfigs.every(node=>['agent','human'].includes(node.executor)));
 assert.equal(JSON.stringify(cap.releases[0].snapshot),frozen);assert.equal(d.migrateState(s).changed,false);
 s=act(s,'engineer','start_run',{capabilityId:cap.id,taskId:'BANK-1857',mode:'production'});
 assert.equal(s.runs.at(-1).status,'accepted');assert.equal(s.runs.at(-1).snapshot.config.nodeConfigs.find(node=>node.type==='checks').executor,'ci');
 assert.equal(JSON.stringify(s.capabilities[0].releases[0].snapshot),frozen);
});

test('Takeover and return require comments, keep one authorized writer, and never require local artifact or checks actions',()=>{
 let s=d.createSeed();const original=JSON.stringify(s);
 assert.throws(()=>decision(s,'RUN-912','takeover'),/Комментарий/);assert.equal(JSON.stringify(s),original);
 s=decision(s,'RUN-912','takeover',{comment:'Нужна правка в IDE.'});let run=s.runs.find(run=>run.id==='RUN-912');
 assert.equal(run.writer,'human');assert.ok(run.events.some(event=>event.detail==='Идите в IDE и редактируйте проект там, а потом верните управление.'));
 assert.throws(()=>act(s,'engineer','return_control',{runId:run.id,comment:'  '}),/Комментарий/);
 s.people.push({id:'other-engineer',name:'Другой инженер',role:'Product Engineer',teams:['growth'],assignments:['capability.review']});s.teams[0].people.push('other-engineer');
 assert.throws(()=>act(s,'other-engineer','return_control',{runId:run.id,comment:'Забрать чужой Run'}),/другому пользователю/);
 s=act(s,'engineer','return_control',{runId:run.id,comment:'Правка завершена, продолжить.'});run=s.runs.find(item=>item.id===run.id);
 assert.equal(run.writer,'none');assert.equal(run.gates.at(-1).status,'pending');assert.equal(run.execution.comments.length,2);
 assert.equal(run.execution.comments[0].text,'Нужна правка в IDE.');assert.equal(run.execution.comments[1].text,'Правка завершена, продолжить.');
 s=decision(s,run.id,'approve');assert.equal(s.runs.find(item=>item.id===run.id).status,'accepted');
});

test('each new Human Gate creates a bell notification including later full-rework attempts',()=>{
 let {state:s,id}=configuredDraft('dep-update',cfg=>{cfg.humanInput=true;});const count=s.notifications.length;
 const started=startConfigured(s,id);s=started.state;let run=s.runs.find(run=>run.id===started.runId);
 assert.equal(s.notifications.length,count+1);assert.equal(s.notifications[0].kind,'Human Input');assert.equal(s.notifications[0].ref,run.id);
 s=decision(s,run.id,'input',{value:'2.17.4'});assert.equal(s.notifications[0].kind,'Human Approval');
 s=decision(s,run.id,'rework',{comment:'Повторить весь сценарий.'});run=s.runs.find(item=>item.id===run.id);
 assert.equal(run.gates.at(-1).type,'input');assert.equal(s.notifications[0].kind,'Human Input');assert.equal(s.notifications[0].read,false);
 const gates=s.notifications.filter(notice=>notice.ref===run.id&&['Human Input','Human Approval'].includes(notice.kind));
 assert.equal(gates.length,run.gates.length);assert.equal(new Set(gates.map(notice=>notice.id)).size,gates.length);
});

test('UAT freezes the applicable basket version and risks require all explicit acknowledgements',()=>{
 let s=frozen();const releaseId=s.capabilities[0].releases[0].id,release=s.capabilities[0].releases[0],frozenSnapshot=JSON.stringify(release.snapshot);
 assert.equal(release.snapshot.testBaskets[0].version,3);assert.equal(release.snapshot.testBaskets[0].cases.length,3);
 s.suites.push({...d.copy(s.suites[0]),version:4,cases:[d.copy(s.suites[0].cases[0])]});
 s=act(s,'engineer','run_uat',{capabilityId:depId,releaseId});const saved=s.capabilities[0].releases[0];
 assert.equal(saved.uat.report.baskets[0].version,3);assert.equal(saved.uat.report.baskets[0].total,3);assert.equal(saved.uat.report.basketCaseCount,3);
 const risk=d.releaseRiskAssessment(s,saved);assert.equal(risk.runCount,0);assert.equal(risk.highRisk,true);assert.equal(risk.basketCount,1);
 assert.ok(risk.risks.some(item=>item.id==='insufficient_history'));assert.ok(!risk.risks.some(item=>item.id==='no_test_basket'));
 for(const acknowledgements of [undefined,[],['autonomous_execution']])assert.throws(()=>act(s,'po','risk_decision',{capabilityId:depId,releaseId,accepted:true,comment:'Принять.',acknowledgements}),/всеми рисками/);
 s=act(s,'po','risk_decision',{capabilityId:depId,releaseId,accepted:true,comment:'Принимаю риск малой статистики.',acknowledgements:risk.risks.map(item=>item.id)});
 assert.equal(s.capabilities[0].releases[0].stage,'admitted');assert.deepEqual(s.capabilities[0].releases[0].risk.assessment,risk);
 assert.equal(JSON.stringify(s.capabilities[0].releases[0].snapshot),frozenSnapshot);
});

test('risk assessment reports no basket and less-than-100 statistics from frozen evidence only',()=>{
 let s=d.createSeed(),release=d.copy(s.capabilities[0].releases[0]);delete release.snapshot.testBaskets;release.snapshot.benchmarkRefs=[];
 let risk=d.releaseRiskAssessment(s,release);assert.equal(risk.runCount,42);assert.equal(risk.basketCount,0);assert.equal(risk.highRisk,true);
 assert.ok(risk.risks.some(item=>item.title==='Нет тестовой корзины'));assert.ok(risk.risks.some(item=>item.title==='Большой риск из-за малой статистики'));
 release.snapshot.historyRunCount=99;release.snapshot.testBaskets=[d.copy(s.suites[0])];risk=d.releaseRiskAssessment(s,release);assert.equal(risk.highRisk,true);
 release.snapshot.historyRunCount=100;risk=d.releaseRiskAssessment(s,release);assert.equal(risk.highRisk,false);assert.deepEqual(risk.risks.map(item=>item.id),['autonomous_execution']);
 assert.ok(!JSON.stringify(risk).toLowerCase().includes('остаточ'));
});

test('a persisted old UAT waiting on a gate resumes automatically on the same snapshot once',()=>{
 let s=d.createSeed();s=act(s,'engineer','freeze_release',{capabilityId:'cap-statement'});const cap=s.capabilities[1],release=cap.releases[0];
 const run=d.makeRun(s,cap,release.snapshot.config,s.tasks[4],'UAT-LEGACY','2026-10-07T10:00:00Z','uat',release);run.uat=true;run.plans.push(d.makePlan(run));d.addGate(run,'approval','Specification');
 s.runs.push(run);release.stage='uat_running';release.uat={status:'RUNNING',snapshotId:release.snapshot.id,binding:release.snapshot.uatBindings,runId:run.id,time:run.startedAt};
 const frozenSnapshot=JSON.stringify(release.snapshot),tasks=JSON.stringify(s.tasks);e.refreshHealth(s);
 assert.equal(release.stage,'uat_passed');assert.equal(run.status,'accepted');assert.equal(run.execution.uatAutoMigrated,true);
 assert.ok(!run.gates.some(gate=>gate.status==='pending'));assert.equal(JSON.stringify(release.snapshot),frozenSnapshot);assert.equal(JSON.stringify(s.tasks),tasks);
 const after=JSON.stringify(s);e.refreshHealth(s);assert.equal(JSON.stringify(s),after);
});

test('Policy Package composition validates textual rules and exact Skills/Subagents and freezes their selected versions',()=>{
 let s=d.createSeed(),snapshots=JSON.stringify(s.runs.map(run=>run.snapshot));
 const payload={id:'IS-team-rules',direction:'Information Security',segment:'retail.backend',changelog:'Текстовые политики команды.',requirements:[{id:'IS-team-rules-R001',version:1,text:'Изменения должны оставаться в разрешённом scope.\nНельзя менять публичный контракт.'}],applicability:[{requirement:'IS-team-rules-R001@1',workType:'implementation'}],skills:['code-diff-analysis@4'],subagents:['checks-agent@1'],evidence:[{requirement:'IS-team-rules-R001@1',artifacts:'Отчёт проверок и diff.',verificationSkill:'dependency-evidence-check@3'}]};
 for(const changed of [{...payload,requirements:[]},{...payload,requirements:[{...payload.requirements[0],text:' '}]},{...payload,skills:['missing@1']},{...payload,subagents:['code-diff-analysis@4']},{...payload,evidence:[{requirement:'unknown@1'}]}])assert.throws(()=>act(s,'regulator','save_policy',changed),/правил|Текст|Skills|Subagents|требование/);
 s=act(s,'regulator','save_policy',payload);let policy=s.policies.at(-1);assert.equal(policy.version,1);assert.equal(policy.status,'Draft');assert.deepEqual(policy.subagents,['checks-agent@1']);assert.equal(policy.requirements[0].text,payload.requirements[0].text);
 s=act(s,'regulator','save_policy',{...payload,changelog:'Уточнены правила.'});policy=s.policies.at(-1);assert.equal(policy.version,2);assert.equal(policy.supersedes,'IS-team-rules@1');
 assert.equal(s.policies.find(item=>item.id===payload.id&&item.version===1).changelog,payload.changelog);assert.equal(JSON.stringify(s.runs.map(run=>run.snapshot)),snapshots);
 const cap=s.capabilities[1],cfg=d.copy(cap.draft);cfg.policies=cfg.policies.map(key=>key.startsWith('IS-')?'IS-team-rules@2':key);const run=d.makeRun(s,cap,cfg,s.tasks[4],'POLICY-FROZEN',new Date().toISOString());
 assert.deepEqual(run.snapshot.policyPackages.find(item=>item.id===payload.id).subagents,['checks-agent@1']);
 s.policies.at(-1).requirements[0].text='Changed live';assert.equal(run.snapshot.policyPackages.find(item=>item.id===payload.id).requirements[0].text,payload.requirements[0].text);
});

test('Context Bundle compiles product, team, ontology and policy sources through explicit selectors',()=>{
 const s=d.createSeed(),input={productId:'accreditive',teamId:'growth',system:'Trade Finance LC',productTopic:'foundation',workType:'dependency_change',stage:'implementation'};
 const bundle=c.compileContextBundle(s,input);
 assert.equal(bundle.segment,'corporate.backend');assert.equal(bundle.receiptStatus,'ready');
 assert.deepEqual(bundle.productKnowledge.map(item=>item.id),['pk-lc-foundation']);
 assert.deepEqual(bundle.teamKnowledge.map(item=>item.id),['tk-trade-lc']);
 assert.ok(bundle.concepts.some(item=>item.id==='lc_definition'));assert.ok(bundle.concepts.every(item=>item.variant!=='individual'));
 assert.ok(bundle.policies.some(item=>d.policyKey(item)==='IS-corporate-backend@8'));
 assert.ok(bundle.selectionReasons.every(item=>item.reason));assert.match(bundle.agentContext,/Аккредитив/);
 assert.equal((bundle.agentContext.match(/SEC-DEP-014@3/g)||[]).length,1,'The agent fragment must deduplicate the same obligation across policy versions.');
 assert.equal(bundle.hash,c.compileContextBundle(d.copy(s),d.copy(input)).hash,'Hash must depend on canonical source content, not object order.');
});

test('Context Bundle follows team/system segmentation and reports incomplete or blocked delivery',()=>{
 const s=d.createSeed();
 const retail=c.compileContextBundle(s,{productId:'accreditive',teamId:'retail-lc',system:'LC Retail Service',productTopic:'deals',workType:'implementation',stage:'plan'});
 assert.equal(retail.segment,'retail.backend');assert.deepEqual(retail.teamKnowledge.map(item=>item.id),['tk-retail-lc']);
 assert.ok(retail.concepts.some(item=>item.id==='deal_realty'));assert.ok(retail.concepts.every(item=>item.variant!=='corporate'));
 const incomplete=c.compileContextBundle(s,{productId:'accreditive',teamId:'growth',system:'Unknown system',productTopic:'foundation',workType:'implementation',stage:'plan'});
 assert.equal(incomplete.receiptStatus,'incomplete');assert.ok(incomplete.unknown.some(item=>item.includes('Resource Bindings')));
 s.policies.find(item=>d.policyKey(item)==='IS-corporate-backend@8').status='Retired';
 const blocked=c.compileContextBundle(s,{productId:'accreditive',teamId:'growth',system:'Trade Finance LC',productTopic:'foundation',workType:'dependency_change',stage:'implementation'});
 assert.equal(blocked.receiptStatus,'blocked');assert.ok(blocked.blocking.some(item=>item.includes('IS-corporate-backend@8')));
});

test('Context actions classify systems by role and persist immutable delivery snapshots',()=>{
 let s=d.createSeed();
 assert.throws(()=>act(s,'engineer','classify_system',{system:'Trade Finance LC',segment:'retail.backend'}),/Platform Engineer/);
 s=act(s,'platform','classify_system',{system:'Trade Finance LC',segment:'corporate.backend'});
 assert.ok(s.teams[0].bindings.filter(item=>item.system==='Trade Finance LC').every(item=>item.segment==='corporate.backend'));
 const input={teamId:'growth',productId:'accreditive',system:'Trade Finance LC',productTopic:'foundation',workType:'dependency_change',stage:'implementation'};
 const output=e.applyAction(s,s.people.find(item=>item.id==='engineer'),'save_context_bundle',input,'context-test');s=output.state;
 assert.equal(s.contextBundles.length,1);assert.equal(s.contextBundles[0].id,output.result.id);assert.equal(s.contextBundles[0].receiptStatus,'ready');
 const saved=JSON.stringify(s.contextBundles[0]);s.knowledge[0].content='Changed after delivery';
 assert.equal(JSON.stringify(s.contextBundles[0]),saved,'Saved bundle must not follow later live source edits.');
 assert.throws(()=>e.applyAction(s,s.people.find(item=>item.id==='platform'),'save_context_bundle',input,'context-test'),/knowledge.contribute/);
});
