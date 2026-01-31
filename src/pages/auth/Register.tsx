import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Heart, Star, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmailInput } from '../../components/ui/EmailInput';
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

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    function: '',
    center: '',
    securityQuestion1: '',
    securityAnswer1: '',
    securityQuestion2: '',
    securityAnswer2: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!formData.function) {
      setError('Veuillez sélectionner votre fonction');
      return;
    }

    if (!formData.center) {
      setError('Veuillez sélectionner votre centre');
      return;
    }

    if (!formData.securityQuestion1 || !formData.securityAnswer1 || !formData.securityQuestion2 || !formData.securityAnswer2) {
      setError('Veuillez configurer vos deux questions de sécurité');
      return;
    }

    if (formData.securityQuestion1 === formData.securityQuestion2) {
      setError('Veuillez choisir deux questions de sécurité différentes');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📝 Register: Tentative d\'inscription avec les données:', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        function: formData.function,
        center: formData.center
      });
      
      // Créer les données supplémentaires à inclure
      const additionalData = {
        function: formData.function,
        center: formData.center,
        securityQuestions: [
          { question: formData.securityQuestion1, answer: formData.securityAnswer1 },
          { question: formData.securityQuestion2, answer: formData.securityAnswer2 }
        ]
      };
      
      // Appeler la fonction register améliorée
      const success = await register(
        formData.email, 
        formData.password, 
        formData.firstName, 
        formData.lastName,
        additionalData
      );
      
      if (success) {
        console.log('🎉 Register: Inscription réussie, redirection vers le dashboard');
        // L'utilisateur est déjà connecté automatiquement par le AuthProvider
        navigate('/dashboard');
      } else {
        console.error('❌ Register: Échec de l\'inscription');
        setError('Impossible de créer le compte. Vérifiez que l\'email n\'est pas déjà utilisé.');
      }
    } catch (err) {
      console.error('❌ Register: Erreur durant l\'inscription:', err);
      setError('Une erreur est survenue lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Barre de titre personnalisée pour Electron */}
      <div className="fixed top-0 left-0 right-0 h-8 bg-gradient-to-r from-[#0011ef] to-blue-600 z-50 drag-region flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white/20 rounded-full"></div>
          <span className="text-white text-sm font-semibold">CFP Manager - Inscription</span>
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
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-lg w-full relative z-10 pt-8">
        {/* Inspirational header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-6 shadow-2xl">
            <Star className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Rejoignez-nous</h1>
          <p className="text-purple-200 text-lg font-medium mb-2">Centre de Formation Catholique</p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-white/90 text-base italic leading-relaxed mb-2">
              "Chaque membre de notre équipe est un don de Dieu"
            </p>
            <p className="text-purple-200 text-sm font-medium">
              Ensemble, bâtissons l'avenir de la formation chrétienne
            </p>
          </div>
        </div>

        {/* Registration form */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff05f2] to-purple-600 rounded-2xl mb-4 shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Créer votre compte</h2>
            <p className="text-gray-600">Rejoignez notre communauté éducative</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="bg-white border-gray-300"
                required
              />
              <Input
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="bg-white border-gray-300"
                required
              />
            </div>

            <EmailInput
              label="Adresse email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre.email@exemple.com"
              className="bg-white"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Briefcase className="absolute left-3 top-9 h-4 w-4 text-gray-400 z-10" />
                <Input
                  label="Votre fonction"
                  name="function"
                  value={formData.function}
                  onChange={handleChange}
                  placeholder="Ex: Directeur, Formateur, Coordinateur..."
                  className="pl-10 bg-white border-gray-300"
                  required
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-9 h-4 w-4 text-gray-400 z-10" />
                <Input
                  label="Votre centre"
                  name="center"
                  value={formData.center}
                  onChange={handleChange}
                  placeholder="Ex: Centre Paris, Siège Social..."
                  className="pl-10 bg-white border-gray-300"
                  required
                />
              </div>
            </div>

            {/* Questions de sécurité */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 space-y-4">
              <div className="flex items-center justify-center mb-4">
                <Heart className="w-5 h-5 text-purple-600 mr-2" />
                <p className="text-sm font-semibold text-purple-800">Questions de sécurité</p>
              </div>
              <p className="text-xs text-purple-700 text-center mb-4">
                Configurez deux questions de sécurité pour pouvoir récupérer votre mot de passe
              </p>
              
              <div className="space-y-4">
                <div>
                  <Select
                    label="Question de sécurité 1"
                    name="securityQuestion1"
                    value={formData.securityQuestion1}
                    onChange={handleChange}
                    options={securityQuestions}
                    className="bg-white border-gray-300"
                    required
                  />
                  <Input
                    label="Réponse 1"
                    name="securityAnswer1"
                    value={formData.securityAnswer1}
                    onChange={handleChange}
                    placeholder="Votre réponse..."
                    className="bg-white border-gray-300 mt-2"
                    required
                  />
                </div>
                
                <div>
                  <Select
                    label="Question de sécurité 2"
                    name="securityQuestion2"
                    value={formData.securityQuestion2}
                    onChange={handleChange}
                    options={securityQuestions.filter(q => q.value !== formData.securityQuestion1)}
                    className="bg-white border-gray-300"
                    required
                  />
                  <Input
                    label="Réponse 2"
                    name="securityAnswer2"
                    value={formData.securityAnswer2}
                    onChange={handleChange}
                    placeholder="Votre réponse..."
                    className="bg-white border-gray-300 mt-2"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PasswordInput
                label="Mot de passe"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="bg-white border-gray-300"
                required
              />

              <PasswordInput
                label="Confirmer le mot de passe"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="bg-white border-gray-300"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-4 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            {/* Inspirational message */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-200">
              <div className="flex items-center justify-center mb-2">
                <Heart className="w-4 h-4 text-purple-600 mr-2" />
                <p className="text-sm font-semibold text-purple-800">Engagement de service</p>
              </div>
              <p className="text-xs text-purple-700 text-center italic">
                "En créant ce compte, je m'engage à servir notre mission éducative avec dévouement et bienveillance"
              </p>
            </div>

            <Button
              type="submit"
              className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-[#ff05f2] to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Création du compte...
                </div>
              ) : (
                'Créer mon compte'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Déjà membre de notre communauté ?{' '}
              <Link to="/login" className="text-[#0011ef] hover:text-blue-700 font-semibold transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Footer inspiration */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-6 text-white/70 mb-4">
            <div className="flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              <span className="text-sm">Bienveillance</span>
            </div>
            <div className="flex items-center">
              <Star className="w-5 h-5 mr-2" />
              <span className="text-sm">Excellence</span>
            </div>
            <div className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              <span className="text-sm">Communauté</span>
            </div>
          </div>
          <p className="text-white/60 text-sm italic">
            "Ensemble, cultivons les talents au service de l'Évangile"
          </p>
        </div>
      </div>
    </div>
  );
};