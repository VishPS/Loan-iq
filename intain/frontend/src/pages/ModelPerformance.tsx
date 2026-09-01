import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { modelsApi } from "@/services/api";
import { ModelMetrics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState<ModelMetrics[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await modelsApi.getMetrics();
      setMetrics(data);
    };
    fetchData();
  }, []);

  const calibrationData = [
    { predictedBin: "0.0-0.1", trueFraction: 0.04, perfectlyCalibrated: 0.05 },
    { predictedBin: "0.1-0.2", trueFraction: 0.16, perfectlyCalibrated: 0.15 },
    { predictedBin: "0.2-0.3", trueFraction: 0.28, perfectlyCalibrated: 0.25 },
    { predictedBin: "0.3-0.4", trueFraction: 0.32, perfectlyCalibrated: 0.35 },
    { predictedBin: "0.4-0.5", trueFraction: 0.44, perfectlyCalibrated: 0.45 },
    { predictedBin: "0.5-0.6", trueFraction: 0.53, perfectlyCalibrated: 0.55 },
    { predictedBin: "0.6-0.7", trueFraction: 0.64, perfectlyCalibrated: 0.65 },
    { predictedBin: "0.7-0.8", trueFraction: 0.77, perfectlyCalibrated: 0.75 },
    { predictedBin: "0.8-0.9", trueFraction: 0.81, perfectlyCalibrated: 0.85 },
    { predictedBin: "0.9-1.0", trueFraction: 0.96, perfectlyCalibrated: 0.95 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <PageHeader 
        title="MODEL PERFORMANCE" 
        description="Evaluation metrics and calibration diagnostics for the ML ensemble."
      >
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-md border border-slate-800">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Out-Of-Time Validation</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>Model Registry</CardTitle>
            <CardDescription>Currently active production models</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <Table>
                <TableHeader className="bg-slate-900">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead>Model</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((m) => (
                    <TableRow key={m.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-200">{m.name}</TableCell>
                      <TableCell className="text-xs font-mono">{m.target}</TableCell>
                      <TableCell>{m.version}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-risk-low/10 text-risk-low border-risk-low/30">{m.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <Skeleton className="h-48 w-full bg-slate-800/50" />}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>Calibration Curve (Reliability Diagram)</CardTitle>
            <CardDescription>Default Model v1.4.2 (Isotonic Calibration)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calibrationData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="predictedBin" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  cursor={{stroke: '#334155'}} 
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}}
                />
                <Legend />
                <Line type="monotone" dataKey="perfectlyCalibrated" name="Perfectly Calibrated" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="trueFraction" name="Actual Fraction of Positives" stroke="hsl(var(--risk-high))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
          <CardDescription>Baseline vs Improved XGBoost Ensemble (Out-Of-Time Test Set)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead>Target</TableHead>
                  <TableHead>Model Type</TableHead>
                  <TableHead className="text-right">ROC-AUC</TableHead>
                  <TableHead className="text-right">PR-AUC</TableHead>
                  <TableHead className="text-right">F1 Score</TableHead>
                  <TableHead className="text-right">Recall</TableHead>
                  <TableHead className="text-right">Brier Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Default Group */}
                <TableRow className="border-slate-800 hover:bg-slate-800/50 opacity-60">
                  <TableCell rowSpan={2} className="font-medium align-top border-b border-slate-800 pt-4">next_12m_default</TableCell>
                  <TableCell>Baseline (Logistic)</TableCell>
                  <TableCell className="text-right">0.680</TableCell>
                  <TableCell className="text-right">0.245</TableCell>
                  <TableCell className="text-right">0.291</TableCell>
                  <TableCell className="text-right">0.401</TableCell>
                  <TableCell className="text-right">0.088</TableCell>
                </TableRow>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-semibold text-slate-200">XGBoost Optimized</TableCell>
                  <TableCell className="text-right font-semibold text-risk-low">0.892</TableCell>
                  <TableCell className="text-right font-semibold text-risk-low">0.654</TableCell>
                  <TableCell className="text-right font-semibold text-risk-low">0.612</TableCell>
                  <TableCell className="text-right font-semibold text-risk-low">0.725</TableCell>
                  <TableCell className="text-right font-semibold text-risk-low">0.042</TableCell>
                </TableRow>

                {/* Delinquency Group */}
                <TableRow className="border-slate-800 hover:bg-slate-800/50 opacity-60">
                  <TableCell rowSpan={2} className="font-medium align-top border-b border-slate-800 pt-4">next_3m_delinquency</TableCell>
                  <TableCell>Baseline (Logistic)</TableCell>
                  <TableCell className="text-right">0.620</TableCell>
                  <TableCell className="text-right">0.180</TableCell>
                  <TableCell className="text-right">0.210</TableCell>
                  <TableCell className="text-right">0.315</TableCell>
                  <TableCell className="text-right">0.125</TableCell>
                </TableRow>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-semibold text-slate-200">XGBoost Optimized</TableCell>
                  <TableCell className="text-right font-semibold text-risk-low">0.845</TableCell>
                  <TableCell className="text-right font-semibold text-risk-low">0.588</TableCell>
                  <TableCell className="text-right font-semibold text-risk-low">0.551</TableCell>
                  <TableCell className="text-right font-semibold text-risk-low">0.680</TableCell>
                  <TableCell className="text-right font-semibold text-risk-low">0.081</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
