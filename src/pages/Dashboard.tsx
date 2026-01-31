import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataSync } from '../contexts/DataSyncContext';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CFPTLogo } from '../components/ui/CFPTLogo';
import { Users, BookOpen, GraduationCap, TrendingUp, Star, Calendar, Award, Eye, RefreshCw, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DatabaseService } from '../services/database';

import { getRecents, getFavorites } from '../utils/recents';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { staff, evaluations, themes, isLoading: globalLoading, forceRefresh } = useDataSync();
  const [recents, setRecents] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  // Recents/Favorites utils
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // replaced require with ESM import below
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecentEvaluations, setFilteredRecentEvaluations] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState<any>(null);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<any[]>([]);
  const [stats, setStats] = useState([
    {
      name: 'Personnel Total',
      value: '0',
      change: '+0%',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Formations Enregistrées',
      value: '0',
      change: '+0%',
      icon: BookOpen,
      color: 'bg-green-500'
    },
    {
      name: 'Évaluations ce mois',
      value: '0',
      change: '+0%',
      icon: GraduationCap,
      color: 'bg-[#ff05f2]'
    },
    {
      name: 'Satisfaction Moyenne',
      value: '0/5',
      change: '+0',
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ]);


  // Calculer les statistiques basées sur les données synchronisées
  const calculateStats = React.useCallback(() => {
    try {
      console.log('Dashboard: Calcul des statistiques...');
      console.log('Dashboard: Personnel disponible:', staff?.length || 0);
      console.log('Dashboard: Évaluations disponibles:', evaluations?.length || 0);
      console.log('Dashboard: Thèmes disponibles:', themes?.length || 0);

      // Utiliser les données déjà chargées par useDataSync
      const safeStaff = Array.isArray(staff) ? staff : [];
      const safeEvaluations = Array.isArray(evaluations) ? evaluations : [];
      const safeThemes = Array.isArray(themes) ? themes : [];
      
      // Mettre à jour les évaluations filtrées
      setFilteredRecentEvaluations(safeEvaluations);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthEvaluations = safeEvaluations.filter(evaluation => {
        if (!evaluation?.createdAt) return false;
        try {
          const evalDate = new Date(evaluation.createdAt);
          return evalDate.getMonth() === currentMonth && evalDate.getFullYear() === currentYear;
        } catch {
          return false;
        }
      });

      // Calculer la satisfaction moyenne
      let avgSatisfaction = 0;
      if (safeEvaluations.length > 0) {
        const totalSatisfaction = safeEvaluations.reduce((sum, evaluation) => {
          if (!evaluation) return sum;
          const objectiveAchievement = Number(evaluation.objectiveAchievement) || 0;
          const relevanceToRole = Number(evaluation.relevanceToRole) || 0;
          const expectationsMet = Number(evaluation.expectationsMet) || 0;
          const skillsDevelopment = Number(evaluation.skillsDevelopment) || 0;
          return sum + (objectiveAchievement + relevanceToRole + expectationsMet + skillsDevelopment) / 4;
        }, 0);
        avgSatisfaction = totalSatisfaction / safeEvaluations.length;
      }

      // Mettre à jour les statistiques
      setStats([
        {
          name: 'Personnel Total',
          value: safeStaff.length.toString(),
          change: '+0%',
          icon: Users,
          color: 'bg-blue-500'
        },
        {
          name: 'Formations Enregistrées',
          value: safeThemes.length.toString(),
          change: '+0%',
          icon: BookOpen,
          color: 'bg-green-500'
        },
        {
          name: 'Évaluations ce mois',
          value: thisMonthEvaluations.length.toString(),
          change: '+0%',
          icon: GraduationCap,
          color: 'bg-[#ff05f2]'
        },
        {
          name: 'Satisfaction Moyenne',
          value: avgSatisfaction > 0 ? `${Math.round(avgSatisfaction * 10) / 10}/5` : '0/5',
          change: '+0',
          icon: TrendingUp,
          color: 'bg-orange-500'
        }
      ]);

    } catch (error) {
      console.error('Dashboard: Erreur lors du calcul des statistiques:', error);
    }
  }, [staff, evaluations, themes]);
  
  // Recalculer les statistiques quand les données changent
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Charger suggestions de suivi (dans 15j ou en retard)
  useEffect(() => {
    (async () => {
      try {
        const candidates = await DatabaseService.getFollowUpCandidates(6);
        const now = Date.now();
        const soonMs = 15 * 24 * 60 * 60 * 1000;
        const suggestions = (candidates || []).filter((c:any) => {
          const due = new Date(c.nextFollowUpDueAt).getTime();
          return c.isDue || (due - now <= soonMs);
        }).slice(0, 5);
        setFollowUpSuggestions(suggestions);
      } catch (e) {
        // ignore
      }
    })();
  }, [staff, evaluations, themes]);

  useEffect(()=>{
    try {
      setRecents(getRecents().slice(0,6));
      setFavorites(getFavorites().slice(0,6));
    } catch {}
  }, [staff, evaluations, themes]);

  const handleRefresh = async () => {
    console.log('Dashboard: Actualisation manuelle des données...');
    setIsRefreshing(true);
    forceRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredRecentEvaluations(evaluations);
    } else {
      const filtered = evaluations.filter(evaluation => {
        if (!evaluation) return false;
        const firstName = evaluation.firstName || '';
        const lastName = evaluation.lastName || '';
        const formationTheme = evaluation.formationTheme || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        const queryLower = query.toLowerCase();
        return fullName.includes(queryLower) || formationTheme.toLowerCase().includes(queryLower);
      });
      setFilteredRecentEvaluations(filtered);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-100';
    if (score >= 4.0) return 'bg-blue-100';
    if (score >= 3.5) return 'bg-orange-100';
    return 'bg-red-100';
  };
  
  const calculateOverallScore = (evaluation: any) => {
    const contentAvg = (
      (evaluation.skillsAcquisition || 0) + (evaluation.personalDevelopment || 0) + 
      (evaluation.courseClarity || 0) + (evaluation.theoryPractice || 0) + 
      (evaluation.syllabusAdequacy || 0) + (evaluation.practicalCases || 0) + 
      (evaluation.objectivesAchieved || 0) + (evaluation.adaptedKnowledge || 0)
    ) / 8;
    
    const methodsAvg = (
      (evaluation.pedagogicalSupport || 0) + (evaluation.techniquesUsed || 0) + 
      (evaluation.presentation || 0)
    ) / 3;
    
    const organizationAvg = (
      (evaluation.logisticsConditions || 0) + (evaluation.rhythm || 0) + 
      (evaluation.punctuality || 0) + (evaluation.punctualityAssiduity || 0)
    ) / 4;
    
    const behaviorAvg = (
      (evaluation.teamworkSense || 0) + (evaluation.motivationEnthusiasm || 0) + 
      (evaluation.communicationSociable || 0) + (evaluation.communicationGeneral || 0) + 
      (evaluation.aptitudeChangeIdeas || 0) + (evaluation.curiosity || 0) + 
      (evaluation.initiativeSpirit || 0) + (evaluation.responsibilitySense || 0)
    ) / 8;
    
    const cognitiveAvg = (
      (evaluation.criticalAnalysis || 0) + (evaluation.workExecution || 0) + 
      (evaluation.directivesComprehension || 0) + (evaluation.workQuality || 0) + 
      (evaluation.subjectMastery || 0)
    ) / 5;
    
    return (contentAvg + methodsAvg + organizationAvg + behaviorAvg + cognitiveAvg) / 5;
  };
  return (
    <Layout 
      title="Tableau de bord" 
      subtitle="Vue d'ensemble de votre centre de formation"
      onSearch={handleSearch}
    >
      <div className="space-y-6">
        {/* Welcome Section with CFPT Logo */}
        <Card className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-none shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/30 shadow-xl">
                <CFPTLogo size="2xl" color="white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Centre de Formation Professionnelle et Technique d'Ivato</h1>
                <p className="text-blue-100 text-lg font-medium">Excellence en formation professionnelle</p>
                <div className="flex items-center mt-3 space-x-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-200" />
                    <span className="text-sm font-medium">{staff?.length || 0} formateurs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-blue-200" />
                    <span className="text-sm font-medium">{evaluations?.length || 0} évaluations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-blue-200" />
                    <span className="text-sm font-medium">{themes?.length || 0} thèmes</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm font-medium italic">"Former avec excellence,</p>
              <p className="text-blue-100 text-sm font-medium italic">servir avec passion"</p>
            </div>
          </div>
        </Card>

        {/* Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Suggestions</h3>
              <div className="text-xs text-slate-500">Suivis à planifier</div>
            </div>
            <div className="space-y-2">
              {followUpSuggestions.length === 0 && (
                <div className="text-sm text-slate-500">Aucune suggestion pour le moment</div>
              )}
              {followUpSuggestions.map((s:any)=> (
                <div key={s.staff?.id} className="flex items-center justify-between px-3 py-2 border rounded-lg hover:bg-slate-50">
                  <div className="text-sm">
                    Suivi {s.isDue ? 'recommandé (Échu)' : 'dans 15j'} pour <span className="font-semibold">{s.staff?.firstName} {s.staff?.lastName}</span>
                  </div>
                  <Button size="sm" onClick={()=>navigate(`/evaluation/${s.staff?.id}?phase=followUp&initial=${s.lastInitialEvaluation?.id}`)}>Lancer le suivi</Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.name} className="group hover:scale-110 transition-all duration-300 bg-gradient-to-br from-white/95 to-blue-50/80">
              <div className="flex items-center">
                <div className={`p-4 rounded-2xl ${stat.color} shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="ml-6">
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-base text-gray-600 font-medium">{stat.name}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Graphique Performance Globale */}
        {evaluations.length > 0 && (
          <Card title="📈 Performances Générales" className="bg-gradient-to-br from-indigo-50 to-blue-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance par Catégorie */}
              <div className="h-80">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  Moyennes par Catégorie
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      {
                        name: 'Contenu',
                        score: evaluations.length > 0 ? evaluations.reduce((sum, e) => sum + (
                          ((e.skillsAcquisition || 0) + (e.personalDevelopment || 0) + 
                          (e.courseClarity || 0) + (e.theoryPractice || 0) + 
                          (e.syllabusAdequacy || 0) + (e.practicalCases || 0) + 
                          (e.objectivesAchieved || 0) + (e.adaptedKnowledge || 0)) / 8
                        ), 0) / evaluations.length : 0
                      },
                      {
                        name: 'Méthodes',
                        score: evaluations.length > 0 ? evaluations.reduce((sum, e) => sum + (
                          ((e.pedagogicalSupport || 0) + (e.techniquesUsed || 0) + (e.presentation || 0)) / 3
                        ), 0) / evaluations.length : 0
                      },
                      {
                        name: 'Organisation',
                        score: evaluations.length > 0 ? evaluations.reduce((sum, e) => sum + (
                          ((e.logisticsConditions || 0) + (e.rhythm || 0) + (e.punctuality || 0) + (e.punctualityAssiduity || 0)) / 4
                        ), 0) / evaluations.length : 0
                      },
                      {
                        name: 'Comportement',
                        score: evaluations.length > 0 ? evaluations.reduce((sum, e) => sum + (
                          ((e.teamworkSense || 0) + (e.motivationEnthusiasm || 0) + 
                          (e.communicationSociable || 0) + (e.communicationGeneral || 0) + 
                          (e.aptitudeChangeIdeas || 0) + (e.curiosity || 0) + 
                          (e.initiativeSpirit || 0) + (e.responsibilitySense || 0)) / 8
                        ), 0) / evaluations.length : 0
                      },
                      {
                        name: 'Cognitif',
                        score: evaluations.length > 0 ? evaluations.reduce((sum, e) => sum + (
                          ((e.criticalAnalysis || 0) + (e.workExecution || 0) + 
                          (e.directivesComprehension || 0) + (e.workQuality || 0) + (e.subjectMastery || 0)) / 5
                        ), 0) / evaluations.length : 0
                      }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(1)}/5`, 'Moyenne']}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#ef4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Répartition des Niveaux */}
              <div className="h-80">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">Répartition par Niveau</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(() => {
                        const per = new Map<string, { sum: number; count: number }>();
                        evaluations.forEach(e => {
                          const key = `${e.firstName} ${e.lastName}`;
                          const score = calculateOverallScore(e);
                          const cur = per.get(key) || { sum: 0, count: 0 };
                          cur.sum += score; cur.count += 1; per.set(key, cur);
                        });
                        const avgs = Array.from(per.values()).map(v => v.sum / v.count);
                        return [
                          { name: 'Excellent (3.5-5)', value: avgs.filter(a => a >= 3.5).length, fill: '#10b981' },
                          { name: 'Moyen (2.5-3.4)', value: avgs.filter(a => a >= 2.5 && a < 3.5).length, fill: '#f59e0b' },
                          { name: 'Faible (0-2.4)', value: avgs.filter(a => a < 2.5).length, fill: '#ef4444' },
                        ];
                      })()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value, percent }) => 
                        value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : null
                      }
                    >
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => navigate('/statistics')}
                variant="secondary"
                className="flex items-center bg-blue-100 hover:bg-blue-200 text-blue-700"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Voir analyses détaillées
              </Button>
            </div>
          </Card>
        )}
        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Évaluations Récentes" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-[#0011ef]" />
                  <span className="text-sm font-medium text-gray-600">Dernières 7 jours</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-[#ff05f2]" />
                  <span className="text-sm font-medium text-gray-600">{filteredRecentEvaluations.length} évaluations</span>
                </div>
                <Button 
                  onClick={handleRefresh}
                  variant="ghost" 
                  size="sm"
                  className="flex items-center text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Actualiser les données"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
              <Button 
                onClick={() => navigate('/staff')}
                variant="secondary"
                size="sm"
                className="flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir tout
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRecentEvaluations.slice(0, 6).map((evaluation, index) => {
                const personKey = `${evaluation.firstName} ${evaluation.lastName}`;
                const personEvals = evaluations.filter(e => `${e.firstName} ${e.lastName}` === personKey);
                const personAvg = personEvals.length > 0 ? (personEvals.reduce((sum, e) => sum + calculateOverallScore(e), 0) / personEvals.length) : 0;
                const created = new Date(evaluation.createdAt);
                const dateStr = created.toLocaleDateString('fr-FR');
                const timeStr = created.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const obs = (evaluation.justificationObservations || '').toString();
                const obsShort = obs.length > 120 ? obs.slice(0, 120) + '…' : obs;
                return (
                <div key={evaluation.id} className="p-6 bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/50 backdrop-blur-sm rounded-2xl border border-white/30 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-gradient-to-r from-[#0011ef] via-blue-600 to-[#ff05f2] rounded-2xl flex items-center justify-center shadow-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-sm">
                        {evaluation.firstName[0]}{evaluation.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-bold text-gray-900 text-lg">{evaluation.firstName} {evaluation.lastName}</p>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Terminé
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#0011ef] mb-1">{evaluation.formationTheme}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <span className="font-medium">{evaluation.position}</span>
                        <span>•</span>
                        <span>{evaluation.establishment}</span>
                        <span>•</span>
                        <span className="font-medium">{dateStr} à {timeStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Observations et moyennes */}
                  <div className="mt-3 text-sm text-gray-700">
                    {obsShort && (
                      <div className="mb-2">
                        <span className="text-gray-500">Observation: </span>
                        <span className="italic">{obsShort}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-xl ${getScoreBgColor(calculateOverallScore(evaluation))} flex items-center gap-2`}>
                        <Star className={`w-4 h-4 ${getScoreColor(calculateOverallScore(evaluation))}`} />
                        <span className={`font-bold ${getScoreColor(calculateOverallScore(evaluation))}`}>{calculateOverallScore(evaluation).toFixed(1)}</span>
                        <span className="text-gray-500">/5 (cette évaluation)</span>
                      </div>
                      <div className="px-3 py-1 rounded-xl bg-gray-100 text-gray-800">
                        Moyenne de la personne: <span className="font-semibold">{personAvg.toFixed(1)}</span> /5
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-end">
                    <Button
                      onClick={() => {
                        const staffMember = staff.find(member => 
                          member.firstName === evaluation.firstName && member.lastName === evaluation.lastName
                        );
                        if (staffMember) {
                          const enrichedMember = {
                            ...staffMember,
                            evaluations: personEvals,
                            latestEvaluation: evaluation
                          };
                          setSelectedStaffMember(enrichedMember);
                        }
                      }}
                      size="sm"
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700"
                      title="Afficher les détails"
                    >
                      Afficher détails
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
            
              {filteredRecentEvaluations.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CFPTLogo size="lg" color="dark" className="opacity-60" />
                </div>
                <p className="text-gray-500 text-lg font-medium">Aucune évaluation trouvée</p>
                <p className="text-gray-400">pour "{searchQuery}"</p>
              </div>
            )}
          </Card>

          <Card title="Formations Populaires">
            <div className="space-y-4">
              {(themes.length > 0 ? themes.map((theme, index) => {
                // Calculer les statistiques pour chaque thème
                const themeEvaluations = evaluations.filter(evaluation => evaluation.formationTheme === theme.name);
                const avgSatisfaction = themeEvaluations.length > 0 
                  ? themeEvaluations.reduce((sum, evaluation) => sum + (evaluation.objectiveAchievement + evaluation.relevanceToRole + evaluation.expectationsMet + evaluation.skillsDevelopment) / 4, 0) / themeEvaluations.length
                  : 0;
                
                return {
                  name: theme.name,
                  participants: themeEvaluations.length,
                  satisfaction: avgSatisfaction,
                  trend: themeEvaluations.length > 0 ? '+' + Math.floor(Math.random() * 20) + '%' : '0%'
                };
              }) : [
                { name: 'Aucune formation', participants: 0, satisfaction: 0, trend: '0%' }
              ]).map((formation, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-white/80 to-purple-50/80 backdrop-blur-sm rounded-2xl border border-white/30 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                      index === 2 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                      'bg-gradient-to-r from-purple-400 to-pink-500'
                    }`}>
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{formation.name}</p>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span>{formation.participants} participants</span>
                        <span className="text-green-600 font-medium">{formation.trend}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-bold text-lg text-[#0011ef]">{formation.satisfaction.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm">/5</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">satisfaction</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Formations les plus demandées">
            <div className="space-y-4">
              {(themes.length > 0 ? themes.map((theme, index) => {
                // Calculer les statistiques pour chaque thème
                const themeEvaluations = evaluations.filter(evaluation => evaluation.formationTheme === theme.name);
                const avgSatisfaction = themeEvaluations.length > 0 
                  ? themeEvaluations.reduce((sum, evaluation) => sum + (evaluation.objectiveAchievement + evaluation.relevanceToRole + evaluation.expectationsMet + evaluation.skillsDevelopment) / 4, 0) / themeEvaluations.length
                  : 0;
                
                return {
                  name: theme.name,
                  participants: themeEvaluations.length,
                  satisfaction: avgSatisfaction,
                  demande: themeEvaluations.length + Math.floor(Math.random() * 10) // Simule la demande
                };
              }).sort((a, b) => b.demande - a.demande).slice(0, 5) : [
                { name: 'Aucune formation', participants: 0, satisfaction: 0, demande: 0 }
              ]).map((formation, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-sm rounded-2xl border border-white/30 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                      index === 2 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                      index === 3 ? 'bg-gradient-to-r from-purple-400 to-pink-500' :
                      'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}>
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{formation.name}</p>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span>{formation.participants} participants</span>
                        <span className="text-blue-600 font-medium">#{index + 1} demandée</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-bold text-lg text-[#0011ef]">{formation.satisfaction.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm">/5</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">satisfaction</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Détails du membre sélectionné - Overlay avec effet de transparence */}
        {selectedStaffMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Arrière-plan avec effet de flou */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-indigo-900/30 to-purple-900/40 backdrop-blur-sm"
              onClick={() => setSelectedStaffMember(null)}
            ></div>
            
            {/* Contenu de la modale avec animation */}
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/20 animate-in fade-in-0 zoom-in-95 duration-300">
              {/* En-tête avec design moderne */}
              <div className="sticky top-0 bg-gradient-to-r from-white/95 to-blue-50/80 backdrop-blur-xl z-20 flex items-center justify-between p-8 border-b border-white/30">
                <div className="flex items-center space-x-5">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#0011ef] via-blue-600 to-[#ff05f2] rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-white/50">
                      <span className="text-white font-bold text-2xl">
                        {selectedStaffMember.firstName[0]}{selectedStaffMember.lastName[0]}
                      </span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-[#0011ef] via-blue-600 to-[#ff05f2] bg-clip-text text-transparent mb-1">
                      {selectedStaffMember.firstName} {selectedStaffMember.lastName}
                    </h2>
                    <p className="text-xl text-gray-600 font-semibold">{selectedStaffMember.position}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        🏢 {selectedStaffMember.establishment}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        📅 {selectedStaffMember.formationYear}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStaffMember(null)}
                  className="w-12 h-12 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
                  title="Fermer"
                >
                  <span className="text-2xl font-bold">×</span>
                </button>
              </div>
              
              {/* Contenu principal avec design amélioré */}
              <div className="p-8 space-y-8 bg-gradient-to-b from-transparent to-blue-50/20">
                {/* Informations personnelles détaillées avec design moderne */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 hover:bg-white/90 transition-all duration-300">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0011ef] to-blue-600 rounded-2xl flex items-center justify-center mr-3 shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    Informations Personnelles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50/80 to-indigo-100/60 backdrop-blur-sm rounded-2xl p-5 border border-blue-200/50 hover:shadow-lg transition-all duration-300">
                      <label className="block text-sm font-bold text-blue-700 mb-2">🏷️ Matricule</label>
                      <p className="text-xl font-bold text-[#0011ef]">{selectedStaffMember.matricule || 'Non renseigné'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50/80 to-emerald-100/60 backdrop-blur-sm rounded-2xl p-5 border border-green-200/50 hover:shadow-lg transition-all duration-300">
                      <label className="block text-sm font-bold text-green-700 mb-2">📞 Téléphone</label>
                      <p className="text-xl font-semibold text-gray-900">{selectedStaffMember.phone}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50/80 to-violet-100/60 backdrop-blur-sm rounded-2xl p-5 border border-purple-200/50 hover:shadow-lg transition-all duration-300">
                      <label className="block text-sm font-bold text-purple-700 mb-2">📧 Email</label>
                      <p className="text-lg font-semibold text-gray-900 break-all">{selectedStaffMember.email}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50/80 to-amber-100/60 backdrop-blur-sm rounded-2xl p-5 border border-orange-200/50 hover:shadow-lg transition-all duration-300">
                      <label className="block text-sm font-bold text-orange-700 mb-2">🏢 Établissement</label>
                      <p className="text-xl font-semibold text-gray-900">{selectedStaffMember.establishment}</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50/80 to-rose-100/60 backdrop-blur-sm rounded-2xl p-5 border border-pink-200/50 hover:shadow-lg transition-all duration-300">
                      <label className="block text-sm font-bold text-pink-700 mb-2">📅 Année Formation</label>
                      <p className="text-xl font-bold text-[#ff05f2]">{selectedStaffMember.formationYear}</p>
                    </div>
                    <div className="bg-gradient-to-br from-teal-50/80 to-cyan-100/60 backdrop-blur-sm rounded-2xl p-5 border border-teal-200/50 hover:shadow-lg transition-all duration-300">
                      <label className="block text-sm font-bold text-teal-700 mb-2">📅 Date d'ajout</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(selectedStaffMember.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statistiques d'évaluation */}
                {selectedStaffMember.evaluations && selectedStaffMember.evaluations.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <GraduationCap className="w-6 h-6 mr-2 text-green-600" />
                      Statistiques d'Évaluation ({selectedStaffMember.evaluations.length} évaluation(s))
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(() => {
                        const evaluations = selectedStaffMember.evaluations;
                        const avgObjective = evaluations.reduce((sum: number, evaluation: any) => sum + (evaluation.objectiveAchievement || 0), 0) / evaluations.length;
                        const avgRelevance = evaluations.reduce((sum: number, evaluation: any) => sum + (evaluation.relevanceToRole || 0), 0) / evaluations.length;
                        const avgExpectations = evaluations.reduce((sum: number, evaluation: any) => sum + (evaluation.expectationsMet || 0), 0) / evaluations.length;
                        const avgSkills = evaluations.reduce((sum: number, evaluation: any) => sum + (evaluation.skillsDevelopment || 0), 0) / evaluations.length;
                        
                        return [
                          { title: 'Objectifs Atteints', value: avgObjective, color: 'text-blue-600', bg: 'bg-blue-100' },
                          { title: 'Pertinence', value: avgRelevance, color: 'text-green-600', bg: 'bg-green-100' },
                          { title: 'Attentes', value: avgExpectations, color: 'text-purple-600', bg: 'bg-purple-100' },
                          { title: 'Compétences', value: avgSkills, color: 'text-pink-600', bg: 'bg-pink-100' },
                        ];
                      })().map((stat, index) => (
                        <div key={index} className={`${stat.bg} rounded-xl p-4 text-center`}>
                          <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                          <p className={`text-3xl font-bold ${stat.color}`}>
                            {stat.value.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500">/5.0</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dernière évaluation détaillée */}
                {selectedStaffMember.latestEvaluation && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Award className="w-6 h-6 mr-2 text-purple-600" />
                      Dernière Évaluation - {selectedStaffMember.latestEvaluation.formationTheme}
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Date de l'évaluation</span>
                          <span className="text-sm font-bold text-gray-900">
                            {new Date(selectedStaffMember.latestEvaluation.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Score global</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-[#0011ef]">
                              {(
                                (selectedStaffMember.latestEvaluation.objectiveAchievement +
                                selectedStaffMember.latestEvaluation.relevanceToRole +
                                selectedStaffMember.latestEvaluation.expectationsMet +
                                selectedStaffMember.latestEvaluation.skillsDevelopment) / 4
                              ).toFixed(1)}
                            </span>
                            <span className="text-gray-500">/5</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Recommandation</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${
                                  i < selectedStaffMember.latestEvaluation.recommendationScore 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">
                              ({selectedStaffMember.latestEvaluation.recommendationScore}/5)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedStaffMember.latestEvaluation.justificationObservations && (
                        <div className="bg-white rounded-xl p-4">
                          <label className="block text-sm font-medium text-gray-600 mb-2">📝 Observations</label>
                          <p className="text-gray-900 text-sm leading-relaxed">
                            {selectedStaffMember.latestEvaluation.justificationObservations}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Boutons d'action avec design moderne */}
              <div className="flex justify-center space-x-4 pt-8 border-t border-white/30">
                <button
                  onClick={() => {
                    setSelectedStaffMember(null);
                    navigate(`/evaluation/${selectedStaffMember.id}`);
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>📈 Nouvelle Évaluation</span>
                </button>
                <button
                  onClick={() => setSelectedStaffMember(null)}
                  className="px-8 py-4 bg-gradient-to-r from-[#4B4BFF] to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>← Fermer</span>
                </button>
              </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
