import { Lock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Displays billing usage and limits with visual indicators
 */
export function UsageSummary({ usage, plan, tier }) {
  const usageItems = [
    {
      label: 'Team Members',
      current: usage.teamMembersUsed || 0,
      limit: plan?.limits?.teamMembers || 5,
      type: 'teamMembers',
    },
    {
      label: 'Projects',
      current: usage.projectsUsed || 0,
      limit: plan?.limits?.projects || 3,
      type: 'projects',
    },
    {
      label: 'Reports',
      current: 0,
      limit: plan?.limits?.reports || 1,
      type: 'reports',
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Resource Usage</h3>
      
      <div className="space-y-4">
        {usageItems.map((item) => {
          const isAtLimit = item.current >= item.limit;
          const percentage = item.limit > 0 ? Math.round((item.current / item.limit) * 100) : 0;
          const isUnlimited = item.limit === 999;

          return (
            <div key={item.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </label>
                {isUnlimited ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">
                    <CheckCircle2 size={14} />
                    Unlimited
                  </span>
                ) : isAtLimit ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">
                    <Lock size={14} />
                    At limit
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {item.current} / {item.limit}
                  </span>
                )}
              </div>

              {!isUnlimited && (
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      isAtLimit ? 'bg-red-500' : percentage > 75 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {usageItems.some(item => item.current >= item.limit) && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            You're at a limit. <Link to="/billing" className="font-semibold hover:underline">Upgrade your plan</Link> to increase your limits.
          </p>
        </div>
      )}
    </div>
  );
}
