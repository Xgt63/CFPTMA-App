import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-semibold 
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-4 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    relative overflow-hidden group
    ${fullWidth ? 'w-full' : ''}
  `;
  
  const variants = {
    primary: `
      bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 
      hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 
      text-white focus:ring-blue-500/50 
      shadow-lg hover:shadow-xl
      transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]
      rounded-xl
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity
    `,
    secondary: `
      bg-white border-2 border-gray-300 
      hover:border-gray-400 hover:bg-gray-50 
      text-gray-700 focus:ring-gray-500/50 
      shadow-sm hover:shadow-md
      transform hover:-translate-y-0.5 active:scale-[0.98]
      rounded-xl
    `,
    outline: `
      bg-transparent border-2 border-blue-600 
      hover:bg-blue-600 hover:border-blue-700 
      text-blue-600 hover:text-white focus:ring-blue-500/50 
      shadow-sm hover:shadow-md
      transform hover:-translate-y-0.5 active:scale-[0.98]
      rounded-xl transition-all duration-300
    `,
    success: `
      bg-gradient-to-r from-green-600 via-green-700 to-green-800 
      hover:from-green-700 hover:via-green-800 hover:to-green-900 
      text-white focus:ring-green-500/50 
      shadow-lg hover:shadow-xl
      transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]
      rounded-xl
    `,
    warning: `
      bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 
      hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 
      text-white focus:ring-orange-500/50 
      shadow-lg hover:shadow-xl
      transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]
      rounded-xl
    `,
    danger: `
      bg-gradient-to-r from-red-600 via-red-700 to-red-800 
      hover:from-red-700 hover:via-red-800 hover:to-red-900 
      text-white focus:ring-red-500/50 
      shadow-lg hover:shadow-xl
      transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]
      rounded-xl
    `,
    ghost: `
      bg-transparent hover:bg-gray-100 
      text-gray-700 focus:ring-gray-500/50 
      hover:shadow-sm
      transform hover:-translate-y-0.5 active:scale-[0.98]
      rounded-xl
    `
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs min-h-[28px]',
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[40px]',
    lg: 'px-6 py-3 text-base min-h-[44px]',
    xl: 'px-8 py-4 text-lg min-h-[52px]'
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          <span className="ml-2">Chargement...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="mr-2">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="ml-2">{icon}</span>
          )}
        </>
      )}
    </button>
  );
};
