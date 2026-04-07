const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { success, error } = require('../utils/response.util');
const {
  generateICS,
  getUserTaskEvents,
  getTaskEvent,
  getProjectEvent,
} = require('../services/calendar.service');
const { isWorkspaceManager, findAccessibleProject } = require('../services/access.service');

/**
 * Generate a UUID (using simple method if uuid package not available)
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * GET /api/integrations/calendar/feed/:token
 * Public route - return ICS feed for user based on their calendar feed token
 */
exports.getFeed = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(404).type('text/plain').send('Calendar feed not found.');
    }

    // Look up user by calendar feed token
    const user = await User.findOne({ calendarFeedToken: token }).select(
      '_id workspaceId'
    );

    if (!user) {
      return res.status(404).type('text/plain').send('Calendar feed not found.');
    }

    // Fetch all non-done tasks assigned to this user with due dates
    const events = await getUserTaskEvents(user._id);

    // Generate ICS content
    const ics = generateICS(events);

    // Set appropriate headers for calendar file
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="flowforge.ics"'
    );
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    return res.send(ics);
  } catch (err) {
    console.error('[calendar feed error]', err.message);
    return res.status(500).type('text/plain').send('Calendar feed error');
  }
};

/**
 * POST /api/integrations/calendar/generate-feed-token
 * Protected route - generate or return existing calendar feed token
 */
exports.generateFeedToken = async (req, res) => {
  try {
    let user = await User.findById(req.user.userId).select('calendarFeedToken');

    // If token already exists, return it
    if (user?.calendarFeedToken) {
      return success(res, { token: user.calendarFeedToken });
    }

    // Generate new UUID token
    const newToken = generateUUID();

    // Try to save the token (loop in case of collision)
    let attempts = 0;
    let tokenExists = true;

    while (tokenExists && attempts < 5) {
      const existingUser = await User.findOne({
        calendarFeedToken: newToken,
      }).select('_id');

      if (!existingUser) {
        tokenExists = false;
        break;
      }

      attempts++;
    }

    if (tokenExists) {
      return error(res, 'Failed to generate unique token', 500);
    }

    // Save the token to the user
    user = await User.findByIdAndUpdate(
      req.user.userId,
      { calendarFeedToken: newToken },
      { new: true }
    ).select('calendarFeedToken');

    return success(res, { token: user.calendarFeedToken });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * DELETE /api/integrations/calendar/revoke-feed-token
 * Protected route - revoke the calendar feed token
 */
exports.revokeFeedToken = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { calendarFeedToken: null },
      { new: true }
    ).select('calendarFeedToken');

    return success(res, { message: 'Calendar feed token revoked' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/integrations/calendar/export/task/:taskId
 * Protected route - export a single task as ICS file
 */
exports.exportTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Fetch the task and verify user has access
    const task = await Task.findOne({
      _id: taskId,
      workspaceId: req.workspaceId,
    });

    if (!task) {
      return error(res, 'Task not found or you do not have access', 403);
    }

    // Verify user has access to this task
    // (either assigned to it, or is workspace manager)
    const isAssigned = String(task.assignedTo) === String(req.user.userId);
    if (!isAssigned && !isWorkspaceManager(req)) {
      return error(res, 'You do not have access to this task', 403);
    }

    // Get ICS events for this task
    const events = await getTaskEvent(taskId);

    if (events.length === 0) {
      return error(res, 'Task has no due date', 400);
    }

    // Generate ICS content
    const ics = generateICS(events);

    // Set appropriate headers for calendar file download
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="flowforge-task-${taskId}.ics"`
    );

    return res.send(ics);
  } catch (err) {
    console.error('[export task error]', err.message);
    return error(res, 'Failed to export task', 500);
  }
};

/**
 * GET /api/integrations/calendar/export/project/:projectId
 * Protected route - export a project deadline as ICS file
 */
exports.exportProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Fetch the project and verify user has access
    const project = await findAccessibleProject(req, projectId);

    if (!project) {
      return error(res, 'Project not found or you do not have access', 403);
    }

    // Get ICS events for this project
    const events = await getProjectEvent(projectId);

    if (events.length === 0) {
      return error(res, 'Project has no deadline', 400);
    }

    // Generate ICS content
    const ics = generateICS(events);

    // Set appropriate headers for calendar file download
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="flowforge-project-${projectId}.ics"`
    );

    return res.send(ics);
  } catch (err) {
    console.error('[export project error]', err.message);
    return error(res, 'Failed to export project', 500);
  }
};

/**
 * GET /api/integrations/calendar/token-status
 * Protected route - check if user has a calendar feed token
 */
exports.getTokenStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      'calendarFeedToken'
    );

    return success(res, {
      hasToken: !!user?.calendarFeedToken,
      token: user?.calendarFeedToken || null,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
