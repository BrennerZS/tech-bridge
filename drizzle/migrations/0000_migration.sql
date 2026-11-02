
-- ROLES
create type public.app_role as enum ('admin','moderator','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null default '',
  avatar_url text, cover_url text,
  bio text default '' check (char_length(bio) <= 600),
  specialties text[] not null default '{}',
  technologies text[] not null default '{}',
  interests text[] not null default '{}',
  github text, instagram text, linkedin text, website text,
  availability text not null default 'open' check (availability in ('open','busy','closed')),
  account_type text not null default 'developer' check (account_type in ('developer','client')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles public read" on public.profiles for select using (true);
create policy "profiles own update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','moderator'))
$$;

create policy "roles read own or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "roles admin insert" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(),'admin'));
create policy "roles admin delete" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(),'admin') and user_id <> auth.uid());
grant insert, delete on public.user_roles to authenticated;

-- new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare base text; uname text; n int := 0;
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1), 'dev'), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base) < 3 then base := base || 'dev'; end if;
  base := left(base, 20);
  uname := base;
  while exists (select 1 from public.profiles where username = uname) loop
    n := n + 1; uname := left(base, 18) || n::text;
  end loop;
  insert into public.profiles (id, username, display_name, account_type, avatar_url)
  values (new.id, uname,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', uname),
    case when new.raw_user_meta_data->>'account_type' = 'client' then 'client' else 'developer' end,
    new.raw_user_meta_data->>'avatar_url');
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  -- bootstrap: very first account becomes admin
  if (select count(*) from public.user_roles where role = 'admin') = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- POSTS
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'update' check (kind in ('update','project','process','photo')),
  body text not null default '' check (char_length(body) <= 4000),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "posts read" on public.posts for select using (true);
create policy "posts insert own" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "posts update own" on public.posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts delete own or staff" on public.posts for delete to authenticated using (author_id = auth.uid() or public.is_staff(auth.uid()));
create trigger posts_touch before update on public.posts for each row execute function public.touch_updated_at();

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
grant select on public.post_likes to anon, authenticated;
grant insert, delete on public.post_likes to authenticated;
grant all on public.post_likes to service_role;
alter table public.post_likes enable row level security;
create policy "likes read" on public.post_likes for select using (true);
create policy "likes insert own" on public.post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "likes delete own" on public.post_likes for delete to authenticated using (user_id = auth.uid());

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1500),
  created_at timestamptz not null default now()
);
grant select on public.post_comments to anon, authenticated;
grant insert, delete on public.post_comments to authenticated;
grant all on public.post_comments to service_role;
alter table public.post_comments enable row level security;
create policy "comments read" on public.post_comments for select using (true);
create policy "comments insert own" on public.post_comments for insert to authenticated with check (author_id = auth.uid());
create policy "comments delete own or staff" on public.post_comments for delete to authenticated using (author_id = auth.uid() or public.is_staff(auth.uid()));

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;
alter table public.follows enable row level security;
create policy "follows read" on public.follows for select using (true);
create policy "follows insert own" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "follows delete own" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- CHAT
create table public.chat_rooms (
  slug text primary key,
  name text not null,
  description text not null,
  position int not null default 0
);
grant select on public.chat_rooms to anon, authenticated;
grant all on public.chat_rooms to service_role;
alter table public.chat_rooms enable row level security;
create policy "rooms read" on public.chat_rooms for select using (true);
insert into public.chat_rooms (slug, name, description, position) values
 ('geral','Chat Geral','Conversa aberta entre todos os membros.',1),
 ('ideias','Chat de Ideias','Apresente ideias, discuta possibilidades e encontre interessados.',2),
 ('acao','Chat de Ação','Organize iniciativas, forme equipes e defina tarefas.',3);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_slug text not null references public.chat_rooms(slug) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  reply_to uuid references public.chat_messages(id) on delete set null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.chat_messages (room_slug, created_at desc);
grant select, insert, delete on public.chat_messages to authenticated;
grant update (hidden) on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;
alter table public.chat_messages enable row level security;
create policy "msgs read members" on public.chat_messages for select to authenticated using (not hidden or public.is_staff(auth.uid()) or author_id = auth.uid());
create policy "msgs insert own" on public.chat_messages for insert to authenticated with check (author_id = auth.uid() and hidden = false);
create policy "msgs delete own or staff" on public.chat_messages for delete to authenticated using (author_id = auth.uid() or public.is_staff(auth.uid()));
create policy "msgs staff moderate" on public.chat_messages for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- PROJECTS
create table public.collab_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) <= 4000),
  technologies text[] not null default '{}',
  roles_needed text[] not null default '{}',
  status text not null default 'recruiting' check (status in ('recruiting','in_progress','paused','done')),
  progress int not null default 0 check (progress between 0 and 100),
  progress_note text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.collab_projects to anon, authenticated;
grant insert, update, delete on public.collab_projects to authenticated;
grant all on public.collab_projects to service_role;
alter table public.collab_projects enable row level security;
create policy "cp read" on public.collab_projects for select using (true);
create policy "cp insert own" on public.collab_projects for insert to authenticated with check (owner_id = auth.uid());
create policy "cp update own" on public.collab_projects for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "cp delete own or staff" on public.collab_projects for delete to authenticated using (owner_id = auth.uid() or public.is_staff(auth.uid()));
create trigger cp_touch before update on public.collab_projects for each row execute function public.touch_updated_at();

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.collab_projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default '',
  message text default '' check (char_length(message) <= 800),
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);
grant select, insert, update, delete on public.project_members to authenticated;
grant select on public.project_members to anon;
grant all on public.project_members to service_role;
alter table public.project_members enable row level security;
create or replace function public.is_project_owner(_project uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.collab_projects where id = _project and owner_id = _user)
$$;
create policy "pm read accepted public" on public.project_members for select using (status = 'accepted' or user_id = auth.uid() or public.is_project_owner(project_id, auth.uid()));
create policy "pm insert self pending" on public.project_members for insert to authenticated with check (user_id = auth.uid() and status = 'pending' and not public.is_project_owner(project_id, auth.uid()));
create policy "pm owner decides" on public.project_members for update to authenticated using (public.is_project_owner(project_id, auth.uid())) with check (public.is_project_owner(project_id, auth.uid()));
create policy "pm delete self or owner" on public.project_members for delete to authenticated using (user_id = auth.uid() or public.is_project_owner(project_id, auth.uid()));

-- OPPORTUNITIES
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  kind text not null check (kind in ('job','freela','partnership','other')),
  description text not null check (char_length(description) <= 4000),
  location text default 'Remoto',
  contact_link text,
  open boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.opportunities to anon, authenticated;
grant insert, update, delete on public.opportunities to authenticated;
grant all on public.opportunities to service_role;
alter table public.opportunities enable row level security;
create policy "op read" on public.opportunities for select using (true);
create policy "op insert own" on public.opportunities for insert to authenticated with check (author_id = auth.uid());
create policy "op update own" on public.opportunities for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "op delete own or staff" on public.opportunities for delete to authenticated using (author_id = auth.uid() or public.is_staff(auth.uid()));

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  kind text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notif own read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notif own update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notif own delete" on public.notifications for delete to authenticated using (user_id = auth.uid());

create or replace function public.notify(_user uuid, _actor uuid, _kind text, _msg text, _link text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _user is null or _user = _actor then return; end if;
  insert into public.notifications (user_id, actor_id, kind, message, link) values (_user, _actor, _kind, _msg, _link);
end $$;
revoke execute on function public.notify(uuid,uuid,text,text,text) from public, anon, authenticated;

create or replace function public.trg_like_notify() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify((select author_id from posts where id = new.post_id), new.user_id, 'like',
    (select '@'||username from profiles where id = new.user_id) || ' curtiu sua publicação', '/feed');
  return new;
end $$;
create trigger like_notify after insert on public.post_likes for each row execute function public.trg_like_notify();

create or replace function public.trg_comment_notify() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify((select author_id from posts where id = new.post_id), new.author_id, 'comment',
    (select '@'||username from profiles where id = new.author_id) || ' comentou na sua publicação', '/feed');
  return new;
end $$;
create trigger comment_notify after insert on public.post_comments for each row execute function public.trg_comment_notify();

create or replace function public.trg_follow_notify() returns trigger language plpgsql security definer set search_path = public as $$
declare u text;
begin
  select username into u from profiles where id = new.follower_id;
  perform public.notify(new.following_id, new.follower_id, 'follow', '@'||u||' começou a seguir você', '/u/'||u);
  return new;
end $$;
create trigger follow_notify after insert on public.follows for each row execute function public.trg_follow_notify();

create or replace function public.trg_member_notify() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify((select owner_id from collab_projects where id = new.project_id), new.user_id, 'interest',
      (select '@'||username from profiles where id = new.user_id) || ' demonstrou interesse no seu projeto', '/projetos');
  elsif new.status <> old.status then
    perform public.notify(new.user_id, auth.uid(), 'member',
      case when new.status = 'accepted' then 'Você foi aceito em um projeto' else 'Sua candidatura foi recusada' end, '/projetos');
  end if;
  return new;
end $$;
create trigger member_notify after insert or update on public.project_members for each row execute function public.trg_member_notify();

create or replace function public.trg_mention_notify() returns trigger language plpgsql security definer set search_path = public as $$
declare m text; actor text; room text;
begin
  select username into actor from profiles where id = new.author_id;
  select name into room from chat_rooms where slug = new.room_slug;
  for m in select distinct lower((regexp_matches(new.body, '@([a-zA-Z0-9_]{3,24})', 'g'))[1]) loop
    perform public.notify((select id from profiles where username = m), new.author_id, 'mention',
      '@'||actor||' mencionou você em '||room, '/chat/'||new.room_slug);
  end loop;
  if new.reply_to is not null then
    perform public.notify((select author_id from chat_messages where id = new.reply_to), new.author_id, 'reply',
      '@'||actor||' respondeu sua mensagem em '||room, '/chat/'||new.room_slug);
  end if;
  return new;
end $$;
create trigger mention_notify after insert on public.chat_messages for each row execute function public.trg_mention_notify();

-- REPORTS
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','message','profile','project','opportunity')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now()
);
grant select, insert, update on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reports insert own" on public.reports for insert to authenticated with check (reporter_id = auth.uid() and status = 'open');
create policy "reports read own or staff" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_staff(auth.uid()));
create policy "reports staff update" on public.reports for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- QUOTES
create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 255),
  company text check (char_length(company) <= 160),
  service text not null,
  budget text,
  message text not null check (char_length(message) between 10 and 4000),
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now()
);
grant insert on public.quote_requests to anon, authenticated;
grant select, update, delete on public.quote_requests to authenticated;
grant all on public.quote_requests to service_role;
alter table public.quote_requests enable row level security;
create policy "quotes anyone insert" on public.quote_requests for insert to anon, authenticated with check (status = 'new');
create policy "quotes admin read" on public.quote_requests for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "quotes admin update" on public.quote_requests for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "quotes admin delete" on public.quote_requests for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- PORTFOLIO (agency, admin managed)
create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  category text not null check (category in ('site','app','sistema','plataforma','automacao','consultoria')),
  technologies text[] not null default '{}',
  image_url text,
  demo_url text,
  responsible text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.portfolio_items to anon, authenticated;
grant insert, update, delete on public.portfolio_items to authenticated;
grant all on public.portfolio_items to service_role;
alter table public.portfolio_items enable row level security;
create policy "pf read published" on public.portfolio_items for select using (published or public.has_role(auth.uid(),'admin'));
create policy "pf admin insert" on public.portfolio_items for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "pf admin update" on public.portfolio_items for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "pf admin delete" on public.portfolio_items for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- SITE SETTINGS (institutional content)
create table public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "ss read" on public.site_settings for select using (true);
create policy "ss admin insert" on public.site_settings for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "ss admin update" on public.site_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.site_settings (key, value) values
 ('agency_name','Kernel Studio'),
 ('contact_email',''),
 ('announcement','');

-- REALTIME
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.posts;
