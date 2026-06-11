# Ranking AM - Cartoes SS Z2/Z3/Z4

Aplicacao industrial para importar arquivos `.xlsx` de SS exportados do Manusis4, normalizar os dados no Supabase e gerar ranking dos condutores que mais abriram cartoes Z2, Z3 e Z4 no periodo.

## Regras principais

- `Z2` = Cartao AM.
- `Z3` = Fonte de sujeira / dificil acesso.
- `Z4` = PM.
- Total AM = `Z2 + Z3`.
- Total PM = `Z4`.
- Total geral = `Z2 + Z3 + Z4`.
- Total fechado do condutor = somente `Z2` fechado/concluido.
- A chave unica da SS e `Numero`.
- A data do ranking e `Data criacao`.
- O condutor principal vem da coluna `Usuario`.
- `Z1` e registros sem Z2/Z3/Z4 sao ignorados no ranking.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, RLS e Storage privado
- `xlsx` para leitura backend dos arquivos Manusis4
- Zod para validacao
- Recharts para graficos
- GitHub Actions para lint/build e checagens basicas

## Configurar ambiente

Crie `.env.local` a partir de `.env.example`:

```env
NEXT_PUBLIC_APP_NAME="Ranking AM - Cartoes SS Z2/Z3/Z4"
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
UPLOAD_MAX_FILE_SIZE_MB=15
UPLOAD_MAX_ROWS=100000
OPERATOR_PHOTO_MAX_SIZE_MB=2
APP_DEFAULT_TIMEZONE=America/Recife
```

Nunca use `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`. A service role deve existir somente no servidor.

## Aplicar SQL no Supabase

1. Abra o projeto no Supabase.
2. Va em **SQL Editor**.
3. Execute o arquivo `supabase/migrations/001_initial_schema.sql`.
4. Confirme que o bucket privado `operator-photos` foi criado.
5. Crie usuarios pelo Supabase Auth.
6. Promova o primeiro admin pelo SQL Editor:

```sql
update public.user_profiles
set role = 'admin'
where user_id = 'UUID_DO_USUARIO';
```

Novos usuarios entram como `viewer` por padrao.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra a URL informada pelo Next.js e acesse `/login`.

## Build e lint

```bash
npm run lint
npm run build
```

## Importar a primeira base SS

1. Entre com usuario `admin` ou `leader`.
2. Acesse `/upload`.
3. Selecione um ou mais arquivos `.xlsx`.
4. O backend valida extensao, tamanho, assinatura ZIP do XLSX, aba `Solicitações`, colunas obrigatorias e limite de linhas.
5. Os dados sao gravados em `ss_cards` por upsert usando `ss_number`.
6. O resumo mostra linhas lidas, validas, Z2/Z3/Z4, ignoradas, erros e duplicadas/atualizadas.

O arquivo original nao e salvo no banco nem deve ser commitado.

## Cadastrar condutores e fotos

1. Acesse `/condutores` como `admin` ou `leader`.
2. Cadastre nome, matricula, turno, equipe, UTE e aliases.
3. Use o upload de foto na tabela.
4. A foto vai para o bucket privado `operator-photos`.
5. O Top 3 usa signed URL curta para exibicao.

O cruzamento tenta primeiro `operators.name = ss_cards.user_name` e depois `operator_aliases.alias = ss_cards.user_name`, com normalizacao case-insensitive e sem acentos.

## Acessar o Top 3

Abra `/ranking/top3`.

Filtros disponiveis:

- Data inicial e final
- Turno
- Equipe
- UTE
- Linha
- Status
- Incluir canceladas
- Incluir integracao/PXBREMOTE
- Apenas condutores cadastrados
- Tipo: todos, Z2, Z3 ou Z4

A ordenacao segue:

1. Maior total geral.
2. Maior total AM.
3. Maior Z2.
4. Maior Z3.
5. Maior Z4.
6. Ordem alfabetica.

## Telas

- `/ranking/top3`: podium Top 3 com foto, AM, PM, total, fechado e Z2/Z3/Z4.
- `/ranking/geral`: ranking geral filtrado.
- `/dashboard`: KPIs e graficos basicos.
- `/cartoes`: tabela dos cartoes SS com filtros.
- `/upload`: importacao XLSX backend.
- `/condutores`: cadastro manual e fotos.
- `/admin`: perfis, lotes e auditoria.

## Seguranca

- Supabase Auth protege todas as telas, exceto `/login`.
- APIs verificam sessao.
- APIs sensiveis verificam papel `admin` ou `leader`.
- RLS ativo em todas as tabelas publicas.
- View de ranking usa `security_invoker`.
- Bucket de fotos e privado.
- Fotos usam signed URL.
- Service role nunca e exposta no cliente.
- `.gitignore` bloqueia `.env`, exports `.xlsx/.xls/.xlsm/.csv`, logs e builds.
- GitHub Actions faz lint, build e checagem basica contra secrets/exports.

## Deploy na Vercel

1. Envie o repositorio ao GitHub.
2. Crie projeto na Vercel.
3. Framework: Next.js.
4. Configure as variaveis de ambiente.
5. Rode o deploy.

## Arquivos sensiveis que nunca devem ser commitados

- `.env` e `.env.local`
- Arquivos `.xlsx`, `.xls`, `.xlsm`, `.csv`
- Fotos reais de pessoas
- Chaves service role
- Tokens e dados reais sensiveis
