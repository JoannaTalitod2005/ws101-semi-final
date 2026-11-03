# MoneyWise

MoneyWise is a personal expense tracker and planning notepad built with Next.js App Router, TypeScript, Tailwind CSS, and self-hosted Supabase. It keeps recent spending beside the things you plan to buy or pay for, in one responsive dashboard.

## What it does

- Email and password sign-up, sign-in, and sign-out.
- Log expenses with a description, PHP amount, category, and date; review the total and remove entries.
- Choose from built-in categories or create personal categories.
- Keep a to-buy/to-pay list with optional amounts and due dates; mark items done or active.
- Store each person's entries in Supabase Postgres with row-level security.

## Run locally

### Prerequisites

- Node.js 20.9 or later and npm.
- Docker Desktop (or another Docker Engine with Docker Compose) running.

### Start Supabase and Next.js

1. Install the project dependencies:

   ```powershell
   npm install
   ```

2. Create `.env.local` from `.env.example` if you do not already have one.

3. Start the complete local Supabase stack. The Supabase CLI provisions its services as Docker containers and applies the database migrations:

   ```powershell
   npm run supabase:start
   ```

4. Get the local API URL and anon key:

   ```powershell
   npm run supabase:status
   ```

   Copy `API_URL` to `NEXT_PUBLIC_SUPABASE_URL` and `ANON_KEY` to `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. The app uses the anon key with the signed-in user's session; it does not need or expose the service-role key.

5. Start the web app:

   ```powershell
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), create an account, and start tracking. Local email confirmation is disabled so signup works without an SMTP server.

The Supabase Studio dashboard is available at [http://127.0.0.1:54323](http://127.0.0.1:54323). The local API is at `http://127.0.0.1:54321`.

### Supabase commands

```powershell
npm run supabase:start   # Start the Docker-backed local Supabase stack
npm run supabase:status  # Print local API and key information
npm run supabase:reset   # Recreate the local database and apply migrations
npm run supabase:stop    # Stop the local stack
```

The schema is managed in [`supabase/migrations/20261030140000_create_moneywise_schema.sql`](./supabase/migrations/20261030140000_create_moneywise_schema.sql). Resetting the local database applies this migration, including the expense, category, and notepad tables, indexes, update timestamp trigger, grants, and RLS policies.

## Data access and security

The browser uses the public anon key and Supabase Auth session. Middleware refreshes auth cookies; protected dashboard pages verify the signed-in user. Row-level security is enabled for every user table, and policies only allow authenticated users to access rows whose `user_id` matches their session. The service-role key is intentionally not used by the app.

Keep `.env.local` private. The example file contains no usable credentials.

## Checks

```powershell
npm run typecheck
npm run lint
npm run build
```

## Coding agent and skills

- **Coding agent:** Copilot SDK assistant in VS Code. It was used to inspect the starter project, implement the app and Supabase integration, and run the project checks.
- **[`codebase-design`](https://github.com/mattpocock/skills/tree/main/skills/engineering/codebase-design):** kept Supabase browser/server setup behind small typed helpers and a shared `Database` contract, giving authentication and data screens one consistent session/configuration seam.
- **[`implement`](https://github.com/mattpocock/skills/tree/main/skills/engineering/implement):** treated the request as an end-to-end feature spec, connecting the UI, auth flow, RLS-backed persistence, Docker-backed local setup, and run documentation before validating the application.

