const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['task_assigned', 'deadline_approaching', 'status_changed', 'task_overdue', 'member_invited', 'automation', 'due_date_approaching', 'priority_alert', 'project_deadline_warning', 'comment_mention', 'review_alert', 'unassigned_task_alert'],
    required: true,
  },
  message:  { type: String, required: true },
  read:     { type: Boolean, default: false },
  link:     { type: String, default: null }, // e.g. /projects/:id
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
