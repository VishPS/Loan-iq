import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import RiskBadge from "@/components/RiskBadge";
import { portfolioApi, loansApi } from "@/services/api";
import { PortfolioSummary, RiskDistribution, Loan } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowRight, BrainCircuit, Activity, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [riskDist, setRiskDist] = useState<RiskDistribution[] | null>(null);
  const [exceptions, setExceptions] = useState<Loan[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const sum = await portfolioApi.getSummary();
      const dist = await portfolioApi.getRiskDistribution();
      const allLoans = await loansApi.getLoans();
      
      setSummary(sum);
      setRiskDist(dist);
      setExceptions(allLoans.filter(l => l.riskLevel === "Critical" || l.riskLevel === "High").slice(0, 5));
    };
    fetchData();
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact" }).format(val);
  const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="COMMAND CENTER" 
        description="Portfolio Intelligence & Risk Analytics"
      >
        <div className="text-right flex flex-col items-end">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Model Version</span>
          <span className="font-mono text-sm text-slate-300">XGB_v1.4.2</span>
        </div>
        <Button variant="outline" size="sm" className="ml-4 border-slate-700 bg-slate-900/50 hover:bg-slate-800">
          Refresh Data
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summary ? (
          <>
            <MetricCard title="Portfolio Exposure" value={formatCurrency(summary.exposure)} description="Total balance at risk" />
            <MetricCard title="Loans Monitored" value={summary.totalLoans.toLocaleString()} />
            <MetricCard title="High Risk Loans" value={summary.highRiskLoans.toLocaleString()} trend={{ value: "12%", isPositive: false }} />
            <MetricCard title="Avg Default Prob" value={formatPct(summary.avgDefaultProb)} trend={{ value: "0.2%", isPositive: true }} />
            <MetricCard title="Portfolio Data Quality" value={summary.dataQualityScore.toFixed(1)} trend={{ value: "1.4", isPositive: true }} />
            <MetricCard title="Active Exceptions" value={summary.activeExceptions} />
          </>
        ) : (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl bg-slate-900/50" />)
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>Portfolio Risk Distribution</CardTitle>
            <CardDescription>Segmented exposure by ML predicted risk level</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {riskDist ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDist} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val/1000000}M`} />
                  <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    cursor={{fill: '#1e293b'}} 
                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}}
                    formatter={(val: any) => formatCurrency(val)}
                  />
                  <Bar dataKey="exposure" radius={[0, 4, 4, 0]}>
                    {riskDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <Skeleton className="w-full h-full bg-slate-800/50" />}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 flex flex-col">
          <CardHeader>
            <CardTitle>Intelligence Activity</CardTitle>
            <CardDescription>Recent pipeline executions</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-6">
            <div className="flex gap-4 items-start">
              <div className="mt-0.5 bg-risk-low/20 p-2 rounded-full text-risk-low"><BrainCircuit className="h-4 w-4" /></div>
              <div>
                <p className="text-sm font-medium text-slate-200">Model Refresh Completed</p>
                <p className="text-xs text-muted-foreground">XGBoost v1.4.2 deployed. Calibration metrics verified.</p>
                <p className="text-[10px] text-slate-500 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-0.5 bg-risk-critical/20 p-2 rounded-full text-risk-critical"><AlertTriangle className="h-4 w-4" /></div>
              <div>
                <p className="text-sm font-medium text-slate-200">Anomalies Detected</p>
                <p className="text-xs text-muted-foreground">12 new high-severity data conflicts flagged.</p>
                <p className="text-[10px] text-slate-500 mt-1">3 hours ago</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-0.5 bg-blue-500/20 p-2 rounded-full text-blue-500"><Activity className="h-4 w-4" /></div>
              <div>
                <p className="text-sm font-medium text-slate-200">Scenario Execution</p>
                <p className="text-xs text-muted-foreground">Adverse Credit stress test completed.</p>
                <p className="text-[10px] text-slate-500 mt-1">5 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Priority Exceptions</CardTitle>
            <CardDescription>Highest risk loans requiring human review</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/loans")} className="border-slate-700 hover:bg-slate-800">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {exceptions ? (
            <div className="rounded-md border border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-900">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Default Prob</TableHead>
                    <TableHead>Anomaly Score</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exceptions.map((loan) => (
                    <TableRow key={loan.id} className="border-slate-800 hover:bg-slate-800/50 cursor-pointer" onClick={() => navigate(`/loans/${loan.id}`)}>
                      <TableCell className="font-medium text-slate-200">{loan.id}</TableCell>
                      <TableCell><RiskBadge level={loan.riskLevel} /></TableCell>
                      <TableCell>{formatPct(loan.defaultProb)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={loan.anomalyScore > 0.8 ? "text-risk-critical border-risk-critical/50" : "text-muted-foreground"}>
                          {loan.anomalyScore.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-950">Review</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full bg-slate-800/50" />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
