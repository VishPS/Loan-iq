import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import { dataQualityApi } from "@/services/api";
import { DataQualitySummary } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, Database, FileWarning, ShieldAlert } from "lucide-react";

export default function DataIntelligence() {
  const [summary, setSummary] = useState<DataQualitySummary | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const sum = await dataQualityApi.getSummary();
      setSummary(sum);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="DATA INTELLIGENCE" 
        description="Pre-prediction data quality assessment and validation"
      >
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-md border border-slate-800">
          <Database className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Data Verified Before Inference</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary ? (
          <>
            <MetricCard 
              title="Data Quality Score" 
              value={summary.score.toFixed(1)} 
              icon={<BrainCircuit />}
              className="border-primary/20 bg-primary/5"
            />
            <MetricCard title="Missing Fields" value={summary.missingFields} icon={<FileWarning />} />
            <MetricCard title="Validation Violations" value={summary.validationViolations} icon={<ShieldAlert />} />
            <MetricCard title="Source Conflicts" value={summary.sourceConflicts} icon={<Database />} />
          </>
        ) : (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl bg-slate-900/50" />)
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>Validation Violations</CardTitle>
            <CardDescription>Deterministic checks that failed on the portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-200">Invalid Dates</span>
                  <span className="text-xs text-muted-foreground">origination_date &gt; reporting_date</span>
                </div>
                <Badge variant="outline" className="text-risk-high border-risk-high/50 bg-risk-high/10">32 records</Badge>
              </div>
              <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-200">Balance Inconsistencies</span>
                  <span className="text-xs text-muted-foreground">current_balance &gt; original_balance</span>
                </div>
                <Badge variant="outline" className="text-risk-high border-risk-high/50 bg-risk-high/10">45 records</Badge>
              </div>
              <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-200">Status Conflicts</span>
                  <span className="text-xs text-muted-foreground">current_status is Default but DPD = 0</span>
                </div>
                <Badge variant="outline" className="text-risk-moderate border-risk-moderate/50 bg-risk-moderate/10">51 records</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>Train vs Test Drift</CardTitle>
            <CardDescription>Feature distributions compared to training baseline</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-slate-900">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead>Feature</TableHead>
                  <TableHead>Jensen-Shannon</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium">interest_rate</TableCell>
                  <TableCell>0.12</TableCell>
                  <TableCell><Badge variant="outline" className="text-risk-moderate border-risk-moderate/50">Watch</Badge></TableCell>
                </TableRow>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium">credit_score</TableCell>
                  <TableCell>0.02</TableCell>
                  <TableCell><Badge variant="outline" className="text-risk-low border-risk-low/50">Stable</Badge></TableCell>
                </TableRow>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium">dti_ratio</TableCell>
                  <TableCell>0.04</TableCell>
                  <TableCell><Badge variant="outline" className="text-risk-low border-risk-low/50">Stable</Badge></TableCell>
                </TableRow>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium">current_balance</TableCell>
                  <TableCell>0.18</TableCell>
                  <TableCell><Badge variant="outline" className="text-risk-high border-risk-high/50">Drift Detected</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
