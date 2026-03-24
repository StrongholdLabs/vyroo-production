import { useState } from "react";
import { useTheme } from "next-themes";
import {
  User,
  Settings as SettingsIcon,
  BarChart3,
  CalendarClock,
  Mail,
  Shield,
  Monitor,
  Sparkles,
  Puzzle,
  Link2,
  ExternalLink,
  ChevronDown,
  Camera,
  Key,
  Globe,
  Trash2,
  Copy,
  Check,
  Brain,
  LogOut,
  Plus,
  Search,
  MoreHorizontal,
  Inbox,
  PenLine,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemoryPanel } from "@/components/MemoryPanel";
import { useAuth } from "@/contexts/AuthContext";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { id: "account", label: "Account", icon: User },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "usage", label: "Usage", icon: BarChart3 },
  { id: "scheduled", label: "Scheduled tasks", icon: CalendarClock },
  { id: "mail", label: "Mail Vyroo", icon: Mail },
  { id: "data", label: "Data controls", icon: Shield },
  { id: "browser", label: "Cloud browser", icon: Monitor },
  { id: "personalization", label: "Personalization", icon: Sparkles },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "skills", label: "Skills", icon: Puzzle },
  { id: "connectors", label: "Connectors", icon: Link2 },
  { id: "integrations", label: "Integrations", icon: Link2 },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState("settings");
  const [productUpdates, setProductUpdates] = useState(true);
  const [emailOnTask, setEmailOnTask] = useState(true);
  const [language, setLanguage] = useState("en");
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl p-0 gap-0 border-border overflow-hidden"
        style={{ backgroundColor: "hsl(var(--card))" }}
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex h-[min(85vh,640px)]">
          {/* Left nav — scrollable */}
          <ScrollArea className="w-52 border-r border-border flex-shrink-0" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
            <div className="flex flex-col py-4">
              {/* Logo */}
              <div className="flex items-center gap-2 px-5 mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-foreground">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
                <span className="text-sm font-semibold text-foreground font-body">Vyroo</span>
              </div>

              <div className="flex-1 space-y-0.5 px-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ${
                      activeTab === item.id
                        ? "bg-accent text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <item.icon size={15} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="px-2 pt-2 border-t border-border mt-2 space-y-0.5">
                <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                  <ExternalLink size={15} />
                  <span>Get help</span>
                </button>
                <button
                  onClick={() => { onOpenChange(false); signOut(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={15} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </ScrollArea>

          {/* Right content — scrollable */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-foreground font-body">
                  {navItems.find((n) => n.id === activeTab)?.label || "Settings"}
                </h2>
                {activeTab === "personalization" && (
                  <p className="text-xs text-muted-foreground mt-0.5">Manage who you are and what Vyroo remembers</p>
                )}
                {activeTab === "skills" && (
                  <p className="text-xs text-muted-foreground mt-0.5">Prepackaged and repeatable best practices & tools for your agents</p>
                )}
                {activeTab === "integrations" && (
                  <p className="text-xs text-muted-foreground mt-0.5">Build workflows across your favorite apps</p>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1">
              {activeTab === "settings" && <SettingsTab language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} productUpdates={productUpdates} setProductUpdates={setProductUpdates} emailOnTask={emailOnTask} setEmailOnTask={setEmailOnTask} />}
              {activeTab === "usage" && <UsageTab />}
              {activeTab === "account" && <AccountTab />}
              {activeTab === "memory" && <MemoryPanel />}
              {activeTab === "scheduled" && <ScheduledTab />}
              {activeTab === "mail" && <MailTab />}
              {activeTab === "data" && <DataControlsTab />}
              {activeTab === "browser" && <CloudBrowserTab />}
              {activeTab === "personalization" && <PersonalizationTab />}
              {activeTab === "skills" && <SkillsTab />}
              {activeTab === "connectors" && <ConnectorsTab />}
              {activeTab === "integrations" && <IntegrationsTab />}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Settings Tab ─── */
function SettingsTab({ language, setLanguage, theme, setTheme, productUpdates, setProductUpdates, emailOnTask, setEmailOnTask }: {
  language: string; setLanguage: (v: string) => void;
  theme: string | undefined; setTheme: (v: string) => void;
  productUpdates: boolean; setProductUpdates: (v: boolean) => void;
  emailOnTask: boolean; setEmailOnTask: (v: boolean) => void;
}) {
  return (
    <div className="px-6 py-5 space-y-6">
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">General</h3>
        <label className="text-sm text-foreground font-medium mb-1.5 block">Language</label>
        <div className="relative w-40">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full appearance-none bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-foreground pr-8 focus:outline-none focus:ring-1 focus:ring-ring" style={{ backgroundColor: "hsl(var(--input-surface))" }}>
            <option value="en">English</option>
            <option value="nl">Nederlands</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div>
        <h3 className="text-sm text-foreground font-medium mb-3">Appearance</h3>
        <div className="flex gap-4">
          {[
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
            { label: "Follow System", value: "system" },
          ].map((mode) => {
            const isActive = theme === mode.value;
            return (
              <button key={mode.label} onClick={() => setTheme(mode.value)} className="flex flex-col items-center gap-1.5 group">
                <div className={`w-20 h-14 rounded-lg border-2 transition-colors duration-150 flex items-center justify-center ${isActive ? "border-blue-500" : "border-border hover:border-muted-foreground/40"}`} style={{ backgroundColor: mode.value === "light" ? "hsl(220 9% 80%)" : "hsl(220 9% 14%)" }}>
                  <div className="w-12 h-8 rounded-sm border border-current/10 overflow-hidden" style={{ backgroundColor: mode.value === "light" ? "hsl(0 0% 95%)" : "hsl(220 9% 10%)" }}>
                    <div className="h-1.5 border-b" style={{ borderColor: mode.value === "light" ? "hsl(220 8% 85%)" : "hsl(220 8% 18%)", backgroundColor: mode.value === "light" ? "hsl(0 0% 90%)" : "hsl(220 9% 14%)" }} />
                    <div className="flex h-full">
                      <div className="w-3 border-r" style={{ borderColor: mode.value === "light" ? "hsl(220 8% 85%)" : "hsl(220 8% 18%)" }} />
                      <div className="flex-1" />
                    </div>
                  </div>
                </div>
                <span className={`text-xs ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border" />

      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Communication preferences</h3>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Receive product updates</p>
              <p className="text-xs text-muted-foreground mt-0.5">Receive early access to feature releases and success stories to optimize your workflow.</p>
            </div>
            <Switch checked={productUpdates} onCheckedChange={setProductUpdates} />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Email me when my queued task starts</p>
              <p className="text-xs text-muted-foreground mt-0.5">When enabled, we'll send you a timely email once your task finishes queuing and begins processing.</p>
            </div>
            <Switch checked={emailOnTask} onCheckedChange={setEmailOnTask} />
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground">Manage Cookies</span>
        <button className="px-4 py-1.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors">Manage</button>
      </div>
    </div>
  );
}

/* ─── Usage Tab ─── */
function UsageTab() {
  return (
    <div className="px-6 py-5 space-y-6">
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Credits overview</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Credits used", value: "2,847", sub: "of 5,000", pct: 57 },
            { label: "Tasks completed", value: "143", sub: "this month", pct: 72 },
            { label: "Avg. per task", value: "19.9", sub: "credits", pct: 40 },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border p-3" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-lg font-semibold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mb-2">{stat.sub}</p>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--step-line))" }}>
                <div className="h-full rounded-full bg-success transition-all" style={{ width: `${stat.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Daily usage (last 14 days)</h3>
        <div className="flex items-end gap-1 h-28 px-1">
          {[35, 52, 18, 67, 44, 89, 73, 28, 95, 61, 42, 78, 55, 38].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="w-full rounded-sm transition-colors duration-150 group-hover:bg-success" style={{ height: `${v}%`, backgroundColor: `hsl(var(--success) / ${0.3 + (v / 100) * 0.7})` }} />
              <span className="text-[8px] text-muted-foreground/50 tabular-nums">{i + 7}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recent tasks</h3>
        <div className="space-y-2">
          {[
            { name: "DTC Skincare Analysis", credits: 34, time: "2h ago" },
            { name: "2026 Product Trends", credits: 28, time: "5h ago" },
            { name: "Meta Ads Campaign", credits: 41, time: "1d ago" },
            { name: "Stock Analysis Report", credits: 22, time: "1d ago" },
            { name: "Website Design for Vyroo", credits: 56, time: "2d ago" },
          ].map((task) => (
            <div key={task.name} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground truncate">{task.name}</span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">{task.credits} credits</span>
                <span className="text-[10px] text-muted-foreground/60">{task.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Scheduled Tasks Tab ─── */
function ScheduledTab() {
  const [filter, setFilter] = useState<"scheduled" | "completed">("scheduled");
  return (
    <div className="px-6 py-5 space-y-5">
      <div className="flex gap-2">
        {(["scheduled", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="border-t border-border" />

      <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 text-xs text-muted-foreground font-medium uppercase tracking-wider pb-2 border-b border-border">
        <span>Title</span>
        <span>Schedule at</span>
        <span>Status</span>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarClock size={40} className="text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Schedule future tasks and let Vyroo handle your routine on time.</p>
        <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors">
          <Plus size={14} />
          New schedule
        </button>
      </div>
    </div>
  );
}

/* ─── Mail Vyroo Tab ─── */
function MailTab() {
  const [subTab, setSubTab] = useState<"settings" | "inbox">("settings");
  return (
    <div className="px-6 py-5 space-y-5">
      {/* Info banner */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
        <Mail size={16} className="text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-foreground">Create tasks by email. CC others to collaborate.</p>
        <a href="#" className="text-sm text-primary hover:underline ml-auto flex-shrink-0 flex items-center gap-1">
          Learn more <ExternalLink size={12} />
        </a>
      </div>

      <div className="flex gap-4 border-b border-border">
        {(["settings", "inbox"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              subTab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {subTab === "settings" ? (
        <div className="space-y-5">
          <SettingsRow label="Vyroo's email" description="Send emails to this address to create tasks.">
            <div className="flex items-center gap-2">
              <code className="text-sm text-foreground font-mono">user@vyroo.bot</code>
              <button className="p-1 text-muted-foreground hover:text-foreground"><PenLine size={13} /></button>
            </div>
          </SettingsRow>

          <SettingsRow label="Workflow email" description="Customize email addresses and instructions to process different tasks.">
            <button className="flex items-center gap-1.5 text-sm text-foreground hover:bg-accent px-3 py-1.5 rounded-lg border border-border transition-colors">
              <Plus size={14} /> Add workflow email
            </button>
          </SettingsRow>

          <SettingsRow label="Approved senders" description="Only emails from these addresses can create tasks.">
            <button className="flex items-center gap-1.5 text-sm text-foreground hover:bg-accent px-3 py-1.5 rounded-lg border border-border transition-colors">
              <Plus size={14} /> Add approved sender
            </button>
          </SettingsRow>

          <div className="rounded-lg border border-border p-3 flex items-center justify-between" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
            <div className="flex items-center gap-2.5">
              <Mail size={14} className="text-muted-foreground" />
              <span className="text-sm text-foreground">roelmangal84@gmail.com</span>
            </div>
            <button className="p-1 text-muted-foreground hover:text-foreground"><MoreHorizontal size={15} /></button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox size={40} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No emails received yet.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Data Controls Tab ─── */
function DataControlsTab() {
  const rows = [
    { label: "My shared tasks", action: "Manage" },
    { label: "My shared files", action: "Manage" },
    { label: "My websites", action: "Manage" },
    { label: "My apps", action: "Manage" },
    { label: "My purchased domains", action: "Manage" },
  ];
  return (
    <div className="px-6 py-5 space-y-1">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
          <span className="text-sm text-foreground">{r.label}</span>
          <button className="px-4 py-1.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors">{r.action}</button>
        </div>
      ))}
    </div>
  );
}

/* ─── Cloud Browser Tab ─── */
function CloudBrowserTab() {
  return (
    <div className="px-6 py-5 space-y-5">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Monitor size={40} className="text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Manage your cloud browser sessions and preferences.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Sessions are automatically cleaned up after 24 hours.</p>
      </div>
    </div>
  );
}

/* ─── Personalization Tab ─── */
function PersonalizationTab() {
  const [subTab, setSubTab] = useState<"profile" | "knowledge">("profile");
  const [nickname, setNickname] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [instructions, setInstructions] = useState("");

  return (
    <div className="px-6 py-5 space-y-5">
      <div className="flex gap-4 border-b border-border items-center">
        {(["profile", "knowledge"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              subTab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <HelpCircle size={14} className="text-muted-foreground ml-1 mb-2" />
      </div>

      {subTab === "profile" ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nickname</label>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="What should Vyroo call you?" className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring bg-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Occupation</label>
              <input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g., Product Designer, Software Engineer" className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring bg-transparent" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">More about you</label>
            <div className="relative">
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Your background, preferences, or location to help Vyroo understand you better" rows={4} className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring bg-transparent resize-none" maxLength={2000} />
              <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{bio.length} / 2000</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Vyroo uses this information to personalize responses across all tasks.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Custom Instructions</label>
            <div className="relative">
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder={'How would you like Vyroo to respond?\ne.g., "Focus on Python best practices", "Maintain a professional tone"'} rows={4} className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring bg-transparent resize-none" maxLength={3000} />
              <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{instructions.length} / 3000</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-accent transition-colors">Cancel</button>
            <button className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">Save</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Brain size={40} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Knowledge base coming soon. Upload documents and files for Vyroo to reference.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Skills Tab ─── */
function SkillsTab() {
  const [search, setSearch] = useState("");
  const skills = [
    { name: "video-generator", desc: "Professional AI video production workflow. Use when creating videos, short films,…", official: true, enabled: false, date: "Mar 13, 2026" },
    { name: "skill-creator", desc: "Guide for creating or updating skills that extend Vyroo via specialized knowledge,…", official: true, enabled: true, date: "Feb 16, 2026" },
    { name: "stock-analysis", desc: "Analyze stocks and companies using financial market data. Get company profiles, technical…", official: true, enabled: false, date: "Jan 23, 2026", sparkle: true },
    { name: "similarweb-analytics", desc: "Analyze websites and domains using SimilarWeb traffic data. Get traffic metrics,…", official: true, enabled: false, date: "Jan 23, 2026", sparkle: true },
  ];

  return (
    <div className="px-6 py-5 space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors">
          <SettingsIcon size={14} />
        </button>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Skill" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring bg-transparent" />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent transition-colors">
          <Check size={14} /> Official
        </button>
      </div>

      {/* Add custom */}
      <div className="rounded-xl border border-border p-4 flex items-center justify-between" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Puzzle size={18} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Add custom Skills</p>
            <p className="text-xs text-muted-foreground">Add a skill to unlock new capabilities for yourself or your team.</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors">
          <Plus size={14} /> Add <ChevronDown size={12} />
        </button>
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-2 gap-3">
        {skills.filter((s) => !search || s.name.includes(search.toLowerCase())).map((skill) => (
          <div key={skill.name} className="rounded-xl border border-border p-4" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {skill.name} {skill.sparkle && <Sparkles size={12} className="inline text-primary ml-0.5" />}
              </span>
              <Switch checked={skill.enabled} onCheckedChange={() => {}} />
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{skill.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {skill.official && <><Check size={10} className="inline mr-0.5" />Official · </>}Updated on {skill.date}
              </span>
              <button className="p-1 text-muted-foreground hover:text-foreground"><MoreHorizontal size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Connectors Tab ─── */
function ConnectorsTab() {
  return (
    <div className="px-6 py-5">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Link2 size={40} className="text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Connect Vyroo with your everyday apps, APIs and MCPs</p>
        <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors">
          <Plus size={14} /> Add connectors
        </button>
      </div>
    </div>
  );
}

/* ─── Integrations Tab ─── */
function IntegrationsTab() {
  const integrations = [
    { icon: "⚙️", name: "Build with Vyroo API", desc: "Use Vyroo API to build custom integrations", cta: "Go to configure" },
    { icon: "🔗", name: "Use Vyroo in Zapier", desc: "Connect Vyroo to thousands of apps with Zapier", cta: "Go to configure" },
    { icon: "💬", name: "Use Vyroo in Slack", desc: "Use @Vyroo in Slack to assign tasks to Vyroo", cta: "Go to configure" },
    { icon: "✈️", name: "Telegram", desc: "Message your task, get results delivered instantly", cta: "Go to configure" },
  ];

  return (
    <div className="px-6 py-5">
      <div className="grid grid-cols-2 gap-3">
        {integrations.map((item) => (
          <div key={item.name} className="rounded-xl border border-border p-4 hover:border-muted-foreground/30 transition-colors cursor-pointer" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">{item.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                <span className="text-xs text-muted-foreground flex items-center gap-1">{item.cta} <ExternalLink size={10} /></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Account Tab ─── */
function AccountTab() {
  const [copied, setCopied] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-6 py-5 space-y-6">
      <div className="flex items-start gap-5">
        <div className="relative group">
          <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center text-white text-xl font-bold shadow-lg">Ru</div>
          <button className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
            <Camera size={18} className="text-white" />
          </button>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 flex items-center justify-center" style={{ borderColor: "hsl(var(--card))" }}>
            <Check size={10} className="text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2.5 mb-1">
            <h3 className="text-base font-semibold text-foreground">Roel Mangal</h3>
            <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 font-medium">Free</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2.5">roelmangal84@gmail.com</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Upgrade to Pro</button>
            <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-accent transition-colors">Edit profile</button>
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Personal information</h3>
        <div className="grid grid-cols-2 gap-3">
          <FieldCard label="First name" value="Roel" />
          <FieldCard label="Last name" value="Mangal" />
          <FieldCard label="Email" value="roelmangal84@gmail.com" fullWidth />
          <FieldCard label="Location" value="Netherlands" icon={<Globe size={13} className="text-muted-foreground" />} />
          <FieldCard label="Timezone" value="CET (UTC+1)" />
        </div>
      </div>

      <div className="border-t border-border" />

      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Security</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-3" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><Key size={14} className="text-muted-foreground" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">Password</p>
                <p className="text-[11px] text-muted-foreground">Last changed 3 months ago</p>
              </div>
            </div>
            <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-accent transition-colors">Change</button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center"><Shield size={14} className="text-muted-foreground" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
                <p className="text-[11px] text-muted-foreground">{twoFactor ? "Enabled — authenticator app" : "Add an extra layer of security"}</p>
              </div>
            </div>
            <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Developer</h3>
        <div className="rounded-lg border border-border p-3 flex items-center justify-between" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
          <div>
            <p className="text-[11px] text-muted-foreground mb-0.5">User ID</p>
            <p className="text-xs text-foreground font-mono">usr_7f3a9b2e…d41c</p>
          </div>
          <button onClick={() => handleCopy("usr_7f3a9b2e4c1d8f6a0e5b3d41c")} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <div className="border-t border-border" />

      <div>
        <h3 className="text-xs font-medium text-destructive uppercase tracking-wider mb-2">Danger zone</h3>
        <div className="rounded-lg border border-destructive/20 p-3 flex items-center justify-between" style={{ backgroundColor: "hsl(var(--destructive) / 0.04)" }}>
          <div>
            <p className="text-sm font-medium text-foreground">Delete account</p>
            <p className="text-[11px] text-muted-foreground">Permanently remove your account and all data</p>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
            <Trash2 size={12} className="inline mr-1" />Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function SettingsRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

function FieldCard({ label, value, icon, fullWidth }: { label: string; value: string; icon?: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`rounded-lg border border-border p-3 ${fullWidth ? "col-span-2" : ""}`} style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
