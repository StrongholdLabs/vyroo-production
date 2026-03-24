import { useMemo, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Filter,
  FolderOpen,
  Globe,
  Image,
  LayoutGrid,
  List,
  Menu,
  MoreHorizontal,
  Music,
  Presentation,
  Search,
  Star,
  Table,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type ArtifactType = "slides" | "website" | "document" | "image" | "audio" | "spreadsheet" | "other";
type FilterValue = ArtifactType | "all";

interface LibraryArtifact {
  id: string;
  conversationId: string;
  title: string;
  type: ArtifactType;
  preview?: string;
  isFavorited?: boolean;
}

interface LibraryGroup {
  conversationTitle: string;
  date: string;
  artifacts: LibraryArtifact[];
}

interface TypeMeta {
  icon: LucideIcon;
  label: string;
  foreground: string;
  soft: string;
}

const typeMeta: Record<ArtifactType, TypeMeta> = {
  slides: {
    icon: Presentation,
    label: "Slides",
    foreground: "hsl(var(--library-slides))",
    soft: "hsl(var(--library-slides-soft))",
  },
  website: {
    icon: Globe,
    label: "Websites",
    foreground: "hsl(var(--library-website))",
    soft: "hsl(var(--library-website-soft))",
  },
  document: {
    icon: FileText,
    label: "Documents",
    foreground: "hsl(var(--library-document))",
    soft: "hsl(var(--library-document-soft))",
  },
  image: {
    icon: Image,
    label: "Images & Videos",
    foreground: "hsl(var(--muted-foreground))",
    soft: "hsl(var(--accent))",
  },
  audio: {
    icon: Music,
    label: "Audio",
    foreground: "hsl(var(--muted-foreground))",
    soft: "hsl(var(--accent))",
  },
  spreadsheet: {
    icon: Table,
    label: "Spreadsheets",
    foreground: "hsl(var(--library-spreadsheet))",
    soft: "hsl(var(--library-spreadsheet-soft))",
  },
  other: {
    icon: FolderOpen,
    label: "Others",
    foreground: "hsl(var(--muted-foreground))",
    soft: "hsl(var(--accent))",
  },
};

const filterOptions: { value: FilterValue; label: string; icon: LucideIcon }[] = [
  { value: "all", label: "All", icon: Filter },
  { value: "slides", label: "Slides", icon: Presentation },
  { value: "website", label: "Websites", icon: Globe },
  { value: "document", label: "Documents", icon: FileText },
  { value: "image", label: "Images & Videos", icon: Image },
  { value: "audio", label: "Audio", icon: Music },
  { value: "spreadsheet", label: "Spreadsheets", icon: Table },
  { value: "other", label: "Others", icon: FolderOpen },
];

const mockLibraryData: LibraryGroup[] = [
  {
    conversationTitle: "Hottest DTC Product Trends in 2026",
    date: "Sunday",
    artifacts: [
      {
        id: "a1",
        conversationId: "12",
        title: "The Hottest DTC Products of 2026: Trends and Standout Brands",
        type: "slides",
        preview: "A Comprehensive Analysis of the Direct-to-Consumer Landscape",
        isFavorited: true,
      },
      {
        id: "a2",
        conversationId: "12",
        title: "The Hottest DTC Products of 2026: Trends and Standout Brands",
        type: "document",
        preview:
          "Executive Summary\nThe direct-to-consumer (DTC) market in 2026 is characterized by rapid innovation, strong community engagement, and a significant shift towards personalized and sustainable offerings.",
      },
    ],
  },
  {
    conversationTitle: "Hottest DTC Nutrition and Fitness Products of 2026",
    date: "Friday",
    artifacts: [
      {
        id: "a3",
        conversationId: "10",
        title: "3. Market Dynamics and Consumer Behavior",
        type: "document",
        preview:
          "Exercise for Weight Management, Mobile Exercise Apps, Balance, Flow, and Core Strength are leading categories in the latest fitness and wellness landscape.",
      },
    ],
  },
  {
    conversationTitle: "Designing a Website for Vyroo.ai Inspired by Perplexity",
    date: "Friday",
    artifacts: [
      {
        id: "a4",
        conversationId: "4",
        title: "Vyroo.ai - AI Revenue Operator",
        type: "website",
      },
    ],
  },
  {
    conversationTitle: "Build a Landing Page",
    date: "Friday",
    artifacts: [
      {
        id: "a5",
        conversationId: "9",
        title: "Modern Landing Page",
        type: "website",
      },
    ],
  },
  {
    conversationTitle: "Top 5 DTC Skincare Brands and Pricing Strategies Comparison",
    date: "Friday",
    artifacts: [
      {
        id: "a6",
        conversationId: "1",
        title: "Comparative Analysis: Top 5 DTC Skincare Brands and Pricing Strategies (2025-2026)",
        type: "document",
        preview: "A detailed comparison of pricing models, brand positioning, and market performance.",
        isFavorited: true,
      },
    ],
  },
  {
    conversationTitle: "Hottest 2026 DTC Products to Research",
    date: "Friday",
    artifacts: [
      {
        id: "a7",
        conversationId: "2",
        title: "The Hottest DTC Products and Trends of 2026",
        type: "document",
      },
    ],
  },
  {
    conversationTitle: "Stock Analysis",
    date: "Wednesday",
    artifacts: [
      {
        id: "a8",
        conversationId: "12",
        title: "Market Overview and Key Indicators",
        type: "spreadsheet",
      },
    ],
  },
];

const initialFavorites = new Set(
  mockLibraryData.flatMap((group) =>
    group.artifacts.filter((artifact) => artifact.isFavorited).map((artifact) => artifact.id),
  ),
);

function getThumbnailStyle(type: ArtifactType) {
  if (type === "slides") {
    return {
      background:
        "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card)) 22%, hsl(var(--library-slides)) 22%, hsl(var(--library-slides)) 78%, hsl(var(--surface-sunken)) 78%, hsl(var(--surface-sunken)) 100%)",
    };
  }

  if (type === "document") {
    return {
      background:
        "linear-gradient(180deg, hsl(var(--surface-elevated)) 0%, hsl(var(--surface-elevated)) 100%)",
    };
  }

  if (type === "website") {
    return {
      background:
        "linear-gradient(180deg, hsl(var(--surface-elevated)) 0%, hsl(var(--surface-sunken)) 100%)",
    };
  }

  if (type === "spreadsheet") {
    return {
      background:
        "linear-gradient(180deg, hsl(var(--library-spreadsheet-soft)) 0%, hsl(var(--surface-sunken)) 100%)",
    };
  }

  return { background: "hsl(var(--surface-elevated))" };
}

function handleCardKeyDown(event: KeyboardEvent<HTMLElement>, onOpen: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onOpen();
  }
}

const Library = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(initialFavorites);

  const filteredGroups = useMemo(() => {
    return mockLibraryData
      .map((group) => ({
        ...group,
        artifacts: group.artifacts.filter((artifact) => {
          if (activeFilter !== "all" && artifact.type !== activeFilter) return false;
          if (favoritesOnly && !favoriteIds.has(artifact.id)) return false;
          if (!searchQuery) return true;

          const query = searchQuery.toLowerCase();
          return (
            artifact.title.toLowerCase().includes(query) ||
            group.conversationTitle.toLowerCase().includes(query) ||
            artifact.preview?.toLowerCase().includes(query)
          );
        }),
      }))
      .filter((group) => group.artifacts.length > 0);
  }, [activeFilter, favoriteIds, favoritesOnly, searchQuery]);

  const selectedFilter = filterOptions.find((filter) => filter.value === activeFilter) ?? filterOptions[0];

  const openArtifact = (conversationId: string) => {
    navigate(`/dashboard/${conversationId}`);
  };

  const toggleFavorite = (artifactId: string, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(artifactId)) {
        next.delete(artifactId);
      } else {
        next.add(artifactId);
      }
      return next;
    });
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {isMobile && (
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-card border border-border text-foreground hover:bg-accent transition-colors active:scale-95"
        >
          <Menu size={18} />
        </button>
      )}

      {!isMobile && (
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeId=""
          onSelect={(id) => navigate(`/dashboard/${id}`)}
        />
      )}

      {isMobile && (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72 border-r-0" style={{ backgroundColor: "hsl(var(--sidebar-background))" }}>
            <DashboardSidebar
              collapsed={false}
              onToggle={() => setMobileSidebarOpen(false)}
              activeId=""
              onSelect={(id) => {
                navigate(`/dashboard/${id}`);
                setMobileSidebarOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <h1 className="font-display text-2xl md:text-3xl text-foreground mb-6">Library</h1>

          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterDropdownOpen((open) => !open)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors"
              >
                <selectedFilter.icon size={14} className="text-muted-foreground" />
                <span>{selectedFilter.label}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" className="text-muted-foreground ml-1">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </button>

              {filterDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFilterDropdownOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl border border-border bg-popover shadow-xl z-50 py-2">
                    {filterOptions.map((option) => {
                      const OptionIcon = option.icon;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setActiveFilter(option.value);
                            setFilterDropdownOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors hover:bg-accent",
                            activeFilter === option.value ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          <OptionIcon size={15} />
                          <span>{option.label}</span>
                          {activeFilter === option.value && (
                            <svg width="14" height="14" viewBox="0 0 14 14" className="ml-auto text-foreground">
                              <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFavoritesOnly((current) => !current)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm rounded-xl border transition-colors",
                favoritesOnly
                  ? "border-border bg-accent text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Star
                size={14}
                fill={favoritesOnly ? "currentColor" : "none"}
                style={favoritesOnly ? { color: "hsl(var(--rating-star))" } : undefined}
              />
              <span>My favorites</span>
            </button>

            <div className="flex-1" />

            <div className="relative w-full sm:w-56 md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search files"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex items-center border border-border rounded-xl overflow-hidden bg-card">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <FolderOpen size={40} className="mb-3 opacity-40" />
              <p className="text-sm">No files found</p>
            </div>
          ) : (
            <div className="space-y-9">
              {filteredGroups.map((group) => (
                <section key={group.conversationTitle}>
                  <div className="flex items-center justify-between mb-3 gap-4">
                    <h2 className="text-lg font-semibold text-foreground tracking-tight">{group.conversationTitle}</h2>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{group.date}</span>
                  </div>

                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.artifacts.map((artifact) => {
                        const meta = typeMeta[artifact.type];
                        const TypeIcon = meta.icon;
                        const isFavorited = favoriteIds.has(artifact.id);

                        return (
                          <article
                            key={artifact.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openArtifact(artifact.conversationId)}
                            onKeyDown={(event) => handleCardKeyDown(event, () => openArtifact(artifact.conversationId))}
                            className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:bg-accent/40 transition-colors shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <div className="relative h-60 p-3" style={getThumbnailStyle(artifact.type)}>
                              <div className="absolute left-3 top-3 inline-flex max-w-[78%] items-center gap-2 rounded-xl px-3 py-1.5 border border-border/60 backdrop-blur-sm"
                                style={{ backgroundColor: "hsl(var(--surface-elevated) / 0.92)" }}>
                                <span
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-md"
                                  style={{ backgroundColor: meta.soft, color: meta.foreground }}
                                >
                                  <TypeIcon size={14} />
                                </span>
                                <span className="truncate text-sm font-medium text-foreground">{artifact.title}</span>
                              </div>

                              <div className="absolute right-3 top-3 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                                  aria-pressed={isFavorited}
                                  onClick={(event) => toggleFavorite(artifact.id, event)}
                                  className={cn(
                                    "p-1.5 rounded-lg border border-border/60 backdrop-blur-sm transition-all",
                                    isFavorited ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100",
                                  )}
                                  style={{
                                    backgroundColor: "hsl(var(--surface-elevated) / 0.9)",
                                    color: isFavorited ? "hsl(var(--rating-star))" : "hsl(var(--muted-foreground))",
                                  }}
                                >
                                  <Star size={14} fill={isFavorited ? "currentColor" : "none"} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => event.stopPropagation()}
                                  className="p-1.5 rounded-lg border border-border/60 backdrop-blur-sm text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                  style={{ backgroundColor: "hsl(var(--surface-elevated) / 0.9)" }}
                                  aria-label="More actions"
                                >
                                  <MoreHorizontal size={14} />
                                </button>
                              </div>

                              {artifact.preview && (
                                <div
                                  className={cn(
                                    "absolute left-4 right-4",
                                    artifact.type === "slides" ? "bottom-14" : "bottom-4",
                                  )}
                                >
                                  <p
                                    className={cn(
                                      "font-medium leading-tight",
                                      artifact.type === "slides"
                                        ? "text-[1.05rem] text-primary-foreground max-w-[16rem]"
                                        : "text-sm text-muted-foreground max-h-24 overflow-hidden",
                                    )}
                                  >
                                    {artifact.preview}
                                  </p>
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {group.artifacts.map((artifact) => {
                        const meta = typeMeta[artifact.type];
                        const TypeIcon = meta.icon;
                        const isFavorited = favoriteIds.has(artifact.id);

                        return (
                          <article
                            key={artifact.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openArtifact(artifact.conversationId)}
                            onKeyDown={(event) => handleCardKeyDown(event, () => openArtifact(artifact.conversationId))}
                            className="group flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <span
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                              style={{ backgroundColor: meta.soft, color: meta.foreground }}
                            >
                              <TypeIcon size={15} />
                            </span>
                            <span className="text-sm text-foreground truncate flex-1 text-left">{artifact.title}</span>
                            <button
                              type="button"
                              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                              aria-pressed={isFavorited}
                              onClick={(event) => toggleFavorite(artifact.id, event)}
                              className={cn(
                                "p-1.5 rounded-lg text-muted-foreground transition-opacity",
                                isFavorited ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100",
                              )}
                              style={isFavorited ? { color: "hsl(var(--rating-star))" } : undefined}
                            >
                              <Star size={14} fill={isFavorited ? "currentColor" : "none"} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => event.stopPropagation()}
                              className="p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                              aria-label="More actions"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Library;
