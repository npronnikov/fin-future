# 1.6.0

Нулевой сценарий и роли; платформы до ресурсов; Platform Engineer-only на UI/API; HG SDLC, Maestro, AI Conductor и недоступный AI Manager; восемь Dependency Update задач; инфраструктура без обязательного поставщика изоляции; четыре глаза для авторских пакетов политик; создание Workflow из Автоматизации; версии и исправление порядка Checks; широкий Supervised launch; наборы из успешно решённых задач; версия Judge и двухшаговый мастер; сравнительные benchmark-строки; предварительная готовность выпуска; цепочка UAT → Product Owner → выпуск; онтология → review → publish → граф; Knowledge MCP в самом запуске; тест полного перевыпуска.

Существующие Rework, Takeover, Messenger, scoped boards, immutable releases и API optimistic concurrency сохранены и покрываются регрессионными тестами. Старая история и снимки не мигрируют к новым артефактам задним числом.

Тестовые команды разделены: `npm test` — автономный серверный набор; `test:render` и `test:dev` — дополнительные проверки с npm-зависимостями. Добавлен `build:offline`, сохранён стандартный Vite build.
