import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getPlans, getBillingStatus, createCheckout, openPortal, getWorkspaceUsage } from '../../api/billing.api';
import { useAuth } from '../../hooks/useAuth';
import { UsageSummary } from '../../components/BillingComponents/UsageSummary';
import Spinner from '../../components/Dashboard Components/ui/Spinner';

function BillingNotice({ kind = 'info', children }) {
  const styles = {
    success: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]',
    warning: 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]',
    info: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[kind] || styles.info}`}>
      {children}
    </div>
  );
}

function PlanCard({ plan, currentTier, onUpgrade, isOwner, loading, onManage, index, hasStripeCustomer }) {
  const isCurrent = plan.id === currentTier;
  const isFree = plan.id === 'free';
  const canManageCurrentPlan = isCurrent && !isFree && hasStripeCustomer;
  const canUpgrade = !isCurrent && !isFree && isOwner;
  const buttonLabel = canManageCurrentPlan
    ? (loading ? 'Opening...' : 'Manage Plan')
    : canUpgrade
      ? (loading ? 'Redirecting...' : `Upgrade to ${plan.name}`)
      : isCurrent
        ? 'Current Plan'
        : !isOwner
          ? 'Owner only'
          : 'Unavailable';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`relative rounded-2xl border p-5 shadow-card transition-shadow hover:shadow-elevated sm:p-6 lg:p-7 ${
        isCurrent
          ? 'border-primary bg-card shadow-elevated'
          : 'border-border bg-card'
      }`}
    >
      {isCurrent ? (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full gradient-cta px-4 py-1 text-xs font-bold text-primary-foreground">
          Current Plan
        </span>
      ) : null}

      <h3 className="text-base font-bold text-foreground sm:text-lg">{plan.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
        {isCurrent ? 'Your active workspace plan' : 'Upgrade when you need more power'}
      </p>
      
      <div className="mb-6 mt-5">
        <span className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          {isFree ? 'Free' : `$${plan.price}`}
        </span>
        {plan.price > 0 && <span className="text-xs text-muted-foreground sm:text-sm"> /month</span>}
      </div>

      <button
        onClick={() => {
          if (canManageCurrentPlan) {
            onManage();
            return;
          }
          if (canUpgrade) {
            onUpgrade(plan.priceId);
          }
        }}
        disabled={loading || (!canManageCurrentPlan && !canUpgrade)}
        className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-full py-3 text-center text-xs font-semibold transition-all sm:text-sm disabled:opacity-60 ${
          canManageCurrentPlan
            ? 'border border-border bg-background text-foreground hover:bg-muted'
            : canUpgrade
              ? 'gradient-cta text-primary-foreground shadow-soft hover:shadow-elevated'
              : 'border border-border bg-background text-foreground'
        }`}
      >
        {buttonLabel}
      </button>

      <ul className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <Check size={14} strokeWidth={3} className="shrink-0 text-brand-green" />
            <span className="leading-snug">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function Billing() {
  const { canManageBilling } = useAuth();
  const isOwner = canManageBilling;
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkoutState, setCheckoutState] = useState('idle');
  const successFlag = searchParams.get('success') === 'true';
  const cancelledFlag = searchParams.get('cancelled') === 'true';
  const expectedTier = searchParams.get('tier');

  const { data: plans = [], isLoading: lp } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => getPlans().then((r) => r.data.data.plans),
  });

  const { data: status, isLoading: ls } = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => getBillingStatus().then((r) => r.data.data),
    refetchInterval:
      successFlag && expectedTier && checkoutState !== 'synced'
        ? 2500
        : false,
  });

  const { data: usage = {}, isLoading: lu } = useQuery({
    queryKey: ['workspace-usage'],
    queryFn: () => getWorkspaceUsage().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!successFlag || !expectedTier) return undefined;

    if (status?.tier === expectedTier) {
      setCheckoutState('synced');
      const timeout = window.setTimeout(() => {
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          next.delete('success');
          next.delete('cancelled');
          next.delete('tier');
          return next;
        }, { replace: true });
      }, 4000);
      return () => window.clearTimeout(timeout);
    }

    setCheckoutState('verifying');
    return undefined;
  }, [expectedTier, setSearchParams, status?.tier, successFlag]);

  useEffect(() => {
    if (!successFlag || !expectedTier || checkoutState !== 'synced') return;
    queryClient.invalidateQueries({ queryKey: ['billing-status'] });
    queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
  }, [checkoutState, expectedTier, queryClient, successFlag]);

  const activePlanName = useMemo(() => status?.plan?.name || 'Free', [status?.plan?.name]);

  const { mutate: upgrade, isPending: upgrading } = useMutation({
    mutationFn: createCheckout,
    onSuccess: (res) => {
      window.location.href = res.data.data.url;
    },
  });

  const { mutate: manage, isPending: managing } = useMutation({
    mutationFn: openPortal,
    onSuccess: (res) => {
      window.location.href = res.data.data.url;
    },
  });

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <section className="py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container px-3 sm:px-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto mb-6 max-w-2xl text-center sm:mb-10 md:mb-12"
            >
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl md:text-4xl">
                Workspace <span className="gradient-text">billing</span>
              </h1>
              <p className="mt-3 text-xs text-muted-foreground sm:mt-4 sm:text-sm md:text-base">
                Review your plan, compare options, and manage billing in one place.
              </p>
            </motion.div>

            <div className="mx-auto mb-6 max-w-3xl space-y-3">
              {successFlag ? (
                <BillingNotice kind={checkoutState === 'synced' ? 'success' : 'info'}>
                  {checkoutState === 'synced'
                    ? `Your workspace is now on ${activePlanName}.`
                    : `Payment completed. We are confirming your ${expectedTier || 'new'} plan now.`}
                </BillingNotice>
              ) : null}
              {cancelledFlag ? (
                <BillingNotice kind="warning">
                  Checkout was cancelled. Your workspace is still on {activePlanName}.
                </BillingNotice>
              ) : null}
            </div>

            {/* Plans Grid */}
            {lp || ls ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="mx-auto grid max-w-5xl gap-3 sm:gap-4 md:grid-cols-3 md:gap-6">
                {plans.map((plan, i) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    currentTier={status?.tier}
                    onUpgrade={upgrade}
                    isOwner={isOwner}
                    loading={upgrading || managing}
                    onManage={manage}
                    index={i}
                    hasStripeCustomer={Boolean(status?.hasStripe)}
                  />
                ))}
              </div>
            )}

            {/* Usage Summary */}
            {lu ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="mx-auto mt-12 max-w-3xl">
                <UsageSummary 
                  usage={usage}
                  tier={status?.tier || 'free'}
                />
              </div>
            )}

            {!isOwner && (
              <p className="mt-8 text-center text-xs text-muted-foreground sm:text-sm">
                Only the workspace owner can manage billing.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
