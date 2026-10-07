# Архитектура

## Слои

React shell → нормализованный HTTP API → command handlers → domain transition → JsonStore commit → events/outbox → shared Human Workbench / inbox / thread. Simulator использует те же функции переходов и тот же store.

`packages/contracts/catalog.mjs` содержит роли, типы узлов, resource/runtime/component catalog, базовый граф и default team routing. Каталог — не автоматически созданные пользовательские ресурсы.

`domain/core.mjs` — Entity helpers, checksum/canonical JSON, scopes, errors. `domain/commands.mjs` — envelope, identity/space/actionId/requestDigest ledger. `domain/graph.mjs` — поддерживаемая безопасная семантика.

`services/platform.mjs` — setup/resources/installations/bindings/projects/tasks; `services/work.mjs` — definitions/actors/runs/gates/control/chat; `services/knowledge.mjs` — страницы/версии/links/components; `services/releases.mjs` — evaluation/arena/candidates/UAT/deploy/product/outcome; `services/economics.mjs` — reservation/cost/root balance; `services/transfer.mjs` — export/import.

`simulator/runtime.mjs` исполняет token graph, условные ветви, parallel/join, bounded delegation и durable jobs. `adapters/mock/oracle.mjs` независимо проверяет структурированное поведение fixture, а не строку «тесты прошли».

## Сохранение

Синхронный single-writer callback выполняется на `structuredClone` snapshot. Следующий snapshot сериализуется во временный файл, fsync, создаётся проверяемый previous backup, затем rename основного файла. Память и подписчики событий обновляются только после успешной записи. Promise внутри транзакционного callback запрещён. При storage fault live state и success events не изменяются.

Snapshot сохраняет entities, события, outbox, pending job IDs, ledger, sessions, seed и per-space simulator settings. При restart jobs продолжаются с сохранённого этапа. Recovery из backup read-only до явного подтверждения. Два писателя на одну data-directory отклоняются lock-файлом.

## HTTP и клиент

Cookie demo session HttpOnly/SameSite=Strict или Bearer token. Роль нельзя передать в command envelope. Все scoped чтения, search, private assistant, backlinks и SSE фильтруются до выдачи. Demo profile не является настоящей аутентификацией.

UIController держит normalized snapshots отдельно от form drafts. SSE событие инициирует обновление только текущего scope; смена identity закрывает stream и сбрасывает scoped caches. Форма решения не отправляется при offline. UI confirmation не обходит серверные checks.

## Точные границы

Configuration snapshot закрепляет graph semantics, lock, installation revision, class и team definition. Layout координаты не меняют semantic digest. Публикация нового знания не подменяет текущий lock; Rework input — часть текущего поручения и сохранён отдельно. Revoked dependency блокирует последующие действия несмотря на pinning.

Gate challenge содержит userId/gateId/expectedRevision/artifactBundleDigest/allowedActions/expiresAt. Атомарная запись Decision закрывает HumanTask и публикует продолжение через outbox. Чат — проекция решения, не источник полномочия.

Это модульный монолит, не 22 микросервиса. Production замена storage/IAM/tool gateways потребует дополнительной разработки; текущие исходники не объявляют их уже реализованными интерфейсами распределённой системы.
