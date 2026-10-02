# ADDREA Leadership DNA

Управленческий reflection tool для TOP-команды ADDREA перед стратегической встречей.

Это **не** психологический тест и **не** HR-оценка.

## Stack

- Next.js (App Router, **static export**) + React + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + RLS + SECURITY DEFINER RPCs)
- Zustand, Zod
- Recharts (Team DNA worldview chart)

Приложение — **fully static frontend**. Node/server runtime не нужен.  
Service role **не используется**.

## Public URLs

| Назначение | Path |
|---|---|
| Welcome / start | `/s/addrea-top/` |
| Survey wizard | `/s/addrea-top/survey/` |
| Personal DNA | `/r/<participantId>/` |
| Team DNA | `/t/addrea-top/` |

## Environment variables

Оставить только:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**Удалить / не задавать:**

```env
SUPABASE_SERVICE_ROLE_KEY
```

## Supabase setup

1. Создайте project (или используйте существующий).
2. SQL Editor → выполните по порядку:
   1. `supabase/migrations/001_init.sql`
   2. `supabase/seed.sql`
   3. `supabase/migrations/002_static_client_rls_rpc.sql`
3. В API settings скопируйте **URL** и **anon key** в `.env.local`.

> `002` включает RLS deny на `participants`/`responses` и RPC:  
> `start_participant`, `get_participant`, `save_draft`, `submit_survey`,  
> `get_personal_result`, `get_team_dna`.

## Local run

```bash
cd apps/leadership-dna
cp .env.example .env.local
# заполните NEXT_PUBLIC_* 

npm install
npm run dev
```

Откройте: http://localhost:3000/s/addrea-top/

### Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Production / static build

```bash
cd apps/leadership-dna
npm run build
```

**Output directory:** `apps/leadership-dna/out/`

Это чистый static site (`output: 'export'`).

## Deploy (бесплатный static hosting)

Подходит:

- Cloudflare Pages
- Netlify
- GitHub Pages (+ redirects)
- Firebase Hosting / любой S3+CDN

### Рекомендуемая настройка

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `out` |
| Root directory (monorepo) | `apps/leadership-dna` |
| Env | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

### SPA rewrite для Personal DNA

Файл `public/_redirects` уже содержит:

```text
/r/*  /r/_/index.html  200
```

Это нужно, чтобы hard-refresh `/r/<uuid>/` открывал shell и client читал id из URL.

## Privacy model (кратко)

- Token участника: `localStorage` key `ldna_access_token`
- Raw responses чужих участников недоступны anon (RLS deny + RPC)
- Team DNA: только агрегаты; при `< 3` completed — `insufficientSample`, без детальных секций и open answers
- Personal DNA: только свои ответы (token + participant id)

## Как создать новую session

```sql
insert into public.sessions (name, code, active)
values ('Новая сессия', 'my-session-code', true);
```

Для static export новый `sessionCode` нужно добавить в `generateStaticParams` (сейчас зашит `addrea-top`) и пересобрать.

## Troubleshooting

| Проблема | Что проверить |
|---|---|
| SESSION_NOT_FOUND | seed + `002` применены? `code = addrea-top`, `active = true` |
| Missing NEXT_PUBLIC_… | `.env.local` / hosting env |
| Team DNA пустой / «минимум 3» | нужно ≥3 `completed_at` |
| `/r/<uuid>` 404 после refresh | `_redirects` на хостинге |
| FORBIDDEN на personal | другой браузер / очищен localStorage |

## Out of scope

Auth/SSO, admin panel, AI summary, PDF export, service role на клиенте.
