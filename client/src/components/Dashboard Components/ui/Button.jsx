import Spinner from './Spinner';

export default function Button({
  children, loading, variant = 'primary', className = '', ...props
}) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-ghost';
  return (
    <button className={`${base} ${className}`} disabled={loading} {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}