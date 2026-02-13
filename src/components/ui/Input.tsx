import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export type { InputProps };

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm text-dark-300">
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`
            h-14 w-full rounded-xl border-2 bg-dark-800 px-4
            text-white placeholder:text-dark-400
            transition-colors
            focus:border-primary-400
            ${error ? 'border-red-500' : 'border-dark-700'}
            ${className}
          `}
          {...rest}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
