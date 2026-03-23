export interface SearchResult {
  title: string;
  url: string;
  date: string;
  snippet: string;
  faviconColor: string;
}

interface SearchViewProps {
  query: string;
  results: SearchResult[];
}

export function SearchView({ query, results }: SearchViewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "hsl(var(--computer-bg))" }}>
      {/* Search bar */}
      <div className="px-6 py-4 flex-shrink-0">
        <div
          className="px-4 py-2.5 rounded-xl text-sm text-muted-foreground text-center font-medium"
          style={{ backgroundColor: "hsl(var(--code-bg))" }}
        >
          Search
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
        {results.map((result, i) => (
          <div
            key={i}
            className="px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: result.faviconColor }}
              >
                {result.title.charAt(0)}
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <h3 className="text-sm font-medium text-foreground leading-snug group-hover:underline">
                  {result.title}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {result.date} — {result.snippet}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
