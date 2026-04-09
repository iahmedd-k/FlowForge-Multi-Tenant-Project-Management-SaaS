import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createWorkspace } from '../../api/workspace.api';
import { setAuth } from '../../store/authSlice';
import Button from '../../components/Dashboard Components/ui/Button';

function PreviewBoard({ name }) {
  const title = name.trim();

  return (
    <div className="relative w-full overflow-hidden rounded-[34px] border border-[#d9e2f5] bg-white px-8 py-7 shadow-[0_35px_90px_rgba(49,78,135,0.18)]">
      <div className="mb-7 flex items-start justify-between">
        <div>
          <h2 className="min-h-[58px] text-[48px] font-semibold tracking-[-0.045em] text-[#5c617d]">{title}</h2>
        </div>
        <button
          type="button"
          className="text-[34px] leading-none text-[#7d859d]"
          aria-label="Preview close icon"
          tabIndex={-1}
        >
          ×
        </button>
      </div>

      <div className="space-y-7">
        <div>
          <div className="mb-5 h-[6px] w-[150px] rounded-full bg-[#5d96ff]" />
          <div className="overflow-hidden rounded-[18px] border border-[#d8e1f4]">
            <div className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_56px] border-b border-[#d8e1f4] bg-white">
              {['', '', '', '', '+'].map((label, index) => (
                <div key={index} className="flex h-12 items-center justify-center border-r border-[#d8e1f4] last:border-r-0">
                  {label === '+' ? (
                    <span className="text-[28px] font-light text-[#59627b]">{label}</span>
                  ) : (
                    <span className="h-[5px] w-[98px] rounded-full bg-[#c0c7d8]" />
                  )}
                </div>
              ))}
            </div>
            {[0, 1, 2].map((row) => (
              <div key={row} className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_56px] border-b border-[#d8e1f4] last:border-b-0">
                {[110, 40, 40, 40, 0].map((width, index) => (
                  <div key={index} className="flex h-12 items-center justify-center border-r border-[#d8e1f4] last:border-r-0">
                    {index === 4 ? null : <span className="h-[5px] rounded-full bg-[#c0c7d8]" style={{ width }} />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="ml-auto w-[70%] overflow-hidden rounded-[18px] border border-[#d8e1f4] bg-white">
          <div className="grid grid-cols-3">
            {[0, 1, 2].map((cell) => (
              <div key={cell} className="h-12 border-r border-[#d8e1f4] last:border-r-0" />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-5 h-[6px] w-[150px] rounded-full bg-[#10c66c]" />
          <div className="overflow-hidden rounded-[18px] border border-[#d8e1f4]">
            <div className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_56px] border-b border-[#d8e1f4] bg-white">
              {['', '', '', '', '+'].map((label, index) => (
                <div key={index} className="flex h-12 items-center justify-center border-r border-[#d8e1f4] last:border-r-0">
                  {label === '+' ? (
                    <span className="text-[28px] font-light text-[#59627b]">{label}</span>
                  ) : (
                    <span className={`h-[5px] rounded-full ${index === 0 ? 'w-[98px]' : 'w-[40px]'} bg-[#c0c7d8]`} />
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_56px]">
              {[110, 40, 40, 40, 0].map((width, index) => (
                <div key={index} className="flex h-12 items-center justify-center border-r border-[#d8e1f4] last:border-r-0">
                  {index === 4 ? null : <span className="h-[5px] rounded-full bg-[#e5e9f2]" style={{ width }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ml-auto w-[70%] overflow-hidden rounded-[18px] border border-[#d8e1f4] bg-white">
          <div className="grid grid-cols-3">
            {[0, 1, 2].map((cell) => (
              <div key={cell} className="h-12 border-r border-[#d8e1f4] last:border-r-0" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectSetup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, workspace, workspaces } = useSelector((state) => state.auth);
  const [name, setName] = useState('');

  const { mutate, isPending, error } = useMutation({
    mutationFn: createWorkspace,
    onSuccess: (response) => {
      const nextWorkspace = response.data.data.workspace;
      const nextWorkspaces = response.data.data.workspaces || [
        { workspace: nextWorkspace, role: 'owner', membershipId: nextWorkspace._id }
      ];

      dispatch(setAuth({
        user: { ...user, workspaceId: nextWorkspace._id },
        workspace: nextWorkspace,
        workspaces: nextWorkspaces,
      }));

      navigate('/workspace/team-invite', { replace: true });
    },
  });

  return (
    <div className="h-screen overflow-hidden bg-[linear-gradient(90deg,#ffffff_0%,#fbfcff_55%,#eef3ff_100%)]">
      <div className="mx-auto flex h-screen max-w-[1700px] flex-col gap-8 px-6 py-6 lg:grid lg:grid-cols-[minmax(420px,620px)_minmax(520px,1fr)] lg:items-center lg:gap-12 lg:px-16 xl:px-24">
        <section className="flex flex-col justify-center">
          <div className="mb-10 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[radial-gradient(circle_at_30%_30%,#8aa7ff_0%,#5b6fff_45%,#3f57f2_100%)] text-white shadow-[0_12px_24px_rgba(73,105,255,0.24)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
              </svg>
            </span>
            <div className="text-[20px] tracking-[-0.03em] text-[#20263a]">
              <span className="font-semibold">FlowForge</span>
              <span className="ml-2 font-normal text-[#59627b]">workspace setup</span>
            </div>
          </div>

          <div className="max-w-[520px]">
            <h1 className="text-[44px] font-semibold leading-[1.08] tracking-[-0.05em] text-[#1e2a44] sm:text-[52px]">
              Let&apos;s start working together
            </h1>
            <p className="mt-5 max-w-[420px] text-[17px] leading-7 text-[#33415f]">
              Give your workspace a name.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;

              mutate({
                name: name.trim(),
                description: '',
              });
            }}
            className="mt-8 max-w-[520px] space-y-5"
          >
            <div>
              <label className="mb-3 block text-[15px] font-medium text-[#2d3b59]">Workspace name</label>
              <div className="relative">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Marketing plan"
                  className="h-[58px] w-full rounded-[14px] border border-[#4b8dff] bg-white px-5 pr-14 text-[17px] text-[#1f2a44] outline-none shadow-[0_10px_30px_rgba(69,116,212,0.08)]"
                />
                {name ? (
                  <button
                    type="button"
                    onClick={() => setName('')}
                    className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[20px] text-[#6b748d] transition hover:bg-[#f1f5ff]"
                    aria-label="Clear workspace name"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </div>

            {error ? (
              <p className="rounded-[14px] border border-[#f0c8d0] bg-[#fff5f7] px-4 py-3 text-[14px] text-[#b42318]">
                {error.response?.data?.message || 'Unable to save workspace details.'}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-4 pt-2">
              <Button loading={isPending} className="h-[50px] min-w-[122px] rounded-[12px] bg-[#0b74f1] px-7 text-[18px] font-medium hover:bg-[#065fcb]">
                Next
              </Button>
            </div>
          </form>
        </section>

        <section className="relative hidden lg:block">
          <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_20%_20%,rgba(129,157,255,0.22),transparent_36%),radial-gradient(circle_at_80%_80%,rgba(108,196,255,0.16),transparent_28%)]" />
          <div className="relative px-4 py-4">
            <PreviewBoard name={name} />
          </div>
        </section>
      </div>
    </div>
  );
}
