import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'glass' | 'gradient' | 'minimal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  loading?: boolean;
}

const sizeClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10'
};

const variantClasses = {
  default: 'bg-white border border-gray-200 shadow-sm hover:shadow-md',
  elevated: 'bg-white border border-gray-100 shadow-lg hover:shadow-xl',
  glass: 'bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/90',
  gradient: 'bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border border-blue-200/50 shadow-xl hover:shadow-2xl',
  minimal: 'bg-gray-50/50 border-0 hover:bg-gray-50'
};

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title,
  subtitle,
  variant = 'default',
  size = 'md',
  interactive = false,
  loading = false
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-300';
  const interactiveClasses = interactive ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : '';
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  
  if (loading) {
    return (
      <div className={`${baseClasses} ${variantClass} ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${baseClasses} ${variantClass} ${interactiveClasses} ${className}`}>
      {(title || subtitle) && (
        <div className={`border-b border-gray-100 mb-6 pb-6 ${
          variant === 'gradient' ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50 -m-6 mb-0 p-6 rounded-t-2xl' : ''
        }`}>
          {title && (
            <h3 className={`font-bold tracking-tight ${
              variant === 'gradient' 
                ? 'text-2xl bg-gradient-to-r from-blue-700 via-purple-600 to-blue-800 bg-clip-text text-transparent' 
                : 'text-xl text-gray-900'
            }`}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-gray-600 text-sm mt-1">{subtitle}</p>
          )}
        </div>
      )}
      <div className={sizeClass}>
        {children}
      </div>
    </div>
  );
};
