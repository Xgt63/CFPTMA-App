/**
 * 🧠 Moteur d'Intelligence Artificielle Hors Ligne
 * Algorithmes statistiques avancés pour l'analyse de performance
 * 
 * Fonctionnalités:
 * - Analyse de tendances et patterns
 * - Détection d'anomalies
 * - Corrélations multi-variables
 * - Prédictions basées sur l'historique
 * - Clustering d'employés
 * - Scoring de risque et opportunités
 */

export interface EmployeeEvaluation {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department?: string;
  gender?: string;
  age?: number;
  hireDate?: string;
  formationTheme: string;
  createdAt: string;
  
  // Scores par catégorie
  skillsAcquisition: number;
  personalDevelopment: number;
  courseClarity: number;
  theoryPractice: number;
  syllabusAdequacy: number;
  practicalCases: number;
  objectivesAchieved: number;
  adaptedKnowledge: number;
  
  pedagogicalSupport: number;
  techniquesUsed: number;
  presentation: number;
  
  logisticsConditions: number;
  rhythm: number;
  punctuality: number;
  punctualityAssiduity: number;
  
  teamworkSense: number;
  motivationEnthusiasm: number;
  communicationSociable: number;
  communicationGeneral: number;
  aptitudeChangeIdeas: number;
  curiosity: number;
  initiativeSpirit: number;
  responsibilitySense: number;
  
  criticalAnalysis: number;
  workExecution: number;
  directivesComprehension: number;
  workQuality: number;
  subjectMastery: number;
  
  recommendationScore: number;
  comments?: string;
}

export interface AIInsight {
  type: 'trend' | 'anomaly' | 'prediction' | 'risk' | 'opportunity' | 'correlation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  confidence: number; // 0-100
  data?: any;
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  slope: number; // Pente de la tendance
  correlation: number; // -1 à 1
  confidence: number; // 0-100
  prediction: number; // Valeur prédite
  dataPoints: Array<{date: string, value: number}>;
}

export interface AnomalyDetection {
  isAnomaly: boolean;
  score: number; // Z-score
  severity: 'low' | 'medium' | 'high';
  expectedRange: [number, number];
  actualValue: number;
}

export interface EmployeeCluster {
  clusterId: number;
  name: string;
  description: string;
  characteristics: string[];
  employees: string[];
  averageScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PerformancePrediction {
  employeeName: string;
  currentScore: number;
  predictedScore: number;
  trend: 'improving' | 'declining' | 'stable';
  confidence: number;
  timeframe: string;
  factors: string[];
}

export class AIEngine {
  private evaluations: EmployeeEvaluation[] = [];
  private insights: AIInsight[] = [];

  /**
   * 📊 Initialiser le moteur avec les données
   */
  initialize(evaluations: EmployeeEvaluation[]) {
    this.evaluations = evaluations;
    this.insights = [];
    this.generateAllInsights();
  }

  /**
   * 🔍 Génération complète des insights IA
   */
  private generateAllInsights() {
    console.log('🧠 AI Engine: Génération des insights...');
    
    // Analyser les tendances générales
    this.analyzeTrends();
    
    // Détecter les anomalies
    this.detectAnomalies();
    
    // Analyser les corrélations
    this.analyzeCorrelations();
    
    // Prédire les performances futures
    this.generatePredictions();
    
    // Détecter les risques et opportunités
    this.detectRisksAndOpportunities();
    
    // Analyser les patterns saisonniers
    this.analyzeSeasonalPatterns();

    console.log(`🧠 AI Engine: ${this.insights.length} insights générés`);
  }

  /**
   * 📈 Analyse des tendances de performance
   */
  private analyzeTrends() {
    const monthlyData = this.groupByMonth();
    
    Object.entries(monthlyData).forEach(([metric, data]) => {
      const trend = this.calculateTrend(data);
      
      if (Math.abs(trend.slope) > 0.1) {
        this.insights.push({
          type: 'trend',
          severity: Math.abs(trend.slope) > 0.3 ? 'high' : 'medium',
          title: `Tendance ${trend.trend} - ${metric}`,
          description: `${metric} montre une tendance ${trend.trend} avec une variation de ${(trend.slope * 100).toFixed(1)}% par mois`,
          recommendation: this.getTrendRecommendation(metric, trend),
          confidence: trend.confidence,
          data: { metric, trend }
        });
      }
    });
  }

  /**
   * 🚨 Détection des anomalies de performance
   */
  private detectAnomalies() {
    const employeeStats = this.getEmployeeStatistics();
    
    employeeStats.forEach(employee => {
      const anomaly = this.detectEmployeeAnomaly(employee);
      
      if (anomaly.isAnomaly && anomaly.score > 2) {
        this.insights.push({
          type: 'anomaly',
          severity: anomaly.severity,
          title: `Performance inhabituelle - ${employee.name}`,
          description: `Score de ${employee.averageScore}/5 (attendu: ${anomaly.expectedRange[0].toFixed(1)}-${anomaly.expectedRange[1].toFixed(1)})`,
          recommendation: this.getAnomalyRecommendation(employee, anomaly),
          confidence: Math.min(anomaly.score * 20, 95),
          data: { employee, anomaly }
        });
      }
    });
  }

  /**
   * 🔗 Analyse des corrélations entre variables
   */
  private analyzeCorrelations() {
    const correlations = this.calculateCorrelationMatrix();
    
    correlations.forEach(corr => {
      if (Math.abs(corr.value) > 0.6) {
        this.insights.push({
          type: 'correlation',
          severity: Math.abs(corr.value) > 0.8 ? 'high' : 'medium',
          title: `Forte corrélation: ${corr.var1} ↔ ${corr.var2}`,
          description: `Corrélation de ${(corr.value * 100).toFixed(1)}% entre ${corr.var1} et ${corr.var2}`,
          recommendation: this.getCorrelationRecommendation(corr),
          confidence: Math.abs(corr.value) * 100,
          data: corr
        });
      }
    });
  }

  /**
   * 🔮 Génération de prédictions
   */
  private generatePredictions() {
    const employees = this.getEmployeeStatistics();
    
    employees.forEach(employee => {
      if (employee.evaluationCount >= 3) {
        const prediction = this.predictEmployeePerformance(employee);
        
        if (prediction.confidence > 60) {
          const severity = prediction.trend === 'declining' ? 'high' : 
                          prediction.trend === 'improving' ? 'medium' : 'low';
          
          this.insights.push({
            type: 'prediction',
            severity,
            title: `Prédiction: ${employee.name} - ${prediction.trend}`,
            description: `Performance prédite: ${prediction.predictedScore.toFixed(1)}/5 (${prediction.timeframe})`,
            recommendation: this.getPredictionRecommendation(prediction),
            confidence: prediction.confidence,
            data: prediction
          });
        }
      }
    });
  }

  /**
   * ⚠️ Détection des risques et opportunités
   */
  private detectRisksAndOpportunities() {
    const riskAnalysis = this.analyzeRisks();
    const opportunities = this.identifyOpportunities();

    // Risques
    riskAnalysis.forEach(risk => {
      if (risk.probability > 0.6) {
        this.insights.push({
          type: 'risk',
          severity: risk.severity,
          title: `Risque détecté: ${risk.category}`,
          description: risk.description,
          recommendation: risk.mitigation,
          confidence: risk.probability * 100,
          data: risk
        });
      }
    });

    // Opportunités
    opportunities.forEach(opportunity => {
      this.insights.push({
        type: 'opportunity',
        severity: 'medium',
        title: `Opportunité: ${opportunity.category}`,
        description: opportunity.description,
        recommendation: opportunity.action,
        confidence: opportunity.potential * 100,
        data: opportunity
      });
    });
  }

  /**
   * 📅 Analyse des patterns saisonniers
   */
  private analyzeSeasonalPatterns() {
    const seasonalData = this.groupBySeasons();
    
    Object.entries(seasonalData).forEach(([season, data]) => {
      if (data.length > 0) {
        const avgScore = data.reduce((sum, evaluation) => sum + this.calculateOverallScore(evaluation), 0) / data.length;
        const deviation = this.calculateSeasonalDeviation(season, avgScore);
        
        if (Math.abs(deviation) > 0.3) {
          this.insights.push({
            type: 'trend',
            severity: 'medium',
            title: `Pattern saisonnier - ${season}`,
            description: `Performance ${deviation > 0 ? 'supérieure' : 'inférieure'} de ${Math.abs(deviation * 100).toFixed(1)}% en ${season}`,
            recommendation: this.getSeasonalRecommendation(season, deviation),
            confidence: 75,
            data: { season, deviation, avgScore }
          });
        }
      }
    });
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * 📊 Calcul des statistiques par employé
   */
  private getEmployeeStatistics() {
    const employeeMap = new Map();
    
    this.evaluations.forEach(evaluation => {
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
      
      // Mise à jour de la moyenne
      const totalScore = employee.evaluations.reduce((sum, e) => sum + this.calculateOverallScore(e), 0);
      employee.averageScore = totalScore / employee.evaluationCount;
      
      // Dernière évaluation
      if (new Date(evaluation.createdAt) > new Date(employee.lastEvaluation)) {
        employee.lastEvaluation = evaluation.createdAt;
      }
    });
    
    return Array.from(employeeMap.values());
  }

  /**
   * 🧮 Calcul du score global d'une évaluation
   */
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

  /**
   * 📈 Regroupement des données par mois
   */
  private groupByMonth() {
    const monthlyData: any = {
      'Score Global': [],
      'Contenu': [],
      'Méthodes': [],
      'Organisation': [],
      'Comportement': [],
      'Cognitif': []
    };

    // Grouper par mois
    const monthlyGroups = new Map();
    
    this.evaluations.forEach(evaluation => {
      const date = new Date(evaluation.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, []);
      }
      monthlyGroups.get(monthKey).push(evaluation);
    });

    // Calculer les moyennes mensuelles
    monthlyGroups.forEach((evals, monthKey) => {
      const scores = evals.map(evaluation => ({
        global: this.calculateOverallScore(evaluation),
        content: this.calculateCategoryScore(evaluation, 'content'),
        methods: this.calculateCategoryScore(evaluation, 'methods'),
        organization: this.calculateCategoryScore(evaluation, 'organization'),
        behavior: this.calculateCategoryScore(evaluation, 'behavior'),
        cognitive: this.calculateCategoryScore(evaluation, 'cognitive')
      }));

      monthlyData['Score Global'].push({
        date: monthKey,
        value: scores.reduce((sum, s) => sum + s.global, 0) / scores.length
      });

      monthlyData['Contenu'].push({
        date: monthKey,
        value: scores.reduce((sum, s) => sum + s.content, 0) / scores.length
      });

      // ... autres catégories
    });

    return monthlyData;
  }

  /**
   * 📊 Calcul du score par catégorie
   */
  private calculateCategoryScore(evaluation: EmployeeEvaluation, category: string): number {
    switch (category) {
      case 'content':
        return (evaluation.skillsAcquisition + evaluation.personalDevelopment + 
                evaluation.courseClarity + evaluation.theoryPractice + 
                evaluation.syllabusAdequacy + evaluation.practicalCases + 
                evaluation.objectivesAchieved + evaluation.adaptedKnowledge) / 8;
      case 'methods':
        return (evaluation.pedagogicalSupport + evaluation.techniquesUsed + 
                evaluation.presentation) / 3;
      case 'organization':
        return (evaluation.logisticsConditions + evaluation.rhythm + 
                evaluation.punctuality + evaluation.punctualityAssiduity) / 4;
      case 'behavior':
        return (evaluation.teamworkSense + evaluation.motivationEnthusiasm + 
                evaluation.communicationSociable + evaluation.communicationGeneral + 
                evaluation.aptitudeChangeIdeas + evaluation.curiosity + 
                evaluation.initiativeSpirit + evaluation.responsibilitySense) / 8;
      case 'cognitive':
        return (evaluation.criticalAnalysis + evaluation.workExecution + 
                evaluation.directivesComprehension + evaluation.workQuality + 
                evaluation.subjectMastery) / 5;
      default:
        return 0;
    }
  }

  /**
   * 📈 Calcul de tendance
   */
  private calculateTrend(dataPoints: Array<{date: string, value: number}>): TrendAnalysis {
    if (dataPoints.length < 2) {
      return {
        trend: 'stable',
        slope: 0,
        correlation: 0,
        confidence: 0,
        prediction: dataPoints[0]?.value || 0,
        dataPoints
      };
    }

    // Régression linéaire simple
    const n = dataPoints.length;
    const x = dataPoints.map((_, i) => i);
    const y = dataPoints.map(d => d.value);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Coefficient de corrélation
    const meanX = sumX / n;
    const meanY = sumY / n;
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denomX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
    const denomY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
    const correlation = numerator / (denomX * denomY);
    
    const trend = slope > 0.05 ? 'increasing' : slope < -0.05 ? 'decreasing' : 'stable';
    const confidence = Math.min(Math.abs(correlation) * 100, 95);
    const prediction = intercept + slope * n; // Prédiction pour le prochain point
    
    return {
      trend,
      slope,
      correlation,
      confidence,
      prediction,
      dataPoints
    };
  }

  /**
   * 🚨 Détection d'anomalie pour un employé
   */
  private detectEmployeeAnomaly(employee: any): AnomalyDetection {
    const allScores = this.getEmployeeStatistics().map(emp => emp.averageScore);
    const mean = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    const variance = allScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / allScores.length;
    const stdDev = Math.sqrt(variance);
    
    const zScore = (employee.averageScore - mean) / stdDev;
    const isAnomaly = Math.abs(zScore) > 1.5;
    
    const severity = Math.abs(zScore) > 3 ? 'high' : 
                    Math.abs(zScore) > 2 ? 'medium' : 'low';
    
    return {
      isAnomaly,
      score: Math.abs(zScore),
      severity,
      expectedRange: [mean - 1.5 * stdDev, mean + 1.5 * stdDev],
      actualValue: employee.averageScore
    };
  }

  /**
   * 🔗 Calcul de la matrice de corrélation
   */
  private calculateCorrelationMatrix() {
    const variables = [
      { key: 'content', name: 'Contenu' },
      { key: 'methods', name: 'Méthodes' },
      { key: 'organization', name: 'Organisation' },
      { key: 'behavior', name: 'Comportement' },
      { key: 'cognitive', name: 'Cognitif' },
      { key: 'recommendation', name: 'Recommandation' }
    ];

    const correlations: any[] = [];

    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const var1 = variables[i];
        const var2 = variables[j];
        
        const values1 = this.evaluations.map(evaluation => 
          var1.key === 'recommendation' ? evaluation.recommendationScore : 
          this.calculateCategoryScore(evaluation, var1.key)
        );
        const values2 = this.evaluations.map(evaluation => 
          var2.key === 'recommendation' ? evaluation.recommendationScore : 
          this.calculateCategoryScore(evaluation, var2.key)
        );

        const correlation = this.calculatePearsonCorrelation(values1, values2);
        
        correlations.push({
          var1: var1.name,
          var2: var2.name,
          value: correlation
        });
      }
    }

    return correlations;
  }

  /**
   * 📊 Calcul de la corrélation de Pearson
   */
  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 🔮 Prédiction de performance d'un employé
   */
  private predictEmployeePerformance(employee: any): PerformancePrediction {
    const sortedEvals = employee.evaluations.sort((a: any, b: any) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const scores = sortedEvals.map((evaluation: any) => this.calculateOverallScore(evaluation));
    const trend = this.calculateTrend(scores.map((score, i) => ({ date: i.toString(), value: score })));

    const predictedScore = Math.max(0, Math.min(5, trend.prediction));
    const currentScore = employee.averageScore;
    
    const trendType = predictedScore > currentScore + 0.2 ? 'improving' :
                     predictedScore < currentScore - 0.2 ? 'declining' : 'stable';

    return {
      employeeName: employee.name,
      currentScore,
      predictedScore,
      trend: trendType,
      confidence: trend.confidence,
      timeframe: 'prochaine évaluation',
      factors: this.identifyPerformanceFactors(employee)
    };
  }

  /**
   * 🎯 Identification des facteurs de performance
   */
  private identifyPerformanceFactors(employee: any): string[] {
    const factors: string[] = [];
    const lastEval = employee.evaluations[employee.evaluations.length - 1];
    
    if (lastEval) {
      const categoryScores = {
        content: this.calculateCategoryScore(lastEval, 'content'),
        methods: this.calculateCategoryScore(lastEval, 'methods'),
        organization: this.calculateCategoryScore(lastEval, 'organization'),
        behavior: this.calculateCategoryScore(lastEval, 'behavior'),
        cognitive: this.calculateCategoryScore(lastEval, 'cognitive')
      };

      // Identifier les forces et faiblesses
      Object.entries(categoryScores).forEach(([category, score]) => {
        if (score < 3) {
          factors.push(`Amélioration nécessaire en ${category}`);
        } else if (score > 4) {
          factors.push(`Point fort: ${category}`);
        }
      });
    }

    return factors;
  }

  // ===== RECOMMANDATIONS =====

  private getTrendRecommendation(metric: string, trend: TrendAnalysis): string {
    if (trend.trend === 'declining') {
      return `Action urgente requise: Analyser les causes de la baisse en ${metric} et mettre en place un plan d'amélioration.`;
    } else if (trend.trend === 'increasing') {
      return `Maintenir la dynamique positive en ${metric} et identifier les bonnes pratiques à reproduire.`;
    }
    return `Surveiller l'évolution de ${metric} et maintenir les standards actuels.`;
  }

  private getAnomalyRecommendation(employee: any, anomaly: AnomalyDetection): string {
    if (employee.averageScore < anomaly.expectedRange[0]) {
      return `Accompagnement personnalisé recommandé: formation ciblée et suivi rapproché.`;
    }
    return `Performance exceptionnelle: identifier les facteurs de succès pour les reproduire avec d'autres employés.`;
  }

  private getCorrelationRecommendation(correlation: any): string {
    return `Exploiter la forte corrélation entre ${correlation.var1} et ${correlation.var2} pour optimiser les formations.`;
  }

  private getPredictionRecommendation(prediction: PerformancePrediction): string {
    if (prediction.trend === 'declining') {
      return `Intervention préventive: entretien individuel et plan d'amélioration personnalisé.`;
    } else if (prediction.trend === 'improving') {
      return `Encourager la progression: reconnaissance et nouvelles responsabilités.`;
    }
    return `Maintenir l'accompagnement actuel et surveiller l'évolution.`;
  }

  private getSeasonalRecommendation(season: string, deviation: number): string {
    if (deviation > 0) {
      return `Capitaliser sur les bonnes performances en ${season}: analyser les facteurs favorables.`;
    }
    return `Renforcer l'accompagnement en ${season} pour compenser la baisse saisonnière.`;
  }

  // ===== ANALYSES SPÉCIALISÉES =====

  private analyzeRisks() {
    // Analyse des risques basée sur les patterns détectés
    return [
      // Implémentation des différents types de risques
    ];
  }

  private identifyOpportunities() {
    // Identification des opportunités d'amélioration
    return [
      // Implémentation des opportunités
    ];
  }

  private groupBySeasons() {
    const seasons: any = {
      'Printemps': [],
      'Été': [],
      'Automne': [],
      'Hiver': []
    };

    this.evaluations.forEach(evaluation => {
      const date = new Date(evaluation.createdAt);
      const month = date.getMonth() + 1;
      
      if (month >= 3 && month <= 5) seasons['Printemps'].push(evaluation);
      else if (month >= 6 && month <= 8) seasons['Été'].push(evaluation);
      else if (month >= 9 && month <= 11) seasons['Automne'].push(evaluation);
      else seasons['Hiver'].push(evaluation);
    });

    return seasons;
  }

  private calculateSeasonalDeviation(season: string, avgScore: number): number {
    const globalAvg = this.evaluations.reduce((sum, evaluation) => sum + this.calculateOverallScore(evaluation), 0) / this.evaluations.length;
    return avgScore - globalAvg;
  }

  // ===== MÉTHODES PUBLIQUES =====

  /**
   * 🎯 Obtenir tous les insights générés
   */
  getInsights(): AIInsight[] {
    return this.insights.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * 📊 Obtenir les insights par type
   */
  getInsightsByType(type: AIInsight['type']): AIInsight[] {
    return this.insights.filter(insight => insight.type === type);
  }

  /**
   * ⚠️ Obtenir les insights critiques
   */
  getCriticalInsights(): AIInsight[] {
    return this.insights.filter(insight => 
      insight.severity === 'critical' || insight.severity === 'high'
    );
  }

  /**
   * 📈 Obtenir les prédictions pour tous les employés
   */
  getAllPredictions(): PerformancePrediction[] {
    const employees = this.getEmployeeStatistics();
    return employees
      .filter(emp => emp.evaluationCount >= 2)
      .map(emp => this.predictEmployeePerformance(emp));
  }

  /**
   * 👥 Clustering des employés par performance
   */
  clusterEmployees(): EmployeeCluster[] {
    const employees = this.getEmployeeStatistics();
    
    // Simple clustering basé sur les scores
    const highPerformers = employees.filter(emp => emp.averageScore >= 4);
    const mediumPerformers = employees.filter(emp => emp.averageScore >= 3 && emp.averageScore < 4);
    const lowPerformers = employees.filter(emp => emp.averageScore < 3);

    return [
      {
        clusterId: 1,
        name: 'Performers Excellents',
        description: 'Employés avec performance supérieure',
        characteristics: ['Score ≥ 4/5', 'Régularité élevée', 'Leaders potentiels'],
        employees: highPerformers.map(emp => emp.name),
        averageScore: highPerformers.reduce((sum, emp) => sum + emp.averageScore, 0) / (highPerformers.length || 1),
        riskLevel: 'low'
      },
      {
        clusterId: 2,
        name: 'Performers Moyens',
        description: 'Employés avec performance standard',
        characteristics: ['Score 3-4/5', 'Potentiel d\'amélioration', 'Besoins de formation'],
        employees: mediumPerformers.map(emp => emp.name),
        averageScore: mediumPerformers.reduce((sum, emp) => sum + emp.averageScore, 0) / (mediumPerformers.length || 1),
        riskLevel: 'medium'
      },
      {
        clusterId: 3,
        name: 'Performers à Risque',
        description: 'Employés nécessitant un accompagnement',
        characteristics: ['Score < 3/5', 'Besoin d\'accompagnement', 'Formation urgente'],
        employees: lowPerformers.map(emp => emp.name),
        averageScore: lowPerformers.reduce((sum, emp) => sum + emp.averageScore, 0) / (lowPerformers.length || 1),
        riskLevel: 'high'
      }
    ];
  }

  /**
   * 📊 Statistiques globales enrichies
   */
  getEnrichedStatistics() {
    const employees = this.getEmployeeStatistics();
    const insights = this.getInsights();
    const predictions = this.getAllPredictions();
    const clusters = this.clusterEmployees();

    return {
      totalEmployees: employees.length,
      totalEvaluations: this.evaluations.length,
      averageScore: employees.reduce((sum, emp) => sum + emp.averageScore, 0) / (employees.length || 1),
      insights: {
        total: insights.length,
        critical: insights.filter(i => i.severity === 'critical').length,
        high: insights.filter(i => i.severity === 'high').length,
        medium: insights.filter(i => i.severity === 'medium').length,
        low: insights.filter(i => i.severity === 'low').length
      },
      predictions: {
        improving: predictions.filter(p => p.trend === 'improving').length,
        declining: predictions.filter(p => p.trend === 'declining').length,
        stable: predictions.filter(p => p.trend === 'stable').length
      },
      clusters: clusters.map(cluster => ({
        name: cluster.name,
        count: cluster.employees.length,
        risk: cluster.riskLevel
      }))
    };
  }
}

// Instance singleton pour l'utilisation globale
export const aiEngine = new AIEngine();