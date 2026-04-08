import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelInvitation,
  getInvitations,
  getMembers,
  inviteUser,
  removeMember,
  updateRole,
} from '../../../api/workspace.api';
import { useAuth } from '../../../hooks/useAuth';

function initials(name) {
  return (
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U'
  );
}

function PersonAvatar({ name, muted = false }) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
        muted ? 'bg-[#eef3fd] text-[#607399]' : 'bg-black text-white'
      }`}
    >
      {muted ? '@' : initials(name)}
    </div>
  );
}

function mapInviteError(message = '') {
  if (/Invalid login|BadCredentials|Username and Password not accepted|gmail|smtp/i.test(String(message))) {
    return 'Invite email could not be sent. Check the workspace email configuration and try again.';
  }

  return message || 'Unable to send invite';
}

export default function InviteBoardModal({ open, onClose }) {
  const { workspace, isManager, currentRole, canInviteAdmins, canInviteMembers, canManageRoles } = useAuth();
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => getMembers().then((res) => res.data.data.members),
    enabled: open,
    refetchInterval: open ? 5000 : false,
    refetchOnWindowFocus: true,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ['workspace-invitations'],
    queryFn: () => getInvitations().then((res) => res.data.data.invitations),
    enabled: open && isManager,
    refetchInterval: open && isManager ? 5000 : false,
    refetchOnWindowFocus: true,
  });

  const visibleMembers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) =>
      [member.name, member.email, member.role].filter(Boolean).join(' ').toLowerCase().includes(term)
    );
  }, [members, query]);

  const visibleInvites = useMemo(() => {
    const term = query.trim().toLowerCase();
    const pending = invitations.filter((invite) => invite.status === 'pending');
    if (!term) return pending;
    return pending.filter((invite) =>
      [invite.email, invite.invitedBy?.name].filter(Boolean).join(' ').toLowerCase().includes(term)
    );
  }, [invitations, query]);

  const sendInviteMutation = useMutation({
    mutationFn: () => inviteUser({ email: query.trim(), role: inviteRole }),
    onSuccess: (res) => {
      setFeedback(res.data.data.message);
      setQuery('');
      setInviteRole('member');
      qc.invalidateQueries({ queryKey: ['workspace-invitations'] });
    },
    onError: (err) => setFeedback(mapInviteError(err.response?.data?.message || err.message || 'Unable to send invite')),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: cancelInvitation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace-invitations'] }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['calendar-tasks'] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateRole(userId, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });

  if (!open) return null;

  const canSend = canInviteMembers && /\S+@\S+\.\S+/.test(query.trim());
  const inviteRoleOptions = canInviteAdmins
    ? ['admin', 'member', 'viewer']
    : ['member', 'viewer'];

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[#4f5878]/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-[608px] max-h-[min(88vh,860px)] overflow-y-auto rounded-[18px] bg-white shadow-[0_28px_70px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between px-8 pb-5 pt-7">
          <h2 className="text-[24px] font-semibold text-[#2b3147]">Invite to workspace</h2>
          <button type="button" onClick={onClose} className="text-[28px] leading-none transition hover:text-[#0073ea]" aria-label="Close invite dialog">
            ×
          </button>
        </div>

        <div className="border-t border-[#dde4f2] px-8 pb-8 pt-6">
          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setFeedback('');
              }}
              placeholder="Search by name, team, or email address"
              className="h-[42px] flex-1 rounded-[4px] border border-[#cad5ea] px-4 text-[15px] text-[#28324c] outline-none transition focus:border-[#8ab7ff]"
            />
            {canInviteMembers ? (
              <>
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value)}
                  className="h-[42px] rounded-[6px] border border-[#cad5ea] bg-white px-3 text-[14px] text-[#28324c] outline-none transition focus:border-[#8ab7ff]"
                >
                  {inviteRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role[0].toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => sendInviteMutation.mutate()}
                  disabled={!canSend || sendInviteMutation.isPending}
                  className="h-[42px] rounded-[6px] bg-[#0073ea] px-4 text-[14px] font-medium text-white transition hover:bg-[#005ec4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendInviteMutation.isPending ? 'Sending...' : 'Invite user'}
                </button>
              </>
            ) : null}
          </div>

          <div className="mt-5 flex items-center gap-3 text-[14px] text-[#4f5b78]">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#69789c]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h16" />
              <path d="M6 20V8h12v12" />
              <path d="M9 20v-4h6v4" />
              <path d="M8 11h.01" />
              <path d="M12 11h.01" />
              <path d="M16 11h.01" />
            </svg>
            <span>People join this workspace after accepting their invite.</span>
          </div>

          {feedback ? (
            <p className={`mt-3 text-[13px] ${feedback.toLowerCase().includes('sent') ? 'text-[#0f9f6e]' : 'text-[#d14343]'}`}>
              {feedback}
            </p>
          ) : null}

          {!!visibleInvites.length && (
            <div className="mt-8">
              <h3 className="text-[15px] font-semibold text-[#2b3147]">Pending invitations</h3>
              <div className="mt-4 space-y-3">
                {visibleInvites.map((invite) => (
                  <div key={invite._id} className="flex items-center gap-3">
                    <PersonAvatar muted />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] text-[#2f3854]">{invite.email}</p>
                      <p className="text-[12px] text-[#8190af]">
                        Pending {invite.role || 'member'} invite
                        {invite.invitedBy?.name ? ` • sent by ${invite.invitedBy.name}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#fff4df] px-2 py-1 text-[11px] font-medium text-[#986c00]">
                      Pending
                    </span>
                    {isManager ? (
                      <button
                        type="button"
                        onClick={() => cancelInviteMutation.mutate(invite._id)}
                        className="text-[24px] leading-none text-[#7d88a8] transition hover:text-[#d14343]"
                        title="Cancel invite"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-[15px] font-semibold text-[#2b3147]">People invited to this board</h3>
            <div className="mt-4 space-y-4">
              {visibleMembers.map((member) => (
                <div key={member._id} className="flex items-center gap-3">
                  <PersonAvatar name={member.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-[#2f3854]">{member.name}</p>
                    <p className="truncate text-[12px] text-[#8190af]">{member.email}</p>
                  </div>
                  {member.role === 'owner' ? (
                    <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[11px] font-semibold text-[#0073ea]">Owner</span>
                  ) : member.role === 'admin' ? (
                    <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[11px] font-semibold text-[#0073ea]">Admin</span>
                  ) : member.role === 'viewer' ? (
                    <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#64748b]">Viewer</span>
                  ) : (
                    <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#64748b]">Member</span>
                  )}
                  {member.role === 'owner' ? (
                    <span className="text-[12px] text-[#0073ea]">Workspace owner</span>
                  ) : canManageRoles ? (
                    <select
                      value={member.role}
                      onChange={(event) => updateRoleMutation.mutate({ userId: member._id, role: event.target.value })}
                      disabled={updateRoleMutation.isPending}
                      className="rounded-[6px] border border-[#cad5ea] bg-white px-2 py-1 text-[12px] text-[#28324c] outline-none transition focus:border-[#8ab7ff]"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : member.role === 'admin' ? (
                    <span className="text-[12px] text-[#0073ea]">Admin access</span>
                  ) : (
                    <span className="text-[12px] text-[#7d88a8]">{member.role === 'viewer' ? 'Read-only' : 'Project member'}</span>
                  )}
                  {member.role !== 'owner' && currentRole === 'owner' ? (
                    <button
                      type="button"
                      onClick={() => removeMemberMutation.mutate(member._id)}
                      className="text-[24px] leading-none text-[#7d88a8] transition hover:text-[#d14343]"
                      title="Remove member"
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
