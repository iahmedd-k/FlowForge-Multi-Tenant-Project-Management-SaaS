const cron         = require('node-cron');
const Task         = require('../models/Task');
const Notification = require('../models/notifications');

// runs every day at midnight
const start = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[cron] running overdue check...');
    try {
      const overdueTasks = await Task.find({
        status:  { $ne: 'done' },
        dueDate: { $lt: new Date() },
        assignedTo: { $ne: null },
      });

      const promises = overdueTasks.map((task) =>
        Notification.create({
          workspaceId: task.workspaceId,
          userId:      task.assignedTo,
          type:        'task_overdue',
          message:     `"${task.title}" is overdue`,
          link:        `/projects/${task.projectId}`,
        }).catch(() => {}) // skip if notification already exists
      );

      await Promise.all(promises);
      console.log(`[cron] flagged ${overdueTasks.length} overdue tasks`);
    } catch (err) {
      console.error('[cron] overdue check failed:', err.message);
    }
  });
};

module.exports = { start };