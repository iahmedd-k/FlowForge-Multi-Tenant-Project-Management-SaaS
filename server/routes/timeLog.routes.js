const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const tenantScope = require('../middleware/tenantScope');
const { success, error } = require('../utils/response.util');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');

router.use(verifyToken, tenantScope);

router.post('/start', async (req, res) => {
  try {
    const { taskId, projectId, workspaceId, note = '' } = req.body || {};

    if (!taskId || !projectId) {
      return error(res, 'taskId and projectId are required', 400);
    }

    if (workspaceId && String(workspaceId) !== String(req.workspaceId)) {
      return error(res, 'Workspace mismatch', 403);
    }

    const task = await Task.findOne({
      _id: taskId,
      projectId,
      workspaceId: req.workspaceId,
    }).select('_id projectId workspaceId');

    if (!task) {
      return error(res, 'Task not found', 404);
    }

    const running = await TimeLog.findOne({
      workspaceId: req.workspaceId,
      userId: req.user.userId,
      endTime: null,
    });

    if (running) {
      return error(res, 'You already have a running timer. Stop it first.', 400);
    }

    const timeLog = await TimeLog.create({
      workspaceId: req.workspaceId,
      projectId,
      taskId,
      userId: req.user.userId,
      startTime: new Date(),
      endTime: null,
      note,
    });

    return success(res, { timeLog }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/stop/:timeLogId', async (req, res) => {
  try {
    const timeLog = await TimeLog.findOne({
      _id: req.params.timeLogId,
      userId: req.user.userId,
      workspaceId: req.workspaceId,
    });

    if (!timeLog || timeLog.endTime) {
      return error(res, 'Time log not found or already stopped', 400);
    }

    const endTime = new Date();
    timeLog.endTime = endTime;
    timeLog.duration = Math.floor((endTime - timeLog.startTime) / 1000);
    await timeLog.save();

    return success(res, { timeLog });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/active', async (req, res) => {
  try {
    const activeLog = await TimeLog.findOne({
      userId: req.user.userId,
      workspaceId: req.workspaceId,
      endTime: null,
    }).sort({ createdAt: -1 });

    return success(res, { timeLog: activeLog || null });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/task/:taskId', async (req, res) => {
  try {
    const logs = await TimeLog.find({
      workspaceId: req.workspaceId,
      taskId: req.params.taskId,
    })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    const totalSeconds = logs.reduce((sum, log) => sum + (log.duration || 0), 0);

    return success(res, { logs, totalSeconds });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/user', async (req, res) => {
  try {
    const { workspaceId, from, to } = req.query;

    if (workspaceId && String(workspaceId) !== String(req.workspaceId)) {
      return error(res, 'Workspace mismatch', 403);
    }

    const filter = {
      workspaceId: req.workspaceId,
      userId: req.user.userId,
    };

    if (from || to) {
      filter.startTime = {};
      if (from) filter.startTime.$gte = new Date(from);
      if (to) filter.startTime.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const logs = await TimeLog.find(filter).sort({ startTime: -1 });
    const taskIds = [...new Set(logs.map((log) => String(log.taskId)))];
    const tasks = taskIds.length
      ? await Task.find({ _id: { $in: taskIds }, workspaceId: req.workspaceId }).select('title')
      : [];
    const taskTitleMap = new Map(tasks.map((task) => [String(task._id), task.title]));

    const grouped = Object.values(
      logs.reduce((acc, log) => {
        const key = String(log.taskId);
        if (!acc[key]) {
          acc[key] = {
            taskId: log.taskId,
            taskTitle: taskTitleMap.get(key) || 'Task',
            totalSeconds: 0,
            logs: [],
          };
        }
        acc[key].totalSeconds += log.duration || 0;
        acc[key].logs.push(log);
        return acc;
      }, {})
    );

    return success(res, { items: grouped });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
