/** Acceptance of the requested Dependency Update story, using real domain actions. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as d from '../lib/domain.ts';
import {applyAction} from '../lib/engine.ts';
import {DEFAULT_SECURITY_RULE,DEFAULT_JUDGE_PROMPT,DEFAULT_JUDGE_SCHEMA} from '../lib/demo-v16.ts';
function workspace(runtime='Maestro'){
 let state=d.createEmptyState(),productId='',teamId='';
 function act(who,action,payload={}){const out=applyAction(state,state.people.find(p=>p.id===who),action,{teamId,productId,...payload},'acceptance-v16');state=out.state;return out.result||{};}
 act('po','complete_setup_intro');productId=act('po','create_product',{name:'Dependency Demo',description:'Обновления зависимостей'}).id;
 teamId=act('po','create_team',{name:'Demo Engineering',scope:'Зависимости и сборки'}).id;
 act('po','add_person',{personId:'platform',role:'Platform Engineer'});act('po','add_person',{personId:'engineer',role:'Product Engineer'});
 const w={get state(){return state},act,get team(){return state.teams[0]},productId,teamId};
 w.configure=()=>{act('platform','save_environment',{...w.team.environment,automation:runtime});
 act('platform','save_binding',{type:'Repository',name:'bank/lc-trade-api',permissions:['read','write','create_pr']});
 act('platform','save_binding',{type:'Task Tracker',name:'Jira',scope:'DEMO'});act('platform','save_binding',{type:'CI',name:'Jenkins CI',scope:'Demo Builds'});
 act('platform','provision',{topologyConfirmed:true});w.boardId=act('engineer','create_board',{name:'Dependency Updates'}).id;
 act('engineer','add_mock_tasks',{boardId:w.boardId,template:'dep-update',count:8,assigneeId:'engineer'});};
 w.policy=(version=1)=>{const key=`SEC-DEMO@${version}`;return act('regulator','save_policy',{id:'DEMO-SECURITY',direction:'Information Security',segment:'corporate.backend',requirements:[{id:'SEC-DEMO',version,text:DEFAULT_SECURITY_RULE}],applicability:[{requirement:key,tag:'dep-update',workType:'dependency_change',artifactType:'dependency manifest',segment:'corporate.backend'}],skills:['certified-dependency-selection@5'],subagents:[],evidence:[{requirement:key,verificationSkill:'dependency-evidence-check@3',artifacts:'final dependency manifest; approved registry reference'}],changelog:''}).id;};
 w.flow=()=>{w.capabilityId=act('engineer','create_capability',{tag:'dep-update',template:'dependency-update@1',name:'Dependency Update Demo'}).id;const cfg=d.copy(w.state.capabilities[0].draft);const nodes=d.getEditableFlowNodes(cfg);nodes.splice(nodes.length-1,0,d.createFlowNode('checks','additional-check',cfg));cfg.nodeConfigs=nodes;act('engineer','save_config',{capabilityId:w.capabilityId,expectedRevision:cfg.revision,config:cfg});};
 w.run=taskId=>{const runId=act('engineer','start_run',{capabilityId:w.capabilityId,taskId,mode:'supervised'}).id;for(let i=0;i<10;i++){const run=state.runs.find(r=>r.id===runId),gate=run.gates.find(g=>g.status==='pending');if(!gate)break;act('engineer','gate_decision',{runId,gateId:gate.id,gateRevision:gate.revision,artifactRevision:gate.artifactRevision,decision:gate.type==='input'?'input':'approve',value:'2.17.4',comment:'Проверено'});}assert.equal(state.runs.find(r=>r.id===runId).status,'accepted');return state.runs.find(r=>r.id===runId);};
 w.suite=()=>act('engineer','save_suite',{name:'Dependency Suite',tag:'dep-update',cases:state.tasks.slice(0,2).map(t=>({taskId:t.id})),judgeDraft:{name:'Dependency Judge',instruction:DEFAULT_JUDGE_PROMPT,schema:DEFAULT_JUDGE_SCHEMA}});
 w.release=benchmarkId=>{const releaseId=act('engineer','freeze_release',{capabilityId:w.capabilityId,benchmarkRefs:[benchmarkId]}).id;act('engineer','run_uat',{capabilityId:w.capabilityId,releaseId});const release=state.capabilities[0].releases.find(r=>r.id===releaseId);assert.equal(release.stage,'uat_passed');act('po','risk_decision',{capabilityId:w.capabilityId,releaseId,accepted:true,comment:'Демо: риски рассмотрены',acknowledgements:d.releaseRiskAssessment(state,release).risks.map(r=>r.id)});act('regulator','security_decision',{capabilityId:w.capabilityId,releaseId,accepted:true,comment:'ИБ-проверка пройдена для frozen snapshot.'});w.lastPromotion=act('engineer','promote',{capabilityId:w.capabilityId,releaseId});return releaseId;};
 return w;
}
function configured(runtime){const w=workspace(runtime);w.configure();const policy=w.policy();w.act('regulator-reviewer','policy_status',{policyKey:policy,status:'Current'});w.flow();return w;}
for(const runtime of ['HG SDLC','Maestro','AI Conductor'])test(`${runtime}: 00 → 8 tasks → four-eyes → modified Flow → 2 runs → judge → benchmark → release → 6 autonomous`,()=>{
 const w=configured(runtime);assert.equal(w.state.setupIntroSeen,true);assert.equal(w.state.tasks.length,8);assert.ok(w.team.bindings.every(b=>b.platform===runtime));
 assert.ok(w.state.capabilities[0].draft.policies.includes('DEMO-SECURITY@1'));
 assert.throws(()=>w.act('engineer','freeze_release',{capabilityId:w.capabilityId}),/история запусков/);
 for(const task of w.state.tasks.slice(0,2)){const run=w.run(task.id);assert.equal(run.evidence.status,'PASS');assert.ok(run.plans[0].applicable.some(r=>r.requirement==='SEC-DEMO@1'));const receipt=run.execution.knowledgeDelivery;assert.equal(receipt.delivered,true);assert.equal(receipt.product.length,0);assert.ok(receipt.team.some(f=>/Jenkins/.test(f.content)));assert.ok(receipt.policies.some(f=>/сертифицирован/.test(f.content)));assert.equal(receipt.targetStage,'Implementation');assert.equal(run.artifacts.coverage.lines,92);}
 const suite=w.suite(),tasks=JSON.stringify(w.state.tasks),runs=JSON.stringify(w.state.runs);const reportId=w.act('engineer','benchmark',{capabilityId:w.capabilityId,suiteId:suite.id,suiteVersion:suite.version}).id;
 const report=w.state.benchmarks[0];assert.equal(report.passed,2);assert.equal(report.total,2);assert.equal(JSON.stringify(w.state.tasks),tasks);assert.equal(JSON.stringify(w.state.runs),runs);
 for(const row of report.reports){assert.equal(row.metrics.completeness,100);assert.equal(row.metrics.correctness,100);assert.equal(row.metrics.test_coverage,92);assert.equal(row.baseline.test_coverage,92);assert.ok(row.workflowVersion.includes('r2'));assert.ok(!JSON.stringify(row.runtimeInput).includes(row.judgeInput.goldenRevision));assert.ok(!Object.hasOwn(row.runtimeInput,'goldenDiff'));assert.ok(row.actual.diff);assert.ok(row.goldenDiff);}
 const releaseId=w.release(reportId);const frozen=JSON.stringify(w.state.capabilities[0].releases[0].snapshot);assert.equal(w.lastPromotion.emulation.completed,6);assert.ok(w.state.tasks.every(t=>t.status==='done'));assert.equal(JSON.stringify(w.state.capabilities[0].releases[0].snapshot),frozen);
 assert.equal(w.act('engineer','emulate_release',{capabilityId:w.capabilityId,releaseId}).completed,0);
});
test('platform first, PL-only access, unavailable AI Manager and cross-platform rebind are enforced',()=>{
 const w=workspace();assert.throws(()=>w.act('platform','save_binding',{type:'CI',name:'Jenkins'}),/Сначала выберите/);
 assert.throws(()=>w.act('engineer','save_environment',{...w.team.environment,automation:'Maestro'}),/Platform Engineer/);
 assert.throws(()=>w.act('platform','save_environment',{...w.team.environment,automation:'AI Manager'}),/недоступ|доступн/i);
 w.configure();assert.throws(()=>w.act('engineer','save_binding',{type:'Repository',name:'bank/lc-trade-api'}),/Platform Engineer/);
 w.act('platform','save_environment',{...w.team.environment,automation:'AI Conductor'});assert.ok(w.team.bindings.every(b=>b.status!=='connected'));
 assert.throws(()=>w.act('platform','provision',{topologyConfirmed:true}),/binding|подключ|ресурс/i);
});
test('policy author cannot activate their own package and each rule is captured by the new Flow',()=>{
 const w=workspace();w.configure();const key=w.policy(),draft=JSON.stringify(w.state.policies.find(p=>d.policyKey(p)===key));
 assert.throws(()=>w.act('regulator','policy_status',{policyKey:key,status:'Current'}),/4-eyes|автор|другой/i);assert.equal(JSON.stringify(w.state.policies.find(p=>d.policyKey(p)===key)),draft);
 w.act('regulator-reviewer','policy_status',{policyKey:key,status:'Current'});const policy=w.state.policies.find(p=>d.policyKey(p)===key);assert.equal(policy.createdBy,'regulator');assert.equal(policy.approvedBy,'regulator-reviewer');assert.equal(policy.changelog,'');w.flow();assert.ok(w.state.capabilities[0].draft.policies.includes(key));
});
test('only successful executions become suite cases; judges and suites retain old versions',()=>{
 const w=configured();assert.throws(()=>w.suite(),/успешно завершённый/);w.state.tasks.slice(0,2).forEach(t=>w.run(t.id));const suite=w.suite(),old=JSON.stringify(w.state.suites.at(-1));
 const judge=w.state.assets.find(a=>`${a.id}@${a.version}`===suite.judgeId),oldJudge=JSON.stringify(judge);
 w.act('engineer','save_judge',{id:judge.id,name:judge.name,instruction:judge.instruction+' Дополнительная проверка.',schema:judge.schema});
 assert.equal(JSON.stringify(w.state.assets.find(a=>a.id===judge.id&&a.version===judge.version)),oldJudge);assert.equal(JSON.stringify(w.state.suites.at(-1)),old);
 assert.throws(()=>w.act('engineer','save_judge',{name:'Bad',instruction:'x',schema:{score:'unsupported'}}),/схем|тип|поддерж/i);
});
test('knowledge uses separate review/publish; delivered sources are frozen for an in-flight run',()=>{
 const w=configured();const proposal=w.act('engineer','knowledge_propose',{title:'Dependency: Jenkins first',content:'Для зависимостей дождись Jenkins.',layer:'Team',sourceRefs:['Demo runbook']}).id;
 assert.throws(()=>w.act('engineer','knowledge_publish',{id:proposal}),/review/);
 w.act('engineer','knowledge_review',{id:proposal,approve:true});assert.equal(w.state.knowledge.find(k=>k.id===proposal).status,'reviewed');assert.ok(!w.state.concepts.some(c=>c.id===`concept-${proposal}`));
 w.act('engineer','knowledge_publish',{id:proposal});assert.equal(w.state.knowledge.find(k=>k.id===proposal).status,'approved');assert.ok(w.state.concepts.some(c=>c.id===`concept-${proposal}`));
 const before=JSON.stringify(w.run(w.state.tasks[0].id).snapshot);w.act('engineer','knowledge_propose',{title:'Next rule',content:'Следующее правило Jenkins.',layer:'Team'});assert.equal(JSON.stringify(w.state.runs[0].snapshot),before);
});
test('new policy → candidate → benchmark → re-release does not rewrite the previous released snapshot',()=>{
 const w=configured();w.state.tasks.slice(0,2).forEach(t=>w.run(t.id));const suite=w.suite();const firstReport=w.act('engineer','benchmark',{capabilityId:w.capabilityId,suiteId:suite.id,suiteVersion:suite.version}).id;const firstRelease=w.release(firstReport);const old=JSON.stringify(w.state.capabilities[0].releases[0].snapshot);
 const newPolicy=w.policy(2);w.act('regulator-reviewer','policy_status',{policyKey:newPolicy,status:'Current'});w.act('regulator-reviewer','policy_status',{policyKey:'DEMO-SECURITY@1',status:'Deprecating',sunset:'2027-12-31'});
 w.act('engineer','clone_release',{capabilityId:w.capabilityId});const cfg=d.copy(w.state.capabilities[0].draft);cfg.policies=cfg.policies.map(key=>key==='DEMO-SECURITY@1'?newPolicy:key);w.act('engineer','save_config',{capabilityId:w.capabilityId,expectedRevision:cfg.revision,config:cfg});
 w.run(w.state.tasks[2].id);const newReport=w.act('engineer','benchmark',{capabilityId:w.capabilityId,suiteId:suite.id,suiteVersion:suite.version}).id;assert.equal(w.state.benchmarks[0].passed,2);const next=w.release(newReport);assert.notEqual(firstRelease,next);assert.equal(JSON.stringify(w.state.capabilities[0].releases.find(r=>r.id===firstRelease).snapshot),old);assert.equal(w.state.capabilities[0].releases.find(r=>r.id===firstRelease).status,'superseded');
});
