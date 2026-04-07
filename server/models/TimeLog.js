const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  duration: { type: Number, default: 0 },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

timeLogSchema.index({ workspaceId: 1 });
timeLogSchema.index({ taskId: 1 });
timeLogSchema.index({ userId: 1 });

const TimeLog = mongoose.model('TimeLog', timeLogSchema);

module.exports = TimeLog;
module.exports.TimeLog = TimeLog;
