const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const WorkspaceMember = require('../models/WorkspaceMember');

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
    id: task._id?.toString?.() || task._id || 'unknown',
    title: limitText(task.title, 120),
    status: task.status || 'unknown',
    priority: task.priority || 'normal',
    dueDate: task.dueDate || null,
    assignee: task.assignedTo?.name || task.assignedTo || 'Unassigned',
    attachmentsCount: Array.isArray(task.attachments) ? task.attachments.length : 0,
  };
}

function normalizeProject(project = {}) {
  return {
    id: project._id?.toString?.() || project._id || 'unknown',
    name: limitText(project.name, 120),
    description: limitText(project.description, 200),
    status: project.status || 'active',
  };
}

function normalizeMember(member = {}) {
  return {
    name: limitText(member.name || 'Unknown', 80),
    role: member.role || 'member',
    email: member.email || 'unknown@example.com',
  };
}

async function fetchWorkspaceContext(workspaceId, focusedTaskId = null) {
  try {
    // Fetch tasks
    const tasksQuery = Task.find({ workspaceId }, 'title status priority dueDate assignedTo attachments -_id').lean().limit(40);
    const tasksData = await tasksQuery;
    
    // Fetch projects
    const projectsQuery = Project.find({ workspaceId }, 'name description status -_id').lean().limit(20);
    const projectsData = await projectsQuery;
    
    // Fetch members
    const membersQuery = User.find({ workspaceId: workspaceId }, 'name role email -_id').lean().limit(12);
    const membersData = await membersQuery;
    
    // Fetch focused task if provided
    let focusedTask = null;
    if (focusedTaskId) {
      try {
        focusedTask = await Task.findById(focusedTaskId, 'title status priority dueDate assignedTo -_id').populate('assignedTo', 'name').lean();
      } catch (err) {
        console.warn('[ai-context] Failed to fetch focused task:', err.message);
      }
    }

    return {
      tasksCount: tasksData.length,
      projectsCount: projectsData.length,
      membersCount: membersData.length,
      tasksSummary: tasksData.slice(0, 20).map(normalizeTask),
      projectsSummary: projectsData.slice(0, 10).map(normalizeProject),
      membersSummary: membersData.slice(0, 10).map(normalizeMember),
      focusedTask: focusedTask ? normalizeTask(focusedTask) : null,
      tasksByStatus: {
        todo: tasksData.filter(t => t.status === 'todo').length,
        inProgress: tasksData.filter(t => t.status === 'in-progress' || t.status === 'inProgress').length,
        completed: tasksData.filter(t => t.status === 'completed').length,
        blocked: tasksData.filter(t => t.status === 'blocked').length,
      },
      overdueTasks: tasksData.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    };
  } catch (err) {
    console.error('[ai-context-fetch-error]', err.message);
    return {
      tasksCount: 0,
      projectsCount: 0,
      membersCount: 0,
      tasksSummary: [],
      projectsSummary: [],
      membersSummary: [],
      focusedTask: null,
      tasksByStatus: {},
      overdueTasks: 0,
      error: 'Unable to fetch workspace context',
    };
  }
}

function buildSystemPrompt({ workspaceRole, userName, workspaceContext, userProvidedContext }) {
  const merged = {
    ...workspaceContext,
    ...userProvidedContext,
  };

  return [
    'You are FlowForge AI Assistant, a helpful project management assistant inside a workspace SaaS app.',
    'Your role is to help with task management, project planning, team coordination, and productivity insights.',
    'Import principles:',
    '- Base answers on workspace data, conversation history, and user prompts ONLY.',
    '- Do NOT invent tasks, owners, dates, budgets, or progress that doesn\'t exist in the data provided.',
    '- If context is missing, acknowledge it and suggest the next useful action.',
    '- Be practical, concise, professional, and use short bullet points when helpful.',
    '- If asked about workspace management, automation, or team features, offer relevant suggestions.',
    `Current user: ${userName || 'Workspace member'} (Role: ${workspaceRole || 'unknown'}).`,
    `Workspace overview: ${merged.tasksCount || 0} total tasks, ${merged.projectsCount || 0} projects, ${merged.membersCount || 0} team members.`,
    `Task status breakdown: ${merged.tasksByStatus?.todo || 0} todo, ${merged.tasksByStatus?.inProgress || 0} in-progress, ${merged.tasksByStatus?.completed || 0} completed, ${merged.overdueTasks || 0} overdue.`,
    `Top projects: ${(merged.projectsSummary || []).slice(0, 3).map(p => p.name).join(', ') || 'None visible'}.`,
    `Recent tasks: ${(merged.tasksSummary || []).slice(0, 3).map(t => `"${t.title}" (${t.status})`).join(', ') || 'None available'}.`,
    `Team members: ${(merged.membersSummary || []).slice(0, 5).map(m => `${m.name} (${m.role})`).join(', ') || 'None visible'}.`,
  ].join(' ');
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

async function generateAssistantReply({ prompt, history, context, workspaceId, userId, workspaceRole, userName }) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = stripWrappingQuotes(process.env.GROQ_MODEL || 'llama-3.1-8b-instant');

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured. Please set it in your environment variables.');
  }

  if (!model) {
    throw new Error('GROQ_MODEL is not configured. Please set it in your environment variables.');
  }

  // Fetch live workspace context
  let workspaceContext = {};
  if (workspaceId) {
    workspaceContext = await fetchWorkspaceContext(workspaceId, context?.focusedTask?._id || context?.focusedTaskId);
  }

  // Normalize user-provided context
  const userContext = context || {};
  const normalizedContext = {
    projectName: limitText(userContext.projectName || 'Current workspace', 120),
    focusedTask: userContext.focusedTask
      ? {
          title: limitText(userContext.focusedTask.title, 120),
          status: userContext.focusedTask.status || 'unknown',
          priority: userContext.focusedTask.priority || 'normal',
          dueDate: userContext.focusedTask.dueDate || null,
          assignee: userContext.focusedTask.assignedTo?.name || userContext.focusedTask.assignedTo || 'Unassigned',
        }
      : workspaceContext.focusedTask || null,
    selectedMembers: Array.isArray(userContext.selectedMembers)
      ? userContext.selectedMembers.slice(0, 12).map((m) => ({
          name: limitText(m.name || 'Unknown', 80),
          role: m.role || 'member',
        }))
      : workspaceContext.membersSummary || [],
    tasks: Array.isArray(userContext.tasks)
      ? userContext.tasks.slice(0, 40).map(normalizeTask)
      : workspaceContext.tasksSummary || [],
  };

  console.log('[ai-assistant] Generating response', {
    workspaceId,
    userId,
    promptLength: prompt.length,
    contextAvailable: !!workspaceContext.tasksCount,
  });

  const systemPrompt = buildSystemPrompt({
    workspaceRole,
    userName,
    workspaceContext,
    userProvidedContext: normalizedContext,
  });

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
          content: systemPrompt,
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
    console.error('[ai-groq-error]', { status: response.status, message, error: payload?.error });
    throw new Error(message);
  }

  const reply = payload?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error('AI returned empty response. Please try again.');
  }

  console.log('[ai-assistant-success]', { responseLength: reply.length });
  return reply;
}

module.exports = {
  generateAssistantReply,
  fetchWorkspaceContext,
};
