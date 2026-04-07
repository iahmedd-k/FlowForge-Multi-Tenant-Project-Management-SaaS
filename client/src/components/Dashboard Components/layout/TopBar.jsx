import { Grid3X3, Menu, Settings, Sparkles, Users, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import FlowForgeLogo from '../../branding/FlowForgeLogo';
import InviteBoardModal from './InviteBoardModal';
import NotificationsMenu from './NotificationsMenu';
import UserAvatar from '../ui/UserAvatar';
import { getPlans, getBillingStatus } from '../../../api/billing.api';
import { useIsMobile } from '../../../hooks/use-mobile';

function TopIcon({ title, to, children, onClick }) {
  const content = (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#1f2a44] transition hover:bg-[#eef2fb] hover:text-[#0f72f0]">
      {children}
    </span>
  );

  if (to) {
    return (
      <NavLink to={to} title={title} className="block">
        {content}
      </NavLink>
    );
  }

  return (
    <button type="button" title={title} className="block" onClick={onClick}>
      {content}
    </button>
  );
}

export default function TopBar({ onOpenMobileSidebar }) {
  const { user, workspace, logout, isManager, canManageBilling, canAccessReports, canInviteMembers } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [showInvite, setShowInvite] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPlansMenu, setShowPlansMenu] = useState(false);
  const menuRef = useRef(null);
  const plansRef = useRef(null);

  const { data: plans = [] } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => getPlans().then((r) => r.data.data.plans),
    staleTime: 60_000,
    enabled: canManageBilling,
  });

  const { data: billingStatus } = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => getBillingStatus().then((r) => r.data.data),
    staleTime: 60_000,
    enabled: canManageBilling,
  });

  const openAiSidekick = () => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
      window.setTimeout(() => {
        window.dispatchEvent(new Event('dashboard:open-ai-sidekick'));
      }, 120);
      return;
    }

    window.dispatchEvent(new Event('dashboard:open-ai-sidekick'));
  };

  const openAutomations = () => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard?automations=1');
      return;
    }

    window.dispatchEvent(new Event('dashboard:open-automations'));
  };

  useEffect(() => {
    if (!showProfileMenu && !showPlansMenu) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (plansRef.current && !plansRef.current.contains(event.target)) {
        setShowPlansMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowProfileMenu(false);
        setShowPlansMenu(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showProfileMenu, showPlansMenu]);

  const menuItems = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Projects', to: '/projects' },
    { label: 'My Work', to: '/calendar' },
    { label: 'Reports', to: '/reports' },
    { label: 'Billing', to: '/billing' },
    { label: 'Settings', to: '/settings' },
  ].filter((item) => {
    if (item.to === '/billing' && !canManageBilling) return false;
    if (item.to === '/reports' && !canAccessReports) return false;
    return true;
  });

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#d9e0ef] bg-[#eef3ff]">
        <div className="flex h-[60px] items-center justify-between px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {isMobile ? (
              <button
                type="button"
                onClick={onOpenMobileSidebar}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1f2a44] transition hover:bg-[#eef2fb]"
                aria-label="Open navigation"
              >
                <Menu size={20} strokeWidth={2} />
              </button>
            ) : null}
            <FlowForgeLogo to="/dashboard" subtitle="workspace" className="min-w-0" compact />
            {!isMobile && canManageBilling ? (
            <div className="relative ml-4" ref={plansRef}>
              <button
                type="button"
                onClick={() => setShowPlansMenu((current) => !current)}
                className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#0f72f0] bg-white px-3 text-[12px] font-medium text-[#0f72f0] shadow-sm transition hover:bg-[#f8fbff]"
              >
                <Sparkles size={14} className="text-[#0f72f0]" />
                <span>See plans</span>
              </button>

              {showPlansMenu ? (
                <div className="absolute left-0 top-[calc(100%+10px)] z-40 w-[min(1080px,calc(100vw-80px))] rounded-[20px] border border-[#dbe3f2] bg-white p-5 shadow-[0_24px_54px_rgba(15,23,42,0.18)]">
                  <div className="grid gap-5 md:grid-cols-3">
                    {plans.map((plan) => {
                      const isCurrent = plan.id === billingStatus?.tier;
                      const isFeatured = plan.id === 'pro' || plan.name?.toLowerCase() === 'pro';
                      const headline = isCurrent ? 'Current Trial' : '\u00A0';
                      return (
                        <div
                          key={plan.id}
                          className={`relative rounded-[16px] border p-6 ${
                            isCurrent
                              ? 'border-[#0f72f0] shadow-[0_0_0_1px_#0f72f0_inset]'
                              : 'border-[#dbe3f2]'
                          }`}
                        >
                          <div className="absolute left-0 right-0 top-[-14px] text-center text-[11px] font-medium text-[#374151]">
                            <span className="bg-white px-3">{headline}</span>
                          </div>
                          <div className="mb-3 flex items-center gap-3">
                            <h3 className="text-[18px] font-semibold text-[#1f2a44]">{plan.name}</h3>
                            {isFeatured ? (
                              <span className="rounded-[6px] bg-[#2f3441] px-2 py-1 text-[10px] font-semibold text-white">
                                Most Popular
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-[28px] font-semibold leading-none text-[#2f3441]">
                              {plan.price === 0 ? 'Free' : `$${plan.price}`}
                            </span>
                            {plan.price > 0 ? (
                              <span className="pt-1 text-[12px] leading-5 text-[#4f5d81]">seat / month</span>
                            ) : (
                              <span className="pt-1 text-[12px] leading-5 text-[#4f5d81]">plan</span>
                            )}
                          </div>
                          <p className="mt-5 text-[13px] text-[#2f3441]">
                            {plan.price > 0 ? `Total $${plan.price * 20} / month` : 'Ideal for getting started'}
                          </p>
                          <p className="text-[13px] text-[#4f5d81]">
                            {plan.price > 0 ? 'Billed annually' : 'No annual commitment'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPlansMenu(false);
                              navigate('/billing');
                            }}
                            className={`mt-5 h-10 w-full rounded-[6px] border text-[13px] font-medium transition ${
                              isCurrent
                                ? 'border-[#0f72f0] bg-[#0f72f0] text-white'
                                : 'border-[#c8d3e8] bg-white text-[#22304b] hover:bg-[#f7faff]'
                            }`}
                          >
                            Continue
                          </button>
                          <div className="my-4 h-px bg-[#e6ebf5]" />
                          <p className="mb-4 text-[13px] font-semibold text-[#1f2a44]">
                            Includes {plan.name === 'Free' ? 'Free' : plan.name}, plus:
                          </p>
                          <div className="space-y-3 text-[12px] leading-5 text-[#22304b]">
                            {(plan.features || []).slice(0, 8).map((feature) => (
                              <div key={feature} className="flex items-start gap-2">
                                <span className="pt-[2px] text-[#635bff]">✦</span>
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            {!isMobile ? (
            <TopIcon title="Projects" to="/projects">
              <Grid3X3 size={19} strokeWidth={1.9} />
            </TopIcon>
            ) : null}

            {!isMobile && canInviteMembers ? (
              <TopIcon title="Invite team" onClick={() => setShowInvite(true)}>
                <Users size={19} strokeWidth={1.9} />
              </TopIcon>
            ) : null}

            {!isMobile && isManager ? (
              <button
                type="button"
                title="Automations"
                onClick={openAutomations}
                className="ml-1 inline-flex h-9 items-center gap-2 rounded-full border border-[#d7e4fb] bg-white px-3 text-[12px] font-semibold text-[#1f2a44] shadow-sm transition hover:border-[#b9d0fb] hover:bg-[#f8fbff] hover:text-[#0f72f0]"
              >
                <Zap size={15} strokeWidth={1.9} />
                <span>Automations</span>
              </button>
            ) : null}

            <NotificationsMenu variant="icon" />

            {!isMobile ? (
            <TopIcon title="AI Sidekick" onClick={openAiSidekick}>
              <Sparkles size={19} strokeWidth={1.9} />
            </TopIcon>
            ) : null}

            <TopIcon title="Settings" to="/settings">
              <Settings size={19} strokeWidth={1.9} />
            </TopIcon>

            {!isMobile ? <div className="mx-3 h-7 w-px bg-[#d9e0ef]" /> : null}

            <div className="relative ml-1" ref={menuRef}>
              <button
                type="button"
                title="Profile menu"
                onClick={() => setShowProfileMenu((current) => !current)}
                className="transition hover:opacity-90"
              >
                <UserAvatar user={user} size="md" />
              </button>

              {showProfileMenu ? (
                <div className="absolute right-0 top-[calc(100%+10px)] w-[220px] overflow-hidden rounded-[18px] border border-[#dbe3f2] bg-white shadow-[0_18px_46px_rgba(15,23,42,0.16)]">
                  <div className="border-b border-[#eef2fb] px-4 py-3">
                    <p className="truncate text-[13px] font-semibold text-[#1f2a44]">{user?.name || 'User'}</p>
                    <p className="truncate text-[11px] text-[#7a84a4]">{workspace?.name || 'Workspace'}</p>
                  </div>

                  <div className="p-2">
                    {menuItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setShowProfileMenu(false)}
                        className={({ isActive }) =>
                          `flex items-center rounded-[12px] px-3 py-2 text-[13px] font-medium transition ${
                            isActive
                              ? 'bg-[#eef4ff] text-[#0f72f0]'
                              : 'text-[#1f2a44] hover:bg-[#f6f8fc]'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>

                  <div className="border-t border-[#eef2fb] p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="flex w-full items-center rounded-[12px] px-3 py-2 text-left text-[13px] font-medium text-[#c23d52] transition hover:bg-[#fff5f7]"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>
      <InviteBoardModal open={showInvite} onClose={() => setShowInvite(false)} />
    </>
  );
}
