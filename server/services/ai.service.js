function stripWrappingQuotes(value = '') {
  return String(value).replace(/^['"]|['"]$/g, '');
}

function limitText(value, max = 600) {
  if (!value) return '';
  const text = String(value).trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function normalizeTask(task = {}) {
  return {
    title: limitText(task.title, 120),
    status: task.status || 'unknown',
    priority: task.priority || 'normal',
    dueDate: task.dueDate || null,
    assignee: task.assignedTo?.name || task.assignedTo || null,
    attachmentsCount: Array.isArray(task.attachments) ? task.attachments.length : 0,
  };
}

function normalizeContext(context = {}) {
  const tasks = Array.isArray(context.tasks) ? context.tasks.slice(0, 40).map(normalizeTask) : [];

  return {
    projectName: limitText(context.projectName || 'Current workspace', 120),
    focusedTask: context.focusedTask
      ? {
          title: limitText(context.focusedTask.title, 120),
          status: context.focusedTask.status || 'unknown',
          priority: context.focusedTask.priority || 'normal',
          dueDate: context.focusedTask.dueDate || null,
          assignee: context.focusedTask.assignedTo?.name || context.focusedTask.assignedTo || null,
        }
      : null,
    selectedMembers: Array.isArray(context.selectedMembers)
      ? context.selectedMembers.slice(0, 12).map((member) => ({
          name: limitText(member.name || 'Unknown', 80),
          role: member.role || null,
        }))
      : [],
    tasks,
  };
}

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((entry) => entry && ['user', 'assistant'].includes(entry.role) && entry.text)
    .slice(-8)
    .map((entry) => ({
      role: entry.role,
      content: limitText(entry.text, 2000),
    }));
}

function buildSystemPrompt({ workspaceRole, userName, context }) {
  return [
    'You are FlowForge AI Assistant, a concise project management assistant inside a workspace SaaS app.',
    'Answer only using the user prompt, the conversation history, and the provided workspace context.',
    'Do not invent tasks, owners, dates, budgets, or progress.',
    'If the context is missing something, say that clearly and suggest the next useful step.',
    'Keep answers practical, short, and professional.',
    'When helpful, use short bullet points.',
    `Active workspace role: ${workspaceRole || 'unknown'}.`,
    `Current user: ${userName || 'Workspace member'}.`,
    `Workspace context JSON: ${JSON.stringify(context)}.`,
  ].join(' ');
}

async function generateAssistantReply({ prompt, history, context, workspaceRole, userName }) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = stripWrappingQuotes(process.env.GROQ_MODEL || 'llama-3.1-8b-instant');

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt({
            workspaceRole,
            userName,
            context: normalizeContext(context),
          }),
        },
        ...normalizeHistory(history),
        {
          role: 'user',
          content: limitText(prompt, 4000),
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || 'Unable to generate an AI response right now.';
    throw new Error(message);
  }

  return payload?.choices?.[0]?.message?.content?.trim() || 'No response returned.';
}

module.exports = {
  generateAssistantReply,
};
