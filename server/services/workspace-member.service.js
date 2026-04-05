const WorkspaceMember = require('../models/WorkspaceMember');
const Workspace = require('../models/Workspace');

async function getUserWorkspaces(userId) {
  const memberships = await WorkspaceMember.find({ userId })
    .populate('workspaceId', 'name description setupCompleted subscriptionTier ownerId createdAt')
    .sort({ updatedAt: -1, createdAt: -1 });

  return memberships
    .filter((membership) => membership.workspaceId)
    .map((membership) => ({
      workspace: membership.workspaceId,
      role: membership.role,
      membershipId: membership._id,
      joinedAt: membership.joinedAt,
    }));
}

async function getMembership(userId, workspaceId) {
  if (!workspaceId) return null;
  return WorkspaceMember.findOne({ userId, workspaceId });
}

async function ensureWorkspaceAccess(userId, preferredWorkspaceId = null) {
  const workspaces = await getUserWorkspaces(userId);
  if (!workspaces.length) {
    return { activeWorkspace: null, activeRole: null, workspaces: [] };
  }

  const activeEntry =
    workspaces.find((entry) => String(entry.workspace._id) === String(preferredWorkspaceId)) ||
    workspaces[0];

  return {
    activeWorkspace: activeEntry.workspace,
    activeRole: activeEntry.role,
    workspaces,
  };
}

module.exports = {
  getUserWorkspaces,
  getMembership,
  ensureWorkspaceAccess,
};
