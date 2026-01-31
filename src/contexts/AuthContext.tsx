import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Fonction utilitaire pour valider un email (accepte tous les domaines)
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Fonction utilitaire pour hasher un mot de passe (simulation)
const hashPassword = (password: string): string => {
  // En production, utilisez une vraie fonction de hashage comme bcrypt
  return btoa(password + 'CFP_SALT_2024');
};

// Fonction utilitaire pour vérifier un mot de passe
const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthProvider: Initialisation du contexte d\'authentification');
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const userData = JSON.parse(stored);
        console.log('✅ AuthProvider: Utilisateur trouvé dans le stockage local:', userData.email);
        setUser(userData);
      } else {
        console.log('ℹ️ AuthProvider: Aucun utilisateur trouvé dans le stockage local');
      }
    } catch (error) {
      console.error('❌ AuthProvider: Erreur lors de la récupération de l\'utilisateur:', error);
      localStorage.removeItem('user'); // Nettoyer les données corrompues
    }
    setIsLoading(false);
    console.log('🏁 AuthProvider: Initialisation terminée');
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 AuthProvider.login: Tentative de connexion pour:', email);
    
    try {
      // Validation de l'email
      if (!isValidEmail(email)) {
        console.error('❌ AuthProvider.login: Email invalide:', email);
        return false;
      }
      
      // Vérifier le compte admin par défaut (plusieurs variantes)
      const isAdminLogin = (
        (email === 'admin@cfp.com' || email === 'admin@cfpt-ivato.mg' || email === 'admin@cfpt.mg') && 
        password === 'admin123'
      );
      
      if (isAdminLogin) {
        console.log('✅ AuthProvider.login: Connexion admin par défaut réussie');
        const mockUser: User = {
          id: '1',
          email,
          firstName: 'Administrateur',
          lastName: 'CFPT',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return true;
      }
      
      // Vérifier dans la base de données locale des utilisateurs
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      console.log(`🔍 AuthProvider.login: Recherche parmi ${users.length} utilisateur(s) enregistré(s)`);
      
      const foundUser = users.find((u: any) => u.email === email);
      if (foundUser) {
        console.log('👤 AuthProvider.login: Utilisateur trouvé:', foundUser.email);
        
        // Vérifier le mot de passe
        const isPasswordValid = foundUser.password ? 
          (foundUser.password.startsWith('btoa:') ? 
            verifyPassword(password, foundUser.password.substring(5)) : 
            foundUser.password === password) : 
          false;
        
        if (isPasswordValid) {
          console.log('✅ AuthProvider.login: Connexion réussie pour:', email);
          const userToLogin: User = {
            id: foundUser.id,
            email: foundUser.email,
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            role: foundUser.role || 'admin',
            createdAt: foundUser.createdAt
          };
          setUser(userToLogin);
          localStorage.setItem('user', JSON.stringify(userToLogin));
          return true;
        } else {
          console.error('❌ AuthProvider.login: Mot de passe incorrect pour:', email);
        }
      } else {
        console.error('❌ AuthProvider.login: Utilisateur non trouvé:', email);
      }
      
      return false;
    } catch (error) {
      console.error('❌ AuthProvider.login: Erreur durant la connexion:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, additionalData?: any): Promise<boolean> => {
    console.log('📝 AuthProvider.register: Tentative d\'inscription pour:', email);
    
    try {
      // Validation des données
      if (!isValidEmail(email)) {
        console.error('❌ AuthProvider.register: Email invalide:', email);
        return false;
      }
      
      if (password.length < 6) {
        console.error('❌ AuthProvider.register: Mot de passe trop court');
        return false;
      }
      
      if (!firstName.trim() || !lastName.trim()) {
        console.error('❌ AuthProvider.register: Prénom ou nom manquant');
        return false;
      }
      
      // Vérifier si l'utilisateur existe déjà
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = users.find((u: any) => u.email === email);
      
      if (existingUser) {
        console.error('❌ AuthProvider.register: Utilisateur déjà existant:', email);
        return false;
      }
      
      console.log('✅ AuthProvider.register: Création du nouvel utilisateur');
      
      // Créer le nouvel utilisateur
      const newUser = {
        id: Date.now().toString(),
        email,
        password: 'btoa:' + hashPassword(password), // Stocker le mot de passe hashé
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'admin',
        createdAt: new Date().toISOString(),
        ...additionalData // Inclure les données supplémentaires (fonction, centre, etc.)
      };
      
      // Sauvegarder dans la base de données locale
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      console.log(`💾 AuthProvider.register: Utilisateur sauvegardé. Total: ${users.length}`);
      
      // Connecter automatiquement l'utilisateur
      const userToLogin: User = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        createdAt: newUser.createdAt
      };
      
      setUser(userToLogin);
      localStorage.setItem('user', JSON.stringify(userToLogin));
      
      console.log('🎉 AuthProvider.register: Inscription et connexion automatique réussies!');
      return true;
      
    } catch (error) {
      console.error('❌ AuthProvider.register: Erreur durant l\'inscription:', error);
      return false;
    }
  };

  const updateProfile = (profileData: { firstName: string; lastName: string; email: string }) => {
    if (user) {
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    console.log('🚪 AuthProvider.logout: Déconnexion de l\'utilisateur:', user?.email);
    setUser(null);
    localStorage.removeItem('user');
    console.log('✅ AuthProvider.logout: Déconnexion terminée');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};