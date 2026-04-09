import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
import { getInvitations, getMembers, inviteUser, updateWorkspace } from '../../api/workspace.api';
import { useAuth } from '../../hooks/useAuth';
import { useBillingLimits } from '../../hooks/useBillingLimits';
import { setAuth } from '../../store/authSlice';
import FlowForgeLogo from '../../components/branding/FlowForgeLogo';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

function initialRows(canInviteAdmins) {
  return [
    { id: 1, email: '', role: canInviteAdmins ? 'admin' : 'member' },
  ];
}

export default function TeamInvitePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const qc = useQueryClient();
  const { workspace, user, canInviteAdmins, canInviteMembers } = useAuth();
  const { canAddTeamMember, getTeamMemberQuota } = useBillingLimits();
  const teamMemberQuota = getTeamMemberQuota();
  const isLimitReached = !canAddTeamMember();
  
  const [rows, setRows] = useState(() => initialRows(canInviteAdmins));
  const [feedback, setFeedback] = useState('');
  const [fallbackLinks, setFallbackLinks] = useState([]);
  const [showLinks, setShowLinks] = useState(false);

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
      const links = [];
      for (const row of uniqueRows) {
        if (memberEmails.has(row.email) || pendingEmails.has(row.email)) continue;
        const response = await inviteUser({ email: row.email, role: row.role });
        if (response.data.data?.fallbackLink) {
          links.push({
            email: row.email,
            url: response.data.data.fallbackLink,
            inviterName: response.data.data.invite?.invitedBy?.name,
          });
        }
      }
      return links;
    },
    onSuccess: async (links) => {
      await qc.invalidateQueries({ queryKey: ['workspace-invitations'] });
      await qc.invalidateQueries({ queryKey: ['members'] });
      // Mark setup as complete
      await updateWorkspace({ setupCompleted: true });
      
      // Update Redux state to reflect the completed setup
      dispatch(setAuth({
        user,
        workspace: { ...workspace, setupCompleted: true },
        workspaces: workspace?.workspaces || [],
      }));
      
      if (links.length > 0) {
        setFallbackLinks(links);
        setShowLinks(true);
      } else {
        setFeedback('Invites sent.');
        setRows(initialRows(canInviteAdmins));
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      }
    },
    onError: (err: any) => {
      setFeedback(err?.response?.data?.message || 'Unable to send invites.');
    },
  });

  if (isLimitReached) {
    return (
      <div className="fixed inset-0 flex flex-col lg:flex-row bg-white">
        <div className="flex w-full lg:w-[58%] flex-col bg-white px-6 sm:px-10 lg:px-14 pb-8 pt-10">
          <div className="mb-12 flex items-center gap-2">
            <div className="h-6 w-6">
              <FlowForgeLogo to="/" compact />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 py-16">
            <AlertCircle className="h-12 w-12 text-orange-600" />
            <div className="text-center">
              <h1 className="mb-3 text-[24px] font-bold text-gray-900">Team member limit reached</h1>
              <p className="mb-6 max-w-[420px] text-[15px] leading-7 text-gray-600">
                You've reached the maximum team members ({teamMemberQuota?.limit}) for your plan. Upgrade to add more members.
              </p>
              <a
                href="/billing"
                className="inline-block h-9 rounded bg-[#0073ea] px-5 text-sm font-medium text-white transition hover:bg-[#0060c0]"
              >
                Upgrade Plan
              </a>
            </div>
          </div>

          <div className="flex-1" />
          <div className="pt-5">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-gray-500 transition hover:text-gray-700"
            >
              Continue to dashboard
            </button>
          </div>
        </div>

        <div className="hidden lg:flex relative flex-1 overflow-hidden bg-[#00C875]">
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
        </div>
      </div>
    );
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

  const handleSkip = async () => {
    // Mark setup as complete
    await updateWorkspace({ setupCompleted: true });
    
    // Update Redux state to reflect the completed setup
    dispatch(setAuth({
      user,
      workspace: { ...workspace, setupCompleted: true },
      workspaces: workspace?.workspaces || [],
    }));
    
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="fixed inset-0 flex flex-col lg:flex-row bg-white dark:bg-gray-950">
      <div className="flex w-full lg:w-[58%] flex-col bg-white dark:bg-gray-950 px-6 sm:px-10 lg:px-14 pb-8 pt-10 overflow-y-auto">
        <div className="mb-12 flex items-center gap-2">
          <div className="h-6 w-6">
            <FlowForgeLogo to="/" compact />
          </div>
        </div>


        <h1 className="mb-3 text-[28px] font-bold leading-tight text-gray-900 dark:text-white">Who else is on your team?</h1>
        <p className="mb-7 max-w-[520px] text-[15px] leading-7 text-[#59627b] dark:text-gray-400">
          Invite teammates into <span className="font-semibold text-[#25314f] dark:text-gray-300">{workspace?.name || 'your workspace'}</span> so they can start collaborating right away.
        </p>

        <div className="space-y-3">
          {rows.map((row) => {
            const normalizedEmail = row.email.trim().toLowerCase();
            const isDuplicate = normalizedEmail && duplicateEmails.has(normalizedEmail);
            const exists = normalizedEmail && !isDuplicate && (memberEmails.has(normalizedEmail) || pendingEmails.has(normalizedEmail));
            return (
              <div key={row.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="Add email here"
                    value={row.email}
                    onChange={(event) => updateRow(row.id, { email: event.target.value })}
                    className="h-10 w-full rounded border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-[#6161FF] focus:ring-1 focus:ring-[#6161FF]/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-[#6161FF]"
                  />
                  {isDuplicate ? (
                    <p className="mt-1 text-[12px] text-[#c2415d] dark:text-red-400">This email is added multiple times.</p>
                  ) : exists ? (
                    <p className="mt-1 text-[12px] text-[#c2415d] dark:text-red-400">
                      {memberEmails.has(normalizedEmail) ? 'This user is already in the workspace.' : 'This email already has a pending invite.'}
                    </p>
                  ) : null}
                </div>
                <div className="relative">
                  <select
                    value={row.role}
                    onChange={(event) => updateRow(row.id, { role: event.target.value })}
                    className="h-10 w-full appearance-none rounded border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-700 outline-none transition focus:border-[#6161FF] focus:ring-2 focus:ring-[#6161FF]/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-[#6161FF]"
                  >
                    {allowedRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                    fill="none"
                    viewBox="0 0 16 16"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l8 8" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="flex h-10 w-10 items-center justify-center rounded border border-gray-200 text-[20px] leading-none text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  aria-label="Remove invite row"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addMember}
          disabled={isLimitReached}
          className={`mt-4 flex w-fit items-center gap-2 text-sm transition ${
            isLimitReached 
              ? 'cursor-not-allowed text-gray-300 dark:text-gray-600' 
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[15px] font-light leading-none ${
            isLimitReached 
              ? 'border-gray-300 text-gray-300 dark:border-gray-600 dark:text-gray-600' 
              : 'border-gray-400 text-gray-400 dark:border-gray-500 dark:text-gray-500'
          }`}>
            +
          </span>
          Add another
        </button>

        {feedback ? (
          <p className={`mt-5 rounded-lg border px-3 py-2 text-sm ${feedback.toLowerCase().includes('sent') ? 'border-[#cdeedc] bg-[#f4fff8] text-[#16784b] dark:border-[#1e6d42] dark:bg-[#0f3d1f] dark:text-[#6ee7b7]' : 'border-[#f0c8d0] bg-[#fff5f7] text-[#b42318] dark:border-[#7f2929] dark:bg-[#3d1f1f] dark:text-[#f87171]'}`}>
            {feedback}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3 text-[13px] text-[#6d7895] dark:text-gray-400">
          <span>{members.length} workspace member{members.length === 1 ? '' : 's'}</span>
          <span>{invitations.filter((invite) => invite.status === 'pending').length} pending invite{invitations.filter((invite) => invite.status === 'pending').length === 1 ? '' : 's'}</span>
        </div>

        {invitations.filter((invite) => invite.status === 'pending').length > 0 && (
          <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20 dark:border dark:border-blue-800">
            <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Pending Invitations</p>
            <div className="space-y-2">
              {invitations
                .filter((invite) => invite.status === 'pending')
                .map((invite) => (
                  <div key={invite._id} className="flex items-center justify-between rounded bg-white px-3 py-2 dark:bg-gray-900 dark:border dark:border-gray-800">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{invite.email}</span>
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Waiting
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center justify-between gap-3 pt-5">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Remind me later
          </button>
          <button
            type="button"
            onClick={handleInvite}
            disabled={!hasAnyEmail || inviteMutation.isPending || !canInviteMembers}
            className={`h-10 rounded px-6 text-sm font-medium transition ${
              hasAnyEmail && !inviteMutation.isPending && canInviteMembers
                ? 'bg-[#0073ea] text-white shadow-sm hover:bg-[#0060c0]'
                : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
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

      {showLinks && fallbackLinks.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-lg bg-white p-6 dark:bg-gray-900">
            <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Share Invite Links</h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              If email delivery is delayed, share these links directly with your teammates:
            </p>
            
            <div className="space-y-3">
              {fallbackLinks.map((link, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{link.email}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={link.url}
                      className="flex-1 rounded border border-gray-300 bg-gray-50 px-2 py-1.5 text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(link.url);
                        toast.success('Link copied!');
                      }}
                      className="rounded bg-[#0073ea] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0060c0]"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowLinks(false);
                setRows(initialRows(canInviteAdmins));
                setTimeout(() => navigate('/dashboard', { replace: true }), 500);
              }}
              className="mt-6 w-full rounded bg-[#0073ea] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0060c0]"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
