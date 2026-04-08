import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearAuth } from '../store/authSlice';
import { logoutApi } from '../api/auth.api';

const roleLabelMap = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export const useAuth = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user, workspace, workspaces, loading } = useSelector((s) => s.auth);
  const activeWorkspaceId = workspace?._id || user?.workspaceId || null;
  const activeWorkspaceEntry = workspaces?.find(
    (entry) => String(entry.workspace?._id || '') === String(activeWorkspaceId || '')
  );
  const currentRole = activeWorkspaceEntry?.role || user?.role || 'member';
  const currentRoleLabel = roleLabelMap[currentRole] || 'Member';
  const isManager = ['owner', 'admin'].includes(currentRole);
  const isOwner = currentRole === 'owner';
  const isRestrictedRole = ['member', 'viewer'].includes(currentRole);
  const canCreateProject = ['owner', 'admin'].includes(currentRole);
  const canCreateTask = ['owner', 'admin', 'member'].includes(currentRole);
  const canDeleteTask = ['owner', 'admin'].includes(currentRole);
  const canManageBilling = currentRole === 'owner';
  const canAccessReports = ['owner', 'admin'].includes(currentRole);
  const canManageWorkspace = ['owner', 'admin'].includes(currentRole);
  const canManageRoles = currentRole === 'owner';
  const canInviteAdmins = currentRole === 'owner';
  const canInviteMembers = ['owner', 'admin'].includes(currentRole);

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // clear client auth state even if the logout request fails
    }
    dispatch(clearAuth());
    localStorage.removeItem('accessToken');
    navigate('/', { replace: true });
  };

  return {
    user,
    workspace,
    workspaces,
    loading,
    logout,
    currentRole,
    currentRoleLabel,
    isManager,
    isOwner,
    isRestrictedRole,
    canCreateProject,
    canCreateTask,
    canDeleteTask,
    canManageBilling,
    canAccessReports,
    canManageWorkspace,
    canManageRoles,
    canInviteAdmins,
    canInviteMembers,
  };
};
