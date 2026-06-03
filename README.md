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

create table if not exists public.app_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  criado_em timestamptz not null default now()
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
4. Copie o `id` do usuário criado.
5. Cadastre esse usuário na tabela `app_admins`.
6. Use esse login em `/admin.html`.

O painel administrativo só é liberado para usuários autenticados que também existam em `app_admins`.

Exemplo:

```sql
insert into public.app_admins (user_id, email)
values ('ID_DO_USUARIO_AUTH', 'admin@empresa.com');
```

## 11. Row Level Security

Use a versão endurecida em [`supabase/hardening.sql`](supabase/hardening.sql).

Ela substitui as regras permissivas antigas e aplica estes controles:

- público lê apenas o ranking necessário;
- público não faz `insert`, `update` ou `delete` direto em `participants` ou `ideas`;
- envio de ideia passa pela RPC `submit_idea`;
- alteração de status passa pela RPC `admin_update_idea_status`;
- limpeza do evento passa pela RPC `admin_clear_event`;
- admin é validado pela tabela `app_admins`;
- views usam `security_invoker`;
- permissões diretas de `anon` e `authenticated` são revogadas e recriadas de forma mínima.

Depois de executar o SQL, rode os advisors de segurança do Supabase e confirme que não existe policy pública de `update` em `participants`.

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

Cada ideia enviada soma 10 pontos. Se o colaborador marcar que a ideia já foi resolvida e descrever a ação realizada, o envio soma 15 pontos.

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

O projeto já inclui versões SVG leves para evitar erro 404 quando a logo oficial ainda não foi anexada:

- `public/assets/images/logo-missao-5s.svg`
- `public/assets/images/logo-missao-5s-icon.svg`
- `public/favicon.svg`
- opcional: `public/assets/images/logo-missao-5s.png`
- opcional: `public/assets/images/logo-missao-5s-icon.png`

Para manter a logo nítida no celular, prefira SVG. Se usar PNG, exporte em alta resolução:

- logo completa: mínimo recomendado de `1440x480`
- ícone: mínimo recomendado de `512x512`
- favicon: mínimo recomendado de `128x128`

O Phaser procura primeiro por `logo-missao-5s.png` e `logo-missao-5s-icon.png`. Se esses arquivos não existirem, usa os SVGs como fallback. Para máxima nitidez, o melhor fluxo é substituir `public/assets/images/logo-missao-5s.svg` pela arte oficial em SVG; se a arte oficial vier em PNG, salve nos nomes opcionais acima em alta resolução.

Para aplicar a logo oficial com validação simples de formato e tamanho, use:

```bash
npm run logo:apply -- caminho/para/logo.svg
npm run logo:apply -- caminho/para/logo.png caminho/para/icone.png
```

O comando aceita SVG ou PNG, copia para `public/assets/images` e avisa se o PNG estiver abaixo da resolução recomendada.

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

## Créditos do Projeto

### Missão 5S: Ideias que Transformam

Sistema gamificado desenvolvido para incentivar os colaboradores da Funilaria Goiana a registrarem ideias de melhoria, fortalecerem o 5S no dia a dia e contribuírem com a organização, limpeza, saúde, disciplina e melhoria contínua.

### Projeto desenvolvido para

Campanha Copa 5S — Funilaria Goiana

### Idealização e desenvolvimento

Lucas Oliveira — Team Leader AM

### Objetivo

Estimular a participação dos colaboradores por meio do lançamento de ideias de melhoria 5S, com ranking, pontuação e acompanhamento das oportunidades registradas.

### Tecnologias utilizadas

- Phaser 4
- Vite
- JavaScript
- Supabase
- Supabase Auth
- Supabase Database/Postgres
- Vercel
- GitHub

### Músicas e efeitos sonoros

Músicas e efeitos sonoros utilizados conforme licenças dos respectivos autores/plataformas.

Vozes geradas com ElevenLabs, quando aplicável.

- musica-fundo.mp3:
- ideia-enviada.mp3:
- ranking.mp3:
- top3.mp3:
- gol-de-ideia.mp3:
- torcida.mp3:
- apito.mp3:

### Uso interno

Sistema criado para uso interno em campanha de melhoria contínua, com foco em engajamento, 5S e cultura SIS.
