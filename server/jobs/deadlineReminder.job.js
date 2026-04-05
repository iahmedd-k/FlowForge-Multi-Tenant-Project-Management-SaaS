const cron         = require('node-cron');
const Task         = require('../models/Task');
const Notification = require('../models/notifications');

// runs every day at 8am — warns about tasks due in the next 24 hours
const start = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[cron] running deadline reminder check...');
    try {
      const now       = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcomingTasks = await Task.find({
        status:     { $ne: 'done' },
        dueDate:    { $gte: now, $lte: in24Hours },
        assignedTo: { $ne: null },
      });

      const promises = upcomingTasks.map((task) =>
        Notification.create({
          workspaceId: task.workspaceId,
          userId:      task.assignedTo,
          type:        'deadline_approaching',
          message:     `"${task.title}" is due within 24 hours`,
          link:        `/projects/${task.projectId}`,
        }).catch(() => {})
      );

      await Promise.all(promises);
      console.log(`[cron] sent ${upcomingTasks.length} deadline reminders`);
    } catch (err) {
      console.error('[cron] deadline reminder failed:', err.message);
    }
  });
};

module.exports = { start };