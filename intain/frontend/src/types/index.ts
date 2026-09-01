export interface PortfolioSummary {
  totalLoans: number;
  exposure: number;
  highRiskLoans: number;
  avgDefaultProb: number;
  avgDelinquencyProb: number;
  avgPrepaymentProb: number;
  dataQualityScore: number;
  activeExceptions: number;
  lastUpdated: string;
}

export interface RiskDistribution {
  category: "Low" | "Moderate" | "High" | "Critical";
  count: number;
  percentage: number;
  exposure: number;
  color: string;
}

export interface Loan {
  id: string;
  state: string;
  creditBand: string;
  ltvBand: string;
  vintage: string;
  currentBalance: number;
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  defaultProb: number;
  delinquencyProb: number;
  prepaymentProb: number;
  anomalyScore: number;
  dataQualityScore: number;
  lastUpdated: string;
}

export interface Anomaly {
  id: string;
  loanId: string;
  score: number;
  severity: "Critical" | "High" | "Medium" | "Low";
  exceptionType: string;
  ruleViolations: string[];
  mlSignal: string;
  recommendedAction: string;
  status: "Open" | "Reviewing" | "Resolved";
  dateDetected: string;
}

export interface ModelMetrics {
  id: string;
  name: string;
  version: string;
  target: string;
  rocAuc: number;
  prAuc: number;
  f1: number;
  recall: number;
  brierScore: number;
  status: "Active" | "Deprecated" | "Training";
  lastTrained: string;
}

export interface Scenario {
  name: string;
  description: string;
  assumptions: string[];
  projectedDefault: number;
  projectedDelinquency: number;
  projectedPrepayment: number;
}

export interface DataQualitySummary {
  score: number;
  recordsAnalyzed: number;
  missingFields: number;
  validationViolations: number;
  staleRecords: number;
  sourceConflicts: number;
  driftDetected: boolean;
}

export interface DataQualityIssue {
  loanId: string;
  issue: string;
  severity: "Critical" | "Warning" | "Info";
  source: string;
  recommendedAction: string;
}

export interface AIReview {
  loanId: string;
  status: "Review Required" | "Approved" | "Rejected";
  riskSummary: string;
  keyDrivers: string[];
  dataQualityConcerns: string[];
  scenarioSensitivity: string;
  recommendedAction: string;
  limitations: string;
  generatedAt: string;
}

export interface DevelopmentLogEntry {
  id: string;
  timestamp: string;
  aiTool: string;
  task: string;
  prompt: string;
  output: string;
  humanReview: string;
  decision: "ACCEPTED" | "CORRECTED" | "REJECTED";
}
