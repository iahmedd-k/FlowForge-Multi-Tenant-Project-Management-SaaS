function AssignedGlyph({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="8.2" r="4" fill="currentColor" />
      <path d="M5.2 19.2a6.8 6.8 0 0 1 13.6 0" fill="currentColor" />
    </svg>
  );
}

function UnassignedGlyph({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="8.5" r="3.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.6 18a5.7 5.7 0 0 1 10.8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function AssigneeIcon({ assigned = false, size = 'md', className = '', title }) {
  const sizeClass = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }[size] || 'h-8 w-8';

  const iconClass = {
    sm: 'h-[15px] w-[15px]',
    md: 'h-[17px] w-[17px]',
    lg: 'h-[18px] w-[18px]',
  }[size] || 'h-[17px] w-[17px]';

  // Dashboard color palette for avatars
  const avatarColors = [
    { bg: '#e8f4ff', fg: '#0060c0' },
    { bg: '#fff3e0', fg: '#c06000' },
    { bg: '#f0fff8', fg: '#005c38' },
    { bg: '#fff0f3', fg: '#a0002b' },
    { bg: '#f3f0ff', fg: '#4e00b0' },
    { bg: '#e0f8ff', fg: '#005b80' },
  ];

  // Use a consistent color based on assigned status
  const colorIndex = assigned ? 0 : 1;
  const color = avatarColors[colorIndex];

  return (
    <span
      title={title}
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full ${className}`}
      style={{
        backgroundColor: color.bg,
        color: color.fg,
      }}
    >
      {assigned ? <AssignedGlyph className={iconClass} /> : <UnassignedGlyph className={iconClass} />}
    </span>
  );
}
