# Vyroo v2

AI assistant platform built with React + TypeScript + Supabase.

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: Supabase (Auth, Database, Edge Functions, Realtime)
- **AI**: Multi-provider LLM routing (Claude, OpenAI, Gemini, Together AI)
- **Desktop**: Electron (macOS, Windows, Linux)
- **Deployment**: Vercel

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Features

- Multi-provider AI chat with streaming
- Conversation persistence with auto-titling
- Follow-up suggestions
- Voice input
- Skills system (toggleable AI capabilities)
- Connectors (Google, Slack, Notion, GitHub, Shopify)
- Cross-tab real-time sync
- Electron desktop app
