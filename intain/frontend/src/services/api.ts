
import { 
  mockPortfolioSummary, 
  mockRiskDistribution, 
  mockLoans, 
  mockAnomalies, 
  mockModelMetrics, 
  mockScenarios, 
  mockDataQualitySummary, 
  mockDevLog 
} from "@/data/mockData";


// In a real application, these would try the axios call first, 
// and catch/fallback to mock data if the server is unreachable.
// For this frontend implementation, we will simulate latency and return the mock data directly.

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const portfolioApi = {
  getSummary: async () => {
    await delay(600);
    return mockPortfolioSummary;
  },
  getRiskDistribution: async () => {
    await delay(400);
    return mockRiskDistribution;
  }
};

export const loansApi = {
  getLoans: async () => {
    await delay(800);
    return mockLoans;
  },
  getLoanById: async (id: string) => {
    await delay(500);
    return mockLoans.find(l => l.id === id) || mockLoans[0];
  }
};

export const modelsApi = {
  getMetrics: async () => {
    await delay(500);
    return mockModelMetrics;
  }
};

export const anomalyApi = {
  getAnomalies: async () => {
    await delay(700);
    return mockAnomalies;
  }
};

export const scenarioApi = {
  getScenarios: async () => {
    await delay(900);
    return mockScenarios;
  }
};

export const dataQualityApi = {
  getSummary: async () => {
    await delay(400);
    return mockDataQualitySummary;
  }
};

export const devLogApi = {
  getLogs: async () => {
    await delay(300);
    return mockDevLog;
  }
};
