import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Cpu, ShieldCheck, Database, GitMerge, ListChecks, ArrowRight, Save, Copy, Flag, RefreshCw } from "lucide-react";

export default function AIReviewer() {
  const [loanId, setLoanId] = useState("LN-100293");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNote, setShowNote] = useState(true);

  const handleGenerate = () => {
    setIsGenerating(true);
    setShowNote(false);
    setTimeout(() => {
      setIsGenerating(false);
      setShowNote(true);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <PageHeader 
        title="AI REVIEWER COPILOT" 
        description="Generate reviewer notes from verified model outputs and data-quality findings."
      >
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-md border border-slate-800">
          <Cpu className="h-4 w-4 text-risk-low" />
          <span className="text-sm font-medium text-slate-300">GROUNDED MODE</span>
        </div>
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-6 h-[750px]">
        {/* LEFT PANEL: Loan Selector */}
        <div className="w-full lg:w-64 flex flex-col gap-4">
          <Card className="bg-slate-900/50 border-slate-800 h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm">Target Loan</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              <div className="flex gap-2">
                <Input value={loanId} onChange={(e) => setLoanId(e.target.value)} className="bg-slate-950 border-slate-800 text-sm" />
                <Button size="icon" variant="outline" className="border-slate-800 bg-slate-950 shrink-0"><ArrowRight className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-800 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk</span>
                  <span className="font-semibold text-risk-critical">Critical</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Default Prob</span>
                  <span className="font-semibold text-slate-300">82.0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Anomaly Score</span>
                  <span className="font-semibold text-risk-critical">0.88</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Quality</span>
                  <span className="font-semibold text-risk-high">72/100</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CENTER PANEL: Evidence Chain */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="bg-slate-900/50 border-slate-800 h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm flex justify-between items-center">
                EVIDENCE CHAIN
                <span className="text-xs text-muted-foreground font-normal">Grounded on system-generated evidence</span>
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2 relative">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <ShieldCheck className="h-4 w-4 text-blue-400" />
                    MODEL EVIDENCE
                  </div>
                  <p className="text-xs text-muted-foreground">Probabilities: Default 82.0%, Delinquency 91.0%</p>
                  <p className="text-xs text-muted-foreground">SHAP Drivers: DPD (+0.12), LTV (+0.08)</p>
                </div>

                <div className="w-px h-4 bg-slate-800 mx-auto"></div>

                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2 relative">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Database className="h-4 w-4 text-amber-500" />
                    DATA EVIDENCE
                  </div>
                  <p className="text-xs text-muted-foreground">Quality Score: 72/100</p>
                  <p className="text-xs text-risk-high">Validation Issues: current_balance &gt; original_balance</p>
                  <p className="text-xs text-risk-high">Anomaly Score: 0.88 (Isolation Forest density)</p>
                </div>

                <div className="w-px h-4 bg-slate-800 mx-auto"></div>

                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2 relative">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <GitMerge className="h-4 w-4 text-purple-400" />
                    SCENARIO EVIDENCE
                  </div>
                  <p className="text-xs text-muted-foreground">Base Default: 82.0%</p>
                  <p className="text-xs text-risk-high">Adverse Credit Default: 94.5%</p>
                </div>

                <div className="w-px h-4 bg-slate-800 mx-auto"></div>

                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2 relative">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <ListChecks className="h-4 w-4 text-emerald-400" />
                    REFERENCE CONTEXT
                  </div>
                  <p className="text-xs text-muted-foreground">Injected: Data dictionary definitions for DPD, LTV</p>
                  <p className="text-xs text-muted-foreground">Injected: Internal policy manual for Data Conflicts</p>
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* RIGHT PANEL: AI Note */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          <Card className="bg-slate-900 border-primary/20 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-primary"></div>
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm flex justify-between items-center">
                AI REVIEWER NOTE
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary">LLM GENERATED</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col">
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">Synthesizing evidence...</p>
                </div>
              ) : showNote ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4 text-sm text-slate-300">
                    <div className="p-2 bg-risk-critical/10 border border-risk-critical/20 rounded-md text-risk-critical font-semibold flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" />
                      AI RECOMMENDATION: HUMAN REVIEW REQUIRED
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-200 mb-1">Risk Summary</h4>
                      <p className="text-muted-foreground">This loan exhibits a critical risk profile with an 82.0% probability of default within the next 12 months. This is primarily driven by recent delinquency.</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-200 mb-1">Data Quality Concerns</h4>
                      <p className="text-muted-foreground">The underlying data contains a validation conflict (current balance exceeds original balance), leading to an anomaly score of 0.88. The ML prediction should be treated with caution until the balance data is verified with the servicer.</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-200 mb-1">Scenario Sensitivity</h4>
                      <p className="text-muted-foreground">Under adverse credit conditions, default probability increases to 94.5%.</p>
                    </div>

                    <div className="text-[10px] text-muted-foreground/60 border-t border-slate-800 pt-2 mt-4">
                      Limitations: The LLM summarizes verified evidence and does not make autonomous financial decisions.
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800">
                    <Button variant="default" className="flex-1" onClick={handleGenerate}>
                      <Save className="h-4 w-4 mr-2" /> Save Note
                    </Button>
                    <Button variant="outline" size="icon" className="border-slate-700 hover:bg-slate-800"><Copy className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="border-slate-700 hover:bg-slate-800 hover:text-risk-high"><Flag className="h-4 w-4" /></Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <Button onClick={handleGenerate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Generate Reviewer Note
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Temporary icon addition for the above file
function ShieldAlert(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>;
}
