import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { acceptInviteApi, previewInviteApi } from '../../api/auth.api';
import { setAuth } from '../../store/authSlice';
import Input from '../../components/Dashboard Components/ui/Input';
import Button from '../../components/Dashboard Components/ui/Button';
import Spinner from '../../components/Dashboard Components/ui/Spinner';

const schema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [serverErr, setServerErr] = useState('');
  const token = searchParams.get('token');

  const { data, isLoading, error: previewError } = useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => previewInviteApi(token).then((res) => res.data.data.invite),
    enabled: Boolean(token),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      name: data?.existingName || '',
      email: data?.email || '',
      password: '',
    },
  });

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  const onSubmit = async (formData) => {
    setServerErr('');

    try {
      const response = await acceptInviteApi({ token, ...formData });
      const { user, workspace, workspaces } = response.data.data;
      dispatch(setAuth({ user, workspace: workspace || user?.workspaceId || null, workspaces }));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (!err.response) {
        setServerErr('Unable to connect to the server. Check the API URL and backend status.');
        return;
      }

      setServerErr(err.response?.data?.message || 'Unable to accept invite');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#eef4ff] via-white to-[#edf6ff]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (previewError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#eef4ff] via-white to-[#edf6ff] p-4">
        <div className="w-full max-w-md rounded-[22px] border border-[#d9e3f3] bg-white p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <h1 className="text-[28px] font-semibold text-[#1f2a44]">Invite unavailable</h1>
          <p className="mt-3 text-[14px] text-[#667391]">
            {previewError?.response?.data?.message || 'This invite link is invalid or expired.'}
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
            <h1 className="text-[30px] font-semibold text-[#1f2a44]">Set up your account</h1>
            <p className="mt-2 text-[15px] text-[#667391]">
              Finish joining <span className="font-semibold text-[#1f2a44]">{data.workspaceName}</span> so you can log in next time with your own credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Name"
              placeholder="John Smith"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              readOnly
              className="bg-gray-50 text-gray-500"
              {...register('email')}
            />

            <Input
              label={data.existingUser ? 'Password' : 'Create password'}
              type="password"
              placeholder={data.existingUser ? 'Enter your password' : 'Create a password'}
              error={errors.password?.message}
              {...register('password')}
            />

            {serverErr && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {serverErr}
              </p>
            )}

            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate(`/invite?token=${encodeURIComponent(token)}`)}
                className="text-sm font-medium text-[#5f6f93] hover:text-[#1f2a44]"
              >
                Back
              </button>
              <Button loading={isSubmitting} className="w-auto px-7">
                Join workspace
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
