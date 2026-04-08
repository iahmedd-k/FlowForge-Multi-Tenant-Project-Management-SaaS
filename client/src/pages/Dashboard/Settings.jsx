import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { changePasswordApi, updateProfileApi } from '../../api/auth.api';
import { getInvitations, getMembers, updateWorkspace } from '../../api/workspace.api';
import { useAuth } from '../../hooks/useAuth';
import { setAuth } from '../../store/authSlice';
import Input from '../../components/Dashboard Components/ui/Input';
import Button from '../../components/Dashboard Components/ui/Button';
import SlackIntegration from '../../components/Dashboard Components/Settings/SlackIntegration';
import CalendarFeed from '../../components/Dashboard Components/Settings/CalendarFeed';

const SETTINGS_TABS = [
  {
    id: 'account',
    label: 'Account',
    blurb: 'Profile & password',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M2.5 13.5c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'workspace',
    label: 'Workspace',
    blurb: 'Name, team & roles',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="3.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M5 3.5V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v1" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M5 9h6M5 7h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'integrations',
    label: 'Integrations',
    blurb: 'Slack & calendar',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 3.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM15 3.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM6 12.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M5.5 3.5h5M3.5 5.75l6 4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'access',
    label: 'Access',
    blurb: 'Roles & permissions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="3" y="7" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
      </svg>
    ),
  },
];

/* ── Notice ─────────────────────────────────────────────── */
function Notice({ kind = 'neutral', children }) {
  const cfg = {
    success: {
      bar: '#22c55e',
      bg: '#f0fdf4',
      text: '#15803d',
      border: '#bbf7d0',
    },
    error: {
      bar: '#ef4444',
      bg: '#fef2f2',
      text: '#b91c1c',
      border: '#fecaca',
    },
    neutral: {
      bar: '#94a3b8',
      bg: '#f8fafc',
      text: '#475569',
      border: '#e2e8f0',
    },
  }[kind];

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: '10px 14px',
        borderRadius: 10,
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        fontSize: 13,
        color: cfg.text,
        lineHeight: 1.55,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          marginTop: 3,
          width: 3,
          height: 14,
          borderRadius: 2,
          background: cfg.bar,
        }}
      />
      {children}
    </div>
  );
}

/* ── Tab button ──────────────────────────────────────────── */
function TabButton({ active, label, blurb, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 12px',
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s',
        background: active ? '#eef2ff' : 'transparent',
        color: active ? '#3730a3' : '#374151',
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: active ? '#c7d2fe' : '#f3f4f6',
          color: active ? '#3730a3' : '#6b7280',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {icon}
      </span>
      <span>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, color: active ? '#3730a3' : '#111827' }}>
          {label}
        </p>
        <p style={{ margin: 0, marginTop: 1, fontSize: 11.5, color: '#9ca3af', lineHeight: 1.3 }}>
          {blurb}
        </p>
      </span>
    </button>
  );
}

/* ── Section shell ───────────────────────────────────────── */
function SectionShell({ eyebrow, title, description, action, children }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* header */}
      <div
        style={{
          padding: 'clamp(16px, 4vw, 24px) clamp(16px, 5vw, 28px) clamp(14px, 4vw, 22px)',
          borderBottom: '1px solid #f3f4f6',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          {eyebrow && (
            <p
              style={{
                margin: 0,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: '#9ca3af',
              }}
            >
              {eyebrow}
            </p>
          )}
          <h2
            style={{
              margin: '4px 0 0',
              fontSize: 'clamp(18px, 4vw, 22px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#111827',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>
          {description && (
            <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#6b7280', lineHeight: 1.55 }}>
              {description}
            </p>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>

      {/* body */}
      <div style={{ padding: '4px 0' }}>{children}</div>
    </div>
  );
}

/* ── Form section ────────────────────────────────────────── */
function FormSection({ title, description, children, footer, noBorder }) {
  return (
    <div
      style={{
        padding: 'clamp(16px, 4vw, 22px) clamp(16px, 5vw, 28px)',
        borderBottom: noBorder ? 'none' : '1px solid #f3f4f6',
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'minmax(150px, 200px) 1fr',
        }}
      >
        <div style={{ paddingTop: 2 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: '#111827',
              lineHeight: 1.4,
            }}
          >
            {title}
          </h3>
          {description && (
            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: '#9ca3af', lineHeight: 1.55 }}>
              {description}
            </p>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {children}
          </div>
          {footer && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── DataList ────────────────────────────────────────────── */
function DataList({ items }) {
  return (
    <div
      style={{
        borderRadius: 10,
        border: '1px solid #f3f4f6',
        overflow: 'hidden',
      }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: i % 2 === 0 ? '#fafafa' : '#ffffff',
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: '#9ca3af',
            }}
          >
            {item.label}
          </span>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: '#111827',
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── AccessList ──────────────────────────────────────────── */
function AccessList({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((item, i) => (
        <div
          key={item.title}
          style={{
            display: 'flex',
            gap: 14,
            padding: '14px 0',
            borderBottom: i < items.length - 1 ? '1px solid #f3f4f6' : 'none',
          }}
        >
          <span
            style={{
              flexShrink: 0,
              marginTop: 3,
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#6366f1',
              marginTop: 7,
            }}
          />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>
              {item.title}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6b7280', lineHeight: 1.55 }}>
              {item.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Avatar ──────────────────────────────────────────────── */
function Avatar({ name }) {
  const initials = (name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: 'linear-gradient(135deg,#818cf8,#6366f1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '-0.03em',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────── */
export default function Settings() {
  const { user, workspace, workspaces, currentRole, currentRoleLabel, isManager, canManageBilling } =
    useAuth();
  const workspaceKey = workspace?._id || 'workspace';
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('account');
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [workspaceMessage, setWorkspaceMessage] = useState(null);

  const profileForm = useForm({
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });

  const passwordForm = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const workspaceForm = useForm({
    defaultValues: { name: workspace?.name || '' },
  });

  useEffect(() => {
    profileForm.reset({ name: user?.name || '', email: user?.email || '' });
  }, [profileForm, user?.email, user?.name]);

  useEffect(() => {
    workspaceForm.reset({ name: workspace?.name || '' });
  }, [workspace?._id, workspace?.name, workspaceForm]);

  const membersQuery = useQuery({
    queryKey: ['workspace-members', 'settings', workspaceKey],
    queryFn: () => getMembers().then((r) => r.data.data.members),
    staleTime: 30_000,
  });

  const invitationsQuery = useQuery({
    queryKey: ['workspace-invitations', 'settings', workspaceKey],
    queryFn: () => getInvitations().then((r) => r.data.data.invitations),
    staleTime: 30_000,
    enabled: isManager,
  });

  const profileMutation = useMutation({
    mutationFn: updateProfileApi,
    onSuccess: (res) => {
      const { user: u, workspace: w, workspaces: ws, message } = res.data.data;
      dispatch(setAuth({ user: u, workspace: w, workspaces: ws }));
      setProfileMessage({ kind: 'success', text: message || 'Profile updated.' });
    },
    onError: (err) =>
      setProfileMessage({ kind: 'error', text: err.response?.data?.message || 'Could not save.' }),
  });

  const passwordMutation = useMutation({
    mutationFn: changePasswordApi,
    onSuccess: (res) => {
      passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage({ kind: 'success', text: res.data.data.message || 'Password updated.' });
    },
    onError: (err) =>
      setPasswordMessage({ kind: 'error', text: err.response?.data?.message || 'Could not update.' }),
  });

  const workspaceMutation = useMutation({
    mutationFn: updateWorkspace,
    onSuccess: (res) => {
      dispatch(setAuth({ user, workspace: res.data.data.workspace, workspaces }));
      setWorkspaceMessage({ kind: 'success', text: 'Workspace updated.' });
    },
    onError: (err) =>
      setWorkspaceMessage({ kind: 'error', text: err.response?.data?.message || 'Could not update.' }),
  });

  const handlePasswordSubmit = passwordForm.handleSubmit((values) => {
    setPasswordMessage(null);
    if (values.newPassword !== values.confirmPassword) {
      setPasswordMessage({ kind: 'error', text: 'Passwords do not match.' });
      return;
    }
    passwordMutation.mutate({ currentPassword: values.currentPassword, newPassword: values.newPassword });
  });

  const pendingInvitations = (invitationsQuery.data || []).filter((i) => i.status === 'pending').length;
  const memberCount = (membersQuery.data || []).length;
  const joinedOn = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';
  const workspaceCount = workspaces?.length || 0;
  const isRestrictedRole = ['member', 'viewer'].includes(currentRole);

  const accessItems = useMemo(() => {
    if (['owner', 'admin'].includes(currentRole)) {
      return [
        { title: 'Workspace control', text: 'Update workspace details and team access from settings and invite flows.' },
        { title: 'Project visibility', text: 'You can review all workspace projects and role-protected actions.' },
        { title: 'Billing access', text: canManageBilling ? 'Billing is available in the sidebar.' : 'Billing is hidden for this role.' },
      ];
    }
    return [
      { title: 'Workspace scope', text: 'You only see projects shared with your account.' },
      { title: 'Management actions', text: 'Workspace settings, invites, and billing stay with admins.' },
      { title: 'Daily work', text: 'Use Home, My Work, and Projects for assigned tasks and updates.' },
    ];
  }, [canManageBilling, currentRole]);

  /* ── Views ─────────────────────────────────────────────── */

  const accountView = (
    <SectionShell
      eyebrow="Account"
      title="Your account"
      description="Update your name, email address, and sign-in credentials."
    >
      {/* Profile header card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: 'clamp(14px, 3vw, 18px) clamp(16px, 5vw, 28px)',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <Avatar name={user?.name} />
        <div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
            {user?.name || 'Your Name'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#9ca3af' }}>
            {user?.email || 'email@example.com'} &nbsp;·&nbsp; {currentRoleLabel}
          </p>
        </div>
      </div>

      <FormSection
        title="Profile"
        description="Display name and email used across the workspace."
        footer={
          <Button loading={profileMutation.isPending} className="w-auto px-5">
            Save changes
          </Button>
        }
      >
        <form
          onSubmit={profileForm.handleSubmit((values) => {
            setProfileMessage(null);
            profileMutation.mutate(values);
          })}
        >
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
            <Input label="Full name" {...profileForm.register('name', { required: true })} />
            <Input label="Email" type="email" {...profileForm.register('email', { required: true })} />
          </div>
          {profileMessage && (
            <div style={{ marginTop: 12 }}>
              <Notice kind={profileMessage.kind}>{profileMessage.text}</Notice>
            </div>
          )}
        </form>
      </FormSection>

      <FormSection
        title="Password"
        description="Change the password used for future sign-ins."
        noBorder
        footer={
          <Button loading={passwordMutation.isPending} className="w-auto px-5">
            Update password
          </Button>
        }
      >
        <form onSubmit={handlePasswordSubmit}>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))' }}>
            <Input label="Current password" type="password" {...passwordForm.register('currentPassword', { required: true })} />
            <Input label="New password" type="password" {...passwordForm.register('newPassword', { required: true })} />
            <Input label="Confirm password" type="password" {...passwordForm.register('confirmPassword', { required: true })} />
          </div>
          <div style={{ marginTop: 12 }}>
            {passwordMessage
              ? <Notice kind={passwordMessage.kind}>{passwordMessage.text}</Notice>
              : <Notice>Use at least 6 characters for a strong password.</Notice>
            }
          </div>
        </form>
      </FormSection>
    </SectionShell>
  );

  const workspaceView = (
    <SectionShell
      eyebrow="Workspace"
      title="Workspace settings"
      description="Details about your team, membership, and workspace configuration."
    >
      {isRestrictedRole && (
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #f3f4f6' }}>
          <Notice>
            {currentRole === 'viewer'
              ? 'Viewer access is read-only outside shared work.'
              : 'Member access is limited to assigned and shared work.'}
          </Notice>
        </div>
      )}

      <FormSection title="Overview" description="Core workspace information at a glance.">
        <DataList
          items={[
            { label: 'Workspace', value: workspace?.name || 'Workspace' },
            { label: 'Your role', value: currentRoleLabel },
            { label: 'Members', value: `${memberCount} people` },
            { label: 'Pending invites', value: isManager ? `${pendingInvitations}` : 'Managers only' },
            { label: 'Workspaces', value: `${workspaceCount} available` },
          ]}
        />
      </FormSection>

      <FormSection
        title="Workspace name"
        description={isManager ? 'Rename the current workspace.' : 'Only admins can rename the workspace.'}
        noBorder={!isManager}
        footer={
          isManager ? (
            <Button loading={workspaceMutation.isPending} className="w-auto px-5">
              Save workspace
            </Button>
          ) : null
        }
      >
        {isManager ? (
          <form
            onSubmit={workspaceForm.handleSubmit((values) => {
              setWorkspaceMessage(null);
              workspaceMutation.mutate(values);
            })}
          >
            <Input label="Workspace name" {...workspaceForm.register('name', { required: true })} />
            {workspaceMessage && (
              <div style={{ marginTop: 12 }}>
                <Notice kind={workspaceMessage.kind}>{workspaceMessage.text}</Notice>
              </div>
            )}
          </form>
        ) : (
          <Notice>Ask an owner or admin to update workspace details.</Notice>
        )}
      </FormSection>
    </SectionShell>
  );

  const integrationsView = (
    <SectionShell
      eyebrow="Integrations"
      title="Connected tools"
      description="Manage third-party services connected to this workspace."
    >
      <FormSection title="Slack" description="Link team communication to project activity.">
        <SlackIntegration />
      </FormSection>
      <FormSection title="Calendar" noBorder description="Subscribe to tasks via Google Calendar, Apple, or Outlook.">
        <CalendarFeed />
      </FormSection>
    </SectionShell>
  );

  const accessView = (
    <SectionShell
      eyebrow="Access"
      title="Permissions & scope"
      description="A clear overview of what you can see and manage in this workspace."
    >
      <FormSection title="Account" description="Current sign-in and workspace context.">
        <DataList
          items={[
            { label: 'Signed in as', value: user?.email || 'No email' },
            { label: 'Joined', value: joinedOn },
            { label: 'Role', value: currentRoleLabel },
            { label: 'Workspace', value: workspace?.name || 'Workspace' },
          ]}
        />
      </FormSection>
      <FormSection title="What you can manage" description="Role-based access in plain language." noBorder>
        <AccessList items={accessItems} />
      </FormSection>
    </SectionShell>
  );

  const activeView = { account: accountView, workspace: workspaceView, integrations: integrationsView, access: accessView }[activeTab];

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px, 4vw, 32px) clamp(16px, 5vw, 24px)' }}>

        {/* Page header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 28,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#9ca3af',
              }}
            >
              Configuration
            </p>
            <h1
              style={{
                margin: '4px 0 6px',
                fontSize: 'clamp(22px, 6vw, 30px)',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                color: '#111827',
                lineHeight: 1.1,
              }}
            >
              Settings
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
              Account, workspace, integrations, and access.
            </p>
          </div>

          {/* Breadcrumb pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 99,
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              fontSize: 12.5,
              color: '#6b7280',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#6366f1',
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 600, color: '#111827' }}>
              {workspace?.name || 'Workspace'}
            </span>
            <span style={{ color: '#d1d5db' }}>·</span>
            <span>{currentRoleLabel}</span>
          </div>
        </div>

        {/* Body grid */}
        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'minmax(200px, 220px) 1fr', alignItems: 'start' }}>

          {/* Sidebar */}
          <aside
            style={{
              position: 'sticky',
              top: 84,
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 16,
              padding: '12px 10px',
            }}
          >
            <p
              style={{
                margin: '0 4px 8px',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: '#d1d5db',
              }}
            >
              Sections
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {SETTINGS_TABS.map((tab) => (
                <TabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  label={tab.label}
                  blurb={tab.blurb}
                  icon={tab.icon}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>

            {/* Divider + user card at bottom */}
            <div style={{ margin: '12px 0 0', paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: '#f9fafb',
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg,#818cf8,#6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#111827',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.name || 'You'}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: '#9ca3af',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentRoleLabel}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main style={{ minWidth: 0 }}>{activeView}</main>
        </div>
      </div>
    </div>
  );
}