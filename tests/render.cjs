const fs=require('fs');
const path=require('path');
const Module=require('module');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const resolve=Module._resolveFilename;
Module._resolveFilename=function(id,parent,...rest){return resolve.call(this,id.startsWith('@/')?path.join(root,id.slice(2)):id,parent,...rest)};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>{const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;module._compile(out,file)};
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {KonturContext}=require('../components/kontur/context.tsx');
const {createSeed,defaultEnvironment}=require('../lib/domain.ts');
const s=createSeed();
const fixtures=[['home','default'],['tasks','default'],['environment','default'],['settings','default'],['capabilities','CapabilityList'],['capabilities','CapabilityView'],['runs','RunView'],['runs','Automation'],['messenger','Messenger'],['assistant-bubble','default'],['knowledge','default'],['regulation','default'],['benchmark','default'],['catalog','default'],['notifications','default']];
let count=0;
for(const empty of [false,true]){for(const [file,name] of fixtures){if(empty&&['RunView','CapabilityView'].includes(name))continue;const component=require(`../components/kontur/${file}.tsx`)[name];const value={state:s,actor:s.people[2],team:empty?{id:'empty',name:'New Team',spaceId:'new-space',knowledgeVersion:1,people:[],bindings:[],environment:defaultEnvironment('New Team'),automation:null}:s.teams[0],product:s.products[0],screen:file,ref:name==='RunView'?'RUN-912':name==='CapabilityView'?'cap-dep':'',tab:'',busy:false,go:()=>{},act:async()=>({}),reload:async()=>{},can:()=>false,has:()=>false,ask:async()=>({text:''}),setScope:()=>{}};const html=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value},React.createElement(component)));if(!html.length)throw Error(`Empty ${file}:${name}`);count++}}
const {ScenarioScreen,Bootstrap,SetupGuide}=require('../components/kontur/onboarding.tsx');
const {createEmptyState}=require('../lib/domain.ts');
const {applyAction}=require('../lib/engine.ts');
let zero=createEmptyState();
const owner=zero.people.find(person=>person.id==='po');
const noop=()=>{};
const base={state:zero,actor:owner,busy:false,act:async()=>({ok:true}),setScope:noop,go:noop,onScenario:noop};
for(const [component,props] of [[ScenarioScreen,{busy:false,choose:noop}],[Bootstrap,base]]){
  if(!renderToStaticMarkup(React.createElement(component,props)).length)throw new Error('Empty entry fixture');
  count++;
}
zero=applyAction(zero,owner,'create_product',{name:'Новый продукт',description:'Создан с нуля'},'render').state;
const product=zero.products[0];
if(!renderToStaticMarkup(React.createElement(Bootstrap,{...base,state:zero,product})).length)throw new Error('Empty Product bootstrap');
count++;
const emptyTeam={id:'',name:'Команда не выбрана',spaceId:'',knowledgeVersion:1,people:[],bindings:[],environment:defaultEnvironment('Team'),automation:null};
const zeroValue={state:zero,actor:owner,team:emptyTeam,product,screen:'settings',ref:'',tab:'product',busy:false,go:noop,act:async()=>({}),reload:async()=>{},can:()=>true,has:()=>true,ask:async()=>({text:''}),setScope:noop};
const Settings=require('../components/kontur/settings.tsx').default;
const settingsHtml=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value:zeroValue},React.createElement(Settings)));
if(!settingsHtml.includes('Новый продукт'))throw new Error('Product without Team did not render');
count++;
zero=applyAction(zero,owner,'create_team',{productId:product.id,name:'Новая команда',scope:'Подготовка'},'render').state;
const Home=require('../components/kontur/home.tsx').default;
const setupHtml=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value:{...zeroValue,state:zero,actor:zero.people.find(person=>person.id==='po'),team:zero.teams[0],screen:'home',tab:''}},React.createElement(Home,{setup:true})));
if(setupHtml.includes('Открыть задачи')||setupHtml.includes('Открыть доски задач')||setupHtml.includes('Открыть доску задач'))throw new Error('Tasks action must wait until required setup is complete');
if(!setupHtml.includes('Подготовьте команду к первому запуску'))throw new Error('Setup progress not rendered');
const guideHtml=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value:{...zeroValue,state:zero,actor:zero.people.find(person=>person.id==='po'),team:zero.teams[0],screen:'settings',tab:'people'}},React.createElement(SetupGuide,{onClose:noop})));
for(const expected of ['СЛЕДУЮЩИЙ ШАГ','К плану на главной','Вы на нужном экране'])if(!guideHtml.includes(expected))throw new Error(`Setup guide missing ${expected}`);
for(const hidden of ['Рабочее пространство','Trusted Capabilities','Требуют вашего внимания','Context Supply Chain'])if(setupHtml.includes(hidden))throw new Error(`Home widget rendered before setup completion: ${hidden}`);
const completedSetupHtml=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value:{...zeroValue,state:s,actor:s.people[2],team:s.teams[0],product:s.products[0],screen:'home',tab:''}},React.createElement(Home,{setup:true})));
if(completedSetupHtml.includes('Подготовьте команду к первому запуску')||!completedSetupHtml.includes('Рабочее пространство'))throw new Error('Completed setup did not switch to Home widgets');
count++;

const checks = [
  {file:'tasks',name:'default',ref:s.boards[0].id,tab:'',contains:['Доски задач','Канбан задач','Фильтр по assignee','На проверке'],excludes:['Task Board']},
  {file:'environment',name:'default',ref:'',tab:'sandbox',contains:['Рабочее окружение','Предварительная схема Sandbox','ВНЕ SANDBOX','Конфигурация Sandbox','Оркестратор','Создано'],excludes:['Setup environment','Шаги настройки Environment','Environment готов','Следующий шаг на Home']},
  {file:'messenger',name:'Messenger',ref:'',tab:'inbox',contains:['Сообщения'],excludes:['>Messenger<']},
  {file:'knowledge',name:'default',ref:'',tab:'product',contains:['Управление знаниями'],excludes:['>Knowledge<']},
  {file:'capabilities',name:'CapabilityList',ref:'',tab:'',contains:['Доверенная автономность'],excludes:['>Capabilities<']},
  {file:'benchmark',name:'default',ref:'',tab:'lab',contains:['Бенчмарки'],excludes:['Benchmark Lab']},
  {file:'catalog',name:'default',ref:'telemetry',tab:'Flow',contains:['Каталог','Сценарии','Скиллы','Сабагенты','HG SDLC · v1','Обновление зависимостей','Соберите последовательность из блоков','Создать и настроить'],excludes:['Выберите основу Flow','Откройте детали','Выбрать процесс']},
  {file:'regulation',name:'default',ref:'',tab:'',contains:['Регуляторы','Контрольные функции','Пакет политик','Скиллы','Сабагенты','Черновик','Действует','Выводится из эксплуатации','Выведена из эксплуатации'],excludes:['>Regulation<','Control functions','Policy Package','Отозвана','Аннулирована','Заменена']},
  {file:'capabilities',name:'CapabilityView',ref:'cap-dep',tab:'releases',contains:['Тег задач','dep-update']},
  {file:'capabilities',name:'CapabilityView',ref:'cap-dep',tab:'monitoring',contains:['Тег Trusted Capability','dep-update']},
];
const appSource=fs.readFileSync(path.join(root,'components/kontur/app.tsx'),'utf8');
for(const label of ['Скрыть гид','Возобновить гид'])if(!appSource.includes(label))throw new Error(`Guide toggle missing: ${label}`);
for(const expected of ['scenario-indicator','workspace-menu','Действия рабочего пространства','Сменить сценарий данных'])if(!appSource.includes(expected))throw new Error(`Workspace menu missing: ${expected}`);
if(appSource.includes('className="scenario-switch"'))throw new Error('Scenario data indicator must not remain a dropdown button');
if(!appSource.includes('</main>{scenario===\'empty\'&&screen!==\'home\''))throw new Error('Setup guide must render after the page content');
for(const label of ['Главная','Доски задач','Сообщения','Управление знаниями','Окружение','Автономизация','Доверенная автономность','Бенчмарки','Каталог','Регуляторы'])if(!appSource.includes(`title:'${label}'`))throw new Error(`Sidebar label missing: ${label}`);
for(const label of ['Знания','Среда','Автоматизация','Возможности','Лаборатория оценок'])if(appSource.includes(`title:'${label}'`))throw new Error(`Old sidebar label remains: ${label}`);
for(const fixture of checks){
 const value={...zeroValue,state:s,actor:s.people[2],team:s.teams[0],product:s.products[0],screen:fixture.file,ref:fixture.ref,tab:fixture.tab};
 const component=require(`../components/kontur/${fixture.file}.tsx`)[fixture.name];
 const html=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value},React.createElement(component)));
 for(const expected of fixture.contains)if(!html.includes(expected))throw new Error(`Missing ${expected}: ${fixture.file}/${fixture.tab}`);
 for(const removed of fixture.excludes||[])if(html.includes(removed))throw new Error(`Unexpected ${removed}: ${fixture.file}/${fixture.tab}`);
 if(html.includes('Task Class'))throw new Error(`Task Class entity leaked into ${fixture.file}/${fixture.tab}`);
 if(fixture.file==='tasks'&&(html.includes('Задачи добавлены на доску')||html.includes('Следующий шаг — выбрать Flow')))throw Error('Removed board onboarding section remains');
 if(fixture.file==='tasks'&&(html.match(/class="kanban-column-head"/g)||[]).length!==5)throw new Error('Kanban should have five columns');
 if(fixture.file==='environment'){
  const provisionButtons=[...html.matchAll(/<button\b[^>]*data-action="provision"[^>]*>/g)].map(match=>match[0]);
  if(!provisionButtons.length||provisionButtons.some(button=>!button.includes('disabled=""'))||!html.includes('Создано'))throw new Error('Provision action must be disabled after Environment creation');
 }
 count++;
}

const Environment=require('../components/kontur/environment.tsx').default;
const configuredTeam={...s.teams[0],environment:{...s.teams[0].environment,status:'configured'}};
const configuredEnvironmentHtml=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value:{...zeroValue,state:s,actor:s.people[1],team:configuredTeam,product:s.products[0],screen:'environment',tab:'sandbox',can:()=>true}},React.createElement(Environment)));
const configuredProvisionButton=[...configuredEnvironmentHtml.matchAll(/<button\b[^>]*data-action="provision"[^>]*>/g)][0]?.[0]||'';
if(!configuredProvisionButton||configuredProvisionButton.includes('disabled=""')||!configuredEnvironmentHtml.includes('Создать'))throw new Error('Provision action must remain enabled for a saved configuration that is not ready');
count++;

const Knowledge=require('../components/kontur/knowledge.tsx').default;
const knowledgeStages={
 overview:['Task → Planner → Resolver → Flow → Verification','Probabilistic planning','Deterministic Policy resolution','Product variant не равен IT-сегменту'],
 segmentation:['Техническая система','Как возник сегмент'],
 policy:['POLICY SELECTION','IS-corporate-backend@8'],
 ontology:['Онтология продукта','Что такое аккредитив'],
 publication:['Продуктовое и командное знание','Аккредитив · каноническая модель продукта'],
 graph:['Исследователь графа','Готовые Cypher-запросы'],
 delivery:['Delivery Trace','LLM simulation','Сформировать Context Request','DETERMINISTIC RESOLVER','Product Knowledge','Team Knowledge','Regulatory Policy','Analyze','Checks','Result','Инспектор узла','Regulatory Verification','Simulation snapshot','не создаёт Run, Gate или фактическую доставку'],
};
for(const [tab,expectedItems] of Object.entries(knowledgeStages)){
 const value={...zeroValue,state:s,actor:s.people[2],team:s.teams[0],product:s.products[0],screen:'knowledge',tab};
 const html=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value},React.createElement(Knowledge)));
 for(const expected of expectedItems)if(!html.includes(expected))throw new Error(`Knowledge stage ${tab} missing ${expected}`);
 for(const expected of ['МАРШРУТ CONTEXT SUPPLY CHAIN','На главную','Назад','Дальше'])if(!html.includes(expected))throw new Error(`Knowledge guide ${tab} missing ${expected}`);
 if(html.indexOf('context-journey-guide')<html.indexOf('context-route-layout'))throw new Error(`Knowledge guide ${tab} must render below the route content`);
 for(const step of ['Обзор','Сегментация систем','Policy Package','Онтология аккредитива','Публикация знаний','Граф знаний','Доставка агенту'])if(!html.includes(step))throw new Error(`Knowledge route ${tab} missing step ${step}`);
 count++;
}
const hiddenKnowledgeGuide=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value:{...zeroValue,state:s,actor:s.people[2],team:s.teams[0],product:s.products[0],screen:'knowledge',tab:'overview'}},React.createElement(Knowledge,{guideOpen:false})));
if(hiddenKnowledgeGuide.includes('МАРШРУТ CONTEXT SUPPLY CHAIN'))throw new Error('Closed Context Supply Chain guide remains visible');
const docsSource=fs.readFileSync(path.join(root,'public/docs/kontur-architecture.html'),'utf8');
for(const expected of ['#/context-supply-chain','#/accreditive','#/context-service-api','Промышленная архитектура','POST /api/context/compile','Neo4j','Принципиальные гарантии','Глоссарий','Источники','LLM Context Planner','deterministic Resolver','Context Stage Slice','PASS → Result','FAIL → Rework','INCONCLUSIVE → Human Approval Gate','демонстрация без runtime-интеграции','не создаёт Run или Gate'])if(!docsSource.includes(expected))throw new Error(`Documentation missing ${expected}`);


const {copy,defaultConfig,getFlowNodes,currentRelease}=require('../lib/domain.ts');
const FlowEditor=require('../components/kontur/flow-editor.tsx').default;
const Configuration=require('../components/kontur/configuration.tsx').default;
const flowValue={...zeroValue,state:s,actor:s.people[2],team:s.teams[0],product:s.products[0],screen:'capability',ref:'cap-statement',tab:'configuration'};
const flowStateBefore=JSON.stringify(s);
for(const capabilityId of ['cap-statement','cap-dep']){
 const cap=s.capabilities.find(capability=>capability.id===capabilityId);
 const source=cap.draft||currentRelease(cap).snapshot.config;
 const html=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value:{...flowValue,ref:capabilityId}},React.createElement(Configuration,{cap})));
 for(const expected of ['Редактор Flow','Настройки выбранного узла','Настроить','Skills','Subagents','Контур и доступы','Запустить задачу','Общие настройки Flow','Название Flow','Описание Flow','Экономика','Модель Flow','Лимит токенов на задачу'])if(!html.includes(expected))throw Error(`Flow Configuration ${capabilityId} missing ${expected}`);
 for(const removed of ['<h2>Общие инструкции</h2>','<h2>Human Gates</h2>','<h2>Skills</h2>','<h2>Resource scope</h2>','<h2>Model &amp; limits</h2>'])if(html.includes(removed))throw Error(`Removed settings section remains: ${removed}`);
 if((html.match(/class="workflow-node-card /g)||[]).length!==source.nodes.length)throw Error(`Flow Configuration ${capabilityId}: graph nodes do not match configuration`);
 if(!cap.draft&&(!html.includes('READ ONLY')||!html.includes('Новая версия')||!html.includes('Released configuration')))throw Error('Released Configuration must expose read-only graph and new-version path');
 if(cap.draft&&!html.includes('Настройки узлов готовы к сохранению'))throw Error('Legacy draft needs explicit materialization indication');
 count++;
}
if(JSON.stringify(s)!==flowStateBefore)throw Error('Reading Flow configuration mutated state or legacy frozen snapshot');

for(const runtime of ['HG SDLC','AI Manager']){
 const config=defaultConfig('dep-update',runtime);
 config.nodeConfigs=getFlowNodes(config);
 const invalid=runtime==='HG SDLC';
 if(invalid)config.nodeConfigs.find(node=>node.executor==='agent').instructions='';
 const html=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value:flowValue},React.createElement(FlowEditor,{config,savedConfig:copy(config),flowName:'Проверочный Flow',ownerTeam:s.teams[0],onNameChange:()=>{},editable:true,busy:false,dirty:true,onChange:()=>{},onSave:async()=>true})));
 if(!html.includes('Кодинг-агент'))throw Error(`Wrong executor names for ${runtime}`);
 if(invalid&&!html.includes('Проверьте Flow перед сохранением'))throw Error('Invalid node instructions should show actionable validation');
 if(!html.includes('До запуска')||!html.includes('После запуска'))throw Error('System stages must remain on the Flow graph');
 if(!html.includes('Добавить шаг')||!html.includes('Показать Flow целиком'))throw Error('Flow structure and viewport controls missing');
 count++;
}
const bootstrapMarkup=renderToStaticMarkup(React.createElement(Bootstrap,base));
if(bootstrapMarkup.includes('>Метрики<'))throw Error('Product creation must not request metrics');
const peopleMarkup=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value:{...flowValue,screen:'settings',tab:'people'}},React.createElement(Settings)));
if(!peopleMarkup.includes('Permissions')||peopleMarkup.includes('>Assignments<'))throw Error('People must use Permissions wording');
const Messenger=require('../components/kontur/messenger.tsx').Messenger;
const inboxMarkup=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value:{...flowValue,screen:'messenger',tab:'inbox'}},React.createElement(Messenger)));
if(inboxMarkup.includes('Lifecycle notifications')||inboxMarkup.includes('Ask Assistant'))throw Error('Messenger must contain messages rather than notification or assistant controls');
for(const expected of ['Каналы','Поиск сообщений','Сообщение в Messenger','КОНТУР · Automation','Approval required','Ожидает решения','Открыть в автоматизации'])if(!inboxMarkup.includes(expected))throw Error(`Messenger missing ${expected}`);
count+=3;

const {Automation,RunView}=require('../components/kontur/runs.tsx');
const gateAutomation=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value:{...flowValue,screen:'automation',ref:'',tab:'gates'}},React.createElement(Automation)));
if(!gateAutomation.includes('HUMAN INPUT')||!gateAutomation.includes('HUMAN APPROVAL'))throw Error('Assigned gate controls must be available in Automation');
if(gateAutomation.includes('Ask Assistant')||gateAutomation.includes('Return to'))throw Error('Removed gate controls remain');
count++;
const originalRun=s.runs.find(run=>run.id==='RUN-912'),pending=originalRun.gates.at(-1);
const taken=applyAction(s,s.people.find(person=>person.id==='engineer'),'gate_decision',{runId:originalRun.id,gateId:pending.id,gateRevision:pending.revision,artifactRevision:pending.artifactRevision,decision:'takeover',comment:'Правка проекта в IDE'},'render').state;
const takeoverHtml=renderToStaticMarkup(React.createElement(KonturContext.Provider,{value:{...flowValue,state:taken,screen:'run',ref:'RUN-912',tab:'timeline'}},React.createElement(RunView)));
for(const expected of ['Комментарии','Вернуть управление','Идите в IDE и редактируйте проект там'])if(!takeoverHtml.includes(expected))throw Error(`Takeover missing ${expected}`);
for(const removed of ['Workspace artifacts','Выполнить checks','Ask Assistant','Run Assistant'])if(takeoverHtml.includes(removed))throw Error(`Removed Takeover control remains: ${removed}`);
count++;
console.log(`Rendered ${count} populated, zero-state and setup screen fixtures without runtime errors.`);
