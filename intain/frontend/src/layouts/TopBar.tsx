import { useLocation } from "react-router-dom";
import { Search, Bell, User, Cpu } from "lucide-react";
import { useState, useEffect } from "react";

export default function TopBar() {
  const location = useLocation();
  const [isDemo, setIsDemo] = useState(true);

  // Simple breadcrumb logic
  const pathParts = location.pathname.split("/").filter(Boolean);
  const breadcrumb = pathParts.length > 0 
    ? pathParts[0].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "Dashboard";

  useEffect(() => {
    // In a real implementation this would check GET /api/health
    // For now we default to DEMO MODE
    setIsDemo(true);
  }, []);

  return (
    <div className="h-16 border-b border-border bg-slate-950 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium text-slate-300">
          <span className="text-slate-500">Overview / </span>
          {breadcrumb}
        </div>
      </div>
      
      <div className="flex-1 flex justify-center max-w-md mx-6">
        <button className="flex items-center gap-2 w-full max-w-sm px-3 py-1.5 text-sm text-muted-foreground bg-slate-900 border border-slate-800 rounded-md hover:border-slate-700 transition-colors">
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search loans, anomalies, scenarios...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-700 bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-4">
        {isDemo ? (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold tracking-wide">
            <Cpu className="h-3 w-3" />
            DEMO DATA
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-risk-low/10 border border-risk-low/20 text-risk-low text-xs font-semibold tracking-wide">
            <Cpu className="h-3 w-3" />
            LIVE DATA
          </div>
        )}
        
        <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-risk-high border-2 border-slate-950"></span>
        </button>
        <button className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700">
          <User className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
