# Lovable Design Brief — Vyroo v2

> Dit document bevat alle design taken die Lovable moet uitvoeren. Elke taak heeft een gedetailleerde beschrijving, referenties, en technische context zodat Lovable precies weet wat er gebouwd moet worden.

---

## Overzicht

| # | Taak | Prioriteit | Geschatte effort |
|---|------|-----------|-----------------|
| 1 | Library Page (`/library`) | HIGH | 1-2 dagen |
| 2 | Search Page (`/search`) | HIGH | 1 dag |
| 3 | Onboarding Empty State | HIGH | 0.5 dag |
| 4 | Slide Theme Selector | MEDIUM | 1 dag |
| 5 | Mobile Responsive Audit | MEDIUM | 1-2 dagen |
| 6 | Mobile Floating Action Button | MEDIUM | 0.5 dag |
| 7 | Export Modal (PPTX/PDF/Share) | MEDIUM | 0.5 dag |
| 8 | File Upload UI in Composer | MEDIUM | 1 dag |
| 9 | Conversation Type Badges | LOW | 0.5 dag |
| 10 | Voice Transcription Preview | LOW | 0.5 dag |
| **11** | **Website/Landing Page Builder Flow** | **HIGH** | **2-3 dagen** |
| **12** | **Landing Page Theme Selector** | **HIGH** | **1 dag** |

---

## 1. Library Page (`/library`)

### Wat is het?
Een pagina waar de gebruiker al zijn gegenereerde bestanden kan terugvinden: rapporten, presentaties, code, en data. Dit is vergelijkbaar met de "Library" in Manus — een centrale plek voor alle output.

### Waar het zit
- Route: `/library`
- Sidebar nav item "Library" (met BookOpen icoon) staat al in `DashboardSidebar.tsx` maar linkt naar niks.
- Data komt uit de `workspace_files` tabel in Supabase (al gebouwd).

### Wat Lovable moet designen

**Layout:**
- Grid view (standaard) en list view toggle
- Zoekbalk bovenaan
- Filters: Type (Document, Presentation, Code, Data) + Sortering (Recent, Naam, Grootte)

**File Cards (grid view):**
- Icoon op basis van type:
  - Document → FileText icoon + blauw accent
  - Presentation → Presentation icoon + oranje accent
  - Code → Code icoon + groen accent
  - Data → Table icoon + paars accent
- Bestandsnaam (truncated, max 2 regels)
- Datum "2 hours ago" / "March 24, 2026"
- Grootte "1.2 KB"
- Preview snippet (eerste 2-3 regels van content)
- Hover: licht opgelichte border + shadow

**File Rows (list view):**
- Icoon + naam + type badge + datum + grootte
- Klik opent het bestand in een modal (DocumentPreview component bestaat al)

**Empty State:**
- Illustratie of icoon
- "No files yet — your generated reports and presentations will appear here"
- CTA button: "Start a new task"

### Technische context
```typescript
// workspace_files tabel structuur:
{
  id: UUID,
  name: string,           // "Top 5 DTC Protein Powder Brands"
  type: string,           // "document" | "presentation" | "code" | "data"
  format: string,         // "markdown" | "json" | "python" | "csv"
  content: string,        // Volledige inhoud
  size_bytes: number,
  created_at: timestamp,
  updated_at: timestamp,
  conversation_id: UUID,  // Link naar originele conversatie
  tags: string[],
  is_pinned: boolean,
}
```

### Referentie
Manus heeft een "Library" sidebar met recent files. Notion heeft een vergelijkbare file browser. Houd het minimaal en clean — past bij de Vyroo aesthetic.

---

## 2. Search Page (`/search`)

### Wat is het?
Een zoekpagina waarmee de gebruiker door al zijn conversaties en bestanden kan zoeken. De backend heeft al pgvector semantic search gebouwd — we hebben alleen de UI nodig.

### Waar het zit
- Route: `/search`
- Sidebar nav item "Search" (met Search icoon) staat al in `DashboardSidebar.tsx`.
- Backend: `search_similar_messages()` RPC in Supabase (pgvector embeddings).

### Wat Lovable moet designen

**Layout:**
- Grote zoekbalk gecentreerd bovenaan (Perplexity-stijl)
- Placeholder: "Search your conversations and files..."
- Realtime results als je typt (debounced, 300ms)

**Resultaten:**
- Tabs: "Conversations" | "Files" | "All"
- Per resultaat:
  - Conversatie titel of bestandsnaam
  - Snippet met highlighted zoekterm (bold)
  - Datum + type badge
  - Klik navigeert naar de conversatie of opent het bestand
- Relevance score als subtiele indicator (balk of percentage)

**Empty State:**
- "Search across all your conversations and generated files"
- Recent searches (lokaal opgeslagen)

**No Results:**
- "No results found for 'query'"
- Suggesties: "Try a different search term" of "Start a new task about this"

### Technische context
```typescript
// search_similar_messages RPC:
const { data } = await supabase.rpc('search_similar_messages', {
  query_embedding: vectorFromOpenAI,
  match_threshold: 0.75,
  match_count: 10,
  exclude_conversation_id: null, // null = search all
});
// Returns: { id, content, conversation_id, similarity }
```

---

## 3. Onboarding Empty State (Dashboard)

### Wat is het?
Wanneer een nieuwe gebruiker inlogt en nog geen conversaties heeft, zien ze een lege dashboard. Nu is dat alleen een heading "What can I help you with?" + input. Dat is te kaal — nieuwe users weten niet wat ze kunnen doen.

### Waar het zit
- `src/pages/Dashboard.tsx` — het lege state gedeelte (geen `activeConversation`)
- Wordt getoond wanneer de sidebar leeg is

### Wat Lovable moet designen

**Hero sectie (al aanwezig, verbeteren):**
- Heading: "What can I help you with?" ✅ (behouden)
- TaskInput ✅ (behouden)
- Action chips ✅ (behouden, maar verbeteren)

**Toevoegen — Feature Cards (3-4 kaarten):**
Onder de input, 3-4 cards die laten zien wat Vyroo kan:

1. **Research & Analysis**
   - Icoon: Search
   - "Deep research with real-time data. Get cited reports in seconds."
   - Voorbeeld: "Top 5 DTC brands in 2026"

2. **Presentations**
   - Icoon: Presentation
   - "Create data-driven slide decks. Download as PPTX."
   - Voorbeeld: "Create a pitch deck about AI trends"

3. **Code & Data**
   - Icoon: Code
   - "Generate, review, and execute code. Analyze CSV data."
   - Voorbeeld: "Build a React component for auth"

4. **Writing & Reports**
   - Icoon: FileText
   - "Professional reports with tables, charts, and sources."
   - Voorbeeld: "Write a market analysis report"

**Design:**
- Cards in een 2x2 grid (desktop) of 1-kolom (mobiel)
- Lichte achtergrond, subtle border
- Klik op voorbeeld-tekst → vult de composer in en stuurt
- Animate in met stagger (0.1s delay per card)

---

## 4. Slide Theme Selector

### Wat is het?
Wanneer de gebruiker een presentatie genereert, moet er een optie zijn om het kleurthema te kiezen. Nu gebruiken alle slides dezelfde donkere thema's. De gebruiker moet kunnen kiezen.

### Waar het zit
- `src/components/computer/SlideViewerPanel.tsx` — de slide viewer in het Computer Panel
- `src/lib/export-pptx.ts` — de PPTX export (heeft al 3 thema's: dark, light, corporate)

### Wat Lovable moet designen

**Theme Picker (in SlideViewerPanel header):**
- Dropdown of horizontal strip met 5-6 thema previews
- Elke preview: klein vierkantje (24x24) met de kleuren van het thema
- Thema's:
  1. **Dark** — Donkerblauw + lichtblauw accent (standaard)
  2. **Light** — Wit + blauw accent
  3. **Corporate** — Donker teal + mint accent
  4. **Warm** — Donkerpaars + goud accent
  5. **Modern** — Navy + koraal accent
  6. **Nature** — Donker + emerald accent

**Interactie:**
- Klik op thema → alle slides updaten direct (geen pagina refresh)
- Geselecteerd thema heeft een checkmark of highlight border
- Thema keuze wordt onthouden per presentatie

**Technische context:**
```typescript
// Bestaande kleurpaletten in agent-tools.ts:
const colorPalettes = [
  { bgColor: "#0f172a", accentColor: "#38bdf8" },   // Dark navy + sky blue
  { bgColor: "#1a1a2e", accentColor: "#4fc3f7" },   // Deep blue + light blue
  { bgColor: "#0d1b2a", accentColor: "#48c9b0" },   // Dark teal + mint
  { bgColor: "#1b1b2f", accentColor: "#e2b04a" },   // Dark purple + gold
  { bgColor: "#162447", accentColor: "#e43f5a" },   // Navy + coral
  // ...
];
```

---

## 5. Mobile Responsive Audit

### Wat is het?
De app werkt op desktop maar is niet geoptimaliseerd voor mobiel. Manus werkt perfect op mobiel — wij moeten dat ook doen.

### Wat Lovable moet checken en fixen

**Sidebar (mobiel):**
- Nu: Sheet overlay die opent van links ✅
- Check: Is de breedte goed? Kan je swipen om te sluiten?
- Fix: Voeg een swipe-to-close gesture toe als dat mist

**Chat Panel (mobiel):**
- Composer moet fixed aan de onderkant staan (niet scrollen met content)
- Messages moeten volle breedte gebruiken (geen grote marges)
- Report cards en slides cards moeten niet overflown
- Follow-ups moeten horizontaal scrollbaar zijn (niet wrappen)

**Computer Panel (mobiel):**
- Nu: Bottom drawer (Sheet) ✅
- Check: Is het responsive? Kan je het fullscreen maken?
- Fix: Voeg een "fullscreen" knop toe aan de Computer Panel op mobiel

**Landing Page (mobiel):**
- Heading moet kleiner zijn op small screens
- Action chips moeten wrappen of horizontaal scrollen
- Feature cards (als toegevoegd) moeten 1-kolom zijn

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 6. Mobile Floating Action Button

### Wat is het?
Op mobiel is de "New task" knop alleen bereikbaar via de sidebar. Er moet een floating action button (FAB) zijn die altijd zichtbaar is.

### Wat Lovable moet designen

**FAB Design:**
- Positie: rechtsonder, 16px van de rand
- Grootte: 56x56px cirkel
- Kleur: Primary (blauw/accent)
- Icoon: Plus of Sparkles
- Shadow: medium elevation
- Klik: navigeert naar `/dashboard` (nieuw gesprek)

**Gedrag:**
- Alleen zichtbaar op mobiel (< 768px)
- Verbergt zichzelf als de composer in beeld is (op de lege dashboard)
- Animate in met scale (0 → 1) als pagina laadt

---

## 7. Export Modal

### Wat is het?
Wanneer de gebruiker een rapport of presentatie wil exporteren, moet er een nette modal verschijnen met alle opties. Nu zit de download functie in een klein dropdown menu.

### Wat Lovable moet designen

**Modal Trigger:**
- Download knop op de report card in de chat
- Download knop in de SlideViewerPanel header
- Download knop in de DocumentPreview modal

**Modal Content:**

**Voor Documenten:**
- Download als Markdown (.md)
- Download als PDF (.pdf) — *toekomstig*
- Kopieer naar klembord
- Deel link (als conversation shared is)

**Voor Presentaties:**
- Download als PPTX (.pptx) ✅ (al gebouwd)
- Download als Markdown (.md) ✅ (al gebouwd)
- Download als PDF (.pdf) — *toekomstig*

**Design:**
- Clean modal met iconen per export optie
- Bestandsnaam preview (bewerkbaar)
- Grootte indicatie
- "Exporting..." loading state met progress bar

---

## 8. File Upload UI in Composer

### Wat is het?
De Plus (+) knop in de composer doet nu niks. Die moet een file upload triggeren zodat gebruikers documenten (PDF, CSV, afbeeldingen) kunnen uploaden voor analyse.

### Wat Lovable moet designen

**Upload Flow:**
1. Klik op Plus (+) → dropdown met opties:
   - "Upload file" (PDF, CSV, TXT, images)
   - "Paste from clipboard"
   - "Import from URL"
2. Na selectie: file preview verschijnt BOVEN de composer
3. Preview toont: bestandsnaam, grootte, type icoon, X (verwijder) knop
4. User typt vraag over het bestand → stuurt samen

**File Preview (boven composer):**
```
┌──────────────────────────────────────────┐
│ 📄 sales-data-2026.csv  (12.4 KB)   ✕  │
│ "Analyze this data and find trends"      │
│ [Send button]                            │
└──────────────────────────────────────────┘
```

**Ondersteunde formats:**
- Documents: PDF, TXT, DOCX
- Data: CSV, TSV, JSON, XLSX
- Images: PNG, JPG, GIF (voor vision model later)

**Drag & Drop:**
- Hele composer area is een drop zone
- Bij drag-over: overlay met "Drop file here" tekst + dashed border

**Technische context:**
- Backend `workspace_files` tabel kan files opslaan
- File content wordt als tekst geëxtraheerd en meegegeven in het chat bericht
- Max file size: 10MB
- PDF text extraction: server-side (toekomstig)

---

## 9. Conversation Type Badges

### Wat is het?
In de sidebar tonen conversaties nu alleen een tekst titel. Er missen visuele indicatoren voor het type conversatie (research, code, presentatie, etc.).

### Wat Lovable moet designen

**Badge per type:**
- 🔍 Research → Blauw bolletje of Search icoon
- 💻 Code → Groen bolletje of Code icoon
- 📊 Presentation → Oranje bolletje of Presentation icoon
- 📝 Analysis → Paars bolletje of BarChart icoon
- 💬 Chat → Grijs bolletje of MessageSquare icoon

**Waar:**
- Links van de conversatie titel in de sidebar
- Klein (12-14px) en subtiel
- Kleur matcht het type

**Technische context:**
- Conversatie type staat in `conversations.type` kolom
- Huidige waarden: "intelligence" (default), "website", "research"
- Moet uitgebreid worden met: "code", "presentation", "analysis"

---

## 10. Voice Transcription Preview

### Wat is het?
Als de gebruiker voice input gebruikt, wordt de transcriptie direct verstuurd. Er is geen preview — de user kan niet zien wat er getranscribeerd is voordat het verstuurd wordt.

### Wat Lovable moet designen

**Flow:**
1. User klikt mic button → opname begint
2. Mic button wordt rood/pulsing (al gebouwd ✅)
3. **NIEUW:** Transcriptie verschijnt live in de composer textarea
4. **NIEUW:** Na opname stopt: tekst staat in composer, user kan bewerken
5. User drukt Enter of Send om te versturen

**Visuele feedback:**
- Tijdens opname: pulserende rode ring om de mic button
- Transcriptie tekst verschijnt in real-time in het invoerveld
- Na stop: tekst is bewerkbaar, cursor staat aan het einde
- Cancel knop (X) naast de mic om opname te annuleren

---

## Design Principes (voor alle taken)

### Kleurgebruik
- Gebruik de bestaande CSS variabelen (`--background`, `--foreground`, `--accent`, `--border`, etc.)
- Dark mode is standaard — alle designs moeten in dark mode werken
- Accenten: blauw (primary), oranje (presentations), groen (code), paars (analysis)

### Typografie
- Font: System fonts (Inter/SF Pro als beschikbaar)
- Headings: font-semibold
- Body: text-sm (14px)
- Captions: text-xs (12px)
- Muted text: text-muted-foreground

### Spacing
- Consistent padding: 4px, 8px, 12px, 16px, 24px, 32px
- Card padding: px-4 py-3
- Gap between elements: gap-2 (8px) of gap-3 (12px)

### Animaties
- Entrance: fade-in + slide-up (200ms ease-out)
- Hover: scale(1.01) + shadow transition (150ms)
- Transitions: 150ms voor colors, 200ms voor transforms

### Componentbibliotheek
- shadcn/ui componenten waar mogelijk (Button, Dialog, Sheet, Tabs, Input)
- Tailwind CSS classes
- Lucide icons (al geïmporteerd in het project)

---

## Belangrijk: Protected Files

**NOOIT deze bestanden overschrijven:**
- `src/pages/Dashboard.tsx`
- `src/hooks/useAIChat.ts`
- `src/components/ChatPanel.tsx`
- `src/lib/ai-stream.ts`
- `src/lib/supabase.ts`
- `src/contexts/AuthContext.tsx`
- `src/App.tsx`
- `package.json`
- `vite.config.ts`
- `supabase/functions/**`

Lovable mag ALLEEN nieuwe componenten maken en bestaande UI componenten aanpassen die puur visueel zijn (geen business logic).

---

## 11. Website / Landing Page Builder Flow

### Wat is het?
Wanneer een gebruiker vraagt om een website of landing page te bouwen, moet Vyroo een Manus-achtig bouwproces tonen. Dit is een van de meest indrukwekkende features van Manus en een key differentiator.

### Hoe Manus dit doet (referentie)
Ik heb Manus live getest met "build me a landing page for my ecom health store". Dit is wat er gebeurt:

**Stap 1 — Clarification (optioneel):**
Manus vraagt eerst om details:
1. Wat is de naam van je store en welke producten verkoop je?
2. Heb je een voorkeur voor stijl of kleurschema? (clean, clinical, warm, organic)
3. Welke secties zijn belangrijk? (featured products, reviews, about us)
+ "Continue" button om met defaults te starten

**Stap 2 — Design Direction:**
Manus kiest een design thema (bijv. "Wellness Minimalism") en genereert een `ideas.md` document met:
- **Design Movement**: "Contemporary Wellness Minimalism inspired by Scandinavian tech aesthetics"
- **Core Principles**: Clean layouts, clarity, organic colors, purposeful typography
- **Color Philosophy**: Primary (sage green #6B9E7F), Secondary (warm cream #F5F3F0), Accent (terracotta #D97757)
- **Layout Paradigm**: Asymmetric grid, 80-120px gaps, offset image placements
- **Signature Elements**: Botanical illustrations, soft corners (12-16px), dot patterns
- **Interaction Philosophy**: 300ms transitions, hover elevations, micro-interactions
- **Animation**: Fade-in on scroll, gentle scale-up on hover

**Stap 3 — Image Generation:**
Manus genereert 5 custom AI images:
- `hero-wellness.png` — Hero banner image
- `product-showcase.png` — Product grid image
- `benefits-illustration.png` — Benefits section
- `testimonials-background.png` — Testimonial section
- `cta-background.png` — Call-to-action background

**Stap 4 — Component Building:**
Manus bouwt component voor component met live preview:
- Fonts laden (Google Fonts)
- CSS color tokens updaten
- Hero section bouwen
- Product grid bouwen
- Benefits section
- Testimonials
- CTA section
- Footer

**Stap 5 — Live Preview:**
Rechts naast de chat toont een live preview van de website die real-time update terwijl componenten gebouwd worden.

**Stap 6 — Publish:**
"Publish" knop rechtsboven om de site live te zetten.

### Wat Lovable moet designen voor Vyroo

**A. Website Builder Chat Flow UI:**

Wanneer taskMode = "website", moet de chat een speciaal bouwproces tonen:

```
┌─────────────────────────────────────────────┐
│ 🌐  Health Store Landing Page               │
│     ○ Initializing...                       │
│     Status: Setting up project scaffold     │
└─────────────────────────────────────────────┘
```

Dit is een **ProjectCard** component dat verschijnt in de chat wanneer een website wordt gebouwd. Het toont:
- Globe icoon + project naam
- Status indicator (spinner/check)
- Huidige actie als subtitle

**B. Build Steps in Chat (onder de ProjectCard):**

```
✅ Initialize project scaffold
  ├─ 📸 Generate hero images (5 images)
  ├─ 🎨 Set up color tokens and typography
  └─ 📐 Configure layout system

⏳ Build landing page sections
  ├─ 🏠 Hero section with CTA
  ├─ 🛍️ Featured products grid
  ├─ 💚 Benefits & features
  ├─ ⭐ Customer testimonials
  └─ 📞 Call-to-action footer

○ Preview and polish
○ Publish
```

Elke stap is een **ExpandableStep** (al gebouwd) maar met sub-stappen die tools tonen (image generation, code editing, etc.).

**C. Live Preview Panel (Computer Panel rechts):**

Het Computer Panel moet een **Website Preview tab** tonen met:
- Een iframe of HTML render van de gegenereerde landing page
- Zoom controls (8%, 50%, 100%)
- Fullscreen toggle
- "Publish" button
- Mobile/Desktop toggle

**D. Completed State in Chat:**

Na afronding verschijnt een card:

```
┌─────────────────────────────────────────────┐
│ 🌐  Health Store Landing Page               │
│     ✅ Published · Just now                 │
│                                             │
│  ┌─────────────┐                            │
│  │  [preview]   │  Visit: healthstore.vyroo │
│  │  thumbnail   │  Edit · Download · Share  │
│  └─────────────┘                            │
└─────────────────────────────────────────────┘
```

### Technische context
- Het bestaande `ProjectInitCard` component (`src/components/ProjectInitCard.tsx`) is een startpunt
- Computer Panel heeft al een Browser tab die websites kan tonen
- De backend `generate_code` tool kan HTML/React code genereren
- Website type conversaties hebben `conversation.type === "website"`

---

## 12. Landing Page Theme Selector

### Wat is het?
Net als de Slide Theme Selector (#4), maar dan voor landing pages. Wanneer de AI een landing page bouwt, moet de gebruiker een design thema kunnen kiezen VOORDAT het bouwproces begint. Dit is anders dan slides — landing pages hebben een completer thema nodig (kleuren, fonts, layout stijl, mood).

### Wanneer het verschijnt
Direct na de clarification stap (of als de user "Continue" klikt). De AI presenteert 4-6 thema opties als visuele cards.

### Wat Lovable moet designen

**Theme Selection Cards (horizontaal scrollbaar in de chat):**

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│              │ │              │ │              │ │              │
│  [preview]   │ │  [preview]   │ │  [preview]   │ │  [preview]   │
│              │ │              │ │              │ │              │
│──────────────│ │──────────────│ │──────────────│ │──────────────│
│ Wellness     │ │ Bold &       │ │ Clinical     │ │ Luxury       │
│ Minimalism   │ │ Modern       │ │ Trust        │ │ Premium      │
│              │ │              │ │              │ │              │
│ 🟢🟤⚪      │ │ 🔵⚫🟡      │ │ ⚪🔵🟢      │ │ ⚫🟡⚪      │
│ sage+cream   │ │ navy+gold    │ │ white+blue   │ │ black+gold   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Per thema card (180x240px):**
- **Preview afbeelding** (bovenste 60%): Een mini mockup van hoe de landing page eruitziet met dit thema. Dit kan een statische SVG/afbeelding zijn of een mini HTML render.
- **Thema naam** (bold, 14px)
- **Kleurbolletjes** (3-4 cirkels, 12px, de hoofdkleuren van het thema)
- **Beschrijving** (1 regel, 11px, muted)
- **Hover**: lichte border highlight + scale(1.02)
- **Selected**: blauw border + checkmark badge

**De 6 thema's:**

1. **Wellness Minimalism**
   - Kleuren: Sage green (#6B9E7F), Warm cream (#F5F3F0), Terracotta (#D97757)
   - Font: Playfair Display (headings) + Inter (body)
   - Stijl: Veel whitespace, botanische accenten, zachte hoeken
   - Geschikt voor: Health, wellness, organic producten

2. **Bold & Modern**
   - Kleuren: Deep navy (#0A1628), Electric blue (#3B82F6), Amber (#F59E0B)
   - Font: Space Grotesk (headings) + DM Sans (body)
   - Stijl: Strakke lijnen, grote typografie, high contrast
   - Geschikt voor: Tech, fitness, supplements

3. **Clinical Trust**
   - Kleuren: White (#FFFFFF), Medical blue (#2563EB), Fresh green (#10B981)
   - Font: Plus Jakarta Sans (headings + body)
   - Stijl: Clean, wetenschappelijk, veel data/stats, trust badges
   - Geschikt voor: Medische producten, vitamines, farmaceutisch

4. **Luxury Premium**
   - Kleuren: Rich black (#0D0D0D), Gold (#D4AF37), Ivory (#FFFFF0)
   - Font: Cormorant Garamond (headings) + Lato (body)
   - Stijl: Donker, elegant, serif fonts, goud accenten
   - Geschikt voor: Premium supplements, skincare, high-end wellness

5. **Playful & Fresh**
   - Kleuren: Coral (#FF6B6B), Mint (#4ECDC4), Warm yellow (#FFE66D)
   - Font: Quicksand (headings) + Nunito (body)
   - Stijl: Rounded corners, vrolijke kleuren, illustraties
   - Geschikt voor: Voedingssupplementen, kids vitamins, snacks

6. **Earth & Natural**
   - Kleuren: Deep brown (#3E2723), Forest green (#2E7D32), Sand (#D7CCC8)
   - Font: Merriweather (headings) + Source Sans Pro (body)
   - Stijl: Aardse tinten, textuur achtergronden, natuur fotografie
   - Geschikt voor: Organic, eco-friendly, natuurlijke producten

### Interactie Flow
1. User vraagt: "build me a landing page for my health store"
2. AI: "I'll build a landing page for your health store. Choose a design theme:"
3. **Theme cards verschijnen** (horizontaal scrollbaar)
4. User klikt op een thema
5. AI: "Great choice! Building with Wellness Minimalism theme..."
6. Bouwproces begint (zie item #11)

### Na selectie — Theme blijft zichtbaar
Het geselecteerde thema moet als een klein badge zichtbaar zijn in de chat EN in het Computer Panel:
```
🎨 Wellness Minimalism  [Change theme]
```
De "Change theme" link heropent de theme selector zodat de user kan switchen (triggert herbouw).

### Technische context
- Theme data wordt opgeslagen in `conversation.metadata` als `{ selectedTheme: "wellness-minimalism" }`
- De `generate_code` tool ontvangt het thema als parameter
- Theme previews kunnen statische SVGs zijn of kleine CSS-only mockups
- Kleurwaarden worden doorgegeven als CSS custom properties
