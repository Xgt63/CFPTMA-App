/**
 * 📈 Service d'Analyse Avancée
 * Analyses prédictives et clustering pour l'évaluation de performance
 */

import { aiEngine, EmployeeEvaluation, AIInsight, PerformancePrediction, EmployeeCluster } from './aiEngine';

export interface AdvancedAnalytics {
  insights: AIInsight[];
  predictions: PerformancePrediction[];
  clusters: EmployeeCluster[];
  riskMatrix: RiskMatrix;
  performanceTrends: PerformanceTrends;
  recommendationEngine: RecommendationResult[];
}

export interface RiskMatrix {
  highRisk: RiskEmployee[];
  mediumRisk: RiskEmployee[];
  lowRisk: RiskEmployee[];
  opportunities: OpportunityEmployee[];
}

export interface RiskEmployee {
  name: string;
  riskScore: number; // 0-100
  riskFactors: string[];
  recommendation: string;
  urgency: 'immediate' | 'short-term' | 'long-term';
}

export interface OpportunityEmployee {
  name: string;
  opportunityScore: number; // 0-100
  potentialAreas: string[];
  developmentPlan: string;
}

export interface PerformanceTrends {
  overall: TrendData;
  byDepartment: { [department: string]: TrendData };
  byFormation: { [formation: string]: TrendData };
  seasonal: SeasonalTrend[];
}

export interface TrendData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

export interface SeasonalTrend {
  period: string;
  averageScore: number;
  evaluationCount: number;
  topPerformers: string[];
}

export interface RecommendationResult {
  employeeName: string;
  priority: 'high' | 'medium' | 'low';
  category: 'training' | 'coaching' | 'recognition' | 'development';
  title: string;
  description: string;
  expectedImpact: number; // 0-100
  timeframe: string;
  resources: string[];
}

export class AdvancedAnalyticsService {
  
  /**
   * 🔍 Analyse complète avec IA avancée
   */
  async performAdvancedAnalysis(evaluations: EmployeeEvaluation[]): Promise<AdvancedAnalytics> {
    console.log('🔍 AdvancedAnalytics: Début de l\'analyse avancée...');
    
    // Initialiser le moteur IA
    aiEngine.initialize(evaluations);
    
    // Générer toutes les analyses
    const [
      insights,
      predictions,
      clusters,
      riskMatrix,
      performanceTrends,
      recommendations
    ] = await Promise.all([
      this.getInsights(),
      this.getPredictions(),
      this.getClusters(),
      this.generateRiskMatrix(evaluations),
      this.analyzePerformanceTrends(evaluations),
      this.generateRecommendations(evaluations)
    ]);

    console.log(`🔍 AdvancedAnalytics: Analyse terminée - ${insights.length} insights générés`);

    return {
      insights,
      predictions,
      clusters,
      riskMatrix,
      performanceTrends,
      recommendationEngine: recommendations
    };
  }

  /**
   * 🧠 Récupération des insights IA
   */
  private async getInsights(): Promise<AIInsight[]> {
    return aiEngine.getInsights();
  }

  /**
   * 🔮 Récupération des prédictions
   */
  private async getPredictions(): Promise<PerformancePrediction[]> {
    return aiEngine.getAllPredictions();
  }

  /**
   * 👥 Récupération des clusters
   */
  private async getClusters(): Promise<EmployeeCluster[]> {
    return aiEngine.clusterEmployees();
  }

  /**
   * ⚠️ Génération de la matrice de risques
   */
  private async generateRiskMatrix(evaluations: EmployeeEvaluation[]): Promise<RiskMatrix> {
    const employeeStats = this.getEmployeeStatistics(evaluations);
    const predictions = aiEngine.getAllPredictions();
    
    const riskEmployees: RiskEmployee[] = [];
    const opportunityEmployees: OpportunityEmployee[] = [];

    employeeStats.forEach(employee => {
      const prediction = predictions.find(p => p.employeeName === employee.name);
      const riskScore = this.calculateRiskScore(employee, prediction);
      const opportunityScore = this.calculateOpportunityScore(employee);

      if (riskScore > 30) {
        riskEmployees.push({
          name: employee.name,
          riskScore,
          riskFactors: this.identifyRiskFactors(employee, prediction),
          recommendation: this.generateRiskRecommendation(employee, riskScore),
          urgency: riskScore > 70 ? 'immediate' : riskScore > 50 ? 'short-term' : 'long-term'
        });
      }

      if (opportunityScore > 60) {
        opportunityEmployees.push({
          name: employee.name,
          opportunityScore,
          potentialAreas: this.identifyPotentialAreas(employee),
          developmentPlan: this.generateDevelopmentPlan(employee, opportunityScore)
        });
      }
    });

    return {
      highRisk: riskEmployees.filter(e => e.riskScore > 70),
      mediumRisk: riskEmployees.filter(e => e.riskScore >= 50 && e.riskScore <= 70),
      lowRisk: riskEmployees.filter(e => e.riskScore >= 30 && e.riskScore < 50),
      opportunities: opportunityEmployees
    };
  }

  /**
   * 📈 Analyse des tendances de performance
   */
  private async analyzePerformanceTrends(evaluations: EmployeeEvaluation[]): Promise<PerformanceTrends> {
    const currentPeriod = this.getRecentEvaluations(evaluations, 90); // 3 derniers mois
    const previousPeriod = this.getRecentEvaluations(evaluations, 180, 90); // 3 mois précédents

    const overall = this.calculateTrendData(currentPeriod, previousPeriod);
    
    // Tendances par département
    const byDepartment: { [department: string]: TrendData } = {};
    const departments = [...new Set(evaluations.map(e => e.department || 'Non spécifié'))];
    
    departments.forEach(dept => {
      const currentDept = currentPeriod.filter(e => (e.department || 'Non spécifié') === dept);
      const previousDept = previousPeriod.filter(e => (e.department || 'Non spécifié') === dept);
      byDepartment[dept] = this.calculateTrendData(currentDept, previousDept);
    });

    // Tendances par formation
    const byFormation: { [formation: string]: TrendData } = {};
    const formations = [...new Set(evaluations.map(e => e.formationTheme))];
    
    formations.forEach(formation => {
      const currentFormation = currentPeriod.filter(e => e.formationTheme === formation);
      const previousFormation = previousPeriod.filter(e => e.formationTheme === formation);
      byFormation[formation] = this.calculateTrendData(currentFormation, previousFormation);
    });

    // Tendances saisonnières
    const seasonal = this.calculateSeasonalTrends(evaluations);

    return {
      overall,
      byDepartment,
      byFormation,
      seasonal
    };
  }

  /**
   * 💡 Génération de recommandations personnalisées
   */
  private async generateRecommendations(evaluations: EmployeeEvaluation[]): Promise<RecommendationResult[]> {
    const employeeStats = this.getEmployeeStatistics(evaluations);
    const predictions = aiEngine.getAllPredictions();
    const clusters = aiEngine.clusterEmployees();
    
    const recommendations: RecommendationResult[] = [];

    employeeStats.forEach(employee => {
      const prediction = predictions.find(p => p.employeeName === employee.name);
      const cluster = this.findEmployeeCluster(employee.name, clusters);
      
      // Recommandations basées sur la performance actuelle
      if (employee.averageScore < 3) {
        recommendations.push({
          employeeName: employee.name,
          priority: 'high',
          category: 'training',
          title: 'Formation de remise à niveau urgente',
          description: `Performance actuelle de ${employee.averageScore.toFixed(1)}/5 nécessite une intervention immédiate`,
          expectedImpact: 85,
          timeframe: '2-4 semaines',
          resources: ['Formation intensive', 'Coaching individuel', 'Suivi hebdomadaire']
        });
      } else if (employee.averageScore >= 4) {
        recommendations.push({
          employeeName: employee.name,
          priority: 'medium',
          category: 'development',
          title: 'Développement des compétences de leadership',
          description: `Excellente performance (${employee.averageScore.toFixed(1)}/5) - Potentiel de leader`,
          expectedImpact: 75,
          timeframe: '3-6 mois',
          resources: ['Formation leadership', 'Mentoring', 'Projets spéciaux']
        });
      }

      // Recommandations basées sur les prédictions
      if (prediction && prediction.trend === 'declining') {
        recommendations.push({
          employeeName: employee.name,
          priority: 'high',
          category: 'coaching',
          title: 'Intervention préventive - Tendance déclinante',
          description: `Prédiction: baisse vers ${prediction.predictedScore.toFixed(1)}/5`,
          expectedImpact: 80,
          timeframe: '1-3 mois',
          resources: ['Entretien individuel', 'Plan d\'action personnalisé', 'Suivi renforcé']
        });
      } else if (prediction && prediction.trend === 'improving') {
        recommendations.push({
          employeeName: employee.name,
          priority: 'low',
          category: 'recognition',
          title: 'Reconnaissance de l\'amélioration',
          description: `Progression positive prédite vers ${prediction.predictedScore.toFixed(1)}/5`,
          expectedImpact: 60,
          timeframe: '1 mois',
          resources: ['Reconnaissance publique', 'Responsabilités accrues']
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // ===== MÉTHODES UTILITAIRES =====

  private getEmployeeStatistics(evaluations: EmployeeEvaluation[]) {
    const employeeMap = new Map();
    
    evaluations.forEach(evaluation => {
      const key = `${evaluation.firstName} ${evaluation.lastName}`;
      const overallScore = this.calculateOverallScore(evaluation);
      
      if (!employeeMap.has(key)) {
        employeeMap.set(key, {
          name: key,
          position: evaluation.position,
          department: evaluation.department || 'Non spécifié',
          evaluations: [],
          averageScore: 0,
          evaluationCount: 0,
          lastEvaluation: evaluation.createdAt
        });
      }
      
      const employee = employeeMap.get(key);
      employee.evaluations.push(evaluation);
      employee.evaluationCount++;
      
      const totalScore = employee.evaluations.reduce((sum: number, e: any) => sum + this.calculateOverallScore(e), 0);
      employee.averageScore = totalScore / employee.evaluationCount;
    });
    
    return Array.from(employeeMap.values());
  }

  private calculateOverallScore(evaluation: EmployeeEvaluation): number {
    const contentScore = (
      evaluation.skillsAcquisition + evaluation.personalDevelopment + 
      evaluation.courseClarity + evaluation.theoryPractice + 
      evaluation.syllabusAdequacy + evaluation.practicalCases + 
      evaluation.objectivesAchieved + evaluation.adaptedKnowledge
    ) / 8;

    const methodsScore = (
      evaluation.pedagogicalSupport + evaluation.techniquesUsed + 
      evaluation.presentation
    ) / 3;

    const organizationScore = (
      evaluation.logisticsConditions + evaluation.rhythm + 
      evaluation.punctuality + evaluation.punctualityAssiduity
    ) / 4;

    const behaviorScore = (
      evaluation.teamworkSense + evaluation.motivationEnthusiasm + 
      evaluation.communicationSociable + evaluation.communicationGeneral + 
      evaluation.aptitudeChangeIdeas + evaluation.curiosity + 
      evaluation.initiativeSpirit + evaluation.responsibilitySense
    ) / 8;

    const cognitiveScore = (
      evaluation.criticalAnalysis + evaluation.workExecution + 
      evaluation.directivesComprehension + evaluation.workQuality + 
      evaluation.subjectMastery
    ) / 5;

    return (contentScore + methodsScore + organizationScore + behaviorScore + cognitiveScore) / 5;
  }

  private calculateRiskScore(employee: any, prediction?: PerformancePrediction): number {
    let riskScore = 0;

    // Score de base basé sur la performance
    if (employee.averageScore < 2.5) riskScore += 40;
    else if (employee.averageScore < 3) riskScore += 25;
    else if (employee.averageScore < 3.5) riskScore += 10;

    // Facteur de prédiction
    if (prediction) {
      if (prediction.trend === 'declining') riskScore += 30;
      else if (prediction.trend === 'stable' && employee.averageScore < 3) riskScore += 15;
    }

    // Facteur de fréquence d'évaluation
    if (employee.evaluationCount < 2) riskScore += 10;

    // Facteur de temps depuis la dernière évaluation
    const daysSinceLastEval = Math.floor(
      (Date.now() - new Date(employee.lastEvaluation).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastEval > 90) riskScore += 20;

    return Math.min(100, riskScore);
  }

  private calculateOpportunityScore(employee: any): number {
    let opportunityScore = 0;

    // Score de base basé sur la performance
    if (employee.averageScore >= 4) opportunityScore += 40;
    else if (employee.averageScore >= 3.5) opportunityScore += 25;

    // Facteur de consistance
    if (employee.evaluationCount >= 3) {
      const scores = employee.evaluations.map((e: any) => this.calculateOverallScore(e));
      const variance = this.calculateVariance(scores);
      if (variance < 0.5) opportunityScore += 20; // Performance consistante
    }

    // Facteur d'amélioration
    if (employee.evaluationCount >= 2) {
      const recentScore = this.calculateOverallScore(employee.evaluations[employee.evaluations.length - 1]);
      const olderScore = this.calculateOverallScore(employee.evaluations[0]);
      if (recentScore > olderScore) opportunityScore += 20;
    }

    return Math.min(100, opportunityScore);
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private identifyRiskFactors(employee: any, prediction?: PerformancePrediction): string[] {
    const factors: string[] = [];

    if (employee.averageScore < 3) factors.push('Performance en dessous de la moyenne');
    if (prediction?.trend === 'declining') factors.push('Tendance déclinante prédite');
    if (employee.evaluationCount < 2) factors.push('Manque de données historiques');
    
    const daysSinceLastEval = Math.floor(
      (Date.now() - new Date(employee.lastEvaluation).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastEval > 90) factors.push('Dernière évaluation trop ancienne');

    return factors;
  }

  private identifyPotentialAreas(employee: any): string[] {
    const areas: string[] = [];

    if (employee.averageScore >= 4) areas.push('Leadership et mentoring');
    if (employee.evaluationCount >= 3) areas.push('Formations avancées');
    areas.push('Projets transversaux');
    areas.push('Responsabilités accrues');

    return areas;
  }

  private generateRiskRecommendation(employee: any, riskScore: number): string {
    if (riskScore > 70) {
      return `Action immédiate requise: entretien d'urgence, plan d'amélioration intensif et suivi quotidien.`;
    } else if (riskScore > 50) {
      return `Surveillance renforcée: entretien dans les 2 semaines, plan d'action personnalisé.`;
    }
    return `Monitoring: évaluation dans le mois et ajustements selon les besoins.`;
  }

  private generateDevelopmentPlan(employee: any, opportunityScore: number): string {
    if (opportunityScore > 80) {
      return `Plan de développement accéléré: formation leadership, projets stratégiques, mentoring d'autres employés.`;
    }
    return `Développement progressif: nouvelles responsabilités, formations spécialisées, participation aux décisions.`;
  }

  private getRecentEvaluations(evaluations: EmployeeEvaluation[], days: number, offset = 0): EmployeeEvaluation[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days - offset);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - offset);

    return evaluations.filter(evaluation => {
      const evalDate = new Date(evaluation.createdAt);
      return evalDate >= cutoffDate && evalDate <= startDate;
    });
  }

  private calculateTrendData(current: EmployeeEvaluation[], previous: EmployeeEvaluation[]): TrendData {
    const currentAvg = current.length > 0 ? 
      current.reduce((sum, evaluation) => sum + this.calculateOverallScore(evaluation), 0) / current.length : 0;
    
    const previousAvg = previous.length > 0 ? 
      previous.reduce((sum, evaluation) => sum + this.calculateOverallScore(evaluation), 0) / previous.length : currentAvg;

    const change = currentAvg - previousAvg;
    const changePercent = previousAvg > 0 ? (change / previousAvg) * 100 : 0;
    
    const trend = Math.abs(change) < 0.1 ? 'stable' : change > 0 ? 'up' : 'down';
    const confidence = Math.min(95, Math.max(50, (current.length + previous.length) * 10));

    return {
      current: Number(currentAvg.toFixed(2)),
      previous: Number(previousAvg.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(1)),
      trend,
      confidence
    };
  }

  private calculateSeasonalTrends(evaluations: EmployeeEvaluation[]): SeasonalTrend[] {
    const seasons = ['Printemps', 'Été', 'Automne', 'Hiver'];
    const seasonalData: SeasonalTrend[] = [];

    seasons.forEach(season => {
      const seasonEvals = this.getSeasonEvaluations(evaluations, season);
      
      if (seasonEvals.length > 0) {
        const averageScore = seasonEvals.reduce((sum, evaluation) => sum + this.calculateOverallScore(evaluation), 0) / seasonEvals.length;
        
        // Top performers de la saison
        const employeeScores = new Map();
        seasonEvals.forEach(evaluation => {
          const key = `${evaluation.firstName} ${evaluation.lastName}`;
          const score = this.calculateOverallScore(evaluation);
          
          if (!employeeScores.has(key)) {
            employeeScores.set(key, []);
          }
          employeeScores.get(key).push(score);
        });

        const topPerformers = Array.from(employeeScores.entries())
          .map(([name, scores]: [string, number[]]) => ({
            name,
            averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
          }))
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 3)
          .map(performer => performer.name);

        seasonalData.push({
          period: season,
          averageScore: Number(averageScore.toFixed(2)),
          evaluationCount: seasonEvals.length,
          topPerformers
        });
      }
    });

    return seasonalData;
  }

  private getSeasonEvaluations(evaluations: EmployeeEvaluation[], season: string): EmployeeEvaluation[] {
    return evaluations.filter(evaluation => {
      const date = new Date(evaluation.createdAt);
      const month = date.getMonth() + 1;
      
      switch (season) {
        case 'Printemps': return month >= 3 && month <= 5;
        case 'Été': return month >= 6 && month <= 8;
        case 'Automne': return month >= 9 && month <= 11;
        case 'Hiver': return month === 12 || month <= 2;
        default: return false;
      }
    });
  }

  private findEmployeeCluster(employeeName: string, clusters: EmployeeCluster[]): EmployeeCluster | undefined {
    return clusters.find(cluster => cluster.employees.includes(employeeName));
  }
}

// Instance singleton
export const advancedAnalytics = new AdvancedAnalyticsService();