# Task-driven Context Delivery Trace

Дата: 2026-10-15  
Статус: согласованное направление, ожидает финального просмотра перед реализацией

## 1. Цель

Обновить демонстрационный Context Supply Chain так, чтобы он показывал не только публикацию и выбор регуляторных требований, а полный понятный путь контекста конкретной задачи:

`Task → LLM Context Request → deterministic Resolver → Flow nodes → Regulatory Verification`.

Пользователь должен видеть, какие фрагменты Product Knowledge, Team Knowledge и Regulatory Policy были запрошены, почему выбраны и в какие узлы Flow они демонстрационно передаются.

## 2. Границы работы

В scope входят:

- переработка экрана «Доставка агенту» в task-driven Delivery Trace;
- демонстрация запроса к LLM Context Planner и его структурированного ответа;
- детерминированный отбор точных опубликованных фрагментов из существующего state;
- распределение контекста по узлам выбранного Flow;
- обязательная Regulatory Policy lane во всех применимых узлах;
- финальная демонстрационная Regulatory Verification;
- открытие и сравнение сохранённых simulation snapshots;
- обновление обзора Context Supply Chain, документации, render- и domain-тестов;
- обновление production-сборки `dist` обычной командой build.

В scope не входят:

- подключение реального LLM-провайдера;
- изменение фактического исполнения Run, Capability snapshot или Regulatory Plan;
- создание настоящих Human Gates из Delivery Trace;
- сохранение `contextBundleId` в реальный Run;
- юридическая интерпретация требований;
- внешний Context Service, vector database или Neo4j.

Интерфейс обязан явно называть операцию симуляцией и не создавать впечатление, что контекст действительно доставлен в authoritative runtime.

## 3. Пользовательский сценарий

1. Product Engineer открывает «Управление знаниями → Доставка агенту».
2. Вместо ручного заполнения Product/System/Topic пользователь выбирает существующую задачу текущей команды.
3. Экран показывает выведенный scope: Product, Team, Repository, System, Segment, task tag и work type.
4. Пользователь запускает «Сформировать Context Request».
5. Интерфейс показывает короткую анимацию LLM Context Planner и структурированный ответ: темы, требуемые слои и назначение по этапам.
6. Детерминированный Resolver выбирает точные опубликованные источники и применимые Policy.
7. На схеме Flow каждый узел получает собственные context fragments. Нажатие на узел открывает его состав, версии, причины и provenance.
8. После Build/Checks пользователь запускает демонстрационную Regulatory Verification.
9. Результат маршрутизируется как `PASS → Result`, `FAIL → Rework`, `INCONCLUSIVE → Human Approval Gate`. Маршрутизация остаётся визуальной симуляцией.
10. Пользователь сохраняет simulation snapshot, затем может открыть его из истории и сравнить с текущим preview.

## 4. Архитектурное разделение

### 4.1. LLM Context Planner

Planner получает сведения задачи и конфигурацию Flow. Его демонстрационный ответ содержит:

- найденные темы и намерения работы;
- необходимость Product Knowledge и Team Knowledge;
- список узлов Flow для каждого запрошенного слоя;
- краткое объяснение выбора;
- unknowns, если классификация неоднозначна.

Planner не генерирует знания, не возвращает свободный текст вместо источников и не выбирает обязательные Policy. В текущей версии его ответ формируется детерминированной эмуляцией по seed-данным задачи. UI явно маркирует это как `LLM simulation`.

### 4.2. Deterministic Resolver

Resolver принимает структурированный план и выбирает только существующие опубликованные сущности:

- Product Knowledge — по Product, темам и связанным concept IDs;
- Team Knowledge — по Team и запросу Planner;
- Policy Package — независимо от Planner, по `Repository → System → Segment`, task tag и work type;
- Skills и Evidence Rules — из выбранных Policy Package.

Каждый выбранный фрагмент содержит `sourceId`, `version`, тип источника, текст, причину выбора и список целевых узлов Flow.

### 4.3. Regulatory invariants

- Policy lane видима в каждом применимом узле Flow.
- LLM не может удалить, заменить или понизить обязательное требование.
- Current Policy включается в trace.
- Deprecating Policy включается с предупреждением и sunset.
- Retired/Revoked Policy блокирует только затронутый применимый scope.
- Неприменимые требования показываются отдельно с причиной исключения.
- Для Policy selection используется тот же набор условий, который демонстрирует Regulatory Plan: segment, tag/task class, work type и при наличии artifact type.

### 4.4. Отсутствие runtime-интеграции

Delivery Trace не изменяет `Run`, `Snapshot`, `Capability`, реальные gates или evidence. Для демонстрации используется идентификатор `SIM-*`, а не `RUN-*`. Сохранённая запись помечается `simulation: true`.

## 5. View model

Поверх существующего Context Bundle вводится вычисляемое представление `ContextDeliveryTrace`:

```ts
interface ContextDeliveryTrace {
  simulation: true;
  simulationId: string;
  task: {
    id: string;
    title: string;
    tag: string;
    repository: string;
    system: string;
    segment: string;
    workTypes: string[];
  };
  request: ContextPlannerRequest;
  plannerResult: ContextPlannerResult;
  fragments: ContextFragment[];
  stages: ContextStageSlice[];
  verification: RegulatoryVerificationPreview;
  unknown: string[];
  blocking: string[];
  hash: string;
}
```

К существующему сохранённому `ContextBundle` добавляются только необязательные поля для обратной совместимости:

- `simulation?: boolean`;
- `taskId?: string`;
- `plannerResult?: Item`;
- `stageSlices?: Item[]`;
- `verificationPreview?: Item`.

Старые bundle остаются читаемыми и показываются как legacy snapshots.

## 6. Раскладка по узлам Flow

Конкретные узлы берутся из выбранной Capability/Flow задачи. Для типового SDD-сценария демонстрационная семантика следующая:

- **Analysis:** задача, scope, цели продукта, понятия и обязательные Policy;
- **Specification:** Product Knowledge, источники, продуктовые ограничения и обязательные Policy;
- **Implementation:** выбранные Product fragments, Team practices, обязательства, Policy Skills и ограничения;
- **Build/передача работы:** Team instructions, обязательные артефакты и Policy gate summary;
- **Checks:** Team verification practices, Evidence Rules, verification Skills и обязательные Policy;
- **Result:** состав snapshot и результат Regulatory Verification.

Product и Team fragments появляются только в узлах, перечисленных Planner. Policy metadata присутствует во всех применимых узлах, а stage-specific obligations и evidence детализируются там, где они должны исполняться или проверяться.

## 7. Regulatory Verification

Панель проверки получает демонстрационные артефакты Build/Checks: diff, manifest, test report и registry reference. Для каждого применимого requirement показываются ожидаемые evidence, verification Skill и результат.

Результаты:

- `PASS` — все обязательные evidence найдены, маршрут ведёт к Result;
- `FAIL` — есть подтверждённое нарушение, маршрут ведёт к Rework;
- `INCONCLUSIVE` — evidence недостаточно или неоднозначно, интерфейс показывает будущий Human Approval Gate.

В этой версии результаты вычисляются детерминированной демонстрационной функцией. Никакой реальный gate или решение Run не создаётся.

## 8. Интерфейс

### 8.1. Основная композиция

Экран состоит из пяти последовательно читаемых областей:

1. Task и выведенный technical scope.
2. LLM Context Request с request/response и честной маркировкой simulation.
3. Три источника: Product, Team и обязательная Policy lane.
4. Интерактивные кубики реального Flow выбранной задачи.
5. Инспектор выбранного узла и Regulatory Verification.

### 8.2. Визуальная семантика

- Product Knowledge — существующий forest green;
- Team Knowledge — sage;
- Regulatory Policy — muted violet;
- технический scope — steel blue;
- unknown/deprecating — amber;
- blocking/fail — muted red.

Цвет всегда сопровождается текстовой меткой. Используется существующая borders-only глубина приложения.

### 8.3. История

Строки истории становятся рабочими: snapshot можно открыть, просмотреть, повторно использовать как исходную точку и сравнить с текущим preview. Сравнение группируется по добавленным, удалённым и изменённым fragments и stage assignments.

### 8.4. Responsive

- desktop: sources слева, Flow и инспектор справа;
- tablet: sources становятся горизонтальным рядом, Flow переносится без внешнего horizontal overflow;
- mobile: Task → Planner → Resolver → stages выводятся одной колонкой;
- важный текст не уменьшается ниже 11 px;
- все действия остаются доступны без hover.

## 9. Ошибки и состояния

- Нет Task — понятное пустое состояние с переходом к доске задач.
- У задачи нет Repository/System — trace помечается incomplete, Policy selection не выполняется.
- Нет segment — обязательная Policy lane получает blocking state.
- Planner не нашёл Product/Team тему — affected stages показывают unknown, но Policy остаётся.
- Нет Product или Team Knowledge — соответствующие опциональные fragments отсутствуют с объяснением.
- Нет применимой Current/Deprecating Policy — сохранение snapshot блокируется.
- Planner response считается устаревшим после изменения Task, Flow или источников и должен быть сформирован повторно.
- Любая ошибка симуляции оставляет Task и scope на экране и позволяет безопасно повторить запрос.

## 10. Документация

Обновляются главы Context Supply Chain, Flow delivery, Knowledge Graph, Context Service API и operational guarantees в `public/docs/kontur-architecture.html`.

Документация должна:

- показать цепочку `Task → LLM Context Planner → Resolver → Flow → Verification`;
- явно разделить probabilistic planning и deterministic Policy resolution;
- привести пример structured planner response;
- показать stage mapping для Product/Team/Policy;
- объяснить результаты PASS/FAIL/INCONCLUSIVE;
- явно указать, что текущая версия является демонстрацией без runtime-интеграции;
- не утверждать, что Delivery Receipt доказывает фактическую доставку или compliance.

`dist/docs` обновляется только через production build.

## 11. Проверки

### 11.1. Domain tests

- Planner создаёт ожидаемые темы и stage assignments для seed-задач;
- Product/Team fragments появляются только в назначенных stages;
- Policy присутствует во всех применимых stages независимо от planner response;
- Policy selection учитывает segment, tag и work type;
- deprecating, retired и not-applicable состояния обрабатываются явно;
- одинаковые входы дают одинаковый simulation hash;
- сохранённый snapshot не меняется после изменения live sources;
- legacy Context Bundle остаётся читаемым.

### 11.2. Render tests

- рендер task selector, Planner request/response, source lanes, Flow nodes и verifier;
- переключение узла меняет inspector;
- visible simulation labels присутствуют во всех потенциально двусмысленных местах;
- история snapshot открывается;
- empty/incomplete/blocked states понятны;
- desktop/tablet/mobile не создают внешний horizontal overflow.

### 11.3. Regression

- `npm run typecheck`;
- targeted domain и render tests;
- полный `npm test`;
- `npm run build`;
- `git diff --check`;
- ручная проверка populated и empty сценариев в браузере.

## 12. Критерии приёмки

Работа считается завершённой, если:

1. пользователь начинает Delivery Trace с существующей задачи;
2. на экране видны request и structured response демонстрационного LLM Planner;
3. Product и Team fragments распределяются только по выбранным stages;
4. Policy определяется детерминированно и присутствует во всех применимых узлах;
5. каждый узел показывает точные fragments, версии, причины и provenance;
6. Regulatory Verification демонстрирует PASS/FAIL/INCONCLUSIVE и соответствующий маршрут;
7. интерфейс нигде не выдаёт simulation за фактическую runtime delivery;
8. история открывается и позволяет сравнить сохранённый trace с текущим;
9. документация описывает фактически реализованное поведение;
10. typecheck, тесты и production build проходят без ошибок.
