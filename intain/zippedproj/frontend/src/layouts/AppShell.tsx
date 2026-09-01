import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import CommandPalette from "@/components/CommandPalette";

export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-slate-950/50">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
