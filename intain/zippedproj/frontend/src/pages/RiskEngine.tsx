import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { modelsApi } from "@/services/api";
import { ModelMetrics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, Network } from "lucide-react";

export default function RiskEngine() {
  const [metrics, setMetrics] = useState<ModelMetrics[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await modelsApi.getMetrics();
      setMetrics(data);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="RISK ENGINE" 
        description="Core Machine Learning Predictive Models"
      >
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-md border border-slate-800">
          <Network className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">XGBoost Ensemble Active</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between items-center">
              DEFAULT MODEL
              <Badge variant="outline" className="bg-risk-high/10 text-risk-high border-risk-high/30">Active</Badge>
            </CardTitle>
            <CardDescription>next_12m_default</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-4 mt-2">
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-muted-foreground">ROC-AUC</span>
                  <span className="font-semibold text-slate-200">{metrics[0].rocAuc.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-muted-foreground">PR-AUC</span>
                  <span className="font-semibold text-slate-200">{metrics[0].prAuc.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-muted-foreground">F1 Score</span>
                  <span className="font-semibold text-slate-200">{metrics[0].f1.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Brier Score</span>
                  <span className="font-semibold text-slate-200">{metrics[0].brierScore.toFixed(3)}</span>
                </div>
              </div>
            ) : <Skeleton className="w-full h-32 bg-slate-800/50" />}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between items-center">
              DELINQUENCY MODEL
              <Badge variant="outline" className="bg-risk-moderate/10 text-risk-moderate border-risk-moderate/30">Active</Badge>
            </CardTitle>
            <CardDescription>next_3m_delinquency</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-4 mt-2">
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-muted-foreground">ROC-AUC</span>
                  <span className="font-semibold text-slate-200">{metrics[1].rocAuc.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-muted-foreground">PR-AUC</span>
                  <span className="font-semibold text-slate-200">{metrics[1].prAuc.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-muted-foreground">F1 Score</span>
                  <span className="font-semibold text-slate-200">{metrics[1].f1.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Brier Score</span>
                  <span className="font-semibold text-slate-200">{metrics[1].brierScore.toFixed(3)}</span>
                </div>
              </div>
            ) : <Skeleton className="w-full h-32 bg-slate-800/50" />}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between items-center">
              PREPAYMENT MODEL
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Active</Badge>
            </CardTitle>
            <CardDescription>next_12m_prepayment</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-4 mt-2">
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-muted-foreground">ROC-AUC</span>
                  <span className="font-semibold text-slate-200">{metrics[2].rocAuc.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-muted-foreground">PR-AUC</span>
                  <span className="font-semibold text-slate-200">{metrics[2].prAuc.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-muted-foreground">F1 Score</span>
                  <span className="font-semibold text-slate-200">{metrics[2].f1.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Brier Score</span>
                  <span className="font-semibold text-slate-200">{metrics[2].brierScore.toFixed(3)}</span>
                </div>
              </div>
            ) : <Skeleton className="w-full h-32 bg-slate-800/50" />}
          </CardContent>
        </Card>
      </div>

      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg flex items-start gap-4">
        <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Model Governance Notice</h4>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Predictions are generated deterministically by the machine-learning models (XGBoost Classifier ensemble). 
            Generative AI is <strong>not</strong> the predictive model. All probabilities shown are calibrated using Isotonic Regression. 
            Validation was performed using strict chronological out-of-time (OOT) splitting to prevent temporal leakage.
          </p>
        </div>
      </div>
    </div>
  );
}
