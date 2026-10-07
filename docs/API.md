# HTTP API v1

71 command types. This is the application's own mock API, not vendor endpoints.

## Сессия

POST /api/v1/demo/session с JSON {"userId":"maxim"}. Допустимые identities: maxim / anna / ivan / maria. Ответ устанавливает HttpOnly SameSite=Strict cookie и возвращает token для Bearer в API tests. Session выбирает identity; role в command payload не даёт полномочий. Demo login не является enterprise authentication.

## Команда

POST /api/v1/commands

```json
{"actionId":"unique-client-id","type":"space.create","payload":{"name":"Моя команда"}}
```

Для существующего пространства добавьте spaceId; для объекта — targetId и expectedRevision, где её требует handler. actionId обязателен. Повтор того же тела возвращает commandResult с replayed=true; другой payload с тем же identity/space/actionId даёт RevisionConflict. Формальные envelope schema и полный каталог названий — в packages/contracts.

Ответ: commandResult, sequence, correlationId, replayed. Ошибка: error.code/message/fields/currentRevision/retryable/recoveryActions. Ошибки role/scope не раскрывают чужие названия. HTTP success обозначает сохранённый переход, не завершение фонового job.

## Чтения и поток

GET /api/v1/health — readiness / recovery. GET /api/v1/bootstrap?spaceId=… — разрешённая normalized модель. GET /api/v1/spaces/:spaceId/:collection?cursor=0&limit=50 — страница коллекции (максимум 200). GET /api/v1/spaces/:spaceId/entities/:type/:id — scoped объект. GET /api/v1/spaces/:spaceId/search?q=… — фильтрованный поиск. GET /api/v1/runs/:runId/trace и /api/v1/artifacts/:artifactId — трасса/артефакты после проверки доступа.

GET /api/v1/events?spaceId=…&after=sequence — SSE. Поддерживается Last-Event-ID; event domain содержит eventId и sequence. Доставка повторяемая, клиент дедуплицирует. GET /api/v1/events/poll с теми же параметрами — ограниченный HTTP fallback с такой же фильтрацией. Browser bridge QA использует его, не подменяя domain handlers.

## Gate

POST /api/v1/gates/:gateId/challenges с {} создаёт challenge просмотренного пакета. Затем gate.answer либо gate.decide с challengeId, targetDigest, expectedRevision. Input требует answer.behavior = separate / empty-on-error и объяснение минимум 8 символов. Approval требует разрешённую роль/assignment, свежий digest/revision/challenge и пройденные checks. Rework дополнительно требует reason, expectedFix, targetNodeId; humanTimeMs хранится отдельно. Примеры настоящих запросов: tests/runtime.test.mjs и tests/helpers.mjs.

## Export, import, recovery

POST /api/v1/demo/export {spaceId}. POST /api/v1/demo/import/validate принимает экспорт целиком и не меняет состояние. POST /api/v1/demo/import/apply {actionId,confirm:true,data:export} — явное применение в новую data-directory/ID namespace, активная работа паузится.

В recovery: maxim отправляет storage.recover через /commands. Тестовый POST /api/v1/demo/fault {kind:"storage"} включён только при FAULT_INJECTION=1 или tests createApp({faults:true}); по умолчанию недоступен.

## Каталог payload fields

Это извлечённый список полей, которые читает handler, **не полная валидационная схема каждого payload**. Требуемые сочетания и ограничения см. исходник соответствующего handler и исполняемые API tests.

| Type | Payload fields |
|---|---|
| `space.create` | `memberIds`, `ownerId`, `name`, `goal`, `budget`, `classification`, `timezone`, `origin` |
| `setup.save` | `stage`, `fields` |
| `plan.create` | `template`, `broker`, `network` |
| `provision.start` | `confirm` |
| `job.cancel` | — |
| `job.retry` | `network` |
| `installation.create` | `environmentId`, `profile`, `composition`, `fixture`, `version` |
| `installation.update` | `version` |
| `installation.conformance` | — |
| `environment.create` | `kind`, `sourceId` |
| `binding.create` | `kind`, `projectId`, `installationId`, `environmentId`, `endpoint`, `actions`, `scope` |
| `tool.invoke` | `action`, `input` |
| `project.create` | `ownerId`, `engineerId`, `installationId`, `name`, `goal`, `repo`, `budget` |
| `task.create` | `projectId`, `originMessageId`, `title`, `description`, `acceptance`, `taskClass`, `priority` |
| `task.update` | `status`, `title` |
| `actor.create` | `projectId`, `template`, `name`, `instruction`, `taskClasses` |
| `actor.clone` | `name` |
| `definition.create` | `projectId`, `installationId`, `kind`, `actorId`, `name`, `taskClass`, `graph`, `team` |
| `definition.save` | `graph`, `dependencies`, `team`, `name`, `taskClass` |
| `definition.validate` | `graph` |
| `definition.snapshot` | — |
| `run.startTrial` | — |
| `run.startReleased` | — |
| `gate.answer` | `answer` |
| `gate.decide` | `decision`, `reason`, `expectedFix`, `targetNodeId`, `humanTimeMs`, `challengeId` |
| `gate.reassign` | `userId` |
| `run.control` | `control`, `diff`, `behavior` |
| `run.reconcile` | — |
| `run.budget` | `amount` |
| `message.send` | `channelId`, `private`, `threadId`, `text`, `replyTo` |
| `thread.create` | — |
| `message.edit` | `delete`, `text` |
| `message.react` | `emoji` |
| `message.pin` | — |
| `notification.read` | — |
| `assistant.propose` | `projectId`, `title` |
| `assistant.confirm` | `confirm` |
| `simulator.configure` | `auto`, `chatFailure` |
| `simulator.step` | — |
| `simulator.clock` | `advanceMs` |
| `knowledge.propose` | `sourceDecisionId`, `title`, `content`, `projectId`, `sourceMessageId`, `reason`, `appliesTo`, `parentId` |
| `knowledge.create` | `parentId`, `visibility`, `projectId`, `title`, `content`, `tags` |
| `knowledge.save` | `parentId`, `title`, `content`, `tags`, `tests` |
| `knowledge.submit` | `tests` |
| `knowledge.publish` | `appliesTo`, `exceptions` |
| `knowledge.link` | `from`, `to`, `kind` |
| `component.create` | `template`, `name`, `content` |
| `component.version` | `version`, `content`, `dependencies` |
| `component.submit` | — |
| `component.publish` | — |
| `component.revoke` | `reason` |
| `evaluation.create` | `snapshotId`, `track` |
| `arena.compare` | `evaluationIds`, `review` |
| `candidate.create` | `snapshotId`, `evaluationId`, `name` |
| `candidate.technical` | `targetDigest`, `statement` |
| `candidate.scope` | `targetDigest` |
| `uat.start` | `snapshotId`, `environmentId` |
| `uat.accept` | `targetDigest` |
| `release.admit` | — |
| `deployment.create` | `releaseId`, `environmentId`, `quota` |
| `deployment.control` | `action`, `releaseId` |
| `productRelease.create` | `runId`, `name` |
| `productRelease.approve` | — |
| `productRelease.deploy` | — |
| `platformRelease.create` | `installationId`, `name` |
| `outcome.observe` | `productReleaseId`, `fixture` |
| `outcome.improve` | `confirm`, `title` |
| `outcome.scale` | — |
| `cost.record` | `runId`, `originRef`, `amount`, `projectId`, `eventId` |
| `incident.create` | `projectId`, `runId`, `title`, `reason`, `severity` |
| `demo.import` | `confirm`, `data` |

Коллекции: spaces, memberships, setups, plans, jobs, resources, environments, installations, installationVersions, bindings, projects, classes, tasks, actors, definitions, snapshots, runs, attempts, executions, delegations, workspaces, actions, contexts, channels, threads, messages, notifications, inputs, humanTasks, gates, challenges, decisions, pages, knowledgeVersions, knowledgeLinks, proposals, components, componentVersions, artifacts, checks, evaluationPlans, evaluations, arenaReports, candidates, attestations, uatReports, releases, productReleases, platformReleases, deployments, incidents, reservations, costs, outcomes, improvements, assistantProposals. Поддерживаемые node types: Start, AI, Command, Input, Approval, Condition, Delegation, Parallel, Join, Terminal. Разрешённые mock profile IDs: hg, fabro, symphony, agents, multica, openclaw, frontier, custom.
