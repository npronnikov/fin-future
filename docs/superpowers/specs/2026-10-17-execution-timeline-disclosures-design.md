# Execution timeline disclosures

## Goal

Make the execution timeline the primary place for inspecting runtime context delivery and human intervention. Remove the standalone knowledge-delivery and pending-gate cards from the timeline tab.

## Interaction design

Three event types have inline disclosures:

1. **Knowledge delivery** — the existing `Implementation · знания доставлены` event expands to the MCP request, planner rationale, selected Product/Team Knowledge, and their frozen versions.
2. **Regulatory requirements delivery** — the same delivery event presents policy fragments in a separate `Регуляторные требования` section, including requirement id, package version, segment, and resolved text.
3. **Human Gate** — each `Human Input requested` or `Human Approval requested` event expands to the existing gate UI. A pending gate is open by default so the required action is not hidden; resolved gates are collapsed and retain their decision details.

All other events remain compact timeline rows. Disclosure summaries show a concise count/status so the timeline stays scannable when collapsed.

## Component boundaries

- Split the current `RunKnowledge` card into reusable inline receipt content without an outer `Card`.
- Add an execution-timeline renderer that associates delivery events with `run.execution.knowledgeDelivery` and gate-request events with a gate id from the event detail.
- Reuse `GateCard` behavior inside the disclosure rather than duplicating decision logic.
- Keep the dedicated `Гейты человека` tab unchanged for the complete gate history.
- Keep the dedicated `Регуляторика` tab unchanged for full plan and evidence artifacts.

## Data and compatibility

No domain schema or persisted state changes are required. Runs without a knowledge receipt or matching gate render their existing plain events. The UI must not synthesize a delivery claim when the runtime did not record one.

## Visual direction

The timeline remains a dense audit trail: borders and the existing green/amber semantic colors provide hierarchy. Expanded content is inset beneath the originating event, rather than presented as another floating card. This preserves the product-specific signature: evidence is attached to the exact execution moment that produced it.

## Verification

- SSR regression test proves knowledge and regulatory details are nested in the timeline disclosure and the standalone knowledge card is absent.
- SSR regression test proves a pending gate is represented by an open disclosure with its actionable controls.
- Typecheck and render smoke tests pass.

