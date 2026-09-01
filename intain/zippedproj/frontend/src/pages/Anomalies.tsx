import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { anomalyApi } from "@/services/api";
import { Anomaly } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity, ShieldAlert, FileWarning, Search } from "lucide-react";

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState<Anomaly[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await anomalyApi.getAnomalies();
      setAnomalies(data);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="ANOMALY INTELLIGENCE" 
        description="Operational exception center combining deterministic rules and ML outlier detection"
      >
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-md border border-slate-800">
          <Activity className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">ML Isolation Forest + Rules</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-risk-critical/20 text-risk-critical rounded-full"><ShieldAlert /></div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground uppercase">Critical</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-risk-high/20 text-risk-high rounded-full"><ShieldAlert /></div>
            <div>
              <p className="text-2xl font-bold">45</p>
              <p className="text-sm text-muted-foreground uppercase">High Severity</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 text-amber-500 rounded-full"><FileWarning /></div>
            <div>
              <p className="text-2xl font-bold">84</p>
              <p className="text-sm text-muted-foreground uppercase">Source Conflicts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 text-blue-500 rounded-full"><Search /></div>
            <div>
              <p className="text-2xl font-bold">142</p>
              <p className="text-sm text-muted-foreground uppercase">Total Open</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          {anomalies ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-900">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead>Anomaly ID</TableHead>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Exception Type</TableHead>
                    <TableHead>ML Signal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anomalies.map((anomaly) => (
                    <TableRow key={anomaly.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-slate-200">{anomaly.id}</TableCell>
                      <TableCell>{anomaly.loanId}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={anomaly.severity === "Critical" ? "text-risk-critical border-risk-critical/50" : "text-risk-high border-risk-high/50"}>
                          {anomaly.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{anomaly.exceptionType}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{anomaly.mlSignal}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300">{anomaly.status}</Badge>
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
            <div className="p-6 space-y-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full bg-slate-800/50" />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
