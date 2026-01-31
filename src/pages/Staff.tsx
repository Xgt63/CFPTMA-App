import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NonBlockingDB from '../services/nonBlockingDatabase';
import { DatabaseService } from '../services/database';
import { useSyncedData } from '../hooks/useSyncedData';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { 
  Plus, Search, Edit, Trash2, Mail, Phone, Eye, Users, RefreshCw, 
  FileText, Clock, Hash, RotateCcw, Calendar, User, Play,
  BookOpen, Award, AlertCircle, Badge
} from 'lucide-react';
import { ExcelImportExport } from '../components/ExcelImportExport';

// Bouton intelligent: affiche le libellé si court, sinon seulement l'icône
const ButtonSmart: React.FC<{label: string; icon: React.ReactNode; onClick?: () => void; className?: string; variant?: any; size?: any; disabled?: boolean; title?: string;}> = ({label, icon, onClick, className, variant, size, disabled, title}) => {
  const onlyIcon = (label || '').length > 14;
  return (
    <Button onClick={onClick} className={className} variant={variant as any} size={size as any} disabled={disabled} title={title || label}>
      <span className="flex items-center">
        {icon}
        {!onlyIcon && <span className="ml-2">{label}</span>}
      </span>
    </Button>
  );
};
import { addRecent, getRecents } from '../utils/recents';
import { format } from 'date-fns';

const positions = [
  { value: '', label: 'Toutes les fonctions' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Formateur', label: 'Formateur' },
  { value: 'Coordinatrice', label: 'Coordinatrice' },
  { value: 'Assistant', label: 'Assistant' }
];


// Petit formulaire pour assigner une formation à un membre
const AssignTrainingForm: React.FC<{ memberId: number|string; themes: any[]; existingThemeIds?: number[]; onCreated: ()=>void }>=({memberId, themes, existingThemeIds=[], onCreated})=>{
  const [themeId, setThemeId] = useState<string>('');
  const [status, setStatus] = useState<string>('active');
  const [saving, setSaving] = useState(false);

  const availableThemes = React.useMemo(()=>{
    const setIds = new Set((existingThemeIds||[]).map(id=>Number(id)));
    return themes.filter((t:any)=> !setIds.has(Number(t.id)));
  },[themes, existingThemeIds]);

  const themeOptions = [{value:'',label:'Thème...'}, ...availableThemes.map((t:any)=>({value:String(t.id), label: t.name}))];

  const submit = async ()=>{
    if(!themeId) return;
    setSaving(true);
    try{
      await DatabaseService.createStaffTraining({ staffId: Number(memberId), themeId: Number(themeId), status, assignedDate: new Date().toISOString() });
      setThemeId('');
      setStatus('active');
      onCreated();
    }finally{
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select options={themeOptions} value={themeId} onChange={(v)=>setThemeId(v)} className="w-52" />
      <Select options={[{value:'active',label:'Active'},{value:'paused',label:'En pause'}]} value={status} onChange={(v)=>setStatus(v)} className="w-32" />
      <Button size="sm" disabled={!themeId || saving} onClick={submit} className="bg-blue-600 hover:bg-blue-700 text-white">Ajouter</Button>
    </div>
  );
};

export const Staff: React.FC = () => {
  const navigate = useNavigate();
  const { 
    staff = [], 
    evaluations = [], 
    themes = [],
    trainings = [],
    isLoading: globalLoading = true, 
    forceRefresh, 
    syncVersion = 0 
  } = useSyncedData() || {};
  
  // Synchronisation des programmations de suivi (partagées avec Évaluation)
  const [followUpSchedules, setFollowUpSchedules] = useState<Record<string,string>>(()=>{
    try{ return JSON.parse(localStorage.getItem('followUpSchedules')||'{}'); }catch{ return {}; }
  });
  useEffect(()=>{
    const onStorage = (e: StorageEvent)=>{
      if (e.key==='followUpSchedules'){
        try{ setFollowUpSchedules(JSON.parse(e.newValue||'{}')); }catch{}
      }
    };
    const onCustom = ()=>{
      try{ setFollowUpSchedules(JSON.parse(localStorage.getItem('followUpSchedules')||'{}')); }catch{}
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('followUpSchedulesUpdated', onCustom as any);
    return ()=>{
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('followUpSchedulesUpdated', onCustom as any);
    };
  },[]);
  
  // États pour la gestion du personnel
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<any>(null);
  const [showFormations, setShowFormations] = useState<any>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | number | null>(null);
  const [isOperating, setIsOperating] = useState(false);
  // Pagination & tri
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [sortBy, setSortBy] = useState<'name'|'position'|'evaluations'>('name');

  // États pour la section Sauvegardes
  const [activeTab, setActiveTab] = useState<'staff' | 'drafts'>('staff');
  const [drafts, setDrafts] = useState<any[]>([]);
  // Filtre de suivi
  const [followUpFilter, setFollowUpFilter] = useState<'all'|'overdue'|'soon'|'planned'|'never'>('all');
  const [draftsByPerson, setDraftsByPerson] = useState<{[key: string]: any[]}>({});
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [showExcelImportExport, setShowExcelImportExport] = useState(false);
  const [draftAgeFilter, setDraftAgeFilter] = useState<'all'|'7'|'30'|'90'>('all');
  
  // États pour les commentaires/observations
  const [staffComments, setStaffComments] = useState<{[key: string]: any[]}>({});
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<any>(null);
  
  // États pour les recommandations personnalisées (direction uniquement)
  type DirReco = { id: string; text: string; date: string; lastModified?: string };
  const [personalRecommendations, setPersonalRecommendations] = useState<{[key: string]: DirReco[]}>({});
  const [showRecommendationField, setShowRecommendationField] = useState<{[key: string]: boolean}>({});
  const [editingReco, setEditingReco] = useState<{ staffId: string; id: string; text: string }|null>(null);
  const isDirection = true; // TODO: Récupérer le rôle depuis le contexte utilisateur
  
  // Gérer les paramètres d'URL pour la navigation depuis le Dashboard
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const memberId = urlParams.get('member');
    const action = urlParams.get('action');
    
    // Définir l'onglet actif selon l'URL
    if (tab === 'drafts') {
      setActiveTab('drafts');
    }
    
    // Ouvrir l'import Excel si demandé
    if (action === 'import') {
      setShowExcelImportExport(true);
      setActiveTab('staff');
    }
    
    // Afficher les détails d'un membre spécifique
    if (memberId && Array.isArray(staff) && staff.length > 0) {
      setActiveTab('staff');
      const member = staff.find(m => m?.id?.toString() === memberId);
      if (member) {
        setShowDetails(member);
      }
    }
  }, [staff]); // Dépendre de staff au lieu d'enrichedStaff

  // Charger les brouillons
  const loadDrafts = useCallback(async () => {
    try {
      setLoadingDrafts(true);
      console.log('Chargement des brouillons...');
      const draftsData = await DatabaseService.getAllDraftsWithDetails();
      
      if (!Array.isArray(draftsData)) {
        console.warn('Données de brouillons invalides:', draftsData);
        setDrafts([]);
        setDraftsByPerson({});
        return;
      }
      
      setDrafts(draftsData);
      console.log(`${draftsData.length} brouillon(s) chargé(s)`);
      
      // Grouper par personne avec validation
      const grouped: {[key: string]: any[]} = {};
      draftsData.forEach((draft: any) => {
        if (!draft) return;
        
        const personKey = draft.email || `${draft.firstName || 'Inconnu'}_${draft.lastName || 'Inconnu'}`;
        if (!grouped[personKey]) {
          grouped[personKey] = [];
        }
        grouped[personKey].push(draft);
      });
      
      setDraftsByPerson(grouped);
      console.log(`Brouillons groupés pour ${Object.keys(grouped).length} personne(s)`);
    } catch (error) {
      console.error('Erreur lors du chargement des brouillons:', error);
      // En cas d'erreur, initialiser avec des valeurs vides
      setDrafts([]);
      setDraftsByPerson({});
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  // Forcer la fermeture du formulaire d'édition si l'élément édité n'existe plus
  useEffect(() => {
    // Vérifier que staff est un tableau valide
    if (!Array.isArray(staff)) {
      return;
    }
    
    if (editingMember && !staff.find(member => member?.id === editingMember?.id)) {
      console.log('Membre en cours d\'édition supprimé, fermeture du formulaire');
      setEditingMember(null);
    }
    if (showDetails && !staff.find(member => member?.id === showDetails?.id)) {
      console.log('Membre en détail supprimé, fermeture des détails');
      setShowDetails(null);
    }
    if (showFormations && !staff.find(member => member?.id === showFormations?.id)) {
      console.log('Membre en formations supprimé, fermeture des formations');
      setShowFormations(null);
    }
  }, [staff, editingMember, showDetails]);

  // Charger les brouillons au démarrage et lors des changements de données
  useEffect(() => {
    loadDrafts();
    // Charger les commentaires du personnel
    const savedComments = JSON.parse(localStorage.getItem('staffComments') || '{}');
    setStaffComments(savedComments);
    // Charger les recommandations personnalisées (migration: string -> array)
    try {
      const raw = JSON.parse(localStorage.getItem('personalRecommendations') || '{}');
      const migrated: {[k:string]: DirReco[]} = {};
      Object.keys(raw||{}).forEach(k => {
        const v = raw[k];
        if (typeof v === 'string') {
          migrated[k] = [{ id: Date.now().toString(), text: v, date: new Date().toISOString() }];
        } else if (Array.isArray(v)) {
          migrated[k] = v;
        }
      });
      setPersonalRecommendations(migrated);
    } catch {
      setPersonalRecommendations({});
    }
  }, [loadDrafts, syncVersion]);

  // Recents/Favorites tracking
  React.useEffect(()=>{
    try{
      addRecent({ id:'page-staff', label:'Page: Personnel', path:'/staff', kind:'staff' });
    }catch{}
  },[]);

  // Enrichir les données du personnel avec les évaluations
  const enrichedStaff = React.useMemo(() => {
    if (!Array.isArray(staff) || !Array.isArray(evaluations)) {
      return [];
    }
    
    return staff.map(member => {
      if (!member) return member;
      
      const memberEvaluations = evaluations.filter(evaluation => {
        if (!evaluation) return false;
        return evaluation.staffId === member.id || 
        (evaluation.firstName === member.firstName && evaluation.lastName === member.lastName);
      });
      
      // Calcul suivi (6 mois)
      let followUpBadge: null | { label: string; color: string } = null;
      let followUpDueAt: number | null = null;
      let followUpDaysLeft: number | null = null;
      let followUpStatus: 'overdue'|'soon'|'planned'|'never' = 'never';
      let hasInitialEvaluation = false;
      try {
        const initialCompleted = memberEvaluations.filter((e:any)=> (e.status==='completed') && ((e.evaluationType||'initial')==='initial'))
          .sort((a:any,b:any)=> new Date(b.completedAt||b.updatedAt||b.createdAt).getTime()-new Date(a.completedAt||a.updatedAt||a.createdAt).getTime());
        if (initialCompleted[0]){
          hasInitialEvaluation = true;
          const last = new Date(initialCompleted[0].completedAt||initialCompleted[0].updatedAt||initialCompleted[0].createdAt).getTime();
          const sixMonths = 30*24*60*60*1000*6;
          let dueAt = last + sixMonths;
          // Override depuis calendrier programmé
          const overrideISO = followUpSchedules[String(member.id)];
          if (overrideISO){
            try{ dueAt = new Date(overrideISO).getTime(); }catch{}
          }
          followUpDueAt = dueAt;
          const now = Date.now();
          const soon = 15*24*60*60*1000;
          followUpDaysLeft = Math.ceil((dueAt - now)/(24*60*60*1000));
          if (now >= dueAt) {
            followUpBadge = { label: 'Suivi Échu', color: 'bg-red-600' };
            followUpStatus = 'overdue';
          } else if ((dueAt - now) <= soon) {
            followUpBadge = { label: 'Suivi dans 15j', color: 'bg-orange-500' };
            followUpStatus = 'soon';
          } else {
            followUpStatus = 'planned';
          }
        } else {
          followUpStatus = 'never';
        }
      } catch {}

      return {
        ...member,
        evaluations: memberEvaluations,
        followUpBadge,
        followUpDueAt,
        followUpDaysLeft,
        hasInitialEvaluation,
        followUpStatus,
        evaluationCount: memberEvaluations.length,
        latestEvaluation: memberEvaluations.length > 0 
          ? memberEvaluations.sort((a, b) => {
              try {
                return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
              } catch {
                return 0;
              }
            })[0]
          : null
      };
    });
  }, [staff, evaluations, followUpSchedules]);

  const filteredStaff = React.useMemo(() => {
    if (!Array.isArray(enrichedStaff)) return [];
    
    return enrichedStaff.filter(member => {
      if (!member) return false;
      
      const firstName = member.firstName || '';
      const lastName = member.lastName || '';
      const email = member.email || '';
      const formationYear = member.formationYear?.toString() || '';
      const searchString = `${firstName} ${lastName} ${email} ${formationYear}`.toLowerCase();
      const q = (searchTerm || '').toLowerCase().trim();
      const matchesSearch = q === '' || searchString.includes(q);

      const status = (member.followUpStatus || 'never');
      const matchesStatus = followUpFilter==='all' || status===followUpFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [enrichedStaff, searchTerm, followUpFilter]);

  const sortedStaff = React.useMemo(() => {
    const arr = [...filteredStaff];
    if (sortBy === 'name') arr.sort((a:any,b:any)=>(`${a.lastName||''}${a.firstName||''}`).localeCompare(`${b.lastName||''}${b.firstName||''}`));
    if (sortBy === 'position') arr.sort((a:any,b:any)=> (a.position||'').localeCompare(b.position||''));
    if (sortBy === 'evaluations') arr.sort((a:any,b:any)=> (b.evaluationCount||0)-(a.evaluationCount||0));
    return arr;
  }, [filteredStaff, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedStaff.length / pageSize));
  const pageItems = React.useMemo(()=> sortedStaff.slice((page-1)*pageSize, page*pageSize), [sortedStaff, page]);

  const handleAddMember = () => {
    navigate('/evaluation');
  };

  const handleAddEvaluation = (member: any) => {
    if (member?.id) {
      navigate(`/evaluation/${member.id}` as any, {
        state: {
          prefill: {
            id: member.id,
            matricule: member.matricule || '',
            firstName: member.firstName || '',
            lastName: member.lastName || '',
            email: member.email || '',
            phone: member.phone || '',
            position: member.position || '',
            establishment: member.establishment || ''
          }
        }
      } as any);
    }
  };

  const handleEditMember = (member: any) => {
    if (member) {
      setEditingMember({ ...member });
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des données
    if (!editingMember?.firstName?.trim() || !editingMember?.lastName?.trim() || !editingMember?.email?.trim()) {
      alert('Les champs Prénom, Nom et Email sont obligatoires.');
      return;
    }
    
    setIsOperating(true);
    try {
      console.log('Mise à jour du membre:', editingMember);
      const result = await NonBlockingDB.updateStaff(parseInt(editingMember.id), {
        ...editingMember,
        firstName: editingMember.firstName.trim(),
        lastName: editingMember.lastName.trim(),
        email: editingMember.email.trim().toLowerCase(),
        phone: editingMember.phone?.trim() || '',
        position: editingMember.position?.trim() || '',
        establishment: editingMember.establishment?.trim() || '',
        formationYear: editingMember.formationYear?.toString() || new Date().getFullYear().toString()
      });
      
      console.log('Membre mis à jour avec succès');
      setEditingMember(null);
      if (forceRefresh) {
        forceRefresh();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`Erreur lors de la mise à jour du membre: ${errorMessage}`);
    } finally {
      setIsOperating(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      setIsOperating(true);
      try {
        console.log('Suppression du membre avec ID:', memberId);
        const result = await NonBlockingDB.deleteStaff(parseInt(memberId));
        console.log('Membre supprimé avec succès');
        
        if (editingMember && editingMember.id === memberId) {
          setEditingMember(null);
        }
        
        if (showDetails && showDetails.id === memberId) {
          setShowDetails(null);
        }
        
        setSearchTerm('');
        if (forceRefresh) {
          forceRefresh();
        }
        
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du membre');
      } finally {
        setIsOperating(false);
      }
    }
  };

  // Fonctions pour les brouillons
  const handleEditDraft = (draft: any) => {
    if (draft?.id) {
      navigate(`/evaluation?draft=${draft.id}`);
    }
  };

  const handleDeleteDraft = async (draft: any) => {
    if (!draft?.id || !draft?.formationTitle || !draft?.personName) {
      alert('Informations du brouillon invalides.');
      return;
    }
    
    if (window.confirm(`Voulez-vous vraiment supprimer le brouillon "${draft.formationTitle}" pour ${draft.personName} ?`)) {
      try {
        await DatabaseService.deleteDraft(draft.id);
        console.log('Brouillon supprimé:', draft.id);
        await loadDrafts();
      } catch (error) {
        console.error('Erreur lors de la suppression du brouillon:', error);
        alert('Erreur lors de la suppression du brouillon.');
      }
    }
  };

  const handleRestoreDraft = async (draft: any) => {
    if (!draft?.id || !draft?.formationTitle || !draft?.personName) {
      alert('Informations du brouillon invalides.');
      return;
    }
    
    if (window.confirm(`Voulez-vous restaurer une copie du brouillon "${draft.formationTitle}" pour ${draft.personName} ?`)) {
      try {
        const restored = await DatabaseService.restoreDraft(draft.id);
        console.log('Brouillon restauré:', restored);
        alert('Brouillon restauré avec succès !');
        await loadDrafts();
      } catch (error) {
        console.error('Erreur lors de la restauration du brouillon:', error);
        alert('Erreur lors de la restauration du brouillon.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  // Fonctions pour gérer les commentaires/observations
  const loadStaffComments = useCallback(async (staffId: string) => {
    try {
      // Récupérer les commentaires depuis localStorage ou base de données
      const savedComments = JSON.parse(localStorage.getItem('staffComments') || '{}');
      setStaffComments(savedComments);
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
    }
  }, []);

  const saveStaffComment = async (staffId: string, comment: string) => {
    try {
      const commentData = {
        id: Date.now().toString(),
        text: comment.trim(),
        date: new Date().toISOString(),
        author: 'Direction' // Ou user?.firstName + ' ' + user?.lastName
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

  // Fonctions pour gérer les recommandations personnalisées
  const savePersonalRecommendation = async (staffId: string, recommendation: string) => {
    try {
      const rec: DirReco = { id: Date.now().toString(), text: recommendation.trim(), date: new Date().toISOString() };
      const list = personalRecommendations[staffId] || [];
      const updated = { ...personalRecommendations, [staffId]: [rec, ...list] };
      setPersonalRecommendations(updated);
      localStorage.setItem('personalRecommendations', JSON.stringify(updated));
      setShowRecommendationField({ ...showRecommendationField, [staffId]: false });
      console.log('Recommandation ajoutée pour le membre:', staffId);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la recommandation:', error);
      alert('Erreur lors de la sauvegarde de la recommandation.');
    }
  };

  const updatePersonalRecommendation = async (staffId: string, recId: string, newText: string) => {
    try {
      const list = personalRecommendations[staffId] || [];
      const updatedList = list.map(r => r.id === recId ? { ...r, text: newText.trim(), lastModified: new Date().toISOString() } : r);
      const updated = { ...personalRecommendations, [staffId]: updatedList };
      setPersonalRecommendations(updated);
      localStorage.setItem('personalRecommendations', JSON.stringify(updated));
      setEditingReco(null);
      console.log('Recommandation modifiée pour le membre:', staffId);
    } catch (error) {
      console.error('Erreur lors de la modification de la recommandation:', error);
      alert('Erreur lors de la modification de la recommandation.');
    }
  };

  const deletePersonalRecommendation = async (staffId: string, recId: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette recommandation ?')) {
      try {
        const list = personalRecommendations[staffId] || [];
        const updatedList = list.filter(r => r.id !== recId);
        const updated = { ...personalRecommendations, [staffId]: updatedList };
        setPersonalRecommendations(updated);
        localStorage.setItem('personalRecommendations', JSON.stringify(updated));
        console.log('Recommandation supprimée pour le membre:', staffId);
      } catch (error) {
        console.error('Erreur lors de la suppression de la recommandation:', error);
        alert('Erreur lors de la suppression de la recommandation.');
      }
    }
  };

  // Filtrage par ancienneté des brouillons
  const isOlderThan = (dateStr: string, days: number) => {
    try { return (Date.now() - new Date(dateStr).getTime()) > days*24*60*60*1000; } catch { return false; }
  };
  const filteredDraftsByPerson = React.useMemo(()=>{
    if (draftAgeFilter==='all') return draftsByPerson;
    const limit = Number(draftAgeFilter);
    const out: {[k:string]: any[]} = {};
    Object.entries(draftsByPerson).forEach(([k, arr])=>{
      const f = arr.filter(d=>!isOlderThan(d.lastModified||d.createdAt, limit));
      if (f.length>0) out[k]=f;
    });
    return out;
  },[draftsByPerson, draftAgeFilter]);

  const totalDrafts = Object.values(filteredDraftsByPerson).reduce((total, drafts) => total + drafts.length, 0);

  if (globalLoading) {
    return (
      <Layout title="Personnel" subtitle="Chargement des données...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0011ef]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestion du Personnel" subtitle="Plateforme de gestion des évaluations et formations">
      <div className="space-y-8">
        
        {/* Header avec statistiques */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Tableau de Bord Personnel</h1>
              <p className="text-slate-300 text-lg">Gérez votre équipe et suivez les formations en temps réel</p>
            </div>
            
            <div className="flex flex-wrap gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{filteredStaff.length}</p>
                    <p className="text-slate-300 text-sm">Membres actifs</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{enrichedStaff.reduce((acc, member) => acc + (member?.evaluationCount || 0), 0)}</p>
                    <p className="text-slate-300 text-sm">Évaluations</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalDrafts}</p>
                    <p className="text-slate-300 text-sm">En cours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation moderne par onglets */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('staff')}
                className={`flex-1 flex items-center justify-center gap-3 px-8 py-6 font-semibold text-base transition-all duration-300 relative ${
                  activeTab === 'staff'
                    ? 'text-blue-700 bg-blue-50 border-b-3 border-blue-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Users className="h-6 w-6" />
                <span>Personnel</span>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  activeTab === 'staff' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  {filteredStaff.length}
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('drafts')}
                className={`flex-1 flex items-center justify-center gap-3 px-8 py-6 font-semibold text-base transition-all duration-300 relative ${
                  activeTab === 'drafts'
                    ? 'text-orange-700 bg-orange-50 border-b-3 border-orange-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-6 w-6" />
                <span>Sauvegardes</span>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  activeTab === 'drafts' ? 'bg-orange-200 text-orange-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  {totalDrafts}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Onglet Personnel */}
        {activeTab === 'staff' && (
          <div className="space-y-6">

            {/* Barre de recherche et actions premium */}
            <div className="bg-gradient-to-r from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center">
                <div className="flex-1 flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Rechercher par nom, email ou fonction..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-14 pr-4 h-14 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white shadow-sm"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setShowExcelImportExport(true)}
                    variant="outline"
                    className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 px-6 py-4 rounded-xl transition-all duration-200 shadow-sm font-semibold"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    Modèle Excel
                  </Button>
                  
                  <Button
                    onClick={handleAddMember}
                    className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white shadow-lg hover:shadow-xl px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nouveau membre
                  </Button>

                  <Button
                    onClick={() => forceRefresh && forceRefresh()}
                    variant="outline"
                    disabled={isOperating || !forceRefresh}
                    className="border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 px-4 py-4 rounded-xl transition-all duration-200 shadow-sm"
                  >
                    <RefreshCw className={`h-5 w-5 ${isOperating ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {/* Filtres de suivi (chips) */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  {key:'all', label:'Tous'},
                  {key:'overdue', label:'Échus'},
                  {key:'soon', label:'< 15j'},
                  {key:'planned', label:'Planifiés'},
                  {key:'never', label:'Jamais évalué'}
                ].map(ch => (
                  <button
                    key={ch.key}
                    onClick={()=>{ setFollowUpFilter(ch.key as any); setPage(1);} }
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${followUpFilter===ch.key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >{ch.label}</button>
                ))}
              </div>
            </div>

            {/* Liste du personnel */}
            <div className="grid gap-6">
              {filteredStaff.length === 0 ? (
                <Card className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Aucun personnel trouvé
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm 
                      ? 'Aucun membre ne correspond à votre recherche.' 
                      : 'Commencez par ajouter du personnel à votre système.'
                    }
                  </p>
                  <Button onClick={handleAddMember} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter du personnel
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {pageItems.map((member, index) => (
                    <div 
                      key={member.id} 
                      className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Header avec gradient */}
                      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-6 pb-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                                <span className="text-white font-bold text-xl">
                                  {member.firstName?.[0] || 'N'}{member.lastName?.[0] || 'N'}
                                </span>
                              </div>
                              {member.evaluationCount > 0 && (
                                <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
                                  <span className="text-white text-xs font-bold">{member.evaluationCount}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                              <span className="text-white text-sm font-medium">{member.position}</span>
                            </div>
                            {/* Statut de suivi avec compteur */}
                            <div className="flex items-center justify-end gap-2">
                              {member.followUpStatus==='never' && (
                                <div className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs inline-block shadow">Jamais évalué</div>
                              )}
                              {member.followUpStatus!=='never' && (
                                <div className={`${member.followUpStatus==='overdue' ? 'bg-red-600' : member.followUpStatus==='soon' ? 'bg-orange-500' : 'bg-emerald-600'} text-white px-3 py-1 rounded-full text-xs inline-block shadow`}>
                                  {member.followUpStatus==='overdue' ? `Échu J+${Math.abs(member.followUpDaysLeft||0)}` : `J-${member.followUpDaysLeft}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        {/* Informations principales */}
                        <div className="mb-6">
                          <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                            {member.firstName || 'Prénom'} {member.lastName || 'Nom'}
                          </h3>
                        </div>

                        {/* Informations de contact avec icônes modernes */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center group/item">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3 group-hover/item:bg-blue-200 transition-colors">
                              <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-700 text-sm truncate block">{member.email}</span>
                            </div>
                          </div>
                          {member.phone && (
                            <div className="flex items-center group/item">
                              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3 group-hover/item:bg-green-200 transition-colors">
                                <Phone className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <span className="text-gray-700 text-sm">{member.phone}</span>
                              </div>
                            </div>
                        )}
                        </div>

                        {/* Recommandation personnalisée (visible direction uniquement) */}
                        {isDirection && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-purple-700 flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Recommandations de la Direction
                              </h4>
                              {!showRecommendationField[member.id] && (
                                <ButtonSmart
                                  onClick={() => setShowRecommendationField({ ...showRecommendationField, [member.id]: true })}
                                  className="text-sm text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 p-2 rounded-xl border border-purple-200"
                                  label="Ajouter"
                                  icon={<Plus className="h-4 w-4" />}
                                />
                              )}
                            </div>

                            {/* Liste des recommandations */}
                            {(personalRecommendations[member.id]||[]).length === 0 ? (
                              <div className="text-xs text-gray-500">Aucune recommandation</div>
                            ) : (
                              <div className="space-y-2">
                                {(personalRecommendations[member.id]||[]).map((r)=> (
                                  <div key={r.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200">
                                    {editingReco && editingReco.staffId===String(member.id) && editingReco.id===r.id ? (
                                      <div className="space-y-2">
                                        <textarea value={editingReco.text} onChange={(e)=>setEditingReco({...editingReco, text: e.target.value})} className="w-full p-2 border rounded" rows={2} />
                                        <div className="flex items-center gap-2">
                                          <Button size="sm" className="bg-purple-600 text-white" onClick={()=> updatePersonalRecommendation(String(member.id), r.id, editingReco.text)}>Enregistrer</Button>
                                          <Button size="sm" variant="outline" onClick={()=> setEditingReco(null)}>Annuler</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="text-sm text-purple-900 whitespace-pre-wrap">{r.text}</p>
                                          <div className="text-xs text-gray-500 mt-1">Ajouté le {format(new Date(r.date), 'dd/MM/yyyy HH:mm')}{r.lastModified && ` • modifié le ${format(new Date(r.lastModified), 'dd/MM/yyyy HH:mm')}`}</div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button className="text-blue-600 hover:text-blue-800 p-1" title="Modifier" onClick={()=> setEditingReco({ staffId: String(member.id), id: r.id, text: r.text })}><Edit className="h-3 w-3" /></button>
                                          <button className="text-red-600 hover:text-red-800 p-1" title="Supprimer" onClick={()=> deletePersonalRecommendation(String(member.id), r.id)}><Trash2 className="h-3 w-3" /></button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Formulaire d'ajout */}
                            {showRecommendationField[member.id] && (
                              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 space-y-3 mt-2">
                                <textarea
                                  placeholder="Ajouter une recommandation..."
                                  className="w-full p-3 border border-purple-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 text-sm"
                                  rows={3}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setShowRecommendationField({ ...showRecommendationField, [member.id]: false });
                                    } else if (e.key === 'Enter' && e.ctrlKey) {
                                      const value = (e.target as HTMLTextAreaElement).value;
                                      if (value.trim()) {
                                        savePersonalRecommendation(String(member.id), value);
                                      } else {
                                        setShowRecommendationField({ ...showRecommendationField, [member.id]: false });
                                      }
                                    }
                                  }}
                                />
                                <div className="flex items-center gap-2">
                                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs" onClick={(e)=>{
                                    const textarea = (e.target as HTMLElement).closest('.space-y-3')?.querySelector('textarea') as HTMLTextAreaElement;
                                    const value = textarea?.value || '';
                                    if (value.trim()) savePersonalRecommendation(String(member.id), value); else setShowRecommendationField({ ...showRecommendationField, [member.id]: false });
                                  }}>Ajouter</Button>
                                  <Button size="sm" variant="outline" className="text-xs" onClick={()=> setShowRecommendationField({ ...showRecommendationField, [member.id]: false })}>Annuler</Button>
                                  <span className="text-xs text-gray-500">Ctrl+Enter pour ajouter, Échap pour annuler</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Statistiques */}
                        {member.evaluationCount > 0 && (
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-4 border border-green-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Performance</span>
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-bold text-green-700">
                                  {member.evaluationCount} évaluation{member.evaluationCount > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sous-liste Formations (terminées + brouillons) */}
                        <div className="mb-4">
                          <button
                            onClick={() => setExpandedMemberId(expandedMemberId === member.id ? null : member.id)}
                            className="w-full text-left text-sm text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-3 rounded-xl border border-blue-200 transition-colors flex items-center justify-between"
                          >
                            <span className="font-medium">Formations et évaluations</span>
                            <svg className={`h-4 w-4 transition-transform ${expandedMemberId === member.id ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.175l3.71-3.945a.75.75 0 111.08 1.04l-4.24 4.51a.75.75 0 01-1.08 0l-4.24-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {expandedMemberId === member.id && (
                            <div className="mt-3 space-y-3 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white">
                              {/* Évaluations terminées */}
                              <div className="bg-white border border-gray-200 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold text-gray-700">Évaluations terminées</span>
                                  <span className="text-xs text-gray-500">{(member.evaluations || []).filter((e: any)=>e.status==='completed').length}</span>
                                </div>
                                <div className="space-y-2">
                                  {(member.evaluations || []).filter((e: any)=>e.status==='completed').map((e: any) => (
                                    <div key={e.id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="font-medium text-gray-800">{e.formationTheme || 'Formation'}</span>
                                        <span className="text-gray-500">• {new Date(e.completedAt || e.updatedAt || e.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <div className="text-xs text-gray-500">{(e.evaluationType || 'initial') === 'followUp' ? 'Suivi' : 'Initiale'}</div>
                                    </div>
                                  ))}
                                  {(member.evaluations || []).filter((e: any)=>e.status==='completed').length === 0 && (
                                    <div className="text-xs text-gray-500">Aucune évaluation terminée</div>
                                  )}
                                </div>
                              </div>

                              {/* Brouillons en cours */}
                              <div className="bg-white border border-gray-200 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold text-gray-700">Brouillons</span>
                                  <span className="text-xs text-gray-500">{
                                    (()=>{ const key = member.email || `${member.firstName}_${member.lastName}`; return (draftsByPerson[key]||[]).length; })()
                                  }</span>
                                </div>
                                <div className="space-y-2">
                                  {(() => {
                                    const personKey = member.email || `${member.firstName}_${member.lastName}`;
                                    const personDrafts = draftsByPerson[personKey] || [];
                                    return personDrafts.map((d: any) => (
                                      <div key={d.id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                                          <span className="font-medium text-gray-800">{d.formationTitle || 'Formation en cours'}</span>
                                          <span className="text-gray-500">• Modifié {format(new Date(d.lastModified || d.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button size="sm" onClick={() => handleEditDraft(d)} className="bg-blue-600 hover:bg-blue-700 text-white">Continuer</Button>
                                          <Button size="sm" variant="outline" onClick={() => handleDeleteDraft(d)} className="border-red-300 text-red-700 hover:bg-red-50">Supprimer</Button>
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                  {(() => { const key = member.email || `${member.firstName}_${member.lastName}`; return (draftsByPerson[key]||[]).length === 0; })() && (
                                    <div className="text-xs text-gray-500">Aucun brouillon</div>
                                  )}
                                </div>
                              </div>

                              {/* Formations assignées retirées (mode demandé) */}
                            </div>
                          )}
                        </div>

                        {/* Actions avec design premium */}
                        <div className="space-y-3">
                          <ButtonSmart
                            onClick={() => handleAddEvaluation(member)}
                            className="w-full bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900 text-white shadow-lg hover:shadow-xl py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                            label="Nouvelle évaluation"
                            icon={<Plus className="h-5 w-5" />}
                          />
                          
                          <div className="flex gap-2">
                            <ButtonSmart
                              onClick={() => setShowDetails(member)}
                              variant="outline"
                              className="flex-1 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
                              label="Détails"
                              icon={<Eye className="h-4 w-4" />}
                            />
                            <ButtonSmart
                              onClick={() => handleEditMember(member)}
                              variant="outline"
                              className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
                              label="Modifier"
                              icon={<Edit className="h-4 w-4" />}
                            />
                            <Button
                              onClick={() => handleDeleteMember(member.id)}
                              variant="outline"
                              disabled={true}
                              className="px-4 border-2 border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed py-3 rounded-xl transition-all duration-200"
                              title="Suppression désactivée"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Pagination */}
            {sortedStaff.length > pageSize && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <Button variant="outline" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Précédent</Button>
                <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
                <Button variant="outline" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Suivant</Button>
              </div>
            )}
          </div>
        )}

        {/* Onglet Sauvegardes */}
        {activeTab === 'drafts' && (
          <div className="space-y-6">
            {/* En-tête des sauvegardes */}
            <Card className="bg-orange-50/50 border-orange-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <FileText className="h-6 w-6 mr-2 text-orange-600" />
                      Sauvegardes en cours
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {totalDrafts} formation{totalDrafts > 1 ? 's' : ''} en cours de saisie pour {Object.keys(draftsByPerson).length} personne{Object.keys(draftsByPerson).length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={draftAgeFilter}
                      onChange={e=>setDraftAgeFilter(e.target.value as any)}
                      className="border rounded-lg px-2 py-1 text-sm"
                      title="Filtrer par ancienneté"
                    >
                      <option value="all">Tous</option>
                      <option value="7">≤ 7 jours</option>
                      <option value="30">≤ 30 jours</option>
                      <option value="90">≤ 90 jours</option>
                    </select>
                    <Button
                      onClick={loadDrafts}
                      variant="outline"
                      disabled={loadingDrafts}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingDrafts ? 'animate-spin' : ''}`} />
                      Actualiser
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={async()=>{
                        // Purger >90j
                        const toDelete: any[] = [];
                        Object.values(draftsByPerson).forEach((arr:any[])=>{
                          arr.forEach(d=>{ if (isOlderThan(d.lastModified||d.createdAt, 90)) toDelete.push(d); });
                        });
                        if (toDelete.length>0 && window.confirm(`Supprimer ${toDelete.length} brouillon(s) > 90 jours ?`)){
                          for (const d of toDelete){ try{ await DatabaseService.deleteDraft(d.id);}catch{} }
                          await loadDrafts();
                        }
                      }}
                    >
                      Purger &gt;90j
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Liste des sauvegardes */}
            {totalDrafts === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Aucune sauvegarde en cours
                </h3>
                <p className="text-gray-500 mb-6">
                  Toutes les évaluations ont été terminées ou aucune n'est en cours de saisie.
                </p>
                <Button onClick={() => navigate('/evaluation')} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Évaluation
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(filteredDraftsByPerson).map(([personKey, personDrafts]) => (
                  <Card key={personKey} className="border-l-4 border-l-orange-500">
                    <div className="p-6">
                      {/* En-tête de la personne */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                            <User className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {personDrafts[0]?.personName}
                            </h3>
                            <p className="text-sm text-gray-600">{personDrafts[0]?.personEmail}</p>
                          </div>
                        </div>
                        <div className="bg-orange-100 px-3 py-1 rounded-full">
                          <span className="text-sm font-medium text-orange-700">
                            {personDrafts.length} formation{personDrafts.length > 1 ? 's' : ''} en cours
                          </span>
                        </div>
                      </div>

                      {/* Liste des formations en brouillon */}
                      <div className="grid gap-4">
                        {personDrafts.map((draft) => (
                          <div
                            key={draft.id}
                            className="bg-white p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-3">
                                  <div className="bg-orange-100 p-2 rounded-lg mr-3">
                                    <BookOpen className="h-5 w-5 text-orange-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-800 text-lg">
                                      {draft.formationTitle}
                                    </h4>
                                    <div className="flex items-center mt-1">
                                      <Hash className="h-3 w-3 text-gray-400 mr-1" />
                                      <span className="text-sm text-gray-500 font-mono">
                                        {draft.version}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="h-4 w-4 mr-2 text-green-500" />
                                    <span>
                                      <span className="font-medium">Créé:</span> {formatDate(draft.createdDate)}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="h-4 w-4 mr-2 text-orange-500" />
                                    <span>
                                      <span className="font-medium">Modifié:</span> {formatDate(draft.lastModified)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                                  Version {draft.version}
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex flex-col gap-2 ml-6">
                                <Button
                                  onClick={() => handleEditDraft(draft)}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Continuer
                                </Button>
                                <Button
                                  onClick={() => handleDeleteDraft(draft)}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Information sur les sauvegardes */}
        {activeTab === 'drafts' && (
          <Card className="bg-blue-50/50 border-blue-200">
            <div className="p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">À propos des sauvegardes</p>
                  <p>
                    Chaque personne peut avoir plusieurs formations en cours de saisie. 
                    Les sauvegardes sont organisées par personne et ne se chevauchent pas entre différentes formations.
                    Vous pouvez continuer ou supprimer une sauvegarde à tout moment.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Modales et formulaires */}
      {showExcelImportExport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-2xl font-bold text-gray-800">Modèle Excel Simplifié</h2>
              <button
                onClick={() => setShowExcelImportExport(false)}
                className="p-2 hover:bg-white/80 rounded-xl transition-colors border border-gray-200"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(95vh-100px)]">
              <ExcelImportExport onClose={() => setShowExcelImportExport(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'édition */}
      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <form onSubmit={handleUpdateMember} className="p-6">
              <h3 className="text-lg font-semibold mb-4">Modifier le membre</h3>
              
              <div className="space-y-4">
                <Input
                  label="Prénom"
                  value={editingMember.firstName || ''}
                  onChange={(e) => setEditingMember({...editingMember, firstName: e.target.value})}
                  required
                />
                <Input
                  label="Nom"
                  value={editingMember.lastName || ''}
                  onChange={(e) => setEditingMember({...editingMember, lastName: e.target.value})}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={editingMember.email || ''}
                  onChange={(e) => setEditingMember({...editingMember, email: e.target.value})}
                  required
                />
                <Input
                  label="Téléphone"
                  value={editingMember.phone || ''}
                  onChange={(e) => setEditingMember({...editingMember, phone: e.target.value})}
                />
                <Select
                  label="Fonction"
                  options={positions}
                  value={editingMember.position || ''}
                  onChange={(value) => setEditingMember({...editingMember, position: value})}
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingMember(null)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isOperating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isOperating ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}


      {showDetails && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold">
                  {showDetails.firstName?.[0] || 'N'}{showDetails.lastName?.[0] || 'N'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {showDetails.firstName || 'Prénom'} {showDetails.lastName || 'Nom'}
                  </h2>
                  <div className="text-sm text-gray-600">{showDetails.position}</div>
                </div>
              </div>
              <Button onClick={() => setShowDetails(null)} variant="outline" className="border-2">← Retour</Button>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Informations personnelles */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                      <User className="h-6 w-6 mr-3 text-blue-600" />
                      Informations personnelles
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center group">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">Nom complet</p>
                          <p className="text-lg font-semibold text-gray-900">{showDetails.firstName || 'Prénom'} {showDetails.lastName || 'Nom'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center group">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                          <Mail className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">Email</p>
                          <p className="text-lg font-semibold text-gray-900 break-all">{showDetails.email}</p>
                        </div>
                      </div>
                      
                      {showDetails.phone && (
                        <div className="flex items-center group">
                          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-orange-200 transition-colors">
                            <Phone className="h-6 w-6 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">Téléphone</p>
                            <p className="text-lg font-semibold text-gray-900">{showDetails.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Informations professionnelles */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                      <Users className="h-6 w-6 mr-3 text-green-600" />
                      Informations professionnelles
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center group">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-purple-200 transition-colors">
                          <Badge className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">Fonction</p>
                          <p className="text-lg font-semibold text-gray-900">{showDetails.position}</p>
                        </div>
                      </div>
                      
                      {showDetails.establishment && (
                        <div className="flex items-center group">
                          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-indigo-200 transition-colors">
                            <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">Établissement</p>
                            <p className="text-lg font-semibold text-gray-900">{showDetails.establishment}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Statistiques et performances */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                      <Award className="h-6 w-6 mr-3 text-orange-600" />
                      Performance et évaluations
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4 border border-orange-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total évaluations</p>
                            <p className="text-3xl font-bold text-orange-600">{showDetails.evaluationCount}</p>
                          </div>
                          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                            <Award className="h-8 w-8 text-orange-600" />
                          </div>
                        </div>
                      </div>
                      
                      {showDetails.evaluationCount > 0 && (
                        <div className="bg-white rounded-xl p-4 border border-green-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Statut</p>
                              <p className="text-lg font-semibold text-green-600">Actif</p>
                            </div>
                            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      )}
                      
                      {showDetails.latestEvaluation && (
                        <div className="bg-white rounded-xl p-4 border border-blue-100">
                          <p className="text-sm font-medium text-gray-600 mb-2">Dernière évaluation</p>
                          <p className="text-sm text-gray-700">
                            {formatDate(showDetails.latestEvaluation.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions rapides */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Actions rapides</h3>
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          setShowDetails(null);
                          handleAddEvaluation(showDetails);
                        }}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Nouvelle évaluation
                      </Button>
                      
                      <ButtonSmart
                        onClick={() => {
                          setShowDetails(null);
                          handleEditMember(showDetails);
                        }}
                        variant="outline"
                        className="w-full border-2 border-blue-300 text-blue-700 hover:bg-blue-50 py-3 rounded-xl font-medium transition-all duration-200"
                        label="Modifier les informations"
                        icon={<Edit className="h-5 w-5" />}
                      />
                    </div>
                  </div>
                  
                  {/* Commentaires/Observations */}
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                      <FileText className="h-6 w-6 mr-3 text-yellow-600" />
                      Commentaires/Observations
                    </h3>
                    
                    {/* Liste des commentaires existants */}
                    <div className="space-y-4 mb-6">
                      {(staffComments[showDetails.id] || []).length === 0 ? (
                        <p className="text-gray-500 italic text-sm bg-white/60 p-4 rounded-lg">
                          Aucun commentaire pour ce membre du personnel.
                        </p>
                      ) : (
                        (staffComments[showDetails.id] || []).map((comment: any) => (
                          <div key={comment.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-yellow-100 hover:shadow-md transition-shadow">
                            {editingComment && editingComment.id === comment.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={editingComment.text}
                                  onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-yellow-500"
                                  rows={3}
                                />
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateStaffComment(showDetails.id, comment.id, editingComment.text)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    Sauvegarder
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingComment(null)}
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-yellow-700">{comment.author}</span>
                                    <span className="text-xs text-gray-500">•</span>
                                    <span className="text-xs text-gray-500">{formatDate(comment.date)}</span>
                                    {comment.lastModified && (
                                      <span className="text-xs text-blue-600">(modifié le {formatDate(comment.lastModified)})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => setEditingComment(comment)}
                                      className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                                      title="Modifier ce commentaire"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteStaffComment(showDetails.id, comment.id)}
                                      className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                      title="Supprimer ce commentaire"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Formulaire d'ajout de commentaire */}
                    <div className="space-y-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ajouter un commentaire ou observation..."
                        className="w-full p-4 border border-yellow-300 rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 bg-white/80"
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={() => {
                            if (newComment.trim()) {
                              saveStaffComment(showDetails.id, newComment);
                            }
                          }}
                          disabled={!newComment.trim()}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter commentaire
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      )}
    </Layout>
  );
};
