import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Explainability() {
  const globalShapData = [
    { feature: "dti_ratio", impact: 1.25, color: "#94a3b8" },
    { feature: "credit_score", impact: 1.15, color: "#94a3b8" },
    { feature: "current_balance", impact: 0.85, color: "#94a3b8" },
    { feature: "interest_rate", impact: 0.62, color: "#94a3b8" },
    { feature: "ltv_ratio", impact: 0.55, color: "#94a3b8" },
    { feature: "months_on_book", impact: 0.41, color: "#94a3b8" },
    { feature: "state_CA", impact: 0.22, color: "#94a3b8" },
    { feature: "loan_purpose_refi", impact: 0.15, color: "#94a3b8" },
  ];

  const localShapData = [
    { feature: "Days Past Due", impact: 0.12, color: "hsl(var(--risk-high))" },
    { feature: "Loan-to-Value", impact: 0.08, color: "hsl(var(--risk-high))" },
    { feature: "DTI Ratio", impact: 0.05, color: "hsl(var(--risk-high))" },
    { feature: "Credit Score", impact: -0.07, color: "hsl(var(--risk-low))" },
    { feature: "Interest Rate", impact: -0.02, color: "hsl(var(--risk-low))" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="EXPLAINABILITY" 
        description="Global feature importance and local SHAP attributions"
      />

      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg text-sm text-slate-300 mb-6">
        <span className="font-semibold text-primary">Responsible AI Notice:</span> The model sensitivity shown reflects mathematical contribution to the XGBoost output score, not guaranteed real-world causal outcomes. Human review is required.
      </div>

      <Tabs defaultValue="global" className="space-y-4">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="global">Global Explainability</TabsTrigger>
          <TabsTrigger value="local">Local Explainability</TabsTrigger>
        </TabsList>
        
        <TabsContent value="global">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Global Feature Importance</CardTitle>
              <CardDescription>Mean absolute SHAP values across the entire validation dataset</CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={globalShapData} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={12} width={120} />
                  <Tooltip 
                    cursor={{fill: '#1e293b'}} 
                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}}
                    formatter={(val: any) => val.toFixed(2)}
                  />
                  <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                    {globalShapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Local Explanation (Sample: LN-100293)</CardTitle>
              <CardDescription>Feature contributions for a specific prediction instance</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={localShapData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                  <Tooltip 
                    cursor={{fill: '#1e293b'}} 
                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}}
                    formatter={(val: any) => val > 0 ? `+${val}` : val}
                  />
                  <Bar dataKey="impact" radius={4}>
                    {localShapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
