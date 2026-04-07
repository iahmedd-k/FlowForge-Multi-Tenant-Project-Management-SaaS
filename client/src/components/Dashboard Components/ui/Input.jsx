import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, className = '', type = 'text', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        ref={ref}
        type={type}
        className={`input-base ${error ? 'border-red-300 focus:ring-red-200' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
});

export default Input;
