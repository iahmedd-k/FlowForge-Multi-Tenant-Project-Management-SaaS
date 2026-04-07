import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { askAssistant } from '../../../api/ai.api';
import AssigneeIcon from '../ui/AssigneeIcon';

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="ai-sidekick-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1fd6ff" />
          <stop offset="35%" stopColor="#5a7cff" />
          <stop offset="68%" stopColor="#a646ff" />
          <stop offset="100%" stopColor="#ff8a4c" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.8l1.45 4.14 4.14 1.45-4.14 1.45L12 13.98l-1.45-4.14-4.14-1.45 4.14-1.45L12 2.8Z"
        fill="url(#ai-sidekick-gradient)"
      />
      <path
        d="M18.5 11.2l.9 2.56 2.56.9-2.56.9-.9 2.56-.9-2.56-2.56-.9 2.56-.9.9-2.56Z"
        fill="url(#ai-sidekick-gradient)"
      />
      <path
        d="M6.4 13.6l.8 2.24 2.24.8-2.24.8-.8 2.24-.8-2.24-2.24-.8 2.24-.8.8-2.24Z"
        fill="url(#ai-sidekick-gradient)"
      />
    </svg>
  );
}

function TaskIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2.5" />
      <path d="M9 9h6M9 12h6" />
    </svg>
  );
}

function SuggestionIcon({ tone = 'violet' }) {
  const color =
    tone === 'blue' ? '#1570ef' :
    tone === 'green' ? '#12b76a' :
    tone === 'orange' ? '#f79009' :
    '#9e77ed';

  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
      <path d="M7 7l10 10" />
    </svg>
  );
}

function buildSuggestions(context) {
  const focusTitle = context?.focusedTask?.title || context?.projectName || 'this item';
  const focusDue = context?.focusedTask?.dueDate
    ? new Date(context.focusedTask.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : null;

  if (context?.focusedTask?.title) {
    return [
      {
        id: 'update',
        tone: 'violet',
        label: `Draft a progress update for ${focusTitle}.`,
      },
      {
        id: 'checklist',
        tone: 'blue',
        label: focusDue
          ? `Create next-step checklist for ${focusTitle} before ${focusDue}.`
          : `Create next-step checklist for ${focusTitle}.`,
      },
      {
        id: 'risks',
        tone: 'green',
        label: `Identify risks and blockers for ${focusTitle}.`,
      },
    ];
  }

  return [
    { id: 'summary', tone: 'violet', label: 'Summarize current project status.' },
    { id: 'owners', tone: 'blue', label: 'Show workload by owner.' },
    { id: 'risks', tone: 'green', label: 'Review timeline risks and overdue work.' },
  ];
}

export default function AISidekickPanel({ open, onClose, context, userName }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const cleanedContext = useMemo(
    () => ({
      projectName: context?.projectName || 'Current workspace',
      focusedTask: context?.focusedTask || null,
      selectedMembers: Array.isArray(context?.selectedMembers) ? context.selectedMembers : [],
      tasks: Array.isArray(context?.tasks) ? context.tasks : [],
    }),
    [context]
  );

  const suggestions = useMemo(() => buildSuggestions(cleanedContext), [cleanedContext]);
  const contextLabel = cleanedContext.focusedTask?.title || cleanedContext.projectName || 'Current item';
  const firstName = (userName || 'there').split(' ')[0];

  const assistantMutation = useMutation({
    mutationFn: ({ prompt, history }) =>
      askAssistant({
        prompt,
        history,
        context: cleanedContext,
        userName,
      }).then((res) => res.data.data.reply),
    onSuccess: (reply, variables) => {
      setMessages((current) => [...current, { id: `${variables.idBase}-a`, role: 'assistant', text: reply }]);
    },
    onError: (error, variables) => {
      setMessages((current) => [
        ...current,
        {
          id: `${variables.idBase}-e`,
          role: 'assistant',
          text: error.response?.data?.message || 'AI Assistant is unavailable right now.',
        },
      ]);
    },
  });

  useEffect(() => {
    if (!open) return;
    setInput('');
    setMessages([]);
    setShowSuggestions(true);
  }, [open, cleanedContext.projectName, cleanedContext.focusedTask?.title]);

  useEffect(() => {
    if (!open || showSuggestions) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, assistantMutation.isPending, open, showSuggestions]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, showSuggestions ? 92 : 120)}px`;
  }, [input, open, showSuggestions]);

  if (!open) return null;

  const submitPrompt = (prompt) => {
    const trimmed = prompt.trim();
    if (!trimmed || assistantMutation.isPending) return;

    const idBase = Date.now();
    const history = messages.map((message) => ({
      role: message.role,
      text: message.text,
    }));

    setShowSuggestions(false);
    setMessages((current) => [...current, { id: `${idBase}-u`, role: 'user', text: trimmed }]);
    setInput('');

    assistantMutation.mutate({
      idBase,
      prompt: trimmed,
      history,
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitPrompt(input);
    }
  };

  return (
    <div className="fixed inset-y-[54px] right-0 z-40 flex w-full max-w-[390px]">
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />

      <aside className="relative ml-auto flex h-full w-full flex-col overflow-hidden rounded-l-[26px] border-l border-[#dbe3f2] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_60%,#f3f6ff_100%)] shadow-[-18px_0_40px_rgba(15,23,42,0.12)]">
        <div className="border-b border-[#e4e8f3] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SparkleIcon />
              <button type="button" className="flex items-center gap-2 text-left text-[15px] font-semibold text-[#363b49]">
                <span>AI Sidekick</span>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[#4b5565]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 6.5 8 10l4-3.5" />
                </svg>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-[28px] leading-none text-[#3f4656] transition hover:text-[#0f1728]"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[12px] text-[#6a7286]">
            <TaskIcon />
            <span className="truncate">{contextLabel}</span>
          </div>
        </div>

        {showSuggestions ? (
          <div className="flex flex-1 flex-col px-6 py-6">
            <div className="mb-5">
              <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-[#313645]">Hey {firstName},</h2>
              <p className="mt-2 text-[13px] leading-5 text-[#6f7688]">How can I help you move forward with this item?</p>
            </div>

            <div className="rounded-[22px] border border-[#b8c4db] bg-white px-5 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
              <textarea
                ref={textareaRef}
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI Sidekick..."
                className="max-h-[92px] min-h-[48px] w-full resize-none overflow-y-auto border-0 bg-transparent text-[13px] leading-6 text-[#262c3a] outline-none placeholder:text-[#747b90]"
              />

              <div className="mt-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => submitPrompt(input)}
                  disabled={!input.trim() || assistantMutation.isPending}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eceff7] text-[#8e96ab] transition hover:bg-[#e3e8f4] disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Send"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10h12M11 5l5 5-5 5" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-[12px] font-semibold text-[#6f7688]">Action suggestions</p>
              <div className="space-y-2.5">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => submitPrompt(suggestion.label)}
                    className="flex w-full items-start gap-3 rounded-[14px] bg-white px-4 py-3 text-left shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:bg-[#fbfcff] hover:shadow-[0_10px_24px_rgba(15,23,42,0.07)]"
                  >
                    <span className="mt-0.5 shrink-0">
                      <SuggestionIcon tone={suggestion.tone} />
                    </span>
                    <span className="text-[12px] leading-6 text-[#3b4150]">{suggestion.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.role === 'user' ? (
                      <div className="ml-auto max-w-[86%]">
                        <div className="mb-2 flex justify-end">
                          <AssigneeIcon assigned size="lg" />
                        </div>
                        <div className="rounded-[16px] bg-[#cfe5ff] px-5 py-4 text-[12px] leading-7 text-[#334155] shadow-[0_8px_24px_rgba(79,130,214,0.08)]">
                          <div className="whitespace-pre-line">{message.text}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-[92%]">
                        <div className="mb-3 flex items-center gap-2.5">
                          <SparkleIcon />
                          <span className="text-[14px] font-semibold text-[#343949]">AI Sidekick</span>
                        </div>
                        <div className="text-[12px] leading-8 text-[#3b4150]">
                          <div className="whitespace-pre-line">{message.text}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {assistantMutation.isPending ? (
                  <div className="max-w-[92%]">
                    <div className="mb-3 flex items-center gap-2.5">
                      <SparkleIcon />
                      <span className="text-[14px] font-semibold text-[#343949]">AI Sidekick</span>
                    </div>
                    <div className="text-[12px] leading-7 text-[#8a92a6]">Thinking...</div>
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-[#e4e8f3] bg-[rgba(255,255,255,0.78)] px-5 py-4 backdrop-blur-sm">
              <div className="rounded-[20px] border border-[#c9d4e7] bg-white px-4 py-3 shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message AI Sidekick..."
                  className="max-h-[120px] min-h-[32px] w-full resize-none overflow-y-auto border-0 bg-transparent text-[13px] leading-6 text-[#262c3a] outline-none placeholder:text-[#747b90]"
                />

                <div className="mt-3 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => submitPrompt(input)}
                    disabled={!input.trim() || assistantMutation.isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eceff7] text-[#8e96ab] transition hover:bg-[#e3e8f4] disabled:cursor-not-allowed disabled:opacity-70"
                    aria-label="Send"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 10h12M11 5l5 5-5 5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
