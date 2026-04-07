const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  key: { type: String, index: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  config: {
    reminderHours: { type: Number },
    projectDeadlineHours: { type: Number },
  },
  trigger: {
    type: {
      type: String,
      enum: ['status_change', 'due_date_approaching', 'task_assigned', 'task_created'],
      required: false,
    },
    conditions: {
      status: { type: String },
      hoursBeforeDue: { type: Number },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  },
  action: {
    type: {
      type: String,
      enum: ['send_notification', 'change_status', 'assign_user', 'fire_webhook'],
      required: false,
    },
    params: {
      message: { type: String },
      status: { type: String },
      assignTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      webhookUrl: { type: String },
    },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

automationSchema.index({ workspaceId: 1, isActive: 1 });
automationSchema.index({ workspaceId: 1, key: 1 }, { unique: true, partialFilterExpression: { key: { $type: 'string' } } });

const Automation = mongoose.model('Automation', automationSchema);

module.exports = Automation;
module.exports.Automation = Automation;
