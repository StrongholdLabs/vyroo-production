import { useState, useCallback, useMemo } from "react";
import { Download, Share2, Play, MoreHorizontal, Sparkles, FileDown, Palette, Check } from "lucide-react";
import type { SlideData } from "@/components/SlidePreviewCard";
import { useToast } from "@/hooks/use-toast";
import { exportPptx } from "@/lib/export-pptx";

const SLIDE_THEMES = [
  { id: "dark", name: "Dark", bg: "#0f172a", accent: "#38bdf8", text: "#ffffff" },
  { id: "midnight", name: "Midnight", bg: "#1a1a2e", accent: "#4fc3f7", text: "#e0e0e0" },
  { id: "corporate", name: "Corporate", bg: "#0d1b2a", accent: "#48c9b0", text: "#c8d6e5" },
  { id: "warm", name: "Warm", bg: "#1b1b2f", accent: "#e2b04a", text: "#f0e6d3" },
  { id: "coral", name: "Coral", bg: "#162447", accent: "#e43f5a", text: "#ffffff" },
  { id: "light", name: "Light", bg: "#f8fafc", accent: "#2563eb", text: "#1e293b" },
] as const;

interface SlideViewerPanelProps {
  slides: SlideData[];
  presentationTitle: string;
  lastModified?: string;
}

export function SlideViewerPanel({ slides: rawSlides, presentationTitle, lastModified }: SlideViewerPanelProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<string>("dark");
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  // Apply selected theme to all slides
  const slides = useMemo(() => {
    const theme = SLIDE_THEMES.find(t => t.id === selectedTheme) || SLIDE_THEMES[0];
    return rawSlides.map(slide => ({
      ...slide,
      bgColor: theme.bg,
      accentColor: theme.accent,
    }));
  }, [rawSlides, selectedTheme]);

  const current = slides[activeSlide];
  const { toast } = useToast();

  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleDownloadPptx = useCallback(async () => {
    setExporting(true);
    setDownloadMenuOpen(false);
    try {
      await exportPptx(slides, presentationTitle, "dark");
      toast({ title: "PPTX downloaded", description: `${slides.length} slides exported as PowerPoint` });
    } catch (e) {
      console.error("PPTX export error:", e);
      toast({ title: "Export failed", description: "Could not generate PPTX file", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }, [slides, presentationTitle, toast]);

  const handleDownloadMd = useCallback(() => {
    setDownloadMenuOpen(false);
    let md = `# ${presentationTitle}\n\n`;
    slides.forEach((slide, i) => {
      md += `---\n\n## Slide ${i + 1}: ${slide.title}\n\n`;
      if (slide.subtitle) md += `*${slide.subtitle}*\n\n`;
      if (slide.content && slide.content.length > 0) {
        slide.content.forEach(point => { md += `- ${point}\n`; });
        md += '\n';
      }
      if (slide.speakerNotes) md += `> **Speaker Notes:** ${slide.speakerNotes}\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presentationTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Markdown downloaded", description: `${slides.length} slides exported as Markdown` });
  }, [slides, presentationTitle, toast]);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "hsl(var(--computer-bg))" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-11 border-b flex-shrink-0" style={{ borderColor: "hsl(var(--computer-border))" }}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{presentationTitle}</p>
          {lastModified && <p className="text-[10px] text-muted-foreground">Last modified: {lastModified}</p>}
        </div>
        <div className="flex items-center gap-1">
          {/* Theme picker */}
          <div className="relative">
            <button
              onClick={() => setThemePickerOpen(!themePickerOpen)}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
              title="Change theme"
            >
              <Palette size={14} />
            </button>
            {themePickerOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setThemePickerOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border py-2 px-3 z-20 shadow-xl" style={{ backgroundColor: "hsl(var(--popover))" }}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">Slide Theme</p>
                  <div className="grid grid-cols-3 gap-2">
                    {SLIDE_THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => { setSelectedTheme(theme.id); setThemePickerOpen(false); }}
                        className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${selectedTheme === theme.id ? "ring-2 ring-primary" : "hover:bg-accent/50"}`}
                      >
                        <div className="w-full aspect-[16/9] rounded-md relative overflow-hidden" style={{ backgroundColor: theme.bg }}>
                          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: theme.accent }} />
                          {selectedTheme === theme.id && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check size={10} style={{ color: theme.accent }} />
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors" title="Share">
            <Share2 size={14} />
          </button>
          <div className="relative">
            <button
              onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
              title="Download"
              disabled={exporting}
            >
              {exporting ? (
                <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={14} />
              )}
            </button>
            {downloadMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDownloadMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border py-1.5 z-20 shadow-xl" style={{ backgroundColor: "hsl(var(--popover))" }}>
                  <button
                    onClick={handleDownloadPptx}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <FileDown size={14} className="text-orange-400" />
                    Download as PPTX
                  </button>
                  <button
                    onClick={handleDownloadMd}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Download size={14} className="text-muted-foreground" />
                    Download as Markdown
                  </button>
                </div>
              </>
            )}
          </div>
          <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors" title="Present">
            <Play size={14} />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors" title="More options">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar thumbnails */}
        <div
          className="w-[140px] flex-shrink-0 overflow-y-auto border-r py-3 px-2 space-y-2"
          style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--surface-sunken))" }}
        >
          {slides.map((slide, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`w-full rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                i === activeSlide
                  ? "border-[hsl(210_60%_55%)] shadow-md"
                  : "border-transparent hover:border-border"
              }`}
            >
              <div
                className="aspect-[16/9] relative overflow-hidden"
                style={{ backgroundColor: slide.bgColor || "hsl(220 14% 96%)" }}
              >
                {slide.badge && (
                  <div
                    className="absolute top-1 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[4px] font-bold"
                    style={{ backgroundColor: slide.accentColor || "hsl(35 70% 65%)" }}
                  >
                    {slide.badge}
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
                  <p className="text-[5px] font-semibold leading-tight" style={{ color: SLIDE_THEMES.find(t => t.id === selectedTheme)?.text || "#fff" }}>
                    {slide.title}
                  </p>
                  {slide.subtitle && (
                    <p className="text-[3px] mt-0.5" style={{ color: SLIDE_THEMES.find(t => t.id === selectedTheme)?.text || "#fff", opacity: 0.7 }}>
                      {slide.subtitle}
                    </p>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: slide.accentColor || "hsl(35 70% 65%)" }} />
              </div>
              <div className="text-center py-0.5">
                <span className="text-[9px] text-muted-foreground font-medium">{i + 1}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Main canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
            <div
              className="w-full max-w-3xl aspect-[16/9] rounded-lg border border-border shadow-lg relative overflow-hidden"
              style={{ backgroundColor: current?.bgColor || "hsl(220 14% 96%)" }}
            >
              {current?.badge && (
                <div
                  className="absolute top-6 right-8 w-16 h-16 rounded-full flex items-center justify-center text-[9px] font-bold leading-tight text-center"
                  style={{
                    backgroundColor: current.accentColor || "hsl(35 70% 65%)",
                    color: "hsl(220 9% 20%)",
                  }}
                >
                  {current.badge}
                </div>
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
                <h2
                  className="text-2xl md:text-3xl font-serif font-semibold leading-tight"
                  style={{ color: "hsl(220 9% 20%)" }}
                >
                  {current?.title}
                </h2>
                {current?.subtitle && (
                  <p className="text-sm mt-4 max-w-lg leading-relaxed" style={{ color: "hsl(215 10% 44%)" }}>
                    {current.subtitle}
                  </p>
                )}
                {current?.content && current.content.length > 0 && (
                  <div className="mt-5 space-y-1.5 text-left max-w-lg w-full">
                    {current.content.map((line, i) => (
                      <p key={i} className="text-xs leading-relaxed" style={{ color: "hsl(215 10% 44%)" }}>
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: current?.accentColor || "hsl(35 70% 65%)" }} />
            </div>
          </div>

          {/* Speaker notes */}
          <div className="border-t px-4 py-2.5 flex items-center gap-2" style={{ borderColor: "hsl(var(--computer-border))" }}>
            <input
              type="text"
              placeholder="Enter your presentation speaker notes"
              className="flex-1 text-xs bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors">
              <Sparkles size={12} />
              Let Vyroo generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
