import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import RiskBadge from "@/components/RiskBadge";
import { loansApi } from "@/services/api";
import { Loan } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Cpu, AlertTriangle, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function LoanDetail() {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<Loan | null>(null);

  useEffect(() => {
    if (loanId) {
      loansApi.getLoanById(loanId).then(setLoan);
    }
  }, [loanId]);

  const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const shapData = [
    { feature: "Days Past Due", impact: 0.12, color: "hsl(var(--risk-high))" },
    { feature: "Loan-to-Value", impact: 0.08, color: "hsl(var(--risk-high))" },
    { feature: "DTI Ratio", impact: 0.05, color: "hsl(var(--risk-high))" },
    { feature: "Credit Score", impact: -0.07, color: "hsl(var(--risk-low))" },
    { feature: "Interest Rate", impact: -0.02, color: "hsl(var(--risk-low))" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground hover:text-primary" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Loans
      </Button>

      {loan ? (
        <>
          <PageHeader 
            title={loan.id}
            description={`${loan.state} | ${loan.vintage} Vintage | ${loan.creditBand} Credit Score`}
          >
            <RiskBadge level={loan.riskLevel} className="text-lg px-3 py-1" />
            <Button className="ml-4 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/ai-reviewer")}>
              <Cpu className="mr-2 h-4 w-4" /> AI Reviewer
            </Button>
          </PageHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase">Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(loan.currentBalance)}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase">Default Probability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {formatPct(loan.defaultProb)}
                  {loan.defaultProb > 0.1 && <AlertTriangle className="h-4 w-4 text-risk-high" />}
                </div>
                <Progress value={loan.defaultProb * 100} className="h-1 mt-3" />
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase">Data Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {loan.dataQualityScore} / 100
                  {loan.dataQualityScore > 90 ? <ShieldCheck className="h-4 w-4 text-risk-low" /> : <AlertTriangle className="h-4 w-4 text-risk-high" />}
                </div>
                <Progress value={loan.dataQualityScore} className="h-1 mt-3" />
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase">Anomaly Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {loan.anomalyScore.toFixed(2)}
                  {loan.anomalyScore > 0.5 && <AlertTriangle className="h-4 w-4 text-risk-high" />}
                </div>
                <Progress value={loan.anomalyScore * 100} className="h-1 mt-3" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle>Why is this loan risky?</CardTitle>
                <CardDescription>Local SHAP explanation for the Default Model</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                    <Tooltip 
                      cursor={{fill: '#1e293b'}} 
                      contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}}
                      formatter={(val: any) => val > 0 ? `+${val}` : val}
                    />
                    <Bar dataKey="impact" radius={4}>
                      {shapData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-800 flex flex-col">
              <CardHeader>
                <CardTitle>Data Quality & Anomalies</CardTitle>
                <CardDescription>Issues affecting model confidence</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center gap-4">
                {loan.anomalyScore > 0.5 ? (
                  <div className="p-4 border border-risk-high/30 bg-risk-high/10 rounded-lg flex gap-4">
                    <AlertTriangle className="h-6 w-6 text-risk-high shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-200">High Anomaly Score Detected</h4>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        The ML Isolation Forest model flagged this record as highly unusual compared to the training distribution.
                      </p>
                      <Button variant="outline" size="sm" className="border-risk-high/50 text-risk-high hover:bg-risk-high/20" onClick={() => navigate("/anomalies")}>
                        Investigate Anomaly
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-risk-low/30 bg-risk-low/10 rounded-lg flex gap-4">
                    <ShieldCheck className="h-6 w-6 text-risk-low shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-200">Data Integrity Verified</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        No significant anomalies or data quality issues detected for this loan.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <Skeleton className="h-12 w-64 bg-slate-800/50" />
          <div className="grid grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 bg-slate-800/50" />)}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-[400px] bg-slate-800/50" />
            <Skeleton className="h-[400px] bg-slate-800/50" />
          </div>
        </div>
      )}
    </div>
  );
}
