# Plan: Match Agentic Flow to Original Mock Data Design

## What the Mock Data Shows (THE DESIGN)

### Research Query (e.g., "Analyze top 5 DTC skincare brands")

**Chat Panel (left side):**
1. User message bubble
2. **ExpandableSteps** — 3-4 clean steps with human-readable labels:
   - "Understanding task" (complete) — with timestamped logs like "0:01 Received task..."
   - "Researching brands" (complete) — "0:15 Searching for The Ordinary..."
   - "Analyzing pricing strategies" (complete) — "1:02 Building comparative pricing table"
   - "Compile and deliver the final report" (complete) — "2:55 Report compiled"
   - Each step has: label, detail text, status, logs with elapsed timestamps
   - NO raw tool names like `web_search`, `browse_url`
   - NO URLs shown to user
   - NO emoji checkmarks (✅🔄)
3. **Assistant message** with short text: "Here is the comparative analysis..."
4. **Report Card** inline — with:
   - FileText icon + report title
   - Menu (Preview / Share / Download / Convert to Google Docs / Save to Drive)
   - Summary text
   - Inline table (headers + rows) — compact, clean
5. **Follow-up suggestions** — 2-3 suggested questions

**Computer Panel (right side):**
- Document tab: Full rendered markdown report (codeLines in mock)
- File tree in editor view
- Status bar with progress

### Website Build Query (e.g., "Design a landing page")

**Chat Panel:**
1. User message
2. Steps: "Analyzing brand requirements" → "Building page structure" → "Polishing design"
3. Assistant message: "I've designed and built a complete landing page..."
4. Project init card with "View" button

**Computer Panel:**
- Code tab: HTML/CSS code with syntax highlighting
- Preview tab: Live website preview
- File tree sidebar

## What Currently Happens (THE PROBLEM)

1. ❌ Raw tool call logs: `✅ web_search "hottest DTC..."  1.1s` — user doesn't care
2. ❌ ExpandableSteps show internal details: `Used web_search: {"query":"..."}`
3. ❌ No report card with table in chat — streaming report card has empty headers/rows
4. ❌ Sources chips shown (not in original design)
5. ❌ "Vyroo will continue working after your reply" shown during all agentic tasks
6. ❌ Document tab in Computer Panel mostly empty
7. ❌ Raw HTML anchors in headings (`<a name="..."></a>`)

## What Needs to Change

### 1. Remove Tool Call Logs from Chat
**File:** `src/components/ChatPanel.tsx` lines 421-437

Remove the entire `{toolCalls.length > 0 && ...}` block. Users should NEVER see `web_search`, `browse_url`, etc. This is internal implementation detail.

### 2. Fix ExpandableStep Data — Clean Labels, No Raw Tool Info
**File:** `supabase/functions/chat/index.ts` — step SSE events

Currently steps emit raw data like:
```
label: "Analyzing your request"
detail: "Used web_search: {\"query\":\"hottest DTC...\"}"
```

Should emit clean, human-readable data like the mock:
```
label: "Researching nutrition trends"
detail: "Browsing documentation and gathering market data"
logs: [
  { time: "0:15", text: "Searching for trending DTC nutrition products", type: "action" },
  { time: "0:22", text: "Found 15 products with high growth potential", type: "result" },
]
```

**How:** After the AI generates its plan (step labels), the step SSE events should:
- Use the plan label as the step label
- Generate clean detail text (no raw JSON)
- Log entries should describe actions in plain English with elapsed timestamps
- Type should be "action" for searches/browsing, "result" for completed findings

### 3. Fix Report Card — Extract Table Data from write_report
**File:** `supabase/functions/chat/index.ts` — report SSE event

Already fixed: table extraction from markdown. Verify it works with the new prompt.

### 4. Fix Streaming Report Card in Chat
**File:** `src/components/ChatPanel.tsx` lines 488-517

The streaming report card should match the mock's report card exactly:
- FileText icon + title
- Menu with Preview/Share/Download/Google Docs
- Summary text
- Inline table

Currently it renders but with empty `headers: []` and `rows: []`. With the backend fix, this should now populate correctly.

### 5. Remove Sources Chips (Not in Original Design)
**File:** `src/components/ChatPanel.tsx` lines 440-475

The sources chips with favicons were NOT in the original mock data design. Remove both:
- The "Sources" section (lines 440-460)
- The "Inline search results" fallback (lines 462-475)

### 6. Fix "Continue Working" Banner
**File:** `src/components/ChatPanel.tsx` lines 412-418

Currently shows for ALL agentic streaming. Should only show when appropriate — hide when steps are actively progressing (the steps already indicate progress).

### 7. Fix HTML Anchors in Responses
**File:** `supabase/functions/chat/index.ts` + `supabase/functions/_shared/agent-tools.ts`

Already fixed: Added "NEVER use HTML tags" to system prompts.

### 8. Make Computer Panel Document Tab Work
**File:** Already wired. With write_report producing clean markdown (no HTML anchors), the Document tab should render properly via ReactMarkdown.

## Test Scenarios

### Scenario 1: Research Query
**Input:** "Can you conduct a deep research on what the hottest DTC products are in 2026 in nutrition products like vitamins, fitness products etc"

**Expected Output:**
- Steps: "Understanding task" → "Researching nutrition trends" → "Analyzing market data" → "Compiling report"
- Each step has clean logs with elapsed timestamps
- NO tool call logs (web_search, browse_url)
- NO source chips
- Report card with title, summary, comparison table
- Computer Panel Document tab shows full rendered report
- Follow-up suggestions

### Scenario 2: Website Build
**Input:** "Build a high-converting landing page for my Shopify store. I want it to showcase my best products with a modern design."

**Expected Output:**
- Steps: "Analyzing requirements" → "Building page structure" → "Polishing design"
- Computer Panel shows Code tab with generated code
- Preview tab shows website preview
- Project init card in chat
- NO tool call logs

## Files to Change

1. `src/components/ChatPanel.tsx` — Remove tool logs, remove sources, fix continue banner
2. `supabase/functions/chat/index.ts` — Clean step labels/logs, fix report table extraction
3. `supabase/functions/_shared/agent-tools.ts` — Already fixed (no HTML in reports)

## Deployment

After changes:
- Deploy edge function via `npx supabase functions deploy chat`
- Push to GitHub main → CI → Vercel vyroo-v2 deploys automatically
