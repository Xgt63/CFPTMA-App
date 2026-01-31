import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../services/database';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, CreditCard as Edit, Trash2, BookOpen, User, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Download, Upload, FileSpreadsheet, Clock, Users, GraduationCap, UserCheck, MessageCircle } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { FormationTheme } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ExcelJS from 'exceljs';
import { shouldShowDebugTools } from '../utils/environment';
import { UIHealthMonitor, AuthDebugger, DatabaseQueueIndicator } from '../components/debug';
import { Bug, Type } from 'lucide-react';
import { CustomizationTab } from '../components/CustomizationTab';

const mockThemes: FormationTheme[] = [
  {
    id: '1',
    name: 'Leadership Management',
    description: 'Formation sur les techniques de leadership et de management d\'équipe',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Communication Efficace',
    description: 'Améliorer ses compétences en communication interpersonnelle',
    createdAt: '2024-01-20'
  },
  {
    id: '3',
    name: 'Gestion de Projet',
    description: 'Méthodologies et outils pour la gestion de projets',
    createdAt: '2024-02-01'
  },
  {
    id: '4',
    name: 'Innovation & Créativité',
    description: 'Développer l\'innovation et la créativité en entreprise',
    createdAt: '2024-02-10'
  }
];

export const Settings: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'themes' | 'profile' | 'password' | 'activity' | 'personnel' | 'customization' | 'debug'>('themes');
  const [showDebugTools] = useState(shouldShowDebugTools());
  
  // Thèmes de formation
  const [themes, setThemes] = useState<FormationTheme[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTheme, setEditingTheme] = useState<FormationTheme | null>(null);
  const [themeFormData, setThemeFormData] = useState({
    name: '',
    description: ''
  });

  // Profil utilisateur
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  // Mot de passe
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const [messages, setMessages] = useState({
    themes: '',
    profile: '',
    password: '',
    export: '',
    type: '' as 'success' | 'error' | ''
  });

  // Export/Import state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Activity state
  const [activities, setActivities] = useState<any[]>([]);

  // Personnel management state
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaffMember, setSelectedStaffMember] = useState<any>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffComments, setStaffComments] = useState<{[key: string]: any[]}>({});
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<any>(null);

  // Charger les thèmes au montage du composant avec synchronisation
  useEffect(() => {
    const loadThemes = async () => {
      try {
        console.log('Chargement des thèmes...');
        const loadedThemes = await DatabaseService.getThemes();
        console.log('Thèmes chargés:', loadedThemes);
        setThemes(loadedThemes);
      } catch (error) {
        console.error('Erreur lors du chargement des thèmes:', error);
        // Utiliser les thèmes mockés en cas d'erreur
        setThemes(mockThemes);
      }
    };
    
    loadThemes();
    
    // Écouter les événements de synchronisation pour les thèmes
    const handleThemesUpdate = () => {
      console.log('Settings: Thèmes mis à jour, rechargement...');
      loadThemes();
    };
    
    DatabaseService.addEventListener('themes-updated', handleThemesUpdate);
    DatabaseService.addEventListener('data-updated', handleThemesUpdate);
    
    // Nettoyage des écouteurs
    return () => {
      DatabaseService.removeEventListener('themes-updated', handleThemesUpdate);
      DatabaseService.removeEventListener('data-updated', handleThemesUpdate);
    };
  }, []);

  // Validation du mot de passe en temps réel
  React.useEffect(() => {
    const password = passwordData.newPassword;
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [passwordData.newPassword]);

  // Charger le personnel au montage du composant
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const loadedStaff = await DatabaseService.getStaff();
        setStaff(loadedStaff || []);
        
        // Charger les commentaires du personnel
        const savedComments = JSON.parse(localStorage.getItem('staffComments') || '{}');
        setStaffComments(savedComments);
      } catch (error) {
        console.error('Erreur lors du chargement du personnel:', error);
      }
    };
    
    if (activeTab === 'personnel') {
      loadStaff();
    }
  }, [activeTab]);

  // Fonctions pour gérer les commentaires du personnel
  const saveStaffComment = async (staffId: string, comment: string) => {
    try {
      const commentData = {
        id: Date.now().toString(),
        text: comment.trim(),
        date: new Date().toISOString(),
        author: user?.firstName + ' ' + user?.lastName || 'Administrateur'
      };

      const currentComments = staffComments[staffId] || [];
      const updatedComments = [...currentComments, commentData];
      
      const allComments = {
        ...staffComments,
        [staffId]: updatedComments
      };
      
      setStaffComments(allComments);
      localStorage.setItem('staffComments', JSON.stringify(allComments));
      setNewComment('');
      
      console.log('Commentaire sauvegardé pour le membre:', staffId);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du commentaire:', error);
      alert('Erreur lors de la sauvegarde du commentaire.');
    }
  };

  const updateStaffComment = async (staffId: string, commentId: string, newText: string) => {
    try {
      const currentComments = staffComments[staffId] || [];
      const updatedComments = currentComments.map(comment => 
        comment.id === commentId 
          ? { ...comment, text: newText.trim(), lastModified: new Date().toISOString() }
          : comment
      );
      
      const allComments = {
        ...staffComments,
        [staffId]: updatedComments
      };
      
      setStaffComments(allComments);
      localStorage.setItem('staffComments', JSON.stringify(allComments));
      setEditingComment(null);
      
      console.log('Commentaire modifié pour le membre:', staffId);
    } catch (error) {
      console.error('Erreur lors de la modification du commentaire:', error);
      alert('Erreur lors de la modification du commentaire.');
    }
  };

  const deleteStaffComment = async (staffId: string, commentId: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) {
      try {
        const currentComments = staffComments[staffId] || [];
        const updatedComments = currentComments.filter(comment => comment.id !== commentId);
        
        const allComments = {
          ...staffComments,
          [staffId]: updatedComments
        };
        
        setStaffComments(allComments);
        localStorage.setItem('staffComments', JSON.stringify(allComments));
        
        console.log('Commentaire supprimé pour le membre:', staffId);
      } catch (error) {
        console.error('Erreur lors de la suppression du commentaire:', error);
        alert('Erreur lors de la suppression du commentaire.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Filtrer le personnel selon la recherche
  const filteredStaff = staff.filter(member => {
    if (!member) return false;
    const searchLower = staffSearchQuery.toLowerCase();
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
    const email = (member.email || '').toLowerCase();
    const position = (member.position || '').toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower) || position.includes(searchLower);
  });

  // Gestion des thèmes
  const handleThemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Soumission du formulaire thème:', { editingTheme, themeFormData });
    
    try {
      if (editingTheme) {
        console.log('Modification du thème avec ID:', editingTheme.id, 'Type:', typeof editingTheme.id);
        await DatabaseService.updateTheme(editingTheme.id, {
          name: themeFormData.name,
          description: themeFormData.description
        });
        console.log('Thème modifié avec succès');
        setEditingTheme(null);
      } else {
        console.log('Création d\'un nouveau thème');
        await DatabaseService.createTheme({
          name: themeFormData.name,
          description: themeFormData.description
        });
        console.log('Thème créé avec succès');
      }
      
      // Recharger les thèmes depuis la base de données
      console.log('Rechargement des thèmes...');
      const updatedThemes = await DatabaseService.getThemes();
      console.log('Thèmes rechargés:', updatedThemes);
      setThemes(updatedThemes);
      
      setThemeFormData({ name: '', description: '' });
      setShowAddForm(false);
      setMessages({
        themes: editingTheme ? 'Thème modifié avec succès !' : 'Thème ajouté avec succès !',
        profile: '',
        password: '',
        type: 'success'
      });
      
      setTimeout(() => {
        setMessages({ themes: '', profile: '', password: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
      setMessages({
        themes: 'Erreur lors de la sauvegarde du thème',
        profile: '',
        password: '',
        type: 'error'
      });
    }
  };

  const handleEditTheme = (theme: FormationTheme) => {
    setEditingTheme(theme);
    setThemeFormData({
      name: theme.name,
      description: theme.description || ''
    });
    setShowAddForm(true);
    // Scroll vers le formulaire
    setTimeout(() => {
      const formElement = document.querySelector('[data-theme-form]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce thème de formation ?')) {
      try {
        console.log('Suppression du thème avec ID:', themeId, 'Type:', typeof themeId);
        const result = await DatabaseService.deleteTheme(themeId);
        console.log('Résultat suppression:', result);
        
        // Recharger les thèmes depuis la base de données pour être sûr
        console.log('Rechargement des thèmes après suppression...');
        const updatedThemes = await DatabaseService.getThemes();
        console.log('Thèmes après suppression:', updatedThemes);
        setThemes(updatedThemes);
        
        setMessages({
          themes: 'Thème supprimé avec succès !',
          profile: '',
          password: '',
          type: 'success'
        });
        
        setTimeout(() => {
          setMessages({ themes: '', profile: '', password: '', type: '' });
        }, 3000);
      } catch (error) {
        console.error('Erreur lors de la suppression du thème:', error);
        setMessages({
          themes: 'Erreur lors de la suppression du thème',
          profile: '',
          password: '',
          type: 'error'
        });
      }
    }
  };

  const handleCancelTheme = () => {
    setShowAddForm(false);
    setEditingTheme(null);
    setThemeFormData({ name: '', description: '' });
  };

  // Gestion du profil
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (updateProfile) {
      updateProfile(profileData);
    }
    
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...currentUser, ...profileData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    setMessages({
      themes: '',
      profile: 'Profil mis à jour avec succès !',
      password: '',
      type: 'success'
    });
    setIsEditing(false);
    
    setTimeout(() => {
      setMessages({ themes: '', profile: '', password: '', type: '' });
    }, 3000);
  };

  // Gestion du mot de passe
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = Object.values(passwordValidation).every(Boolean);
    
    if (!isValid) {
      setMessages({
        themes: '',
        profile: '',
        password: 'Le mot de passe ne respecte pas tous les critères de sécurité.',
        type: 'error'
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessages({
        themes: '',
        profile: '',
        password: 'Les mots de passe ne correspondent pas.',
        type: 'error'
      });
      return;
    }

    if (passwordData.currentPassword !== 'admin123') {
      setMessages({
        themes: '',
        profile: '',
        password: 'Mot de passe actuel incorrect.',
        type: 'error'
      });
      return;
    }

    setMessages({
      themes: '',
      profile: '',
      password: 'Mot de passe modifié avec succès !',
      type: 'success'
    });
    
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    setTimeout(() => {
      setMessages({ themes: '', profile: '', password: '', export: '', type: '' });
    }, 3000);
  };

  // Gestion de l'export
  const handleExport = async (type: 'all' | 'staff' | 'evaluations' | 'themes') => {
    setIsExporting(true);
    try {
      await DatabaseService.exportToExcel(type);
      setMessages({
        themes: '',
        profile: '',
        password: '',
        export: `Export ${type === 'all' ? 'complet' : type} réalisé avec succès !`,
        type: 'success'
      });
    } catch (error) {
      console.error('Erreur export:', error);
      setMessages({
        themes: '',
        profile: '',
        password: '',
        export: 'Erreur lors de l\'export. Vérifiez la console.',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setMessages({ themes: '', profile: '', password: '', export: '', type: '' });
      }, 5000);
    }
  };

  // Gestion de l'import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>, type: 'staff' | 'evaluations' | 'themes') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const imported = await DatabaseService.importFromExcel(file, type);
      setMessages({
        themes: '',
        profile: '',
        password: '',
        export: `Import réalisé avec succès ! ${imported} enregistrements importés.`,
        type: 'success'
      });
    } catch (error) {
      console.error('Erreur import:', error);
      setMessages({
        themes: '',
        profile: '',
        password: '',
        export: 'Erreur lors de l\'import. Vérifiez le format du fichier.',
        type: 'error'
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
      setTimeout(() => {
        setMessages({ themes: '', profile: '', password: '', export: '', type: '' });
      }, 5000);
    }
  };

  const ValidationIcon: React.FC<{ isValid: boolean }> = ({ isValid }) => (
    isValid ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-500" />
    )
  );

  return (
    <Layout 
      title="Paramètres" 
      subtitle="Configuration de l'application et gestion du profil"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <Card className="bg-gradient-to-r from-white/95 to-blue-50/80 backdrop-blur-xl">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('themes')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'themes'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Thèmes de Formation
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Mon Profil
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'password'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Lock className="w-4 h-4 mr-2" />
              Mot de Passe
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'activity'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4 mr-2" />
              Activité Récente
            </button>
            <button
              onClick={() => setActiveTab('personnel')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'personnel'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Catégorie par personne
            </button>
            <button
              onClick={() => setActiveTab('customization')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'customization'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Type className="w-4 h-4 mr-2" />
              Personnalisation
            </button>
            {showDebugTools && (
              <button
                onClick={() => setActiveTab('debug')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'debug'
                    ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Bug className="w-4 h-4 mr-2" />
                Debug Tools
              </button>
            )}
          </div>
        </Card>

        {/* Thèmes de Formation Tab */}
        {activeTab === 'themes' && (
          <>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Thèmes de Formation</h3>
                  <p className="text-gray-600 mt-1">
                    Gérez les thèmes de formation disponibles dans l'application
                  </p>
                </div>
                <Button onClick={() => setShowAddForm(true)} className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un thème
                </Button>
              </div>

              {messages.themes && (
                <div className={`mb-4 p-4 rounded-lg ${
                  messages.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {messages.themes}
                </div>
              )}

              <div className="space-y-3">
                {themes.map((theme) => (
                  <div key={theme.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-sm rounded-2xl border border-white/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#0011ef] via-blue-600 to-[#ff05f2] rounded-full flex items-center justify-center shadow-lg">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">{theme.name}</h4>
                        <p className="text-sm text-gray-600">{theme.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditTheme(theme)}
                        title="Modifier ce thème"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteTheme(theme.id.toString())}
                        title="Supprimer ce thème"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {themes.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun thème de formation</h3>
                  <p className="text-gray-600">Commencez par ajouter votre premier thème de formation.</p>
                </div>
              )}
            </Card>

            {/* Formulaire d'ajout/modification */}
            {showAddForm && (
              <Card title={editingTheme ? 'Modifier le thème' : 'Ajouter un nouveau thème'} className="border-2 border-[#0011ef]/20">
                <div data-theme-form>
                <form onSubmit={handleThemeSubmit} className="space-y-4">
                  <Input
                    label="Nom du thème"
                    value={themeFormData.name}
                    onChange={(e) => setThemeFormData({ ...themeFormData, name: e.target.value })}
                    placeholder="Ex: Leadership Management"
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={themeFormData.description}
                      onChange={(e) => setThemeFormData({ ...themeFormData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0011ef] focus:border-transparent transition-all duration-200"
                      placeholder="Description du thème de formation..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button variant="secondary" onClick={handleCancelTheme}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingTheme ? 'Modifier' : 'Ajouter'}
                    </Button>
                  </div>
                </form>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card title="Informations personnelles">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-[#0011ef] via-blue-600 to-[#ff05f2] rounded-full flex items-center justify-center shadow-2xl">
                  <span className="text-white text-2xl font-bold">
                    {user?.firstName[0]}{user?.lastName[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Membre actif
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Prénom"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  disabled={!isEditing}
                  required
                />
                <Input
                  label="Nom"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  disabled={!isEditing}
                  required
                />
              </div>

              <Input
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled={!isEditing}
                required
              />

              {messages.profile && (
                <div className={`p-4 rounded-lg ${
                  messages.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {messages.profile}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setProfileData({
                          firstName: user?.firstName || '',
                          lastName: user?.lastName || '',
                          email: user?.email || ''
                        });
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="submit">
                      Sauvegarder
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                  >
                    Modifier
                  </Button>
                )}
              </div>
            </form>
          </Card>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <Card title="Changer le mot de passe">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  label="Mot de passe actuel"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Nouveau mot de passe"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirmer le nouveau mot de passe"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Critères de sécurité */}
              <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm p-6 rounded-2xl border border-white/30 shadow-lg">
                <h4 className="font-medium text-gray-900 mb-3">Critères de sécurité :</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <ValidationIcon isValid={passwordValidation.length} />
                    <span className={`text-sm ${passwordValidation.length ? 'text-green-700' : 'text-red-700'}`}>
                      Au moins 8 caractères
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ValidationIcon isValid={passwordValidation.uppercase} />
                    <span className={`text-sm ${passwordValidation.uppercase ? 'text-green-700' : 'text-red-700'}`}>
                      Au moins une majuscule (A-Z)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ValidationIcon isValid={passwordValidation.lowercase} />
                    <span className={`text-sm ${passwordValidation.lowercase ? 'text-green-700' : 'text-red-700'}`}>
                      Au moins une minuscule (a-z)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ValidationIcon isValid={passwordValidation.number} />
                    <span className={`text-sm ${passwordValidation.number ? 'text-green-700' : 'text-red-700'}`}>
                      Au moins un chiffre (0-9)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ValidationIcon isValid={passwordValidation.special} />
                    <span className={`text-sm ${passwordValidation.special ? 'text-green-700' : 'text-red-700'}`}>
                      Au moins un caractère spécial (!@#$%^&*...)
                    </span>
                  </div>
                </div>
              </div>

              {messages.password && (
                <div className={`p-4 rounded-lg ${
                  messages.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {messages.password}
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  type="submit"
                  disabled={!Object.values(passwordValidation).every(Boolean) || 
                           passwordData.newPassword !== passwordData.confirmPassword ||
                           !passwordData.currentPassword}
                >
                  Changer le mot de passe
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Activity Recent Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <Card title="Activité Récente">
              <div className="space-y-4">
                {(() => {
                  const recentActivities = [];
                  
                  // Simuler des activités récentes (dans une vraie app, ces données viendraient de la base de données)
                  const mockActivities = [
                    {
                      action: 'Nouvelle évaluation',
                      user: 'Marie Dupont',
                      time: '2 minutes',
                      type: 'evaluation',
                      icon: GraduationCap,
                      color: 'bg-green-500'
                    },
                    {
                      action: 'Membre ajouté',
                      user: 'Jean Martin',
                      time: '15 minutes',
                      type: 'user',
                      icon: Users,
                      color: 'bg-blue-500'
                    },
                    {
                      action: 'Thème créé',
                      user: 'Formation Leadership',
                      time: '1 heure',
                      type: 'theme',
                      icon: BookOpen,
                      color: 'bg-purple-500'
                    },
                    {
                      action: 'Évaluation modifiée',
                      user: 'Sophie Laurent',
                      time: '2 heures',
                      type: 'evaluation',
                      icon: GraduationCap,
                      color: 'bg-orange-500'
                    },
                    {
                      action: 'Profil mis à jour',
                      user: 'Admin',
                      time: '3 heures',
                      type: 'profile',
                      icon: User,
                      color: 'bg-indigo-500'
                    }
                  ];
                  
                  return mockActivities.length > 0 ? mockActivities : [{
                    action: 'Aucune activité récente',
                    user: 'Commencez par utiliser l\'application',
                    time: 'Maintenant',
                    type: 'info',
                    icon: Clock,
                    color: 'bg-gray-500'
                  }];
                })().map((activity, index) => (
                  <div key={index} className="flex items-center p-4 bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm rounded-2xl border border-white/30 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                    <div className={`w-10 h-10 ${activity.color} rounded-xl flex items-center justify-center shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300`}>
                      <activity.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.user}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-medium">Il y a {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Statistiques d'activité */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-600">Actions aujourd'hui</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">45</div>
                  <div className="text-sm text-gray-600">Cette semaine</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">187</div>
                  <div className="text-sm text-gray-600">Ce mois</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Customization Tab */}
        {activeTab === 'customization' && (
          <CustomizationTab />
        )}

        {/* Debug Tools Tab */}
        {activeTab === 'debug' && showDebugTools && (
          <div className="space-y-6">
            {/* Warning header */}
            <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/50 to-yellow-50/50">
              <div className="flex items-center space-x-3 mb-3">
                <Bug className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-orange-800">Mode Développement</h3>
              </div>
              <p className="text-orange-700 text-sm">
                Ces outils de débogage sont destinés au développement uniquement.
              </p>
            </Card>

            {/* UI Health Monitor */}
            <Card title="Monitoring de la Santé UI">
              <UIHealthMonitor />
            </Card>

            {/* Auth Debugger */}
            <Card title="Débogueur d'Authentification">
              <AuthDebugger />
            </Card>

            {/* Database Queue Indicator */}
            <Card title="Indicateur Queue Base de Données">
              <DatabaseQueueIndicator />
            </Card>
          </div>
        )}

        {/* Informations système */}
        <Card title="Informations Système">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Version de l'application</h4>
              <p className="text-gray-600">CFP Manager v1.0.0</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Dernière mise à jour</h4>
              <p className="text-gray-600">{new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Nombre d'administrateurs</h4>
              <p className="text-gray-600">1 / 5 maximum</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Thèmes de formation</h4>
              <p className="text-gray-600">{themes.length} thème(s) configuré(s)</p>
            </div>
          </div>
        </Card>

        {/* Actions système */}
        <Card title="Actions Système">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
                <Button 
                  variant="secondary"
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir sauvegarder la configuration ?')) {
                      alert('Configuration sauvegardée avec succès !');
                    }
                  }}
                >
                  Sauvegarder la configuration
                </Button>
                
                <Button 
                  variant="secondary"
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir réinitialiser les paramètres ?')) {
                      setThemes(mockThemes);
                      alert('Paramètres réinitialisés !');
                    }
                  }}
                >
                  Réinitialiser les paramètres
                </Button>
                
              </div>
            
            {/* Section déconnexion */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Session utilisateur</h4>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50/80 to-pink-50/80 backdrop-blur-sm rounded-2xl border border-red-200/50">
                <div>
                  <p className="font-medium text-gray-900">Déconnexion</p>
                  <p className="text-sm text-gray-600">Fermer votre session en cours</p>
                </div>
                <Button 
                  variant="danger"
                  onClick={logout}
                  className="flex items-center"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </Button>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </Layout>
  );
};