import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Monitor, Maximize2, Square, SkipBack, SkipForward,
  ChevronUp, ChevronRight, Check, Loader2, Code, Eye,
  FileText, Folder, FolderOpen, Terminal, Copy, CheckCheck, GitCompare,
  Search as SearchIcon, Globe, Radio, Clock,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { CodeLine, Step, FileNode, ComputerViewState, ResearchTask, TimelineEntry } from "@/data/conversations";
import { TokenizedLine } from "@/components/computer/SyntaxHighlighter";
import { CodeMinimap } from "@/components/computer/CodeMinimap";
import { TerminalTab } from "@/components/computer/TerminalTab";
import { MarkdownRenderer } from "@/components/computer/MarkdownRenderer";
import { DiffView, generateDiff } from "@/components/computer/DiffView";
import { BrowserView } from "@/components/computer/BrowserView";
import { SearchView } from "@/components/computer/SearchView";
import { TaskProgressPanel } from "@/components/computer/TaskProgressPanel";
import { ResearchTimeline } from "@/components/computer/ResearchTimeline";

interface ComputerPanelProps {
  visible: boolean;
  onClose: () => void;
  codeLines: CodeLine[];
  steps: Step[];
  fileName: string;
  editorLabel: string;
  fileTree?: FileNode[];
  computerView?: ComputerViewState;
  researchTasks?: ResearchTask[];
}

const defaultFileTree: FileNode[] = [
  { name: "src", type: "folder", expanded: true, children: [
    { name: "index.ts", type: "file" },
  ]},
  { name: "package.json", type: "file" },
];

// Determine if file is code (show code editor) or document (show markdown)
function isCodeFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const codeExts = ["html", "htm", "tsx", "ts", "jsx", "js", "css", "scss", "json", "yaml", "yml", "toml", "xml", "svg", "py", "rb", "go", "rs", "java", "c", "cpp", "h", "sh", "bash", "sql", "vue", "svelte", "astro"];
  return codeExts.includes(ext);
}

function FileTreeItem({ node, depth = 0, activeFile }: { node: FileNode; depth?: number; activeFile: string }) {
  const [open, setOpen] = useState(node.expanded ?? false);
  const isActive = node.type === "file" && node.name === activeFile;
  return (
    <div>
      <button
        onClick={() => node.type === "folder" && setOpen(!open)}
        className={`flex items-center gap-1 w-full px-2 py-0.5 text-[12px] hover:bg-accent/50 transition-colors ${
          isActive ? "bg-accent text-foreground" : "text-muted-foreground"
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {node.type === "folder" ? (
          <>
            <ChevronRight size={10} className={`transition-transform ${open ? "rotate-90" : ""}`} />
            {open ? <FolderOpen size={12} /> : <Folder size={12} />}
          </>
        ) : (
          <>
            <span className="w-[10px]" />
            <FileText size={12} />
          </>
        )}
        <span className="truncate ml-1">{node.name}</span>
      </button>
      {node.type === "folder" && open && node.children?.map((child, i) => (
        <FileTreeItem key={i} node={child} depth={depth + 1} activeFile={activeFile} />
      ))}
    </div>
  );
}

export function ComputerPanel({ visible, onClose, codeLines, steps, fileName, editorLabel, fileTree, computerView, researchTasks }: ComputerPanelProps) {
  const [activeStep, setActiveStep] = useState(steps.length);
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [visibleChars, setVisibleChars] = useState(0);
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "terminal" | "timeline">("code");
  const [prevTab, setPrevTab] = useState<"code" | "preview" | "terminal" | "timeline">("code");
  const [showDiff, setShowDiff] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);
  const prevCodeRef = useRef(codeLines);
  const [scrollState, setScrollState] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });

  const isCode = isCodeFile(fileName);
  const totalChars = codeLines.reduce((sum, l) => sum + (l.content?.length || 0) + 1, 0);

  useEffect(() => {
    if (prevCodeRef.current !== codeLines) {
      setVisibleChars(0);
      setActiveStep(steps.length);
      setShowDiff(false);
      prevCodeRef.current = codeLines;
    }
  }, [codeLines, steps.length]);

  useEffect(() => {
    if (visibleChars >= totalChars) return;
    const chunkSize = 1 + Math.floor(Math.random() * 3);
    const delay = 8 + Math.random() * 25;
    const timer = setTimeout(() => setVisibleChars(v => Math.min(v + chunkSize, totalChars)), delay);
    return () => clearTimeout(timer);
  }, [visibleChars, totalChars]);

  // Visible lines for code view
  const { visibleLines, partialContent } = (() => {
    let chars = 0;
    for (let i = 0; i < codeLines.length; i++) {
      const lineLen = (codeLines[i].content?.length || 0) + 1;
      if (chars + lineLen > visibleChars) {
        return { visibleLines: i, partialContent: codeLines[i].content?.slice(0, Math.max(0, visibleChars - chars)) || "" };
      }
      chars += lineLen;
    }
    return { visibleLines: codeLines.length, partialContent: "" };
  })();

  const isTyping = visibleChars < totalChars;

  useEffect(() => {
    if (codeRef.current && isLive) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
      setScrollState({
        scrollTop: codeRef.current.scrollTop,
        scrollHeight: codeRef.current.scrollHeight,
        clientHeight: codeRef.current.clientHeight,
      });
    }
  }, [visibleChars, isLive]);

  const handleCodeScroll = useCallback(() => {
    if (codeRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = codeRef.current;
      setScrollState({ scrollTop, scrollHeight, clientHeight });
      // Un-live if user scrolls up
      if (scrollHeight - scrollTop - clientHeight > 50) {
        setIsLive(false);
      }
    }
  }, []);

  const handleJumpToLive = useCallback(() => {
    setIsLive(true);
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, []);

  const handleTabChange = useCallback((tab: "code" | "preview" | "terminal" | "timeline") => {
    setPrevTab(activeTab);
    setActiveTab(tab);
  }, [activeTab]);

  const handleMinimapScroll = useCallback((ratio: number) => {
    if (codeRef.current) codeRef.current.scrollTop = ratio * codeRef.current.scrollHeight;
  }, []);

  const handleCopy = useCallback(() => {
    const text = codeLines.slice(0, visibleLines).map(l => l.content).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [codeLines, visibleLines]);

  if (!visible) return null;

  const currentStep = steps[activeStep - 1] || steps[steps.length - 1];
  const totalSteps = steps.length;
  const progress = totalChars > 0 ? Math.round((visibleChars / totalChars) * 100) : 100;
  const shortFileName = fileName.split("/").pop() || fileName;
  const isResearch = !!computerView;
  const viewType = computerView?.type || "editor";

  // Determine status bar label based on view
  const statusLabel = viewType === "browser" ? "Browser" : viewType === "search" ? "Search" : editorLabel;
  const statusAction = viewType === "browser"
    ? `Browsing ${computerView?.browserUrl || ""}`
    : viewType === "search"
    ? `Searching ${computerView?.searchQuery || ""}...`
    : `${isTyping ? "Creating" : "Created"} file ${shortFileName}`;

  const tabs = isResearch
    ? [
        { key: "code" as const, icon: isCode ? Code : FileText, label: isCode ? "Code" : "Document" },
        { key: "preview" as const, icon: Globe, label: "Browser" },
        { key: "terminal" as const, icon: SearchIcon, label: "Search" },
        ...(computerView?.timeline ? [{ key: "timeline" as const, icon: Clock, label: "Timeline" }] : []),
      ]
    : [
        { key: "code" as const, icon: isCode ? Code : FileText, label: isCode ? "Code" : "Document" },
        { key: "preview" as const, icon: Eye, label: "Preview" },
        { key: "terminal" as const, icon: Terminal, label: "Terminal" },
      ];

  const diffLines = generateDiff(codeLines);

  return (
    <div className="computer-panel flex flex-col h-full w-full flex-shrink-0">
      {/* Header */}
      <div className="computer-header flex items-center justify-between px-4 h-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground font-body">Vyroo's Computer</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"><Square size={14} /></button>
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"><Maximize2 size={14} /></button>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"><X size={14} /></button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b flex-shrink-0" style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-header))" }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === tab.key
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-b flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0"
        style={{ borderColor: "hsl(var(--computer-border))" }}
      >
        {isTyping ? (
          <Loader2 size={12} className="text-foreground animate-spin" />
        ) : (
          <Check size={12} className="text-success" />
        )}
        <span>Vyroo is using <span className="text-foreground font-medium">{statusLabel}</span></span>
        <span className="text-muted-foreground/50">·</span>
        <span className="truncate">{statusAction}</span>

        {/* Right-side tools */}
        <div className="ml-auto flex items-center gap-1">
          {isCode && (
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`p-1 rounded transition-colors ${showDiff ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"}`}
              title="Toggle diff view"
            >
              <GitCompare size={12} />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
            title="Copy to clipboard"
          >
            {copied ? <CheckCheck size={12} className="text-success" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col overflow-hidden"
        >
      {activeTab === "code" ? (
        isCode ? (
          /* Code editor view */
          <div className="flex-1 flex overflow-hidden">
            {/* File tree */}
            <div className="w-40 flex-shrink-0 border-r overflow-y-auto py-2" style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-bg))" }}>
              {(fileTree || defaultFileTree).map((node, i) => (
                <FileTreeItem key={i} node={node} activeFile={shortFileName} />
              ))}
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-3 py-1.5 border-b flex-shrink-0" style={{ borderColor: "hsl(var(--computer-border))" }}>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs text-muted-foreground" style={{ backgroundColor: "hsl(var(--code-bg))" }}>
                  <span>{shortFileName}</span>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div ref={codeRef} className="flex-1 overflow-y-auto code-block" onScroll={handleCodeScroll}>
                  {showDiff ? (
                    <DiffView diffLines={diffLines} visibleCount={visibleLines} />
                  ) : (
                    <div className="p-4 text-[13px] leading-[1.7] font-mono">
                      {codeLines.slice(0, visibleLines).map((line, i) => (
                        <div key={`${line.num}-${i}`} className="flex typing-line">
                          <span className="w-8 text-right pr-3 text-muted-foreground/30 select-none tabular-nums flex-shrink-0">{line.num}</span>
                          <span className="break-all">
                            <TokenizedLine content={line.content || "\u00A0"} />
                          </span>
                        </div>
                      ))}
                      {isTyping && visibleLines < codeLines.length && (
                        <div className="flex typing-line">
                          <span className="w-8 text-right pr-3 text-muted-foreground/30 select-none tabular-nums flex-shrink-0">{codeLines[visibleLines].num}</span>
                          <span className="break-all">
                            <TokenizedLine content={partialContent || "\u00A0"} />
                            <span className="inline-block w-[2px] h-3.5 bg-foreground/70 animate-pulse ml-[1px] align-text-bottom" />
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {!showDiff && (
                  <CodeMinimap
                    codeLines={codeLines}
                    visibleLines={visibleLines}
                    scrollTop={scrollState.scrollTop}
                    scrollHeight={scrollState.scrollHeight}
                    clientHeight={scrollState.clientHeight}
                    onScroll={handleMinimapScroll}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Markdown document view — no file tree for cleaner reading */
          <MarkdownRenderer
            codeLines={codeLines}
            visibleChars={visibleChars}
            totalChars={totalChars}
          />
        )
      ) : activeTab === "preview" ? (
        isResearch && computerView?.browserTabs && computerView?.browserContent ? (
          <BrowserView
            tabs={computerView.browserTabs}
            url={computerView.browserUrl || ""}
            pageContent={computerView.browserContent}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: "hsl(var(--computer-bg))" }}>
            <div className="w-full max-w-md px-8 space-y-6 text-center">
              <div className="rounded-lg border border-border overflow-hidden" style={{ backgroundColor: "hsl(var(--card))" }}>
                <div className="h-6 border-b border-border flex items-center gap-1.5 px-3">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-3 rounded bg-muted w-3/4" />
                  <div className="flex gap-2">
                    <div className="h-16 rounded bg-muted flex-1" />
                    <div className="h-16 rounded bg-muted flex-1" />
                    <div className="h-16 rounded bg-muted flex-1" />
                  </div>
                  <div className="h-3 rounded bg-muted w-1/2" />
                  <div className="h-3 rounded bg-muted w-2/3" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {isTyping ? "Vyroo is building the website. Hang tight!" : "Preview ready"}
              </p>
            </div>
          </div>
        )
      ) : activeTab === "terminal" ? (
        isResearch && computerView?.searchResults ? (
          <SearchView
            query={computerView.searchQuery || ""}
            results={computerView.searchResults}
          />
        ) : (
          <TerminalTab steps={steps} isActive={activeTab === "terminal"} />
        )
      ) : activeTab === "timeline" && computerView?.timeline ? (
        <ResearchTimeline entries={computerView.timeline} />
      ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Playback controls */}
      <div className="flex items-center justify-between px-4 py-2 border-t flex-shrink-0"
        style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-header))" }}
      >
        <div className="flex items-center gap-2">
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors"><SkipBack size={14} /></button>
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors"><SkipForward size={14} /></button>
        </div>
        <div className="flex-1 mx-3 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--step-line))" }}>
            <div className="h-full rounded-full bg-success transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          {isTyping && !isLive ? (
            <button
              onClick={handleJumpToLive}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors active:scale-95"
            >
              <Radio size={10} className="animate-pulse" />
              <span>LIVE</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isTyping ? "bg-destructive animate-pulse" : "bg-success"}`} />
              <span className="text-[10px] text-muted-foreground">{isTyping ? "live" : "done"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Research task progress OR step indicator */}
      {researchTasks ? (
        <TaskProgressPanel
          tasks={researchTasks}
          currentStep={researchTasks.filter(t => t.status === "complete").length + (researchTasks.some(t => t.status === "active") ? 1 : 0)}
          totalSteps={researchTasks.length}
        />
      ) : (
        <div
          className="border-t flex-shrink-0 cursor-pointer"
          style={{ borderColor: "hsl(var(--computer-border))", backgroundColor: "hsl(var(--computer-header))" }}
          onClick={() => setStepsExpanded(!stepsExpanded)}
        >
          {stepsExpanded && (
            <div className="px-4 py-2 space-y-1 border-b" style={{ borderColor: "hsl(var(--computer-border))" }}>
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                    step.id === activeStep ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={(e) => { e.stopPropagation(); setActiveStep(step.id); }}
                >
                  {step.status === "complete" ? (
                    <Check size={12} className="text-success flex-shrink-0" />
                  ) : step.status === "active" ? (
                    <Loader2 size={12} className="text-foreground animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-border flex-shrink-0" />
                  )}
                  <span className="truncate">{step.label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Check size={16} className="text-success flex-shrink-0" />
            <span className="text-sm text-foreground flex-1 truncate">{currentStep?.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{Math.min(activeStep, totalSteps)} / {totalSteps}</span>
            <ChevronUp
              size={14}
              className={`text-muted-foreground transition-transform duration-200 ${stepsExpanded ? "" : "rotate-180"}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
