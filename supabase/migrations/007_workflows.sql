-- Workflows: multi-agent workflow definitions
create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Workflow',
  description text,
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  last_run_at timestamptz,
  run_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table workflows enable row level security;

create policy "Users can read their own workflows"
  on workflows for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workflows"
  on workflows for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workflows"
  on workflows for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workflows"
  on workflows for delete
  using (auth.uid() = user_id);

create index if not exists idx_workflows_user_id on workflows(user_id);

-- Scheduled Agents: recurring or scheduled agent/workflow executions
create table if not exists scheduled_agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_template_id text references agent_templates(id) on delete set null,
  workflow_id uuid references workflows(id) on delete set null,
  name text not null,
  cron_expression text not null,
  input_config jsonb not null default '{}',
  is_active boolean not null default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  run_count integer not null default 0,
  created_at timestamptz not null default now(),
  -- Either agent_template_id or workflow_id must be set
  constraint scheduled_agents_target_check check (
    agent_template_id is not null or workflow_id is not null
  )
);

alter table scheduled_agents enable row level security;

create policy "Users can read their own schedules"
  on scheduled_agents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own schedules"
  on scheduled_agents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own schedules"
  on scheduled_agents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own schedules"
  on scheduled_agents for delete
  using (auth.uid() = user_id);

create index if not exists idx_scheduled_agents_user_id on scheduled_agents(user_id);
