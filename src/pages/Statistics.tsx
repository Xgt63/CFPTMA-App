import React from 'react';
import { DatabaseService } from '../services/database';
import { useDataSync } from '../contexts/DataSyncContext';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, LineChart, Line, Brush, Legend } from 'recharts';
import { Eye, Users, User, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, RefreshCw, Brain, AlertTriangle, Target, Zap, Award, Download, MessageCircle, Edit, Trash2, Plus, FileText } from 'lucide-react';
import { advancedAnalytics, AdvancedAnalytics } from '../services/advancedAnalytics';
import { AIInsight, PerformancePrediction, EmployeeCluster } from '../services/aiEngine';
import { electronService } from '../services/electronService';

const COLORS = {
  primary: '#0011ef',
  secondary: '#ff05f2',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f97316',
  teal: '#14b8a6',
  pink: '#ec4899'
};

const PIE_COLORS = ['#0011ef', '#ff05f2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#14b8a6'];

export const Statistics: React.FC = () => {
  const { staff, evaluations, themes, forceRefresh, syncVersion } = useDataSync();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedPersonnel, setSelectedPersonnel] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'categories' | 'personnel' | 'gender' | 'ai-insights' | 'predictions' | 'risks'>('overview');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  // États pour l'IA
  const [aiAnalytics, setAiAnalytics] = React.useState<AdvancedAnalytics | null>(null);
  const [isAiProcessing, setIsAiProcessing] = React.useState(false);
  
  // États pour les commentaires/observations
  const [staffComments, setStaffComments] = React.useState<{[key: string]: any[]}>({});
  const [newComment, setNewComment] = React.useState('');
  const [editingComment, setEditingComment] = React.useState<any>(null);

  // Statistiques calculées
  const [overallStats, setOverallStats] = React.useState({
    totalEvaluations: 0,
    averageSatisfaction: 0,
    recommendationRate: 0,
    activeFormations: 0
  });

  const [categoryStats, setCategoryStats] = React.useState<any[]>([]);
  const [personnelStats, setPersonnelStats] = React.useState<any[]>([]);
  const [genderStats, setGenderStats] = React.useState<any[]>([]);
  const [formationStats, setFormationStats] = React.useState<any[]>([]);

  // Utils de calcul — placées avant toute utilisation pour éviter les erreurs de hoisting
  const calculateCategoryAverage = (evaluation: any, category: string) => {
    switch (category) {
      case 'content':
        return (
          (evaluation.skillsAcquisition || 0) + (evaluation.personalDevelopment || 0) + 
          (evaluation.courseClarity || 0) + (evaluation.theoryPractice || 0) + 
          (evaluation.syllabusAdequacy || 0) + (evaluation.practicalCases || 0) + 
          (evaluation.objectivesAchieved || 0) + (evaluation.adaptedKnowledge || 0)
        ) / 8;
      case 'methods':
        return (
          (evaluation.pedagogicalSupport || 0) + (evaluation.techniquesUsed || 0) + 
          (evaluation.presentation || 0)
        ) / 3;
      case 'organization':
        return (
          (evaluation.logisticsConditions || 0) + (evaluation.rhythm || 0) + 
          (evaluation.punctuality || 0) + (evaluation.punctualityAssiduity || 0)
        ) / 4;
      case 'behavior':
        return (
          (evaluation.teamworkSense || 0) + (evaluation.motivationEnthusiasm || 0) + 
          (evaluation.communicationSociable || 0) + (evaluation.communicationGeneral || 0) + 
          (evaluation.aptitudeChangeIdeas || 0) + (evaluation.curiosity || 0) + 
          (evaluation.initiativeSpirit || 0) + (evaluation.responsibilitySense || 0)
        ) / 8;
      case 'cognitive':
        return (
          (evaluation.criticalAnalysis || 0) + (evaluation.workExecution || 0) + 
          (evaluation.directivesComprehension || 0) + (evaluation.workQuality || 0) + 
          (evaluation.subjectMastery || 0)
        ) / 5;
      default:
        return 0;
    }
  };

  const calculateCategoryStats = (evaluations: any[]) => {
    const categories = [
      { key: 'content', name: '🎯 Contenu et Pédagogie', color: COLORS.primary },
      { key: 'methods', name: '📚 Méthodes et Supports', color: COLORS.success },
      { key: 'organization', name: '🕐 Organisation et Logistique', color: COLORS.warning },
      { key: 'behavior', name: '👥 Comportement et Collaboration', color: COLORS.secondary },
      { key: 'cognitive', name: '🧠 Compétences Cognitives', color: COLORS.info }
    ];

    return categories.map(category => {
      const avgScore = evaluations.reduce((sum, evaluation) => {
        return sum + calculateCategoryAverage(evaluation, category.key);
      }, 0) / (evaluations.length || 1);

      return {
        ...category,
        score: Number(avgScore.toFixed(1)),
        evaluations: evaluations.length
      };
    });
  };

  // Séparation initial vs suivi
  const evalInitial = React.useMemo(() => evaluations.filter(e => (e.evaluationType || 'initial') === 'initial'), [evaluations]);
  const evalFollowUp = React.useMemo(() => evaluations.filter(e => (e.evaluationType || 'initial') === 'followUp'), [evaluations]);

  const categoryStatsInitial = React.useMemo(() => evalInitial.length ? calculateCategoryStats(evalInitial) : [], [evalInitial]);
  const categoryStatsFollowUp = React.useMemo(() => evalFollowUp.length ? calculateCategoryStats(evalFollowUp) : [], [evalFollowUp]);

  const categoryComparisonData = React.useMemo(() => {
    if (!categoryStatsInitial.length && !categoryStatsFollowUp.length) return [] as any[];
    const byKey: any = {};
    categoryStatsInitial.forEach((c: any) => { byKey[c.key] = { name: c.name, initial: c.score, followUp: 0 }; });
    categoryStatsFollowUp.forEach((c: any) => { byKey[c.key] = { name: c.name, initial: byKey[c.key]?.initial || 0, followUp: c.score }; });
    return Object.values(byKey);
  }, [categoryStatsInitial, categoryStatsFollowUp]);

  // Évolutions des moyennes générales par personne (série multi-lignes)
  const [evolutionTopN, setEvolutionTopN] = React.useState(8);
  // Utilitaires
  const monthKey = (iso: string) => iso.slice(0,7);
  const average = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

  const perPersonEvolution = React.useMemo(() => {
    if (!evaluations || evaluations.length===0) return { rows: [], persons: [] as string[] };
    // Compter par personne
    const counts = new Map<string, number>();
    const byDateByPerson = new Map<string, Map<string, number>>(); // date -> person -> score

    const overallFor = (ev: any) => {
      // Réutilise le calcul existant: moyenne des catégories
      const contentAvg = calculateCategoryAverage(ev, 'content');
      const methodsAvg = calculateCategoryAverage(ev, 'methods');
      const organizationAvg = calculateCategoryAverage(ev, 'organization');
      const behaviorAvg = calculateCategoryAverage(ev, 'behavior');
      const cognitiveAvg = calculateCategoryAverage(ev, 'cognitive');
      return (contentAvg + methodsAvg + organizationAvg + behaviorAvg + cognitiveAvg) / 5;
    };

    evaluations.forEach(ev => {
      try {
        const name = `${ev.firstName || ''} ${ev.lastName || ''}`.trim();
        if (!name) return;
        counts.set(name, (counts.get(name)||0)+1);
        const d = new Date(ev.createdAt || ev.completedAt || ev.updatedAt).toISOString().slice(0,10);
        const score = Number(overallFor(ev).toFixed(2));
        if (!byDateByPerson.has(d)) byDateByPerson.set(d, new Map());
        byDateByPerson.get(d)!.set(name, score);
      } catch {}
    });

    // Top N personnes (par nb d'évaluations)
    const persons = Array.from(counts.entries()).sort((a,b)=> b[1]-a[1]).slice(0, evolutionTopN).map(([n])=>n);

    // Construire lignes: une par date, colonnes = personnes
    const rows: any[] = Array.from(byDateByPerson.keys()).sort().map(date => {
      const row: any = { date };
      persons.forEach(p => { row[p] = byDateByPerson.get(date)!.get(p) ?? null; });
      return row;
    });

    return { rows, persons };
  }, [evaluations, evolutionTopN]);

  // Contrôles de lisibilité
  const [personQuery, setPersonQuery] = React.useState('');
  const [groupMode, setGroupMode] = React.useState<'daily'|'monthly'>('daily');
  const [showGlobalAvg, setShowGlobalAvg] = React.useState(true);
  const [activeSeries, setActiveSeries] = React.useState<Set<string>>(new Set());

  // Données affichées selon filtres/groupement
  const evolutionView = React.useMemo(()=>{
    const persons = perPersonEvolution.persons.filter(n=> n.toLowerCase().includes(personQuery.toLowerCase()));
    // Agrégation mensuelle si demandé
    let rows = perPersonEvolution.rows;
    if (groupMode==='monthly'){
      const byMonth: Record<string, Record<string, number[]>> = {};
      rows.forEach(r=>{
        const m = monthKey(String(r.date));
        if (!byMonth[m]) byMonth[m] = {} as any;
        persons.forEach(p=>{
          const v = r[p];
          if (v !== null && v !== undefined){
            if (!byMonth[m][p]) byMonth[m][p] = [];
            byMonth[m][p].push(Number(v));
          }
        });
      });
      rows = Object.keys(byMonth).sort().map(m=>{
        const obj: any = { date: m };
        persons.forEach(p=>{ obj[p] = byMonth[m][p] ? Number(average(byMonth[m][p]).toFixed(2)) : null; });
        return obj;
      });
    } else {
      // Restreindre aux personnes filtrées
      rows = rows.map(r=>{
        const o: any = { date: r.date };
        persons.forEach(p=>{ o[p] = r[p] ?? null; });
        return o;
      });
    }

    // Série moyenne globale
    if (showGlobalAvg){
      rows = rows.map(r=>{
        const vals = persons.map(p=> r[p]).filter((x:any)=>x!==null && x!==undefined) as number[];
        const avg = Number(average(vals).toFixed(2));
        return { ...r, 'Moyenne Globale': vals.length ? avg : null };
      });
    }

    const series = showGlobalAvg ? [...persons, 'Moyenne Globale'] : persons;
    return { rows, series };
  }, [perPersonEvolution, personQuery, groupMode, showGlobalAvg]);


  const handleRefresh = async () => {
    console.log('Statistics: Actualisation manuelle des données... (syncVersion avant:', syncVersion, ')');
    console.log('Statistics: Données actuelles avant refresh:', {
      staff: staff.length,
      evaluations: evaluations.length,
      themes: themes.length,
      personnelStats: personnelStats.length
    });
    setIsRefreshing(true);
    forceRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
      console.log('Statistics: Refresh terminé (syncVersion après:', syncVersion, ')');
    }, 1500);
  };

  // Génération de l'analyse IA
  const generateAIAnalysis = async () => {
    if (evaluations.length === 0) {
      setAiAnalytics(null);
      return;
    }

    console.log('🤖 Statistics: Génération de l\'analyse IA...');
    setIsAiProcessing(true);
    
    try {
      const analytics = await advancedAnalytics.performAdvancedAnalysis(evaluations);
      setAiAnalytics(analytics);
      console.log('🤖 Statistics: Analyse IA terminée:', {
        insights: analytics.insights.length,
        predictions: analytics.predictions.length,
        clusters: analytics.clusters.length
      });
    } catch (error) {
      console.error('🤖 Statistics: Erreur lors de l\'analyse IA:', error);
      setAiAnalytics(null);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Charger les commentaires au démarrage
  React.useEffect(() => {
    const savedComments = JSON.parse(localStorage.getItem('staffComments') || '{}');
    setStaffComments(savedComments);
  }, []);

  React.useEffect(() => {
    console.log('Statistics useEffect - Données reçues (syncVersion:', syncVersion, '):', {
      evaluations: evaluations.length,
      staff: staff.length,
      themes: themes.length
    });
    
    // Toujours recalculer les statistiques quand les données changent (même vides)
    console.log('Statistics - Recalcul des statistiques avec syncVersion:', syncVersion);
    if (evaluations.length > 0) {
      // Recalculer les statistiques avec les données
      const totalEvaluations = evaluations.length;
      const avgSatisfaction = totalEvaluations > 0 ? calculateOverallAverage(evaluations) : 0;
      const recommendationRate = totalEvaluations > 0 ? Math.round(
        (evaluations.filter(e => (e?.recommendationScore || 0) >= 4).length / totalEvaluations) * 100
      ) : 0;
      
      setOverallStats({
        totalEvaluations,
        averageSatisfaction: Number(avgSatisfaction.toFixed(1)),
        recommendationRate,
        activeFormations: themes.length
      });

      // Statistiques par catégorie
      const categories = calculateCategoryStats(evaluations);
      setCategoryStats(categories);

      // Statistiques par personnel
      console.log('Statistics - Calcul des stats personnel avec', evaluations.length, 'évaluations');
      const personnel = calculatePersonnelStats(evaluations);
      console.log('Statistics - Personnel stats calculées:', personnel.length, 'personnes');
      setPersonnelStats(personnel);

      // Statistiques par genre
      const gender = calculateGenderStats(evaluations);
      setGenderStats(gender);

      // Statistiques par formation
      const formations = calculateFormationStats(evaluations);
      setFormationStats(formations);
      
      // Générer l'analyse IA
      generateAIAnalysis();
    } else {
      // Réinitialiser les statistiques si pas de données
      console.log('Statistics - Réinitialisation des statistiques (données vides)');
      setOverallStats({
        totalEvaluations: 0,
        averageSatisfaction: 0,
        recommendationRate: 0,
        activeFormations: themes.length
      });
      setCategoryStats([]);
      setPersonnelStats([]);
      setGenderStats([]);
      setFormationStats([]);
      setAiAnalytics(null);
    }
  }, [evaluations, staff, themes, syncVersion]);

  const calculateOverallAverage = (evaluations: any[]) => {
    if (evaluations.length === 0) return 0;
    
    const totalScore = evaluations.reduce((sum, evaluation) => {
      const contentAvg = calculateCategoryAverage(evaluation, 'content');
      const methodsAvg = calculateCategoryAverage(evaluation, 'methods');
      const organizationAvg = calculateCategoryAverage(evaluation, 'organization');
      const behaviorAvg = calculateCategoryAverage(evaluation, 'behavior');
      const cognitiveAvg = calculateCategoryAverage(evaluation, 'cognitive');
      
      return sum + (contentAvg + methodsAvg + organizationAvg + behaviorAvg + cognitiveAvg) / 5;
    }, 0);
    
    return totalScore / evaluations.length;
  };

  const calculatePersonnelStats = (evaluations: any[]) => {
    console.log('calculatePersonnelStats: Début calcul avec', evaluations.length, 'évaluations');
    const personnelMap = new Map();
    
    evaluations.forEach(evaluation => {
      const key = `${evaluation.firstName} ${evaluation.lastName}`;
      console.log('calculatePersonnelStats: Traitement de', key);
      
      // Vérifier si cette personne existe encore dans staff (optionnel - pour debug)
      const existsInStaff = staff.find(s => `${s.firstName} ${s.lastName}` === key);
      if (!existsInStaff) {
        console.log('calculatePersonnelStats: ATTENTION -', key, 'a des évaluations mais n\'existe plus dans staff');
      }
      
      if (!personnelMap.has(key)) {
        personnelMap.set(key, {
          name: key,
          position: evaluation.position,
          establishment: evaluation.establishment,
          evaluations: [],
          totalScore: 0,
          recommendationScore: 0
        });
      }
      
      const person = personnelMap.get(key);
      person.evaluations.push(evaluation);
      
      const overallScore = (
        calculateCategoryAverage(evaluation, 'content') +
        calculateCategoryAverage(evaluation, 'methods') +
        calculateCategoryAverage(evaluation, 'organization') +
        calculateCategoryAverage(evaluation, 'behavior') +
        calculateCategoryAverage(evaluation, 'cognitive')
      ) / 5;
      
      person.totalScore += overallScore;
      person.recommendationScore += evaluation.recommendationScore || 0;
    });

    const result = Array.from(personnelMap.values()).map(person => ({
      ...person,
      averageScore: Number((person.totalScore / person.evaluations.length).toFixed(1)),
      averageRecommendation: Number((person.recommendationScore / person.evaluations.length).toFixed(1)),
      evaluationCount: person.evaluations.length
    })).sort((a, b) => b.averageScore - a.averageScore);
    
    console.log('calculatePersonnelStats: Résultat final:', result.length, 'personnes');
    result.forEach(person => {
      console.log('calculatePersonnelStats: -', person.name, 'score:', person.averageScore);
    });
    
    return result;
  };

  const calculateGenderStats = (evaluations: any[]) => {
    const genderMap = new Map();
    
    evaluations.forEach(evaluation => {
      const gender = evaluation.gender || 'Non spécifié';
      if (!genderMap.has(gender)) {
        genderMap.set(gender, {
          gender,
          count: 0,
          totalScore: 0,
          recommendationScore: 0
        });
      }
      
      const genderData = genderMap.get(gender);
      genderData.count++;
      
      const overallScore = (
        calculateCategoryAverage(evaluation, 'content') +
        calculateCategoryAverage(evaluation, 'methods') +
        calculateCategoryAverage(evaluation, 'organization') +
        calculateCategoryAverage(evaluation, 'behavior') +
        calculateCategoryAverage(evaluation, 'cognitive')
      ) / 5;
      
      genderData.totalScore += overallScore;
      genderData.recommendationScore += evaluation.recommendationScore || 0;
    });

    return Array.from(genderMap.values()).map(genderData => ({
      ...genderData,
      averageScore: Number((genderData.totalScore / genderData.count).toFixed(1)),
      averageRecommendation: Number((genderData.recommendationScore / genderData.count).toFixed(1)),
      percentage: Math.round((genderData.count / evaluations.length) * 100)
    }));
  };

  const calculateFormationStats = (evaluations: any[]) => {
    const formationMap = new Map();
    
    evaluations.forEach(evaluation => {
      const formation = evaluation.formationTheme;
      if (!formationMap.has(formation)) {
        formationMap.set(formation, {
          formation,
          count: 0,
          totalScore: 0,
          recommendationScore: 0
        });
      }
      
      const formationData = formationMap.get(formation);
      formationData.count++;
      
      const overallScore = (
        calculateCategoryAverage(evaluation, 'content') +
        calculateCategoryAverage(evaluation, 'methods') +
        calculateCategoryAverage(evaluation, 'organization') +
        calculateCategoryAverage(evaluation, 'behavior') +
        calculateCategoryAverage(evaluation, 'cognitive')
      ) / 5;
      
      formationData.totalScore += overallScore;
      formationData.recommendationScore += evaluation.recommendationScore || 0;
    });

    return Array.from(formationMap.values()).map(formationData => ({
      ...formationData,
      averageScore: Number((formationData.totalScore / formationData.count).toFixed(1)),
      averageRecommendation: Number((formationData.recommendationScore / formationData.count).toFixed(1))
    })).sort((a, b) => b.averageScore - a.averageScore);
  };

  // Fonctions pour le barème et les remarques
  const getPerformanceLevel = (score: number) => {
      if (score >= 0 && score <= 2.4) return { level: 'Faible', color: 'text-red-600 bg-red-50', badge: 'bg-red-500' };
      if (score >= 2.5 && score <= 3.4) return { level: 'Moyenne', color: 'text-orange-600 bg-orange-50', badge: 'bg-orange-500' };
      if (score >= 3.5 && score <= 5) return { level: 'Excellent', color: 'text-green-600 bg-green-50', badge: 'bg-green-500' };
    return { level: 'Non évalué', color: 'text-gray-600 bg-gray-50', badge: 'bg-gray-500' };
  };

  const getRecommendation = (score: number) => {
    if (score >= 0 && score <= 2.5) return 'Besoin urgent de formation supplémentaire et de suivi rapproché';
    if (score >= 2.6 && score <= 3.5) return 'Améliorations possibles - Suivi et formation ciblée recommandés';
    if (score >= 3.6 && score <= 5) return 'Performance satisfaisante - Maintenir le niveau et encourager';
    return 'Aucune évaluation disponible';
  };

  // Statistiques enrichies avec barème
  const personnelStatsWithLevel = personnelStats.map(person => ({
    ...person,
    performance: getPerformanceLevel(person.averageScore),
    recommendation: getRecommendation(person.averageScore)
  }));

  const getCategoryDetails = (categoryKey: string) => {
    const criteriaMap = {
      content: [
        'Acquisition de nouvelles compétences',
        'Développement personnel / professionnel',
        'Clarté du cours',
        'Théorie / pratique',
        'Adéquation syllabus / besoins',
        'Cas pratiques',
        'Objectifs atteints',
        'Connaissances et pratiques adaptées'
      ],
      methods: [
        'Support pédagogique',
        'Techniques utilisées',
        'Présentation'
      ],
      organization: [
        'Logistique et conditions',
        'Rythme',
        'Ponctualité',
        'Ponctualité et assiduité'
      ],
      behavior: [
        'Sens de travail en équipe',
        'Motivation : enthousiasme pour le travail',
        'Communication – sociable',
        'Communication (générale)',
        'Aptitudes à changer les idées',
        'Curiosité',
        'Esprit d\'initiative',
        'Sens de responsabilité'
      ],
      cognitive: [
        'Esprit critique et analyse',
        'Aptitude à exécuter un travail',
        'Capacité à comprendre les directives',
        'Qualité de travail',
        'Maîtrise du sujet'
      ]
    };

    const fieldMap = {
      content: ['skillsAcquisition', 'personalDevelopment', 'courseClarity', 'theoryPractice', 'syllabusAdequacy', 'practicalCases', 'objectivesAchieved', 'adaptedKnowledge'],
      methods: ['pedagogicalSupport', 'techniquesUsed', 'presentation'],
      organization: ['logisticsConditions', 'rhythm', 'punctuality', 'punctualityAssiduity'],
      behavior: ['teamworkSense', 'motivationEnthusiasm', 'communicationSociable', 'communicationGeneral', 'aptitudeChangeIdeas', 'curiosity', 'initiativeSpirit', 'responsibilitySense'],
      cognitive: ['criticalAnalysis', 'workExecution', 'directivesComprehension', 'workQuality', 'subjectMastery']
    };

    const criteria = criteriaMap[categoryKey] || [];
    const fields = fieldMap[categoryKey] || [];

    return criteria.map((criterion, index) => {
      const field = fields[index];
      const avgScore = evaluations.reduce((sum, evaluation) => {
        return sum + (evaluation[field] || 0);
      }, 0) / evaluations.length;

      return {
        criterion,
        score: Number(avgScore.toFixed(1))
      };
    });
  };

  const getPersonnelDetails = (personnelName: string) => {
    const personnelEvaluations = evaluations.filter(e => 
      `${e.firstName} ${e.lastName}` === personnelName
    );

    if (personnelEvaluations.length === 0) return [];

    return personnelEvaluations.map(evaluation => ({
      date: new Date(evaluation.createdAt).toLocaleDateString('fr-FR'),
      formation: evaluation.formationTheme,
      evaluationType: evaluation.evaluationType || 'initial',
      followUpTotal60: evaluation.fu_total60 || null,
      contentScore: calculateCategoryAverage(evaluation, 'content'),
      methodsScore: calculateCategoryAverage(evaluation, 'methods'),
      organizationScore: calculateCategoryAverage(evaluation, 'organization'),
      behaviorScore: calculateCategoryAverage(evaluation, 'behavior'),
      cognitiveScore: calculateCategoryAverage(evaluation, 'cognitive'),
      recommendationScore: evaluation.recommendationScore || 0
    }));
  };

  // Fonctions pour gérer les commentaires/observations
  const saveStaffComment = async (personnelName: string, comment: string) => {
    try {
      // Trouver l'ID du membre du personnel par son nom
      const member = staff.find(s => `${s.firstName} ${s.lastName}` === personnelName);
      const staffId = member?.id?.toString() || personnelName;
      
      const commentData = {
        id: Date.now().toString(),
        text: comment.trim(),
        date: new Date().toISOString(),
        author: 'Statistiques' // ou récupérer l'utilisateur connecté
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
      
      console.log('Commentaire sauvegardé pour:', personnelName);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du commentaire:', error);
      alert('Erreur lors de la sauvegarde du commentaire.');
    }
  };

  const updateStaffComment = async (personnelName: string, commentId: string, newText: string) => {
    try {
      const member = staff.find(s => `${s.firstName} ${s.lastName}` === personnelName);
      const staffId = member?.id?.toString() || personnelName;
      
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
      
      console.log('Commentaire modifié pour:', personnelName);
    } catch (error) {
      console.error('Erreur lors de la modification du commentaire:', error);
      alert('Erreur lors de la modification du commentaire.');
    }
  };

  const deleteStaffComment = async (personnelName: string, commentId: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) {
      try {
        const member = staff.find(s => `${s.firstName} ${s.lastName}` === personnelName);
        const staffId = member?.id?.toString() || personnelName;
        
        const currentComments = staffComments[staffId] || [];
        const updatedComments = currentComments.filter(comment => comment.id !== commentId);
        
        const allComments = {
          ...staffComments,
          [staffId]: updatedComments
        };
        
        setStaffComments(allComments);
        localStorage.setItem('staffComments', JSON.stringify(allComments));
        
        console.log('Commentaire supprimé pour:', personnelName);
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

  return (
    <Layout 
      title="Statistiques et Analyses Détaillées" 
      subtitle="Tableaux de bord interactifs et métriques de performance"
    >
      <div key={syncVersion} className="space-y-6">
        {/* Tabs Navigation */}
        <Card className="bg-gradient-to-r from-white/95 to-blue-50/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Analyses et Tableaux de Bord</h3>
            <div className="flex gap-2">
              <Button 
                onClick={handleRefresh}
                variant="secondary" 
                size="sm"
                className="flex items-center text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Actualiser les statistiques"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              
              {/* Boutons de test - seulement en développement */}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'categories'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PieChartIcon className="w-4 h-4 mr-2" />
              Par Catégories
            </button>
            <button
              onClick={() => setActiveTab('personnel')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'personnel'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Par Personnel
            </button>
            <button
              onClick={() => setActiveTab('gender')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'gender'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Par Genre
            </button>
            <button
              onClick={() => setActiveTab('ai-insights')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'ai-insights'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Insights générés par IA"
              data-tab="ai-insights"
            >
              <Brain className="w-4 h-4 mr-2" />
              IA Insights
              {isAiProcessing && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-1" />}
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'predictions'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Prédictions de performance"
            >
              <Target className="w-4 h-4 mr-2" />
              Prédictions
            </button>
            <button
              onClick={() => setActiveTab('risks')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'risks'
                  ? 'bg-white/90 backdrop-blur-sm text-[#0011ef] shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Matrice de risques et opportunités"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Risques & Opportunités
            </button>
          </div>
        </Card>

        {/* Key Metrics */}
        <div key={`metrics-${syncVersion}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-110 transition-all duration-300">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{overallStats.averageSatisfaction}</div>
              <div className="text-sm opacity-90">Satisfaction Moyenne</div>
              <div className="text-xs opacity-75 mt-1">/ 5</div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:scale-110 transition-all duration-300">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{overallStats.totalEvaluations}</div>
              <div className="text-sm opacity-90">Évaluations Totales</div>
              <div className="text-xs opacity-75 mt-1">Total enregistré</div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white hover:scale-110 transition-all duration-300">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{overallStats.recommendationRate}%</div>
              <div className="text-sm opacity-90">Taux de Recommandation</div>
              <div className="text-xs opacity-75 mt-1">Score ≥ 4/5</div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white hover:scale-110 transition-all duration-300">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{overallStats.activeFormations}</div>
              <div className="text-sm opacity-90">Formations Enregistrées</div>
              <div className="text-xs opacity-75 mt-1">Thèmes configurés</div>
            </div>
          </Card>
          
          {/* Métriques IA */}
          <Card className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white hover:scale-110 transition-all duration-300">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {aiAnalytics?.insights.filter(i => i.severity === 'high' || i.severity === 'critical').length || 0}
              </div>
              <div className="text-sm opacity-90">Alertes Critiques</div>
              <div className="text-xs opacity-75 mt-1">IA Détectées</div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-violet-500 to-purple-500 text-white hover:scale-110 transition-all duration-300">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {aiAnalytics?.predictions.filter(p => p.trend === 'declining').length || 0}
              </div>
              <div className="text-sm opacity-90">Risques Prédits</div>
              <div className="text-xs opacity-75 mt-1">Tendances négatives</div>
            </div>
          </Card>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Évolutions des moyennes générales par personne */}
            <Card title="📈 Évolutions des Moyennes Générales (par personne)" className="bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="text-sm text-gray-600">Top {evolutionTopN} personnes par nombre d'évaluations</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Top</span>
                  <select value={evolutionTopN} onChange={e=>setEvolutionTopN(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                    {[5,8,10,15].map(n=>(<option key={n} value={n}>{n}</option>))}
                  </select>
                  <span className="text-sm text-gray-600 ml-3">Grouper</span>
                  <select value={groupMode} onChange={e=>setGroupMode(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
                    <option value="daily">Quotidien</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                  <label className="ml-3 inline-flex items-center gap-1 text-sm text-gray-700">
                    <input type="checkbox" checked={showGlobalAvg} onChange={e=>setShowGlobalAvg(e.target.checked)} />
                    Moyenne Globale
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <input value={personQuery} onChange={e=>setPersonQuery(e.target.value)} placeholder="Filtrer par nom..." className="border rounded px-3 py-1 text-sm w-72" />
                <span className="text-xs text-gray-500">Astuce: cliquez sur la légende pour afficher/masquer une courbe</span>
              </div>
              <div className="h-[460px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionView.rows} margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0,5]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v)=>[`${v}/5`,`Score`]} labelFormatter={(l)=>`Date: ${l}`} />
                    <Legend onClick={(e:any)=>{
                      const name = e?.dataKey; if (!name) return;
                      setActiveSeries(prev=>{
                        const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n;
                      });
                    }} />
                    {evolutionView.series.map((name, idx) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        strokeWidth={name==='Moyenne Globale'?4:3}
                        stroke={name==='Moyenne Globale'? '#111827' : PIE_COLORS[idx % PIE_COLORS.length]}
                        strokeOpacity={0.95}
                        dot={{ r: 1.5, strokeWidth: 0 }}
                        activeDot={{ r: 4 }}
                        connectNulls
                        hide={activeSeries.size>0 && !activeSeries.has(name)}
                      />
                    ))}
                    <Brush dataKey="date" height={20} stroke="#9CA3AF" travellerWidth={8} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-gray-500 mt-2">Chaque ligne représente l'évolution de la moyenne générale d'une personne (0-5). Utilisez le filtre, le groupement mensuel et la légende pour explorer.</div>
            </Card>

            {/* Graphique Global des Performances */}
            <Card title="📊 Analyse Globale des Performances" className="bg-gradient-to-br from-blue-50 to-indigo-50">
              {evaluations.length > 0 ? (
                <div className="space-y-6">
                  {/* Distribution des Performances par Catégorie */}
                  <div className="h-96">
                    <h4 className="text-lg font-semibold mb-4 text-gray-800">Distribution des Moyennes par Catégorie</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value) => [`${value}/5`, 'Moyenne']}
                          labelFormatter={(label) => `Catégorie: ${label}`}
                        />
                        <Bar 
                          dataKey="score" 
                          fill={COLORS.primary}
                          radius={[4, 4, 0, 0]}
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.score >= 3.5 ? COLORS.success :
                                entry.score >= 2.5 ? COLORS.warning : COLORS.danger
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Section supprimée: Performance Individuelle du Personnel */}

                  {/* Comparatif Initial vs Suivi (6 mois) */}
                  <Card title="Comparatif Initial vs Suivi (6 mois)" className="bg-white">
                    {categoryComparisonData.length > 0 ? (
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoryComparisonData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} />
                            <YAxis domain={[0,5]} />
                            <Tooltip />
                            <Bar dataKey="initial" name="Initiale" fill={COLORS.primary} radius={[4,4,0,0]} />
                            <Bar dataKey="followUp" name="Suivi 6 mois" fill={COLORS.teal} radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="text-xs text-gray-500 mt-2">Initiale en bleu • Suivi en vert</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 p-4">Pas encore de données de suivi.</div>
                    )}
                  </Card>

                  {/* Répartition des Niveaux de Performance */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80">
                      <h4 className="text-lg font-semibold mb-4 text-gray-800">Répartition par Niveau</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { 
                                name: 'Excellent (3.5-5)', 
                                value: personnelStats.filter(p => p.averageScore >= 3.5).length,
                                fill: COLORS.success
                              },
                              { 
                                name: 'Moyen (2.5-3.4)', 
                                value: personnelStats.filter(p => p.averageScore >= 2.5 && p.averageScore < 3.5).length,
                                fill: COLORS.warning
                              },
                              { 
                                name: 'Faible (0-2.4)', 
                                value: personnelStats.filter(p => p.averageScore < 2.5).length,
                                fill: COLORS.danger
                              }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          >
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-80">
                      <h4 className="text-lg font-semibold mb-4 text-gray-800">Évolution Temporelle</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={evaluations
                            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                            .map((evaluation, index) => ({
                              index: index + 1,
                              score: calculateOverallAverage([evaluation]),
                              date: new Date(evaluation.createdAt).toLocaleDateString('fr-FR')
                            }))
                            .slice(-20) // Dernieres 20 évaluations
                          }
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="index" 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value) => [`${Number(value).toFixed(1)}/5`, 'Score']}
                            labelFormatter={(label) => `Évaluation #${label}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke={COLORS.primary} 
                            strokeWidth={3}
                            dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        Dernières 20 évaluations
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune donnée disponible</h3>
                  <p className="text-gray-500">Les graphiques s'afficheront une fois que des évaluations seront enregistrées.</p>
                </div>
              )}
            </Card>

            {/* Tableau des Moyennes Générales */}
            <Card title="🏆 Tableau des Moyennes Générales" className="bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="mb-4 p-4 bg-white rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-bold text-indigo-800 mb-2">Barème d'Évaluation</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                          <span><strong>0-2,4 :</strong> Faible</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span><strong>2,5-3,4 :</strong> Moyenne</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span><strong>3,5-5 :</strong> Excellent</span>
                  </div>
                </div>
              </div>
              <div key={`table-${syncVersion}`} className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Personnel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Fonction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Moyenne Générale
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Niveau
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Remarque Automatique
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {personnelStatsWithLevel.map((person, index) => (
                      <tr key={person.name} className={`hover:bg-gray-50 ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                      }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {index < 3 && (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 ${
                                index === 0 ? 'bg-yellow-500' : 
                                index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                              }`}>
                                {index + 1}
                              </div>
                            )}
                            <div className="font-medium text-gray-900">{person.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {person.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-2xl font-bold text-indigo-600 mr-2">
                              {person.averageScore}
                            </span>
                            <span className="text-gray-500">/5</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${person.performance.badge}`}></div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${person.performance.color}`}>
                              {person.performance.level}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-xs">
                            {person.recommendation}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Statistiques de répartition */}
              <div key={`repartition-${syncVersion}`} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-800">Niveau Faible</p>
                      <p className="text-2xl font-bold text-red-600">
                        {personnelStatsWithLevel.filter(p => p.performance.level === 'Faible').length}
                      </p>
                    </div>
                    <div className="text-red-400">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-800">Niveau Moyen</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {personnelStatsWithLevel.filter(p => p.performance.level === 'Moyenne').length}
                      </p>
                    </div>
                    <div className="text-orange-400">
                      <Activity className="w-8 h-8" />
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Niveau Excellent</p>
                      <p className="text-2xl font-bold text-green-600">
                        {personnelStatsWithLevel.filter(p => p.performance.level === 'Excellent').length}
                      </p>
                    </div>
                    <div className="text-green-400">
                      <Users className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Satisfaction par Formation">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formationStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formation" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value}/5`, 
                        name === 'averageScore' ? 'Satisfaction' : 'Recommandation'
                      ]}
                    />
                    <Bar dataKey="averageScore" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Répartition par Catégories">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={categoryStats}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke={COLORS.secondary}
                      fill={COLORS.secondary}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Tooltip formatter={(value) => [`${value}/5`, 'Score']} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryStats.map((category, index) => (
                <Card 
                  key={category.key} 
                  className="cursor-pointer hover:scale-105 transition-all duration-300 border-l-4"
                  style={{ borderLeftColor: category.color }}
                  onClick={() => setSelectedCategory(selectedCategory === category.key ? null : category.key)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{category.name}</h3>
                      <p className="text-2xl font-bold" style={{ color: category.color }}>
                        {category.score}/5
                      </p>
                    </div>
                    <div className="text-right">
                      <Eye className="w-5 h-5 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">{category.evaluations} évaluations</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {selectedCategory && (
              <Card title={`Détails - ${categoryStats.find(c => c.key === selectedCategory)?.name}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getCategoryDetails(selectedCategory)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="criterion" angle={-45} textAnchor="end" height={100} />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Bar 
                          dataKey="score" 
                          fill={categoryStats.find(c => c.key === selectedCategory)?.color} 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {getCategoryDetails(selectedCategory).map((detail, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{detail.criterion}</span>
                        <span 
                          className="text-lg font-bold"
                          style={{ color: categoryStats.find(c => c.key === selectedCategory)?.color }}
                        >
                          {detail.score}/5
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'personnel' && (
          <div className="space-y-6">
            <Card title="Classement du Personnel">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rang
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Personnel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fonction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Établissement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score Moyen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recommandation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Évaluations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {personnelStats.map((person, index) => (
                      <tr key={person.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{person.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {person.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {person.establishment}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-blue-600">{person.averageScore}/5</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-purple-600">{person.averageRecommendation}/5</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {person.evaluationCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPersonnel(selectedPersonnel === person.name ? null : person.name)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {selectedPersonnel && (
              <Card title={`Détails - ${selectedPersonnel}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-4">Évolution des Scores</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getPersonnelDetails(selectedPersonnel)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="contentScore" stroke={COLORS.primary} name="Contenu" />
                        <Line type="monotone" dataKey="methodsScore" stroke={COLORS.success} name="Méthodes" />
                        <Line type="monotone" dataKey="organizationScore" stroke={COLORS.warning} name="Organisation" />
                        <Line type="monotone" dataKey="behaviorScore" stroke={COLORS.secondary} name="Comportement" />
                        <Line type="monotone" dataKey="cognitiveScore" stroke={COLORS.info} name="Cognitif" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Historique des Évaluations</h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {getPersonnelDetails(selectedPersonnel).map((evaluation, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{evaluation.formation}</span>
                              {evaluation.evaluationType === 'followUp' && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Suivi</span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">{evaluation.date}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>Contenu: <span className="font-bold text-blue-600">{evaluation.contentScore.toFixed(1)}</span></div>
                            <div>Méthodes: <span className="font-bold text-green-600">{evaluation.methodsScore.toFixed(1)}</span></div>
                            <div>Organisation: <span className="font-bold text-yellow-600">{evaluation.organizationScore.toFixed(1)}</span></div>
                            <div>Comportement: <span className="font-bold text-purple-600">{evaluation.behaviorScore.toFixed(1)}</span></div>
                            <div>Cognitif: <span className="font-bold text-indigo-600">{evaluation.cognitiveScore.toFixed(1)}</span></div>
                            <div>Recommandation: <span className="font-bold text-pink-600">{evaluation.recommendationScore}</span></div>
                            {evaluation.evaluationType === 'followUp' && (
                              <div className="col-span-3">Total Suivi (sur 60): <span className="font-bold text-emerald-700">{evaluation.followUpTotal60 ?? '-'}</span></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Section Commentaires/Observations */}
                <div className="mt-8">
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                      <FileText className="h-6 w-6 mr-3 text-yellow-600" />
                      Commentaires/Observations
                    </h4>
                    
                    {/* Liste des commentaires existants */}
                    <div className="space-y-4 mb-6">
                      {(() => {
                        // Trouver l'ID du membre par son nom
                        const member = staff.find(s => `${s.firstName} ${s.lastName}` === selectedPersonnel);
                        const staffId = member?.id?.toString() || selectedPersonnel;
                        const comments = staffComments[staffId] || [];
                        
                        return comments.length === 0 ? (
                          <p className="text-gray-500 italic text-sm bg-white/60 p-4 rounded-lg">
                            Aucun commentaire pour cette personne.
                          </p>
                        ) : (
                          comments.map((comment: any) => (
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
                                      onClick={() => updateStaffComment(selectedPersonnel, comment.id, editingComment.text)}
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
                                        onClick={() => deleteStaffComment(selectedPersonnel, comment.id)}
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
                        );
                      })()}
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
                              saveStaffComment(selectedPersonnel, newComment);
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
              </Card>
            )}
          </div>
        )}

        {activeTab === 'gender' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Répartition par Genre">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ gender, percentage }) => `${gender} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {genderStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Comparaison des Scores par Genre">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={genderStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="gender" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="averageScore" fill={COLORS.primary} name="Score Moyen" />
                    <Bar dataKey="averageRecommendation" fill={COLORS.secondary} name="Recommandation" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card title="Statistiques Détaillées par Genre">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Genre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pourcentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score Moyen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recommandation Moyenne
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {genderStats.map((genderData, index) => (
                      <tr key={genderData.gender} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-3"
                              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            ></div>
                            <span className="font-medium text-gray-900">{genderData.gender}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {genderData.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {genderData.percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-blue-600">{genderData.averageScore}/5</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-purple-600">{genderData.averageRecommendation}/5</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Onglet IA Insights */}
        {activeTab === 'ai-insights' && (
          <div className="space-y-6">
            {/* Explication de l'onglet IA */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">🤖 Analyse Intelligente - Mode Automatique</h3>
                  <p className="text-blue-800 text-sm mb-2">
                    Notre système analyse automatiquement vos données d'évaluation pour détecter :
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Alertes importantes</strong> - Situations qui nécessitent votre attention</li>
                    <li>• <strong>Évolutions</strong> - Comment les performances changent dans le temps</li>
                    <li>• <strong>Points inhabituels</strong> - Résultats sortant de l'ordinaire</li>
                    <li>• <strong>Liens entre données</strong> - Relations entre différents aspects des évaluations</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-2 italic">
                    Toutes ces analyses sont effectuées localement sur votre ordinateur pour garantir la confidentialité.
                  </p>
                </div>
              </div>
            </Card>

            {isAiProcessing ? (
              <Card title="📊 Analyse en cours...">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Je regarde vos données et prépare l'analyse...</p>
                    <p className="text-sm text-gray-500 mt-2">Cela prend quelques secondes</p>
                  </div>
                </div>
              </Card>
            ) : aiAnalytics ? (
              <>
                {/* Alertes Critiques */}
                {aiAnalytics.insights.filter(i => i.severity === 'critical' || i.severity === 'high').length > 0 && (
                  <Card 
                    title="🚨 Situations Urgentes Détectées" 
                    className="border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-orange-50"
                  >
                    <div className="mb-4 p-3 bg-white rounded-lg border border-red-200">
                      <p className="text-sm text-red-800">
                        <strong>📍 Qu'est-ce que c'est ?</strong> Ces alertes signalent des situations qui demandent votre attention rapidement. 
                        Elles sont basées sur l'analyse de toutes vos évaluations.
                      </p>
                    </div>
                    <div className="space-y-4">
                      {aiAnalytics.insights
                        .filter(i => i.severity === 'critical' || i.severity === 'high')
                        .slice(0, 5)
                        .map((insight, index) => (
                        <div key={index} className="p-4 bg-white rounded-lg border-l-4 border-red-400 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                                <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                  insight.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {insight.severity === 'critical' ? 'TRÈS URGENT' : 'IMPORTANT'}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">{insight.description}</p>
                              <div className="p-3 bg-blue-50 rounded-md">
                                <p className="text-sm text-blue-800">
                                  <strong>Recommandation:</strong> {insight.recommendation}
                                </p>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-sm font-medium text-gray-500">Confiance</div>
                              <div className="text-2xl font-bold text-blue-600">{Math.round(insight.confidence)}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Tous les Insights par Catégorie */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tendances */}
                  <Card title="📈 Évolutions Remarquées">
                    <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>Comment ça marche ?</strong> On compare les résultats actuels avec les anciens pour voir si les choses s'améliorent ou se dégradent.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {aiAnalytics.insights.filter(i => i.type === 'trend').map((insight, index) => (
                        <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{insight.title}</h5>
                              <p className="text-sm text-gray-600">{insight.description}</p>
                            </div>
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                          </div>
                        </div>
                      ))}
                      {aiAnalytics.insights.filter(i => i.type === 'trend').length === 0 && (
                        <p className="text-gray-500 italic">Pas d'évolution particulière pour le moment</p>
                      )}
                    </div>
                  </Card>

                  {/* Anomalies */}
                  <Card title="⚠️ Résultats Inhabituels">
                    <div className="mb-3 p-2 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-yellow-700">
                        <strong>Qu'est-ce qu'on regarde ?</strong> Des résultats qui sortent de l'ordinaire par rapport à ce qu'on attend normalement.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {aiAnalytics.insights.filter(i => i.type === 'anomaly').map((insight, index) => (
                        <div key={index} className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{insight.title}</h5>
                              <p className="text-sm text-gray-600">{insight.description}</p>
                            </div>
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          </div>
                        </div>
                      ))}
                      {aiAnalytics.insights.filter(i => i.type === 'anomaly').length === 0 && (
                        <p className="text-gray-500 italic">Tous les résultats sont dans la normale</p>
                      )}
                    </div>
                  </Card>

                  {/* Corrélations */}
                  <Card title="🔗 Liens Entre Les Données">
                    <div className="mb-3 p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700">
                        <strong>C'est quoi ?</strong> On découvre si certains aspects des évaluations sont liés. Par exemple : les gens bons en communication sont-ils aussi bons en travail d'équipe ?
                      </p>
                    </div>
                    <div className="space-y-3">
                      {aiAnalytics.insights.filter(i => i.type === 'correlation').map((insight, index) => (
                        <div key={index} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{insight.title}</h5>
                              <p className="text-sm text-gray-600">{insight.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-green-600">{Math.round(insight.confidence)}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {aiAnalytics.insights.filter(i => i.type === 'correlation').length === 0 && (
                        <p className="text-gray-500 italic">Pas de liens particuliers trouvés pour l'instant</p>
                      )}
                    </div>
                  </Card>

                  {/* Opportunités */}
                  <Card title="✨ Bonnes Occasions Détectées">
                    <div className="mb-3 p-2 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-700">
                        <strong>Pourquoi c'est intéressant ?</strong> On repère des occasions d'amélioration ou des points forts à valoriser dans votre équipe.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {aiAnalytics.insights.filter(i => i.type === 'opportunity').map((insight, index) => (
                        <div key={index} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{insight.title}</h5>
                              <p className="text-sm text-gray-600">{insight.description}</p>
                            </div>
                            <Target className="w-5 h-5 text-purple-500" />
                          </div>
                        </div>
                      ))}
                      {aiAnalytics.insights.filter(i => i.type === 'opportunity').length === 0 && (
                        <p className="text-gray-500 italic">Aucune occasion particulière détectée pour l'instant</p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Résumé des Clusters */}
                <Card title="👥 Groupes Automatiques d'Employés">
                  <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-indigo-800">
                      <strong>🤖 Comment ça fonctionne ?</strong> Le système regroupe automatiquement vos employés selon leurs performances similaires. 
                      Cela vous aide à identifier qui a besoin d'aide et qui peut aider les autres.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {aiAnalytics.clusters.map((cluster, index) => (
                      <div key={cluster.clusterId} className={`p-4 rounded-lg border-2 ${
                        cluster.riskLevel === 'low' ? 'bg-green-50 border-green-200' :
                        cluster.riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <div className="text-center">
                          <h4 className="font-bold text-gray-900 mb-2">{cluster.name}</h4>
                          <div className="text-3xl font-bold mb-2 ${
                            cluster.riskLevel === 'low' ? 'text-green-600' :
                            cluster.riskLevel === 'medium' ? 'text-yellow-600' :
                            'text-red-600'
                          }">
                            {cluster.employees.length}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{cluster.description}</p>
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Score moyen: {cluster.averageScore.toFixed(1)}/5
                          </div>
                          <div className="space-y-1">
                            {cluster.characteristics.map((char, i) => (
                              <div key={i} className="text-xs bg-white px-2 py-1 rounded text-gray-600">
                                {char}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <Card title="🤖 Intelligence Artificielle">
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune donnée disponible pour l'analyse IA</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Onglet Prédictions */}
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            {/* Explication de l'onglet Prédictions */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500">
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 mb-2">🔮 Prévisions de Performance - Regarder Vers l'Avenir</h3>
                  <p className="text-purple-800 text-sm mb-2">
                    En étudiant l'historique de chaque employé, on peut deviner comment il va évoluer :
                  </p>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• <strong>Améliorations prévues</strong> - Qui va probablement mieux réussir ?</li>
                    <li>• <strong>Risques anticipés</strong> - Qui pourrait avoir des difficultés ?</li>
                    <li>• <strong>Stabilité attendue</strong> - Qui va garder le même niveau ?</li>
                  </ul>
                  <p className="text-xs text-purple-600 mt-2 italic">
                    Important : Ce ne sont que des prévisions basées sur les données passées. L'avenir peut toujours être différent !
                  </p>
                </div>
              </div>
            </Card>

            {isAiProcessing ? (
              <Card title="🔮 Calcul des prévisions...">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">J'analyse l'historique pour prévoir l'évolution...</p>
                    <p className="text-sm text-gray-500 mt-2">Calculs en cours...</p>
                  </div>
                </div>
              </Card>
            ) : aiAnalytics?.predictions && aiAnalytics.predictions.length > 0 ? (
              <>
                {/* Vue d'ensemble des prédictions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500">
                    <div className="text-center">
                      <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-700 mb-1">
                        {aiAnalytics.predictions.filter(p => p.trend === 'improving').length}
                      </div>
                      <div className="text-sm text-green-600 font-medium">Vont S'Améliorer</div>
                    </div>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-l-4 border-red-500">
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 text-red-600 mx-auto mb-2 transform rotate-180" />
                      <div className="text-2xl font-bold text-red-700 mb-1">
                        {aiAnalytics.predictions.filter(p => p.trend === 'declining').length}
                      </div>
                      <div className="text-sm text-red-600 font-medium">Risquent de Baisser</div>
                    </div>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-l-4 border-gray-500">
                    <div className="text-center">
                      <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-700 mb-1">
                        {aiAnalytics.predictions.filter(p => p.trend === 'stable').length}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Restent Stables</div>
                    </div>
                  </Card>
                </div>

                {/* Prédictions détaillées */}
                <Card title="🔮 Prédictions Détaillées">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Employé
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Score Actuel
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Score Prédit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Tendance
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Confiance
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Facteurs
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {aiAnalytics.predictions
                          .sort((a, b) => {
                            if (a.trend === 'declining' && b.trend !== 'declining') return -1;
                            if (b.trend === 'declining' && a.trend !== 'declining') return 1;
                            if (a.trend === 'improving' && b.trend === 'stable') return -1;
                            if (b.trend === 'improving' && a.trend === 'stable') return 1;
                            return b.confidence - a.confidence;
                          })
                          .map((prediction, index) => (
                          <tr key={prediction.employeeName} className={`hover:bg-gray-50 ${
                            prediction.trend === 'declining' ? 'bg-red-50' : 
                            prediction.trend === 'improving' ? 'bg-green-50' : ''
                          }`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{prediction.employeeName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-lg font-bold text-blue-600">
                                {prediction.currentScore.toFixed(1)}/5
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-lg font-bold ${
                                prediction.predictedScore > prediction.currentScore ? 'text-green-600' :
                                prediction.predictedScore < prediction.currentScore ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {prediction.predictedScore.toFixed(1)}/5
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                ({prediction.predictedScore > prediction.currentScore ? '+' : ''}
                                {(prediction.predictedScore - prediction.currentScore).toFixed(1)})
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                prediction.trend === 'improving' ? 'bg-green-100 text-green-800' :
                                prediction.trend === 'declining' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {prediction.trend === 'improving' ? '↗️ Amélioration' :
                                 prediction.trend === 'declining' ? '↘️ Baisse' :
                                 '➡️ Stable'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-full bg-gray-200 rounded-full h-2 mr-2`}>
                                  <div 
                                    className={`h-2 rounded-full ${
                                      prediction.confidence >= 80 ? 'bg-green-600' :
                                      prediction.confidence >= 60 ? 'bg-yellow-600' :
                                      'bg-red-600'
                                    }`}
                                    style={{ width: `${prediction.confidence}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-600">
                                  {Math.round(prediction.confidence)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs">
                                {prediction.factors.slice(0, 2).map((factor, i) => (
                                  <div key={i} className="text-xs bg-gray-100 px-2 py-1 rounded mb-1">
                                    {factor}
                                  </div>
                                ))}
                                {prediction.factors.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{prediction.factors.length - 2} autres
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Recommandations basées sur les prédictions */}
                {aiAnalytics.recommendationEngine && aiAnalytics.recommendationEngine.length > 0 && (
                  <Card title="🎯 Recommandations Personnalisées">
                    <div className="space-y-4">
                      {aiAnalytics.recommendationEngine
                        .filter(rec => rec.priority === 'high')
                        .slice(0, 5)
                        .map((rec, index) => (
                        <div key={index} className={`p-4 rounded-lg border-l-4 ${
                          rec.category === 'training' ? 'border-blue-500 bg-blue-50' :
                          rec.category === 'coaching' ? 'border-orange-500 bg-orange-50' :
                          rec.category === 'development' ? 'border-green-500 bg-green-50' :
                          'border-purple-500 bg-purple-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <Award className="w-5 h-5 text-gray-600 mr-2" />
                                <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                  rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {rec.priority === 'high' ? 'URGENT' : 
                                   rec.priority === 'medium' ? 'IMPORTANT' : 'NORMAL'}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">{rec.description}</p>
                              <div className="text-sm text-gray-600">
                                <strong>Délai:</strong> {rec.timeframe} | 
                                <strong> Impact attendu:</strong> {rec.expectedImpact}%
                              </div>
                              <div className="mt-2">
                                <strong className="text-sm text-gray-600">Ressources:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {rec.resources.map((resource, i) => (
                                    <span key={i} className="text-xs bg-white px-2 py-1 rounded border">
                                      {resource}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-sm font-medium text-gray-500">Pour</div>
                              <div className="text-sm font-bold text-blue-600">{rec.employeeName}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card title="🔮 Prédictions de Performance">
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {aiAnalytics ? 
                      'Pas assez de données historiques pour générer des prédictions fiables' : 
                      'Aucune donnée disponible pour les prédictions'
                    }
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Onglet Risques & Opportunités */}
        {activeTab === 'risks' && (
          <div className="space-y-6">
            {/* Explication de l'onglet Risques */}
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500">
              <div className="flex items-start space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">⚠️ Gestion des Risques - Anticiper les Problèmes</h3>
                  <p className="text-orange-800 text-sm mb-2">
                    On évalue le niveau de risque de chaque employé pour anticiper :
                  </p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• <strong>Employés à accompagner</strong> - Ceux qui ont besoin d'aide rapidement</li>
                    <li>• <strong>Talents à développer</strong> - Ceux qui ont du potentiel à exploiter</li>
                    <li>• <strong>Situations à surveiller</strong> - Ce qui demande votre attention</li>
                  </ul>
                  <p className="text-xs text-orange-600 mt-2 italic">
                    L'objectif : agir avant que les problèmes deviennent graves et valoriser les points forts.
                  </p>
                </div>
              </div>
            </Card>

            {isAiProcessing ? (
              <Card title="⚠️ Calcul des risques en cours...">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">J'évalue les risques et opportunités...</p>
                    <p className="text-sm text-gray-500 mt-2">Analyse en cours...</p>
                  </div>
                </div>
              </Card>
            ) : aiAnalytics?.riskMatrix ? (
              <>
                {/* Vue d'ensemble des risques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-l-4 border-red-500">
                    <div className="text-center">
                      <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-700 mb-1">
                        {aiAnalytics.riskMatrix.highRisk.length}
                      </div>
                      <div className="text-sm text-red-600 font-medium">Aide Urgente</div>
                    </div>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-l-4 border-orange-500">
                    <div className="text-center">
                      <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-700 mb-1">
                        {aiAnalytics.riskMatrix.mediumRisk.length}
                      </div>
                      <div className="text-sm text-orange-600 font-medium">À Surveiller</div>
                    </div>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-yellow-50 to-green-50 border-l-4 border-yellow-500">
                    <div className="text-center">
                      <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-yellow-700 mb-1">
                        {aiAnalytics.riskMatrix.lowRisk.length}
                      </div>
                      <div className="text-sm text-yellow-600 font-medium">Peu de Risque</div>
                    </div>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500">
                    <div className="text-center">
                      <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-700 mb-1">
                        {aiAnalytics.riskMatrix.opportunities.length}
                      </div>
                      <div className="text-sm text-green-600 font-medium">Potentiels</div>
                    </div>
                  </Card>
                </div>

                {/* Risques Élevés - Action Immédiate */}
                {aiAnalytics.riskMatrix.highRisk.length > 0 && (
                  <Card 
                    title="🚨 Risques Élevés - Action Immédiate Requise" 
                    className="border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-pink-50"
                  >
                    <div className="space-y-4">
                      {aiAnalytics.riskMatrix.highRisk.map((risk, index) => (
                        <div key={index} className="p-4 bg-white rounded-lg border-l-4 border-red-400 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                                <h4 className="font-semibold text-gray-900">{risk.name}</h4>
                                <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  CRITIQUE
                                </span>
                              </div>
                              <div className="mb-3">
                                <strong className="text-sm text-gray-600">Facteurs de risque:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {risk.riskFactors.map((factor, i) => (
                                    <span key={i} className="text-xs bg-red-100 px-2 py-1 rounded text-red-700">
                                      {factor}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="p-3 bg-blue-50 rounded-md">
                                <p className="text-sm text-blue-800">
                                  <strong>Recommandation:</strong> {risk.recommendation}
                                </p>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-sm font-medium text-gray-500">Score de Risque</div>
                              <div className="text-2xl font-bold text-red-600">{risk.riskScore}/100</div>
                              <div className="text-xs text-red-600 font-medium">{risk.urgency}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Matrice complète des risques */}
                <Card title="📈 Matrice Complète des Risques">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Employé
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Niveau de Risque
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Urgence
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Facteurs de Risque
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Action Recommandée
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[...aiAnalytics.riskMatrix.highRisk, ...aiAnalytics.riskMatrix.mediumRisk, ...aiAnalytics.riskMatrix.lowRisk]
                          .sort((a, b) => b.riskScore - a.riskScore)
                          .map((risk, index) => (
                          <tr key={risk.name} className={`hover:bg-gray-50 ${
                            risk.riskScore > 70 ? 'bg-red-50' : 
                            risk.riskScore > 50 ? 'bg-orange-50' : 
                            'bg-yellow-50'
                          }`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{risk.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                risk.riskScore > 70 ? 'bg-red-100 text-red-800' :
                                risk.riskScore > 50 ? 'bg-orange-100 text-orange-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {risk.riskScore > 70 ? '🔴 Élevé' :
                                 risk.riskScore > 50 ? '🟠 Moyen' :
                                 '🟡 Faible'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2 mr-2 w-16">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      risk.riskScore > 70 ? 'bg-red-600' :
                                      risk.riskScore > 50 ? 'bg-orange-600' :
                                      'bg-yellow-600'
                                    }`}
                                    style={{ width: `${risk.riskScore}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {risk.riskScore}/100
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                risk.urgency === 'immediate' ? 'bg-red-100 text-red-800' :
                                risk.urgency === 'short-term' ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {risk.urgency === 'immediate' ? 'IMMÉDIAT' :
                                 risk.urgency === 'short-term' ? 'COURT TERME' :
                                 'LONG TERME'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs space-y-1">
                                {risk.riskFactors.slice(0, 2).map((factor, i) => (
                                  <div key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {factor}
                                  </div>
                                ))}
                                {risk.riskFactors.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{risk.riskFactors.length - 2} autres
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs text-sm text-gray-700">
                                {risk.recommendation}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Opportunités de Développement */}
                {aiAnalytics.riskMatrix.opportunities.length > 0 && (
                  <Card 
                    title="✨ Opportunités de Développement" 
                    className="border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {aiAnalytics.riskMatrix.opportunities.map((opportunity, index) => (
                        <div key={index} className="p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <Award className="w-5 h-5 text-green-500 mr-2" />
                                <h4 className="font-semibold text-gray-900">{opportunity.name}</h4>
                              </div>
                              <div className="mb-3">
                                <strong className="text-sm text-gray-600">Domaines de potentiel:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {opportunity.potentialAreas.map((area, i) => (
                                    <span key={i} className="text-xs bg-green-100 px-2 py-1 rounded text-green-700">
                                      {area}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="p-3 bg-green-50 rounded-md">
                                <p className="text-sm text-green-800">
                                  <strong>Plan de développement:</strong> {opportunity.developmentPlan}
                                </p>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-sm font-medium text-gray-500">Potentiel</div>
                              <div className="text-2xl font-bold text-green-600">{opportunity.opportunityScore}/100</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Tendances de Performance */}
                {aiAnalytics.performanceTrends && (
                  <Card title="📈 Tendances de Performance">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-900 mb-2">🎯 Performance Globale</h4>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              {aiAnalytics.performanceTrends.overall.current.toFixed(2)}/5
                            </div>
                            <div className="text-sm text-gray-600">Score actuel</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              aiAnalytics.performanceTrends.overall.trend === 'up' ? 'text-green-600' :
                              aiAnalytics.performanceTrends.overall.trend === 'down' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {aiAnalytics.performanceTrends.overall.trend === 'up' ? '↗️' :
                               aiAnalytics.performanceTrends.overall.trend === 'down' ? '↘️' : '➡️'}
                              {aiAnalytics.performanceTrends.overall.changePercent.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              vs période précédente
                            </div>
                          </div>
                        </div>
                      </div>

                      {aiAnalytics.performanceTrends.seasonal.map((season, index) => (
                        <div key={season.period} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-gray-900 mb-2">🌱 {season.period}</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Score moyen:</span>
                              <span className="font-bold text-purple-600">{season.averageScore}/5</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Évaluations:</span>
                              <span className="font-medium text-gray-700">{season.evaluationCount}</span>
                            </div>
                            <div className="mt-2">
                              <div className="text-xs text-gray-600 mb-1">Top performers:</div>
                              {season.topPerformers.slice(0, 2).map((performer, i) => (
                                <div key={i} className="text-xs bg-white px-2 py-1 rounded mb-1">
                                  {performer}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card title="⚠️ Analyse des Risques">
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune donnée disponible pour l'analyse des risques</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Export Section */}
        <Card title="Export des Statistiques">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-gray-600 mb-4">
                Exportez les statistiques détaillées au format Excel pour une analyse approfondie.
              </p>
              <div className="flex flex-wrap gap-2">
<Button 
                  onClick={async () => {
                    try {
                      const workbook = new ExcelJS.Workbook();
                      
                      // 📈 Feuille Statistiques Générales
                      const generalSheet = workbook.addWorksheet('📈 Vue d\'ensemble');
                      generalSheet.addRow(['Indicateur', 'Valeur', 'Commentaire IA']);
                      generalSheet.addRow(['Satisfaction Moyenne', `${overallStats.averageSatisfaction}/5`, 'Score global calculé sur toutes les catégories']);
                      generalSheet.addRow(['Évaluations Total', overallStats.totalEvaluations.toString(), 'Nombre total d\'enregistrements']);
                      generalSheet.addRow(['Taux de Recommandation', `${overallStats.recommendationRate}%`, 'Pourcentage d\'employés avec score ≥ 4/5']);
                      generalSheet.addRow(['Formations Enregistrées', overallStats.activeFormations.toString(), 'Thèmes de formation configurés']);
                      
                      if (aiAnalytics) {
                        generalSheet.addRow(['', '', '']);
                        generalSheet.addRow(['=== MÉTRIQUES IA ===', '', '']);
                        generalSheet.addRow(['Insights Générés', aiAnalytics.insights.length.toString(), 'Nombre total d\'insights détectés par IA']);
                        generalSheet.addRow(['Alertes Critiques', aiAnalytics.insights.filter(i => i.severity === 'critical' || i.severity === 'high').length.toString(), 'Nécessitent une action immédiate']);
                        generalSheet.addRow(['Prédictions Générées', aiAnalytics.predictions.length.toString(), 'Prévisions de performance futures']);
                        generalSheet.addRow(['Employés à Risque', (aiAnalytics.riskMatrix.highRisk.length + aiAnalytics.riskMatrix.mediumRisk.length).toString(), 'Nécessitent un suivi particulier']);
                        generalSheet.addRow(['Opportunités Identifiées', aiAnalytics.riskMatrix.opportunities.length.toString(), 'Potentiels de développement détectés']);
                      }
                      
                      // 📉 Feuille Par Catégories
                      const categorySheet = workbook.addWorksheet('📉 Par Catégories');
                      categorySheet.addRow(['Catégorie', 'Score Moyen', 'Nombre Évaluations', 'Performance', 'Recommandation IA']);
                      categoryStats.forEach(cat => {
                        const performance = cat.score >= 4 ? 'Excellent' : cat.score >= 3 ? 'Satisfaisant' : 'Amélioration requise';
                        const recommendation = cat.score < 3 ? 'Formation ciblée recommandée' : 
                                            cat.score >= 4 ? 'Maintenir le niveau d\'excellence' : 
                                            'Optimisation possible';
                        categorySheet.addRow([cat.name, cat.score + '/5', cat.evaluations, performance, recommendation]);
                      });
                      
                      // 👥 Feuille Par Personnel avec IA - ENRICHIE
                      const personnelSheet = workbook.addWorksheet('👥 Personnel Détaillé');
                      personnelSheet.addRow([
                        'Personnel', 'Matricule', 'Téléphone', 'Email', 'Fonction', 'Établissement', 'Genre',
                        'Score Moyen', 'Niveau Performance', 'Nb Évaluations', 'Score Recommandation',
                        'Prédiction IA', 'Tendance', 'Recommandation IA', 'Actions Suggérées'
                      ]);
                      personnelStatsWithLevel.forEach(person => {
                        const prediction = aiAnalytics?.predictions.find(p => p.employeeName === person.name);
                        const aiRecommendation = aiAnalytics?.recommendationEngine.find(r => r.employeeName === person.name);
                        
                        // Trouver les données complètes du personnel
                        const fullPersonData = staff.find(s => `${s.firstName} ${s.lastName}` === person.name);
                        const personEvaluations = evaluations.filter(e => `${e.firstName} ${e.lastName}` === person.name);
                        
                        personnelSheet.addRow([
                          person.name,
                          fullPersonData?.matricule || 'N/A',
                          fullPersonData?.phone || 'N/A',
                          fullPersonData?.email || 'N/A',
                          person.position,
                          person.establishment,
                          personEvaluations[0]?.gender || 'N/A',
                          person.averageScore.toFixed(1) + '/5',
                          person.performance.level,
                          person.evaluationCount,
                          person.averageRecommendation.toFixed(1) + '/5',
                          prediction ? `${prediction.predictedScore.toFixed(1)}/5` : 'Pas de prédiction',
                          prediction ? (prediction.trend === 'improving' ? 'AMÉLIORATION' : prediction.trend === 'declining' ? 'BAISSE' : 'STABLE') : 'N/A',
                          aiRecommendation ? aiRecommendation.title : person.recommendation,
                          prediction ? prediction.factors.slice(0,3).join('; ') : 'N/A'
                        ]);
                      });
                      
                      // 🏆 Feuille Notes Détaillées par Critères
                      const scoresSheet = workbook.addWorksheet('🏆 Notes Détaillées');
                      scoresSheet.addRow([
                        'Personnel', 'Matricule', 'Évaluation Date', 'Formation',
                        // Contenu et Pédagogie (8 critères)
                        'Acquisition Compétences', 'Développement Personnel', 'Clarté Cours', 'Théorie/Pratique',
                        'Adéquation Syllabus', 'Cas Pratiques', 'Objectifs Atteints', 'Connaissances Adaptées',
                        // Méthodes et Supports (3 critères)
                        'Support Pédagogique', 'Techniques Utilisées', 'Présentation',
                        // Organisation et Logistique (4 critères)
                        'Conditions Logistiques', 'Rythme', 'Ponctualité', 'Assiduité',
                        // Comportement et Collaboration (8 critères)
                        'Esprit Équipe', 'Motivation', 'Communication Sociale', 'Communication Générale',
                        'Aptitude Changement', 'Curiosité', 'Initiative', 'Responsabilité',
                        // Compétences Cognitives (5 critères)
                        'Analyse Critique', 'Exécution Travail', 'Compréhension', 'Qualité Travail', 'Maîtrise Sujet',
                        // Scores Synthèse
                        'Score Recommandation', 'Score Global', 'Observations'
                      ]);
                      
                      evaluations.forEach(evaluation => {
                        if (evaluation && evaluation.firstName && evaluation.lastName) {
                          scoresSheet.addRow([
                            `${evaluation.firstName} ${evaluation.lastName}`,
                            evaluation.matricule || 'N/A',
                            evaluation.fillDate || evaluation.createdAt || 'N/A',
                            evaluation.formationTheme || 'N/A',
                            // Contenu et Pédagogie
                            evaluation.skillsAcquisition || 0,
                            evaluation.personalDevelopment || 0,
                            evaluation.courseClarity || 0,
                            evaluation.theoryPractice || 0,
                            evaluation.syllabusAdequacy || 0,
                            evaluation.practicalCases || 0,
                            evaluation.objectivesAchieved || 0,
                            evaluation.adaptedKnowledge || 0,
                            // Méthodes et Supports
                            evaluation.pedagogicalSupport || 0,
                            evaluation.techniquesUsed || 0,
                            evaluation.presentation || 0,
                            // Organisation et Logistique
                            evaluation.logisticsConditions || 0,
                            evaluation.rhythm || 0,
                            evaluation.punctuality || 0,
                            evaluation.punctualityAssiduity || 0,
                            // Comportement et Collaboration
                            evaluation.teamworkSense || 0,
                            evaluation.motivationEnthusiasm || 0,
                            evaluation.communicationSociable || 0,
                            evaluation.communicationGeneral || 0,
                            evaluation.aptitudeChangeIdeas || 0,
                            evaluation.curiosity || 0,
                            evaluation.initiativeSpirit || 0,
                            evaluation.responsibilitySense || 0,
                            // Compétences Cognitives
                            evaluation.criticalAnalysis || 0,
                            evaluation.workExecution || 0,
                            evaluation.directivesComprehension || 0,
                            evaluation.workQuality || 0,
                            evaluation.subjectMastery || 0,
                            // Scores Synthèse
                            evaluation.recommendationScore || 0,
                            ((
                              ((evaluation.skillsAcquisition || 0) + (evaluation.personalDevelopment || 0) + (evaluation.courseClarity || 0) + (evaluation.theoryPractice || 0) + (evaluation.syllabusAdequacy || 0) + (evaluation.practicalCases || 0) + (evaluation.objectivesAchieved || 0) + (evaluation.adaptedKnowledge || 0)) / 8 +
                              ((evaluation.pedagogicalSupport || 0) + (evaluation.techniquesUsed || 0) + (evaluation.presentation || 0)) / 3 +
                              ((evaluation.logisticsConditions || 0) + (evaluation.rhythm || 0) + (evaluation.punctuality || 0) + (evaluation.punctualityAssiduity || 0)) / 4 +
                              ((evaluation.teamworkSense || 0) + (evaluation.motivationEnthusiasm || 0) + (evaluation.communicationSociable || 0) + (evaluation.communicationGeneral || 0) + (evaluation.aptitudeChangeIdeas || 0) + (evaluation.curiosity || 0) + (evaluation.initiativeSpirit || 0) + (evaluation.responsibilitySense || 0)) / 8 +
                              ((evaluation.criticalAnalysis || 0) + (evaluation.workExecution || 0) + (evaluation.directivesComprehension || 0) + (evaluation.workQuality || 0) + (evaluation.subjectMastery || 0)) / 5
                            ) / 5).toFixed(2),
                            (evaluation.justificationObservations || evaluation.improvementSuggestions || 'Aucune observation').substring(0, 100)
                          ]);
                        }
                      });
                      
                      // 📊 Feuille Historique Complet des Évaluations
                      const historySheet = workbook.addWorksheet('📊 Historique Complet');
                      historySheet.addRow([
                        'Date Évaluation', 'Matricule', 'Nom Complet', 'Genre', 'Téléphone', 'Email',
                        'Fonction', 'Établissement', 'Formation', 'Centre Formation', 'Formateurs',
                        'Date Début', 'Date Fin', 'Objectifs Formation', 'Modules', 'Résultats Attendus',
                        'Score Contenu', 'Score Méthodes', 'Score Organisation', 'Score Comportement', 'Score Cognitif',
                        'Score Global', 'Score Recommandation', 'Changements Observés', 'Suggestions Amélioration',
                        'Actions Post-Formation', 'Besoins Formation Future', 'Observations Justification'
                      ]);
                      
                      evaluations.forEach(evaluation => {
                        if (evaluation && evaluation.firstName && evaluation.lastName) {
                          // Calcul des scores par catégorie
                          const contentScore = ((evaluation.skillsAcquisition || 0) + (evaluation.personalDevelopment || 0) + (evaluation.courseClarity || 0) + (evaluation.theoryPractice || 0) + (evaluation.syllabusAdequacy || 0) + (evaluation.practicalCases || 0) + (evaluation.objectivesAchieved || 0) + (evaluation.adaptedKnowledge || 0)) / 8;
                          const methodsScore = ((evaluation.pedagogicalSupport || 0) + (evaluation.techniquesUsed || 0) + (evaluation.presentation || 0)) / 3;
                          const organizationScore = ((evaluation.logisticsConditions || 0) + (evaluation.rhythm || 0) + (evaluation.punctuality || 0) + (evaluation.punctualityAssiduity || 0)) / 4;
                          const behaviorScore = ((evaluation.teamworkSense || 0) + (evaluation.motivationEnthusiasm || 0) + (evaluation.communicationSociable || 0) + (evaluation.communicationGeneral || 0) + (evaluation.aptitudeChangeIdeas || 0) + (evaluation.curiosity || 0) + (evaluation.initiativeSpirit || 0) + (evaluation.responsibilitySense || 0)) / 8;
                          const cognitiveScore = ((evaluation.criticalAnalysis || 0) + (evaluation.workExecution || 0) + (evaluation.directivesComprehension || 0) + (evaluation.workQuality || 0) + (evaluation.subjectMastery || 0)) / 5;
                          const globalScore = (contentScore + methodsScore + organizationScore + behaviorScore + cognitiveScore) / 5;
                          
                          historySheet.addRow([
                            evaluation.fillDate || evaluation.createdAt || 'Date inconnue',
                            evaluation.matricule || 'N/A',
                            `${evaluation.firstName} ${evaluation.lastName}`,
                            evaluation.gender || 'N/A',
                            evaluation.phone || 'N/A',
                            evaluation.email || 'N/A',
                            evaluation.position || 'N/A',
                            evaluation.establishment || 'N/A',
                            evaluation.formationTheme || 'N/A',
                            evaluation.trainingCenter || 'N/A',
                            evaluation.trainers || 'N/A',
                            evaluation.startDate || 'N/A',
                            evaluation.endDate || 'N/A',
                            (evaluation.objectives || 'N/A').substring(0, 100),
                            (evaluation.modules || 'N/A').substring(0, 100),
                            (evaluation.expectedResults || 'N/A').substring(0, 100),
                            contentScore.toFixed(2) + '/5',
                            methodsScore.toFixed(2) + '/5',
                            organizationScore.toFixed(2) + '/5',
                            behaviorScore.toFixed(2) + '/5',
                            cognitiveScore.toFixed(2) + '/5',
                            globalScore.toFixed(2) + '/5',
                            (evaluation.recommendationScore || 0) + '/5',
                            (evaluation.observedChanges && Array.isArray(evaluation.observedChanges)) ? evaluation.observedChanges.join('; ') : 'N/A',
                            (evaluation.improvementSuggestions || 'N/A').substring(0, 150),
                            (evaluation.postFormationActions || 'N/A').substring(0, 150),
                            evaluation.needsAdditionalTraining === 'oui' ? (evaluation.additionalTrainingDetails || 'Oui') : (evaluation.noAdditionalTrainingReason || 'Non'),
                            (evaluation.justificationObservations || 'Aucune observation').substring(0, 200)
                          ]);
                        }
                      });
                      
                      // 🧠 Feuille Insights IA
                      if (aiAnalytics && aiAnalytics.insights.length > 0) {
                        const insightsSheet = workbook.addWorksheet('🧠 Insights IA');
                        insightsSheet.addRow(['Type', 'Sévérité', 'Titre', 'Description', 'Recommandation', 'Confiance %']);
                        
                        aiAnalytics.insights.forEach(insight => {
                          insightsSheet.addRow([
                            insight.type.toUpperCase(),
                            insight.severity.toUpperCase(),
                            insight.title,
                            insight.description,
                            insight.recommendation,
                            Math.round(insight.confidence)
                          ]);
                        });
                      }
                      
                      // 🔮 Feuille Prédictions
                      if (aiAnalytics && aiAnalytics.predictions.length > 0) {
                        const predictionsSheet = workbook.addWorksheet('🔮 Prédictions');
                        predictionsSheet.addRow(['Employé', 'Score Actuel', 'Score Prédit', 'Variation', 'Tendance', 'Confiance %', 'Facteurs Clés', 'Délai']);
                        
                        aiAnalytics.predictions.forEach(pred => {
                          predictionsSheet.addRow([
                            pred.employeeName,
                            pred.currentScore.toFixed(1) + '/5',
                            pred.predictedScore.toFixed(1) + '/5',
                            (pred.predictedScore - pred.currentScore > 0 ? '+' : '') + (pred.predictedScore - pred.currentScore).toFixed(1),
                            pred.trend === 'improving' ? 'AMÉLIORATION' : pred.trend === 'declining' ? 'BAISSE' : 'STABLE',
                            Math.round(pred.confidence),
                            pred.factors.join('; '),
                            pred.timeframe
                          ]);
                        });
                      }
                      
                      // ⚠️ Feuille Matrice de Risques
                      if (aiAnalytics && aiAnalytics.riskMatrix) {
                        const risksSheet = workbook.addWorksheet('⚠️ Matrice Risques');
                        risksSheet.addRow(['Employé', 'Niveau Risque', 'Score Risque /100', 'Urgence', 'Facteurs', 'Action Recommandée']);
                        
                        [...aiAnalytics.riskMatrix.highRisk, ...aiAnalytics.riskMatrix.mediumRisk, ...aiAnalytics.riskMatrix.lowRisk]
                          .sort((a, b) => b.riskScore - a.riskScore)
                          .forEach(risk => {
                            risksSheet.addRow([
                              risk.name,
                              risk.riskScore > 70 ? 'CRITIQUE' : risk.riskScore > 50 ? 'MOYEN' : 'FAIBLE',
                              risk.riskScore,
                              risk.urgency.toUpperCase(),
                              risk.riskFactors.join('; '),
                              risk.recommendation
                            ]);
                          });
                      }
                      
                      // ✨ Feuille Opportunités
                      if (aiAnalytics && aiAnalytics.riskMatrix.opportunities.length > 0) {
                        const opportunitiesSheet = workbook.addWorksheet('✨ Opportunités');
                        opportunitiesSheet.addRow(['Employé', 'Score Opportunité', 'Domaines Potentiel', 'Plan Développement']);
                        
                        aiAnalytics.riskMatrix.opportunities.forEach(opp => {
                          opportunitiesSheet.addRow([
                            opp.name,
                            opp.opportunityScore + '/100',
                            opp.potentialAreas.join('; '),
                            opp.developmentPlan
                          ]);
                        });
                      }
                      
                      // 👥 Feuille Clustering
                      if (aiAnalytics && aiAnalytics.clusters.length > 0) {
                        const clustersSheet = workbook.addWorksheet('👥 Clustering');
                        clustersSheet.addRow(['Cluster', 'Nombre Employés', 'Score Moyen', 'Niveau Risque', 'Description', 'Caractéristiques', 'Membres']);
                        
                        aiAnalytics.clusters.forEach(cluster => {
                          clustersSheet.addRow([
                            cluster.name,
                            cluster.employees.length,
                            cluster.averageScore.toFixed(1) + '/5',
                            cluster.riskLevel.toUpperCase(),
                            cluster.description,
                            cluster.characteristics.join('; '),
                            cluster.employees.join('; ')
                          ]);
                        });
                      }
                      
                      // 📈 Feuille Tendances Performance
                      if (aiAnalytics && aiAnalytics.performanceTrends) {
                        const trendsSheet = workbook.addWorksheet('📈 Tendances');
                        trendsSheet.addRow(['Période/Type', 'Score Actuel', 'Score Précédent', 'Variation', '% Evolution', 'Tendance', 'Confiance %']);
                        
                        // Tendance globale
                        const overall = aiAnalytics.performanceTrends.overall;
                        trendsSheet.addRow([
                          'GLOBAL',
                          overall.current.toFixed(2),
                          overall.previous.toFixed(2),
                          overall.change.toFixed(2),
                          overall.changePercent.toFixed(1),
                          overall.trend.toUpperCase(),
                          overall.confidence
                        ]);
                        
                        // Tendances saisonnières
                        aiAnalytics.performanceTrends.seasonal.forEach(season => {
                          trendsSheet.addRow([
                            season.period,
                            season.averageScore.toFixed(2),
                            'N/A',
                            'N/A',
                            'N/A',
                            'N/A',
                            'N/A'
                          ]);
                        });
                      }
                      
                      // 🎯 Feuille Recommandations
                      if (aiAnalytics && aiAnalytics.recommendationEngine.length > 0) {
                        const recsSheet = workbook.addWorksheet('🎯 Recommandations');
                        recsSheet.addRow(['Employé', 'Priorité', 'Catégorie', 'Titre', 'Description', 'Impact %', 'Délai', 'Ressources']);
                        
                        aiAnalytics.recommendationEngine.forEach(rec => {
                          recsSheet.addRow([
                            rec.employeeName,
                            rec.priority.toUpperCase(),
                            rec.category.toUpperCase(),
                            rec.title,
                            rec.description,
                            rec.expectedImpact,
                            rec.timeframe,
                            rec.resources.join('; ')
                          ]);
                        });
                      }
                      
                      // 🎨 Style avancé des feuilles
                      workbook.eachSheet((sheet) => {
                        // Header styling
                        const headerRow = sheet.getRow(1);
                        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
                        headerRow.fill = { 
                          type: 'pattern', 
                          pattern: 'solid', 
                          fgColor: { argb: 'FF0011ef' } 
                        };
                        headerRow.height = 25;
                        
                        // Auto-size columns
                        sheet.columns.forEach((column, index) => {
                          let maxLength = 0;
                          column.eachCell({ includeEmpty: false }, (cell) => {
                            const columnLength = cell.value ? cell.value.toString().length : 10;
                            if (columnLength > maxLength) {
                              maxLength = columnLength;
                            }
                          });
                          column.width = Math.min(Math.max(maxLength + 2, 12), 50);
                        });
                        
                        // Conditional formatting pour les scores
                        if (sheet.name.includes('Personnel') || sheet.name.includes('Prédictions')) {
                          sheet.eachRow((row, rowNumber) => {
                            if (rowNumber > 1) {
                              row.eachCell((cell, colNumber) => {
                                const value = cell.value;
                                if (typeof value === 'string' && value.includes('/5')) {
                                  const score = parseFloat(value);
                                  if (score < 2.5) {
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9999' } };
                                  } else if (score >= 4) {
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF99FF99' } };
                                  } else if (score >= 3) {
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
                                  }
                                }
                              });
                            }
                          });
                        }
                      });
                      
                      // Génération du fichier
                      const timestamp = new Date().toISOString().split('T')[0];
                      const aiSuffix = aiAnalytics ? '-avec-IA' : '';
                      const buffer = await workbook.xlsx.writeBuffer();
                      
                      // Utiliser Electron pour le save natif si disponible
                      let saved = false;
                      if (electronService.getIsElectron()) {
                        try {
                          saved = await electronService.saveFileWithDialog(
                            buffer,
                            `cfp-statistiques-avancees${aiSuffix}-${timestamp}.xlsx`,
                            [
                              { name: 'Fichiers Excel', extensions: ['xlsx'] },
                              { name: 'Tous les fichiers', extensions: ['*'] }
                            ]
                          );
                          
                          if (saved) {
                            // Notification native
                            const message = aiAnalytics ? 
                              `🎆 Export Excel enrichi sauvegardé avec succès !\n\n📈 Inclut: ${aiAnalytics.insights.length} insights IA, ${aiAnalytics.predictions.length} prédictions et plus !` :
                              'Export Excel standard sauvegardé avec succès !';
                            
                            electronService.showNotification(
                              'Export terminé', 
                              aiAnalytics ? 
                                `Rapport avec ${aiAnalytics.insights.length} insights IA sauvegardé` :
                                'Rapport statistiques sauvegardé'
                            );
                            alert(message);
                          }
                        } catch (error) {
                          console.warn('Échec de sauvegarde Electron, fallback vers téléchargement web:', error);
                          saved = false;
                        }
                      }
                      
                      // Fallback pour navigateur web si Electron échoue ou n'est pas disponible
                      if (!saved) {
                        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                        const url = URL.createObjectURL(blob);
                        
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `cfp-statistiques-avancees${aiSuffix}-${timestamp}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        
                        const message = aiAnalytics ? 
                          `🎆 Export Excel enrichi téléchargé avec succès !\n\n📈 Inclut: ${aiAnalytics.insights.length} insights IA, ${aiAnalytics.predictions.length} prédictions et bien plus !` :
                          'Export Excel standard téléchargé avec succès !';
                        alert(message);
                      }
                    } catch (error) {
                      console.error('Erreur export Excel:', error);
                      alert('Erreur lors de l\'export Excel: ' + error.message);
                    }
                  }}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg transform transition hover:scale-105"
                  disabled={isAiProcessing}
                >
                  {isAiProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      🚀 Export Excel Enrichi IA
                      {aiAnalytics && (
                        <span className="ml-2 bg-yellow-300 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                          +{aiAnalytics.insights.length} insights
                        </span>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Statistics;
