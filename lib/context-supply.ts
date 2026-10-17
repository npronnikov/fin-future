import {capabilityForTag,copy,currentRelease,defaultConfig,getFlowNodes,isDependencyFlow,isRetiredPolicyStatus,normalizePolicyStatus,policyKey,policyStageAssignments,type ContextBundle,type ContextBundleInput,type ContextDeliveryTrace,type ContextFragment,type ContextPlannerResult,type Item,type RegulatoryVerificationPreview,type State} from './domain.ts';

function stable(value:unknown):unknown{
 if(Array.isArray(value))return value.map(stable);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,stable(item)]));
 return value;
}

export function contextBundleHash(payload:unknown):string{
 const text=JSON.stringify(stable(payload));
 let hash=2166136261;
 for(let index=0;index<text.length;index++){
  hash^=text.charCodeAt(index);
  hash=Math.imul(hash,16777619);
 }
 return `ctx-${(hash>>>0).toString(16).padStart(8,'0')}`;
}

const workMatches=(value:string|undefined,workType:string)=>!value||String(value).split(',').map(item=>item.trim()).includes(workType);
const listMatches=(value:string|undefined,expected:string[])=>!value||String(value).split(',').map(item=>item.trim()).some(item=>expected.includes(item));

function plannerTopics(state:State,task:Item):string[]{
 const text=`${task.tag} ${task.title}`.toLowerCase(),topics:string[]=[];
 if(task.tag==='dep-update')topics.push('foundation');
 if(/document|condition|statement|payment|beneficiary|presentation|услов|документ|плат[её]ж/.test(text))topics.push('settlement');
 if(/document|beneficiary|presentation|parser|документ/.test(text))topics.push('attributes');
 if(/commission|fee|комис/.test(text))topics.push('fees');
 if(/client|portal|retail|клиент/.test(text))topics.push('variants');
 const available=new Set(state.conceptCategories.filter(item=>item.productId===task.productId).map(item=>item.id));
 return [...new Set(topics)].filter(topic=>available.has(topic));
}

function plannerAssignments(flowNodes:Item[]){
 const productTypes=new Set(['task','analysis','specification','implementation']);
 const teamTypes=new Set(['implementation','checks','result']);
 return {
  product:flowNodes.filter(node=>productTypes.has(node.type)).map(node=>node.id),
  team:flowNodes.filter(node=>teamTypes.has(node.type)).map(node=>node.id),
 };
}

function policyRuleMatches(rule:Item,scope:{segment:string;tag:string;workTypes:string[];artifactTypes:string[];artifactTypesKnown:boolean}){
 return (!rule.segment||rule.segment===scope.segment)
  &&(!(rule.tag??rule.taskClass)||(rule.tag??rule.taskClass)===scope.tag)
  &&listMatches(rule.workType,scope.workTypes)
  &&(!rule.artifactType||!scope.artifactTypesKnown||scope.artifactTypes.includes(rule.artifactType));
}

const evidenceParts=(value:string)=>value.split(/[;,]/).map(item=>item.trim().toLowerCase()).filter(Boolean);

export function compileContextDeliveryTrace(state:State,taskId:string):ContextDeliveryTrace{
 const task=state.tasks.find(item=>item.id===taskId),unknown:string[]=[],blocking:string[]=[];
 if(!task){
  const plannerResult:ContextPlannerResult={simulation:true,topics:[],layers:{product:false,team:false},assignments:{product:[],team:[]},rationale:[],unknown:['Task не найдена.']};
  const request={taskId,taskTitle:'Task не найдена',taskTag:'',repository:'',system:'',segment:'',workTypes:[],flowNodes:[]};
  const canonical={task:{id:taskId},request,plannerResult,fragments:[],stages:[],verification:{status:'INCONCLUSIVE',route:'Human Approval Gate'},unknown:['Task не найдена.'],blocking:['Task не найдена.']};
  const hash=contextBundleHash(canonical);
  return {simulation:true,simulationId:`SIM-${hash.slice(4).toUpperCase()}`,task:{id:taskId,title:'Task не найдена',tag:'',repository:'',system:'',segment:'',workTypes:[]},request,plannerResult,fragments:[],stages:[],verification:{simulation:true,status:'INCONCLUSIVE',route:'Human Approval Gate',artifacts:[],results:[]},unknown:['Task не найдена.'],blocking:['Task не найдена.'],hash};
 }
 const product=state.products.find(item=>item.id===task.productId),team=state.teams.find(item=>item.id===task.teamId);
 const binding=team?.bindings.find(item=>item.type==='Repository'&&item.name===task.repo);
 const system=binding?.system||'',segment=binding?.segment||'';
 if(!binding)blocking.push(`Repository Binding для ${task.repo} не найден.`);
 if(binding&&!system)blocking.push(`Для Repository ${task.repo} не определена техническая система.`);
 if(!segment)blocking.push(`Для Repository ${task.repo} не определён IT-сегмент.`);
 const capability=capabilityForTag(state,task.productId,task.tag);
 const release=currentRelease(capability),config=release?.snapshot.config||capability?.draft||defaultConfig(task.tag||'custom','HG SDLC','custom');
 if(!capability)unknown.push(`Для тега #${task.tag||'—'} не найден Flow; используется демонстрационный fallback.`);
 const flowNodes=getFlowNodes(config);
 const workTypes=isDependencyFlow(config,task.tag)?['dependency_change','implementation','verification']:['implementation','verification'];
 const artifactTypes=['diff','test report','registry reference',...(workTypes.includes('dependency_change')?['dependency manifest']:[])];
 const topics=plannerTopics(state,task),assignments=plannerAssignments(flowNodes);
 const plannerUnknown:string[]=[];
 if(!topics.length)plannerUnknown.push('Planner не определил тему Product Knowledge.');
 const plannerResult:ContextPlannerResult={simulation:true,topics,layers:{product:!!topics.length,team:true},assignments:{product:topics.length?assignments.product:[],team:assignments.team},rationale:[topics.length?`Темы выведены из Task #${task.tag||'без тега'} и названия задачи.`:'Product Knowledge не назначено без уверенно определённой темы.','Team Knowledge назначено узлам Implementation, Checks и Result.','Policy не выбирается Planner и разрешается отдельно по техническому scope.'],unknown:plannerUnknown};
 unknown.push(...plannerUnknown);
 const request={taskId:task.id,taskTitle:task.title,taskTag:task.tag,repository:task.repo,system,segment,workTypes:[...workTypes],flowNodes:flowNodes.map(node=>({id:node.id,name:node.name,type:node.type,revision:node.revision}))};
 const concepts=state.concepts.filter(item=>item.productId===task.productId&&item.status==='approved'&&topics.includes(item.categoryId));
 const conceptIds=new Set(concepts.map(item=>item.id));
 const approved=state.knowledge.filter(item=>item.productId===task.productId&&item.status==='approved');
 const productKnowledge=topics.length?approved.filter(item=>item.layer==='Product'&&(!item.conceptIds?.length||item.conceptIds.some(id=>conceptIds.has(id)))):[];
 const teamKnowledge=approved.filter(item=>item.layer==='Team'&&item.teamId===task.teamId);
 if(topics.length&&!productKnowledge.length)unknown.push(`Нет опубликованного Product Knowledge для тем Planner: ${topics.join(', ')}.`);
 if(!teamKnowledge.length)unknown.push('Для команды нет опубликованного Team Knowledge.');
 const fragments:ContextFragment[]=[];
 for(const item of productKnowledge)fragments.push({id:`product:${item.id}@${item.version}`,sourceId:item.id,version:item.version,kind:'product',title:item.title,content:item.content,reason:`Planner: ${topics.join(', ')} → ${assignments.product.join(', ')}`,stageIds:[...plannerResult.assignments.product],provenance:[...(item.sourceRefs||[])],status:item.status,details:{summary:item.summary,conceptIds:item.conceptIds||[]}});
 for(const item of teamKnowledge)fragments.push({id:`team:${item.id}@${item.version}`,sourceId:item.id,version:item.version,kind:'team',title:item.title,content:item.content,reason:`Planner: Team ${team?.name||task.teamId} → ${assignments.team.join(', ')}`,stageIds:[...plannerResult.assignments.team],provenance:[...(item.sourceRefs||[])],status:item.status,details:{summary:item.summary}});
 const allStageIds=flowNodes.map(node=>node.id),notApplicable:Item[]=[];
 const policyScope={segment,tag:task.tag,workTypes,artifactTypes,artifactTypesKnown:workTypes.includes('dependency_change')};
 for(const policy of state.policies.filter(item=>item.segment===segment)){
  const normalized=normalizePolicyStatus(policy.status);
  for(const requirement of policy.requirements){
   const requirementKey=`${requirement.id}@${requirement.version}`;
   const rules=policy.applicability.filter(rule=>!rule.requirement||rule.requirement===requirementKey);
   const applies=!rules.length||rules.some(rule=>policyRuleMatches(rule,policyScope));
   if(!applies){notApplicable.push({sourceId:policyKey(policy),requirement:requirementKey,reason:'tag / work type / artifact type не соответствует Applicability Rules'});continue;}
   if(isRetiredPolicyStatus(policy.status)){blocking.push(`${policyKey(policy)} выведена из эксплуатации для применимого scope ${segment}.`);continue;}
   if(!['Current','Deprecating'].includes(normalized))continue;
   const evidence=policy.evidence.find(item=>item.requirement===requirementKey);
   fragments.push({id:`policy:${policyKey(policy)}:${requirementKey}`,sourceId:policyKey(policy),version:policy.version,kind:'policy',title:requirementKey,content:requirement.text,reason:`Resolver: ${task.repo} → ${system||'system unresolved'} → ${segment||'segment unresolved'} · #${task.tag||'—'} · ${workTypes.join(', ')}`,stageIds:[...allStageIds],provenance:[requirement.references,policy.changelog].filter(Boolean),status:normalized,details:{direction:policy.direction,sunset:policy.sunset,skills:[...policy.skills],subagents:[...(policy.subagents||[])],stageAssignments:policyStageAssignments(policy),policyContext:'all_stages',evidence:evidence?copy(evidence):null,applicability:copy(rules)}});
  }
 }
 const policyFragments=fragments.filter(item=>item.kind==='policy');
 if(segment&&!policyFragments.length)blocking.push(`Нет применимых Current или Deprecating Policy Package для ${segment}.`);
 for(const fragment of policyFragments)if(fragment.status==='Deprecating')unknown.push(`${fragment.sourceId} имеет статус Deprecating${fragment.details?.sunset?` до ${fragment.details.sunset}`:''}.`);
 const stages=flowNodes.map(node=>({id:node.id,name:node.name,type:node.type,product:fragments.filter(item=>item.kind==='product'&&item.stageIds.includes(node.id)),team:fragments.filter(item=>item.kind==='team'&&item.stageIds.includes(node.id)),policy:policyFragments.filter(item=>item.stageIds.includes(node.id)),unknown:[...plannerUnknown]}));
 const artifacts=[
  {id:'diff',title:'diff',present:true,detail:`${task.repo} · ${task.base||'working revision'}`},
  {id:'manifest',title:'final dependency manifest',present:workTypes.includes('dependency_change'),detail:'Демонстрационный manifest выбранной версии'},
  {id:'registry',title:'approved registry reference',present:workTypes.includes('dependency_change'),detail:'Approved Component Registry · simulated reference'},
  {id:'compatibility',title:'compatibility report',present:true,detail:'compatibility-suite · 148 / 148 passed'},
 ];
 const observed=artifacts.filter(item=>item.present).map(item=>item.title.toLowerCase());
 const requirementFragments=[...new Map(policyFragments.map(item=>[item.title,item])).values()];
 const results=requirementFragments.map(fragment=>{
  const evidence=fragment.details?.evidence as Item|null|undefined,expected=evidence?.artifacts?evidenceParts(evidence.artifacts):[];
  const missing=expected.filter(item=>!observed.some(actual=>actual.includes(item)||item.includes(actual)));
  const status=!evidence||!evidence.verificationSkill?'INCONCLUSIVE':missing.length?'FAIL':'PASS';
  return {requirement:fragment.title,status,expected,observed:status==='PASS'?expected.filter(item=>!missing.includes(item)):observed,missing,verificationSkill:evidence?.verificationSkill||'',sourceId:fragment.sourceId};
 });
 const verificationStatus:RegulatoryVerificationPreview['status']=results.some(item=>item.status==='FAIL')?'FAIL':results.some(item=>item.status==='INCONCLUSIVE')||!results.length?'INCONCLUSIVE':'PASS';
 const route:RegulatoryVerificationPreview['route']=verificationStatus==='PASS'?'Result':verificationStatus==='FAIL'?'Rework':'Human Approval Gate';
 const verification:RegulatoryVerificationPreview={simulation:true,status:verificationStatus,route,artifacts,results};
 const taskScope={id:task.id,title:task.title,tag:task.tag,repository:task.repo,system,segment,workTypes:[...workTypes],productId:task.productId,teamId:task.teamId,capabilityId:capability?.id||'',capabilityName:capability?.name||'Fallback Flow',flowVersion:config.version,notApplicable};
 const canonical={task:taskScope,request,plannerResult,fragments,stages,verification,unknown,blocking};
 const hash=contextBundleHash(canonical);
 return {simulation:true,simulationId:`SIM-${hash.slice(4).toUpperCase()}`,task:taskScope,request,plannerResult,fragments:copy(fragments),stages:copy(stages),verification:copy(verification),unknown:[...unknown],blocking:[...new Set(blocking)],hash};
}

export function compileContextBundle(state:State,input:ContextBundleInput,meta:{id?:string;createdAt?:string;createdBy?:string}={}):ContextBundle{
 const product=state.products.find(item=>item.id===input.productId);
 const team=state.teams.find(item=>item.id===input.teamId);
 const bindings=team?.bindings.filter(binding=>binding.type==='Repository'&&binding.system===input.system)||[];
 const segments=[...new Set(bindings.map(binding=>binding.segment).filter(Boolean))] as string[];
 const segment=segments.length===1?segments[0]:'';
 const category=state.conceptCategories.find(item=>item.productId===input.productId&&item.id===input.productTopic);
 const concepts=state.concepts.filter(item=>item.productId===input.productId&&item.status==='approved'&&(input.productTopic==='all'||item.categoryId===input.productTopic));
 const conceptIds=new Set(concepts.map(item=>item.id));
 const approved=state.knowledge.filter(item=>item.productId===input.productId&&item.status==='approved');
 const productKnowledge=approved.filter(item=>item.layer==='Product'&&(input.productTopic==='all'||!item.conceptIds?.length||item.conceptIds.some(id=>conceptIds.has(id))));
 const teamKnowledge=approved.filter(item=>item.layer==='Team'&&item.teamId===input.teamId);
 const policyRows:Item[]=[];
 const blocking:string[]=[];
 for(const policy of state.policies.filter(item=>item.segment===segment)){
  const normalized=normalizePolicyStatus(policy.status);
  if(isRetiredPolicyStatus(policy.status)){
   blocking.push(`${policyKey(policy)} выведена из эксплуатации для ${segment}.`);
   continue;
  }
  if(!['Current','Deprecating'].includes(normalized))continue;
  const requirements=policy.requirements.filter(requirement=>{
   const key=`${requirement.id}@${requirement.version}`;
   const rules=policy.applicability.filter(rule=>!rule.requirement||rule.requirement===key);
   return !rules.length||rules.some(rule=>(!rule.segment||rule.segment===segment)&&workMatches(rule.workType,input.workType));
  });
  if(requirements.length)policyRows.push({...copy(policy),requirements,stages:policyStageAssignments(policy)});
 }
 const unknown:string[]=[];
 if(!product)unknown.push('Продукт не найден.');
 if(!team)unknown.push('Команда не найдена.');
 if(!bindings.length)unknown.push(`Система «${input.system||'—'}» не найдена в Resource Bindings команды.`);
 if(bindings.length&&!segment)unknown.push(`Для системы «${input.system}» не определён единый IT-сегмент.`);
 if(!productKnowledge.length)unknown.push(`Нет опубликованного Product Knowledge для темы «${category?.title||input.productTopic}».`);
 if(!teamKnowledge.length)unknown.push('Для команды пока нет опубликованного Team Knowledge.');
 if(segment&&!policyRows.length)unknown.push(`Нет применимых опубликованных Policy Package для ${segment} и ${input.workType}.`);
 const selectionReasons:Item[]=[
  ...productKnowledge.map(item=>({kind:'Product Knowledge',id:item.id,reason:`Product ${product?.name||input.productId} · тема ${category?.title||'Все знания продукта'}`})),
  ...teamKnowledge.map(item=>({kind:'Team Knowledge',id:item.id,reason:`Team ID ${team?.id||input.teamId}`})),
  ...policyRows.map(item=>({kind:'Policy Package',id:`${item.id}@${item.version}`,reason:`System ${input.system} → ${segment} · ${input.workType}`})),
  ...concepts.map(item=>({kind:'Concept',id:item.id,reason:`${category?.title||'Онтология продукта'} · ${item.variant}`})),
 ];
 const sourceVersions=[
  ...productKnowledge.map(item=>`${item.id}@${item.version}`),
  ...teamKnowledge.map(item=>`${item.id}@${item.version}`),
  ...policyRows.map(item=>`${item.id}@${item.version}`),
  ...concepts.map(item=>`${item.id}@${item.version}`),
 ].sort();
 const obligations=[...new Map(policyRows.flatMap(item=>item.requirements).map((requirement:Item)=>[`${requirement.id}@${requirement.version}`,requirement])).values()];
 const canonical={input,segment,product:{id:product?.id,name:product?.name,knowledgeVersion:product?.knowledgeVersion},team:{id:team?.id,name:team?.name,knowledgeVersion:team?.knowledgeVersion},productKnowledge,teamKnowledge,policies:policyRows,concepts,selectionReasons,sourceVersions,unknown,blocking};
 const hash=contextBundleHash(canonical);
 const agentContext=[
  `# Context Bundle · ${hash}`,
  `Product: ${product?.name||input.productId}`,
  `Team: ${team?.name||input.teamId}`,
  `System: ${input.system} → ${segment||'segment unresolved'}`,
  `Topic: ${category?.title||input.productTopic} · Work type: ${input.workType} · Stage: ${input.stage}`,
  '',
  '## Product Knowledge',
  ...productKnowledge.map(item=>`- ${item.title} (v${item.version}): ${item.summary||item.content.split('\n')[0]}`),
  '',
  '## Team Knowledge',
  ...teamKnowledge.map(item=>`- ${item.title} (v${item.version}): ${item.summary||item.content.split('\n')[0]}`),
  '',
  '## Regulatory obligations',
  ...obligations.map((requirement:Item)=>`- ${requirement.id}@${requirement.version}: ${requirement.text}`),
  ...(unknown.length?['','## Unknown',...unknown.map(item=>`- ${item}`)]:[]),
 ].join('\n');
 return {id:meta.id||'',hash,input:copy(input),segment,product:{id:product?.id||input.productId,name:product?.name||'Неизвестный продукт',knowledgeVersion:product?.knowledgeVersion||0},team:{id:team?.id||input.teamId,name:team?.name||'Неизвестная команда',knowledgeVersion:team?.knowledgeVersion||0},productKnowledge:copy(productKnowledge),teamKnowledge:copy(teamKnowledge),policies:copy(policyRows),concepts:copy(concepts),selectionReasons,sourceVersions,unknown,blocking,agentContext,createdAt:meta.createdAt||'',createdBy:meta.createdBy||'',receiptStatus:blocking.length?'blocked':unknown.length?'incomplete':'ready'};
}

export function contextGraph(state:State,productId:string,teamId:string):{nodes:Item[];links:Item[]}{
 const product=state.products.find(item=>item.id===productId),team=state.teams.find(item=>item.id===teamId);
 const nodes:Item[]=[],links:Item[]=[];
 if(product)nodes.push({id:`product:${product.id}`,label:product.name,type:'product',detail:product.description});
 if(team)nodes.push({id:`team:${team.id}`,label:team.name,type:'team',detail:'Team Knowledge и инженерные практики'});
 for(const category of state.conceptCategories.filter(item=>item.productId===productId)){
  nodes.push({id:`category:${category.id}`,label:category.title,type:'category',detail:category.description});
  if(product)links.push({source:`product:${product.id}`,target:`category:${category.id}`,label:'HAS_CATEGORY'});
 }
 for(const concept of state.concepts.filter(item=>item.productId===productId&&item.status==='approved')){
  nodes.push({id:`concept:${concept.id}`,label:concept.label,type:'concept',detail:concept.description,sourceRefs:concept.sourceRefs});
  links.push({source:`category:${concept.categoryId}`,target:`concept:${concept.id}`,label:'CONTAINS'});
 }
 for(const knowledge of state.knowledge.filter(item=>item.productId===productId&&item.status==='approved')){
  nodes.push({id:`knowledge:${knowledge.id}`,label:knowledge.title,type:'knowledge',detail:knowledge.summary||knowledge.content});
  const owner=knowledge.layer==='Team'&&knowledge.teamId?`team:${knowledge.teamId}`:`product:${productId}`;
  links.push({source:owner,target:`knowledge:${knowledge.id}`,label:'HAS_KNOWLEDGE'});
  for(const conceptId of knowledge.conceptIds||[])links.push({source:`knowledge:${knowledge.id}`,target:`concept:${conceptId}`,label:'DESCRIBES'});
 }
 const systems=new Map<string,string>();
 for(const binding of team?.bindings.filter(item=>item.type==='Repository'&&item.system)||[]){
  const id=`system:${binding.system}`;
  if(!systems.has(id)){
   systems.set(id,binding.segment||'');
   nodes.push({id,label:binding.system,type:'system',detail:`${binding.segment||'Сегмент не определён'} · ${binding.name}`});
   if(team)links.push({source:`team:${team.id}`,target:id,label:'OPERATES'});
  }
 }
 for(const policy of state.policies.filter(item=>['Current','Deprecating'].includes(normalizePolicyStatus(item.status)))){
  const id=`policy:${policyKey(policy)}`;
  nodes.push({id,label:policyKey(policy),type:'policy',detail:`${policy.direction} · ${policy.segment}`});
  for(const [systemId,segment] of systems)if(segment===policy.segment)links.push({source:id,target:systemId,label:'APPLIES_TO'});
 }
 return {nodes,links};
}
