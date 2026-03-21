-- Agent Templates: catalog of available agent types
create table if not exists agent_templates (
  id text primary key,
  name text not null,
  description text not null,
  icon_name text not null default 'bot',
  category text not null default 'custom' check (category in ('research', 'coding', 'data', 'browsing', 'content', 'custom')),
  author text not null default 'community',
  is_featured boolean not null default false,
  is_community boolean not null default false,
  default_model text not null default 'claude-sonnet-4-20250514',
  default_tools text[] not null default '{}',
  system_prompt text not null default '',
  capabilities text[] not null default '{}',
  config_schema jsonb not null default '{}',
  rating numeric(2,1) not null default 0,
  install_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table agent_templates enable row level security;

create policy "Anyone can read agent templates"
  on agent_templates for select
  using (true);

-- Agent Runs: each execution of an agent
create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  agent_template_id text not null references agent_templates(id),
  title text not null default 'Untitled Run',
  status text not null default 'planning' check (status in ('planning', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  goal text not null,
  plan jsonb not null default '[]',
  result jsonb not null default '{}',
  config jsonb not null default '{}',
  model text not null default 'claude-sonnet-4-20250514',
  tokens_used integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table agent_runs enable row level security;

create policy "Users can read their own agent runs"
  on agent_runs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own agent runs"
  on agent_runs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own agent runs"
  on agent_runs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own agent runs"
  on agent_runs for delete
  using (auth.uid() = user_id);

-- Agent Steps: individual steps within a run
create table if not exists agent_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references agent_runs(id) on delete cascade,
  step_number integer not null,
  type text not null default 'tool_call' check (type in ('plan', 'tool_call', 'llm_call', 'browse', 'code', 'write', 'search', 'think', 'delegate')),
  label text not null,
  detail text,
  status text not null default 'pending' check (status in ('pending', 'active', 'complete', 'failed', 'skipped')),
  icon_name text not null default 'circle',
  input jsonb not null default '{}',
  output jsonb not null default '{}',
  tool_name text,
  delegated_to text,
  duration_ms integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table agent_steps enable row level security;

create policy "Users can read steps for their own runs"
  on agent_steps for select
  using (
    exists (
      select 1 from agent_runs
      where agent_runs.id = agent_steps.run_id
        and agent_runs.user_id = auth.uid()
    )
  );

create policy "Users can insert steps for their own runs"
  on agent_steps for insert
  with check (
    exists (
      select 1 from agent_runs
      where agent_runs.id = agent_steps.run_id
        and agent_runs.user_id = auth.uid()
    )
  );

create policy "Users can update steps for their own runs"
  on agent_steps for update
  using (
    exists (
      select 1 from agent_runs
      where agent_runs.id = agent_steps.run_id
        and agent_runs.user_id = auth.uid()
    )
  );

-- User Agents: user-specific agent configurations and favorites
create table if not exists user_agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_template_id text not null references agent_templates(id),
  custom_name text,
  custom_instructions text,
  model_override text,
  tools_override text[],
  is_favorited boolean not null default false,
  run_count integer not null default 0,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, agent_template_id)
);

alter table user_agents enable row level security;

create policy "Users can read their own user agents"
  on user_agents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own user agents"
  on user_agents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own user agents"
  on user_agents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own user agents"
  on user_agents for delete
  using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_agent_runs_user_id on agent_runs(user_id);
create index if not exists idx_agent_steps_run_id on agent_steps(run_id);
create index if not exists idx_user_agents_user_id on user_agents(user_id);

-- Seed built-in agent templates
insert into agent_templates (id, name, description, icon_name, category, author, is_featured, is_community, default_model, default_tools, system_prompt, capabilities, rating, install_count)
values
  (
    'research-agent',
    'Research Agent',
    'Deep web research with source citation',
    'search',
    'research',
    'vyroo',
    true,
    false,
    'claude-sonnet-4-20250514',
    array['web_search', 'browse_url', 'extract_content'],
    'You are a thorough research agent. Your goal is to find accurate, well-sourced information on any topic. Always cite your sources, cross-reference claims across multiple sources, and present findings in a clear structured format. Prioritize recency and reliability of sources.',
    array['web_search', 'browse_url', 'extract_content', 'summarize'],
    4.8,
    8500
  ),
  (
    'coding-agent',
    'Coding Agent',
    'Code generation debugging and refactoring',
    'code',
    'coding',
    'vyroo',
    true,
    false,
    'claude-sonnet-4-20250514',
    array['generate_code', 'run_tests', 'review_code'],
    'You are an expert coding agent. You write clean, well-documented, production-ready code. You can generate new code, debug existing code, refactor for better performance, and write comprehensive tests. Always follow best practices and explain your reasoning.',
    array['generate_code', 'review_code', 'debug_code', 'run_tests'],
    4.8,
    6200
  ),
  (
    'data-analyst-agent',
    'Data Analysis Agent',
    'CSV/data analysis visualization insights',
    'bar-chart-2',
    'data',
    'vyroo',
    true,
    false,
    'claude-sonnet-4-20250514',
    array['analyze_csv', 'create_chart', 'statistics'],
    'You are a data analysis agent. You can analyze datasets, compute statistics, identify trends and outliers, create visualizations, and generate actionable insights. Present your findings clearly with supporting data and visual charts when appropriate.',
    array['analyze_csv', 'create_chart', 'statistics', 'generate_report'],
    4.8,
    3400
  ),
  (
    'web-browser-agent',
    'Web Browsing Agent',
    'Autonomous web navigation and data extraction',
    'globe',
    'browsing',
    'vyroo',
    true,
    false,
    'claude-sonnet-4-20250514',
    array['browse_url', 'extract_content', 'fill_form', 'screenshot'],
    'You are an autonomous web browsing agent. You can navigate websites, extract structured data, fill out forms, take screenshots, and interact with web applications. Always respect robots.txt and rate limits. Report what you find clearly and accurately.',
    array['browse_url', 'extract_content', 'fill_form', 'screenshot'],
    4.8,
    2100
  ),
  (
    'content-creator-agent',
    'Content Creation Agent',
    'Blog posts social media marketing copy',
    'pen-tool',
    'content',
    'vyroo',
    true,
    false,
    'claude-sonnet-4-20250514',
    array['write_report', 'generate_description', 'seo_optimize'],
    'You are a creative content agent. You craft compelling blog posts, social media content, marketing copy, and other written material. You adapt your tone and style to the target audience, optimize for SEO when relevant, and ensure content is engaging and well-structured.',
    array['write_report', 'generate_description', 'seo_optimize'],
    4.8,
    1200
  )
on conflict (id) do nothing;
