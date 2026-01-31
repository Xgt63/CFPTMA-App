import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { DatabaseService } from '../services/database';
// import { FormationTheme } from '../types';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ProgressBar } from '../components/ui/ProgressBar';
import { CheckCircle, ArrowLeft, ArrowRight, Save, FileText, CheckSquare, Info } from 'lucide-react';

const steps = [
  'Informations Générales',
  'Détails Formation',
  'Contenu et Pédagogie',
  'Méthodes et Organisation',
  'Évaluation Objectifs',
  'Comportement et Compétences',
  'Impact Formation'
];

const genderOptions = [
  { value: '', label: 'Sélectionner...' },
  { value: 'Homme', label: 'Homme' },
  { value: 'Femme', label: 'Femme' }
];

// const positionOptions = [...];
// const establishmentOptions = [...];

const changesOptions = [
  'Amélioration des compétences techniques',
  'Meilleure communication avec l\'équipe',
  'Augmentation de la productivité',
  'Développement du leadership',
  'Innovation dans les méthodes de travail',
  'Amélioration de la gestion du temps'
];

export const Evaluation: React.FC = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedMember, setSelectedMember] = useState<null | { id: number; [key: string]: any }>(null);
  const [formationThemes, setFormationThemes] = useState<{ value: string; label: string }[]>([
    { value: '', label: 'Sélectionner...' }
  ]);
  const [isDraft, setIsDraft] = useState(false);
  const [existingDraftId, setExistingDraftId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showRecoveredBanner, setShowRecoveredBanner] = useState(false);
  const [lastRecoveredStep, setLastRecoveredStep] = useState<number | null>(null);

  // Nouvelle logique: phase initiale ou suivi
  const [activeSection, setActiveSection] = useState<'initial' | 'followUp'>('initial');
  const [initialEvaluationId, setInitialEvaluationId] = useState<number | null>(null);
  const [followUpCandidates, setFollowUpCandidates] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [followUpMap, setFollowUpMap] = useState<Record<number, any>>({});
  const [dueList, setDueList] = useState<any[]>([]);
  const [popoverId, setPopoverId] = useState<number | null>(null);

  // Calendrier de suivi (in-page)
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<number, string>>(() => {
    try { return JSON.parse(localStorage.getItem('followUpSchedules') || '{}'); } catch { return {}; }
  });
  const [calendarForId, setCalendarForId] = useState<number | null>(null);
  const [calendarDate, setCalendarDate] = useState<string>('');


  const openCalendar = (id: number, preset?: string) => {
    setCalendarForId(id);
    setCalendarDate((preset || '').slice(0,10));
  };
  const saveSchedule = (id: number, dateISO: string) => {
    const next = { ...scheduleOverrides, [id]: new Date(dateISO).toISOString() };
    setScheduleOverrides(next);
    try { 
      localStorage.setItem('followUpSchedules', JSON.stringify(next)); 
      window.dispatchEvent(new Event('followUpSchedulesUpdated'));
    } catch {}
  };

  const [formData, setFormData] = useState({
    fillDate: new Date().toISOString().split('T')[0],
    matricule: '',
    firstName: '',
    lastName: '',
    gender: '',
    phone: '',
    email: '',
    position: '',
    establishment: '',

    // Détails Formation
    formationTheme: '',
    trainingCenter: '',
    trainers: '',
    startDate: '',
    endDate: '',
    objectives: '',
    modules: '',
    expectedResults: '',

    // 🎯 Contenu et pédagogie (0-5)
    skillsAcquisition: 0,
    personalDevelopment: 0,
    courseClarity: 0,
    theoryPractice: 0,
    syllabusAdequacy: 0,
    practicalCases: 0,
    objectivesAchieved: 0,
    adaptedKnowledge: 0,
    
    // 📚 Méthodes et supports (0-5)
    pedagogicalSupport: 0,
    techniquesUsed: 0,
    presentation: 0,
    
    // 🕐 Organisation et logistique (0-5)
    logisticsConditions: 0,
    rhythm: 0,
    punctuality: 0,
    punctualityAssiduity: 0,
    
    // 🎯 Évaluation Objectifs (0-5) avec commentaires
    objectiveAchievement: 0,
    objectiveAchievementComment: '',
    relevanceToRole: 0,
    relevanceToRoleComment: '',
    expectationsMet: 0,
    expectationsMetComment: '',
    skillsDevelopment: 0,
    skillsDevelopmentComment: '',
    
    // 👥 Comportement et collaboration (0-5)
    teamworkSense: 0,
    motivationEnthusiasm: 0,
    communicationSociable: 0,
    communicationGeneral: 0,
    aptitudeChangeIdeas: 0,
    curiosity: 0,
    initiativeSpirit: 0,
    responsibilitySense: 0,
    
    // 🧠 Compétences cognitives et productivité (0-5)
    criticalAnalysis: 0,
    workExecution: 0,
    directivesComprehension: 0,
    workQuality: 0,
    subjectMastery: 0,

    // Impact Formation
    observedChanges: [] as string[],
    improvementSuggestions: '',
    postFormationActions: '',
    actionsSatisfaction: '',
    recommendationScore: 0,

    // Besoins Futurs
    needsAdditionalTraining: '',
    additionalTrainingDetails: '',
    requestedTrainings: [] as string[], // Nouveau champ pour 3 formations max
    noAdditionalTrainingReason: '',
    
    // ✅ Justification et observations
    justificationObservations: ''
  });

  useEffect(() => {
    // Pré-remplissage via navigation state (depuis Personnel)
    try {
      const pre = (location && (location as any).state && (location as any).state.prefill) || null;
      if (pre) {
        setSelectedMember({ id: Number(pre.id), ...pre });
        setFormData(prev => ({
          ...prev,
          matricule: pre.matricule || '',
          firstName: pre.firstName || '',
          lastName: pre.lastName || '',
          email: pre.email || '',
          phone: pre.phone || '',
          position: pre.position || '',
          establishment: pre.establishment || ''
        }));
      }
    } catch {}

    // Déterminer la section active via l'URL (phase)
    const urlParams = new URLSearchParams(window.location.search);
    const phaseParam = (urlParams.get('phase') || '').toLowerCase();
    if (phaseParam === 'followup') setActiveSection('followUp');
    const initialParam = urlParams.get('initial');
    if (initialParam && !isNaN(parseInt(initialParam))) {
      setInitialEvaluationId(parseInt(initialParam));
    }

    // Charger les thèmes de formation
    const loadThemes = async () => {
      try {
        const themes = await DatabaseService.getThemes();
        console.log('Thèmes chargés:', themes); // Debug
        
        if (themes && themes.length > 0) {
          const themeOptions = [
            { value: '', label: 'Sélectionner...' },
            ...themes.map((theme: any) => ({ value: theme.name, label: theme.name }))
          ];
          console.log('Options thèmes:', themeOptions); // Debug
          setFormationThemes(themeOptions);
        } else {
          console.log('Aucun thème trouvé, utilisation du fallback');
          const fallbackThemes = [
            { value: '', label: 'Sélectionner...' },
            { value: 'Leadership Management', label: 'Leadership Management' },
            { value: 'Communication Efficace', label: 'Communication Efficace' },
            { value: 'Gestion de Projet', label: 'Gestion de Projet' },
            { value: 'Innovation & Créativité', label: 'Innovation & Créativité' }
          ];
          console.log('Utilisation des thèmes de fallback:', fallbackThemes); // Debug
          setFormationThemes(fallbackThemes);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des thèmes:', error);
        // Fallback avec les thèmes par défaut
        const fallbackThemes = [
          { value: '', label: 'Sélectionner...' },
          { value: 'Leadership Management', label: 'Leadership Management' },
          { value: 'Communication Efficace', label: 'Communication Efficace' },
          { value: 'Gestion de Projet', label: 'Gestion de Projet' },
          { value: 'Innovation & Créativité', label: 'Innovation & Créativité' }
        ];
        console.log('Utilisation des thèmes de fallback:', fallbackThemes); // Debug
        setFormationThemes(fallbackThemes);
      }
    };

    loadThemes();

    // Charger tout le personnel (pour affichage des listes)
    (async () => {
      try {
        const staff = await DatabaseService.getStaff();
        setAllStaff(Array.isArray(staff) ? staff : []);
      } catch (e) {
        try { setAllStaff(JSON.parse(localStorage.getItem('staff') || '[]')); } catch {}
      }
    })();

    // Charger la liste des candidats au suivi
    const loadFollowUps = async () => {
      try {
        const candidates = await DatabaseService.getFollowUpCandidates(6);
        setFollowUpCandidates(candidates);
      } catch (e) {
        console.error('Erreur chargement candidats suivi:', e);
      }
    };
    loadFollowUps();

    // Nettoyage éventuel du popover à la navigation
    const onDocClick = (e: any) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-followup-popover]') && !t.closest('[data-followup-trigger]')) {
        setPopoverId(null);
      }
    };
    document.addEventListener('click', onDocClick);

    return () => {
      document.removeEventListener('click', onDocClick);
      setPopoverId(null);
    };

    // Vérifier les paramètres d'URL pour charger un brouillon spécifique
    const draftParam = urlParams.get('draft');
    
    if (draftParam && !isNaN(parseInt(draftParam))) {
      // Charger un brouillon spécifique par ID
      loadDraft(parseInt(draftParam));
    } else if (staffId) {
      // Si on a un staffId, récupérer les données du membre et vérifier s'il y a un brouillon
      try {
        const staff = JSON.parse(localStorage.getItem('staff') || '[]');
        if (Array.isArray(staff)) {
          const member = staff.find((m: any) => m?.id === staffId || m?.id === Number(staffId));
          if (member) {
            setSelectedMember(member);
            setFormData(prev => ({
              ...prev,
              matricule: member.matricule || '',
              firstName: member.firstName || '',
              lastName: member.lastName || '',
              email: member.email || '',
              phone: member.phone || '',
              position: member.position || '',
              establishment: member.establishment || ''
            }));
            
            // Charger un brouillon existant uniquement pour l'évaluation initiale
            if (activeSection !== 'followUp') {
              loadExistingDraft(Number(staffId));
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données du membre:', error);
      }
    }
  }, [staffId, activeSection, initialEvaluationId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Gérer les formations demandées (max 3)
  const handleTrainingChange = (index: number, value: string) => {
    setFormData(prev => {
      const newTrainings = [...prev.requestedTrainings];
      newTrainings[index] = value;
      return { ...prev, requestedTrainings: newTrainings };
    });
  };

  const addTraining = () => {
    if (formData.requestedTrainings.length < 3) {
      setFormData(prev => ({
        ...prev,
        requestedTrainings: [...prev.requestedTrainings, '']
      }));
    }
  };

  const removeTraining = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requestedTrainings: prev.requestedTrainings.filter((_, i) => i !== index)
    }));
  };

  // Charger un brouillon existant par ID
  const loadDraft = async (draftId: number) => {
    try {
      const evaluations = await DatabaseService.getEvaluations();
      const draft = evaluations.find((e: any) => e.id === draftId && e.status === 'draft');
      
      if (draft) {
        setExistingDraftId(draft.id);
        setIsDraft(true);
        
        // Charger les données du brouillon ET l'étape courante
        setFormData(prev => ({
          ...prev,
          ...draft,
          observedChanges: Array.isArray(draft.observedChanges) ? draft.observedChanges : [],
          requestedTrainings: Array.isArray(draft.requestedTrainings) ? draft.requestedTrainings : []
        }));
        
        // Restaurer l'étape où l'utilisateur s'était arrêté
        if (draft.currentStep !== undefined) {
          setCurrentStep(draft.currentStep);
          setLastRecoveredStep(draft.currentStep);
          setShowRecoveredBanner(true);
          console.log('Étape restaurée:', draft.currentStep);
        }
        
        // Si on a les infos du membre, les charger aussi
        if (draft.staffId) {
          const staff = await DatabaseService.getStaff();
          const member = staff.find((s: any) => s.id === draft.staffId);
          if (member) {
            setSelectedMember(member);
          }
        }
        
        console.log('Brouillon chargé par ID:', draft);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du brouillon:', error);
    }
  };

  // Charger un brouillon existant pour un membre donné
  const loadExistingDraft = async (staffMemberId: number) => {
    try {
      const drafts = await DatabaseService.getStaffEvaluationDrafts(staffMemberId);
      
      if (drafts.length > 0) {
        // S'il y a plusieurs brouillons, prendre le plus récent
        const sortedDrafts = drafts.sort((a: any, b: any) => 
          new Date(b.lastUpdated || b.createdAt).getTime() - 
          new Date(a.lastUpdated || a.createdAt).getTime()
        );
        const draft = sortedDrafts[0];
        
        setExistingDraftId(draft.id);
        setIsDraft(true);
        
        // Charger les données du brouillon
        setFormData(prev => ({
          ...prev,
          ...draft,
          observedChanges: Array.isArray(draft.observedChanges) ? draft.observedChanges : [],
          requestedTrainings: Array.isArray(draft.requestedTrainings) ? draft.requestedTrainings : []
        }));
        
        // Restaurer l'étape où l'utilisateur s'était arrêté
        if (draft.currentStep !== undefined) {
          setCurrentStep(draft.currentStep);
          setLastRecoveredStep(draft.currentStep);
          setShowRecoveredBanner(true);
          console.log('Étape restaurée pour le membre:', draft.currentStep);
        }
        
        console.log('Brouillon chargé pour le membre:', draft);
        
        // Afficher une notification à l'utilisateur
        if (drafts.length > 1) {
          console.log(`${drafts.length} brouillons trouvés pour ce membre. Chargement du plus récent.`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du brouillon:', error);
    }
  };

  // Sauvegarder en tant que brouillon
  const saveDraft = async () => {
    setIsSaving(true);
    try {
      // S'assurer qu'on a un membre sélectionné ou créer un nouveau membre si nécessaire
      let staffMemberId = selectedMember?.id;
      
      if (!selectedMember && formData.email) {
        // Créer un nouveau membre avec les données de base
        const existingStaff = await DatabaseService.getStaff();
        const existingMember = existingStaff.find((s: any) => s?.email === formData.email);
        
        if (existingMember) {
          staffMemberId = existingMember.id;
          setSelectedMember(existingMember);
        } else {
          // Créer un nouveau membre
          const newStaffData = {
            matricule: formData.matricule,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            position: formData.position,
            establishment: formData.establishment,
            gender: formData.gender
          };
          
          const newStaff = await DatabaseService.createStaff(newStaffData);
          staffMemberId = newStaff.id;
          setSelectedMember(newStaff);
        }
      }
      
      const draftData = {
        id: existingDraftId,
        staffId: staffMemberId,
        currentStep: currentStep, // Sauvegarder l'étape courante
        evaluationType: activeSection === 'followUp' ? 'followUp' : 'initial',
        initialEvaluationId: activeSection === 'followUp' ? initialEvaluationId : null,
        ...formData
      };
      
      // Si suivi, injecter les champs de suivi dans le draft
      const dataToSave = { ...draftData } as any;
      if (activeSection === 'followUp') {
        followUpCriteria.forEach(c => {
          dataToSave[c.key] = followUpData[c.key] || 0;
          const commentKey = (c.key + 'Comment') as `${FollowUpKey}Comment`;
          dataToSave[commentKey] = followUpData.comments[c.key] || '';
        });
        dataToSave.fu_total60 = followUpTotal60;
        dataToSave.fu_appreciationCode = appreciationCode;
        dataToSave.fu_appreciationLabel = appreciationLabel;
        dataToSave.fu_conclusionStaff = followUpData.conclusionStaff;
        dataToSave.fu_conclusionDirector = followUpData.conclusionDirector;
        dataToSave.fu_date = formData.fillDate;
      }

      const savedDraft = await DatabaseService.saveEvaluationDraft(dataToSave);
      setExistingDraftId(savedDraft.id);
      setIsDraft(true);
      
      console.log('Brouillon sauvegardé:', savedDraft);
      alert('Brouillon sauvegardé avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du brouillon:', error);
      alert('Erreur lors de la sauvegarde du brouillon.');
    } finally {
      setIsSaving(false);
    }
  };

  // Sauvegarde silencieuse périodique (auto-save)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        // construire un draft minimal sans affichage
        let staffMemberId = selectedMember?.id;
        const dataToSave: any = {
          id: existingDraftId,
          staffId: staffMemberId,
          currentStep,
          evaluationType: activeSection === 'followUp' ? 'followUp' : 'initial',
          initialEvaluationId: activeSection === 'followUp' ? initialEvaluationId : null,
          ...formData
        };
        await DatabaseService.saveEvaluationDraft(dataToSave);
      } catch {}
    }, 30000); // toutes les 30s
    return () => clearInterval(id);
  }, [formData, currentStep, selectedMember, existingDraftId, activeSection, initialEvaluationId]);

  // Mettre à jour la map de suivi et la liste des échéances
  useEffect(() => {
    const map: Record<number, any> = {};
    (followUpCandidates || []).forEach((c: any) => {
      const id = Number(c?.staff?.id);
      if (id) map[id] = c;
    });
    setFollowUpMap(map);
    setDueList((followUpCandidates || []).filter((c: any) => c.isDue));
  }, [followUpCandidates]);

  // === Suivi (6 mois) ===
  const followUpCriteria = [
    { key: 'fu_behaviorGeneral', label: 'Comportement général' },
    { key: 'fu_teamIntegration', label: "Intégration dans l’équipe" },
    { key: 'fu_motivationTenacity', label: 'Motivation – Ténacité au travail' },
    { key: 'fu_communication', label: 'Communication et relationnel' },
    { key: 'fu_curiosity', label: 'Curiosité' },
    { key: 'fu_initiativeCreativity', label: 'Initiative – Imagination – Créativité' },
    { key: 'fu_adaptedKnowledge', label: 'Connaissances et pratiques adaptées' },
    { key: 'fu_criticalAnalysis', label: 'Esprit critique et analyse' },
    { key: 'fu_technicalMastery', label: 'Maîtrise des compétences techniques et opérationnelles' },
    { key: 'fu_hierarchyRespect', label: 'Respect de la hiérarchie et instructions' },
    { key: 'fu_workQuality', label: 'Qualité du travail' },
    { key: 'fu_efficiency', label: 'Efficacité' },
    { key: 'fu_productivity', label: 'Productivité' },
    { key: 'fu_valuesRespect', label: 'Respect des valeurs du Centre' },
    { key: 'fu_commitment', label: 'Engagement envers le Centre' }
  ] as const;

  type FollowUpKey = typeof followUpCriteria[number]['key'];

  const [followUpData, setFollowUpData] = useState<{ [K in FollowUpKey]?: number } & {
    comments: { [K in FollowUpKey]?: string };
    conclusionStaff: string;
    conclusionDirector: string;
  }>({ comments: {}, conclusionStaff: '', conclusionDirector: '' });

  const setFollowUpScore = (key: FollowUpKey, score: number) => {
    setFollowUpData(prev => ({ ...prev, [key]: score }));
  };

  const setFollowUpComment = (key: FollowUpKey, comment: string) => {
    setFollowUpData(prev => ({ ...prev, comments: { ...prev.comments, [key]: comment } }));
  };

  const followUpSum = followUpCriteria.reduce((sum, c) => sum + (followUpData[c.key] || 0), 0);
  const followUpTotal60 = Math.round(((followUpSum) / (followUpCriteria.length * 5)) * 60);
  const followUpAverage = followUpCriteria.length ? (followUpSum / followUpCriteria.length) : 0;
  const appreciationCode = Math.max(1, Math.min(5, Math.round(followUpAverage)));
  const appreciationLabels: Record<number, string> = {
    1: 'Très insuffisant',
    2: 'Insuffisant',
    3: 'Moyen',
    4: 'Bon',
    5: 'Excellent'
  };
  const appreciationLabel = appreciationLabels[appreciationCode];

  // Calcul des moyennes par section
  const calculateSectionAverage = (fields: string[]) => {
    const values = fields.map(field => formData[field as keyof typeof formData] as number).filter(val => !isNaN(val));
    if (values.length === 0) return 0;
    return Number((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1));
  };

  const contentAverage = calculateSectionAverage([
    'skillsAcquisition', 'personalDevelopment', 'courseClarity', 'theoryPractice',
    'syllabusAdequacy', 'practicalCases', 'objectivesAchieved', 'adaptedKnowledge'
  ]);

  const methodsAverage = calculateSectionAverage([
    'pedagogicalSupport', 'techniquesUsed', 'presentation'
  ]);

  const organizationAverage = calculateSectionAverage([
    'logisticsConditions', 'rhythm', 'punctuality', 'punctualityAssiduity'
  ]);

  const behaviorAverage = calculateSectionAverage([
    'teamworkSense', 'motivationEnthusiasm', 'communicationSociable', 'communicationGeneral',
    'aptitudeChangeIdeas', 'curiosity', 'initiativeSpirit', 'responsibilitySense'
  ]);

  const cognitiveAverage = calculateSectionAverage([
    'criticalAnalysis', 'workExecution', 'directivesComprehension', 'workQuality', 'subjectMastery'
  ]);

  const overallAverage = Number(((contentAverage + methodsAverage + organizationAverage + behaviorAverage + cognitiveAverage) / 5).toFixed(1));

  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (checked) {
      if (formData.observedChanges.length < 4) {
        setFormData(prev => ({
          ...prev,
          observedChanges: [...prev.observedChanges, option]
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        observedChanges: prev.observedChanges.filter(change => change !== option)
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Informations Générales
        return !!
          (formData.fillDate &&
          formData.matricule &&
          formData.firstName &&
          formData.lastName &&
          formData.gender &&
          formData.phone &&
          formData.email &&
          formData.position &&
          formData.establishment);
      
      case 1: // Détails Formation
        return !!
          (formData.formationTheme &&
          formData.trainingCenter &&
          formData.trainers &&
          formData.startDate &&
          formData.endDate &&
          formData.objectives &&
          formData.modules &&
          formData.expectedResults);
      
      case 2: // Contenu et pédagogie
        return true; // Les notes peuvent être 0
      
      case 3: // Méthodes et organisation
        return true;
      
      case 4: // Comportement et compétences
        return true;
      
      case 5: // Impact Formation
        return !!
          (formData.observedChanges.length > 0 &&
          formData.improvementSuggestions &&
          formData.postFormationActions &&
          formData.actionsSatisfaction);
      
      case 6: // Besoins Futurs
        if (formData.needsAdditionalTraining === 'oui') {
          return !!formData.justificationObservations;
        } else if (formData.needsAdditionalTraining === 'non') {
          return !!formData.noAdditionalTrainingReason && !!formData.justificationObservations;
        }
        return false;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      // Proposer de sauvegarder en brouillon si validation échoue
      const shouldSave = confirm('Certains champs obligatoires ne sont pas remplis. Voulez-vous sauvegarder en tant que brouillon et continuer ?');
      if (shouldSave) {
        saveDraft();
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      try {
        console.log('Soumission de l\'évaluation:', formData);
        
        // S'assurer qu'on a un membre existant ou en créer un
        let staffMemberId = selectedMember?.id;
        if (!selectedMember && formData.email) {
          const existingStaff = await DatabaseService.getStaff();
          const safeExistingStaff = Array.isArray(existingStaff) ? existingStaff : [];
          const existingMember = safeExistingStaff.find((s: any) =>
            s?.email === formData.email
          );
          
          if (existingMember) {
            staffMemberId = existingMember.id;
            setSelectedMember(existingMember);
          } else {
            // Créer un nouveau membre
            const newMember = {
              matricule: formData.matricule || `MAT${Date.now()}`,
              firstName: formData.firstName,
              lastName: formData.lastName,
              position: formData.position,
              email: formData.email,
              phone: formData.phone,
              establishment: formData.establishment,
              gender: formData.gender,
              formationYear: new Date().getFullYear().toString()
            };
            const result = await DatabaseService.createStaff(newMember);
            staffMemberId = result.id || result.lastInsertRowid;
            setSelectedMember(result);
          }
        }
        
        const evaluationData = {
          staffId: staffMemberId,
          fillDate: formData.fillDate,
          evaluationType: activeSection === 'followUp' ? 'followUp' : 'initial',
          initialEvaluationId: activeSection === 'followUp' ? initialEvaluationId : null,
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender,
          phone: formData.phone,
          email: formData.email,
          position: formData.position,
          establishment: formData.establishment,
          formationTheme: formData.formationTheme,
          trainingCenter: formData.trainingCenter,
          trainers: formData.trainers,
          startDate: formData.startDate,
          endDate: formData.endDate,
          objectives: formData.objectives,
          modules: formData.modules,
          expectedResults: formData.expectedResults,
          // 🎯 Contenu et pédagogie
          skillsAcquisition: formData.skillsAcquisition,
          personalDevelopment: formData.personalDevelopment,
          courseClarity: formData.courseClarity,
          theoryPractice: formData.theoryPractice,
          syllabusAdequacy: formData.syllabusAdequacy,
          practicalCases: formData.practicalCases,
          objectivesAchieved: formData.objectivesAchieved,
          adaptedKnowledge: formData.adaptedKnowledge,
          // 📚 Méthodes et supports
          pedagogicalSupport: formData.pedagogicalSupport,
          techniquesUsed: formData.techniquesUsed,
          presentation: formData.presentation,
          // 🕐 Organisation et logistique
          logisticsConditions: formData.logisticsConditions,
          rhythm: formData.rhythm,
          punctuality: formData.punctuality,
          punctualityAssiduity: formData.punctualityAssiduity,
          // 👥 Comportement et collaboration
          teamworkSense: formData.teamworkSense,
          motivationEnthusiasm: formData.motivationEnthusiasm,
          communicationSociable: formData.communicationSociable,
          communicationGeneral: formData.communicationGeneral,
          aptitudeChangeIdeas: formData.aptitudeChangeIdeas,
          curiosity: formData.curiosity,
          initiativeSpirit: formData.initiativeSpirit,
          responsibilitySense: formData.responsibilitySense,
          // 🧠 Compétences cognitives et productivité
          criticalAnalysis: formData.criticalAnalysis,
          workExecution: formData.workExecution,
          directivesComprehension: formData.directivesComprehension,
          workQuality: formData.workQuality,
          subjectMastery: formData.subjectMastery,
          observedChanges: formData.observedChanges,
          improvementSuggestions: formData.improvementSuggestions,
          postFormationActions: formData.postFormationActions,
          actionsSatisfaction: formData.actionsSatisfaction,
          recommendationScore: formData.recommendationScore,
          needsAdditionalTraining: formData.needsAdditionalTraining,
          additionalTrainingDetails: formData.additionalTrainingDetails,
          requestedTrainings: formData.requestedTrainings,
          noAdditionalTrainingReason: formData.noAdditionalTrainingReason,
          justificationObservations: formData.justificationObservations
        } as any;

        if (activeSection === 'followUp') {
          // Champs spécifiques suivi
          followUpCriteria.forEach(c => {
            evaluationData[c.key] = followUpData[c.key] || 0;
            const commentKey = (c.key + 'Comment') as `${FollowUpKey}Comment`;
            (evaluationData as any)[commentKey] = followUpData.comments[c.key] || '';
          });
          evaluationData.fu_total60 = followUpTotal60;
          evaluationData.fu_appreciationCode = appreciationCode as any;
          evaluationData.fu_appreciationLabel = appreciationLabel;
          evaluationData.fu_conclusionStaff = followUpData.conclusionStaff;
          evaluationData.fu_conclusionDirector = followUpData.conclusionDirector;
          evaluationData.fu_date = formData.fillDate;
        }

        // Vérifier que l'email est présent
        if (!formData.email) {
          alert("L'email est obligatoire pour ajouter un personnel.");
          return;
        }
        
        // Si c'est un brouillon existant, le finaliser
        if (existingDraftId) {
          console.log('Finalisation du brouillon ID:', existingDraftId);
          await DatabaseService.completeEvaluation(existingDraftId, evaluationData);
          console.log('Évaluation finalisée avec succès');
        } else {
          // Créer une nouvelle évaluation complète
          console.log('Création d\'une nouvelle évaluation...');
          await DatabaseService.createEvaluation({ ...evaluationData, status: 'completed' });
          console.log('Évaluation créée avec succès');
        }
        
        setIsSubmitted(true);
        setTimeout(() => {
          navigate('/staff');
        }, 1500);
      } catch (error) {
        console.error('Erreur lors de la soumission:', error);
        alert('Erreur lors de l\'enregistrement de l\'évaluation');
      }
    } else {
      alert('Veuillez remplir tous les champs obligatoires.');
    }
  };

  if (isSubmitted) {
    return (
      <Layout title="Évaluation Terminée" subtitle="Merci pour votre participation">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-lg w-full text-center bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <Card className="max-w-lg w-full text-center bg-gradient-to-br from-green-50/90 via-emerald-50/90 to-green-100/90 backdrop-blur-xl border-green-200/50 shadow-2xl">
              <div className="p-12">
                <div className="w-24 h-24 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 bg-clip-text text-transparent mb-4">
                  Évaluation Enregistrée !
                </h2>
                <p className="text-gray-700 mb-6 text-lg font-medium">
                  {selectedMember 
                    ? `Nouvelle évaluation ajoutée pour ${selectedMember.firstName} ${selectedMember.lastName}`
                    : 'L\'évaluation de formation a été enregistrée avec succès.'
                  }
                </p>
                <p className="text-base text-gray-600 font-medium">
                  Redirection automatique vers la liste du personnel...
                </p>
              </div>
            </Card>
          </Card>
        </div>
      </Layout>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Informations Générales
        return (
          <div className="space-y-4">
            <Input
              label="Date de remplissage"
              type="date"
              value={formData.fillDate}
              onChange={(e) => handleInputChange('fillDate', e.target.value)}
              required
            />
            <Input
              label="Numéro Matricule"
              value={formData.matricule}
              onChange={(e) => handleInputChange('matricule', e.target.value)}
              placeholder="Ex: MAT2024001"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
              <Input
                label="Nom"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
            <Select
              label="Genre"
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              options={genderOptions}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Téléphone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fonction"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder="Ex: Manager, Formateur, Coordinateur..."
                required
              />
              <Input
                label="Établissement"
                value={formData.establishment}
                onChange={(e) => handleInputChange('establishment', e.target.value)}
                placeholder="Ex: Siège Social, Centre Paris..."
                required
              />
            </div>
          </div>
        );

      case 1: // Détails Formation
        return (
          <div className="space-y-4">
            <Select
              label="Thème de la formation"
              value={formData.formationTheme}
              onChange={(e) => handleInputChange('formationTheme', e.target.value)}
              options={formationThemes}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Centre de formation"
                value={formData.trainingCenter}
                onChange={(e) => handleInputChange('trainingCenter', e.target.value)}
                placeholder="Ex: Centre Paris, Institut de Formation..."
                required
              />
              <Input
                label="Formateur(s)"
                value={formData.trainers}
                onChange={(e) => handleInputChange('trainers', e.target.value)}
                placeholder="Ex: Marie Dupont, Jean Martin..."
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date de début"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
              />
              <Input
                label="Date de fin"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objectifs de la formation *
              </label>
              <textarea
                value={formData.objectives}
                onChange={(e) => handleInputChange('objectives', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modules traités *
              </label>
              <textarea
                value={formData.modules}
                onChange={(e) => handleInputChange('modules', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Résultats escomptés *
              </label>
              <textarea
                value={formData.expectedResults}
                onChange={(e) => handleInputChange('expectedResults', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                required
              />
            </div>
          </div>
        );

      case 2: // 🎯 Contenu et pédagogie
        const contentCriteria = [
          { key: 'skillsAcquisition', label: 'Acquisition de nouvelles compétences' },
          { key: 'personalDevelopment', label: 'Développement personnel / professionnel' },
          { key: 'courseClarity', label: 'Clarté du cours' },
          { key: 'theoryPractice', label: 'Théorie / pratique' },
          { key: 'syllabusAdequacy', label: 'Adéquation syllabus / besoins' },
          { key: 'practicalCases', label: 'Cas pratiques' },
          { key: 'objectivesAchieved', label: 'Objectifs atteints' },
          { key: 'adaptedKnowledge', label: 'Connaissances et pratiques adaptées' }
        ];

        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-blue-800">🎯 Contenu et pédagogie</h3>
                <div className="text-right">
                  <span className="text-sm text-blue-600">Moyenne: </span>
                  <span className="text-lg font-bold text-blue-800">{contentAverage}/5</span>
                </div>
              </div>
              <p className="text-sm text-blue-600">Évaluez la qualité du contenu et des méthodes pédagogiques</p>
            </div>
            {contentCriteria.map((criterion) => (
              <div key={criterion.key} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">{criterion.label}</h4>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">Note (0 à 5)
                    <Info className="h-4 w-4 text-blue-500" title="0=Non noté, 1=Faible, 3=Moyen, 5=Excellent" />
                  </label>
                  <div className="flex space-x-2">
                    {[0, 1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleInputChange(criterion.key, score)}
                        className={`w-10 h-10 rounded-full border-2 font-medium transition-all ${
                          formData[criterion.key as keyof typeof formData] === score
                            ? 'bg-[#0011ef] text-white border-[#0011ef]'
                            : 'border-gray-300 text-gray-600 hover:border-[#0011ef]'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 3: // 📚 Méthodes et supports + 🕐 Organisation et logistique
        const methodsCriteria = [
          { key: 'pedagogicalSupport', label: 'Support pédagogique' },
          { key: 'techniquesUsed', label: 'Techniques utilisées' },
          { key: 'presentation', label: 'Présentation' }
        ];
        
        const organizationCriteria = [
          { key: 'logisticsConditions', label: 'Logistique et conditions' },
          { key: 'rhythm', label: 'Rythme' },
          { key: 'punctuality', label: 'Ponctualité' },
          { key: 'punctualityAssiduity', label: 'Ponctualité et assiduité' }
        ];

        return (
          <div className="space-y-6">
            {/* Méthodes et supports */}
            <div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-green-800">📚 Méthodes et supports</h3>
                  <div className="text-right">
                    <span className="text-sm text-green-600">Moyenne: </span>
                    <span className="text-lg font-bold text-green-800">{methodsAverage}/5</span>
                  </div>
                </div>
                <p className="text-sm text-green-600">Évaluez la qualité des supports et méthodes utilisés</p>
              </div>
              <div className="space-y-4">
                {methodsCriteria.map((criterion) => (
                  <div key={criterion.key} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">{criterion.label}</h4>
                    <div className="flex space-x-2">
                      {[0, 1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleInputChange(criterion.key, score)}
                          className={`w-10 h-10 rounded-full border-2 font-medium transition-all ${
                            formData[criterion.key as keyof typeof formData] === score
                              ? 'bg-green-600 text-white border-green-600'
                              : 'border-gray-300 text-gray-600 hover:border-green-600'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Organisation et logistique */}
            <div>
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-orange-800">🕐 Organisation et logistique</h3>
                  <div className="text-right">
                    <span className="text-sm text-orange-600">Moyenne: </span>
                    <span className="text-lg font-bold text-orange-800">{organizationAverage}/5</span>
                  </div>
                </div>
                <p className="text-sm text-orange-600">Évaluez l'organisation et les conditions de formation</p>
              </div>
              <div className="space-y-4">
                {organizationCriteria.map((criterion) => (
                  <div key={criterion.key} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">{criterion.label}</h4>
                    <div className="flex space-x-2">
                      {[0, 1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleInputChange(criterion.key, score)}
                          className={`w-10 h-10 rounded-full border-2 font-medium transition-all ${
                            formData[criterion.key as keyof typeof formData] === score
                              ? 'bg-orange-600 text-white border-orange-600'
                              : 'border-gray-300 text-gray-600 hover:border-orange-600'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4: // 👥 Comportement et collaboration + 🧠 Compétences cognitives
        const behaviorCriteria = [
          { key: 'teamworkSense', label: 'Sens de travail en équipe' },
          { key: 'motivationEnthusiasm', label: 'Motivation : enthousiasme pour le travail' },
          { key: 'communicationSociable', label: 'Communication – sociable' },
          { key: 'communicationGeneral', label: 'Communication (générale)' },
          { key: 'aptitudeChangeIdeas', label: 'Aptitudes à changer les idées' },
          { key: 'curiosity', label: 'Curiosité' },
          { key: 'initiativeSpirit', label: 'Esprit d\'initiative' },
          { key: 'responsibilitySense', label: 'Sens de responsabilité' }
        ];
        
        const cognitiveCriteria = [
          { key: 'criticalAnalysis', label: 'Esprit critique et analyse' },
          { key: 'workExecution', label: 'Aptitude à exécuter un travail' },
          { key: 'directivesComprehension', label: 'Capacité à comprendre les directives' },
          { key: 'workQuality', label: 'Qualité de travail' },
          { key: 'subjectMastery', label: 'Maîtrise du sujet' }
        ];

        return (
          <div className="space-y-6">
            {/* Comportement et collaboration */}
            <div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-purple-800">👥 Comportement et collaboration</h3>
                  <div className="text-right">
                    <span className="text-sm text-purple-600">Moyenne: </span>
                    <span className="text-lg font-bold text-purple-800">{behaviorAverage}/5</span>
                  </div>
                </div>
                <p className="text-sm text-purple-600">Évaluez les compétences relationnelles et comportementales</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {behaviorCriteria.map((criterion) => (
                  <div key={criterion.key} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">{criterion.label}</h4>
                    <div className="flex space-x-1">
                      {[0, 1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleInputChange(criterion.key, score)}
                          className={`w-8 h-8 rounded-full border-2 font-medium transition-all text-sm ${
                            formData[criterion.key as keyof typeof formData] === score
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'border-gray-300 text-gray-600 hover:border-purple-600'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compétences cognitives */}
            <div>
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-indigo-800">🧠 Compétences cognitives et productivité</h3>
                  <div className="text-right">
                    <span className="text-sm text-indigo-600">Moyenne: </span>
                    <span className="text-lg font-bold text-indigo-800">{cognitiveAverage}/5</span>
                  </div>
                </div>
                <p className="text-sm text-indigo-600">Évaluez les capacités intellectuelles et la productivité</p>
              </div>
              <div className="space-y-4">
                {cognitiveCriteria.map((criterion) => (
                  <div key={criterion.key} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">{criterion.label}</h4>
                    <div className="flex space-x-2">
                      {[0, 1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleInputChange(criterion.key, score)}
                          className={`w-10 h-10 rounded-full border-2 font-medium transition-all ${
                            formData[criterion.key as keyof typeof formData] === score
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-300 text-gray-600 hover:border-indigo-600'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5: // Impact Formation
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Changements observés (maximum 4 choix) *
              </label>
              <div className="space-y-2">
                {changesOptions.map((change) => (
                  <label key={change} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.observedChanges.includes(change)}
                      onChange={(e) => handleCheckboxChange(change, e.target.checked)}
                      disabled={!formData.observedChanges.includes(change) && formData.observedChanges.length >= 4}
                      className="mr-3 h-4 w-4 text-[#0011ef] focus:ring-[#0011ef] border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{change}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggestions d'amélioration *
              </label>
              <textarea
                value={formData.improvementSuggestions}
                onChange={(e) => handleInputChange('improvementSuggestions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actions entreprises post-formation *
              </label>
              <textarea
                value={formData.postFormationActions}
                onChange={(e) => handleInputChange('postFormationActions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Satisfaction vis-à-vis des actions *
              </label>
              <textarea
                value={formData.actionsSatisfaction}
                onChange={(e) => handleInputChange('actionsSatisfaction', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommandation à un collègue (0 à 5) *
              </label>
              <div className="flex space-x-2">
                {[0, 1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleInputChange('recommendationScore', score)}
                    className={`w-10 h-10 rounded-full border-2 font-medium transition-all ${
                      formData.recommendationScore === score
                        ? 'bg-[#ff05f2] text-white border-[#ff05f2]'
                        : 'border-gray-300 text-gray-600 hover:border-[#ff05f2]'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 6: // Besoins Futurs
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Besoin de formation supplémentaire ? *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="needsAdditionalTraining"
                    value="oui"
                    checked={formData.needsAdditionalTraining === 'oui'}
                    onChange={(e) => handleInputChange('needsAdditionalTraining', e.target.value)}
                    className="mr-3 h-4 w-4 text-[#0011ef] focus:ring-[#0011ef]"
                  />
                  <span className="text-sm text-gray-700">Oui</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="needsAdditionalTraining"
                    value="non"
                    checked={formData.needsAdditionalTraining === 'non'}
                    onChange={(e) => handleInputChange('needsAdditionalTraining', e.target.value)}
                    className="mr-3 h-4 w-4 text-[#0011ef] focus:ring-[#0011ef]"
                  />
                  <span className="text-sm text-gray-700">Non</span>
                </label>
              </div>
            </div>

            {formData.needsAdditionalTraining === 'oui' && (
              <div className="space-y-4">
                {/* Champ pour citer jusqu'à 3 formations */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Formations demandées (jusqu'à 3 maximum)
                    </label>
                    {formData.requestedTrainings.length < 3 && (
                      <button
                        type="button"
                        onClick={addTraining}
                        className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg transition-colors"
                      >
                        + Ajouter une formation
                      </button>
                    )}
                  </div>
                  
                  {formData.requestedTrainings.length === 0 && (
                    <p className="text-sm text-gray-500 italic mb-3">
                      Cliquez sur "Ajouter une formation" pour spécifier les formations souhaitées
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    {formData.requestedTrainings.map((training, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={training}
                            onChange={(e) => handleTrainingChange(index, e.target.value)}
                            placeholder={`Formation ${index + 1}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTraining(index)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer cette formation"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {formData.requestedTrainings.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {formData.requestedTrainings.length}/3 formations ajoutées
                    </p>
                  )}
                </div>
              </div>
            )}

            {formData.needsAdditionalTraining === 'non' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expliquez *
                </label>
                <textarea
                  value={formData.noAdditionalTrainingReason}
                  onChange={(e) => handleInputChange('noAdditionalTrainingReason', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                  placeholder="Expliquez pourquoi aucune formation supplémentaire n'est nécessaire..."
                  required
                />
              </div>
            )}
            
            {/* Justification et observations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Justifier la note donnée / Observations *
              </label>
              <textarea
                value={formData.justificationObservations}
                onChange={(e) => handleInputChange('justificationObservations', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                placeholder="Justifiez vos évaluations et ajoutez vos observations générales..."
                required
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout 
      title={activeSection === 'followUp' ? 'Suivi post-évaluation' : (selectedMember ? `Nouvelle Évaluation - ${selectedMember.firstName} ${selectedMember.lastName}` : "Évaluation de Formation")} 
      subtitle={activeSection === 'followUp' ? "Liste des personnes évaluées avec possibilité de refaire l'évaluation (6 mois)" : (selectedMember ? "Ajout d'une nouvelle évaluation pour ce membre" : "Formulaire d'évaluation post-formation")}
    >
      <div className="max-w-5xl mx-auto">
        {/* Onglets sections */}
        <div className="mb-6 flex items-center space-x-2">
          <button
            className={`px-4 py-2 rounded-lg border ${activeSection === 'initial' ? 'bg-[#0011ef] text-white border-[#0011ef]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            onClick={() => setActiveSection('initial')}
          >
            1) Évaluation de formation
          </button>
          <button
            className={`px-4 py-2 rounded-lg border ${activeSection === 'followUp' ? 'bg-[#0011ef] text-white border-[#0011ef]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            onClick={() => setActiveSection('followUp')}
          >
            2) Suivi post-évaluation (6 mois)
          </button>
        </div>

        {activeSection === 'followUp' ? (
          (staffId || initialEvaluationId) ? (
            <Card className="bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => navigate('/evaluation?phase=followUp')}>
                    ← Revenir à la liste
                  </Button>
                  <h3 className="text-lg font-bold text-gray-800">Évaluation post-6 mois</h3>
                </div>
                <div className="text-sm text-gray-600">Total: <span className="font-semibold">{followUpTotal60}</span> / 60</div>
              </div>

              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-sm text-slate-700">Code d’appréciation global: <span className="font-semibold">{appreciationCode}</span> – {appreciationLabel}</div>
                <div className="text-xs text-slate-500 mt-1">Légende: 1 Très insuffisant • 2 Insuffisant • 3 Moyen • 4 Bon • 5 Excellent</div>
              </div>

              <div className="space-y-4">
                {followUpCriteria.map((c) => (
                  <div key={c.key} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">{c.label}</h4>
                        <div className="flex space-x-2">
                          {[1,2,3,4,5].map(score => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => setFollowUpScore(c.key as FollowUpKey, score)}
                              className={`w-10 h-10 rounded-full border-2 font-medium transition-all ${
                                (followUpData[c.key as FollowUpKey] || 0) === score
                                  ? 'bg-[#0011ef] text-white border-[#0011ef]'
                                  : 'border-gray-300 text-gray-600 hover:border-[#0011ef]'
                              }`}
                            >{score}</button>
                          ))}
                        </div>
                      </div>
                      <div className="w-1/2">
                        <label className="block text-xs text-gray-600 mb-1">Commentaire (optionnel)</label>
                        <textarea
                          rows={2}
                          value={followUpData.comments[c.key as FollowUpKey] || ''}
                          onChange={(e) => setFollowUpComment(c.key as FollowUpKey, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conclusion du personnel</label>
                  <textarea
                    rows={3}
                    value={followUpData.conclusionStaff}
                    onChange={(e) => setFollowUpData(prev => ({ ...prev, conclusionStaff: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conclusion du directeur</label>
                  <textarea
                    rows={3}
                    value={followUpData.conclusionDirector}
                    onChange={(e) => setFollowUpData(prev => ({ ...prev, conclusionDirector: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0011ef] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSubmit} className="px-8 py-3">Enregistrer le suivi</Button>
              </div>
            </Card>
          ) : (
          <Card className="bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Personnel et échéances de suivi (6 mois)</h3>
              <span className="text-sm text-gray-500">{allStaff.length} personnes</span>
            </div>

            {dueList.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-sm font-medium text-red-800">Alertes: suivi 6 mois échus</div>
                <div className="mt-1 text-sm text-red-700 space-y-1">
              {dueList.slice(0,5).map((d:any)=> (
                    <div key={d.staff?.id} className="flex items-center justify-between">
                      <span>{d.staff?.firstName} {d.staff?.lastName} — dû le {new Date(scheduleOverrides[d.staff?.id] || d.nextFollowUpDueAt).toLocaleDateString()}</span>
                      <Button size="sm" onClick={() => navigate(`/evaluation/${d.staff?.id}?phase=followUp&initial=${d.lastInitialEvaluation?.id}`)}>Lancer le suivi</Button>
                      <Button size="sm" variant="outline" className="ml-2" onClick={() => openCalendar(Number(d.staff?.id), scheduleOverrides[d.staff?.id] || d.nextFollowUpDueAt)}>Programmer</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="divide-y">
              {allStaff.map((person) => {
                const info = followUpMap[Number(person.id)];
                const hasInitial = !!info;
                const dueISO = scheduleOverrides[Number(person.id)] || info?.nextFollowUpDueAt || null;
                const dueAt = dueISO ? new Date(dueISO).getTime() : null;
                const now = Date.now();
                const diffDays = dueAt ? Math.ceil((dueAt - now)/(1000*60*60*24)) : null;
                const isDue = !!dueAt && dueAt <= now;
                return (
                  <div key={person.id} className="py-4 flex items-center justify-between relative">
                    <div>
                      <div className="font-medium text-gray-900">{person.firstName} {person.lastName}</div>
                      <div className="text-sm text-gray-600">
                        {hasInitial ? (
                          <>Dernière initiale: {new Date(info.lastCompletedAt).toLocaleDateString()} • Prochain suivi: {new Date(info.nextFollowUpDueAt).toLocaleDateString()}</>
                        ) : (
                          <span>Aucune évaluation initiale</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {hasInitial && (
                        <button
                          data-followup-trigger
                          className={`px-2 py-1 text-xs rounded ${isDue ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}
                          onClick={(e) => { e.stopPropagation(); setPopoverId(popoverId === Number(person.id) ? null : Number(person.id)); }}
                          title="Voir le temps restant"
                        >
                          {isDue ? 'Échu' : 'Délai'}
                        </button>
                      )}
                      <Button
                        disabled={!hasInitial}
                        onClick={() => navigate(`/evaluation/${person.id}?phase=followUp&initial=${info?.lastInitialEvaluation?.id || ''}`)}
                        className="px-4 py-2"
                      >
                        Suivi 6 mois
                      </Button>
                      {hasInitial && (
                        <Button variant="outline" size="sm" className="ml-2" onClick={() => openCalendar(Number(person.id), dueISO)}>Programmer</Button>
                      )}
                    </div>

                    {popoverId === Number(person.id) && hasInitial && (
                      <div data-followup-popover className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded shadow p-3 z-10">
                        <div className="text-sm text-gray-800 font-medium mb-1">État du suivi</div>
                        {dueAt ? (
                          !isDue ? (
                            <div className="text-sm text-gray-700">Temps restant avant le suivi: <span className="font-semibold">{diffDays} jour(s)</span></div>
                          ) : (
                            <div className="text-sm text-red-700">Suivi échu depuis <span className="font-semibold">{Math.abs(diffDays || 0)} jour(s)</span></div>
                          )
                        ) : (
                          <div className="text-sm text-gray-700">Aucune date programmée</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">Prochaine date: {dueISO ? new Date(dueISO).toLocaleDateString() : '-'}</div>
                      </div>
                    )}
                  </div>
                );
              })}
              {allStaff.length === 0 && (
                <div className="py-8 text-center text-gray-500">Aucun personnel trouvé.</div>
              )}
            </div>
          </Card>
        )) : null}
          {activeSection === 'initial' && (showRecoveredBanner || isDraft) && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-amber-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  📝 {showRecoveredBanner ? 'Brouillon récupéré' : "Brouillon en cours d'édition"}
                </p>
                <p className="text-xs text-amber-700">
                  Vos données sont automatiquement sauvegardées. Vous pouvez continuer l'évaluation plus tard.
                </p>
              </div>
            </div>
            {showRecoveredBanner && lastRecoveredStep !== null && (
              <Button size="sm" onClick={() => { setCurrentStep(lastRecoveredStep!); setShowRecoveredBanner(false); }} className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300">
                Continuer à l'étape {lastRecoveredStep + 1}
              </Button>
            )}
          </div>
        )}
        
        {activeSection === 'initial' && (
          <ProgressBar steps={steps} currentStep={currentStep} />
        )}
        
        {/* Résumé des moyennes */}
        {activeSection === 'initial' && (currentStep >= 2) && (
          <Card className="mb-6 bg-gradient-to-r from-gray-50 to-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Résumé des Évaluations</h3>
              <div className="text-right">
                <span className="text-sm text-gray-600">Moyenne Générale: </span>
                <span className="text-2xl font-bold text-indigo-600">{overallAverage}/5</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Contenu</div>
                <div className="text-xl font-bold text-blue-800">{contentAverage}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Méthodes</div>
                <div className="text-xl font-bold text-green-800">{methodsAverage}</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">Organisation</div>
                <div className="text-xl font-bold text-orange-800">{organizationAverage}</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Comportement</div>
                <div className="text-xl font-bold text-purple-800">{behaviorAverage}</div>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-sm text-indigo-600 font-medium">Cognitif</div>
                <div className="text-xl font-bold text-indigo-800">{cognitiveAverage}</div>
              </div>
            </div>
          </Card>
        )}
        
        {activeSection === 'initial' && (
          <Card title={steps[currentStep]} className="bg-gradient-to-br from-white/95 via-blue-50/50 to-purple-50/50 backdrop-blur-xl">
          {renderStepContent()}
          
            <div className="flex justify-between items-center mt-10 pt-8 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  // Aller à la 1ère section incomplète
                  const firstInvalid = [0,1,2,3,4,5,6].find(i => !validateStep(i));
                  if (firstInvalid !== undefined) setCurrentStep(firstInvalid);
                }}
                className="mr-auto text-sm"
              >Aller à la section incomplète</Button>
            <Button
              variant="secondary"
              onClick={currentStep === 0 ? () => navigate('/staff') : prevStep}
              className="flex items-center text-lg px-8 py-3"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentStep === 0 ? 'Retour au personnel' : 'Précédent'}
            </Button>
            
            {/* Bouton de sauvegarde en brouillon au centre */}
            <Button
              variant="secondary"
              onClick={saveDraft}
              disabled={isSaving}
              className="flex items-center text-sm px-6 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder brouillon'}
            </Button>
            
            <div className="flex space-x-3">
              {currentStep < steps.length - 1 ? (
                <Button onClick={nextStep} className="flex items-center text-lg px-8 py-3">
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg px-8 py-3 shadow-xl flex items-center"
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  {existingDraftId ? 'Finaliser l\'évaluation' : 'Terminer l\'évaluation'}
                </Button>
              )}
            </div>
          </div>
        </Card>
        )}
      </div>

      {/* Tuto / Aide rapide */}
      <div className="max-w-5xl mx-auto mt-8">
        <Card className="bg-gradient-to-r from-gray-50 to-slate-100 border-slate-200">
          <div className="p-4 text-sm text-gray-700 space-y-2">
            <div className="font-semibold">💡 Aide rapide</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>1) Évaluation de formation: remplissez les 7 étapes puis terminez pour enregistrer une évaluation complète. Vous pouvez sauvegarder un brouillon à tout moment.</li>
              <li>2) Suivi post-évaluation (6 mois): sélectionnez une personne dans la liste. Un badge “Échu” apparaît lorsque 6 mois sont dépassés. Cliquez sur “Suivi 6 mois” pour lancer l’évaluation de suivi.</li>
              <li>Astuce: utilisez le bouton “← Revenir à la liste” pour revenir rapidement à la liste des personnes éligibles au suivi.</li>
            </ul>
          </div>
        </Card>
      </div>
    {/* Calendrier de programmation du suivi */}
    {calendarForId !== null && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <h3 className="text-lg font-semibold mb-4">Programmer le suivi (6 mois)</h3>
          <div className="space-y-3">
            <label className="block text-sm text-gray-700">Date du suivi</label>
            <input type="date" value={calendarDate} onChange={(e)=>setCalendarDate(e.target.value)} className="border rounded-lg px-3 py-2 w-full" />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={()=>{ setCalendarForId(null); setCalendarDate(''); }}>Annuler</Button>
            <Button onClick={()=>{ if (calendarDate) { saveSchedule(calendarForId!, calendarDate); setCalendarForId(null); } }}>Enregistrer</Button>
          </div>
        </div>
      </div>
    )}
    
    </Layout>
  );
};

export default Evaluation;
