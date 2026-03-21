import { useState } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  X,
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
  Key,
  Plug,
  Check,
  ArrowRight,
  Loader2,
  Search,
  Code,
  FileText,
  Eye,
  TrendingUp,
  Brain,
  LogOut,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { APIKeySettings } from "@/components/APIKeySettings";
import { MemoryPanel } from "@/components/MemoryPanel";
import { useConnectors } from "@/hooks/useConnectors";
import {
  useAvailableSkills,
  useUserSkills,
  useToggleSkill,
} from "@/hooks/useSkills";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { id: "account", label: "Account", icon: User },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "api-keys", label: "API Keys", icon: Key },
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
  const navigate = useNavigate();
  const { data: connectors } = useConnectors();
  const connectedCount = connectors?.filter((c) => c.status === "connected").length ?? 0;
  const { data: allSkills } = useAvailableSkills();
  const { data: enabledSkills } = useUserSkills();
  const toggleSkill = useToggleSkill();
  const enabledSkillSet = new Set(enabledSkills ?? []);
  const { user } = useAuth();

  const handleSignOut = async () => {
    onOpenChange(false);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 border-border overflow-hidden" style={{ backgroundColor: "hsl(var(--card))" }}>
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex h-[520px]">
          {/* Left nav */}
          <div className="w-52 border-r border-border flex flex-col py-4 flex-shrink-0" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
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
              <button
                onClick={() => window.open("https://vyroo.ai/features", "_blank")}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <ExternalLink size={15} />
                <span>Get help</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={15} />
                <span>Sign out</span>
              </button>
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground font-body">
                {navItems.find((n) => n.id === activeTab)?.label || "Settings"}
              </h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              >
                <X size={18} />
              </button>
            </div>

            {/* Settings content */}
            {activeTab === "settings" && (
              <div className="px-6 py-5 space-y-6">
                {/* Language */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">General</h3>
                  <label className="text-sm text-foreground font-medium mb-1.5 block">Language</label>
                  <div className="relative w-40">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full appearance-none bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-foreground pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
                      style={{ backgroundColor: "hsl(var(--input-surface))" }}
                    >
                      <option value="en">English</option>
                      <option value="nl">Nederlands</option>
                      <option value="de">Deutsch</option>
                      <option value="fr">Français</option>
                      <option value="es">Español</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Appearance */}
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
                        <button
                          key={mode.label}
                          onClick={() => setTheme(mode.value)}
                          className="flex flex-col items-center gap-1.5 group"
                        >
                          <div
                            className={`w-20 h-14 rounded-lg border-2 transition-colors duration-150 flex items-center justify-center ${
                              isActive ? "border-blue-500" : "border-border hover:border-muted-foreground/40"
                            }`}
                            style={{ backgroundColor: mode.value === "light" ? "hsl(220 9% 80%)" : "hsl(220 9% 14%)" }}
                          >
                            <div className="w-12 h-8 rounded-sm border border-current/10 overflow-hidden" style={{ backgroundColor: mode.value === "light" ? "hsl(0 0% 95%)" : "hsl(220 9% 10%)" }}>
                              <div className="h-1.5 border-b" style={{ borderColor: mode.value === "light" ? "hsl(220 8% 85%)" : "hsl(220 8% 18%)", backgroundColor: mode.value === "light" ? "hsl(0 0% 90%)" : "hsl(220 9% 14%)" }} />
                              <div className="flex h-full">
                                <div className="w-3 border-r" style={{ borderColor: mode.value === "light" ? "hsl(220 8% 85%)" : "hsl(220 8% 18%)" }} />
                                <div className="flex-1" />
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {mode.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Communication preferences */}
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

                {/* Manage cookies */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Manage Cookies</span>
                  <button className="px-4 py-1.5 text-sm border border-border rounded-lg text-foreground hover:bg-accent transition-colors">
                    Manage
                  </button>
                </div>
              </div>
            )}

            {/* Usage tab */}
            {activeTab === "usage" && (
              <div className="px-6 py-5 space-y-6">
                {/* Credits overview */}
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

                {/* Usage chart */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Daily usage (last 14 days)</h3>
                  <div className="flex items-end gap-1 h-28 px-1">
                    {[35, 52, 18, 67, 44, 89, 73, 28, 95, 61, 42, 78, 55, 38].map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full rounded-sm transition-colors duration-150 group-hover:bg-success"
                          style={{
                            height: `${v}%`,
                            backgroundColor: `hsl(var(--success) / ${0.3 + (v / 100) * 0.7})`,
                          }}
                        />
                        <span className="text-[8px] text-muted-foreground/50 tabular-nums">{i + 7}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Recent tasks */}
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
            )}

            {/* API Keys tab */}
            {activeTab === "api-keys" && (
              <div className="px-6 py-5">
                <APIKeySettings />
              </div>
            )}

            {/* Connectors tab */}
            {activeTab === "connectors" && (
              <div className="px-6 py-5 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <Plug size={18} className="text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {connectedCount > 0
                        ? `${connectedCount} connector${connectedCount === 1 ? "" : "s"} connected`
                        : "No connectors connected"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Integrate your favorite tools and services
                    </p>
                  </div>
                </div>

                {/* Connected list */}
                {connectors && connectors.filter((c) => c.status === "connected").length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</h3>
                    {connectors
                      .filter((c) => c.status === "connected")
                      .map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-2.5 py-1.5 px-2 rounded-md"
                          style={{ backgroundColor: "hsl(var(--surface-elevated))" }}
                        >
                          <Check size={12} className="text-success flex-shrink-0" />
                          <span className="text-sm text-foreground">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {c.capabilities.join(", ")}
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/connectors");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                >
                  <span>Manage Connectors</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Skills tab */}
            {activeTab === "skills" && (
              <SkillsTabContent
                skills={allSkills}
                enabledSet={enabledSkillSet}
                onToggle={(id, enabled) => toggleSkill.mutate({ skillId: id, enabled })}
                isToggling={toggleSkill.isPending}
                onNavigate={() => {
                  onOpenChange(false);
                  navigate("/skills");
                }}
              />
            )}

            {/* Memory tab */}
            {activeTab === "memory" && (
              <div className="px-6 py-5">
                <MemoryPanel />
              </div>
            )}

            {/* Account tab */}
            {activeTab === "account" && (
              <div className="px-6 py-5 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-accent flex items-center justify-center flex-shrink-0">
                    {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                      <img
                        src={user.user_metadata.avatar_url || user.user_metadata.picture}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User size={24} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {user?.user_metadata?.full_name || user?.user_metadata?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      ID: {user?.id?.slice(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="border-t border-border" />

                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Email</span>
                      <span className="text-foreground">{user?.email || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Provider</span>
                      <span className="text-foreground capitalize">{user?.app_metadata?.provider || "email"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created</span>
                      <span className="text-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last sign in</span>
                      <span className="text-foreground">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border" />

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-destructive/30 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            )}

            {/* Placeholder for other tabs */}
            {activeTab !== "settings" && activeTab !== "usage" && activeTab !== "api-keys" && activeTab !== "connectors" && activeTab !== "skills" && activeTab !== "memory" && activeTab !== "account" && (
              <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
                  {(() => {
                    const Icon = navItems.find((n) => n.id === activeTab)?.icon || SettingsIcon;
                    return <Icon size={20} className="text-muted-foreground" />;
                  })()}
                </div>
                <p className="text-sm text-muted-foreground">
                  {navItems.find((n) => n.id === activeTab)?.label} settings coming soon
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skills Tab (compact) ───

const settingsSkillIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  search: Search,
  code: Code,
  "file-text": FileText,
  eye: Eye,
  "trending-up": TrendingUp,
  "link-2": Link2,
};

function SkillsTabContent({
  skills,
  enabledSet,
  onToggle,
  isToggling,
  onNavigate,
}: {
  skills: { id: string; name: string; icon_name: string; description: string }[] | undefined;
  enabledSet: Set<string>;
  onToggle: (id: string, enabled: boolean) => void;
  isToggling: boolean;
  onNavigate: () => void;
}) {
  if (!skills) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-6 py-5 space-y-5">
      <div className="text-xs text-muted-foreground">
        <span className="text-foreground font-medium tabular-nums">{enabledSet.size}</span>
        {" of "}
        <span className="tabular-nums">{skills.length}</span>
        {" skills enabled"}
      </div>

      <div className="space-y-1">
        {skills.map((skill) => {
          const Icon = settingsSkillIcons[skill.icon_name] ?? Sparkles;
          const enabled = enabledSet.has(skill.id);
          return (
            <div
              key={skill.id}
              className="flex items-center justify-between gap-3 py-2 px-2 rounded-md hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon size={15} className={enabled ? "text-foreground" : "text-muted-foreground"} />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{skill.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{skill.description}</p>
                </div>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => onToggle(skill.id, checked)}
                disabled={isToggling}
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={onNavigate}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
      >
        <span>View All Skills</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
