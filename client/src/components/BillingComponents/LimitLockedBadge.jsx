import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Shows locked state when limit is reached
 * Includes upgrade link to billing page
 */
export function LimitLockedBadge({ 
  isLocked, 
  resourceType = 'feature',
  message = null,
  tier = 'free'
}) {
  if (!isLocked) return null;

  const defaultMessages = {
    teamMembers: `Limited to 5 team members on ${tier} plan`,
    projects: `Limited to 3 projects on ${tier} plan`,
    workspaces: `Limited to 1 workspace on ${tier} plan`,
  };

  const displayMessage = message || defaultMessages[resourceType] || `${resourceType} limit reached`;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-2.5">
        <Lock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-amber-900">{displayMessage}</p>
          <Link
            to="/billing"
            className="text-xs text-amber-700 hover:text-amber-900 font-semibold inline-flex items-center gap-1 mt-1"
          >
            Upgrade plan →
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Locked button state - replaces normal button when limit reached
 */
export function LockedButton({ 
  resourceType = 'feature',
  tier = 'free',
  message = null 
}) {
  const defaultMessages = {
    teamMembers: `Team member limit reached (${tier} plan)`,
    projects: `Project limit reached (${tier} plan)`,
    workspaces: `Workspace limit reached (${tier} plan)`,
  };

  const buttonMessage = message || defaultMessages[resourceType] || 'Limit reached';

  return (
    <Link
      to="/billing"
      title={buttonMessage}
      className="inline-flex gap-2 items-center px-4 py-2 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition text-sm font-semibold disabled:opacity-50"
    >
      <Lock size={16} />
      Upgrade
    </Link>
  );
}

/**
 * Mini lock indicator for list items
 */
export function LockIndicator({ isLocked = false }) {
  if (!isLocked) return null;
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-semibold">
      <Lock size={12} />
      Limit reached
    </div>
  );
}
