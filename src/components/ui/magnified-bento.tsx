"use client";
import React from "react";
import { motion, useMotionValue, useMotionTemplate } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Globe,
  Code,
  FileText,
  Terminal,
  Eye,
  Cpu,
  Search,
  Pen,
  Download,
  Layers,
} from "lucide-react";

const TAG_ROWS = [
  [
    { id: "browse", icon: Globe, label: "Browsing" },
    { id: "code", icon: Code, label: "Writing Code" },
    { id: "file", icon: FileText, label: "Editing Files" },
    { id: "terminal", icon: Terminal, label: "Terminal" },
    { id: "preview", icon: Eye, label: "Live Preview" },
  ],
  [
    { id: "compute", icon: Cpu, label: "Processing" },
    { id: "search", icon: Search, label: "Researching" },
    { id: "compose", icon: Pen, label: "Composing" },
    { id: "deploy", icon: Download, label: "Deploying" },
    { id: "layers", icon: Layers, label: "Multi-Task" },
  ],
];

const CONFIG = {
  title: "Vyroo's Computer",
  description:
    "Real-time browser streaming — watch the AI work inside a live sandboxed environment.",
  lensSize: 80,
};

const BrowserStreamPreview = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lensX = useMotionValue(0);
  const lensY = useMotionValue(0);

  const clipPath = useMotionTemplate`circle(28px at calc(50% + ${lensX}px) calc(50% + ${lensY}px))`;
  const inverseMask = useMotionTemplate`radial-gradient(circle 28px at calc(50% + ${lensX}px) calc(50% + ${lensY}px), transparent 100%, black 100%)`;

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    lensX.set(x);
    lensY.set(y);
  };

  return (
    <div className="w-full">
      <div className="rounded-xl border border-border overflow-hidden" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
        {/* Interactive lens area */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          className="relative h-[140px] sm:h-[160px] overflow-hidden cursor-none select-none"
          style={{ backgroundColor: "hsl(var(--computer-bg))" }}
        >
          {/* Base layer — muted tags */}
          <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-2 py-4" style={{ WebkitMaskImage: inverseMask, maskImage: inverseMask }}>
            {TAG_ROWS.map((row, rowIndex) => (
              <motion.div
                key={rowIndex}
                className="flex gap-1.5 whitespace-nowrap"
                animate={{ x: rowIndex % 2 === 0 ? [0, -60, 0] : [0, 60, 0] }}
                transition={{ duration: 20 + rowIndex * 4, repeat: Infinity, ease: "linear" }}
              >
                {[...row, ...row, ...row].map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] text-muted-foreground/40"
                    style={{ backgroundColor: "hsl(var(--chip-bg) / 0.4)" }}
                  >
                    <item.icon size={11} />
                    {item.label}
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>

          {/* Reveal layer — bright tags under lens */}
          <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-2 py-4" style={{ clipPath }}>
            {TAG_ROWS.map((row, rowIndex) => (
              <motion.div
                key={rowIndex}
                className="flex gap-1.5 whitespace-nowrap"
                animate={{ x: rowIndex % 2 === 0 ? [0, -60, 0] : [0, 60, 0] }}
                transition={{ duration: 20 + rowIndex * 4, repeat: Infinity, ease: "linear" }}
              >
                {[...row, ...row, ...row].map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium text-foreground"
                    style={{ backgroundColor: "hsl(var(--chip-bg))" }}
                  >
                    <item.icon size={11} className="text-success" />
                    <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      {item.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>

          {/* Lens visual */}
          <motion.div
            className="pointer-events-none absolute"
            style={{
              left: "50%",
              top: "50%",
              x: lensX,
              y: lensY,
              width: CONFIG.lensSize,
              height: CONFIG.lensSize,
              marginLeft: -CONFIG.lensSize / 2,
              marginTop: -CONFIG.lensSize / 2,
            }}
          >
            <div className="relative w-full h-full">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: "2px solid hsl(var(--foreground) / 0.2)",
                  boxShadow: "0 0 20px 4px hsl(var(--foreground) / 0.06), inset 0 0 12px 2px hsl(var(--foreground) / 0.04)",
                }}
              />
              <MagnifyingLens size={CONFIG.lensSize} />
            </div>
          </motion.div>
        </div>

        {/* Info section */}
        <div className="px-4 py-3 border-t border-border">
          <p className="text-sm font-medium text-foreground">{CONFIG.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{CONFIG.description}</p>
        </div>
      </div>
    </div>
  );
};

export default BrowserStreamPreview;

const MagnifyingLens = ({ size = 80 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 92 92" fill="none" className="absolute inset-0 pointer-events-none">
      <circle cx="46" cy="46" r="29" stroke="hsl(var(--foreground))" strokeOpacity="0.15" strokeWidth="1.5" />
      <circle cx="46" cy="46" r="24" stroke="hsl(var(--foreground))" strokeOpacity="0.08" strokeWidth="1" />
    </svg>
  );
};
