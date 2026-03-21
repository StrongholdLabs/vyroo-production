-- Published Agents: marketplace listings
create table if not exists published_agents (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  template_id text references agent_templates(id) on delete set null,
  name text not null,
  description text,
  long_description text,
  price_monthly decimal(10,2) not null default 0,
  revenue_share decimal(3,2) not null default 0.80,
  category text,
  tags text[] not null default '{}',
  icon_name text not null default 'bot',
  install_count integer not null default 0,
  rating decimal(2,1) not null default 0,
  review_count integer not null default 0,
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'published', 'rejected', 'suspended')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table published_agents enable row level security;

-- Anyone can read published agents
create policy "Anyone can read published agents"
  on published_agents for select
  using (status = 'published' or auth.uid() = creator_id);

-- Creators can insert their own agents
create policy "Creators can insert their own agents"
  on published_agents for insert
  with check (auth.uid() = creator_id);

-- Creators can update their own agents
create policy "Creators can update their own agents"
  on published_agents for update
  using (auth.uid() = creator_id);

-- Creators can delete their own agents
create policy "Creators can delete their own agents"
  on published_agents for delete
  using (auth.uid() = creator_id);

-- Agent Reviews
create table if not exists agent_reviews (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references published_agents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  review text,
  created_at timestamptz not null default now(),
  unique (agent_id, user_id)
);

alter table agent_reviews enable row level security;

-- Anyone can read reviews
create policy "Anyone can read agent reviews"
  on agent_reviews for select
  using (true);

-- Users can insert their own reviews
create policy "Users can insert their own reviews"
  on agent_reviews for insert
  with check (auth.uid() = user_id);

-- Users can update their own reviews
create policy "Users can update their own reviews"
  on agent_reviews for update
  using (auth.uid() = user_id);

-- Users can delete their own reviews
create policy "Users can delete their own reviews"
  on agent_reviews for delete
  using (auth.uid() = user_id);

-- Agent Installs
create table if not exists agent_installs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references published_agents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  installed_at timestamptz not null default now(),
  unique (agent_id, user_id)
);

alter table agent_installs enable row level security;

-- Anyone can see install counts (via published_agents), but only own installs
create policy "Users can read their own installs"
  on agent_installs for select
  using (auth.uid() = user_id);

-- Users can install agents
create policy "Users can insert their own installs"
  on agent_installs for insert
  with check (auth.uid() = user_id);

-- Users can uninstall agents
create policy "Users can delete their own installs"
  on agent_installs for delete
  using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_published_agents_creator on published_agents(creator_id);
create index if not exists idx_published_agents_status on published_agents(status);
create index if not exists idx_published_agents_category on published_agents(category);
create index if not exists idx_agent_reviews_agent on agent_reviews(agent_id);
create index if not exists idx_agent_installs_agent on agent_installs(agent_id);
create index if not exists idx_agent_installs_user on agent_installs(user_id);
