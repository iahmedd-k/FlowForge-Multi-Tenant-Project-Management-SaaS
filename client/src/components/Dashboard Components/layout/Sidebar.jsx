import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  CalendarDays,
  ChartColumn,
  CreditCard,
  FolderKanban,
  Home,
  MoreHorizontal,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useBillingLimits } from '../../../hooks/useBillingLimits';
import { createWorkspace, switchWorkspace } from '../../../api/workspace.api';
import { setAuth } from '../../../store/authSlice';
import { useIsMobile } from '../../../hooks/use-mobile';
import UserAvatar from '../ui/UserAvatar';

const primaryLinks = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/calendar', label: 'My work', icon: CalendarDays },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
];

const secondaryLinks = [
  { to: '/reports', label: 'Reporting', icon: ChartColumn },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] leading-none transition ${
          isActive
            ? 'bg-[#dbe5fb] text-[#27314d]'
            : 'text-[#55627e] hover:bg-[#edf2fd] hover:text-[#202b47]'
        }`
      }
    >
      <span className="flex h-4.5 w-4.5 items-center justify-center text-[#667390]">
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function WorkspaceSwitcher({ workspace, workspaceOptions, switchingWorkspace, changeWorkspace, formatWorkspaceOption }) {
  const [open, setOpen] = useState(false);
  const currentId = workspace?._id || workspaceOptions[0]?.workspace?._id || '';
  const currentWorkspace = workspaceOptions.find((entry) => (entry.workspace?._id || '') === currentId) || workspaceOptions[0];
  const roleLabel =
    currentWorkspace?.role === 'owner' ? 'Owner' :
    currentWorkspace?.role === 'admin' ? 'Admin' :
    currentWorkspace?.role === 'viewer' ? 'Viewer' :
    'Member';

  const handleSelect = (workspaceId) => {
    changeWorkspace(workspaceId);
    setOpen(false);
  };

  return (
    <div className="px-1">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          disabled={switchingWorkspace}
          className="h-10 w-full rounded-[10px] border border-[#d9e1f0] bg-white px-3 py-2.5 text-left text-[13px] font-medium text-[#1f2a44] outline-none transition hover:border-[#9ec5ff] hover:bg-[#fafbfe] focus:border-[#8ab4ff] focus:ring-1 focus:ring-[#8ab4ff] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-between"
        >
          <span className="truncate">{currentWorkspace?.workspace?.name || 'Workspace'}</span>
          <ChevronDown size={16} className={`flex-shrink-0 text-[#8a96b0] transition ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-[10px] border border-[#d9e1f0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
              <div className="max-h-[320px] overflow-y-auto">
                {workspaceOptions.map((entry) => {
                  const isSelected = (entry.workspace?._id || '') === currentId;
                  const role =
                    entry?.role === 'owner' ? 'Owner' :
                    entry?.role === 'admin' ? 'Admin' :
                    entry?.role === 'viewer' ? 'Viewer' :
                    'Member';
                  
                  return (
                    <button
                      key={entry.workspace?._id}
                      onClick={() => handleSelect(entry.workspace?._id)}
                      className={`w-full px-3 py-3 text-left transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#0073ea] text-white'
                          : 'text-[#1f2a44] hover:bg-[#f8faff]'
                      } ${workspaceOptions.length > 1 ? 'border-b border-[#e5e7eb] last:border-b-0' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className={`text-[13px] font-medium truncate ${
                          isSelected ? 'text-white' : 'text-[#1f2a44]'
                        }`}>
                          {entry.workspace?.name || 'Workspace'}
                        </div>
                        <div className={`text-[11px] truncate ${
                          isSelected ? 'text-blue-100' : 'text-[#8a96b0]'
                        }`}>
                          {role} • {entry?.role === 'owner' ? 'Owned' : 'Joined'}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={16} className="flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CreateWorkspaceModal({ open, onClose, onSubmit, loading }) {
  const [name, setName] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-[#0f172a]/35" onClick={onClose} aria-label="Close create workspace modal" />
      <div className="relative z-10 w-full max-w-[420px] rounded-[18px] border border-[#d8deed] bg-white p-5 shadow-[0_24px_54px_rgba(15,23,42,0.2)]">
        <div className="mb-4">
          <h3 className="text-[18px] font-semibold text-[#1f2a44]">Create workspace</h3>
          <p className="mt-1 text-[13px] text-[#70809b]">Start a new workspace and switch into it right away.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7d8cab]">Workspace name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="New workspace"
              className="h-11 w-full rounded-[10px] border border-[#d9e1f0] px-3 text-[14px] text-[#22304b] outline-none transition focus:border-[#8ab4ff]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border border-[#d9e1f0] px-4 py-2 text-[13px] font-medium text-[#44546c] transition hover:bg-[#f8faff]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !name.trim()}
              onClick={() => onSubmit(name.trim(), () => setName(''))}
              className="rounded-[10px] bg-[#0073ea] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#0060c0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create workspace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const { user, workspace, workspaces, logout, currentRole, currentRoleLabel, canManageBilling, canAccessReports, canManageWorkspace } = useAuth();
  const { canCreateWorkspace, getWorkspaceQuota } = useBillingLimits();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  
  const isWorkspaceLimitReached = !canCreateWorkspace();
  const workspaceQuota = getWorkspaceQuota();

  const { mutate: changeWorkspace, isPending: switchingWorkspace } = useMutation({
    mutationFn: (workspaceId) => switchWorkspace({ workspaceId }),
    onSuccess: async (res) => {
      const nextWorkspace = res.data.data.workspace;
      const nextRole = res.data.data.role;
      const nextWorkspaces = res.data.data.workspaces || workspaces;
      dispatch(
        setAuth({
          user: { ...user, workspaceId: nextWorkspace._id, role: nextRole },
          workspace: nextWorkspace,
          workspaces: nextWorkspaces,
        })
      );
      await qc.invalidateQueries();
      navigate('/dashboard', { replace: true });
    },
  });

  const { mutate: handleCreateWorkspace, isPending: creatingWorkspace } = useMutation({
    mutationFn: (name) => createWorkspace({ name }),
    onSuccess: async (res) => {
      const { user: nextUser, workspace: nextWorkspace, workspaces: nextWorkspaces } = res.data.data;
      dispatch(
        setAuth({
          user: nextUser,
          workspace: nextWorkspace,
          workspaces: nextWorkspaces,
        })
      );
      await qc.invalidateQueries();
      setShowCreateWorkspace(false);
      setShowWorkspaceMenu(false);
      // Skip setup page since name was already provided in modal
      // Go directly to team invite
      navigate('/workspace/team-invite', { replace: true });
    },
  });

  const visibleSecondaryLinks = secondaryLinks.filter((item) => {
    if (item.to === '/billing' && !canManageBilling) return false;
    if (item.to === '/reports' && !canAccessReports) return false;
    if (item.managerOnly && !canManageWorkspace) return false;
    return true;
  });
  const workspaceOptions = workspaces?.length ? workspaces : [{ workspace, role: currentRole }];

  const formatWorkspaceOption = (entry) => {
    const roleLabel =
      entry?.role === 'owner' ? 'Owner' :
      entry?.role === 'admin' ? 'Admin' :
      entry?.role === 'viewer' ? 'Viewer' :
      'Member';
    const relationLabel = entry?.role === 'owner' ? 'Owned' : 'Joined';
    return `${entry.workspace?.name || workspace?.name || 'Workspace'} - ${roleLabel} - ${relationLabel}`;
  };

  const toggleWorkspaceOptions = () => {
    const button = document.querySelector('[data-workspace-switcher-button="true"]');
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  return (
    <>
      {isMobile && mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-[#0f172a]/30"
        />
      ) : null}
      <aside
        className={`${
          isMobile
            ? `fixed left-0 top-[60px] z-40 h-[calc(100vh-60px)] w-[288px] max-w-[84vw] transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'sticky top-[60px] h-[calc(100vh-60px)] w-[272px] shrink-0'
        } border-r border-[#d8e1f0] bg-[#edf2fc]`}
      >
      <div className="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden px-4 py-5">
        {isMobile ? (
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-[14px] font-semibold text-[#1f2a44]">Navigation</p>
            <button
              type="button"
              onClick={onCloseMobile}
              className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#5f6f8b] transition hover:bg-[#e4ebf8]"
              aria-label="Close navigation"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        ) : null}
        <div className="mb-2 flex items-center gap-3 px-1">
          <UserAvatar user={user} size="md" />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-[#1f2a44]">{workspace?.name || 'Workspace'}</p>
            <p className="text-[12px] text-[#6f7b96]">{user?.name || currentRoleLabel}</p>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          {primaryLinks.map((item) => (
            <NavItem key={item.to} {...item} onClick={isMobile ? onCloseMobile : undefined} />
          ))}
        </div>

        <div className="mt-2 space-y-1">
          {visibleSecondaryLinks.map((item) => (
            <NavItem key={item.to} {...item} onClick={isMobile ? onCloseMobile : undefined} />
          ))}
        </div>

        <div className="mt-6 border-t border-[#d7e0ef] pt-4">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-[13px] font-semibold text-[#202b47]">Workspaces</p>
            <div className="relative flex items-center text-[#7c89a6]">
              <button
                type="button"
                onClick={() => setShowWorkspaceMenu((current) => !current)}
                className="flex h-7 w-7 items-center justify-center rounded-[8px] transition hover:bg-[#e4ebf8] hover:text-[#22304b]"
              >
                <MoreHorizontal size={15} strokeWidth={2} />
              </button>
              {showWorkspaceMenu ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[190px] rounded-[12px] border border-[#d8deed] bg-white p-2 shadow-[0_16px_36px_rgba(15,23,42,0.14)]">
                  {canManageWorkspace ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setShowWorkspaceMenu(false);
                          navigate('/settings');
                        }}
                        className="flex w-full items-center rounded-[8px] px-3 py-2 text-left text-[13px] text-[#22304b] transition hover:bg-[#f5f8ff]"
                      >
                        Edit workspace
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowWorkspaceMenu(false);
                          navigate('/settings');
                        }}
                        className="flex w-full items-center rounded-[8px] px-3 py-2 text-left text-[13px] text-[#22304b] transition hover:bg-[#f5f8ff]"
                      >
                        Manage workspace
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isWorkspaceLimitReached) {
                        setShowWorkspaceMenu(false);
                        setShowCreateWorkspace(true);
                      }
                    }}
                    disabled={isWorkspaceLimitReached}
                    title={isWorkspaceLimitReached ? `Workspace limit reached (${workspaceQuota?.used}/${workspaceQuota?.limit})` : ''}
                    className={`flex w-full items-center rounded-[8px] px-3 py-2 text-left text-[13px] transition ${
                      isWorkspaceLimitReached
                        ? 'cursor-not-allowed text-[#ccc] opacity-50'
                        : 'text-[#22304b] hover:bg-[#f5f8ff]'
                    }`}
                  >
                    Create workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      toggleWorkspaceOptions();
                    }}
                    className="flex w-full items-center rounded-[8px] px-3 py-2 text-left text-[13px] text-[#22304b] transition hover:bg-[#f5f8ff]"
                  >
                    Switch workspace
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <WorkspaceSwitcher
            workspace={workspace}
            workspaceOptions={workspaceOptions}
            switchingWorkspace={switchingWorkspace}
            changeWorkspace={changeWorkspace}
            formatWorkspaceOption={formatWorkspaceOption}
          />
        </div>

        <div className="mt-auto px-1 pt-6">
          <button
            type="button"
            onClick={async () => {
              if (isMobile) onCloseMobile?.();
              await logout();
            }}
            className="w-full rounded-[10px] border border-[#d9e1f0] bg-[#f8faff] px-3 py-2 text-[12px] font-medium text-[#44546c] transition hover:bg-white hover:text-[#2f3f64]"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
      <CreateWorkspaceModal
        open={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        loading={creatingWorkspace}
        onSubmit={(name, reset) => handleCreateWorkspace(name, { onSuccess: reset })}
      />
    </>
  );
}
