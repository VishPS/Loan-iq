import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Server, Database, BrainCircuit, Bell } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-4xl">
      <PageHeader 
        title="SETTINGS" 
        description="Application configuration, model versions, and API connections."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2 flex flex-col">
          <Button variant="ghost" className="justify-start bg-slate-900 border border-slate-800 text-primary">
            <Server className="mr-2 h-4 w-4" /> Environment & API
          </Button>
          <Button variant="ghost" className="justify-start text-muted-foreground hover:text-slate-200">
            <BrainCircuit className="mr-2 h-4 w-4" /> ML Models
          </Button>
          <Button variant="ghost" className="justify-start text-muted-foreground hover:text-slate-200">
            <Database className="mr-2 h-4 w-4" /> Data Sources
          </Button>
          <Button variant="ghost" className="justify-start text-muted-foreground hover:text-slate-200">
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </Button>
          <Button variant="ghost" className="justify-start text-muted-foreground hover:text-slate-200">
            <SettingsIcon className="mr-2 h-4 w-4" /> Preferences
          </Button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>API Connection</CardTitle>
              <CardDescription>Configure the FastAPI backend connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Backend URL</label>
                <div className="flex gap-2">
                  <Input defaultValue="http://localhost:8000" className="bg-slate-950 border-slate-800" />
                  <Button variant="outline" className="border-slate-800 shrink-0">Test Connection</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-950/50 mt-6">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-slate-200">Demo Mode</label>
                  <p className="text-xs text-muted-foreground">Use mock data when API is disconnected</p>
                </div>
                <Switch checked={true} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle>Generative AI Integration</CardTitle>
              <CardDescription>Copilot configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">LLM Provider</label>
                <Input defaultValue="Google Gemini (gemini-3.6-flash)" disabled className="bg-slate-950 border-slate-800 text-muted-foreground opacity-70" />
                <p className="text-[10px] text-muted-foreground mt-1">Configured securely in backend .env file</p>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-950/50 mt-4">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-slate-200">Enforce Grounded Mode</label>
                  <p className="text-xs text-muted-foreground">Prevent LLM from generating unverified risk probabilities</p>
                </div>
                <Switch checked={true} disabled />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
