import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, MessageSquare, Presentation, Loader2 } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "conversation" | "file";
  title: string;
  snippet: string;
  date: string;
  conversationId?: string;
  fileType?: string;
}

const SearchPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "conversations" | "files">("all");

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const searchResults: SearchResult[] = [];

      // Search conversations by title
      const { data: convs } = await supabase
        .from("conversations")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .ilike("title", `%${q}%`)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (convs) {
        for (const c of convs) {
          searchResults.push({
            id: `conv-${c.id}`,
            type: "conversation",
            title: c.title || "Untitled",
            snippet: "",
            date: new Date(c.updated_at).toLocaleDateString(),
            conversationId: c.id,
          });
        }
      }

      // Search workspace files by name and content
      const { data: files } = await supabase
        .from("workspace_files")
        .select("id, name, type, content, conversation_id, updated_at")
        .eq("user_id", user.id)
        .or(`name.ilike.%${q}%,content.ilike.%${q}%`)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (files) {
        for (const f of files) {
          // Find snippet around the match
          let snippet = "";
          if (f.content) {
            const idx = f.content.toLowerCase().indexOf(q.toLowerCase());
            if (idx >= 0) {
              const start = Math.max(0, idx - 50);
              const end = Math.min(f.content.length, idx + q.length + 100);
              snippet = (start > 0 ? "..." : "") + f.content.substring(start, end) + (end < f.content.length ? "..." : "");
            } else {
              snippet = f.content.substring(0, 150);
            }
          }
          searchResults.push({
            id: `file-${f.id}`,
            type: "file",
            title: f.name,
            snippet,
            date: new Date(f.updated_at).toLocaleDateString(),
            conversationId: f.conversation_id,
            fileType: f.type,
          });
        }
      }

      // Search messages by content
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, content, conversation_id, created_at")
        .ilike("content", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (msgs) {
        // Get conversation titles for these messages
        const convIds = [...new Set(msgs.map(m => m.conversation_id).filter(Boolean))];
        const { data: convTitles } = await supabase
          .from("conversations")
          .select("id, title")
          .in("id", convIds);
        const titleMap = new Map((convTitles || []).map(c => [c.id, c.title]));

        for (const m of msgs) {
          if (m.content.length < 20) continue; // Skip short messages
          const idx = m.content.toLowerCase().indexOf(q.toLowerCase());
          const start = Math.max(0, idx - 50);
          const end = Math.min(m.content.length, idx + q.length + 100);
          const snippet = (start > 0 ? "..." : "") + m.content.substring(start, end) + (end < m.content.length ? "..." : "");

          searchResults.push({
            id: `msg-${m.id}`,
            type: "conversation",
            title: titleMap.get(m.conversation_id) || "Conversation",
            snippet,
            date: new Date(m.created_at).toLocaleDateString(),
            conversationId: m.conversation_id,
          });
        }
      }

      // Dedupe by conversationId for conversation results
      const seen = new Set<string>();
      const deduped = searchResults.filter(r => {
        const key = r.conversationId ? `${r.type}-${r.conversationId}` : r.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setResults(deduped);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const filteredResults = results.filter(r => {
    if (activeTab === "all") return true;
    if (activeTab === "conversations") return r.type === "conversation";
    if (activeTab === "files") return r.type === "file";
    return true;
  });

  const handleClick = (result: SearchResult) => {
    if (result.conversationId) {
      navigate(`/dashboard/${result.conversationId}`);
    }
  };

  const getIcon = (result: SearchResult) => {
    if (result.type === "file") {
      if (result.fileType === "presentation") return <Presentation size={16} className="text-orange-400" />;
      return <FileText size={16} className="text-blue-400" />;
    }
    return <MessageSquare size={16} className="text-muted-foreground" />;
  };

  // Highlight search term in text
  const highlight = (text: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Sidebar */}
      {isMobile ? (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <DashboardSidebar collapsed={false} onToggle={() => {}} activeId="" onSelect={() => setMobileSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      ) : (
        <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} activeId="" onSelect={(id) => navigate(`/dashboard/${id}`)} />
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Search header */}
        <div className="px-6 pt-8 pb-4 border-b border-border">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your conversations and files..."
                autoFocus
                className="w-full rounded-xl border border-border pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring bg-transparent"
              />
              {loading && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />}
            </div>
            {/* Tabs */}
            <div className="flex gap-4 mt-4">
              {(["all", "conversations", "files"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "text-sm font-medium pb-2 border-b-2 transition-colors capitalize",
                    activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab} {tab !== "all" && `(${results.filter(r => tab === "conversations" ? r.type === "conversation" : r.type === "file").length})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-2xl mx-auto space-y-2">
            {!searched && !query && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search size={40} className="text-muted-foreground/20 mb-4" />
                <p className="text-lg font-medium text-foreground mb-1">Search across everything</p>
                <p className="text-sm text-muted-foreground">Find conversations, reports, presentations, and files</p>
              </div>
            )}

            {searched && filteredResults.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
              </div>
            )}

            {filteredResults.map(result => (
              <button
                key={result.id}
                onClick={() => handleClick(result)}
                className="w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-accent/50 transition-colors"
              >
                <span className="mt-0.5 flex-shrink-0">{getIcon(result)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{highlight(result.title)}</p>
                  {result.snippet && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{highlight(result.snippet)}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">{result.date} · {result.type === "file" ? "File" : "Conversation"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;
