import React from '../../shared/react.js';
import { ui } from '../../app/controller.js';
import { Badge, Button, Heading, Panel, Empty, Icon, RunCard, Avatar, date, Field } from '../../shared/ui/index.js';
function ChatMessage({ m }) {
    const gate = ui.entity('gates', m.gateId), run = ui.entity('runs', m.runId);
    if (m.kind === 'run' && run)
        return React.createElement("div", { className: "chat-run" },
            React.createElement(RunCard, { run: run }),
            ui.threadId !== m.threadId && React.createElement("button", { className: "thread-link", onClick: () => ui.go('channels', m.channelId, m.threadId) },
                "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0440\u0430\u0431\u043E\u0447\u0438\u0439 \u0442\u0440\u0435\u0434 ",
                React.createElement(Icon, { name: "arrow", size: 14 })));
    return React.createElement("article", { className: 'chat-message ' + (m.kind === 'gate' ? 'with-gate' : '') },
        React.createElement(Avatar, { id: m.createdBy, ai: m.ai || m.createdBy === 'system' }),
        React.createElement("div", { className: "message-body" },
            React.createElement("div", { className: "message-author" },
                React.createElement("b", null, m.ai ? m.actorLabel || 'AI-сотрудник' : ui.data.catalog.users.find((u) => u.id === m.createdBy)?.name || 'КОНТУР'),
                m.ai && React.createElement("span", { className: "ai-label" }, "AI \u00B7 mock@1"),
                React.createElement("time", null, date(m.createdAt)),
                m.revisions?.length > 0 && React.createElement("small", null, "\u0438\u0437\u043C\u0435\u043D\u0435\u043D\u043E"),
                m.pinned && React.createElement("span", null, "\u2316")),
            React.createElement("p", { className: m.tombstone ? 'tombstone' : '' }, m.text),
            gate && React.createElement("div", { className: "chat-gate" },
                React.createElement("span", null,
                    React.createElement(Badge, { value: gate.status }),
                    React.createElement("small", null,
                        gate.kind === 'input' ? 'Структурированный вопрос' : 'Artifact review',
                        " \u00B7 \u0440\u0435\u0432\u0438\u0437\u0438\u044F ",
                        gate.revision)),
                React.createElement(Button, { small: true, variant: "secondary", disabled: gate.status !== 'Pending', onClick: () => void ui.openGate(gate.id) }, gate.kind === 'input' ? 'Ответить' : 'Открыть ревью')),
            m.kind === 'text' && !m.tombstone && React.createElement("div", { className: "message-actions" },
                React.createElement("button", { onClick: () => void ui.act(async () => { const thread = await ui.cmd('thread.create', {}, m); ui.go('channels', m.channelId, thread.id); }, '') }, "\u041E\u0442\u0432\u0435\u0442\u0438\u0442\u044C \u0432 \u0442\u0440\u0435\u0434\u0435"),
                React.createElement("button", { onClick: () => ui.open('task', { message: m }) }, "\u0412 \u0437\u0430\u0434\u0430\u0447\u0443"),
                React.createElement("button", { onClick: () => void ui.act(() => ui.cmd('message.react', { emoji: '👍' }, m), '') },
                    "\uD83D\uDC4D ",
                    m.reactions?.['👍']?.length || ''),
                React.createElement("button", { onClick: () => void ui.act(() => ui.cmd('message.pin', {}, m), '') }, m.pinned ? 'Открепить' : 'Закрепить'),
                m.createdBy === ui.user?.id && React.createElement("button", { onClick: () => ui.open('edit-message', m) }, "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C"))));
}
export function MessengerPage() {
    const channels = ui.scoped('channels'), channel = ui.entity('channels', ui.channelId) || channels[0];
    if (!channel)
        return React.createElement(Empty, { icon: "chat", title: "\u041A\u0430\u043D\u0430\u043B\u044B \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430" });
    const thread = ui.entity('threads', ui.threadId);
    const key = 'composer:' + channel.id + ':' + (thread?.id || 'root');
    const f = ui.form(key, { text: '', limit: 70 });
    const messages = ui.all('messages').filter(m => m.channelId === channel.id && !m.privateTo && (thread ? m.threadId === thread.id : !m.threadId || m.kind === 'run' || ui.all('threads').some(t => t.rootMessageId === m.id)));
    const send = () => void ui.act(async () => { await ui.cmd('message.send', { channelId: channel.id, threadId: thread?.id, text: f.text }); ui.set(key, 'text', ''); setTimeout(() => { const log = document.getElementById('message-log'); log?.scrollTo(0, log.scrollHeight); }, 40); }, 'Сообщение сохранено');
    return React.createElement("div", { className: "messenger-layout" },
        React.createElement("aside", { className: "channel-list" },
            React.createElement("div", { className: "channel-list-title" },
                React.createElement(Icon, { name: "chat" }),
                React.createElement("b", null, "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F")),
            React.createElement("small", null, "\u041A\u0410\u041D\u0410\u041B\u042B \u041A\u041E\u041C\u0410\u041D\u0414\u042B"),
            channels.filter(c => c.kind === 'team').map(c => React.createElement("button", { key: c.id, className: c.id === channel.id ? 'active' : '', onClick: () => ui.go('channels', c.id) },
                React.createElement("span", null, "#"),
                c.name)),
            React.createElement("small", null, "\u041F\u0420\u041E\u0415\u041A\u0422\u042B"),
            channels.filter(c => c.kind === 'project').map(c => React.createElement("button", { key: c.id, className: c.id === channel.id ? 'active' : '', onClick: () => ui.go('channels', c.id) },
                React.createElement("span", null, "#"),
                c.name)),
            React.createElement("small", null, "\u041B\u0418\u0427\u041D\u041E\u0415"),
            React.createElement("button", { onClick: () => ui.go('assistant') },
                React.createElement(Icon, { name: "spark", size: 17 }),
                "\u041C\u043E\u0439 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442")),
        React.createElement("section", { className: "conversation" },
            React.createElement("header", { className: "conversation-head" },
                React.createElement("div", null,
                    React.createElement("h1", null, thread ? React.createElement(React.Fragment, null,
                        React.createElement("button", { className: "icon-button", "aria-label": "\u041D\u0430\u0437\u0430\u0434 \u0432 \u043A\u0430\u043D\u0430\u043B", onClick: () => ui.go('channels', channel.id) }, "\u2190"),
                        thread.title) : '# ' + channel.name),
                    React.createElement("p", null, thread ? 'Рабочий тред · ' + (thread.rootRunId || 'обсуждение') : 'Люди и AI · ' + ui.space?.memberIds.length + ' участников · без скрытых решений')),
                React.createElement(Button, { small: true, variant: "ghost", icon: "search", onClick: () => ui.open('search') }, "\u041F\u043E\u0438\u0441\u043A")),
            React.createElement("div", { className: "message-log", id: "message-log", role: "log", "aria-label": "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439" },
                messages.length > f.limit && React.createElement(Button, { small: true, variant: "secondary", onClick: () => ui.set(key, 'limit', f.limit + 70) }, "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F"),
                messages.slice(-f.limit).map(m => React.createElement(ChatMessage, { key: m.id, m: m })),
                !messages.length && React.createElement("div", { className: "channel-empty" },
                    React.createElement("span", null, "#"),
                    React.createElement("h2", null,
                        "\u041D\u0430\u0447\u0430\u043B\u043E \u043A\u0430\u043D\u0430\u043B\u0430 ",
                        channel.name),
                    React.createElement("p", null, "\u041E\u0431\u0441\u0443\u0436\u0434\u0430\u0439\u0442\u0435 \u0440\u0430\u0431\u043E\u0442\u0443, \u043E\u0431\u0440\u0430\u0449\u0430\u0439\u0442\u0435\u0441\u044C \u043A \u043A\u043E\u043B\u043B\u0435\u0433\u0430\u043C \u0447\u0435\u0440\u0435\u0437 @\u0418\u043C\u044F \u0438 \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0439\u0442\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0432 \u0437\u0430\u0434\u0430\u0447\u0438."))),
            React.createElement("form", { className: "composer", onSubmit: (e) => { e.preventDefault(); send(); } },
                React.createElement("label", { className: "sr-only", htmlFor: "message-input" }, "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0432 \u043A\u0430\u043D\u0430\u043B"),
                React.createElement("textarea", { id: "message-input", rows: 3, value: f.text, onChange: (e) => ui.set(key, 'text', e.target.value), placeholder: thread ? 'Ответить в треде…' : `Написать в #${channel.name}…`, onKeyDown: (e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            send();
                        }
                    } }),
                React.createElement("div", null,
                    React.createElement("span", null,
                        "\u0422\u0435\u043A\u0441\u0442 \u0438 \u0440\u0435\u0430\u043A\u0446\u0438\u0438 \u043D\u0435 \u044F\u0432\u043B\u044F\u044E\u0442\u0441\u044F approval. ",
                        React.createElement("kbd", null, "Ctrl \u21B5")),
                    React.createElement(Button, { type: "submit", icon: "arrow", disabled: !f.text.trim() || ui.offline }, "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C")))));
}
export function AssistantPage() { const key = 'assistant'; const f = ui.form(key, { text: '' }); const messages = ui.all('messages').filter(m => m.privateTo === ui.user?.id && ['private', 'assistant'].includes(m.kind)); return React.createElement(React.Fragment, null,
    React.createElement(Heading, { eyebrow: "\u041B\u0418\u0427\u041D\u041E\u0415 / \u0422\u041E\u041B\u042C\u041A\u041E \u0414\u041B\u042F \u0412\u0410\u0421", title: "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442", description: "\u041F\u043E\u043C\u043E\u0433\u0430\u0435\u0442 \u0441 \u043E\u0447\u0435\u0440\u0435\u0434\u044C\u044E \u0438 \u0444\u043E\u0440\u043C\u0443\u043B\u0438\u0440\u043E\u0432\u043A\u0430\u043C\u0438. \u041D\u0435 \u043F\u043E\u0434\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442 approval \u0438 \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0431\u0435\u0437 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F." }),
    React.createElement("div", { className: "assistant-layout" },
        React.createElement(Panel, { title: "\u0412\u0430\u0448 \u0447\u0430\u0441\u0442\u043D\u044B\u0439 \u0434\u0438\u0430\u043B\u043E\u0433", meta: "\u041E\u0442\u0432\u0435\u0442\u044B \u0434\u0435\u0442\u0435\u0440\u043C\u0438\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u044B; \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0430\u044F LLM \u043D\u0435 \u0432\u044B\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F" },
            React.createElement("div", { className: "assistant-messages" }, messages.length ? messages.map(m => React.createElement(ChatMessage, { key: m.id, m: m })) : React.createElement(Empty, { icon: "spark", title: `Чем займёмся, ${ui.user?.name}?`, description: "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u0435, \u043A\u0430\u043A\u0438\u0435 \u043F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u044F \u043E\u0436\u0438\u0434\u0430\u044E\u0442 \u0432\u0430\u0441, \u0438\u043B\u0438 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C\u0442\u0435 \u043D\u043E\u0432\u0443\u044E \u0437\u0430\u0434\u0430\u0447\u0443." })),
            React.createElement("form", { onSubmit: (e) => { e.preventDefault(); void ui.act(async () => { await ui.cmd('message.send', { private: true, text: f.text }); ui.set(key, 'text', ''); }, ''); } },
                React.createElement(Field, { label: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0443", form: key, field: "text", type: "textarea", placeholder: "\u0427\u0442\u043E \u043E\u0436\u0438\u0434\u0430\u0435\u0442 \u043C\u043E\u0435\u0433\u043E \u0440\u0435\u0448\u0435\u043D\u0438\u044F?" }),
                React.createElement(Button, { type: "submit", disabled: !f.text.trim() }, "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C"))),
        React.createElement(Panel, { title: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u043F\u043E\u0440\u0443\u0447\u0435\u043D\u0438\u0435" },
            React.createElement("p", null, "\u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u0441\u043E\u0437\u0434\u0430\u0441\u0442 \u043B\u0438\u0447\u043D\u043E\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435. \u041F\u0440\u043E\u0435\u043A\u0442\u043D\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0441\u043B\u0435 \u0432\u0430\u0448\u0435\u0433\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F."),
            React.createElement(Field, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438", form: key, field: "title", placeholder: "\u0423\u043B\u0443\u0447\u0448\u0438\u0442\u044C \u043F\u043E\u043D\u044F\u0442\u043D\u043E\u0441\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432 \u0437\u0430\u044F\u0432\u043E\u043A" }),
            React.createElement(Button, { disabled: !ui.project || !f.title?.trim(), onClick: () => void ui.act(() => ui.cmd('assistant.propose', { projectId: ui.project?.id, title: f.title })) }, "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435"),
            ui.scoped('assistantProposals').map(p => React.createElement("div", { className: "assistant-proposal", key: p.id },
                React.createElement("h3", null, p.title),
                React.createElement(Badge, { value: p.status }),
                p.status === 'Pending' && React.createElement("div", { className: "inline-actions" },
                    React.createElement(Button, { small: true, onClick: () => void ui.act(() => ui.cmd('assistant.confirm', { confirm: true }, p), 'Задача создана после подтверждения') }, "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C"),
                    React.createElement(Button, { small: true, variant: "secondary", onClick: () => void ui.act(() => ui.cmd('assistant.confirm', { confirm: false }, p), 'Предложение отменено. Задача не создана.') }, "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C"))))))); }
