import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  autoComplete?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  className = '',
  disabled = false,
  autoComplete = 'off',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          className={`w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0011ef] focus:border-transparent transition-all duration-300 bg-white hover:shadow-xl focus:shadow-2xl ${error ? 'border-red-500' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
          disabled={disabled}
          autoComplete={autoComplete}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          data-form-type="password"
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0011ef] focus:ring-opacity-50 transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5 text-gray-500" />
          ) : (
            <Eye className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};