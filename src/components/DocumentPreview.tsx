import { useState, useMemo, useEffect, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
  FileDown,
  List,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface DocumentPreviewProps {
  open: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  tableData?: { headers: string[]; rows: string[][] };
}

// Build pages from the document content
function buildPages(title: string, summary: string, tableData?: { headers: string[]; rows: string[][] }) {
  const pages = [
    {
      id: 1,
      label: "Overview",
      content: (
        <>
          <h1 className="text-3xl font-display text-foreground leading-tight mb-6" style={{ lineHeight: "1.15" }}>
            {title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">{summary}</p>
          <h2 className="text-xl font-semibold text-foreground mb-3 font-body">
            1. Overview of the Top 5 DTC Skincare Brands
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            The following brands have been selected based on their market influence, viral growth, and distinct pricing models:
          </p>
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
        </>
      ),
    },
    {
      id: 2,
      label: "Pricing",
      content: (
        <>
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
                  ["SPF", "$10.00 - $16.00", "$22.00", "$29.00", "$29.00", "$36.00"],
                  ["Eye Cream", "$8.00", "$26.00", "N/A", "N/A", "$60.00"],
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
        </>
      ),
    },
    {
      id: 3,
      label: "Marketing",
      content: (
        <>
          <h2 className="text-xl font-semibold text-foreground mb-3 font-body">
            3. Marketing & Growth Strategies
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Each brand leverages unique marketing approaches to capture their target demographics:
          </p>
          <div className="space-y-4 mb-8">
            {[
              { brand: "The Ordinary", strategy: "Science-first transparency with minimal packaging. Their ingredient-forward naming convention (e.g., 'Niacinamide 10% + Zinc 1%') positions them as the anti-marketing brand, which paradoxically became their strongest marketing asset." },
              { brand: "Glossier", strategy: "Community-driven content with the 'skin first, makeup second' philosophy. Heavy investment in UGC and referral programs. Their Into The Gloss blog created a content moat." },
              { brand: "Rhode Skin", strategy: "Celebrity-founder halo effect combined with TikTok-native content. The lip peptide treatment became the #1 viral beauty product in 2024-2025 through organic creator partnerships." },
              { brand: "Dieux Skin", strategy: "Sustainability-first messaging with refillable packaging. Transparent pricing breakdowns showing cost-of-goods vs retail became a viral differentiator." },
              { brand: "Drunk Elephant", strategy: "Clean-compatible positioning with the 'Suspicious 6' ingredient exclusion list. Premium pricing justified through clinical efficacy claims and dermatologist endorsements." },
            ].map((item) => (
              <div key={item.brand} className="rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-1.5">{item.brand}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.strategy}</p>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      id: 4,
      label: "Audience",
      content: (
        <>
          <h2 className="text-xl font-semibold text-foreground mb-3 font-body">
            4. Target Audience & Demographics
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Understanding the core customer profiles reveals strategic positioning differences:
          </p>
          <div className="rounded-lg border border-border overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
                  {["Brand", "Primary Age", "Income Range", "Key Value Driver"].map((h, i) => (
                    <th key={i} className="text-left py-3 px-4 font-semibold text-foreground border-b border-border text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs">
                {[
                  ["The Ordinary", "18–28", "$25K–$55K", "Affordability & Efficacy"],
                  ["Glossier", "22–34", "$40K–$80K", "Community & Aesthetic"],
                  ["Rhode Skin", "16–30", "$30K–$65K", "Trend & Celebrity"],
                  ["Dieux Skin", "25–38", "$50K–$90K", "Sustainability"],
                  ["Drunk Elephant", "28–45", "$65K–$120K", "Premium Clean Beauty"],
                ].map((row, ri) => (
                  <tr key={ri} className="border-b border-border/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className={`py-2.5 px-4 ${ci === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: 5,
      label: "Conclusion",
      content: (
        <>
          <h2 className="text-xl font-semibold text-foreground mb-3 font-body">
            5. Key Takeaways & Recommendations
          </h2>
          <div className="space-y-3 mb-8">
            {[
              "Price sensitivity varies dramatically by channel — DTC margins allow The Ordinary's $6 serums while Drunk Elephant commands $134 for comparable formulations.",
              "TikTok virality has replaced traditional PR as the primary launch vehicle, with Rhode Skin capturing 47% of skincare mentions in Q4 2025.",
              "Sustainability messaging is transitioning from differentiator to baseline expectation — brands without refillable or recyclable packaging face growing consumer resistance.",
              "The 'skinification' trend is expanding addressable markets as bodycare, haircare, and even fragrance adopt skincare-style ingredient storytelling.",
              "Subscription models remain under-penetrated in prestige skincare, representing a $2.1B opportunity in the DTC segment alone.",
            ].map((takeaway, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold bg-accent text-foreground mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{takeaway}</p>
              </div>
            ))}
          </div>
        </>
      ),
    },
  ];
  return pages;
}

function generateMarkdown(title: string, summary: string, tableData?: { headers: string[]; rows: string[][] }) {
  let md = `# ${title}\n\n${summary}\n\n`;
  md += `## 1. Overview of the Top 5 DTC Skincare Brands\n\nThe following brands have been selected based on their market influence, viral growth, and distinct pricing models:\n\n`;

  if (tableData) {
    md += `| ${tableData.headers.join(" | ")} |\n`;
    md += `| ${tableData.headers.map(() => "---").join(" | ")} |\n`;
    tableData.rows.forEach((row) => {
      md += `| ${row.join(" | ")} |\n`;
    });
    md += "\n";
  }

  md += `## 2. Comparative Pricing Table\n\n`;
  md += `| Product Type | The Ordinary | Glossier | Rhode Skin | Dieux Skin | Drunk Elephant |\n`;
  md += `| --- | --- | --- | --- | --- | --- |\n`;
  md += `| Cleanser | $9.00 - $12.00 | $20.00 - $24.00 | N/A | $32.00 | $34.00 |\n`;
  md += `| Moisturizer | $7.00 - $15.00 | $35.00 | $29.00 | $28.00 | $68.00 |\n`;
  md += `| Serum | $6.00 - $18.00 | $28.00 - $42.00 | N/A | $29.00 | $72.00 - $134.00 |\n\n`;

  md += `## 3. Marketing & Growth Strategies\n\n`;
  md += `Each brand leverages unique marketing approaches to capture their target demographics.\n\n`;

  md += `## 4. Target Audience & Demographics\n\n`;
  md += `## 5. Key Takeaways & Recommendations\n`;

  return md;
}

export function DocumentPreview({ open, onClose, title, summary, tableData }: DocumentPreviewProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = useMemo(() => buildPages(title, summary, tableData), [title, summary, tableData]);
  const totalPages = pages.length;

  if (!open) return null;

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown(title, summary, tableData);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Markdown file saved successfully." });
  };

  const handleDownloadHTML = () => {
    const md = generateMarkdown(title, summary, tableData);
    // Simple HTML wrapper
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6}table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f5f5f5;font-weight:600}h1{font-size:28px}h2{font-size:20px;margin-top:32px}</style></head><body>${md.replace(/^# (.*$)/gm, '<h1>$1</h1>').replace(/^## (.*$)/gm, '<h2>$1</h2>').replace(/\n/g, '<br>')}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "HTML file saved successfully." });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "hsl(var(--background))" }}>
      {/* Header bar */}
      <div className="flex items-center gap-3 px-5 h-14 flex-shrink-0 border-b border-border" style={{ backgroundColor: "hsl(var(--computer-header))" }}>
        <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "hsl(210 40% 35%)" }}>
          <FileText size={16} className="text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          <p className="text-xs text-muted-foreground">Page {currentPage + 1} of {totalPages}</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
            <Share2 size={16} />
          </button>

          {/* Download dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
                <Download size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleDownloadMarkdown}>
                <FileDown size={14} className="mr-2 text-muted-foreground" />
                Download as Markdown
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadHTML}>
                <FileText size={14} className="mr-2 text-muted-foreground" />
                Download as HTML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {[
                { icon: Copy, label: "Copy" },
                { icon: Star, label: "Add to favorite" },
                { icon: History, label: "History" },
                { icon: FileText, label: "Edit in Google Docs" },
              ].map((item) => (
                <DropdownMenuItem key={item.label}>
                  <item.icon size={14} className="mr-2 text-muted-foreground" />
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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

      {/* Page tabs */}
      <div className="flex items-center gap-1 px-5 py-2 border-b border-border overflow-x-auto" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
        {pages.map((page, i) => (
          <button
            key={page.id}
            onClick={() => setCurrentPage(i)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              currentPage === i
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          {pages[currentPage].content}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className="flex-shrink-0 border-t border-border px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "hsl(var(--surface-elevated))" }}>
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-40 disabled:pointer-events-none text-foreground"
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <div className="flex items-center gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                currentPage === i
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-40 disabled:pointer-events-none text-foreground"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
