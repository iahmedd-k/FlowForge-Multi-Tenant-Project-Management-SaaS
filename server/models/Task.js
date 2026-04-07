const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:    { type: String, required: true },
}, { timestamps: true });

const attachmentSchema = new mongoose.Schema({
  url:        { type: String, required: true },
  filename:   { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  title:      { type: String, required: true, trim: true },
  description:{ type: String, default: '' },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['backlog', 'in_progress', 'review', 'done'],
    default: 'backlog',
    index: true,
  },
  dueDate:     { type: Date, default: null, index: true },
  completedAt: { type: Date, default: null },
  overdueMarkedAt: { type: Date, default: null },
  tags:        [{ type: String, trim: true }],
  attachments: [attachmentSchema],
  comments:    [commentSchema],
  totalTrackedSeconds: { type: Number, default: 0 },
}, { timestamps: true });

// text index on title — powers the AI suggestion search
taskSchema.index({ title: 'text' });

// virtual: is this task overdue?
taskSchema.virtual('isOverdue').get(function () {
  return this.dueDate && this.status !== 'done' && new Date() > this.dueDate;
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
