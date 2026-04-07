import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { declineInviteApi, previewInviteApi } from '../../api/auth.api';
import Button from '../../components/Dashboard Components/ui/Button';
import Spinner from '../../components/Dashboard Components/ui/Spinner';

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [declined, setDeclined] = useState(false);
  const token = searchParams.get('token');

  const { data, isLoading, error } = useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => previewInviteApi(token).then((res) => res.data.data.invite),
    enabled: Boolean(token),
    retry: false,
  });

  const declineMutation = useMutation({
    mutationFn: () => declineInviteApi(token),
    onSuccess: () => setDeclined(true),
  });

  if (!token) return <Navigate to="/auth" replace />;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#eef4ff] via-white to-[#edf6ff]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#eef4ff] via-white to-[#edf6ff] p-4">
        <div className="w-full max-w-md rounded-[22px] border border-[#d9e3f3] bg-white p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <h1 className="text-[28px] font-semibold text-[#1f2a44]">Invite unavailable</h1>
          <p className="mt-3 text-[14px] text-[#667391]">
            {error?.response?.data?.message || 'This invite link is invalid or expired.'}
          </p>
          <div className="mt-8">
            <Button onClick={() => navigate('/auth')} className="w-auto px-8">
              Go to sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#eef4ff] via-white to-[#edf6ff] p-4">
        <div className="w-full max-w-md rounded-[22px] border border-[#d9e3f3] bg-white p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <h1 className="text-[28px] font-semibold text-[#1f2a44]">Invitation declined</h1>
          <p className="mt-3 text-[14px] text-[#667391]">
            You declined the invitation to join {data.workspaceName}. You can still contact {data.inviterName} if you need a new invite later.
          </p>
          <div className="mt-8">
            <Button onClick={() => navigate('/auth')} className="w-auto px-8">
              Go to sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef4ff] via-white to-[#edf6ff] p-4">
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-lg rounded-[22px] border border-[#d9e3f3] bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0073ea] text-xl font-bold text-white">
              F
            </div>
            <h1 className="text-[30px] font-semibold text-[#1f2a44]">You&apos;re invited</h1>
            <p className="mt-2 text-[15px] text-[#667391]">
              {data.inviterName} invited you to join <span className="font-semibold text-[#1f2a44]">{data.workspaceName}</span>.
            </p>
          </div>

          <div className="rounded-[18px] border border-[#dbe4f5] bg-[#f8fbff] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#8b96b2]">Invitation</span>
              <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[12px] font-medium capitalize text-[#0073ea]">
                {data.role}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-[14px] text-[#42506f]">
              <p><span className="font-medium text-[#1f2a44]">Owner:</span> {data.inviterName}</p>
              <p><span className="font-medium text-[#1f2a44]">Workspace:</span> {data.workspaceName}</p>
              <p><span className="font-medium text-[#1f2a44]">Board:</span> {data.boardName}</p>
              <p><span className="font-medium text-[#1f2a44]">Email:</span> {data.email}</p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => declineMutation.mutate()}
              className="rounded-[10px] border border-[#d2daec] px-5 py-3 text-[14px] font-medium text-[#54617f] transition hover:bg-[#f5f7fc]"
            >
              {declineMutation.isPending ? 'Declining...' : 'Decline'}
            </button>
            <Button
              onClick={() => navigate(`/invite/setup?token=${encodeURIComponent(token)}`)}
              className="w-auto px-8"
            >
              Accept invitation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
