import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Heart, Users, BookOpen, X, UserCircle2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { EmailInput } from '../../components/ui/EmailInput';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { CFPTLogoGradient } from '../../components/ui/CFPTLogo';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface SavedAccount {
  email: string;
  firstName: string;
  lastName: string;
  lastLogin?: string;
}

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SavedAccount | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<SavedAccount | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isMaximized, setIsMaximized] = React.useState(false);
  const { labels } = useAppConfig();

  // Charger les comptes sauvegardés
  useEffect(() => {
    const loadSavedAccounts = () => {
      try {
        const saved = localStorage.getItem('cfpt_saved_accounts');
        if (saved) {
          const accounts: SavedAccount[] = JSON.parse(saved);
          // Limiter à 5 comptes maximum
          setSavedAccounts(accounts.slice(0, 5));
          console.log('✅ Comptes chargés:', accounts.length);
        } else {
          // Migration automatique : si aucun compte sauvegardé, migrer depuis 'users'
          console.log('🔄 Migration automatique des comptes...');
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          if (users.length > 0) {
            const migratedAccounts: SavedAccount[] = users
              .filter((u: any) => u.email && u.firstName && u.lastName)
              .map((u: any) => ({
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                lastLogin: u.createdAt
              }))
              .slice(0, 5);
            
            if (migratedAccounts.length > 0) {
              localStorage.setItem('cfpt_saved_accounts', JSON.stringify(migratedAccounts));
              setSavedAccounts(migratedAccounts);
              console.log('✅ Migration réussie:', migratedAccounts.length, 'comptes migrés');
            }
          }
        }
      } catch (error) {
        console.error('Erreur chargement des comptes:', error);
      }
    };
    loadSavedAccounts();
  }, []);

  useEffect(() => {
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

  const handleSelectAccount = (account: SavedAccount) => {
    setSelectedAccount(account);
    setEmail(account.email);
    setError('');
  };

  const handleDeselectAccount = () => {
    setSelectedAccount(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  const saveAccountToList = (accountData: SavedAccount) => {
    try {
      const saved = localStorage.getItem('cfpt_saved_accounts');
      let accounts: SavedAccount[] = saved ? JSON.parse(saved) : [];
      
      // Vérifier si le compte existe déjà
      const existingIndex = accounts.findIndex(acc => acc.email === accountData.email);
      if (existingIndex >= 0) {
        // Mettre à jour le compte existant
        accounts[existingIndex] = accountData;
      } else {
        // Ajouter le nouveau compte
        accounts.unshift(accountData);
      }
      
      // Limiter à 5 comptes
      accounts = accounts.slice(0, 5);
      
      localStorage.setItem('cfpt_saved_accounts', JSON.stringify(accounts));
      setSavedAccounts(accounts);
    } catch (error) {
      console.error('Erreur sauvegarde compte:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('🔐 Login: Tentative de connexion pour:', email);

    try {
      const success = await login(email, password);
      if (success) {
        console.log('✅ Login: Connexion réussie');
        
        // Attendre un peu pour que le user soit sauvegardé dans localStorage par AuthContext
        setTimeout(() => {
          // Sauvegarder le compte dans la liste
          const userStr = localStorage.getItem('user');
          console.log('📂 User dans localStorage:', userStr);
          
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              if (user.email && user.firstName && user.lastName) {
                console.log('✅ Sauvegarde du compte:', user.email);
                saveAccountToList({
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  lastLogin: new Date().toISOString()
                });
              } else {
                console.warn('⚠️ Données utilisateur incomplètes:', user);
              }
            } catch (parseError) {
              console.error('❌ Erreur parsing user:', parseError);
            }
          } else {
            console.warn('⚠️ Aucun user dans localStorage');
          }
        }, 100);
        
        navigate('/dashboard');
      } else {
        console.error('❌ Login: Échec de la connexion');
        setError('Email ou mot de passe incorrect');
      }
    } catch (err) {
      console.error('❌ Login: Erreur durant la connexion:', err);
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = (account: SavedAccount) => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete || !deletePassword) {
      setDeleteError('Veuillez entrer le mot de passe');
      return;
    }

    setDeleteError('');
    
    try {
      // Vérifier le mot de passe
      const success = await login(accountToDelete.email, deletePassword);
      
      if (success) {
        // Mot de passe correct, supprimer le compte de la liste
        const saved = localStorage.getItem('cfpt_saved_accounts');
        if (saved) {
          let accounts: SavedAccount[] = JSON.parse(saved);
          accounts = accounts.filter(acc => acc.email !== accountToDelete.email);
          localStorage.setItem('cfpt_saved_accounts', JSON.stringify(accounts));
          setSavedAccounts(accounts);
        }
        
        // Fermer le modal
        setShowDeleteConfirm(false);
        setAccountToDelete(null);
        setDeletePassword('');
        
        // Si c'était le compte sélectionné, désélectionner
        if (selectedAccount?.email === accountToDelete.email) {
          handleDeselectAccount();
        }
      } else {
        setDeleteError('Mot de passe incorrect');
      }
    } catch (error) {
      setDeleteError('Erreur lors de la vérification');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setAccountToDelete(null);
    setDeletePassword('');
    setDeleteError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Barre de titre personnalisée pour Electron */}
      <div className="fixed top-0 left-0 right-0 h-8 bg-gradient-to-r from-[#0011ef] to-blue-600 z-50 drag-region flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white/20 rounded-full"></div>
          <span className="text-white text-sm font-semibold">{labels.appName}</span>
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
        {/* Header with CFPT Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20 shadow-2xl">
              <CFPTLogoGradient size="2xl" className="drop-shadow-2xl" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{labels.appName}</h1>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-white/90 text-base italic leading-relaxed">
              "Excellence en formation professionnelle"
            </p>
            <p className="text-blue-200 text-sm mt-3 font-medium">
              Système de gestion des évaluations
            </p>
          </div>
        </div>

        {/* Liste des comptes sauvegardés */}
        {savedAccounts.length > 0 && !selectedAccount && (
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/30 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserCircle2 className="w-5 h-5 mr-2 text-[#0011ef]" />
              Comptes enregistrés
            </h3>
            <div className="space-y-2">
              {savedAccounts.map((account, index) => (
                <div
                  key={index}
                  className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-blue-50 hover:to-blue-100 cursor-pointer transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-lg"
                  onClick={() => handleSelectAccount(account)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#0011ef] to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">
                        {account.firstName[0]}{account.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {account.firstName} {account.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{account.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAccount(account);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 rounded-lg transition-all duration-200"
                    title="Supprimer ce compte"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Cliquez sur un compte pour vous connecter
            </p>
          </div>
        )}

        {/* Login form */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#0011ef] to-blue-600 rounded-2xl mb-4 shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h2>
            <p className="text-gray-600">
              {selectedAccount ? `Bienvenue ${selectedAccount.firstName}` : 'Accédez à votre espace de gestion'}
            </p>
          </div>

          {/* Compte sélectionné */}
          {selectedAccount && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#0011ef] to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold">
                      {selectedAccount.firstName[0]}{selectedAccount.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedAccount.firstName} {selectedAccount.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedAccount.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleDeselectAccount}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Changer de compte"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!selectedAccount && (
              <EmailInput
                label="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="bg-white"
                required
              />
            )}

            <PasswordInput
              label="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white border-gray-300"
              required
            />

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-4 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-[#0011ef] to-blue-600 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-[#0011ef] hover:text-blue-700 font-semibold transition-colors">
                Créer un compte
              </Link>
            </p>
            
            <div className="text-center mt-4">
              <Link 
                to="/forgot-password" 
                className="text-sm text-[#0011ef] hover:text-blue-700 font-semibold transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>
        </div>

        {/* Footer inspiration */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-6 text-white/70">
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              <span className="text-sm">Formation</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              <span className="text-sm">Communauté</span>
            </div>
            <div className="flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              <span className="text-sm">Service</span>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-4 italic">
            "Au service de l'excellence éducative chrétienne"
          </p>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && accountToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Supprimer le compte</h3>
              <p className="text-gray-600">
                Confirmez la suppression de :
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <p className="font-semibold text-gray-900">
                  {accountToDelete.firstName} {accountToDelete.lastName}
                </p>
                <p className="text-sm text-gray-600">{accountToDelete.email}</p>
              </div>
            </div>

            <div className="mb-6">
              <PasswordInput
                label="Mot de passe de confirmation"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Entrez le mot de passe de ce compte pour confirmer la suppression
              </p>
            </div>

            {deleteError && (
              <div className="mb-4 text-red-600 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-200">
                {deleteError}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                type="button"
                onClick={handleCancelDelete}
                variant="secondary"
                className="flex-1 py-3"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
