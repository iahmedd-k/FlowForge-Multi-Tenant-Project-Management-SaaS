require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const WorkspaceMember = require('./models/WorkspaceMember');
const WorkspaceInvite = require('./models/WorkspaceInvite');
const Task = require('./models/Task');
const Project = require('./models/Project');
const Automation = require('./models/Automation');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB connected');
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

const cleanup = async () => {
  try {
    console.log('\n🧹 Starting database cleanup...\n');

    // Delete all users
    const userResult = await User.deleteMany({});
    console.log(`✓ Deleted ${userResult.deletedCount} users`);

    // Delete all workspaces
    const workspaceResult = await Workspace.deleteMany({});
    console.log(`✓ Deleted ${workspaceResult.deletedCount} workspaces`);

    // Delete all workspace members
    const memberResult = await WorkspaceMember.deleteMany({});
    console.log(`✓ Deleted ${memberResult.deletedCount} workspace members`);

    // Delete all workspace invites
    const inviteResult = await WorkspaceInvite.deleteMany({});
    console.log(`✓ Deleted ${inviteResult.deletedCount} workspace invites`);

    // Delete all projects
    const projectResult = await Project.deleteMany({});
    console.log(`✓ Deleted ${projectResult.deletedCount} projects`);

    // Delete all tasks
    const taskResult = await Task.deleteMany({});
    console.log(`✓ Deleted ${taskResult.deletedCount} tasks`);

    // Delete all automations
    const automationResult = await Automation.deleteMany({});
    console.log(`✓ Deleted ${automationResult.deletedCount} automations`);

    console.log('\n✅ Database cleanup completed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('✗ Cleanup failed:', err.message);
    process.exit(1);
  }
};

(async () => {
  await connectDB();
  await cleanup();
  mongoose.disconnect();
})();
