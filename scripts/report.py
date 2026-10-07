"""Generate a conservative acceptance matrix from actual raw reports.
Run after npm test and the browser suite. Does not mark an entire TS criterion
passed just because a similarly named unit test exists.
"""
from pathlib import Path
from datetime import datetime, timezone
import json,re,hashlib,platform,html,base64,subprocess
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'reports'
plan=json.loads((ROOT/'docs/acceptance-plan.json').read_text())
tap=(R/'node-final.tap').read_text();ui=json.loads((R/'browser-results.json').read_text())
node_total=int(re.search(r'^# tests (\d+)$',tap,re.M)[1]);node_pass=int(re.search(r'^# pass (\d+)$',tap,re.M)[1]);node_fail=int(re.search(r'^# fail (\d+)$',tap,re.M)[1])
node_names=re.findall(r'^# Subtest: (.+)$',tap,re.M)
evidence={c['id']:[] for c in plan['criteria']}
for name in node_names:
 for ts in re.findall(r'TS-\d{3}',name):
  if ts in evidence:evidence[ts].append({'type':'node-http-domain','test':name,'raw':'node-final.tap','status':'passed' if node_fail==0 else 'see-raw'})
ui_map={1:[1,2],2:[5,6],3:[19,23],4:[31,35,36,41,44,45],5:[51,56,57],6:[61,66,68],7:[67,91],8:[77,78,79],9:[44,62,92,93,95],10:[96]}
for row in ui['results']:
 n=int(row['name'].split(':')[0].replace('UI-',''))
 for i in ui_map.get(n,[]):evidence[f'TS-{i:03}'].append({'type':'ui-http-bridge' if 'bridge' in ui['mode'] else 'native-browser','test':row['name'],'raw':'browser-results.json','status':row['status']})
# Only narrowly established results are marked passed. Other criteria retain
# planned/blocked even where substantial implementation and API evidence exist.
passed={1,2,3,5,6,8,10,15,16,20,22,25,26,29,30,31,32,33,34,35,36,37,38,41,43,46,47,48,49,50,52,53,54,55,56,59,61,63,64,65,66,67,68,70,72,73,74,77,78,79,81,82,83,84,85,86,87,89,91,95,96,97,98,100}
blocked={4,39,88,90,99}
notes={
4:'Поля/stage и backend restart проверены. Browser reload/sessionStorage на native origin не проверены.',
7:'Backend network failure/recovery проверен; UI fault injection + recovery не пройден сквозным тестом.',
9:'Cancel backend проверен; полный UI-журнал расходов при отмене не испытан.',
11:'Ready Installation/версия/controls есть; самостоятельный UI-путь HG подтверждён, полнота bindings проверена частично.',
12:'Agent-platform backend и разные планы работают; полный UI setup/team route не испытан.',
13:'Frontier явно mock-connection в каталоге/API. Открытие этого конкретного каталожного пути не протестировано через UI.',
14:'Custom composition и single-owner validation реализованы; полноценный портовый редактор/conformance частичны.',
17:'Connection failure/retry/backend блокировка работают; UI failure/recovery не испытаны.',
18:'Installation revision pin проверен; удаление/drain и все несовместимые обновления не реализованы.',
21:'Actor identity/owner/memory есть, API проверен; полный UI create/template contract не испытан.',
23:'Один граф используется Studio/runtime; Actor/Hybrid и полный shared dependency contract ограничены.',
24:'Draft revision/node/edge/actor save проверены API; полный UI edit sequence не испытан.',
27:'JSON metadata round-trip проверен API. Полный пользовательский import/open/export на native browser не испытан.',
28:'Невалидный graph не затирает сохранённую модель. Unsaved local draft import error не проверен UI-тестом.',
39:'Автономный backend scheduler проверен без UI; закрытие/повторное открытие native-origin вкладки заблокировано стендом.',
40:'Разные bounded team plans, child runs и budget проверены API. Полный набор parallel/join политик не испытан.',
42:'Mentions/thread связь проверены API; полный UI reply/notification маршрут не испытан.',
44:'Один компонент/gate model используется в треде и Inbox. Полное cross-view сравнение package digest отдельным assertion не выполнено.',
45:'Composer draft сохранялся через Workbench; scroll и фильтр одновременно не проверены.',
51:'Identity/revision/digest checks и approvals исполняются; полный пакет provenance для всех сценариев не проверен.',
57:'Факт/остаток/оценка и human time отображаются; UI всех reservation states не испытан.',
58:'Takeover epoch/checkpoint/human lease протестированы API; сквозной UI путь и все drains не проверены.',
60:'Return/peer reviewer проверены API; все recovery/lease expiration сценарии не испытаны.',
62:'Кнопка «Не сохранять» пройдена UI; отдельное сравнение количества Knowledge entities до/после не выполнено.',
69:'Версии/точные snapshot consumers реализованы. Fixture с двумя consumers/releases не выполнен.',
71:'Конфигурация/track закреплены; часть evaluation basket остаётся declared-policy-fixtures, не отдельными executions.',
75:'Workflow candidate/UAT работают; полный resolved lock для всех типов instructions/harness/subagents ограничен.',
76:'Team manifest содержит coordinator/routing/roles/limits; admission/UAT проверяет только один класс. Многоклассовый допуск не реализован.',
80:'Три коллекции/вкладки и разные права есть; PlatformRelease ограничен draft, полный процесс не выполнен.',
88:'Сохранение gate/challenge/jobs после Node restart проверено API; native browser/per-session восстановление не испытано.',
90:'Настоящий HTTP SSE replay/scope/session invalidation проверен Node tests. Native EventSource браузера в этой среде не испытан.',
92:'Rework на 390 px, controls и сохранение текста проверены; fixture с действительно большим diff не выполнен.',
93:'Escape, возврат фокуса и Tab внутри Workbench проверены. Полный keyboard-only путь формы→диалог→approval не пройден.',
94:'Revision conflict проверен API; local draft/rebase UI реализован, но two-editor browser scenario не испытан.',
99:'Проверка окончательного ZIP проводится ПОСЛЕ упаковки и публикуется отдельно в kontur-teamspace-v6-release-check.json. Native-origin browser QA ограничен стендом.',
100:'Raw результаты, проверенная среда, ограничения и непроверенные критерии представлены. Зелёный API test не приравнен к полной приёмке.'}
criteria=[]
for c in plan['criteria']:
 n=int(c['id'][3:]);ev=evidence[c['id']]
 status='passed' if n in passed else 'blocked' if n in blocked else 'planned'
 if status=='passed' and n!=100 and (not ev or not all(e['status']=='passed' for e in ev)):status='planned'
 if node_fail:status='planned' if status=='passed' else status
 criteria.append({**c,'status':status,'evidence':ev,'note':notes.get(n,'Проверен указанный результат внутри локального mock-прототипа. Это не production-сертификация.' if status=='passed' else 'Есть реализация/частичные API evidence; весь исходный критерий не подтверждён сквозным прогоном.')})
counts={k:sum(c['status']==k for c in criteria) for k in ['passed','planned','blocked','failed']}
report={'specVersion':'6.0','build':'6.0.0-prototype.1','status':'partial-acceptance-not-complete','generatedAt':datetime.now(timezone.utc).isoformat(),'environment':{'node':subprocess.check_output(['node','-v'],text=True).strip(),'npm':subprocess.check_output(['npm','-v'],text=True).strip(),'os':platform.platform(),'browser':ui['browser'],'react':'16.0.0','reactDOM':'16.0.1','typescript':'5.8.3'},'commands':71,'results':{'node':{'tests':node_total,'passed':node_pass,'failed':node_fail,'raw':'node-final.tap'},'browser':{'tests':len(ui['results']),'passed':sum(r['status']=='passed' for r in ui['results']),'failed':sum(r['status']=='failed' for r in ui['results']),'mode':ui['mode'],'raw':'browser-results.json','pageErrors':ui['pageErrors']},'typecheck':{'status':'passed' if 'Typecheck passed' in (R/'typecheck-final.log').read_text() else 'failed','raw':'typecheck-final.log'},'build':{'status':'passed' if 'standalone server' in (R/'build-final.log').read_text() else 'failed','raw':'build-final.log'}},'acceptanceCounts':counts,'sourceChecksums':{name:hashlib.sha256((ROOT/'docs'/name).read_bytes()).hexdigest() for name in ['specification-v6.html','acceptance-plan.json']},'limitationsFile':'../docs/LIMITATIONS.md','browserLimitations':ui['limitations'],'archiveVerification':'Published separately after final ZIP creation: kontur-teamspace-v6-release-check.json','criteria':criteria}
(R/'release-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
(R/'acceptance-results.json').write_text(json.dumps({'specVersion':'6.0','status':report['status'],'counts':counts,'criteria':criteria},ensure_ascii=False,indent=2))
E=html.escape
rows=''.join(f"<tr><td><b>{c['id']}</b><small>{E(c['group'])}</small></td><td>{E(c['title'])}<p>{E(c['then'])}</p></td><td><span class='badge {c['status']}'>{c['status']}</span></td><td>{E(c['note'])}<details><summary>Evidence · {len(c['evidence'])}</summary>{''.join('<p>'+E(e['test'])+'<small>'+E(e['type'])+' · '+E(e['status'])+'</small></p>' for e in c['evidence'])}</details></td></tr>" for c in criteria)
screens=''
for name,title in [('13-my-day.png','Рабочая среда'),('05-review-desktop.png','Human Workbench'),('10-release.png','Допуск и размещение')]:
 p=R/'screenshots'/name
 if p.exists():screens+=f"<figure><img alt='{title}' src='data:image/png;base64,{base64.b64encode(p.read_bytes()).decode()}'/><figcaption>{title} · screenshot выполненного UI-прогона через HTTP-мост</figcaption></figure>"
uirows=''.join(f"<p><b>{E(r['name'])}</b><span class='badge {r['status']}'>{r['status']}</span> {r.get('durationMs','—')} ms</p>" for r in ui['results'])
style="""*{box-sizing:border-box}body{margin:0;font:15px/1.65 system-ui,Segoe UI,sans-serif;background:#f4f6f1;color:#203e32}main{max-width:1200px;margin:auto;padding:30px 24px}header{background:#234d3b;color:white;padding:34px;border-radius:18px}h1{font-size:36px;line-height:1.15;margin:10px 0}h2{font-size:24px;margin:0 0 15px}h3{margin:0 0 10px}header small{letter-spacing:2px;color:#d5e6b8}header p{max-width:880px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:20px 0}.card,section{background:white;border:1px solid #dce5d7;border-radius:14px;padding:24px;margin-bottom:20px}.cards .card{margin:0}.card strong{font-size:34px;display:block}.card small{display:block;color:#526b59}.warning{background:#fff7e4;border:1px solid #ead29e;border-radius:10px;padding:18px}.badge{display:inline-block;padding:3px 9px;border-radius:5px;background:#edf1e9;font-size:12px;margin:0 8px}.passed{background:#dfedcf}.blocked{background:#fff1ce}.planned{background:#edf1e9}.failed{background:#f9dcd4}.scroll{overflow:auto}table{border-collapse:collapse;min-width:850px;width:100%;font-size:13px}td,th{text-align:left;border-bottom:1px solid #dbe5d8;padding:14px;vertical-align:top}th{background:#edf3e7}td small,small{display:block}td small{font-size:11px;color:#698169}td p{margin:8px 0;color:#4d6553}td:first-child{width:130px}td:nth-child(2){width:260px}details{margin-top:8px}a{color:#276347}code,pre{font-family:monospace}pre{background:#eff3e9;border-radius:8px;padding:16px;overflow:auto}figure{margin:20px 0}img{width:100%;border:1px solid #d7e2d3;border-radius:12px}figcaption{font-size:12px;color:#526b59}.raw{display:flex;flex-wrap:wrap;gap:20px}@media(max-width:700px){main{padding:15px}.cards{grid-template-columns:1fr 1fr}header,section{padding:21px}h1{font-size:28px}}"""
body=f"""<!doctype html><html lang='ru'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>КОНТУР · отчёт о проверках 6.0</title><style>{style}</style><main><header><small>КОНТУР / TEAM SPACE / RELEASE EVIDENCE</small><h1>Рабочая сборка.<br>Проверяемые границы.</h1><p>React + Node.js mock-приложение по спецификации 6.0. {node_pass} серверных проверок пройдены; {report['results']['browser']['passed']} браузерных сценариев пройдены через HTTP-мост. Полная приёмка не завершена.</p></header><div class='cards'><div class='card'><strong>{node_pass}/{node_total}</strong><small>Node API/domain/recovery tests</small></div><div class='card'><strong>{report['results']['browser']['passed']}/{len(ui['results'])}</strong><small>UI-сценарии · HTTP bridge</small></div><div class='card'><strong>71</strong><small>Серверных command types</small></div><div class='card'><strong>{counts['passed']}/100</strong><small>Критериев отмечено passed</small></div></div><section><h2>Запуск</h2><pre>cd kontur-teamspace\nnpm start</pre><p>Node.js 22.16.0. Открыть <code>http://127.0.0.1:4310</code>. Готовый dist включён; npm install и интернет для запуска не требуются.</p><div class='warning'><b>Это не production-система и не закрытие всех TS-критериев.</b> PlatformRelease ограничен draft. Team admission — один класс. Полный conformance собственной сборки, нагрузочная приёмка и ряд UX-путей остаются непроверенными/частичными. <a href='../docs/LIMITATIONS.md'>Полные ограничения</a>.</div></section><section><h2>Метод проверки</h2><p>Настоящий Node HTTP сервер и сохраняемые данные. Browser UI выполнялся в {E(ui['browser'])}. Стенд блокирует навигацию на HTTP-origin; UI загружался через about:blank и HTTP bridge. Подмена предметного состояния через DevTools в центральных UI-сценариях не использовалась.</p><p><b>Bridge не доказывает native browser cookies, sessionStorage reload или EventSource reconnect.</b> Нативный серверный SSE, scoped reads, session invalidation и restart проверены Node HTTP tests. Проверка окончательного ZIP публикуется отдельно после упаковки.</p><p>Среда: {E(report['environment']['os'])}; Node {E(report['environment']['node'])}; npm {E(report['environment']['npm'])}.</p><div class='raw'><a href='node-final.tap'>Raw Node TAP</a><a href='browser-results.json'>Raw browser JSON</a><a href='build-final.log'>Build log</a><a href='typecheck-final.log'>Typecheck log</a><a href='acceptance-results.json'>100 критериев JSON</a></div></section><section><h2>Выполненные UI-сценарии</h2>{uirows}</section><section><h2>Скриншоты приложения</h2>{screens}</section><section><h2>Матрица приёмки</h2><p>Passed: {counts['passed']}; planned: {counts['planned']}; blocked: {counts['blocked']}. Частичный API test не закрывает весь UI-критерий. Статусы и ограничения ниже важнее числа успешных тестов.</p><div class='scroll'><table><thead><tr><th>ID / группа</th><th>Критерий</th><th>Статус</th><th>Область доказательства / ограничения</th></tr></thead><tbody>{rows}</tbody></table></div></section><p>Сформировано {E(report['generatedAt'])}. Синтетическая эмуляция; никакие реальные клиентские данные или внешние сервисы не использованы.</p></main></html>"""
(R/'release-report.html').write_text(body)
print(json.dumps({'node':report['results']['node'],'browser':report['results']['browser'],'acceptance':counts},ensure_ascii=False,indent=2))
