# ADDREA Leadership DNA

Управленческий reflection tool для TOP-команды ADDREA перед стратегической встречей.

Это **не** психологический тест и **не** HR-оценка. Приложение помогает увидеть:

- какие убеждения и принципы разделяет команда;
- как руководители видят устройство компании;
- ценностные trade-offs;
- разрыв между «нам это близко» и «мы реально так живём»;
- где есть консенсус, а где позиции различаются.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + RLS)
- Zustand (survey draft state)
- Zod (validation)
- Recharts доступен в зависимостях; MVP Team DNA использует lightweight custom visuals

## Prerequisites

- Node.js 20+
- npm
- Аккаунт [Supabase](https://supabase.com)
- (для production) [Vercel](https://vercel.com)

## Public URLs

| Назначение | Path |
|---|---|
| Welcome / start | `/s/addrea-top` |
| Survey wizard | `/s/addrea-top/survey` |
| Personal DNA | `/r/[participantId]` |
| Team DNA | `/t/addrea-top` |

Корень `/` редиректит на `/s/addrea-top`.

## Environment variables

Скопируйте `.env.example` → `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

| Variable | Where used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server (RLS locked down) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** — writes participants/responses, Team DNA aggregation |

`SUPABASE_SERVICE_ROLE_KEY` никогда не должен попадать в client bundle.

## Supabase setup

1. Создайте новый Supabase project.
2. Откройте **SQL Editor**.
3. Выполните миграцию:

```bash
# содержимое файла:
apps/leadership-dna/supabase/migrations/001_init.sql
```

4. Выполните seed:

```bash
# содержимое файла:
apps/leadership-dna/supabase/seed.sql
```

5. В **Project Settings → API** скопируйте URL, `anon` key и `service_role` key в `.env.local`.

### Что делает seed

- Session: `ADDREA Leadership Team` / code `addrea-top` / `active = true`
- Каталог questions + options (синхронизирован с `src/content/survey.ts`)

UI читает question bank из TypeScript config; БД-каталог нужен для будущих sessions и audit.

## Local run

```bash
cd apps/leadership-dna
cp .env.example .env.local
# заполните env

npm install
npm run dev
```

Откройте: http://localhost:3000/s/addrea-top

### Checks

```bash
npm run typecheck
npm test
npm run build
```

## Production build

```bash
cd apps/leadership-dna
npm run build
npm start
```

## Vercel deploy

1. Создайте **отдельный** Vercel project.
2. Root Directory: `apps/leadership-dna`
3. Framework: Next.js
4. Добавьте env variables (те же три).
5. Deploy.
6. Публичная ссылка для команды: `https://<your-domain>/s/addrea-top`
7. Team DNA: `https://<your-domain>/t/addrea-top`

## Как создать новую session вручную

В Supabase SQL Editor:

```sql
insert into sessions (name, code, active)
values ('Новая сессия', 'my-session-code', true);
```

Ссылка: `/s/my-session-code`  
Team DNA: `/t/my-session-code`

Question bank пока общий (из `src/content/survey.ts` + seed). Для другой анкеты потребуются изменения content/seed — вне текущего MVP.

## Security model (MVP)

- Participant access token хранится в **httpOnly cookie** (`ldna_access_token`).
- Raw responses других участников **не** отдаются в browser.
- Team DNA считается **только server-side** через service role.
- RLS на `participants` / `responses` запрещает anon SELECT/INSERT/UPDATE.
- После `completed_at` draft нельзя менять; submit идемпотентен.

## Privacy copy

На Welcome явно указано: индивидуальные ответы не показываются другим; в Team DNA — только агрегаты. Имя хранится, чтобы организатор понимал, кто прошёл опрос.

## Troubleshooting

| Проблема | Что проверить |
|---|---|
| «Сессия не найдена» | seed выполнен? `sessions.code = 'addrea-top'`, `active = true` |
| «Missing SUPABASE_…» | `.env.local` / Vercel env |
| После refresh теряется прогресс | cookie выставлен? same-site / HTTPS в prod |
| «Нет доступа к результату» | другой браузер / cookie очищен — личный результат привязан к cookie |
| Team DNA пустой | есть ли участники с `completed_at` |
| Build fail без env | задайте placeholder env для `next build` или соберите с реальными ключами |

## Out of scope (намеренно)

Auth/SSO, admin panel, AI interpretation, PDF/PPT export, email/Slack, редактор вопросов, department comparison, personality scoring.
