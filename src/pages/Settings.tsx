import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  User,
  CreditCard,
  Gift,
  Key,
  Palette,
  Moon,
  Sun,
  Monitor,
  Bell,
  BellOff,
  Globe,
  ChevronDown,
  Shield,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import BillingSettings from "@/components/BillingSettings";
import ReferralCard from "@/components/ReferralCard";
import { APIKeySettings } from "@/components/APIKeySettings";

// ─── Tab definitions ───

const tabs = [
  { id: "account", label: "Account", icon: User },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "referrals", label: "Referrals", icon: Gift },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "preferences", label: "Preferences", icon: Palette },
] as const;

type TabId = (typeof tabs)[number]["id"];

// ─── Account Tab ───

function AccountTab() {
  const { user, signOut } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "User";
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;
  const email = user?.email ?? "";
  const provider = user?.app_metadata?.provider ?? "email";
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Profile</h3>
        <div className="flex items-center gap-4 mb-6">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full border-2 border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-xl font-bold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-base font-semibold text-foreground">
              {displayName}
            </p>
            <p className="text-sm text-muted-foreground">{email}</p>
            {createdAt && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Joined {createdAt}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Display Name</span>
            <span className="text-sm text-foreground">{displayName}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm text-foreground">{email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Auth Provider</span>
            <span className="text-sm text-foreground capitalize">{provider}</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Security</h3>
        <div className="space-y-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-accent text-foreground border border-border hover:bg-accent/80 transition-colors w-full justify-between">
            <div className="flex items-center gap-2">
              <Shield size={15} />
              Change Password
            </div>
            <ExternalLink size={13} className="text-muted-foreground" />
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors w-full"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Preferences Tab ───

function PreferencesTab() {
  const { theme, setTheme } = useTheme();
  const [defaultModel, setDefaultModel] = useState("claude-sonnet-4");
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("en");

  const models = [
    { value: "claude-sonnet-4", label: "Claude Sonnet 4" },
    { value: "claude-haiku-3", label: "Claude Haiku 3" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  ];

  const themes = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Appearance
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                theme === t.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <t.icon size={20} />
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Default Model */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Default AI Model
        </h3>
        <div className="relative">
          <select
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {models.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This model will be used as the default for new conversations.
        </p>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notifications ? (
                <Bell size={15} className="text-muted-foreground" />
              ) : (
                <BellOff size={15} className="text-muted-foreground" />
              )}
              <div>
                <p className="text-sm text-foreground">
                  Desktop Notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  Get notified when tasks complete
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                notifications ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                  notifications ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Language</h3>
        <div className="relative">
          <Globe
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border/50 bg-muted/30 pl-9 pr-8 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>("account");

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <SettingsIcon size={20} className="text-foreground" />
            <h1 className="text-xl font-semibold text-foreground font-body">
              Settings
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6 ml-10">
          Manage your account, billing, and preferences.
        </p>

        <div className="flex gap-8">
          {/* Tab sidebar */}
          <nav className="w-48 flex-shrink-0 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <div className="flex-1 min-w-0">
            {activeTab === "account" && <AccountTab />}
            {activeTab === "billing" && <BillingSettings />}
            {activeTab === "referrals" && (
              <div className="space-y-6">
                <ReferralCard />
                {/* Referral History */}
                <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Referral History
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        email: "friend@example.com",
                        status: "completed",
                        date: "Mar 15, 2026",
                        reward: "1 month Pro",
                      },
                      {
                        email: "colleague@work.com",
                        status: "pending",
                        date: "Mar 10, 2026",
                        reward: "Pending",
                      },
                      {
                        email: "developer@startup.io",
                        status: "rewarded",
                        date: "Feb 28, 2026",
                        reward: "1 month Pro (credited)",
                      },
                    ].map((ref) => (
                      <div
                        key={ref.email}
                        className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0"
                      >
                        <div>
                          <p className="text-sm text-foreground">{ref.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {ref.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border",
                              ref.status === "completed" &&
                                "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                              ref.status === "pending" &&
                                "bg-amber-500/15 text-amber-400 border-amber-500/30",
                              ref.status === "rewarded" &&
                                "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            )}
                          >
                            {ref.status}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ref.reward}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === "api-keys" && (
              <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <APIKeySettings />
              </div>
            )}
            {activeTab === "preferences" && <PreferencesTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
