# Copa 5S — Funilaria Goiana

Plataforma gamificada para evento de 5S na Funilaria. Cada ideia lançada é um gol para a Funilaria: o colaborador acessa pelo celular ou desktop, informa nome, matrícula e turno, lança ideias de melhoria bem descritas, soma pontos e sobe no ranking.

## 1. Objetivo

Registrar oportunidades de melhoria 5S com foco em organização, limpeza, utilização, saúde e disciplina. O sistema não é quiz e não usa anexos.

## 2. Tecnologias

- Phaser 4
- Vite
- JavaScript
- HTML e CSS
- Supabase Database/Postgres
- Supabase Auth para admin
- Supabase Row Level Security
- Vercel

## 3. Instalação

```bash
npm install
```

## 4. Rodar localmente

```bash
npm run dev
```

Abra a URL mostrada pelo Vite.

## 5. Build

```bash
npm run build
```

## 6. Publicar na Vercel

1. Suba este projeto para o GitHub.
2. Na Vercel, escolha **Add New Project**.
3. Importe o repositório.
4. Framework: **Vite**.
5. Build command: `npm run build`.
6. Output directory: `dist`.
7. Publique.

## 7. Configurar Supabase

Crie um projeto no Supabase e abra **Project Settings > API**.

Copie:

- Project URL
- anon public key

Cole em [src/supabase.js](src/supabase.js):

```js
const SUPABASE_URL = "https://seu-projeto.supabase.co";
const SUPABASE_ANON_KEY = "sua-anon-key";
```

Se esses campos estiverem vazios, o app abre visualmente e mostra:

> Supabase ainda não configurado. O envio de ideias e ranking online dependem da configuração.

## 8. SQL das tabelas

Execute no **SQL Editor** do Supabase:

```sql
create extension if not exists pgcrypto;

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  matricula text not null unique,
  turno text not null,
  total_ideias integer not null default 0,
  total_pontos integer not null default 0,
  criado_em timestamptz not null default now(),
  ultima_participacao timestamptz,
  constraint participants_matricula_digits check (matricula ~ '^[0-9]+$'),
  constraint participants_turno_check check (turno in ('1º Turno', '2º Turno', '3º Turno')),
  constraint participants_totals_check check (total_ideias >= 0 and total_pontos >= 0)
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.participants(id) on delete cascade,
  matricula text not null,
  nome text not null,
  turno text not null,
  titulo text not null,
  area text not null,
  descricao_local text not null,
  problema_observado text not null,
  sugestao_melhoria text not null,
  senso text not null,
  status text not null default 'Recebida',
  pontos integer not null default 10,
  bonus_aprovada boolean not null default false,
  bonus_implantada boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint ideas_matricula_digits check (matricula ~ '^[0-9]+$'),
  constraint ideas_turno_check check (turno in ('1º Turno', '2º Turno', '3º Turno')),
  constraint ideas_senso_check check (senso in (
    'SEIRI — Utilização',
    'SEITON — Organização',
    'SEISOU — Limpeza',
    'SEIKETSU — Saúde',
    'SHITSUKE — Disciplina'
  )),
  constraint ideas_status_check check (status in ('Recebida', 'Em análise', 'Aprovada', 'Implantada', 'Recusada')),
  constraint ideas_points_check check (pontos >= 0),
  constraint ideas_text_min_check check (
    char_length(trim(descricao_local)) >= 15
    and char_length(trim(problema_observado)) >= 15
    and char_length(trim(sugestao_melhoria)) >= 15
  )
);

create index if not exists participants_ranking_idx
  on public.participants (total_ideias desc, total_pontos desc, ultima_participacao asc);

create index if not exists ideas_filters_idx
  on public.ideas (turno, senso, status, criado_em desc);
```

## 9. Ativar Supabase Auth

1. Abra **Authentication > Providers**.
2. Deixe **Email** habilitado.
3. Para evento interno, você pode desabilitar cadastro público e criar usuários manualmente.

## 10. Criar usuário admin

1. Abra **Authentication > Users**.
2. Clique em **Add user**.
3. Informe e-mail e senha.
4. Use esse login em `/admin.html`.

Esta versão considera todo usuário autenticado como administrador. Crie apenas contas administrativas no Supabase Auth.

## 11. Row Level Security

Execute depois das tabelas:

```sql
alter table public.participants enable row level security;
alter table public.ideas enable row level security;

grant select, insert, update on public.participants to anon, authenticated;
grant insert on public.ideas to anon;
grant select, update, delete on public.ideas to authenticated;

drop policy if exists "public_read_ranking" on public.participants;
create policy "public_read_ranking"
on public.participants
for select
to anon, authenticated
using (true);

drop policy if exists "public_insert_participants" on public.participants;
create policy "public_insert_participants"
on public.participants
for insert
to anon
with check (
  matricula ~ '^[0-9]+$'
  and turno in ('1º Turno', '2º Turno', '3º Turno')
  and total_ideias = 0
  and total_pontos = 0
);

drop policy if exists "public_update_participants" on public.participants;
create policy "public_update_participants"
on public.participants
for update
to anon
using (true)
with check (
  matricula ~ '^[0-9]+$'
  and turno in ('1º Turno', '2º Turno', '3º Turno')
  and total_ideias >= 0
  and total_pontos >= 0
);

drop policy if exists "admin_manage_participants" on public.participants;
create policy "admin_manage_participants"
on public.participants
for all
to authenticated
using (true)
with check (true);

drop policy if exists "public_insert_ideas" on public.ideas;
create policy "public_insert_ideas"
on public.ideas
for insert
to anon
with check (
  status = 'Recebida'
  and pontos = 10
  and bonus_aprovada = false
  and bonus_implantada = false
  and matricula ~ '^[0-9]+$'
  and turno in ('1º Turno', '2º Turno', '3º Turno')
  and senso in (
    'SEIRI — Utilização',
    'SEITON — Organização',
    'SEISOU — Limpeza',
    'SEIKETSU — Saúde',
    'SHITSUKE — Disciplina'
  )
  and char_length(trim(descricao_local)) >= 15
  and char_length(trim(problema_observado)) >= 15
  and char_length(trim(sugestao_melhoria)) >= 15
);

drop policy if exists "admin_read_ideas" on public.ideas;
create policy "admin_read_ideas"
on public.ideas
for select
to authenticated
using (true);

drop policy if exists "admin_update_ideas" on public.ideas;
create policy "admin_update_ideas"
on public.ideas
for update
to authenticated
using (true)
with check (true);

drop policy if exists "admin_delete_ideas" on public.ideas;
create policy "admin_delete_ideas"
on public.ideas
for delete
to authenticated
using (true);
```

Observação: sem backend próprio, o front-end ainda calcula incremento de pontos. Para segurança corporativa forte, o ideal é mover pontuação e bônus para uma função SQL/RPC `security definer` ou Edge Function validada no servidor.

## 12. Acessar admin

O painel fica em:

```text
/admin.html
```

Não existe link para o admin dentro da tela pública.

## 13. Testar envio de ideia

1. Configure Supabase URL e anon key.
2. Execute o SQL e as políticas RLS.
3. Rode `npm run dev`.
4. Entre na missão.
5. Informe nome completo, matrícula numérica e turno.
6. Clique em **Marcar um Gol de Ideia**.
7. Preencha título, área, descrição do local, problema, sugestão e senso.
8. Envie.

Cada ideia enviada soma 10 pontos.

## 14. Testar ranking

1. Envie ideias com matrículas diferentes.
2. Abra **Ver Ranking da Copa 5S**.
3. Confira a ordenação:
   1. mais ideias
   2. mais pontos
   3. participação mais antiga em caso de empate

## 15. Exportar CSV

1. Acesse `/admin.html`.
2. Faça login com usuário do Supabase Auth.
3. Clique em **Exportar CSV**.

O CSV contém nome, matrícula, turno, título, área, descrições, senso, status, pontos e data.

## 16. Limpar dados

No admin, clique em **Limpar dados do evento** e confirme:

> Tem certeza que deseja apagar todos os dados do evento? Essa ação não poderá ser desfeita.

A limpeza apaga `ideas` e `participants`.

## 17. Logo, favicon e áudios opcionais

Coloque os arquivos oficiais da campanha nestes caminhos:

- `public/assets/images/logo-missao-5s.png`
- `public/assets/images/logo-missao-5s-icon.png`
- `public/favicon.png`
- `public/favicon.ico`

Coloque arquivos MP3 reais em [assets/audio](assets/audio) com estes nomes:

- `gol-de-ideia.mp3`
- `torcida.mp3`
- `apito.mp3`
- `musica-fundo.mp3`
- `ideia-enviada.mp3`
- `ranking.mp3`
- `top3.mp3`
- `continue-participando.mp3`

Se os arquivos não existirem, o app usa fallback silencioso e continua funcionando.

## 18. Segurança

- Não use senha fixa no JavaScript.
- Não coloque senha administrativa no front-end.
- Use Supabase Auth para o admin.
- Mantenha RLS ativo.
- Para restringir admin com mais rigor, crie uma tabela de perfis/claims administrativos e ajuste as políticas.
- Para pontuação totalmente confiável, mova o cálculo para SQL/RPC ou Edge Function.
