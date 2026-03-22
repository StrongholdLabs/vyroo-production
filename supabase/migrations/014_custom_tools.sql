-- Custom tools table: allows users to create their own tools
-- Tools can be HTTP-based (call external APIs) or prompt-based (use LLM with a template)

create table if not exists public.custom_tools (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tool_id text not null, -- e.g. "custom_weather_check"
  name text not null,
  description text not null,
  parameters jsonb not null default '{}',
  execution_type text not null check (execution_type in ('http', 'prompt')),
  http_config jsonb, -- {url, method, headers, body_template}
  prompt_template text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint unique_user_tool unique (user_id, tool_id)
);

-- RLS
alter table public.custom_tools enable row level security;

create policy "Users can view their own custom tools"
  on public.custom_tools for select
  using (auth.uid() = user_id);

create policy "Users can create custom tools"
  on public.custom_tools for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own custom tools"
  on public.custom_tools for update
  using (auth.uid() = user_id);

create policy "Users can delete their own custom tools"
  on public.custom_tools for delete
  using (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists idx_custom_tools_user_id on public.custom_tools(user_id);
create index if not exists idx_custom_tools_enabled on public.custom_tools(user_id, enabled) where enabled = true;
