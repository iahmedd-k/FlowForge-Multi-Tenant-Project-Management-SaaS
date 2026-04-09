const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  passwordHash:  { type: String, default: null },
  avatar:        { type: String, default: null },
  workspaceId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', index: true },
  role:          { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
  jobTitle:      { type: String, default: '', trim: true },
  phone:         { type: String, default: '', trim: true },
  mobilePhone:   { type: String, default: '', trim: true },
  location:      { type: String, default: '', trim: true },
  birthday:      { type: String, default: '' },
  workAnniversary: { type: String, default: '' },
  schedule:      { type: String, default: 'Account schedule', trim: true },
  availability:  { type: String, default: 'Available', trim: true },
  workStyle:     { type: String, default: 'Hybrid', trim: true },
  language:      { type: String, default: 'English (US)', trim: true },
  region:        { type: String, default: 'Pakistan', trim: true },
  timezone:      { type: String, default: 'UTC', trim: true },
  dateFormat:    { type: String, default: 'MMM d, yyyy', trim: true },
  timeFormat:    { type: String, default: '12-hour', trim: true },
  notifyAssignments: { type: Boolean, default: true },
  notifyComments:    { type: Boolean, default: true },
  notifyReminders:   { type: Boolean, default: true },
  notifyDigest:      { type: Boolean, default: false },
  calendarFeedToken: { type: String, unique: true, sparse: true },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// never return passwordHash in API responses
userSchema.set('toJSON', {
  transform: (_, obj) => { delete obj.passwordHash; return obj; }
});

module.exports = mongoose.model('User', userSchema);
