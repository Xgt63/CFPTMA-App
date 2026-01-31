import React from 'react';

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
                index < currentStep
                  ? 'bg-[#0011ef] text-white'
                  : index === currentStep
                  ? 'bg-[#ff05f2] text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              index <= currentStep ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                index < currentStep ? 'bg-[#0011ef]' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};