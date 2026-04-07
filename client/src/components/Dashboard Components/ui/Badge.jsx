const variants = {
  active:      'bg-green-100  text-green-700',
  on_hold:     'bg-amber-100  text-amber-700',
  completed:   'bg-blue-100   text-blue-700',
  archived:    'bg-gray-100   text-gray-500',
  backlog:     'bg-gray-100   text-gray-600',
  in_progress: 'bg-blue-100   text-blue-700',
  review:      'bg-purple-100 text-purple-700',
  done:        'bg-green-100  text-green-700',
  low:         'bg-gray-100   text-gray-600',
  medium:      'bg-amber-100  text-amber-700',
  high:        'bg-orange-100 text-orange-700',
  urgent:      'bg-red-100    text-red-700',
};

export default function Badge({ label, value }) {
  const key = (value || label || '').toLowerCase().replace(' ', '_');
  const cls = variants[key] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5
                      rounded-full capitalize ${cls}`}>
      {(label || value || '').replace('_', ' ')}
    </span>
  );
}