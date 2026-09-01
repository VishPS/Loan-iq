import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function TransitionModel() {
  const transitionData = [
    { month: 1, Default: 0.1, Prepayment: 1.2, Delinquency: 0.5 },
    { month: 2, Default: 0.3, Prepayment: 2.5, Delinquency: 1.1 },
    { month: 3, Default: 0.6, Prepayment: 3.8, Delinquency: 1.8 },
    { month: 4, Default: 1.0, Prepayment: 4.9, Delinquency: 2.6 },
    { month: 5, Default: 1.5, Prepayment: 6.2, Delinquency: 3.4 },
    { month: 6, Default: 2.1, Prepayment: 7.5, Delinquency: 4.2 },
    { month: 7, Default: 2.7, Prepayment: 8.4, Delinquency: 5.0 },
    { month: 8, Default: 3.2, Prepayment: 9.3, Delinquency: 5.8 },
    { month: 9, Default: 3.7, Prepayment: 10.1, Delinquency: 6.5 },
    { month: 10, Default: 4.0, Prepayment: 11.2, Delinquency: 7.0 },
    { month: 11, Default: 4.1, Prepayment: 11.8, Delinquency: 7.3 },
    { month: 12, Default: 4.2, Prepayment: 12.0, Delinquency: 7.5 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="LOAN STATE TRANSITION ENGINE" 
        description="Hazard modeling and survival analysis of portfolio state progression"
      />

      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg text-sm text-slate-300 mb-6">
        <span className="font-semibold text-primary">Methodology:</span> This engine approximates monthly state transition probabilities. Current models estimate hazard functions for terminal states (Default, Prepayment) independently. Future iterations will integrate a full competing-risks survival model.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>State Transition Diagram</CardTitle>
            <CardDescription>Estimated progression pathways</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center p-6">
            <div className="flex flex-col gap-6 items-center w-full max-w-sm">
              <div className="px-6 py-3 bg-slate-800 rounded-md border border-slate-700 w-full text-center font-medium">CURRENT</div>
              <div className="flex w-full justify-between gap-4 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-full bg-slate-700 -z-10"></div>
                <div className="w-1/2 flex justify-center">
                  <div className="px-4 py-2 bg-slate-800/80 rounded-md border border-slate-700 text-sm">30 DPD</div>
                </div>
                <div className="w-1/2 flex justify-center mt-12">
                  <div className="px-4 py-2 bg-blue-900/30 text-blue-400 rounded-md border border-blue-900/50 text-sm">PREPAID</div>
                </div>
              </div>
              <div className="px-4 py-2 bg-slate-800/80 rounded-md border border-slate-700 text-sm w-32 text-center">60 DPD</div>
              <div className="px-4 py-2 bg-risk-moderate/20 text-risk-moderate rounded-md border border-risk-moderate/30 text-sm w-32 text-center">90+ DPD</div>
              <div className="px-6 py-3 bg-risk-high/20 text-risk-high rounded-md border border-risk-high/30 w-full text-center font-bold">DEFAULT</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle>Cumulative Event Curves</CardTitle>
            <CardDescription>12-month aggregated terminal and intermediate events</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transitionData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tickFormatter={(v) => `M${v}`} />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  cursor={{stroke: '#334155'}} 
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}}
                  formatter={(val: any) => `${val.toFixed(1)}%`}
                />
                <Legend />
                <Line type="monotone" dataKey="Prepayment" stroke="#60a5fa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Delinquency" stroke="hsl(var(--risk-moderate))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Default" stroke="hsl(var(--risk-high))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
