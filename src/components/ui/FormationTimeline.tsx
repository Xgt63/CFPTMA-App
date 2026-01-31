import React, { useState } from 'react';
import { PersonalFormationChart } from './PersonalFormationChart';
import { Card } from './Card';
import { Button } from './Button';
import { 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  Star, 
  BarChart3, 
  Radar, 
  Activity,
  ChevronDown,
  ChevronUp,
  Award,
  Target
} from 'lucide-react';

interface Formation {
  id: number;
  formationTheme: string;
  fillDate: string;
  objectiveAchievement: number;
  relevanceToRole: number;
  expectationsMet: number;
  skillsDevelopment: number;
  recommendationScore: number;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  objectives?: string;
  modules?: string;
  justifications?: string;
  [key: string]: any;
}

interface FormationTimelineProps {
  personName: string;
  formations: Formation[];
  showCharts?: boolean;
}

export const FormationTimeline: React.FC<FormationTimelineProps> = ({ 
  personName, 
  formations, 
  showCharts = true 
}) => {
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'radar' | 'line' | 'evolution'>('bar');
  const [expandedFormations, setExpandedFormations] = useState<Set<number>>(new Set());
  const [showAllCharts, setShowAllCharts] = useState(false);

  // Grouper les formations par thème
  const formationsByTheme = formations.reduce((acc, formation) => {
    const theme = formation.formationTheme;
    if (!acc[theme]) {
      acc[theme] = [];
    }
    acc[theme].push(formation);
    return acc;
  }, {} as Record<string, Formation[]>);

  // Trier les formations par date
  const sortedFormations = [...formations].sort((a, b) => 
    new Date(b.fillDate || b.createdAt).getTime() - new Date(a.fillDate || a.createdAt).getTime()
  );

  const toggleFormationExpansion = (formationId: number) => {
    const newExpanded = new Set(expandedFormations);
    if (newExpanded.has(formationId)) {
      newExpanded.delete(formationId);
    } else {
      newExpanded.add(formationId);
    }
    setExpandedFormations(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 bg-green-100';
    if (score >= 4) return 'text-blue-600 bg-blue-100';
    if (score >= 3) return 'text-yellow-600 bg-yellow-100';
    if (score >= 2) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-500';
    if (score >= 4) return 'bg-blue-500';
    if (score >= 3) return 'bg-yellow-500';
    if (score >= 2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (formations.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Aucune formation enregistrée pour {personName}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec statistiques amélioré */}
      <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl p-6 shadow-lg border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Parcours de Formation
              </h2>
              <p className="text-gray-600 text-sm">Analyse détaillée des compétences acquises</p>
            </div>
          </div>
        </div>
        
        {/* Statistiques avec design amélioré */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600">{formations.length}</div>
                <div className="text-sm text-gray-600 font-medium">Formation(s)</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-600">
                  {Object.keys(formationsByTheme).length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Thème(s)</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(formations.reduce((sum, f) => sum + (f.recommendationScore || 0), 0) / formations.length * 10) / 10}
                </div>
                <div className="text-sm text-gray-600 font-medium">Moy. Recommandation</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Résumé par thème amélioré */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
            Répartition par Thèmes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(formationsByTheme).map(([theme, themeFormations]) => {
              const avgScore = themeFormations.reduce((sum, f) => 
                sum + ((f.objectiveAchievement + f.relevanceToRole + f.expectationsMet + f.skillsDevelopment + f.recommendationScore) / 5), 0
              ) / themeFormations.length;

              return (
                <div key={theme} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-sm leading-tight mb-1">{theme}</h4>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {themeFormations.length} session{themeFormations.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(avgScore)} flex items-center`}>
                      <Star className="w-3 h-3 mr-1" />
                      {Math.round(avgScore * 10) / 10}/5
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(avgScore)}`}
                      style={{ width: `${(avgScore / 5) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-600 text-center">
                    {Math.round((avgScore / 5) * 100)}% de performance
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Graphiques personnalisés avec design amélioré */}
      {showCharts && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Analyse Graphique</h3>
                <p className="text-gray-600 text-sm">Visualisation interactive des performances</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedChartType === 'bar' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedChartType('bar')}
                className={`flex items-center transition-all duration-200 ${
                  selectedChartType === 'bar' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'hover:bg-gray-100 border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Barres
              </Button>
              <Button
                variant={selectedChartType === 'radar' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedChartType('radar')}
                className={`flex items-center transition-all duration-200 ${
                  selectedChartType === 'radar' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg transform scale-105' 
                    : 'hover:bg-gray-100 border-gray-300'
                }`}
              >
                <Radar className="w-4 h-4 mr-1" />
                Radar
              </Button>
              <Button
                variant={selectedChartType === 'evolution' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedChartType('evolution')}
                className={`flex items-center transition-all duration-200 ${
                  selectedChartType === 'evolution' 
                    ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg transform scale-105' 
                    : 'hover:bg-gray-100 border-gray-300'
                }`}
              >
                <Activity className="w-4 h-4 mr-1" />
                Évolution
              </Button>
            </div>
          </div>

          <PersonalFormationChart
            evaluations={formations}
            personName={personName}
            chartType={selectedChartType}
          />

          {showAllCharts && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedChartType !== 'radar' && (
                <PersonalFormationChart
                  evaluations={formations}
                  personName={personName}
                  chartType="radar"
                />
              )}
              {selectedChartType !== 'evolution' && (
                <PersonalFormationChart
                  evaluations={formations}
                  personName={personName}
                  chartType="evolution"
                />
              )}
            </div>
          )}

          <div className="flex justify-center mt-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAllCharts(!showAllCharts)}
              className="flex items-center bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border border-gray-300 px-6 py-2 rounded-xl transition-all duration-200 hover:shadow-md"
            >
              {showAllCharts ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Masquer les graphiques supplémentaires
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Voir tous les types de graphiques
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Timeline des formations avec design amélioré */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Historique Chronologique</h3>
            <p className="text-gray-600 text-sm">Parcours détaillé des formations suivies</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {sortedFormations.map((formation, index) => {
            const isExpanded = expandedFormations.has(formation.id);
            const avgScore = (
              (formation.objectiveAchievement || 0) +
              (formation.relevanceToRole || 0) +
              (formation.expectationsMet || 0) +
              (formation.skillsDevelopment || 0) +
              (formation.recommendationScore || 0)
            ) / 5;

            return (
              <div key={formation.id} className="relative">
                {/* Ligne de timeline */}
                {index < sortedFormations.length - 1 && (
                  <div className="absolute left-8 top-16 w-0.5 h-full bg-gradient-to-b from-blue-300 to-purple-300 z-0" />
                )}
                
                <div className="flex items-start space-x-4 relative z-10">
                  {/* Icône de timeline */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${getScoreColor(avgScore)} border-4 border-white shadow-lg`}>
                    <Award className="w-6 h-6" />
                  </div>

                  {/* Contenu de la formation */}
                  <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => toggleFormationExpansion(formation.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            {formation.formationTheme}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(formation.fillDate || formation.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-1 text-yellow-500" />
                              {Math.round(avgScore * 10) / 10}/5
                            </div>
                            <div className="flex items-center">
                              <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                              Recommandation: {formation.recommendationScore}/5
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(avgScore)}`}>
                            Score global: {Math.round(avgScore * 10) / 10}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Barre de progression rapide */}
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(avgScore)}`}
                          style={{ width: `${(avgScore / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Détails étendus */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          {/* Scores détaillés */}
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                              <Target className="w-4 h-4 mr-2" />
                              Scores par Critère
                            </h5>
                            <div className="space-y-3">
                              {[
                                { label: 'Atteinte des objectifs', score: formation.objectiveAchievement },
                                { label: 'Pertinence du rôle', score: formation.relevanceToRole },
                                { label: 'Attentes comblées', score: formation.expectationsMet },
                                { label: 'Développement compétences', score: formation.skillsDevelopment },
                                { label: 'Recommandation', score: formation.recommendationScore }
                              ].map(({ label, score }, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">{label}</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${getProgressColor(score || 0)}`}
                                        style={{ width: `${((score || 0) / 5) * 100}%` }}
                                      />
                                    </div>
                                    <span className={`text-sm font-semibold ${getScoreColor(score || 0)} px-2 py-0.5 rounded`}>
                                      {score || 0}/5
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Informations complémentaires */}
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                              <BookOpen className="w-4 h-4 mr-2" />
                              Détails Formation
                            </h5>
                            <div className="space-y-2 text-sm">
                              {formation.startDate && formation.endDate && (
                                <div>
                                  <span className="font-medium text-gray-700">Période:</span>
                                  <span className="ml-2 text-gray-600">
                                    Du {new Date(formation.startDate).toLocaleDateString('fr-FR')} 
                                    au {new Date(formation.endDate).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              )}
                              {formation.objectives && (
                                <div>
                                  <span className="font-medium text-gray-700">Objectifs:</span>
                                  <p className="ml-2 text-gray-600 mt-1 text-xs leading-relaxed bg-blue-50 p-2 rounded">
                                    {formation.objectives}
                                  </p>
                                </div>
                              )}
                              {formation.modules && (
                                <div>
                                  <span className="font-medium text-gray-700">Modules:</span>
                                  <p className="ml-2 text-gray-600 mt-1 text-xs leading-relaxed bg-purple-50 p-2 rounded">
                                    {formation.modules}
                                  </p>
                                </div>
                              )}
                              {formation.justifications && (
                                <div>
                                  <span className="font-medium text-gray-700">Observations:</span>
                                  <p className="ml-2 text-gray-600 mt-1 text-xs leading-relaxed bg-green-50 p-2 rounded">
                                    {formation.justifications}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};