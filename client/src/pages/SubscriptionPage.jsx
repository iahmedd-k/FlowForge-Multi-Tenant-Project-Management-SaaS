import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, X, AlertCircle, Zap, Users, FolderOpen, TrendingUp, Loader } from 'lucide-react';
import { getPlans, getBillingStatus, createCheckout, openPortal, getWorkspaceUsage } from '../api/billing.api';
import { useAuth } from '../hooks/useAuth';

const PLAN_DETAILS = {
  free: {
    name: 'Free',
    description: 'Perfect for getting started',
    price: '$0',
    billing: 'forever',
    color: 'from-slate-100 to-slate-200',
    features: [
      { name: '1 Workspace', included: true },
      { name: '5 Team Members', included: true },
      { name: '3 Projects', included: true },
      { name: 'Basic Reports', included: true },
      { name: 'Email Support', included: false },
      { name: 'Priority Support', included: false },
      { name: 'Custom Branding', included: false },
    ],
  },
  pro: {
    name: 'Pro',
    description: 'For growing teams',
    price: '$15',
    billing: '/month',
    color: 'from-blue-100 to-blue-200',
    features: [
      { name: '1 Workspace', included: true },
      { name: '20 Team Members', included: true },
      { name: 'Unlimited Projects', included: true },
      { name: 'Advanced Reports', included: true },
      { name: 'Email Support', included: true },
      { name: 'Priority Support', included: false },
      { name: 'Custom Branding', included: false },
    ],
  },
  business: {
    name: 'Business',
    description: 'For enterprises',
    price: '$39',
    billing: '/month',
    color: 'from-purple-100 to-purple-200',
    features: [
      { name: '1 Workspace', included: true },
      { name: 'Unlimited Team Members', included: true },
      { name: 'Unlimited Projects', included: true },
      { name: 'Advanced Reports', included: true },
      { name: 'Email Support', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Custom Branding', included: true },
    ],
  },
};

function UsageCard({ icon: Icon, label, current, limit }) {
  const percentage = Math.round((current / limit) * 100);
  const isWarning = percentage >= 75;
  const isCritical = percentage >= 95;

  return (
    <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-[#0073ea]" />
          <span className="text-[13px] font-semibold text-[#1f2a44]">{label}</span>
        </div>
        <span className={`text-[11px] font-bold ${
          isCritical ? 'text-[#dc2626]' :
          isWarning ? 'text-[#ea9200]' :
          'text-[#059669]'
        }`}>
          {percentage}%
        </span>
      </div>
      
      <div className="mb-2 h-2 w-full rounded-full bg-[#e5e7eb] overflow-hidden">
        <div
          className={`h-full transition-all ${
            isCritical ? 'bg-[#dc2626]' :
            isWarning ? 'bg-[#ea9200]' :
            'bg-[#059669]'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      <p className="text-[11px] text-[#6b7280]">
        {current} of {limit} used
        {isCritical && ' • Upgrade soon'}
      </p>
    </div>
  );
}

function PlanCard({ plan, planKey, isCurrentPlan, onUpgrade, isLoading }) {
  const isPremium = planKey !== 'free';
  
  return (
    <div className={`relative rounded-[16px] border-2 ${
      isCurrentPlan ? 'border-[#0073ea] bg-gradient-to-br from-[#f0f9ff] to-white' : 'border-[#e5e7eb] bg-white'
    } overflow-hidden transition hover:shadow-lg`}>
      {isCurrentPlan && (
        <div className="absolute top-0 right-0 bg-[#0073ea] text-white px-3 py-1 text-[10px] font-bold rounded-bl-[12px]">
          CURRENT PLAN
        </div>
      )}

      <div className={`bg-gradient-to-r ${PLAN_DETAILS[planKey].color} px-6 py-6`}>
        <h3 className="text-[20px] font-bold text-[#1f2a44]">{PLAN_DETAILS[planKey].name}</h3>
        <p className="text-[12px] text-[#6b7280] mt-1">{PLAN_DETAILS[planKey].description}</p>
      </div>

      <div className="px-6 py-4">
        <div className="mb-6">
          <p className="text-[28px] font-bold text-[#1f2a44]">
            {PLAN_DETAILS[planKey].price}
            <span className="text-[14px] text-[#6b7280] font-normal">{PLAN_DETAILS[planKey].billing}</span>
          </p>
        </div>

        <button
          onClick={() => onUpgrade(planKey)}
          disabled={isCurrentPlan || isLoading}
          className={`w-full py-2.5 rounded-[8px] text-[12px] font-semibold transition mb-6 ${
            isCurrentPlan
              ? 'bg-[#e5e7eb] text-[#6b7280] cursor-default'
              : isPremium
              ? 'bg-gradient-to-r from-[#0073ea] to-[#0060c0] text-white hover:shadow-lg'
              : 'border border-[#e5e7eb] text-[#1f2a44] hover:bg-[#f5f7fb]'
          }`}
        >
          {isCurrentPlan ? 'Current Plan' : isLoading ? 'Processing...' : 'Upgrade to ' + PLAN_DETAILS[planKey].name}
        </button>

        <div className="space-y-2">
          {PLAN_DETAILS[planKey].features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {feature.included ? (
                <Check className="h-4 w-4 text-[#059669] flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-[#d1d5db] flex-shrink-0" />
              )}
              <span className={`text-[12px] ${
                feature.included ? 'text-[#1f2a44]' : 'text-[#9ca3af] line-through'
              }`}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { workspace, isManager } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => getPlans().then(res => res.data.data),
  });

  const { data: billingStatus } = useQuery({
    queryKey: ['billing-status', workspace?._id],
    queryFn: () => getBillingStatus().then(res => res.data.data),
    staleTime: 30000,
  });

  const { data: usageData } = useQuery({
    queryKey: ['workspace-usage', workspace?._id],
    queryFn: () => getWorkspaceUsage().then(res => res.data.data),
    staleTime: 60000,
  });

  const { mutate: checkout, isPending: isCheckingOut } = useMutation({
    mutationFn: (priceId) => createCheckout(priceId),
    onSuccess: (res) => {
      window.location.href = res.data.data.url;
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Checkout failed');
    },
  });

  const { mutate: openBillingPortal, isPending: isOpeningPortal } = useMutation({
    mutationFn: () => openPortal(),
    onSuccess: (res) => {
      window.location.href = res.data.data.url;
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to open billing portal');
    },
  });

  if (!isManager) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8faff]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-[#dc2626] mx-auto mb-3" />
          <p className="text-[16px] font-semibold text-[#1f2a44]">Access Denied</p>
          <p className="text-[13px] text-[#6b7280] mt-1">Only workspace owners can manage billing</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-[#0073ea] text-white rounded-[8px] text-[12px] font-semibold hover:bg-[#0060c0]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faff] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] sm:text-[40px] font-bold text-[#1f2a44]">Billing & Plans</h1>
          <p className="text-[15px] text-[#6b7280] mt-2">Manage your workspace subscription and billing</p>
        </div>

        {/* Current Plan Banner */}
        {billingStatus && (
          <div className={`mb-8 rounded-[12px] border-l-4 p-4 ${
            billingStatus.tier === 'free'
              ? 'border-l-[#6b7280] bg-[#f5f7fb]'
              : billingStatus.tier === 'pro'
              ? 'border-l-[#0073ea] bg-[#f0f9ff]'
              : 'border-l-[#9333ea] bg-[#faf5ff]'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#6b7280]">Current Plan</p>
                <p className="text-[20px] font-bold text-[#1f2a44] mt-1">
                  {PLAN_DETAILS[billingStatus.tier]?.name || 'Free'}
                </p>
                <p className="text-[12px] text-[#6b7280] mt-2">
                  {billingStatus.tier === 'free'
                    ? 'Upgrade to unlock premium features and increase limits'
                    : 'You have access to all features on this plan'}
                </p>
              </div>
              {billingStatus.hasStripe && (
                <button
                  onClick={() => openBillingPortal()}
                  disabled={isOpeningPortal}
                  className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-[8px] text-[12px] font-semibold text-[#1f2a44] hover:bg-[#f5f7fb] transition disabled:opacity-50"
                >
                  {isOpeningPortal ? 'Loading...' : 'Manage Billing'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Usage Overview */}
        {usageData && billingStatus?.tier !== 'free' && (
          <div className="mb-8">
            <h2 className="text-[18px] font-bold text-[#1f2a44] mb-4">Usage Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <UsageCard
                icon={Users}
                label="Team Members"
                current={usageData.teamMembersUsed}
                limit={usageData.teamMembersLimit}
              />
              <UsageCard
                icon={FolderOpen}
                label="Projects"
                current={usageData.projectsUsed}
                limit={usageData.projectsLimit}
              />
              {billingStatus.tier === 'business' && (
                <UsageCard
                  icon={TrendingUp}
                  label="Reports"
                  current={usageData.reportsUsed}
                  limit={usageData.reportsLimit}
                />
              )}
            </div>
          </div>
        )}

        {/* Upgrade Warning */}
        {usageData && (
          <>
            {usageData.teamMembersUsed >= usageData.teamMembersLimit && (
              <div className="mb-6 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-semibold text-[#dc2626]">Team Member Limit Reached</p>
                  <p className="text-[11px] text-[#991b1b] mt-1">You've reached the maximum team members for your plan. Upgrade to add more members.</p>
                </div>
              </div>
            )}
            {usageData.projectsUsed >= usageData.projectsLimit && billingStatus?.tier === 'free' && (
              <div className="mb-6 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-semibold text-[#dc2626]">Project Limit Reached</p>
                  <p className="text-[11px] text-[#991b1b] mt-1">You've reached the maximum projects for the Free plan. Upgrade to create more.</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Plans Grid */}
        <div className="mb-8">
          <h2 className="text-[18px] font-bold text-[#1f2a44] mb-4">Choose Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plansData?.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                planKey={plan.id}
                isCurrentPlan={billingStatus?.tier === plan.id}
                isLoading={isCheckingOut && selectedPlan === plan.id}
                onUpgrade={(planKey) => {
                  const selectedPlanData = plansData.plans.find(p => p.id === planKey);
                  if (planKey === 'free') {
                    toast.info('You are already on a higher tier. Contact support to downgrade.');
                    return;
                  }
                  if (selectedPlanData?.priceId) {
                    setSelectedPlan(planKey);
                    checkout(selectedPlanData.priceId);
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-[18px] font-bold text-[#1f2a44] mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="peer group cursor-pointer">
              <summary className="select-none flex items-center justify-between py-2 text-[13px] font-semibold text-[#1f2a44]">
                Can I cancel my subscription anytime?
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="text-[12px] text-[#6b7280] mt-2">Yes, you can cancel your subscription anytime from the Manage Billing page. Your workspace will automatically downgrade to the Free plan.</p>
            </details>
            <details className="peer group cursor-pointer">
              <summary className="select-none flex items-center justify-between py-2 text-[13px] font-semibold text-[#1f2a44]">
                What happens if I exceed my plan limits?
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="text-[12px] text-[#6b7280] mt-2">If you exceed limits (team members or projects), you won't be able to create new items until you upgrade. We recommend monitoring the usage overview.</p>
            </details>
            <details className="peer group cursor-pointer">
              <summary className="select-none flex items-center justify-between py-2 text-[13px] font-semibold text-[#1f2a44]">
                Do you offer discounts for annual billing?
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="text-[12px] text-[#6b7280] mt-2">Contact our sales team at sales@flowforge.com to discuss annual billing options and custom pricing for enterprise customers.</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
