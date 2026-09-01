import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { scenarioApi } from "@/services/api";
import { Scenario } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GitMerge } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Scenarios() {
  const [scenarios, setScenarios] = useState<Scenario[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await scenarioApi.getScenarios();
      setScenarios(data);
    };
    fetchData();
  }, []);

  const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;

  const chartData = scenarios?.map(s => ({
    name: s.name,
    Default: s.projectedDefault * 100,
    Delinquency: s.projectedDelinquency * 100,
    Prepayment: s.projectedPrepayment * 100
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="PORTFOLIO STRESS LAB" 
        description="Understand how portfolio risk responds to controlled future macroeconomic scenarios."
      >
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-md border border-slate-800">
          <GitMerge className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Scenario Simulation Engine</span>
        </div>
      </PageHeader>

      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg text-sm text-slate-300 mb-6">
        <span className="font-semibold text-amber-500">Notice:</span> Scenario outputs are controlled stress simulations and probability adjustments, not guaranteed real-world forecasts.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios ? scenarios.map((scenario) => (
          <Card key={scenario.name} className="bg-slate-900/50 border-slate-800 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{scenario.name}</CardTitle>
              <CardDescription className="h-10">{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assumptions</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  {scenario.assumptions.map(a => <li key={a}>• {a}</li>)}
                </ul>
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Projected Default</span>
                  <span className="font-semibold text-risk-high">{formatPct(scenario.projectedDefault)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Projected Delinquency</span>
                  <span className="font-semibold text-risk-moderate">{formatPct(scenario.projectedDelinquency)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Projected Prepayment</span>
                  <span className="font-semibold text-blue-400">{formatPct(scenario.projectedPrepayment)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-80 bg-slate-800/50" />)
        )}
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle>Portfolio Risk Projection Comparison</CardTitle>
          <CardDescription>12-month expected rates across simulated environments</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {scenarios ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  cursor={{fill: '#1e293b'}} 
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}}
                  formatter={(val: any) => `${val.toFixed(1)}%`}
                />
                <Legend />
                <Bar dataKey="Default" fill="hsl(var(--risk-high))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Delinquency" fill="hsl(var(--risk-moderate))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Prepayment" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Skeleton className="w-full h-full bg-slate-800/50" />}
        </CardContent>
      </Card>
    </div>
  );
}
