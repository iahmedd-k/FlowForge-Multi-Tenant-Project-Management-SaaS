const Automation = require('../models/Automation');
const Notification = require('../models/notifications');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const WorkspaceMember = require('../models/WorkspaceMember');
const {
  sendTaskAssignmentEmail,
  sendTaskStatusChangeEmail,
  sendPriorityAlertEmail,
  sendDueDateReminderEmail,
  sendCommentMentionEmail,
} = require('../services/email.service');
const { sendSlackNotification } = require('../services/slack.service');

async function getActiveAutomation(workspaceId, key) {
  return Automation.findOne({ workspaceId, key, isActive: true }).lean();
}

async function createNotification({ workspaceId, userId, type, message, link, dedupeHours = 0 }) {
  if (!workspaceId || !userId || !message) return null;

  if (dedupeHours > 0) {
    const existing = await Notification.findOne({
      workspaceId,
      userId,
      type,
      message,
      createdAt: { $gte: new Date(Date.now() - dedupeHours * 60 * 60 * 1000) },
    }).lean();

    if (existing) return existing;
  }

  return Notification.create({
    workspaceId,
    userId,
    type,
    message,
    link: link || null,
  });
}

function normalizeHandle(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function extractMentionHandles(text = '') {
  const matches = text.match(/(^|\s)@([a-zA-Z0-9._-]+)/g) || [];
  return Array.from(
    new Set(
      matches
        .map((entry) => entry.trim().slice(1))
        .map((entry) => normalizeHandle(entry))
        .filter(Boolean)
    )
  );
}

function getUserHandles(user) {
  const handles = new Set();
  const name = user?.name || '';
  const email = user?.email || '';
  const compactName = normalizeHandle(name);
  if (compactName) handles.add(compactName);

  name
    .split(/\s+/)
    .map((part) => normalizeHandle(part))
    .filter(Boolean)
    .forEach((part) => handles.add(part));

  const emailLocal = normalizeHandle(email.split('@')[0] || '');
  if (emailLocal) handles.add(emailLocal);

  return handles;
}

async function handleTaskAssigned({ task, actorUserId }) {
  const assignedUserId = task?.assignedTo?._id || task?.assignedTo;
  if (!task?.workspaceId || !assignedUserId) return;

  const isActive = await getActiveAutomation(task.workspaceId, 'task_assignment_notification');
  if (!isActive) return;

  if (actorUserId && String(actorUserId) === String(assignedUserId)) return;

  const assignee = task?.assignedTo?.email
    ? task.assignedTo
    : await User.findById(assignedUserId).select('name email notifyAssignments').lean();

  if (!assignee || assignee.notifyAssignments === false) return;

  const project = await Project.findById(task.projectId).select('name').lean();
  const link = `/projects/${task.projectId}`;

  // Create in-app notification
  await createNotification({
    workspaceId: task.workspaceId,
    userId: assignedUserId,
    type: 'task_assigned',
    message: `You were assigned "${task.title}"`,
    link,
    dedupeHours: 2,
  });

  // Send email with enhanced information
  await sendTaskAssignmentEmail({
    to: assignee.email,
    recipientName: assignee.name,
    taskTitle: task.title,
    projectName: project?.name || 'Unnamed Project',
    workspaceName: task.workspaceName,
    priority: task.priority || 'medium',
    dueDate: task.dueDate,
    projectPath: link,
  }).catch((err) => {
    console.error('[task-assignment-email-error]', {
      email: assignee.email,
      taskId: task._id,
      error: err.message,
    });
  });

  // Send Slack notification if webhook is configured
  const actor = task.assignedTo?.name || (await User.findById(actorUserId)?.select('name'))?.name || 'Team member';
  await sendSlackNotification(task.workspaceId, {
    title: '✓ Task Assigned',
    message: `${assignee.name} was assigned to task *${task.title}*`,
    actorName: actor,
    actorUserId,
  });
}

async function handleTaskStatusChanged({ task, newStatus, previousStatus, actorUserId }) {
  if (!task?._id) return;

  if (newStatus !== 'done' && task.completedAt) {
    task.completedAt = null;
    await task.save();
    return;
  }

  const isActive = await getActiveAutomation(task.workspaceId, 'status_change_completion');
  if (!isActive) return;

  if (previousStatus !== 'done' && newStatus === 'done') {
    task.completedAt = new Date();
    await task.save();
  }

  // Send email to assignee about status change
  if (task.assignedTo && previousStatus !== newStatus) {
    const assignee = task.assignedTo.email
      ? task.assignedTo
      : await User.findById(task.assignedTo._id || task.assignedTo).select('name email notifyStatus').lean();

    if (assignee && assignee.notifyStatus !== false) {
      const project = await Project.findById(task.projectId).select('name').lean();
      
      await sendTaskStatusChangeEmail({
        to: assignee.email,
        recipientName: assignee.name,
        taskTitle: task.title,
        projectName: project?.name || 'Unnamed Project',
        newStatus,
        workspaceName: task.workspaceName,
        projectPath: `/projects/${task.projectId}`,
      }).catch((err) => {
        console.error('[task-status-email-error]', {
          email: assignee.email,
          taskId: task._id,
          error: err.message,
        });
      });
    }
  }

  // Send Slack notification for status change
  if (task?.workspaceId && previousStatus !== newStatus) {
    await sendSlackNotification(task.workspaceId, {
      title: '🔄 Task Status Changed',
      message: `Task *${task.title}* moved to *${newStatus.replace(/_/g, ' ')}*`,
      actorName: 'Team member',
      timestamp: new Date(),
      link: `/projects/${task.projectId}`,
    }).catch(() => {});
  }
}

async function handlePriorityAlert(task) {
  if (!task?.workspaceId || !['high', 'urgent'].includes(task.priority)) return;

  const isActive = await getActiveAutomation(task.workspaceId, 'priority_based_alert');
  if (!isActive) return;

  const recipients = await getProjectStakeholders(task);

  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        workspaceId: task.workspaceId,
        userId,
        type: 'priority_alert',
        message: `High-priority task created: "${task.title}"`,
        link: `/projects/${task.projectId}`,
        dedupeHours: 12,
      })
    )
  );
}

async function handleTaskCreated(task) {
  // Send Slack notification for new task
  if (task?.workspaceId) {
    const project = task.projectId?.name || 'Unknown Project';
    const creator = task.createdBy?.name || task.workspaceName || 'Team member';
    
    await sendSlackNotification(task.workspaceId, {
      title: '📝 New Task Created',
      message: `New task *${task.title}* was created in *${project}*`,
      actorName: creator,
      timestamp: new Date(),
      link: `/projects/${task.projectId}`,
    }).catch(() => {});
  }

  await handleUnassignedTaskAlert(task);
  await handlePriorityAlert(task);
}

async function handleReviewStageAlert(task) {
  if (!task?.workspaceId || task.status !== 'review') return;

  const isActive = await getActiveAutomation(task.workspaceId, 'review_stage_alert');
  if (!isActive) return;

  const recipients = await getProjectStakeholders(task);

  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        workspaceId: task.workspaceId,
        userId,
        type: 'review_alert',
        message: `"${task.title}" is ready for review`,
        link: `/projects/${task.projectId}`,
        dedupeHours: 8,
      })
    )
  );
}

async function handleUnassignedTaskAlert(task) {
  if (!task?.workspaceId || task.assignedTo) return;

  const isActive = await getActiveAutomation(task.workspaceId, 'unassigned_task_alert');
  if (!isActive) return;

  const recipients = await getProjectStakeholders(task);
  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        workspaceId: task.workspaceId,
        userId,
        type: 'unassigned_task_alert',
        message: `New unassigned task: "${task.title}"`,
        link: `/projects/${task.projectId}`,
        dedupeHours: 12,
      })
    )
  );
}

async function handleCommentMention({ task, text, authorUserId }) {
  if (!task?.workspaceId || !text?.trim()) return;

  const isActive = await getActiveAutomation(task.workspaceId, 'comment_mention_trigger');
  if (!isActive) return;

  const mentionHandles = extractMentionHandles(text);
  if (!mentionHandles.length) return;

  const members = await WorkspaceMember.find({ workspaceId: task.workspaceId })
    .populate('userId', 'name email notifyComments')
    .lean();

  const recipients = members
    .map((entry) => entry.userId)
    .filter(Boolean)
    .filter((user) => String(user._id) !== String(authorUserId))
    .filter((user) => user.notifyComments !== false)
    .filter((user) => {
      const handles = getUserHandles(user);
      return mentionHandles.some((handle) => handles.has(handle));
    });

  await Promise.all(
    recipients.map((user) =>
      createNotification({
        workspaceId: task.workspaceId,
        userId: user._id,
        type: 'comment_mention',
        message: `You were mentioned in "${task.title}"`,
        link: `/projects/${task.projectId}`,
        dedupeHours: 1,
      })
    )
  );
}

async function runDueDateAutomations() {
  const rules = await Automation.find({
    key: 'due_date_reminder',
    isActive: true,
  }).lean();

  for (const rule of rules) {
    const hours = Number(rule?.config?.reminderHours || 24);
    const now = new Date();
    const upcomingCutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const [upcomingTasks, overdueTasks] = await Promise.all([
      Task.find({
        workspaceId: rule.workspaceId,
        dueDate: { $gte: now, $lte: upcomingCutoff },
        status: { $ne: 'done' },
        assignedTo: { $ne: null },
      }).populate('assignedTo', 'notifyReminders').lean(),
      Task.find({
        workspaceId: rule.workspaceId,
        dueDate: { $lt: now },
        status: { $ne: 'done' },
      }).populate('assignedTo', 'notifyReminders').lean(),
    ]);

    await Promise.all(
      upcomingTasks
        .filter((task) => task.assignedTo?.notifyReminders !== false)
        .map((task) =>
          createNotification({
            workspaceId: task.workspaceId,
            userId: task.assignedTo._id || task.assignedTo,
            type: 'due_date_approaching',
            message: `"${task.title}" is due within ${hours} hours`,
            link: `/projects/${task.projectId}`,
            dedupeHours: Math.max(1, Math.floor(hours / 2)),
          })
        )
    );

    await Promise.all(
      overdueTasks.map(async (task) => {
        if (!task.overdueMarkedAt) {
          await Task.updateOne({ _id: task._id }, { $set: { overdueMarkedAt: new Date() } });
        }

        if (task.assignedTo && task.assignedTo.notifyReminders !== false) {
          await createNotification({
            workspaceId: task.workspaceId,
            userId: task.assignedTo._id || task.assignedTo,
            type: 'task_overdue',
            message: `"${task.title}" is overdue`,
            link: `/projects/${task.projectId}`,
            dedupeHours: 24,
          });

          // Send Slack notification for overdue task
          await sendSlackNotification(task.workspaceId, {
            title: '⚠️ Task Overdue',
            message: `Task *${task.title}* is overdue. Assigned to: *${task.assignedTo?.name || 'Unknown'}*`,
            actorName: 'System',
            timestamp: new Date(),
            link: `/projects/${task.projectId}`,
          }).catch(() => {});
        }
      })
    );
  }
}

async function runProjectDeadlineWarnings() {
  const rules = await Automation.find({
    key: 'project_deadline_warning',
    isActive: true,
  }).lean();

  for (const rule of rules) {
    const hours = Number(rule?.config?.projectDeadlineHours || 48);
    const now = new Date();
    const warningCutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const projects = await Project.find({
      workspaceId: rule.workspaceId,
      deadline: { $gte: now, $lte: warningCutoff },
      status: { $nin: ['completed', 'archived'] },
    }).populate('members', 'notifyReminders').lean();

    for (const project of projects) {
      const recipients = Array.isArray(project.members) ? project.members : [];

      await Promise.all(
        recipients
          .filter((member) => member?.notifyReminders !== false)
          .map((member) =>
            createNotification({
              workspaceId: rule.workspaceId,
              userId: member._id,
              type: 'project_deadline_warning',
              message: `Project "${project.name}" deadline is approaching`,
              link: `/projects/${project._id}`,
              dedupeHours: 18,
            })
          )
      );
    }
  }
}

module.exports = {
  handleTaskAssigned,
  handleTaskCreated,
  handleTaskStatusChanged,
  handleCommentMention,
  runDueDateAutomations,
  runProjectDeadlineWarnings,
};
