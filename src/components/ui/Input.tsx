import React, { useState, useRef, useEffect } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'outlined' | 'filled' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  autoComplete?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  helperText,
  icon,
  iconPosition = 'left',
  variant = 'default',
  size = 'md',
  loading = false,
  clearable = false,
  onClear,
  className = '',
  disabled = false,
  autoComplete = 'off',
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    onChange?.(e);
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      setHasValue(false);
      onClear?.();
      // Trigger onChange with empty value
      const event = new Event('input', { bubbles: true });
      Object.defineProperty(event, 'target', {
        writable: false,
        value: inputRef.current
      });
      inputRef.current.dispatchEvent(event);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const variantClasses = {
    default: `
      border-2 border-gray-200 rounded-xl bg-white
      focus:border-blue-500 focus:ring-4 focus:ring-blue-100
      hover:border-gray-300
      transition-all duration-300
    `,
    outlined: `
      border-2 border-gray-300 rounded-lg bg-transparent
      focus:border-blue-600 focus:ring-2 focus:ring-blue-200
      hover:border-gray-400
      transition-all duration-200
    `,
    filled: `
      border-0 rounded-xl bg-gray-100
      focus:bg-white focus:ring-4 focus:ring-blue-100 focus:shadow-md
      hover:bg-gray-50
      transition-all duration-300
    `,
    minimal: `
      border-0 border-b-2 border-gray-200 rounded-none bg-transparent
      focus:border-blue-500 focus:ring-0
      hover:border-gray-300
      transition-all duration-200
    `
  };

  const getStateClasses = () => {
    if (error) {
      return 'border-red-500 focus:border-red-600 focus:ring-red-100';
    }
    if (success) {
      return 'border-green-500 focus:border-green-600 focus:ring-green-100';
    }
    return '';
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="space-y-2">
      {label && (
        <label 
          className={`block text-sm font-semibold transition-colors duration-200 ${
            error ? 'text-red-700' : success ? 'text-green-700' : isFocused ? 'text-blue-700' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className={`text-gray-400 ${isFocused ? 'text-blue-500' : ''} transition-colors duration-200`}>
              {icon}
            </div>
          </div>
        )}
        
        <input
          ref={inputRef}
          className={`
            w-full outline-none
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            ${getStateClasses()}
            ${icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${(icon && iconPosition === 'right') || loading || (clearable && hasValue) ? 'pr-10' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
            ${className}
          `}
          disabled={disabled || loading}
          autoComplete={autoComplete}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          data-form-type="other"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {/* Right side icons */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1">
          {loading && <LoadingSpinner />}
          
          {clearable && hasValue && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {icon && iconPosition === 'right' && !loading && !(clearable && hasValue) && (
            <div className={`text-gray-400 ${isFocused ? 'text-blue-500' : ''} transition-colors duration-200`}>
              {icon}
            </div>
          )}
          
          {success && !loading && !(clearable && hasValue) && (
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      
      {(error || helperText) && (
        <div className="flex items-start space-x-1">
          {error && (
            <>
              <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </>
          )}
          
          {!error && helperText && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
};
