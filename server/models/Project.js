const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  deadline:    { type: Date, default: null, index: true },
  status:      {
    type: String,
    enum: ['active', 'on_hold', 'completed', 'archived'],
    default: 'active',
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);