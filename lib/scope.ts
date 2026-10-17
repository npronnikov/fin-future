import {copy,releaseRiskAssessment,type State,type Person,type Item} from './domain.ts';

export function resolveScope(state: State, actor: Person, preferredProduct = '', preferredTeam = '') {
  const available = state.responsibilities.filter(link =>
    state.products.some(product => product.id === link.productId) &&
    state.teams.some(team => team.id === link.teamId) &&
    (actor.role === 'Regulator' || actor.teams.includes(link.teamId)));
  const product = state.products.find(product => product.id === preferredProduct)
    || state.products.find(product => product.id === available[0]?.productId)
    || state.products[0];
  if (!product) return {productId: '', teamId: ''};
  const link = available.find(link => link.productId === product.id && link.teamId === preferredTeam)
    || available.find(link => link.productId === product.id);
  return {productId: product.id, teamId: link?.teamId || ''};
}

/** Only response data is projected; mutations and snapshots in storage use the full state. */
export function projectStateForActor(source:State,actor:Person):State{
 const state=copy(source),teamIds=new Set(actor.teams);
 const productIds=new Set(source.responsibilities.filter(link=>teamIds.has(link.teamId)).map(link=>link.productId));
 for(const product of source.products)if(product.owner===actor.id||actor.role==='Regulator')productIds.add(product.id);
 state.products=state.products.filter(product=>productIds.has(product.id));
 state.teams=state.teams.filter(team=>teamIds.has(team.id)||source.responsibilities.some(link=>link.teamId===team.id&&productIds.has(link.productId)));
 state.responsibilities=state.responsibilities.filter(link=>productIds.has(link.productId));
 state.boards=state.boards.filter(board=>teamIds.has(board.teamId));
 const boardIds=new Set(state.boards.map(board=>board.id));
 state.tasks=state.tasks.filter(task=>teamIds.has(task.teamId)&&boardIds.has(task.boardId));
 const taskIds=new Set(state.tasks.map(task=>task.id));
 state.runs=state.runs.filter(run=>teamIds.has(run.teamId)&&(taskIds.has(run.taskId)||run.uat));
 const runIds=new Set(state.runs.map(run=>run.id));
 state.capabilities=state.capabilities.filter(cap=>productIds.has(cap.productId));
 state.suites=state.suites.filter(suite=>teamIds.has(suite.teamId));
 state.benchmarks=state.benchmarks.filter(benchmark=>teamIds.has(benchmark.teamId));
 const benchmarkIds=new Set(state.benchmarks.map(benchmark=>benchmark.id));
 // Frozen execution fields remain intact. Only private history links are hidden in response copies.
 const hidePrivateRefs=(snapshot:State['runs'][number]['snapshot'])=>{
  snapshot.historyRefs=snapshot.historyRefs.filter(id=>runIds.has(id));
  snapshot.benchmarkRefs=snapshot.benchmarkRefs.filter(id=>benchmarkIds.has(id));
  if(snapshot.testBaskets)snapshot.testBaskets=snapshot.testBaskets.filter(basket=>teamIds.has(basket.teamId));
 };
 for(const run of state.runs)hidePrivateRefs(run.snapshot);
 for(const cap of state.capabilities)for(const release of cap.releases){
  const original=source.capabilities.find(item=>item.id===cap.id)?.releases.find(item=>item.id===release.id);
  if(original)release.riskAssessment=releaseRiskAssessment(source,original);
  hidePrivateRefs(release.snapshot);
  if(release.uat&&!runIds.has(release.uat.runId))release.uat.runId='';
 }
 for(const benchmark of state.benchmarks)if(benchmark.snapshot)hidePrivateRefs(benchmark.snapshot);
 state.notifications=state.notifications.filter(notice=>teamIds.has(notice.teamId)&&(notice.target!=='run'||runIds.has(notice.ref)));
 state.messages=state.messages.filter(message=>runIds.has(message.thread)||[...teamIds].some(teamId=>message.thread===`team-${teamId}`)||actor.role==='Regulator'&&message.assigneeId===actor.id&&message.thread===`regulator-${actor.id}`);
 state.knowledge=state.knowledge.filter(item=>productIds.has(item.productId)&&(!item.teamId||teamIds.has(item.teamId)));
 for(const item of state.knowledge)if(item.sourceRun&&!runIds.has(item.sourceRun))delete item.sourceRun;
 state.initiatives=state.initiatives.filter(item=>item.teamId?teamIds.has(item.teamId):(item.taskIds||[]).some((id:string)=>taskIds.has(id)));
 for(const item of state.initiatives)item.taskIds=(item.taskIds||[]).filter((id:string)=>taskIds.has(id));
 state.audit=state.audit.filter(item=>item.scope?.teamId?teamIds.has(item.scope.teamId):item.actor===actor.id);
 if(actor.role==='Regulator')state.policies=state.policies.filter(policy=>actor.directions?.includes(policy.direction));
 return state;
}
/** Bulk completion counts span the product; individual task links stay within team membership. */
export function projectActionResult(result:Item|undefined,actor:Person):Item|undefined{
 if(!result||!Array.isArray(result.results))return result;
 const output=copy(result),visible=output.results.filter((row:Item)=>actor.teams.includes(row.teamId));
 output.hiddenCount=output.results.length-visible.length;
 output.results=visible;
 output.runIds=visible.filter((row:Item)=>row.runId).map((row:Item)=>row.runId);
 return output;
}
