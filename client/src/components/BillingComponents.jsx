import { AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BillingLimitAlert({ type = 'projects', tier = 'free', onUpgrade }) {
  const navigate = useNavigate();

  const alertConfig = {
    projects: {
      title: 'Project Limit Reached',
      message: `You've reached the maximum projects for the ${tier} plan.`,
      icon: AlertCircle,
      color: 'border-orange-200 bg-orange-50',
      textColor: 'text-orange-900',
    },
    teamMembers: {
      title: 'Team Member Limit Reached',
      message: `You've reached the maximum team members for the ${tier} plan.`,
      icon: AlertCircle,
      color: 'border-red-200 bg-red-50',
      textColor: 'text-red-900',
    },
  };

  const config = alertConfig[type] || alertConfig.projects;
  const Icon = config.icon;

  return (
    <div className={`rounded-[10px] border border-l-4 ${config.color} p-4 mb-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 ${config.textColor}`} />
        <div className="flex-1">
          <p className={`font-semibold text-[13px] ${config.textColor}`}>{config.title}</p>
          <p className={`text-[12px] mt-1 ${config.textColor} opacity-90`}>{config.message}</p>
          <button
            onClick={() => {
              if (onUpgrade) {
                onUpgrade();
              } else {
                navigate('/billing');
              }
            }}
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Upgrade Plan <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function BillingQuotaWarning({ quota, resourceName = 'Team Members' }) {
  if (!quota) return null;
  
  const percentage = quota.percentage;
  const isWarning = percentage >= 75;
  const isCritical = percentage >= 95;

  if (percentage < 75) return null;

  const bgColor = isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
  const textColor = isCritical ? 'text-red-900' : 'text-amber-900';

  return (
    <div className={`rounded-[10px] border ${bgColor} p-3 mb-4`}>
      <div className="flex items-start gap-2">
        <TrendingUp className={`h-4 w-4 mt-0.5 ${textColor}`} />
        <div className="flex-1">
          <p className={`text-[12px] font-semibold ${textColor}`}>
            {resourceName} Quota {percentage}% Full
          </p>
          <p className={`text-[11px] mt-1 ${textColor} opacity-90`}>
            You're using {quota.used} of {quota.limit} {resourceName.toLowerCase()}
          </p>
        </div>
      </div>
    </div>
  );
}

export function BillingUpgradePrompt({ tier = 'free', onUpgradeClick }) {
  const tierFeatures = {
    free: 'Upgrade to Pro to unlock unlimited projects and 20 team members.',
    pro: 'Upgrade to Business for unlimited team members and priority support.',
  };

  return (
    <div className="rounded-[10px] border border-blue-200 bg-blue-50 p-4 text-center">
      <p className="text-[13px] font-semibold text-blue-900 mb-3">
        {tierFeatures[tier] || 'Upgrade your plan to get started.'}
      </p>
      <button
        onClick={onUpgradeClick}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[12px] font-semibold rounded-[8px] hover:shadow-lg transition"
      >
        View Plans
      </button>
    </div>
  );
}
