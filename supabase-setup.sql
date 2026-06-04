-- Rode este SQL no Supabase: SQL Editor > New query > Run.
-- Ele cria a tabela usada para sincronizar a Lojinha da Jô.
-- As permissões liberam somente a linha fixa da Lojinha para a chave pública do app.

create table if not exists public.lojinha_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.lojinha_state enable row level security;

drop policy if exists "Lojinha autenticada pode ler" on public.lojinha_state;
drop policy if exists "Lojinha autenticada pode inserir" on public.lojinha_state;
drop policy if exists "Lojinha autenticada pode atualizar" on public.lojinha_state;
drop policy if exists "Lojinha app pode ler" on public.lojinha_state;
drop policy if exists "Lojinha app pode inserir" on public.lojinha_state;
drop policy if exists "Lojinha app pode atualizar" on public.lojinha_state;

create policy "Lojinha app pode ler"
  on public.lojinha_state
  for select
  to anon, authenticated
  using (id = 'lojinha-da-jo');

create policy "Lojinha app pode inserir"
  on public.lojinha_state
  for insert
  to anon, authenticated
  with check (id = 'lojinha-da-jo');

create policy "Lojinha app pode atualizar"
  on public.lojinha_state
  for update
  to anon, authenticated
  using (id = 'lojinha-da-jo')
  with check (id = 'lojinha-da-jo');

insert into public.lojinha_state (id, data)
values ('lojinha-da-jo', '{"products":[],"sales":[],"purchases":[],"trash":[],"lastBackupAt":""}'::jsonb)
on conflict (id) do nothing;
