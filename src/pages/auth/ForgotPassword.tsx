import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Select } from '../../components/ui/Select';

const securityQuestions = [
  { value: '', label: 'Sélectionner une question...' },
  { value: 'pet', label: 'Quel était le nom de votre premier animal de compagnie ?' },
  { value: 'city', label: 'Dans quelle ville êtes-vous né(e) ?' },
  { value: 'school', label: 'Quel était le nom de votre école primaire ?' },
  { value: 'mother', label: 'Quel est le nom de jeune fille de votre mère ?' },
  { value: 'friend', label: 'Quel était le nom de votre meilleur ami d\'enfance ?' },
  { value: 'street', label: 'Dans quelle rue avez-vous grandi ?' },
  { value: 'teacher', label: 'Quel était le nom de votre premier professeur ?' },
  { value: 'book', label: 'Quel est votre livre préféré ?' }
];

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'questions' | 'newPassword' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [userQuestions, setUserQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState(['', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);

  React.useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI?.isMaximized) {
        const maximized = await window.electronAPI.isMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
  }, []);

  const handleMaximize = async () => {
    if (window.electronAPI?.maximize && window.electronAPI?.unmaximize) {
      if (isMaximized) {
        await window.electronAPI.unmaximize();
        setIsMaximized(false);
      } else {
        await window.electronAPI.maximize();
        setIsMaximized(true);
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simuler la recherche de l'utilisateur
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === email);
      
      if (!user) {
        setError('Aucun compte trouvé avec cette adresse email.');
        setIsLoading(false);
        return;
      }

      if (!user.securityQuestions || user.securityQuestions.length < 2) {
        setError('Ce compte n\'a pas de questions de sécurité configurées. Contactez l\'administrateur.');
        setIsLoading(false);
        return;
      }

      setUserQuestions(user.securityQuestions);
      setStep('questions');
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Vérifier les réponses
      const isValid = userQuestions.every((q: any, index: number) => 
        q.answer.toLowerCase().trim() === answers[index].toLowerCase().trim()
      );

      if (!isValid) {
        setError('Les réponses ne correspondent pas. Veuillez réessayer.');
        setIsLoading(false);
        return;
      }

      setStep('newPassword');
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsLoading(true);

    try {
      // Mettre à jour le mot de passe
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map((u: any) => 
        u.email === email ? { ...u, password: newPassword } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      setStep('success');
    } catch (err) {
      setError('Une erreur est survenue lors de la mise à jour du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'email':
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#0011ef] to-blue-600 rounded-2xl mb-4 shadow-lg">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe oublié</h2>
              <p className="text-gray-600">Saisissez votre adresse email pour commencer la récupération</p>
            </div>

            <Input
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@cfp.com"
              className="bg-white border-gray-300"
              required
            />

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-4 rounded-xl border border-red-200 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-4 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Recherche...
                </div>
              ) : (
                'Continuer'
              )}
            </Button>
          </form>
        );

      case 'questions':
        return (
          <form onSubmit={handleQuestionsSubmit} className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff05f2] to-purple-600 rounded-2xl mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Questions de sécurité</h2>
              <p className="text-gray-600">Répondez à vos questions de sécurité pour vérifier votre identité</p>
            </div>

            {userQuestions.map((question: any, index: number) => (
              <div key={index} className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-6 rounded-2xl border border-white/30">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Question {index + 1}: {securityQuestions.find(q => q.value === question.question)?.label}
                </label>
                <Input
                  value={answers[index]}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[index] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  placeholder="Votre réponse..."
                  className="bg-white border-gray-300"
                  required
                />
              </div>
            ))}

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-4 rounded-xl border border-red-200 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-4 text-lg font-semibold"
              disabled={isLoading || answers.some(a => !a.trim())}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Vérification...
                </div>
              ) : (
                'Vérifier les réponses'
              )}
            </Button>
          </form>
        );

      case 'newPassword':
        return (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Nouveau mot de passe</h2>
              <p className="text-gray-600">Choisissez un nouveau mot de passe sécurisé</p>
            </div>

            <PasswordInput
              label="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white border-gray-300"
              required
            />

            <PasswordInput
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white border-gray-300"
              required
            />

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-4 rounded-xl border border-red-200 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Mise à jour...
                </div>
              ) : (
                'Mettre à jour le mot de passe'
              )}
            </Button>
          </form>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6 shadow-2xl">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Mot de passe mis à jour !</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Se connecter
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Barre de titre personnalisée pour Electron */}
      <div className="fixed top-0 left-0 right-0 h-8 bg-gradient-to-r from-[#0011ef] to-blue-600 z-50 drag-region flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white/20 rounded-full"></div>
          <span className="text-white text-sm font-semibold">CFP Manager - Récupération</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => window.electronAPI?.minimize?.()}
            className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded flex items-center justify-center text-white text-xs transition-colors"
            title="Réduire"
          >
            −
          </button>
          <button 
            onClick={handleMaximize}
            className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded flex items-center justify-center text-white text-xs transition-colors"
            title={isMaximized ? "Restaurer" : "Agrandir"}
          >
            {isMaximized ? "⧉" : "□"}
          </button>
          <button 
            onClick={() => window.electronAPI?.close?.()}
            className="w-6 h-6 bg-red-500/80 hover:bg-red-600 rounded flex items-center justify-center text-white text-xs transition-colors"
            title="Fermer"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pt-8">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10 pt-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30">
          {renderStepContent()}

          <div className="mt-8 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-[#0011ef] hover:text-blue-700 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la connexion
            </Link>
          </div>
        </div>

        {/* Footer inspiration */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm italic">
            "La sécurité de vos données est notre priorité"
          </p>
        </div>
      </div>
    </div>
  );
};