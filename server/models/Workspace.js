const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name:                 { type: String, required: true, trim: true },
  description:          { type: String, default: '' },
  ownerId:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  setupCompleted:       { type: Boolean, default: false },
  subscriptionTier:     { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
  stripeCustomerId:     { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Workspace', workspaceSchema);
