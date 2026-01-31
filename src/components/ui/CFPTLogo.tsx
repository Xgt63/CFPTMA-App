import React from 'react';

interface CFPTLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  color?: 'white' | 'primary' | 'dark';
}

const sizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6', 
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-24 h-24'
};

export const CFPTLogo: React.FC<CFPTLogoProps> = ({ 
  size = 'md', 
  className = '', 
  color = 'primary' 
}) => {
  const getColorClass = () => {
    switch (color) {
      case 'white':
        return 'text-white';
      case 'primary':
        return 'text-[#0011ef]';
      case 'dark':
        return 'text-gray-900';
      default:
        return 'text-[#0011ef]';
    }
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg 
        viewBox="0 0 251.47 266.18" 
        className={`w-full h-full ${getColorClass()}`}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M53.04,117.5h139.12l1.37,1.37c6.23,6.23,6.23,16.34,0,22.58h0s-55.68,0-55.68,0v89.24h-20.14v-89.69h-45.46l-1.08-.59c-8.87-4.89-15.41-13.14-18.15-22.9h0Z"/>
        <path d="M251.47,129.54c0,33.8-26.48,61.4-59.81,63.2-1.15.06-2.31.09-3.47.09h-21.1v-24.41h20.33c21.8,0,40.06-17.84,39.64-39.64-.4-21.12-17.65-38.11-38.86-38.11H55.43c0-13.48,10.93-24.41,24.41-24.41h108.34c1.58,0,3.14.06,4.69.17,32.76,2.4,58.59,29.74,58.59,63.11Z"/>
        <path d="M27.7,133.09c0,59.07,50.74,106.95,113.33,106.95,9.36,0,18.46-1.07,27.16-3.1v26.78c-8.79,1.61-17.87,2.46-27.16,2.46C63.14,266.18,0,206.6,0,133.09S63.14,0,141.03,0c9.29,0,18.37.85,27.16,2.46v26.78c-8.7-2.03-17.8-3.1-27.16-3.1-62.59,0-113.33,47.88-113.33,106.95Z"/>
      </svg>
    </div>
  );
};

// Version avec gradient pour les en-têtes
export const CFPTLogoGradient: React.FC<CFPTLogoProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg 
        viewBox="0 0 251.47 266.18" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cfpt-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#0011ef', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#4f46e5', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#ff05f2', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path fill="url(#cfpt-gradient)" d="M53.04,117.5h139.12l1.37,1.37c6.23,6.23,6.23,16.34,0,22.58h0s-55.68,0-55.68,0v89.24h-20.14v-89.69h-45.46l-1.08-.59c-8.87-4.89-15.41-13.14-18.15-22.9h0Z"/>
        <path fill="url(#cfpt-gradient)" d="M251.47,129.54c0,33.8-26.48,61.4-59.81,63.2-1.15.06-2.31.09-3.47.09h-21.1v-24.41h20.33c21.8,0,40.06-17.84,39.64-39.64-.4-21.12-17.65-38.11-38.86-38.11H55.43c0-13.48,10.93-24.41,24.41-24.41h108.34c1.58,0,3.14.06,4.69.17,32.76,2.4,58.59,29.74,58.59,63.11Z"/>
        <path fill="url(#cfpt-gradient)" d="M27.7,133.09c0,59.07,50.74,106.95,113.33,106.95,9.36,0,18.46-1.07,27.16-3.1v26.78c-8.79,1.61-17.87,2.46-27.16,2.46C63.14,266.18,0,206.6,0,133.09S63.14,0,141.03,0c9.29,0,18.37.85,27.16,2.46v26.78c-8.7-2.03-17.8-3.1-27.16-3.1-62.59,0-113.33,47.88-113.33,106.95Z"/>
      </svg>
    </div>
  );
};