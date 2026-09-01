import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { devLogApi } from "@/services/api";
import { DevelopmentLogEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileCheck2, Terminal, History, Bot, UserCircle } from "lucide-react";

export default function DevelopmentLog() {
  const [logs, setLogs] = useState<DevelopmentLogEntry[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await devLogApi.getLogs();
      setLogs(data);
    };
    fetchData();
  }, []);

  const getStatusBadge = (decision: string) => {
    switch (decision) {
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-risk-low/10 text-risk-low border-risk-low/30">ACCEPTED</Badge>;
      case "CORRECTED":
        return <Badge variant="outline" className="bg-risk-moderate/10 text-risk-moderate border-risk-moderate/30">CORRECTED</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-risk-high/10 text-risk-high border-risk-high/30">REJECTED</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="AI DEVELOPMENT TRACE" 
        description="Transparent record of AI-assisted development and human review."
      >
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-md border border-slate-800">
          <FileCheck2 className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Human-in-the-loop Governance</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">AI Code Share</span>
            <span className="text-3xl font-bold text-slate-200">85%</span>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Human Review Rate</span>
            <span className="text-3xl font-bold text-slate-200">100%</span>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Outputs Corrected</span>
            <span className="text-3xl font-bold text-amber-500">12</span>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Outputs Rejected</span>
            <span className="text-3xl font-bold text-risk-high">4</span>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>Development Audit Trail</CardTitle>
          <CardDescription>Chronological log of prompt execution and human validation</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              {logs ? logs.map((log) => (
                <div key={log.id} className="relative pl-6 pb-6 border-l border-slate-800 last:border-0 last:pb-0">
                  <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-slate-700 border-2 border-slate-950"></div>
                  
                  <div className="flex flex-col gap-4 bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      {getStatusBadge(log.decision)}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="mt-1"><Terminal className="h-4 w-4 text-blue-400" /></div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Task & Prompt</p>
                          <p className="text-sm font-medium text-slate-200">{log.task}</p>
                          <p className="text-sm text-muted-foreground mt-1 bg-slate-900 p-2 rounded border border-slate-800/50 font-mono text-xs">{log.prompt}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="mt-1"><Bot className="h-4 w-4 text-purple-400" /></div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">AI Tool ({log.aiTool}) Output</p>
                          <p className="text-sm text-slate-300">{log.output}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-2 border-t border-slate-800/50">
                        <div className="mt-1"><UserCircle className="h-4 w-4 text-emerald-500" /></div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Human Review</p>
                          <p className="text-sm text-slate-300">{log.humanReview}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="space-y-6">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full bg-slate-800/50 rounded-lg" />)}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
