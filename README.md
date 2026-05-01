# E3 AI Operating Partner

An AI-powered operating partner for E3 value creation community member companies.

## What it does

The E3 AI Operating Partner sits beneath every member company and helps the CEO, lead operating partner, and Lodestone team:

- **Learn the business** — ingest documents, build a company intelligence profile
- **Diagnose issues** — identify strategic risks, growth constraints, and execution gaps  
- **Build the plan** — create Level 1/2 goals, 90-day execution plans, KPI trees
- **Run the cadence** — review meeting transcripts, extract action items, track progress
- **Prepare the board** — draft board updates, surface decisions needed
- **Recommend specialists** — identify domain expertise gaps
- **Update the playbook** — capture institutional learnings

## Setup

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the `vector` extension enabled
- An [Anthropic API key](https://console.anthropic.com)

### 2. Install

```bash
git clone https://github.com/wjt221/E3.git
cd E3
npm install
cp .env.example .env.local
```

### 3. Configure environment

Edit `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Initialize database

In the Supabase dashboard → SQL Editor, run:

```sql
-- paste contents of src/lib/db/schema.sql
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Security

- **Tenant isolation**: Every query is scoped to `company_id`. Row Level Security enforced at the database layer.
- **Invite-only auth**: Magic link auth via Supabase. `shouldCreateUser: false` — users must be pre-provisioned.
- **Role-based access**: 5-tier permission model (super_admin → board_member).
- **No cross-company data**: AI context is always company-scoped. System prompt explicitly prohibits cross-company inference.
- **Audit logging**: All sensitive operations are logged immutably.

## Architecture

```
Next.js 15 (App Router, TypeScript)
  ├── Supabase (PostgreSQL + pgvector + Auth + RLS)
  ├── Anthropic Claude API (claude-sonnet-4-6, streaming, tool use)
  └── Voyage AI (optional, embeddings for RAG)
```

## Tests

```bash
npm test
```

## License

Private — E3 / Lodestone Global. All rights reserved.
