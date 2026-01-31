import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  name?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  name,
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-3 border border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0011ef] focus:border-transparent transition-all duration-300 bg-white hover:shadow-xl focus:shadow-2xl ${error ? 'border-red-500' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        name={name}
        disabled={disabled}
        autoComplete="off"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};