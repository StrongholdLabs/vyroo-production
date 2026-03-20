import { useState } from "react";
import {
  X,
  Share2,
  Download,
  Maximize2,
  MoreHorizontal,
  Copy,
  Star,
  History,
  FileText,
} from "lucide-react";

interface DocumentPreviewProps {
  open: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  tableData?: { headers: string[]; rows: string[][] };
}

export function DocumentPreview({ open, onClose, title, summary, tableData }: DocumentPreviewProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Header bar */}
      <div className="flex items-center gap-3 px-5 h-14 flex-shrink-0 border-b border-border" style={{ backgroundColor: "hsl(var(--computer-header))" }}>
        <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "hsl(210 40% 35%)" }}>
          <FileText size={16} className="text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          <p className="text-xs text-muted-foreground">Last modified: 3 hours ago</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
            <Share2 size={16} />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
            <Download size={16} />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border py-1.5 z-20 shadow-lg"
                  style={{ backgroundColor: "hsl(var(--popover))" }}
                >
                  {[
                    { icon: Copy, label: "Copy" },
                    { icon: Star, label: "Add to favorite" },
                    { icon: History, label: "History" },
                    { icon: FileText, label: "Edit in Google Docs" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <item.icon size={16} className="text-muted-foreground" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
            <Maximize2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          {/* Title */}
          <h1 className="text-3xl font-display text-foreground leading-tight mb-6" style={{ lineHeight: "1.15" }}>
            {title}
          </h1>

          {/* Summary */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            {summary}
          </p>

          {/* Section heading */}
          <h2 className="text-xl font-semibold text-foreground mb-3 font-body">
            1. Overview of the Top 5 DTC Skincare Brands
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            The following brands have been selected based on their market influence, viral growth, and distinct pricing models:
          </p>

          {/* Table */}
          {tableData && (
            <div className="rounded-lg border border-border overflow-hidden mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
                    {tableData.headers.map((h, i) => (
                      <th key={i} className="text-left py-3 px-4 font-semibold text-foreground border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className={`py-3 px-4 ${ci === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Additional mock content sections */}
          <h2 className="text-xl font-semibold text-foreground mb-3 font-body">
            2. Comparative Pricing Table
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            The table below compares pricing of key product categories across the five brands (prices are approximate for 2025-2026).
          </p>

          <div className="rounded-lg border border-border overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
                  {["Product Type", "The Ordinary", "Glossier", "Rhode Skin", "Dieux Skin", "Drunk Elephant"].map((h, i) => (
                    <th key={i} className="text-left py-3 px-3 font-semibold text-foreground border-b border-border text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs">
                {[
                  ["Cleanser", "$9.00 - $12.00", "$20.00 - $24.00", "N/A (Limited SKU)", "$32.00", "$34.00"],
                  ["Moisturizer", "$7.00 - $15.00", "$35.00", "$29.00", "$28.00", "$68.00"],
                  ["Serum", "$6.00 - $18.00", "$28.00 - $42.00", "N/A", "$29.00", "$72.00 - $134.00"],
                ].map((row, ri) => (
                  <tr key={ri} className="border-b border-border/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className={`py-2.5 px-3 ${ci === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Page indicators */}
          <div className="flex items-center justify-center gap-2 py-6">
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                  page === 1
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex-shrink-0 border-t border-border px-4 py-3 flex items-center justify-center gap-2" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
        <span className="text-xs text-muted-foreground mr-2">💡</span>
        <span className="text-xs text-muted-foreground">Great pricing breakdown! Turn this into a searchable brand comparison tool?</span>
        <button className="px-3 py-1 text-xs font-medium text-foreground rounded-md border border-border hover:bg-accent transition-colors">
          Create website
        </button>
      </div>
    </div>
  );
}
