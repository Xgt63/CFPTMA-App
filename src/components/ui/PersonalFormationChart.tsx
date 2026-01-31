import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line } from 'recharts';

interface Evaluation {
  id: number;
  formationTheme: string;
  fillDate: string;
  objectiveAchievement: number;
  relevanceToRole: number;
  expectationsMet: number;
  skillsDevelopment: number;
  recommendationScore: number;
  createdAt: string;
  // Autres champs d'évaluation...
  [key: string]: any;
}

interface PersonalFormationChartProps {
  evaluations: Evaluation[];
  personName: string;
  chartType?: 'bar' | 'radar' | 'line' | 'evolution';
}

export const PersonalFormationChart: React.FC<PersonalFormationChartProps> = ({ 
  evaluations, 
  personName, 
  chartType = 'bar' 
}) => {
  // Préparer les données pour le graphique
  const prepareBarData = () => {
    return evaluations.map((evaluation, index) => ({
      formation: `${evaluation.formationTheme}\n(${new Date(evaluation.fillDate || evaluation.createdAt).toLocaleDateString('fr-FR')})`,
      formationShort: evaluation.formationTheme.length > 15 ? evaluation.formationTheme.substring(0, 15) + '...' : evaluation.formationTheme,
      'Atteinte objectifs': evaluation.objectiveAchievement || 0,
      'Pertinence fonction': evaluation.relevanceToRole || 0,
      'Attentes comblées': evaluation.expectationsMet || 0,
      'Développement compétences': evaluation.skillsDevelopment || 0,
      'Recommandation': evaluation.recommendationScore || 0,
      date: new Date(evaluation.fillDate || evaluation.createdAt).toLocaleDateString('fr-FR'),
      index: index + 1
    }));
  };

  const prepareRadarData = () => {
    // Calculer la moyenne pour chaque critère
    if (evaluations.length === 0) return [];

    const avgData = evaluations.reduce((acc, evaluation) => ({
      'Atteinte objectifs': acc['Atteinte objectifs'] + (evaluation.objectiveAchievement || 0),
      'Pertinence fonction': acc['Pertinence fonction'] + (evaluation.relevanceToRole || 0),
      'Attentes comblées': acc['Attentes comblées'] + (evaluation.expectationsMet || 0),
      'Développement compétences': acc['Développement compétences'] + (evaluation.skillsDevelopment || 0),
      'Recommandation': acc['Recommandation'] + (evaluation.recommendationScore || 0)
    }), {
      'Atteinte objectifs': 0,
      'Pertinence fonction': 0,
      'Attentes comblées': 0,
      'Développement compétences': 0,
      'Recommandation': 0
    });

    return Object.entries(avgData).map(([subject, value]) => ({
      subject,
      score: Math.round((value / evaluations.length) * 10) / 10,
      fullMark: 5
    }));
  };

  const prepareEvolutionData = () => {
    return evaluations
      .sort((a, b) => new Date(a.fillDate || a.createdAt).getTime() - new Date(b.fillDate || b.createdAt).getTime())
      .map((evaluation, index) => ({
        formation: evaluation.formationTheme.substring(0, 10) + '...',
        date: new Date(evaluation.fillDate || evaluation.createdAt).toLocaleDateString('fr-FR'),
        'Moyenne générale': Math.round(((evaluation.objectiveAchievement || 0) + 
                                       (evaluation.relevanceToRole || 0) + 
                                       (evaluation.expectationsMet || 0) + 
                                       (evaluation.skillsDevelopment || 0) + 
                                       (evaluation.recommendationScore || 0)) / 5 * 10) / 10,
        'Recommandation': evaluation.recommendationScore || 0,
        ordre: index + 1
      }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}/5
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getChartTitle = () => {
    switch (chartType) {
      case 'radar':
        return `Profil de compétences moyen - ${personName}`;
      case 'line':
        return `Évolution des scores - ${personName}`;
      case 'evolution':
        return `Évolution chronologique - ${personName}`;
      default:
        return `Évaluations par formation - ${personName}`;
    }
  };

  if (evaluations.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-gray-600">Aucune évaluation disponible pour {personName}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {getChartTitle()}
        </h3>
        <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto"></div>
      </div>
      
      <div className="h-80 w-full">
        {chartType === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prepareBarData()} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formationShort" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis domain={[0, 5]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Atteinte objectifs" fill="#0011ef" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Pertinence fonction" fill="#4f46e5" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Attentes comblées" fill="#7c3aed" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Développement compétences" fill="#c026d3" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Recommandation" fill="#ff05f2" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === 'radar' && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={prepareRadarData()} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" fontSize={12} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 5]} 
                fontSize={10}
                tickCount={6}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#0011ef"
                fill="#0011ef"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip formatter={(value: any) => [`${value}/5`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {(chartType === 'line' || chartType === 'evolution') && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={prepareEvolutionData()} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formation" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis domain={[0, 5]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Moyenne générale" 
                stroke="#0011ef" 
                strokeWidth={3}
                dot={{ fill: '#0011ef', strokeWidth: 2, r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="Recommandation" 
                stroke="#ff05f2" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#ff05f2', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Résumé statistique amélioré */}
      <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl border border-blue-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">Résumé des Performances</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-blue-600">{evaluations.length}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Formation(s)</div>
          </div>
          <div className="text-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-lg font-bold text-purple-600">
                {Math.round(evaluations.reduce((sum, e) => sum + (e.recommendationScore || 0), 0) / evaluations.length * 10) / 10}
              </span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Recommandation moy.</div>
          </div>
          <div className="text-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-lg font-bold text-pink-600">
                {Math.round(evaluations.reduce((sum, e) => sum + ((e.objectiveAchievement || 0) + (e.relevanceToRole || 0) + (e.expectationsMet || 0) + (e.skillsDevelopment || 0)) / 4, 0) / evaluations.length * 10) / 10}
              </span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Score moyen</div>
          </div>
          <div className="text-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-green-600">
                {new Set(evaluations.map(e => e.formationTheme)).size}
              </span>
            </div>
            <div className="text-sm text-gray-600 font-medium">Thème(s) unique(s)</div>
          </div>
        </div>
      </div>
    </div>
  );
};