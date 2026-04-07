// Billing tier limits configuration
const BILLING_LIMITS = {
  free: {
    teamMembers: 5,
    projects: 3,
    reports: 1,
    workspaces: 1,
  },
  pro: {
    teamMembers: 20,
    projects: 999,
    reports: 999,
    workspaces: 3,
  },
  business: {
    teamMembers: 999,
    projects: 999,
    reports: 999,
    workspaces: 999,
  },
};

/**
 * Check if workspace has reached billing limit for a resource type
 * @param {string} tier - Current subscription tier
 * @param {string} resourceType - Type of resource (teamMembers, projects, etc.)
 * @param {number} currentUsage - Current usage count
 * @returns {boolean} true if limit exceeded
 */
function isLimitExceeded(tier, resourceType, currentUsage) {
  const limits = BILLING_LIMITS[tier] || BILLING_LIMITS.free;
  const limit = limits[resourceType];
  
  if (!limit) return false;
  return currentUsage >= limit;
}

/**
 * Get remaining quota for a resource
 * @param {string} tier - Current subscription tier
 * @param {string} resourceType - Type of resource
 * @param {number} currentUsage - Current usage count
 * @returns {object} { remaining, limit, percentage }
 */
function getQuotaInfo(tier, resourceType, currentUsage) {
  const limits = BILLING_LIMITS[tier] || BILLING_LIMITS.free;
  const limit = limits[resourceType] || 0;
  const remaining = Math.max(0, limit - currentUsage);
  const percentage = limit > 0 ? Math.round((currentUsage / limit) * 100) : 0;

  return {
    remaining,
    limit,
    used: currentUsage,
    percentage,
  };
}

module.exports = {
  BILLING_LIMITS,
  isLimitExceeded,
  getQuotaInfo,
};
