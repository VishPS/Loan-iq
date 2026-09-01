import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Search, BrainCircuit, Activity, Settings, GitMerge, FileText } from "lucide-react";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Intelligence">
          <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
            <Activity className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/data-intelligence"))}>
            <BrainCircuit className="mr-2 h-4 w-4" />
            <span>Data Intelligence</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/loans"))}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search Loans</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Analytics">
          <CommandItem onSelect={() => runCommand(() => navigate("/scenarios"))}>
            <GitMerge className="mr-2 h-4 w-4" />
            <span>Scenario Lab</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/model-card"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Model Card</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
