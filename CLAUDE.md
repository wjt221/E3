# E3 AI Operating Partner — CLAUDE.md

## Project Overview
This is a production-grade AI Operating Partner for E3 value creation community member companies.
Stack: Next.js 15, TypeScript, Supabase (PostgreSQL + pgvector + Auth), Anthropic Claude API.

## Critical Security Rules

**NEVER violate tenant isolation:**
- Every database query in `src/lib/db/queries.ts` MUST include `.eq('company_id', companyId)`
- The `company_id` is verified in every API route — never skip this check
- Never return data without first calling `verifyCompanyAccess()`
- The Supabase RLS policies are the first defense; application-layer checks are the second

**No client data in:**
- Git commits (the .gitignore covers this, but be careful)
- Test fixtures (use synthetic/fake data only)
- Console logs in production
- Error messages returned to the client

## Architecture

```
src/
├── app/
│   ├── (auth)/         — login flow
│   ├── (dashboard)/    — main app (requires auth)
│   │   └── [companyId]/ — company workspace (requires company access)
│   └── api/            — REST API routes
├── components/
│   ├── chat/           — chat UI (ChatInterface, MessageBubble, ChatInput)
│   ├── artifacts/      — artifact panel
│   └── layout/         — Sidebar, Header
├── lib/
│   ├── ai/             — Claude agent (agent.ts, prompts.ts, tools.ts)
│   ├── auth/           — RBAC roles.ts
│   └── db/             — Supabase client, schema, queries
└── types/              — shared TypeScript types
```

## Key Files

- `src/lib/ai/agent.ts` — streaming agent, tool handlers, text chunking
- `src/lib/ai/prompts.ts` — system prompts, mode detection
- `src/lib/ai/tools.ts` — Claude tool definitions
- `src/lib/db/schema.sql` — full PostgreSQL schema with RLS
- `src/lib/auth/roles.ts` — RBAC permission model
- `src/app/api/chat/route.ts` — main streaming chat endpoint

## Running Locally

```bash
npm install
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
npm run dev
```

## Database Setup

1. Create a Supabase project
2. Enable the `vector` extension in the Supabase dashboard
3. Run `src/lib/db/schema.sql` in the Supabase SQL editor
4. (Optional) Generate updated types: `supabase gen types typescript --project-id <id> > src/lib/db/database.types.ts`

## Testing

```bash
npm test                  # All tests
npm run test:watch        # Watch mode
npm run type-check        # TypeScript validation
```

## AI Model

Default model: `claude-sonnet-4-6`. To change, update `MODEL` in `src/lib/ai/agent.ts`.

## Adding a New Company

1. Via API: `POST /api/companies` (requires `super_admin` role)
2. Assign users via `user_company_access` table or set `user_profiles.company_id`

## Permission Roles

| Role | Access |
|------|--------|
| `super_admin` | All companies, all actions |
| `operating_partner` | Assigned companies, read+write |
| `ceo` | Own company, read+write |
| `domain_specialist` | Assigned company, limited write |
| `board_member` | Assigned company, read-only |
