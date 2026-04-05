const { error } = require('../utils/response.util');
const WorkspaceMember = require('../models/WorkspaceMember');

// Attaches the active workspace from the session and verifies the user is still a member of it.
module.exports = async (req, res, next) => {
  try {
    if (!req.user?.workspaceId || !req.user?.userId) {
      return error(res, 'Workspace context missing', 403);
    }

    const membership = await WorkspaceMember.findOne({
      userId: req.user.userId,
      workspaceId: req.user.workspaceId,
    });

    if (!membership) {
      return error(res, 'You no longer have access to this workspace', 403);
    }

    req.workspaceId = req.user.workspaceId;
    req.user.role = membership.role;
    req.workspaceRole = membership.role;
    next();
  } catch (err) {
    return error(res, err.message || 'Unable to resolve workspace access', 500);
  }
};
