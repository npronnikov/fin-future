import React from '../../shared/react.js';
import { ui } from '../../app/controller.js';
import { downloadJSON } from '../../shared/data/api.js';
import { Badge, Button, Heading, Panel, Empty, Icon, Field, Tabs, Digest, Avatar } from '../../shared/ui/index.js';
function canvasGraph(def, f) {
    const graph = f.graph;
    const width = Math.max(1100, ...graph.nodes.map((n) => (n.x || 0) + 200));
    const height = Math.max(390, ...graph.nodes.map((n) => (n.y || 0) + 180));
    return React.createElement("div", { className: "canvas-scroll", role: "region", "aria-label": "\u0420\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0433\u0440\u0430\u0444\u0430", tabIndex: 0 },
        React.createElement("div", { className: "flow-canvas", style: { width, height } },
            React.createElement("svg", { className: "flow-edges", width: width, height: height, "aria-hidden": "true" },
                React.createElement("defs", null,
                    React.createElement("marker", { id: "arrowhead", markerWidth: "7", markerHeight: "7", refX: "6", refY: "3.5", orient: "auto" },
                        React.createElement("polygon", { points: "0 0,7 3.5,0 7", fill: "#7e958b" }))),
                graph.edges.map((edge, i) => {
                    const a = graph.nodes.find((n) => n.id === edge.from), b = graph.nodes.find((n) => n.id === edge.to);
                    if (!a || !b)
                        return null;
                    const ax = (a.x || 0) + 164, ay = (a.y || 0) + 51, bx = (b.x || 0), by = (b.y || 0) + 51;
                    return edge.on === 'rework' ? React.createElement("g", { key: i },
                        React.createElement("path", { d: `M ${ax - 82} ${ay + 48} V ${Math.max(ay, by) + 128} H ${bx + 82} V ${by + 52}`, stroke: "#c39559", strokeDasharray: "5 5", fill: "none", markerEnd: "url(#arrowhead)" }),
                        React.createElement("text", { x: (ax + bx) / 2 - 30, y: Math.max(ay, by) + 149, fill: "#9a7445", fontSize: "12" },
                            "Rework \u00B7 max ",
                            edge.maxVisits || '∞')) : React.createElement("path", { key: i, d: `M ${ax} ${ay} C ${ax + 35} ${ay},${bx - 35} ${by},${bx} ${by}`, stroke: "#91a79c", fill: "none", markerEnd: "url(#arrowhead)" });
                })),
            graph.nodes.map((node, i) => React.createElement("button", { key: node.id, className: 'flow-node type-' + node.type + (f.selectedNode === node.id ? ' selected' : ''), style: { left: node.x ?? i * 220 + 40, top: node.y ?? 70 }, onClick: () => ui.set('studio:' + def.id, 'selectedNode', node.id), draggable: true, onDragStart: (e) => { e.dataTransfer.setData('text/plain', node.id); ui.form('studio:' + def.id).drag = { x: e.clientX, y: e.clientY, node: node.id, startX: node.x || 0, startY: node.y || 0 }; }, onDragEnd: (e) => {
                    const drag = f.drag;
                    if (drag && e.clientX) {
                        node.x = Math.max(20, drag.startX + e.clientX - drag.x);
                        node.y = Math.max(20, drag.startY + e.clientY - drag.y);
                        ui.set('studio:' + def.id, 'graph', { ...graph });
                    }
                } },
                React.createElement("div", { className: "node-type" },
                    React.createElement(Icon, { name: node.type === 'AI' ? 'spark' : ['Input', 'Approval'].includes(node.type) ? 'shield' : node.type === 'Terminal' ? 'check' : node.type === 'Command' ? 'box' : 'play', size: 17 }),
                    node.type),
                React.createElement("b", null, node.label),
                React.createElement("small", null, node.protected ? 'Обязательный контроль' : node.actor || node.command || node.id))),
            React.createElement("div", { className: "canvas-caption" },
                React.createElement("span", null, "\u041F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u0439\u0442\u0435 \u0443\u0437\u043B\u044B \u00B7 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u0437\u0435\u043B \u0434\u043B\u044F \u0441\u0432\u043E\u0439\u0441\u0442\u0432"),
                React.createElement("b", null,
                    graph.nodes.length,
                    " \u0443\u0437\u043B\u043E\u0432 / ",
                    graph.edges.length,
                    " \u0441\u0432\u044F\u0437\u0435\u0439"))));
}
export function StudioPage() {
    const definitions = ui.scoped('definitions');
    const def = ui.entity('definitions', ui.objectId) || definitions[0];
    if (!def)
        return React.createElement(React.Fragment, null,
            React.createElement(Heading, { eyebrow: "STUDIO", title: "\u0421\u043E\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043F\u043E\u0441\u043E\u0431 \u0440\u0430\u0431\u043E\u0442\u044B", description: "Flow, \u0430\u0434\u0440\u0435\u0441\u0443\u0435\u043C\u044B\u0439 AI-\u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A \u0438\u043B\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u0430 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u043E\u0432. \u041E\u0434\u0438\u043D \u0433\u0440\u0430\u0444 \u0434\u043B\u044F \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0438 \u0438\u0441\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F.", actions: React.createElement(Button, { icon: "plus", disabled: !ui.project || ui.user?.role !== 'engineer', onClick: () => ui.open('definition') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044E") }),
            React.createElement(Empty, { icon: "flow", title: "\u041F\u0435\u0440\u0432\u044B\u0439 \u043A\u043E\u043D\u0432\u0435\u0439\u0435\u0440 \u2014 \u0438\u0437 \u0448\u0430\u0431\u043B\u043E\u043D\u0430", description: "\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0441 SDLC: \u043F\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430, \u0432\u043E\u043F\u0440\u043E\u0441, \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435, checks \u0438 \u0438\u043D\u0436\u0435\u043D\u0435\u0440\u043D\u043E\u0435 \u0440\u0435\u0432\u044C\u044E.", action: React.createElement(Button, { disabled: !ui.project || ui.user?.role !== 'engineer', onClick: () => ui.open('definition') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0438\u0437 \u0448\u0430\u0431\u043B\u043E\u043D\u0430") }));
    const key = 'studio:' + def.id;
    const f = ui.form(key, { graph: JSON.parse(JSON.stringify(def.graph)), team: JSON.parse(JSON.stringify(def.team)), dependencies: [...def.dependencies], name: def.name, baseRevision: def.revision, selectedNode: def.graph.nodes[0]?.id, tab: 'canvas' });
    const graph = f.graph, node = graph.nodes.find((n) => n.id === f.selectedNode);
    const save = () => ui.act(async () => { const result = await ui.cmd('definition.save', { name: f.name, graph: f.graph, team: f.team, dependencies: f.dependencies }, def.id, { expectedRevision: f.baseRevision }); f.baseRevision = result.revision; ui.persistForms(); return result; }, 'Черновик сохранён. Активные Runs не изменены.');
    return React.createElement(React.Fragment, null,
        React.createElement(Heading, { eyebrow: `STUDIO / ${def.kind.toUpperCase()}`, title: def.name, description: `Черновик revision ${def.revision} · ${ui.entity('projects', def.projectId)?.name} · ${ui.entity('installations', def.installationId)?.name}`, actions: React.createElement(React.Fragment, null,
                React.createElement(Button, { variant: "secondary", disabled: ui.user?.role !== 'engineer', onClick: () => void save() }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A"),
                React.createElement(Button, { icon: "play", disabled: ui.user?.role !== 'engineer', onClick: () => ui.open('trial', { definitionId: def.id }) }, "\u041F\u0440\u043E\u0431\u043D\u044B\u0439 \u0437\u0430\u043F\u0443\u0441\u043A")) }),
        React.createElement("div", { className: "studio-select" },
            React.createElement("select", { "aria-label": "\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F Studio", value: def.id, onChange: (e) => ui.go('studio', e.target.value) }, definitions.map(d => React.createElement("option", { key: d.id, value: d.id },
                d.name,
                " \u00B7 ",
                d.kind))),
            React.createElement(Button, { small: true, variant: "ghost", icon: "plus", disabled: ui.user?.role !== 'engineer', onClick: () => ui.open('definition') }, "\u041D\u043E\u0432\u0430\u044F \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F"),
            React.createElement(Badge, { value: "Draft" }),
            React.createElement("span", { className: "muted small-text" }, "Trial \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0439 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A.")),
        React.createElement("div", { className: "studio-layout" },
            React.createElement("section", { className: "studio-main panel" },
                React.createElement(Tabs, { current: f.tab, items: [{ id: 'canvas', label: 'Canvas' }, { id: 'list', label: 'Список узлов' }, { id: 'json', label: 'JSON' }, ...(def.kind === 'team' ? [{ id: 'team', label: 'Команда и routing' }] : [])], onChange: (v) => ui.set(key, 'tab', v) }),
                React.createElement("div", { className: "canvas-toolbar" },
                    React.createElement(Button, { small: true, variant: "ghost", icon: "plus", onClick: () => ui.open('node', { definitionId: def.id }) }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0443\u0437\u0435\u043B"),
                    React.createElement(Button, { small: true, variant: "ghost", onClick: () => ui.open('edge', { definitionId: def.id }) }, "\u0421\u0432\u044F\u0437\u0430\u0442\u044C \u0443\u0437\u043B\u044B"),
                    React.createElement("div", { className: "toolbar-spacer" }),
                    React.createElement(Button, { small: true, variant: "ghost", onClick: () => void ui.act(async () => { const result = await ui.cmd('definition.validate', { graph: f.graph }, def); ui.set(key, 'findings', result.findings); return result; }, 'Проверка графа выполнена') }, "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0433\u0440\u0430\u0444"),
                    React.createElement(Button, { small: true, variant: "ghost", onClick: () => downloadJSON(def.name + '.json', f.graph) }, "\u042D\u043A\u0441\u043F\u043E\u0440\u0442")),
                f.tab === 'canvas' ? canvasGraph(def, f) : f.tab === 'list' ? React.createElement("div", { className: "node-table" }, graph.nodes.map((n) => React.createElement("button", { className: "list-row clickable", key: n.id, onClick: () => ui.set(key, 'selectedNode', n.id) },
                    React.createElement("span", null,
                        React.createElement("b", null, n.label),
                        React.createElement("small", null,
                            n.id,
                            " \u00B7 ",
                            n.type)),
                    React.createElement("span", null, n.actor || n.reviewerRole || n.command || '—')))) : f.tab === 'json' ? React.createElement("div", { className: "json-editor" },
                    React.createElement(Field, { label: "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0439 \u0433\u0440\u0430\u0444 \u00B7 schemaVersion 1", form: key, field: "jsonText", type: "textarea", defaultValue: JSON.stringify(f.graph, null, 2), rows: 18 }),
                    React.createElement("div", { className: "inline-actions" },
                        React.createElement(Button, { variant: "secondary", onClick: () => {
                                void ui.act(async () => {
                                    const parsed = JSON.parse(f.jsonText ?? JSON.stringify(f.graph));
                                    const result = await ui.cmd('definition.validate', { graph: parsed }, def);
                                    if (result.findings.length) {
                                        const error = new Error('Импорт не прошёл проверку. Текущий draft сохранён.');
                                        error.fields = { findings: result.findings };
                                        throw error;
                                    }
                                    ui.open('import-graph', { definitionId: def.id, graph: parsed });
                                }, '');
                            } }, "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0438 \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0438\u043C\u043F\u043E\u0440\u0442"),
                        React.createElement("label", { className: "file-button" },
                            "\u041E\u0442\u043A\u0440\u044B\u0442\u044C JSON-\u0444\u0430\u0439\u043B",
                            React.createElement("input", { type: "file", accept: ".json,application/json", onChange: async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        ui.set(key, 'jsonText', await file.text());
                                    }
                                } })))) : React.createElement("div", { className: "team-editor" },
                    React.createElement("div", { className: "coordinator" },
                        React.createElement(Icon, { name: "team", size: 29 }),
                        React.createElement("div", null,
                            React.createElement("h3", null, f.team.coordinator),
                            React.createElement("p", null, "\u041E\u0434\u0438\u043D coordinator \u00B7 \u043E\u0431\u0449\u0438\u0439 root budget \u00B7 all-required join"))),
                    Object.entries(f.team.routing).map(([taskClass, roles]) => React.createElement("div", { className: "team-plan", key: taskClass },
                        React.createElement("b", null, taskClass.toUpperCase()),
                        roles.map((r, i) => React.createElement("div", { key: r },
                            React.createElement("span", null, i === 0 ? 'Исполнение' : 'Review'),
                            React.createElement(Icon, { name: "spark" }),
                            React.createElement("b", null, r),
                            React.createElement("small", null, f.team.roles[r]))))),
                    React.createElement(Field, { label: "TeamDefinition JSON", form: key, field: "teamText", type: "textarea", defaultValue: JSON.stringify(f.team, null, 2), rows: 10 }),
                    React.createElement(Button, { variant: "secondary", onClick: () => {
                            try {
                                f.team = JSON.parse(f.teamText || JSON.stringify(f.team));
                                ui.changed();
                                ui.notice('Локальная команда изменена. Сохраните черновик.');
                            }
                            catch (e) {
                                ui.error = e;
                                ui.changed();
                            }
                        } }, "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F")),
                f.findings && React.createElement("div", { className: f.findings.length ? 'validation-list error' : 'validation-list good' }, f.findings.length ? f.findings.map((e, i) => React.createElement("p", { key: i },
                    React.createElement("b", null,
                        e.nodeId || 'Граф',
                        ":"),
                    " ",
                    e.message)) : React.createElement("p", null,
                    React.createElement(Icon, { name: "check", size: 16 }),
                    " \u0413\u0440\u0430\u0444 \u0432\u0430\u043B\u0438\u0434\u0435\u043D. \u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0433\u0435\u0439\u0442\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B."))),
            React.createElement("aside", { className: "studio-properties" },
                React.createElement(Panel, { title: "\u0421\u0432\u043E\u0439\u0441\u0442\u0432\u0430 \u0443\u0437\u043B\u0430", meta: node?.id || 'Выберите узел' }, node && React.createElement(React.Fragment, null,
                    React.createElement(Field, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", form: key + ':node:' + node.id, field: "label", defaultValue: node.label, onChange: (v) => { node.label = v; ui.set(key, 'graph', { ...graph }); } }),
                    React.createElement(Field, { label: "\u0418\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C / \u0440\u043E\u043B\u044C", form: key + ':node:' + node.id, field: "actor", defaultValue: node.actor || node.reviewerRole || '', onChange: (v) => { node.actor = v; ui.set(key, 'graph', { ...graph }); } }),
                    React.createElement(Field, { label: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F", form: key + ':node:' + node.id, field: "instruction", type: "textarea", defaultValue: node.instruction || '', onChange: (v) => { node.instruction = v; ui.set(key, 'graph', { ...graph }); } }),
                    node.type === 'Command' && React.createElement(Field, { label: "Mock-\u043A\u043E\u043C\u0430\u043D\u0434\u0430", form: key + ':node:' + node.id, field: "command", defaultValue: node.command || 'verify-ui', options: ['verify-ui', 'verify-docs', 'lint', 'test', 'mock-pr', 'policy-probe'], onChange: (v) => { node.command = v; ui.set(key, 'graph', { ...graph }); } }),
                    node.protected && React.createElement("div", { className: "info-banner compact" },
                        React.createElement(Icon, { name: "shield", size: 17 }),
                        "\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0438\u043D\u0436\u0435\u043D\u0435\u0440\u043D\u044B\u0439 Gate"),
                    React.createElement(Button, { small: true, variant: "danger", disabled: node.protected, onClick: () => { f.graph = { ...graph, nodes: graph.nodes.filter((n) => n.id !== node.id), edges: graph.edges.filter((e) => e.from !== node.id && e.to !== node.id) }; f.selectedNode = null; ui.changed(); } }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0443\u0437\u0435\u043B"))),
                React.createElement(Panel, { title: "\u0417\u0430\u043A\u0440\u0435\u043F\u043B\u044F\u0435\u043C\u044B\u0435 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0438", meta: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0430\u044E\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043A \u043D\u043E\u0432\u043E\u0439 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438" },
                    [...ui.scoped('knowledgeVersions'), ...ui.scoped('componentVersions')].filter(v => v.status === 'Published').map(v => React.createElement("label", { className: "dependency-option", key: v.id },
                        React.createElement("input", { type: "checkbox", checked: f.dependencies.includes(v.id), onChange: (e) => ui.set(key, 'dependencies', e.target.checked ? [...f.dependencies, v.id] : f.dependencies.filter((id) => id !== v.id)) }),
                        React.createElement("span", null,
                            React.createElement("b", null, v.title || v.name),
                            React.createElement(Digest, { value: v.contentDigest, label: "VERSION" })))),
                    ![...ui.scoped('knowledgeVersions'), ...ui.scoped('componentVersions')].some(v => v.status === 'Published') && React.createElement("p", { className: "muted small-text" }, "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0432\u0435\u0440\u0441\u0438\u0439 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u0418\u0445 \u043C\u043E\u0436\u043D\u043E \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u0441\u043B\u0435 review \u0437\u043D\u0430\u043D\u0438\u044F \u0438\u043B\u0438 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0430."),
                    React.createElement(Button, { variant: "ghost", small: true, onClick: () => ui.go('knowledge') },
                        "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0437\u043D\u0430\u043D\u0438\u044F ",
                        React.createElement(Icon, { name: "arrow", size: 13 }))))));
}
export function ActorsPage() { return React.createElement(React.Fragment, null,
    React.createElement(Heading, { eyebrow: "\u0420\u0410\u0417\u0420\u0410\u0411\u041E\u0422\u041A\u0410 \u0410\u0412\u0422\u041E\u041D\u041E\u041C\u041D\u041E\u0421\u0422\u0418", title: "AI-\u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0438", description: "\u0423\u0441\u0442\u043E\u0439\u0447\u0438\u0432\u0430\u044F identity, \u0432\u043B\u0430\u0434\u0435\u043B\u0435\u0446, \u043E\u0431\u043B\u0430\u0441\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u044B \u0438 \u043F\u0443\u0441\u0442\u0430\u044F \u0447\u0430\u0441\u0442\u043D\u0430\u044F \u043F\u0430\u043C\u044F\u0442\u044C \u043F\u0440\u0438 \u043A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0438.", actions: React.createElement(Button, { icon: "plus", disabled: !['engineer', 'platform'].includes(ui.user?.role || ''), onClick: () => ui.open('actor') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C AI-\u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430") }),
    ui.scoped('actors').length ? React.createElement("div", { className: "cards-grid" }, ui.scoped('actors').map(a => React.createElement(Panel, { key: a.id },
        React.createElement("div", { className: "actor-head" },
            React.createElement(Avatar, { ai: true }),
            React.createElement("div", null,
                React.createElement("h3", null, a.name),
                React.createElement("small", null,
                    "AI \u00B7 ",
                    a.template)),
            React.createElement(Badge, { value: a.status })),
        React.createElement("p", null, a.instruction),
        React.createElement("div", { className: "key-values" },
            React.createElement("span", null, "\u0412\u043B\u0430\u0434\u0435\u043B\u0435\u0446"),
            React.createElement("b", null, ui.data.catalog.users.find((u) => u.id === a.ownerId)?.name),
            React.createElement("span", null, "\u041A\u043B\u0430\u0441\u0441\u044B"),
            React.createElement("b", null, a.taskClasses.join(', ')),
            React.createElement("span", null, "\u041C\u043E\u0434\u0435\u043B\u044C"),
            React.createElement("code", null, a.modelProfile),
            React.createElement("span", null, "\u041F\u0430\u043C\u044F\u0442\u044C"),
            React.createElement("b", null,
                "\u0427\u0430\u0441\u0442\u043D\u0430\u044F \u00B7 ",
                a.privateMemory?.length ?? 'недоступно',
                " \u0437\u0430\u043F\u0438\u0441\u0435\u0439")),
        React.createElement("div", { className: "inline-actions" },
            React.createElement(Button, { small: true, variant: "secondary", onClick: () => void ui.act(() => ui.cmd('actor.clone', {}, a), 'Новая identity создана. Память и grants не скопированы.') }, "\u041A\u043B\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0440\u043E\u043B\u044C"),
            React.createElement(Button, { small: true, variant: "ghost", onClick: () => ui.open('definition', { kind: 'actor', actorId: a.id }) }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C Workflow"))))) : React.createElement(Empty, { icon: "team", title: "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u0435 \u043F\u0435\u0440\u0432\u043E\u0433\u043E AI-\u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430", description: "\u042D\u0442\u043E \u0430\u0434\u0440\u0435\u0441\u0443\u0435\u043C\u044B\u0439 mock Actor, \u0430 \u043D\u0435 \u0447\u0435\u043B\u043E\u0432\u0435\u043A \u0438 \u043D\u0435 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0430\u044F LLM.", action: React.createElement(Button, { onClick: () => ui.open('actor') }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C AI-\u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430") })); }
