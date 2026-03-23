import { useState } from "react";
import { ChevronUp, Check, Loader2, Globe, FileEdit, Image, Terminal } from "lucide-react";
import type { Step } from "@/data/conversations";
import { ImageLightbox } from "@/components/ImageLightbox";

interface ExpandableStepProps {
  step: Step;
  isActive?: boolean;
}

export function ExpandableStep({ step, isActive }: ExpandableStepProps) {
  const [expanded, setExpanded] = useState(isActive ?? false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  // Collect all image sub-tasks for lightbox
  const imageItems = (step.subTasks || [])
    .filter((t) => t.type === "image" && t.imageUrl)
    .map((t) => ({ url: t.imageUrl!, alt: t.text }));

  const isComplete = step.status === "complete";
  const isPending = step.status === "pending";

  return (
    <div className="space-y-2">
      {/* Step header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 group w-full text-left"
      >
        {isComplete ? (
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(var(--success-soft))" }}>
            <Check size={12} className="text-success" />
          </div>
        ) : isPending ? (
          <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(210 40% 25%)" }}>
            <Loader2 size={12} className="text-[hsl(210_50%_70%)] animate-spin" />
          </div>
        )}
        <span className={`text-sm font-medium ${isComplete ? "text-foreground" : isPending ? "text-muted-foreground" : "text-foreground"}`}>
          {step.label}
        </span>
        <ChevronUp
          size={14}
          className={`text-muted-foreground transition-transform duration-200 ml-1 ${expanded ? "" : "rotate-180"}`}
        />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="ml-7 space-y-3 animate-fade-in">
          {/* Summary text */}
          <p className="text-sm text-muted-foreground leading-relaxed">{step.detail}</p>

          {/* Project initialization card - for first step */}
          {step.id === 1 && step.status === "complete" && (
            <div className="rounded-xl overflow-hidden max-w-md border border-border" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "hsl(var(--success-soft))" }}>
                  <Globe size={16} className="text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{step.label}</p>
                  <span className="text-xs text-muted-foreground">Project initialized</span>
                </div>
                <button className="px-4 py-1.5 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-accent transition-colors active:scale-[0.97]">
                  View
                </button>
              </div>
            </div>
          )}

          {/* Sub-task chips */}
          {step.subTasks && step.subTasks.length > 0 && (
            <div className="space-y-1.5">
              {/* Image thumbnails row */}
              {step.subTasks.some(t => t.type === "image" && t.imageUrl) && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {step.subTasks.filter(t => t.type === "image" && t.imageUrl).map((task, i) => (
                    <div
                      key={`img-${i}`}
                      className="relative w-28 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-border group cursor-pointer"
                      onClick={() => setLightboxIndex(i)}
                    >
                      <img
                        src={task.imageUrl}
                        alt={task.text}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {step.status === "active" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Loader2 size={14} className="text-white animate-spin" />
                          <span className="text-[10px] text-white ml-1">Loading...</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {step.subTasks.map((task, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs log-line"
                  style={{ backgroundColor: "hsl(var(--surface-elevated))", animationDelay: `${i * 80}ms` }}
                >
                  {task.type === "edit" && <FileEdit size={12} className="text-muted-foreground flex-shrink-0" />}
                  {task.type === "image" && <Image size={12} className="text-muted-foreground flex-shrink-0" />}
                  {task.type === "terminal" && <Terminal size={12} className="text-muted-foreground flex-shrink-0" />}
                  {!task.type && <FileEdit size={12} className="text-muted-foreground flex-shrink-0" />}
                  <span className="text-muted-foreground truncate">{task.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Log lines */}
          {step.logs.length > 0 && (
            <div className="space-y-1">
              {step.logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 text-xs log-line" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="text-muted-foreground/40 tabular-nums flex-shrink-0 w-8 text-right">{log.time}</span>
                  <span className={
                    log.type === "result" ? "text-success" :
                    log.type === "action" ? "text-foreground" :
                    "text-muted-foreground"
                  }>{log.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Image lightbox */}
      <ImageLightbox
        images={imageItems}
        initialIndex={lightboxIndex}
        open={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
      />
    </div>
  );
}
