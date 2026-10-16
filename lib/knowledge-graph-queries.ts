import type {Item,State} from './domain.ts';

export type KnowledgeGraphQueryId='product'|'team'|'relations'|'implementation';

export interface KnowledgeGraphQueryPreset{
 id:KnowledgeGraphQueryId;
 title:string;
 description:string;
 cypher:string;
}

export const KNOWLEDGE_GRAPH_QUERIES:Record<KnowledgeGraphQueryId,KnowledgeGraphQueryPreset>={
 product:{
  id:'product',
  title:'Опубликованные знания продукта',
  description:'Только опубликованный слой Product Knowledge текущего продукта.',
  cypher:`MATCH (p:Product {id: $productId})-[:HAS_KNOWLEDGE]->(k:Knowledge)
WHERE k.status = 'approved' AND k.layer = 'Product'
RETURN k`,
 },
 team:{
  id:'team',
  title:'Практики текущей команды',
  description:'Опубликованные инженерные практики выбранной команды.',
  cypher:`MATCH (t:Team {id: $teamId})-[:HAS_KNOWLEDGE]->(k:Knowledge)
WHERE k.status = 'approved'
RETURN k`,
 },
 relations:{
  id:'relations',
  title:'Знания и связанные понятия',
  description:'Опубликованные знания текущего scope и понятия, которые они описывают.',
  cypher:`MATCH (k:Knowledge)-[:DESCRIBES]->(c:Concept)
WHERE k.productId = $productId AND k.status = 'approved'
RETURN k, c`,
 },
 implementation:{
  id:'implementation',
  title:'Контекст для Implementation',
  description:'Опубликованные знания продукта и команды, доступные для планирования доставки.',
  cypher:`MATCH (owner)-[:HAS_KNOWLEDGE]->(k:Knowledge)
WHERE owner.id IN [$productId, $teamId]
  AND k.status = 'approved'
RETURN k`,
 },
};

export const KNOWLEDGE_GRAPH_QUERY_ORDER:KnowledgeGraphQueryId[]=['product','team','relations','implementation'];

function knowledgeRow(item:Item):Item{
 return {id:`knowledge:${item.id}`,sourceId:item.id,type:'knowledge',label:item.title,detail:item.summary||item.content,layer:item.layer,version:item.version};
}

function conceptRow(item:Item):Item{
 return {id:`concept:${item.id}`,sourceId:item.id,type:'concept',label:item.label,detail:item.description,version:item.version};
}

export function runKnowledgeGraphQuery(state:State,queryId:KnowledgeGraphQueryId,productId:string,teamId:string):Item[]{
 const approved=state.knowledge.filter(item=>item.productId===productId&&item.status==='approved');
 const inScope=approved.filter(item=>item.layer==='Product'||item.teamId===teamId);
 if(queryId==='product')return approved.filter(item=>item.layer==='Product').map(knowledgeRow);
 if(queryId==='team')return approved.filter(item=>item.layer==='Team'&&item.teamId===teamId).map(knowledgeRow);
 if(queryId==='implementation')return inScope.map(knowledgeRow);
 const conceptIds=new Set(inScope.flatMap(item=>item.conceptIds||[]));
 return [
  ...inScope.filter(item=>(item.conceptIds||[]).some(id=>conceptIds.has(id))).map(knowledgeRow),
  ...state.concepts.filter(item=>item.productId===productId&&item.status==='approved'&&conceptIds.has(item.id)).map(conceptRow),
 ];
}

export function knowledgeGraphQueryParams(productId:string,teamId:string,segment='',stage='Implementation'):Item{
 return {productId,teamId,segment:segment||'unknown',stage};
}
