import { useQuery } from '@tanstack/react-query';
import { getWorkspaceUsage } from '../api/billing.api';

export function useBillingLimits() {
  const { data: usageData, isLoading, error } = useQuery({
    queryKey: ['workspace-usage'],
    queryFn: () => getWorkspaceUsage().then(res => res.data.data),
    staleTime: 60000,
  });

  const isTeamMemberLimitReached = () => {
    if (!usageData) return false;
    return usageData.teamMembersUsed >= usageData.teamMembersLimit;
  };

  const isProjectLimitReached = () => {
    if (!usageData) return false;
    return usageData.projectsUsed >= usageData.projectsLimit;
  };

  const getTeamMemberQuota = () => {
    if (!usageData) return null;
    return {
      used: usageData.teamMembersUsed,
      limit: usageData.teamMembersLimit,
      remaining: Math.max(0, usageData.teamMembersLimit - usageData.teamMembersUsed),
      percentage: Math.round((usageData.teamMembersUsed / usageData.teamMembersLimit) * 100),
    };
  };

  const getProjectQuota = () => {
    if (!usageData) return null;
    return {
      used: usageData.projectsUsed,
      limit: usageData.projectsLimit,
      remaining: Math.max(0, usageData.projectsLimit - usageData.projectsUsed),
      percentage: Math.round((usageData.projectsUsed / usageData.projectsLimit) * 100),
    };
  };

  const canCreateProject = () => {
    if (!usageData) return true;
    return usageData.projectsUsed < usageData.projectsLimit;
  };

  const canAddTeamMember = () => {
    if (!usageData) return true;
    return usageData.teamMembersUsed < usageData.teamMembersLimit;
  };

  const isWorkspaceLimitReached = () => {
    if (!usageData) return false;
    return usageData.workspacesUsed >= usageData.workspacesLimit;
  };

  const canCreateWorkspace = () => {
    if (!usageData) return true;
    return usageData.workspacesUsed < usageData.workspacesLimit;
  };

  const getWorkspaceQuota = () => {
    if (!usageData) return null;
    return {
      used: usageData.workspacesUsed,
      limit: usageData.workspacesLimit,
      remaining: Math.max(0, usageData.workspacesLimit - usageData.workspacesUsed),
      percentage: Math.round((usageData.workspacesUsed / usageData.workspacesLimit) * 100),
    };
  };

  const getUpgradeMessage = (resourceType) => {
    const tier = usageData?.tier || 'free';
    if (resourceType === 'teamMembers') {
      return `You've reached the maximum team members for the ${tier} plan. Upgrade to add more members.`;
    }
    if (resourceType === 'projects') {
      return `You've reached the maximum projects for the ${tier} plan. Upgrade to create more.`;
    }
    return "You've reached a limit. Please upgrade your plan.";
  };

  return {
    usageData,
    isLoading,
    error,
    isTeamMemberLimitReached,
    isProjectLimitReached,
    isWorkspaceLimitReached,
    getTeamMemberQuota,
    getProjectQuota,
    getWorkspaceQuota,
    canCreateProject,
    canAddTeamMember,
    canCreateWorkspace,
    getUpgradeMessage,
  };
}
