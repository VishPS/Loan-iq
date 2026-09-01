import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import Dashboard from './pages/Dashboard';
import DataIntelligence from './pages/DataIntelligence';
import RiskEngine from './pages/RiskEngine';
import LoanExplorer from './pages/LoanExplorer';
import LoanDetail from './pages/LoanDetail';
import Anomalies from './pages/Anomalies';
import Scenarios from './pages/Scenarios';
import TransitionModel from './pages/TransitionModel';
import Explainability from './pages/Explainability';
import AIReviewer from './pages/AIReviewer';
import ModelPerformance from './pages/ModelPerformance';
import DevelopmentLog from './pages/DevelopmentLog';
import ModelCard from './pages/ModelCard';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="data-intelligence" element={<DataIntelligence />} />
        <Route path="risk-engine" element={<RiskEngine />} />
        <Route path="loans" element={<LoanExplorer />} />
        <Route path="loans/:loanId" element={<LoanDetail />} />
        <Route path="anomalies" element={<Anomalies />} />
        <Route path="scenarios" element={<Scenarios />} />
        <Route path="transition-model" element={<TransitionModel />} />
        <Route path="explainability" element={<Explainability />} />
        <Route path="ai-reviewer" element={<AIReviewer />} />
        <Route path="model-performance" element={<ModelPerformance />} />
        <Route path="development-log" element={<DevelopmentLog />} />
        <Route path="model-card" element={<ModelCard />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
