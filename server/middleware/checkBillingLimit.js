const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const User = require('../models/User');
const { error } = require('../utils/response.util');
const { isLimitExceeded, BILLING_LIMITS } = require('../utils/billingLimits');

/**
 * Middleware to check billing limits before allowing resource creation
 * Determines resource type based on the route:
 * - POST /workspace/create → workspaces
 * - POST /projects → projects
 * - POST /workspace/invite → teamMembers
 */
async function checkBillingLimit(req, res, next) {
  try {
    // For workspace creation, check against user's workspace count
    if (req.path.includes('create') && req.path.includes('workspace')) {
      const user = await User.findById(req.user.userId);
      if (!user) return error(res, 'User not found', 404);

      // Free tier limited to 1 workspace
      const userWorkspaceCount = await Workspace.countDocuments({ ownerId: user._id });
      const WORKSPACE_LIMITS = { free: 1, pro: 3, business: 999 };
      const userLimit = WORKSPACE_LIMITS.free; // New users on free plan

      if (userWorkspaceCount >= userLimit) {
        return error(
          res,
          `You have reached the maximum workspaces limit (${userLimit}) for the free plan. Please upgrade to create more workspaces.`,
          403
        );
      }

      req.billingInfo = {
        tier: 'free',
        limits: BILLING_LIMITS.free,
        resourceType: 'workspaces',
      };

      return next();
    }

    // For other resources, check against workspace's current plan
    const workspace = await Workspace.findById(req.workspaceId)
      .select('subscriptionTier members');
    if (!workspace) return error(res, 'Workspace not found', 404);

    // Determine resource type based on the request path
    let resourceType = 'projects'; // default
    if (req.path.includes('invite')) {
      resourceType = 'teamMembers';
    }

    const tier = workspace.subscriptionTier || 'free';
    const limits = BILLING_LIMITS[tier];

    if (resourceType === 'projects') {
      const projectCount = await Project.countDocuments({
        workspaceId: req.workspaceId,
      });

      if (isLimitExceeded(tier, 'projects', projectCount)) {
        return error(
          res,
          `You have reached the maximum projects limit (${limits.projects}) for the ${tier} plan. Please upgrade to create more projects.`,
          403
        );
      }
    }

    if (resourceType === 'teamMembers') {
      const memberCount = workspace.members?.length || 0;

      if (isLimitExceeded(tier, 'teamMembers', memberCount)) {
        return error(
          res,
          `You have reached the maximum team members limit (${limits.teamMembers}) for the ${tier} plan. Please upgrade to add more members.`,
          403
        );
      }
    }

    // Attach workspace info to request for use in controller
    req.billingInfo = {
      tier,
      limits,
      resourceType,
    };

    next();
  } catch (err) {
    return error(res, err.message, 500);
  }
}

module.exports = checkBillingLimit;
