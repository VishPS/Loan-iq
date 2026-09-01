import { PortfolioSummary, RiskDistribution, Loan, Anomaly, ModelMetrics, Scenario, DataQualitySummary, DevelopmentLogEntry } from "@/types";

export const mockPortfolioSummary: PortfolioSummary = {
  totalLoans: 12450,
  exposure: 3450200000,
  highRiskLoans: 842,
  avgDefaultProb: 0.042,
  avgDelinquencyProb: 0.075,
  avgPrepaymentProb: 0.12,
  dataQualityScore: 94.2,
  activeExceptions: 128,
  lastUpdated: new Date().toISOString(),
};

export const mockRiskDistribution: RiskDistribution[] = [
  { category: "Low", count: 8500, percentage: 68.3, exposure: 2100000000, color: "hsl(var(--risk-low))" },
  { category: "Moderate", count: 2800, percentage: 22.5, exposure: 850000000, color: "hsl(var(--risk-moderate))" },
  { category: "High", count: 950, percentage: 7.6, exposure: 400000000, color: "hsl(var(--risk-high))" },
  { category: "Critical", count: 200, percentage: 1.6, exposure: 100200000, color: "hsl(var(--risk-critical))" },
];

export const mockLoans: Loan[] = [
  { id: "LN-100293", state: "CA", creditBand: "700-750", ltvBand: "75-80", vintage: "2022", currentBalance: 345000, riskLevel: "Critical", defaultProb: 0.82, delinquencyProb: 0.91, prepaymentProb: 0.02, anomalyScore: 0.88, dataQualityScore: 72, lastUpdated: new Date().toISOString() },
  { id: "LN-100442", state: "TX", creditBand: "650-700", ltvBand: "85-90", vintage: "2023", currentBalance: 420000, riskLevel: "High", defaultProb: 0.45, delinquencyProb: 0.65, prepaymentProb: 0.05, anomalyScore: 0.42, dataQualityScore: 98, lastUpdated: new Date().toISOString() },
  { id: "LN-100511", state: "NY", creditBand: "750-800", ltvBand: "60-70", vintage: "2021", currentBalance: 210000, riskLevel: "Low", defaultProb: 0.01, delinquencyProb: 0.03, prepaymentProb: 0.25, anomalyScore: 0.12, dataQualityScore: 100, lastUpdated: new Date().toISOString() },
  { id: "LN-100688", state: "FL", creditBand: "600-650", ltvBand: "90-95", vintage: "2023", currentBalance: 515000, riskLevel: "Critical", defaultProb: 0.91, delinquencyProb: 0.95, prepaymentProb: 0.01, anomalyScore: 0.95, dataQualityScore: 55, lastUpdated: new Date().toISOString() },
  { id: "LN-100802", state: "WA", creditBand: "700-750", ltvBand: "80-85", vintage: "2022", currentBalance: 385000, riskLevel: "Moderate", defaultProb: 0.12, delinquencyProb: 0.22, prepaymentProb: 0.08, anomalyScore: 0.25, dataQualityScore: 95, lastUpdated: new Date().toISOString() },
];

export const mockAnomalies: Anomaly[] = [
  { id: "AN-8001", loanId: "LN-100293", score: 0.88, severity: "Critical", exceptionType: "Data Conflict", ruleViolations: ["current_balance > original_balance", "dpd > 0 but status is Current"], mlSignal: "Isolation Forest density -4.2", recommendedAction: "Manual Review Required", status: "Open", dateDetected: new Date().toISOString() },
  { id: "AN-8002", loanId: "LN-100688", score: 0.95, severity: "Critical", exceptionType: "Stale Record", ruleViolations: ["last_payment_date > 90 days ago but status Current"], mlSignal: "Isolation Forest density -5.1", recommendedAction: "Verify servicer reporting", status: "Reviewing", dateDetected: new Date().toISOString() },
  { id: "AN-8003", loanId: "LN-100994", score: 0.72, severity: "High", exceptionType: "Outlier", ruleViolations: [], mlSignal: "DTI > 65% unusual for credit band", recommendedAction: "Verify income docs", status: "Open", dateDetected: new Date().toISOString() },
];

export const mockModelMetrics: ModelMetrics[] = [
  { id: "MOD-1", name: "Default_XGB_v1.4", version: "1.4.2", target: "next_12m_default", rocAuc: 0.892, prAuc: 0.654, f1: 0.612, recall: 0.725, brierScore: 0.042, status: "Active", lastTrained: new Date().toISOString() },
  { id: "MOD-2", name: "Delinquency_XGB_v1.2", version: "1.2.0", target: "next_3m_delinquency", rocAuc: 0.845, prAuc: 0.588, f1: 0.551, recall: 0.680, brierScore: 0.081, status: "Active", lastTrained: new Date().toISOString() },
  { id: "MOD-3", name: "Prepayment_XGB_v1.1", version: "1.1.5", target: "next_12m_prepayment", rocAuc: 0.785, prAuc: 0.412, f1: 0.405, recall: 0.550, brierScore: 0.112, status: "Active", lastTrained: new Date().toISOString() },
];

export const mockScenarios: Scenario[] = [
  { name: "BASE", description: "Current macroeconomic baseline forecast", assumptions: ["Unemployment 4.2%", "HPA 2.1%", "Rates Stable"], projectedDefault: 0.042, projectedDelinquency: 0.075, projectedPrepayment: 0.12 },
  { name: "ADVERSE CREDIT", description: "Severe recession with rising unemployment and falling home prices", assumptions: ["Unemployment 8.5%", "HPA -15%", "Rates -150bps"], projectedDefault: 0.125, projectedDelinquency: 0.185, projectedPrepayment: 0.05 },
  { name: "HIGH PREPAYMENT", description: "Aggressive rate cuts driving refinance wave", assumptions: ["Unemployment 4.5%", "HPA 5%", "Rates -300bps"], projectedDefault: 0.038, projectedDelinquency: 0.065, projectedPrepayment: 0.35 },
];

export const mockDataQualitySummary: DataQualitySummary = {
  score: 94.2, recordsAnalyzed: 12450, missingFields: 842, validationViolations: 128, staleRecords: 45, sourceConflicts: 12, driftDetected: true
};

export const mockDevLog: DevelopmentLogEntry[] = [
  { id: "LOG-1", timestamp: "2026-09-01T10:00:00Z", aiTool: "Antigravity", task: "Train-test splitting strategy", prompt: "Create a train/test split for the loan data.", output: "Implemented standard 80/20 random split using train_test_split.", humanReview: "Random splitting violates temporal validity in panel data (lookahead bias).", decision: "REJECTED" },
  { id: "LOG-2", timestamp: "2026-09-01T10:15:00Z", aiTool: "Antigravity", task: "Train-test splitting strategy", prompt: "Fix the split. Use an Out-Of-Time (OOT) chronological split where train is before 2024 and test is 2024.", output: "Implemented chronological split based on reporting_month.", humanReview: "Valid split logic. Prevents leakage.", decision: "ACCEPTED" },
  { id: "LOG-3", timestamp: "2026-09-01T11:30:00Z", aiTool: "Antigravity", task: "SHAP Explainability", prompt: "Generate SHAP values for the calibrated classifier.", output: "Called TreeExplainer directly on CalibratedClassifierCV.", humanReview: "TreeExplainer fails on CalibratedClassifierCV. Extracted the internal estimator first.", decision: "CORRECTED" },
];
