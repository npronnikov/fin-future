import {copy,isRetiredPolicyStatus,normalizePolicyStatus,policyKey,type ContextBundle,type ContextBundleInput,type Item,type State} from './domain.ts';

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

export function compileContextBundle(state:State,input:ContextBundleInput,meta:{id?:string;createdAt?:string;createdBy?:string}={}):ContextBundle{
 const product=state.products.find(item=>item.id===input.productId);
 const team=state.teams.find(item=>item.id===input.teamId);
 const bindings=team?.bindings.filter(binding=>binding.type==='Repository'&&binding.system===input.system)||[];
 const segments=[...new Set(bindings.map(binding=>binding.segment).filter(Boolean))] as string[];
 const segment=segments.length===1?segments[0]:'';
 const variant=segment.startsWith('corporate')?'corporate':'individual';
 const category=state.conceptCategories.find(item=>item.productId===input.productId&&item.id===input.productTopic);
 const concepts=state.concepts.filter(item=>item.productId===input.productId&&item.status==='approved'&&(input.productTopic==='all'||item.categoryId===input.productTopic)&&(item.variant==='all'||item.variant===variant));
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
  if(requirements.length)policyRows.push({...copy(policy),requirements});
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
