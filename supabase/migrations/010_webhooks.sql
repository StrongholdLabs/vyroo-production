-- Webhook Triggers: incoming webhooks that trigger agent/workflow runs
create table if not exists webhook_triggers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  source text not null check (source in ('github', 'shopify', 'slack', 'stripe', 'custom')),
  event_type text not null,
  agent_template_id text references agent_templates,
  workflow_id uuid references workflows,
  webhook_url text unique not null,
  webhook_secret text not null,
  input_mapping jsonb not null default '{}',
  is_active boolean not null default true,
  last_triggered_at timestamptz,
  trigger_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table webhook_triggers enable row level security;

-- Users can only see their own webhook triggers
create policy "Users can read own webhook triggers"
  on webhook_triggers for select
  using (auth.uid() = user_id);

create policy "Users can insert own webhook triggers"
  on webhook_triggers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own webhook triggers"
  on webhook_triggers for update
  using (auth.uid() = user_id);

create policy "Users can delete own webhook triggers"
  on webhook_triggers for delete
  using (auth.uid() = user_id);

-- Index for fast webhook URL lookups (incoming requests)
create index if not exists idx_webhook_triggers_url on webhook_triggers (webhook_url);

-- Index for user listing
create index if not exists idx_webhook_triggers_user_id on webhook_triggers (user_id);
