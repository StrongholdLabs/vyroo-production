# Vyroo v2 — AI Assistant App

Conversational AI assistant with Manus-inspired premium UI, multi-provider LLM support, Supabase backend, Electron desktop app, and Vercel deployment. Sister project to Vyroo Command Center (e-commerce specific) — shares UI DNA but is a general-purpose AI assistant.

## Tech Stack
- **Framework**: Vite + React 18 + TypeScript (SPA)
- **Styling**: Tailwind CSS, shadcn/ui, motion (Framer Motion)
- **Icons**: lucide-react
- **Backend**: Supabase (Auth, Database, Edge Functions, Realtime)
- **AI**: Multi-provider streaming via Supabase Edge Functions (Claude, OpenAI, Gemini, Meta Llama)
- **State**: TanStack React Query (server state), React Context (auth), localStorage (UI prefs)
- **Desktop**: Electron with vite-plugin-electron
- **Deployment**: Vercel (vyroo.ai)

## Development
```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm test             # Run Vitest tests
npm run electron:dev # Electron dev mode
```

## Project Structure
```
src/
├── pages/           # Route pages (Index, Dashboard, Login, Signup, Connectors, Skills)
├── components/      # Feature-grouped components
│   ├── computer/    # Computer Panel (9 sub-components: SyntaxHighlighter, CodeMinimap, BrowserView, TerminalTab, ResearchTimeline, DiffView, SearchView, TaskProgress, MarkdownRenderer)
│   ├── ui/          # shadcn/ui primitives
│   └── *.tsx        # Feature components (ChatPanel, DashboardSidebar, TaskInput, etc.)
├── hooks/           # Custom hooks (useConversations, useAIChat, useModelSettings, useVoiceInput, etc.)
├── contexts/        # React contexts (AuthContext)
├── lib/             # Utilities (supabase client, ai-stream, follow-up-icons, time-groups)
├── types/           # TypeScript types (database.ts, domain.ts, connectors.ts)
supabase/
├── functions/       # Edge Functions (Deno runtime)
│   ├── chat/        # AI chat with multi-provider streaming
│   ├── auto-title/  # Conversation auto-titling
│   ├── api-keys/    # User API key CRUD
│   ├── connectors/  # Connector CRUD
│   ├── connectors-oauth/  # OAuth flow handler
│   ├── connectors-data/   # Data proxy for AI
│   └── _shared/     # Shared modules
│       ├── provider-registry.ts  # LLM auto-routing
│       ├── providers/            # Individual provider adapters (openai, anthropic, gemini, together)
│       └── connectors/           # Connector registry
├── migrations/      # SQL migrations
└── schema.sql       # Full DB schema reference
electron/
├── main.ts          # Electron main process
├── preload.ts       # Context bridge
└── tray.ts          # System tray
```

## Database (Supabase)
Tables: `profiles`, `user_api_keys`, `conversations`, `messages`, `steps`, `user_connectors`, `skills`
- All tables have Row-Level Security (RLS) — users only access own data
- `messages.metadata` JSONB stores rich content: sources, images, artifacts, follow-ups, tool calls
- `conversations` has auto_titled, message_count, last_message_preview for sidebar
- `user_connectors` stores encrypted OAuth/API tokens for integrations
- `profiles.enabled_skills` TEXT[] controls which AI tools are available

## Key Conventions
- API responses via Supabase Edge Functions (Deno runtime, NOT Node.js)
- SSE streaming format: `event: token\ndata: {"token":"..."}\n\n`
- Additional SSE events: `title` (auto-title), `followups` (suggestions), `done` (completion)
- TanStack Query for all data fetching (queries + mutations)
- BroadcastChannel API for cross-tab sync
- Icons: lucide-react (NOT Phosphor)
- CSS: shadcn/ui with hsl-based tokens (NOT hex-based like Command Center)
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- Electron detection: `typeof window !== "undefined" && !!(window as any).electronAPI`

## AI Architecture
- Multi-provider routing: model prefix auto-resolves provider (gpt-* → OpenAI, claude-* → Anthropic, gemini-* → Google, llama-* → Together AI)
- Fallback chains: if primary provider key missing, tries next in chain
- Skills system gates available AI tools — disabled skill = tools not available to AI
- Connectors inject external service data as AI context (GitHub, Google, Slack, Notion, Shopify)
- Follow-ups generated via lightweight LLM call after each response

## Auth
- Supabase Auth with Google OAuth + GitHub OAuth
- Site URL: https://vyroo.ai
- Redirect URLs: https://vyroo.ai/**, http://localhost:8080/**
- ProtectedRoute component wraps authenticated pages

## Infrastructure
- **Vercel**: Custom domain vyroo.ai, auto-deploy from GitHub
- **Supabase**: Project lwcklhkqibyvlwvfrort
- **GitHub OAuth**: Client ID Ov23liBR8ShIVziVa87v
- **Google OAuth**: Client ID 511837865947-c11rf672mjv96mkhd42aeshp1k9jd7vn.apps.googleusercontent.com
- **Daily Health Check**: Scheduled task runs at 9am — build, typecheck, tests

## Plugin Architecture
- `src/lib/plugins/` — Plugin system making Vyroo a pluggable "engine"
- `types.ts` — Core types: VyrooPlugin, PluginSkill, PluginConnector, PluginTool, PluginWidget
- `registry.ts` — Singleton PluginRegistry with subscribe/notify pattern for React reactivity
- `loader.ts` — Plugin loading, vertical activation, system prompt injection
- `verticals.ts` — 8 vertical definitions (general, ecommerce, healthcare, education, finance, marketing, devtools, custom)
- `init.ts` — Auto-registers built-in plugins at app startup
- `src/hooks/usePlugins.ts` — React hooks using useSyncExternalStore for reactive plugin state
- **E-commerce Plugin** (`src/lib/plugins/ecommerce/`):
  - 4 skills (Shopify Manager, Order Tracker, Inventory Optimizer, Storefront Builder)
  - 3 connectors (Shopify, Stripe, ShipStation)
  - 5 tools (products, orders, analytics, inventory, description generation)
  - Signal detection system (8 intent types with entity extraction)
  - System prompt additions and context-aware follow-ups

## Key Features
- Multi-provider AI chat with streaming (Claude, OpenAI, Gemini, Llama)
- Manus-inspired Computer Panel (code editor, browser sim, terminal, research timeline)
- Voice input (Web Speech API, 15s auto-stop)
- Context-aware follow-up suggestions with category icons
- Persistent conversations with auto-titling and cross-tab sync
- Time-grouped sidebar (Today/Yesterday/Last 7 Days/Older)
- Connectors system (Google, Slack, Notion, GitHub, Shopify) with OAuth + API key auth
- Skills system (Web Research, Code Assistant, Document Writer, Image Analysis, Data Analyst, Connected Services)
- Plugin architecture with e-commerce plugin (Shopify management, signal detection, daily briefs)
- Electron desktop app with macOS traffic light support
- Dark/light theme with next-themes

## Relationship to Command Center
- Command Center (Ecom_command_center) = vertical SaaS for Shopify (Next.js 14, Prisma, multi-tenant)
- Vyroo v2 (this project) = general-purpose AI assistant (Vite+React, Supabase, consumer)
- Shared: Manus UI patterns, design tokens concept, Computer Panel, follow-up system
- Different: auth (Supabase vs NextAuth), DB (Supabase vs Prisma), routing (React Router vs App Router)
- E-commerce features ported from Command Center into v2 as a plugin (signals, prompts, tools)
