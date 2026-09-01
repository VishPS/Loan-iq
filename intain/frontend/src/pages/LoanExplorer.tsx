import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import RiskBadge from "@/components/RiskBadge";
import { loansApi } from "@/services/api";
import { Loan } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Download } from "lucide-react";

export default function LoanExplorer() {
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const data = await loansApi.getLoans();
      setLoans(data);
    };
    fetchData();
  }, []);

  const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const filteredLoans = loans?.filter(l => 
    l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="LOAN EXPLORER" 
        description="Search, filter, and inspect portfolio loan predictions"
      >
        <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700">
          <Filter className="h-4 w-4 mr-2" />
          Filter Options
        </Button>
        <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </PageHeader>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Loan ID or State..." 
                className="pl-9 bg-slate-950 border-slate-800 focus-visible:ring-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredLoans?.length || 0} loans
            </div>
          </div>
          
          {loans ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-900">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead>Loan ID</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Credit Band</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead className="text-right">Default Prob</TableHead>
                    <TableHead className="text-right">Delinquency Prob</TableHead>
                    <TableHead className="text-right">Anomaly Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans?.map((loan) => (
                    <TableRow 
                      key={loan.id} 
                      className="border-slate-800 hover:bg-slate-800/50 cursor-pointer" 
                      onClick={() => navigate(`/loans/${loan.id}`)}
                    >
                      <TableCell className="font-medium text-slate-200">{loan.id}</TableCell>
                      <TableCell>{loan.state}</TableCell>
                      <TableCell>{loan.creditBand}</TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.currentBalance)}</TableCell>
                      <TableCell><RiskBadge level={loan.riskLevel} /></TableCell>
                      <TableCell className="text-right">{formatPct(loan.defaultProb)}</TableCell>
                      <TableCell className="text-right">{formatPct(loan.delinquencyProb)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={loan.anomalyScore > 0.8 ? "text-risk-critical border-risk-critical/50" : "text-muted-foreground"}>
                          {loan.anomalyScore.toFixed(2)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-slate-800/50" />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
