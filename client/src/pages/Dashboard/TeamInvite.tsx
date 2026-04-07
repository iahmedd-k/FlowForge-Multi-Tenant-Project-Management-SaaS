import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
import { getInvitations, getMembers, inviteUser } from '../../api/workspace.api';
import { useAuth } from '../../hooks/useAuth';
import { useBillingLimits } from '../../hooks/useBillingLimits';
import FlowForgeLogo from '../../components/branding/FlowForgeLogo';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

function initialRows(canInviteAdmins) {
  return [
    { id: 1, email: '', role: canInviteAdmins ? 'admin' : 'member' },
    { id: 2, email: '', role: 'member' },
  ];
}

export default function TeamInvitePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { workspace, canInviteAdmins, canInviteMembers } = useAuth();
  const { canAddTeamMember, getTeamMemberQuota } = useBillingLimits();
  const teamMemberQuota = getTeamMemberQuota();
  const isLimitReached = !canAddTeamMember();
  
  const [rows, setRows] = useState(() => initialRows(canInviteAdmins));
  const [feedback, setFeedback] = useState('');

  const allowedRoles = useMemo(
    () => ROLE_OPTIONS.filter((role) => role.value !== 'admin' || canInviteAdmins),
    [canInviteAdmins]
  );

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => getMembers().then((res) => res.data.data.members),
    staleTime: 30_000,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ['workspace-invitations'],
    queryFn: () => getInvitations().then((res) => res.data.data.invitations),
    staleTime: 15_000,
    enabled: canInviteMembers,
  });

  const pendingEmails = useMemo(
    () => new Set(invitations.filter((invite) => invite.status === 'pending').map((invite) => String(invite.email || '').toLowerCase())),
    [invitations]
  );
  const memberEmails = useMemo(
    () => new Set(members.map((member) => String(member.email || '').toLowerCase())),
    [members]
  );

  const filledRows = rows
    .map((row) => ({ ...row, email: row.email.trim().toLowerCase() }))
    .filter((row) => row.email);

  const duplicateEmails = useMemo(() => {
    const emailCounts = {};
    filledRows.forEach((row) => {
      emailCounts[row.email] = (emailCounts[row.email] || 0) + 1;
    });
    return new Set(Object.keys(emailCounts).filter((email) => emailCounts[email] > 1));
  }, [filledRows]);

  const hasAnyEmail = filledRows.length > 0;

  const addMember = () => {
    setRows((current) => [
      ...current,
      { id: Date.now(), email: '', role: canInviteAdmins ? 'admin' : 'member' },
    ]);
  };

  const updateRow = (id, patch) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id) => {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : current));
  };

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const uniqueRows = filledRows.filter((row, index, list) => list.findIndex((item) => item.email === row.email) === index);
      for (const row of uniqueRows) {
        if (memberEmails.has(row.email) || pendingEmails.has(row.email)) continue;
        await inviteUser({ email: row.email, role: row.role });
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['workspace-invitations'] });
      await qc.invalidateQueries({ queryKey: ['members'] });
      setFeedback('Invites sent.');
      setRows(initialRows(canInviteAdmins));
      navigate('/dashboard', { replace: true });
    },
    onError: (err: any) => {
      setFeedback(err?.response?.data?.message || 'Unable to send invites.');
    },
  });

  if (isLimitReached) {
    setFeedback('🚫 Team member limit reached for your plan. Please upgrade to add more members.');
    return;
  }

  const handleInvite = () => {
    if (!hasAnyEmail || inviteMutation.isPending || !canInviteMembers) return;
    if (duplicateEmails.size > 0) {
      setFeedback('Please remove duplicate emails before inviting.');
      return;
    }
    setFeedback('');
    inviteMutation.mutate();
  };

  const handleSkip = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="fixed inset-0 flex bg-white">
      <div className="flex w-[58%] min-w-[560px] flex-col bg-white px-14 pb-8 pt-10">
        <div className="mb-12 flex items-center gap-2">
          <div className="h-6 w-6">
            <FlowForgeLogo to="/" compact />
          </div>
        </div>


        {isLimitReached && teamMemberQuota && (
          <div className="mb-6 rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm flex-1">
              <p className="font-semibold text-orange-900">Team member limit reached</p>
              <p className="text-orange-700">You've reached the maximum team members ({teamMemberQuota.limit}) for your plan. <a href="/subscription" className="underline font-semibold hover:opacity-80">Upgrade</a> to add more members.</p>
            </div>
          </div>
        )}
        <h1 className="mb-3 text-[28px] font-bold leading-tight text-gray-900">Who else is on your team?</h1>
        <p className="mb-7 max-w-[520px] text-[15px] leading-7 text-[#59627b]">
          Invite teammates into <span className="font-semibold text-[#25314f]">{workspace?.name || 'your workspace'}</span> so they can start collaborating right away.
        </p>

        <div className="space-y-3">
          {rows.map((row) => {
            const normalizedEmail = row.email.trim().toLowerCase();
            const isDuplicate = normalizedEmail && duplicateEmails.has(normalizedEmail);
            const exists = normalizedEmail && !isDuplicate && (memberEmails.has(normalizedEmail) || pendingEmails.has(normalizedEmail));
            return (
              <div key={row.id} className={`flex items-start gap-2 ${isLimitReached ? 'opacity-60' : ''}`}>
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="Add email here"
                    value={row.email}
                    onChange={(event) => updateRow(row.id, { email: event.target.value })}
                    className="h-10 w-full rounded border border-gray-200 px-3 text-sm text-gray-800 outline-none transition focus:border-[#6161FF] focus:ring-1 focus:ring-[#6161FF]/40"
                  />
                  {isDuplicate ? (
                    <p className="mt-1 text-[12px] text-[#c2415d]">This email is added multiple times.</p>
                  ) : exists ? (
                    <p className="mt-1 text-[12px] text-[#c2415d]">
                      {memberEmails.has(normalizedEmail) ? 'This user is already in the workspace.' : 'This email already has a pending invite.'}
                    </p>
                  ) : null}
                </div>
                <div className="relative">
                  <select
                    value={row.role}
                    onChange={(event) => updateRow(row.id, { role: event.target.value })}
                    className="h-10 appearance-none rounded border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-700 outline-none transition focus:border-[#6161FF] focus:ring-1 focus:ring-[#6161FF]/40"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={isLimitReached}
                  className={`flex h-10 w-10 items-center justify-center rounded border text-[20px] leading-none transition ${isLimitReached ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700'}`}
                  aria-label="Remove invite row"
                >
                  ×
                </button>
                <button
                  type="button"
                  disabled={isLimitReached}
                  className={`mt-4 flex w-fit items-center gap-2 text-sm transition ${isLimitReached ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'}`}
                  title={isLimitReached ? `Maximum ${teamMemberQuota?.limit} members reached` : 'Add another member'}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border font-light leading-none text-[15px] ${isLimitReached ? 'border-gray-300 text-gray-300' : 'border-gray-400 text-gray-400'}`}>
                    +
                  </span>
                  Add Member
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addMember}
          className="mt-4 flex w-fit items-center gap-2 text-sm text-gray-500 transition hover:text-gray-700"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-400 text-[15px] font-light leading-none text-gray-400">
            +
          </span>
          Add another
        </button>

        {feedback ? (
          <p className={`mt-5 rounded-lg border px-3 py-2 text-sm ${feedback.toLowerCase().includes('sent') ? 'border-[#cdeedc] bg-[#f4fff8] text-[#16784b]' : 'border-[#f0c8d0] bg-[#fff5f7] text-[#b42318]'}`}>
            {feedback}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3 text-[13px] text-[#6d7895]">
          <span>{members.length} workspace member{members.length === 1 ? '' : 's'}</span>
          <span>{invitations.filter((invite) => invite.status === 'pending').length} pending invite{invitations.filter((invite) => invite.status === 'pending').length === 1 ? '' : 's'}</span>
        </div>

        {invitations.filter((invite) => invite.status === 'pending').length > 0 && (
          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-800">Pending Invitations</p>
            <div className="space-y-2">
              {invitations
                .filter((invite) => invite.status === 'pending')
                .map((invite) => (
                  <div key={invite._id} className="flex items-center justify-between rounded bg-white px-3 py-2">
                    <span className="text-sm text-gray-700">{invite.email}</span>
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      Waiting
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center justify-between pt-5">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-gray-500 transition hover:text-gray-700"
          >
            Remind me later
          </button>
          <button
            type="button"
            onClick={handleInvite}
            disabled={!hasAnyEmail || inviteMutation.isPending || !canInviteMembers || isLimitReached}
            title={isLimitReached ? `Maximum ${teamMemberQuota?.limit} members reached` : ''}
            className={`h-9 rounded px-5 text-sm font-medium transition ${
              hasAnyEmail && !inviteMutation.isPending && canInviteMembers && !isLimitReached
                ? 'bg-[#0073ea] text-white shadow-sm hover:bg-[#0060c0]'
                : 'cursor-not-allowed bg-gray-100 text-gray-400'
            }`}
          >
            {inviteMutation.isPending ? 'Sending...' : 'Invite your team'}
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-[#00C875]">
        <button
          type="button"
          onClick={handleSkip}
          className="absolute right-5 top-5 z-10 text-white/70 transition hover:text-white"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="absolute left-[22%] top-[16%] h-[24px] w-[7px] rotate-[22deg] rounded-full bg-white opacity-90" />
        <div className="absolute left-[52%] top-[12%] h-[11px] w-[11px] rotate-[15deg] bg-white opacity-90" />
        <div className="absolute left-[14%] top-[24%] h-[9px] w-[9px] rounded-full bg-white opacity-90" />
        <div className="absolute left-[38%] top-[20%] h-[5px] w-[5px] rounded-full bg-white opacity-70" />
        <div className="absolute right-[18%] top-[18%] h-[10px] w-[28px] rotate-[-20deg] rounded-full bg-[#FFCB00]" />
        <div className="absolute right-[12%] top-[35%] h-[9px] w-[32px] rotate-[14deg] rounded-full bg-white opacity-85" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <div className="relative flex items-end" style={{ width: 230, height: 200 }}>
            <svg style={{ position: 'absolute', left: 0, bottom: 0, width: 120, height: 195 }} viewBox="0 0 120 195" fill="none">
              <rect x="12" y="26" width="17" height="60" rx="8.5" fill="#FF8059" />
              <rect x="32" y="10" width="18" height="72" rx="9" fill="#FF8059" />
              <rect x="53" y="0" width="18" height="78" rx="9" fill="#FF8059" />
              <rect x="74" y="8" width="17" height="70" rx="8.5" fill="#FF8059" />
              <rect x="6" y="68" width="95" height="100" rx="22" fill="#FF8059" />
              <ellipse cx="8" cy="110" rx="10" ry="18" fill="#FF8059" />
            </svg>

            <svg style={{ position: 'absolute', right: 0, bottom: 0, width: 105, height: 170 }} viewBox="0 0 105 170" fill="none">
              <rect x="10" y="4" width="16" height="66" rx="8" fill="#E0417A" />
              <rect x="29" y="0" width="17" height="70" rx="8.5" fill="#E0417A" />
              <rect x="49" y="8" width="16" height="62" rx="8" fill="#E0417A" />
              <rect x="68" y="18" width="14" height="52" rx="7" fill="#E0417A" />
              <rect x="4" y="58" width="84" height="90" rx="20" fill="#E0417A" />
              <ellipse cx="97" cy="95" rx="9" ry="16" fill="#E0417A" />
            </svg>
          </div>

          <div className="flex items-end gap-5">
            <div className="relative flex flex-col items-center">
              <svg style={{ position: 'absolute', top: -10, width: 56, height: 30 }} viewBox="0 0 56 30" fill="none">
                <path d="M4 28 Q4 4 28 4 Q52 4 52 28" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
                <rect x="0" y="22" width="8" height="10" rx="4" fill="white" />
                <rect x="48" y="22" width="8" height="10" rx="4" fill="white" />
              </svg>
              <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[#FDBCB4]">
                <div className="absolute left-0 right-0 top-0 h-[45%] rounded-t-full bg-[#1C1C3A]" />
              </div>
            </div>

            <div className="mb-1 h-12 w-12 rounded-full bg-[#FFCB00] shadow-[0_4px_12px_rgba(0,0,0,0.15)]" />
          </div>

          <div className="h-3 w-44 rounded-full bg-black opacity-20 blur-[6px]" />
        </div>
      </div>
    </div>
  );
}
