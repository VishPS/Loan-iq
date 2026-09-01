import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BrainCircuit,
  ShieldAlert,
  Search,
  Activity,
  GitMerge,
  BarChart4,
  Cpu,
  FileCheck2,
  FileText,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const navigation = [
    {
      group: "OVERVIEW",
      items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
    },
    {
      group: "INTELLIGENCE",
      items: [
        { name: "Data Intelligence", href: "/data-intelligence", icon: BrainCircuit },
        { name: "Risk Engine", href: "/risk-engine", icon: ShieldAlert },
        { name: "Loan Explorer", href: "/loans", icon: Search },
        { name: "Anomalies", href: "/anomalies", icon: Activity },
      ],
    },
    {
      group: "ANALYTICS",
      items: [
        { name: "Scenarios", href: "/scenarios", icon: GitMerge },
        { name: "Transition Model", href: "/transition-model", icon: GitMerge },
        { name: "Explainability", href: "/explainability", icon: BarChart4 },
        { name: "Model Performance", href: "/model-performance", icon: BarChart4 },
      ],
    },
    {
      group: "AI",
      items: [{ name: "Reviewer Copilot", href: "/ai-reviewer", icon: Cpu }],
    },
    {
      group: "GOVERNANCE",
      items: [
        { name: "AI Development Log", href: "/development-log", icon: FileCheck2 },
        { name: "Model Card", href: "/model-card", icon: FileText },
      ],
    },
    {
      group: "SETTINGS",
      items: [{ name: "Settings", href: "/settings", icon: Settings }],
    },
  ];

  return (
    <div className="flex flex-col w-64 border-r border-border bg-slate-950/80 backdrop-blur-xl h-full">
      <div className="flex flex-col items-start justify-center h-16 px-6 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-primary">LOANIQ</h1>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Loan Intelligence Platform</p>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navigation.map((group) => (
          <div key={group.group}>
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-accent/50 text-primary"
                        : "text-muted-foreground hover:bg-accent/30 hover:text-primary"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border bg-slate-900/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-risk-low animate-pulse"></div>
          <span className="text-xs font-medium text-slate-300">SYSTEM OPERATIONAL</span>
        </div>
        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
          <span>Model v1.4.2</span>
          <span>Updated just now</span>
        </div>
      </div>
    </div>
  );
}
