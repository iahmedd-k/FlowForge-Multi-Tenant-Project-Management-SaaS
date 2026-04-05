const Task         = require('../models/Task');
const Project      = require('../models/Project');
const Notification = require('../models/notifications');
const WorkspaceMember = require('../models/WorkspaceMember');
const { success, error } = require('../utils/response.util');
const { uploadBase64File } = require('../services/cloudinary.service');
const {
  isWorkspaceManager,
  buildTaskAccessFilter,
  findAccessibleProject,
} = require('../services/access.service');

// ─── helpers ──────────────────────────────────────────────

// auto-suggest priority from due date — the "AI" suggestion
const suggestPriority = (dueDate) => {
  if (!dueDate) return 'medium';
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (days <= 2)  return 'urgent';
  if (days <= 7)  return 'high';
  if (days <= 14) return 'medium';
  return 'low';
};

// fire a notification helper
const notify = (workspaceId, userId, type, message, link) =>
  Notification.create({ workspaceId, userId, type, message, link }).catch(() => {});

function canUpdateTask(req, task) {
  if (isWorkspaceManager(req)) return true;
  return String(task.assignedTo || '') === String(req.user.userId || '');
}

async function getAccessibleProject(req, projectId) {
  return findAccessibleProject(req, projectId);
}

async function validateAssignableUser({ workspaceId, project, assignedTo, autoJoinProject = false }) {
  if (!assignedTo) return { ok: true };

  const membership = await WorkspaceMember.findOne({
    workspaceId,
    userId: assignedTo,
  }).select('_id');

  if (!membership) {
    return { ok: false, message: 'Assignee must belong to this workspace' };
  }

  const isProjectMember = project.members?.some((memberId) => memberId.toString() === assignedTo.toString());
  if (!isProjectMember) {
    if (autoJoinProject) {
      project.members = Array.isArray(project.members) ? project.members : [];
      project.members.push(assignedTo);
      await project.save();
      return { ok: true };
    }

    return { ok: false, message: 'Assignee must be a member of this project' };
  }

  return { ok: true };
}

// ─── GET /api/tasks ───────────────────────────────────────
// supports filters: projectId, assignedTo, status, priority, overdue
exports.getTasks = async (req, res) => {
  try {
    const { projectId, assignedTo, status, priority, overdue, search } = req.query;
    const query = await buildTaskAccessFilter(req);

    if (projectId)  query.projectId  = projectId;
    if (assignedTo) query.assignedTo = assignedTo;
    if (status)     query.status     = status;
    if (priority)   query.priority   = priority;

    // overdue filter — dueDate passed and not done
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status  = { $ne: 'done' };
    }

    // text search on title (uses the text index we set on Task model)
    if (search) {
      query.$text = { $search: search };
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('comments.userId', 'name')
      .sort({ createdAt: -1 });

    return success(res, { tasks });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── POST /api/tasks ──────────────────────────────────────
exports.createTask = async (req, res) => {
  try {
    const {
      projectId, title, description,
      assignedTo, priority, status, dueDate, tags, attachments, comments,
    } = req.body;

    // confirm project belongs to this workspace
    const project = await getAccessibleProject(req, projectId);
    if (!project) return error(res, 'Project not found', 404);

    const assigneeCheck = await validateAssignableUser({
      workspaceId: req.workspaceId,
      project,
      assignedTo,
      autoJoinProject: isWorkspaceManager(req),
    });
    if (!assigneeCheck.ok) return error(res, assigneeCheck.message, 400);

    // use provided priority or auto-suggest from due date
    const finalPriority = priority || suggestPriority(dueDate);
    const safeAttachments = [];

    if (Array.isArray(attachments)) {
      for (const item of attachments) {
        if (item?.url && item?.filename) {
          safeAttachments.push({
            url: item.url,
            filename: item.filename,
            uploadedAt: item.uploadedAt || new Date(),
          });
          continue;
        }

        if (item?.dataUrl && item?.fileName && typeof item.dataUrl === 'string' && item.dataUrl.startsWith('data:')) {
          const uploaded = await uploadBase64File({
            dataUrl: item.dataUrl,
            fileName: item.fileName,
          });

          safeAttachments.push({
            url: uploaded.url,
            filename: uploaded.filename,
            uploadedAt: uploaded.uploadedAt || new Date(),
          });
        }
      }
    }
    const safeComments = Array.isArray(comments)
      ? comments
          .filter((item) => typeof item?.text === 'string' && item.text.trim())
          .map((item) => ({
            userId: req.user.userId,
            text: item.text.trim(),
          }))
      : [];

    const task = await Task.create({
      workspaceId: req.workspaceId,
      projectId,
      title,
      description,
      assignedTo:  assignedTo || null,
      priority:    finalPriority,
      status:      status || 'backlog',
      dueDate:     dueDate || null,
      tags:        Array.isArray(tags) ? tags.filter((tag) => typeof tag === 'string' && tag.trim()).map((tag) => tag.trim()) : [],
      attachments: safeAttachments,
      comments:    safeComments,
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('comments.userId', 'name email');

    // notify the assigned user
    if (assignedTo && assignedTo !== req.user.userId.toString()) {
      await notify(
        req.workspaceId,
        assignedTo,
        'task_assigned',
        `You were assigned "${title}"`,
        `/projects/${projectId}`
      );
    }

    return success(res, { task }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── GET /api/tasks/:id ───────────────────────────────────
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      ...(await buildTaskAccessFilter(req)),
    })
      .populate('assignedTo', 'name email')
      .populate('comments.userId', 'name email');

    if (!task) return error(res, 'Task not found', 404);

    const project = await getAccessibleProject(req, task.projectId);
    if (!project) return error(res, 'Task not found', 404);

    return success(res, { task });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── PUT /api/tasks/:id ───────────────────────────────────
exports.updateTask = async (req, res) => {
  try {
    const {
      title, description, assignedTo,
      priority, status, dueDate, tags, attachments,
    } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      ...(await buildTaskAccessFilter(req)),
    });
    if (!task) return error(res, 'Task not found', 404);

    if (!canUpdateTask(req, task)) {
      return error(res, 'You can only update tasks assigned to you', 403);
    }

    const project = await getAccessibleProject(req, task.projectId);
    if (!project) return error(res, 'Task not found', 404);

    const assigneeCheck = await validateAssignableUser({
      workspaceId: req.workspaceId,
      project,
      assignedTo,
      autoJoinProject: isWorkspaceManager(req),
    });
    if (!assigneeCheck.ok) return error(res, assigneeCheck.message, 400);

    if (!isWorkspaceManager(req)) {
      if (assignedTo !== undefined && String(assignedTo || '') !== String(task.assignedTo || '')) {
        return error(res, 'Only workspace managers can reassign tasks', 403);
      }
      if (priority !== undefined) {
        return error(res, 'Only workspace managers can change task priority', 403);
      }
      if (dueDate !== undefined) {
        return error(res, 'Only workspace managers can change due dates', 403);
      }
    }

    const prevAssignee = task.assignedTo?.toString();
    const prevStatus   = task.status;

    // apply updates
    if (title       !== undefined) task.title       = title;
    if (description !== undefined) task.description = description;
    if (assignedTo  !== undefined) task.assignedTo  = assignedTo;
    if (priority    !== undefined) task.priority    = priority;
    if (status      !== undefined) task.status      = status;
    if (dueDate     !== undefined) task.dueDate     = dueDate;
    if (tags        !== undefined) {
      task.tags = Array.isArray(tags)
        ? tags.filter((tag) => typeof tag === 'string' && tag.trim()).map((tag) => tag.trim())
        : [];
    }
    if (attachments !== undefined) {
      task.attachments = Array.isArray(attachments)
        ? attachments
            .filter((item) => item?.url && item?.filename)
            .map((item) => ({
              url: item.url,
              filename: item.filename,
              uploadedAt: item.uploadedAt || new Date(),
            }))
        : [];
    }

    await task.save();
    await task.populate('assignedTo', 'name email');

    // notify if assignee changed
    if (assignedTo && assignedTo !== prevAssignee) {
      await notify(
        req.workspaceId,
        assignedTo,
        'task_assigned',
        `You were assigned "${task.title}"`,
        `/projects/${task.projectId}`
      );
    }

    // notify assignee if status changed
    if (status && status !== prevStatus && task.assignedTo) {
      await notify(
        req.workspaceId,
        task.assignedTo._id,
        'status_changed',
        `"${task.title}" moved to ${status.replace('_', ' ')}`,
        `/projects/${task.projectId}`
      );
    }

    return success(res, { task });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    const { dataUrl, fileName } = req.body || {};

    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return error(res, 'A valid file payload is required', 400);
    }

    const uploaded = await uploadBase64File({
      dataUrl,
      fileName: typeof fileName === 'string' && fileName.trim() ? fileName.trim() : 'attachment',
    });

    return success(res, {
      attachment: {
        url: uploaded.url,
        filename: uploaded.filename,
        uploadedAt: uploaded.uploadedAt,
      },
    }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── PATCH /api/tasks/:id/status ─────────────────────────
// dedicated Kanban drag-drop endpoint — only updates status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['backlog', 'in_progress', 'review', 'done'];
    if (!allowed.includes(status))
      return error(res, `Status must be one of: ${allowed.join(', ')}`);

    const task = await Task.findOne({
      _id: req.params.id,
      ...(await buildTaskAccessFilter(req)),
    });
    if (!task) return error(res, 'Task not found', 404);

    if (!canUpdateTask(req, task)) {
      return error(res, 'You can only update tasks assigned to you', 403);
    }

    const project = await getAccessibleProject(req, task.projectId);
    if (!project) return error(res, 'Task not found', 404);

    const prevStatus = task.status;
    task.status = status;
    await task.save();

    // notify assignee on status change
    if (prevStatus !== status && task.assignedTo) {
      await notify(
        req.workspaceId,
        task.assignedTo,
        'status_changed',
        `"${task.title}" moved to ${status.replace('_', ' ')}`,
        `/projects/${task.projectId}`
      );
    }

    return success(res, { task });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── DELETE /api/tasks/:id ────────────────────────────────
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      ...(await buildTaskAccessFilter(req)),
    });
    if (!task) return error(res, 'Task not found', 404);

    const project = await getAccessibleProject(req, task.projectId);
    if (!project) return error(res, 'Task not found', 404);

    await task.deleteOne();
    return success(res, { message: 'Task deleted' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── POST /api/tasks/:id/comments ────────────────────────
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return error(res, 'Comment text required');

    const task = await Task.findOne({
      _id: req.params.id,
      ...(await buildTaskAccessFilter(req)),
    });
    if (!task) return error(res, 'Task not found', 404);

    const project = await getAccessibleProject(req, task.projectId);
    if (!project) return error(res, 'Task not found', 404);

    task.comments.push({ userId: req.user.userId, text: text.trim() });
    await task.save();
    await task.populate('comments.userId', 'name email');

    const newComment = task.comments[task.comments.length - 1];
    return success(res, { comment: newComment }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── DELETE /api/tasks/:id/comments/:commentId ───────────
exports.deleteComment = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      ...(await buildTaskAccessFilter(req)),
    });
    if (!task) return error(res, 'Task not found', 404);

    const project = await getAccessibleProject(req, task.projectId);
    if (!project) return error(res, 'Task not found', 404);

    const comment = task.comments.id(req.params.commentId);
    if (!comment) return error(res, 'Comment not found', 404);
    if (
      !isWorkspaceManager(req) &&
      comment.userId?.toString() !== req.user.userId.toString()
    ) {
      return error(res, 'Access denied', 403);
    }

    comment.deleteOne();
    await task.save();

    return success(res, { message: 'Comment deleted' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
