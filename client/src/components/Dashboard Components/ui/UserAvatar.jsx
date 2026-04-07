/**
 * UserAvatar Component
 * Displays user profile picture if available, or uses sidebar-aligned color with relevant text
 */
export default function UserAvatar({ user, size = 'md', className = '' }) {
  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Sidebar-aligned color with more intensity for better visibility
  const sidebarBg = '#9cbcf0';  // More intense blue, still matches sidebar theme
  const sidebarText = '#1f3a7d';  // Darker text for better contrast

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  }[size] || 'h-8 w-8 text-sm';

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold ring-1 ring-[#dbe4f6] ${sizeClasses} ${className}`}
      style={{
        backgroundColor: sidebarBg,
        color: sidebarText,
      }}
      title={user?.name || 'User'}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}
