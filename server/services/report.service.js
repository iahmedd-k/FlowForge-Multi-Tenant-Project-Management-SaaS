const Task = require('../models/Task');
const mongoose = require('mongoose');

const asObjectIds = (projectIds = []) =>
  projectIds.map((projectId) => new mongoose.Types.ObjectId(projectId));

const buildMatch = (workspaceId, projectIds = null, extra = {}) => {
  const match = {
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    ...extra,
  };

  if (Array.isArray(projectIds)) {
    match.projectId = { $in: asObjectIds(projectIds) };
  }

  return match;
};

const startOfWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const daysAgo = (n) => {
  const date = new Date();
  date.setDate(date.getDate() - n);
  date.setHours(0, 0, 0, 0);
  return date;
};

exports.getProjectCompletion = async (workspaceId, projectIds = null) => {
  return Task.aggregate([
    { $match: buildMatch(workspaceId, projectIds) },
    {
      $group: {
        _id: '$projectId',
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from: 'projects',
        localField: '_id',
        foreignField: '_id',
        as: 'project',
      },
    },
    { $unwind: '$project' },
    {
      $project: {
        projectId: '$_id',
        projectName: '$project.name',
        projectStatus: '$project.status',
        deadline: '$project.deadline',
        total: 1,
        done: 1,
        completionPercent: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            { $round: [{ $multiply: [{ $divide: ['$done', '$total'] }, 100] }, 0] },
          ],
        },
      },
    },
    { $sort: { completionPercent: -1 } },
  ]);
};

exports.getCompletedThisWeek = async (workspaceId, projectIds = null) => {
  return Task.countDocuments({
    ...buildMatch(workspaceId, projectIds),
    status: 'done',
    updatedAt: { $gte: startOfWeek() },
  });
};

exports.getOverdueCount = async (workspaceId, projectIds = null) => {
  return Task.countDocuments({
    ...buildMatch(workspaceId, projectIds),
    status: { $ne: 'done' },
    dueDate: { $lt: new Date() },
  });
};

exports.getAvgCompletionTime = async (workspaceId, projectIds = null) => {
  const result = await Task.aggregate([
    {
      $match: buildMatch(workspaceId, projectIds, { status: 'done' }),
    },
    {
      $project: {
        durationHours: {
          $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgHours: { $avg: '$durationHours' },
      },
    },
  ]);

  return result.length > 0 ? Math.round(result[0].avgHours) : 0;
};

exports.getWorkloadPerUser = async (workspaceId, projectIds = null) => {
  return Task.aggregate([
    {
      $match: {
        ...buildMatch(workspaceId, projectIds),
        status: { $ne: 'done' },
        assignedTo: { $ne: null },
      },
    },
    {
      $group: {
        _id: '$assignedTo',
        openTasks: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        email: '$user.email',
        openTasks: 1,
      },
    },
    { $sort: { openTasks: -1 } },
  ]);
};

exports.getCompletionTrend = async (workspaceId, projectIds = null) => {
  return Task.aggregate([
    {
      $match: {
        ...buildMatch(workspaceId, projectIds),
        status: 'done',
        updatedAt: { $gte: daysAgo(30) },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1,
      },
    },
    { $sort: { date: 1 } },
  ]);
};

exports.getOverdueTasks = async (workspaceId, projectIds = null) => {
  return Task.find({
    ...buildMatch(workspaceId, projectIds),
    status: { $ne: 'done' },
    dueDate: { $lt: new Date() },
  })
    .populate('projectId', 'name status')
    .populate('assignedTo', 'name email')
    .sort({ dueDate: 1, createdAt: -1 });
};
