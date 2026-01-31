import React, { useState, useEffect } from 'react';
import { Mail, Check, X } from 'lucide-react';

interface EmailInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  name?: string;
}

// Validation d'email flexible qui accepte tous les domaines
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const EmailInput: React.FC<EmailInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "votre.email@exemple.com",
  required = false,
  className = "",
  name = "email"
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (value.trim() === '') {
      setIsValid(null);
      setShowValidation(false);
    } else {
      const valid = isValidEmail(value);
      setIsValid(valid);
      setShowValidation(true);
    }
  }, [value]);

  const getValidationIcon = () => {
    if (!showValidation) return <Mail className="w-4 h-4 text-gray-400" />;
    if (isValid) return <Check className="w-4 h-4 text-green-500" />;
    return <X className="w-4 h-4 text-red-500" />;
  };

  const getValidationStyles = () => {
    if (!showValidation) return "border-gray-300 focus:border-blue-500";
    if (isValid) return "border-green-300 focus:border-green-500";
    return "border-red-300 focus:border-red-500";
  };

  const getValidationMessage = () => {
    if (!showValidation || isValid) return null;
    return (
      <p className="mt-1 text-sm text-red-600">
        Veuillez entrer une adresse email valide (ex: nom@domaine.com)
      </p>
    );
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="email"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-3 pr-10 rounded-xl border transition-all duration-200
            ${getValidationStyles()}
            focus:outline-none focus:ring-2 focus:ring-blue-500/20
            ${className}
          `}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {getValidationIcon()}
        </div>
      </div>
      
      {getValidationMessage()}
      
      {/* Exemples d'emails valides pour aider l'utilisateur */}
      {showValidation && !isValid && value.includes('@') && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 font-medium mb-1">Exemples d'emails valides :</p>
          <div className="text-xs text-blue-600 space-y-1">
            <div>• nom@gmail.com</div>
            <div>• prenom.nom@outlook.fr</div>
            <div>• utilisateur@cfp.com</div>
            <div>• directeur@centre-formation.org</div>
          </div>
        </div>
      )}
      
      {/* Message de confirmation pour les emails valides */}
      {showValidation && isValid && (
        <p className="mt-1 text-sm text-green-600 flex items-center">
          <Check className="w-3 h-3 mr-1" />
          Email valide
        </p>
      )}
    </div>
  );
};

export default EmailInput;