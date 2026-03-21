import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useModelSettings, AVAILABLE_MODELS } from "@/hooks/useModelSettings";
import { useConversations } from "@/hooks/useConversations";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  MessageSquarePlus,
  Search,
  Bot,
  Puzzle,
  Plug,
  Wrench,
  Settings,
  Sun,
  Moon,
  LogOut,
  Cpu,
  MessageSquare,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { setModel } = useModelSettings();
  const { data: conversations } = useConversations();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
        setShowModels(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const runAction = (action: () => void) => {
    setOpen(false);
    setShowModels(false);
    action();
  };

  if (showModels) {
    return (
      <CommandDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowModels(false); }}>
        <CommandInput placeholder="Switch model..." />
        <CommandList>
          <CommandEmpty>No model found.</CommandEmpty>
          <CommandGroup heading="Models">
            {AVAILABLE_MODELS.map((m) => (
              <CommandItem
                key={m.id}
                onSelect={() => runAction(() => setModel(m.id))}
              >
                <Cpu className="mr-2 h-4 w-4" />
                <span>{m.name}</span>
                {m.description && (
                  <span className="ml-2 text-xs text-muted-foreground">{m.description}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runAction(() => navigate("/dashboard"))}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            <span>New conversation</span>
          </CommandItem>
          <CommandItem onSelect={() => { setShowModels(true); }}>
            <Cpu className="mr-2 h-4 w-4" />
            <span>Switch model</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => setTheme(theme === "dark" ? "light" : "dark"))}>
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            <span>Toggle theme</span>
            <CommandShortcut>{theme === "dark" ? "Light" : "Dark"}</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runAction(() => navigate("/agents"))}>
            <Bot className="mr-2 h-4 w-4" />
            <span>Go to Agents</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/skills"))}>
            <Wrench className="mr-2 h-4 w-4" />
            <span>Go to Skills</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/connectors"))}>
            <Plug className="mr-2 h-4 w-4" />
            <span>Go to Connectors</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/plugins"))}>
            <Puzzle className="mr-2 h-4 w-4" />
            <span>Go to Plugins</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => navigate("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Go to Settings</span>
          </CommandItem>
        </CommandGroup>

        {conversations && conversations.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Conversations">
              {conversations.slice(0, 8).map((c) => (
                <CommandItem
                  key={c.id}
                  onSelect={() => runAction(() => navigate(`/dashboard/${c.id}`))}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span className="truncate">{c.title || "Untitled"}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={() => runAction(() => signOut())}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
