-- =============================================================================
-- E3 AI Operating Partner — Database Schema
-- Run this in your Supabase SQL editor.
-- Requires: pgvector extension enabled in Supabase dashboard.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================================
-- CORE TENANT TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'enterprise')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  industry        TEXT,
  stage           TEXT CHECK (stage IN ('pre_revenue','early_stage','growth','scale','mature')),
  website         TEXT,
  description     TEXT,
  founded_year    INT,
  employee_count  INT,
  revenue_range   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend Supabase auth.users with E3 profile
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id),
  company_id  UUID REFERENCES companies(id),  -- NULL = multi-company access
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'ceo'
                CHECK (role IN ('super_admin','operating_partner','ceo','domain_specialist','board_member')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User → Company access mapping (for operating partners with multiple companies)
CREATE TABLE IF NOT EXISTS user_company_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'read' CHECK (access_level IN ('read','write','admin')),
  granted_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- =============================================================================
-- DOCUMENTS & EMBEDDINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS source_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN (
    'financial_statement','strategy_deck','meeting_transcript',
    'board_deck','operating_plan','market_analysis',
    'customer_data','website_content','other'
  )),
  file_path     TEXT,
  url           TEXT,
  content_text  TEXT,
  chunk_count   INT NOT NULL DEFAULT 0,
  uploaded_by   UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_id   UUID NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  chunk_index   INT NOT NULL,
  -- 1536-dim for voyage-2, 1024 for voyage-3-lite, 3072 for text-embedding-3-large
  embedding     VECTOR(1024),
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW index for fast approximate nearest-neighbour search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Full-text search fallback
CREATE INDEX IF NOT EXISTS document_chunks_content_fts_idx
  ON document_chunks USING GIN (to_tsvector('english', content));

-- =============================================================================
-- CONVERSATIONS & MESSAGES
-- =============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT,
  mode        TEXT NOT NULL DEFAULT 'learn' CHECK (mode IN (
    'learn','diagnose','plan','cadence','board_prep','specialists','playbook'
  )),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content           TEXT NOT NULL,
  sources           JSONB NOT NULL DEFAULT '[]',
  tool_calls        JSONB,
  mode              TEXT CHECK (mode IN (
    'learn','diagnose','plan','cadence','board_prep','specialists','playbook'
  )),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ARTIFACTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS artifacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN (
    'company_profile','value_creation_thesis','strategic_priorities',
    'execution_plan','kpi_tree','risk_register','board_update',
    'meeting_summary','action_item_list','specialist_recommendations','playbook_entry'
  )),
  title             TEXT NOT NULL,
  content           JSONB NOT NULL,
  version           INT NOT NULL DEFAULT 1,
  created_by        UUID NOT NULL REFERENCES auth.users(id),
  source_message_id UUID REFERENCES messages(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- EXECUTION TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  level           INT NOT NULL CHECK (level IN (1, 2)),
  title           TEXT NOT NULL,
  description     TEXT,
  owner           TEXT,
  success_metric  TEXT,
  due_date        DATE,
  status          TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started','on_track','at_risk','off_track','complete'
  )),
  parent_goal_id  UUID REFERENCES goals(id),
  artifact_id     UUID REFERENCES artifacts(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS action_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  goal_id         UUID REFERENCES goals(id),
  title           TEXT NOT NULL,
  owner           TEXT,
  due_date        DATE,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','blocked')),
  priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  notes           TEXT,
  source_message_id UUID REFERENCES messages(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category        TEXT NOT NULL CHECK (category IN (
    'strategic','financial','operational','market','talent','legal','technology'
  )),
  description     TEXT NOT NULL,
  likelihood      TEXT NOT NULL CHECK (likelihood IN ('high','medium','low')),
  impact          TEXT NOT NULL CHECK (impact IN ('high','medium','low')),
  owner           TEXT,
  mitigation      TEXT,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','mitigating','closed')),
  artifact_id     UUID REFERENCES artifacts(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- AUDIT LOG (immutable append-only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  company_id    UUID REFERENCES companies(id),
  user_id       UUID REFERENCES auth.users(id),
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   UUID,
  metadata      JSONB,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs are append-only — no updates or deletes
CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS companies_org_id_idx ON companies(org_id);
CREATE INDEX IF NOT EXISTS user_profiles_org_id_idx ON user_profiles(org_id);
CREATE INDEX IF NOT EXISTS user_profiles_company_id_idx ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS user_company_access_user_id_idx ON user_company_access(user_id);
CREATE INDEX IF NOT EXISTS user_company_access_company_id_idx ON user_company_access(company_id);
CREATE INDEX IF NOT EXISTS source_documents_company_id_idx ON source_documents(company_id);
CREATE INDEX IF NOT EXISTS document_chunks_company_id_idx ON document_chunks(company_id);
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS conversations_company_id_idx ON conversations(company_id);
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_company_id_idx ON messages(company_id);
CREATE INDEX IF NOT EXISTS artifacts_company_id_idx ON artifacts(company_id);
CREATE INDEX IF NOT EXISTS artifacts_type_idx ON artifacts(company_id, type);
CREATE INDEX IF NOT EXISTS goals_company_id_idx ON goals(company_id);
CREATE INDEX IF NOT EXISTS action_items_company_id_idx ON action_items(company_id);
CREATE INDEX IF NOT EXISTS risks_company_id_idx ON risks(company_id);
CREATE INDEX IF NOT EXISTS audit_logs_company_id_idx ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY
-- All data access is scoped to the authenticated user's company/org.
-- This is the enforcement layer — application code is a secondary check.
-- =============================================================================

ALTER TABLE organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_company_access   ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs            ENABLE ROW LEVEL SECURITY;

-- Helper function: get the calling user's company IDs they have access to
CREATE OR REPLACE FUNCTION get_accessible_company_ids()
RETURNS SETOF UUID
LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT company_id FROM user_company_access
  WHERE user_id = auth.uid()
  UNION
  SELECT company_id FROM user_profiles
  WHERE id = auth.uid() AND company_id IS NOT NULL
$$;

-- Helper function: get calling user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID
LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT org_id FROM user_profiles WHERE id = auth.uid() LIMIT 1
$$;

-- Helper function: check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
$$;

-- ORGANIZATIONS: users see only their org
CREATE POLICY "users_see_own_org" ON organizations
  FOR SELECT USING (id = get_user_org_id());

-- COMPANIES: users see only companies they have access to (or all in org for admins)
CREATE POLICY "users_see_accessible_companies" ON companies
  FOR SELECT USING (
    id IN (SELECT get_accessible_company_ids())
    OR (org_id = get_user_org_id() AND is_super_admin())
  );

CREATE POLICY "admins_manage_companies" ON companies
  FOR ALL USING (org_id = get_user_org_id() AND is_super_admin());

-- USER PROFILES: users see profiles within their org
CREATE POLICY "users_see_org_profiles" ON user_profiles
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "users_update_own_profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- USER COMPANY ACCESS: users see their own access grants
CREATE POLICY "users_see_own_access" ON user_company_access
  FOR SELECT USING (user_id = auth.uid() OR is_super_admin());

CREATE POLICY "admins_manage_access" ON user_company_access
  FOR ALL USING (is_super_admin());

-- SOURCE DOCUMENTS: scoped to accessible companies
CREATE POLICY "company_documents" ON source_documents
  FOR ALL USING (company_id IN (SELECT get_accessible_company_ids()));

-- DOCUMENT CHUNKS: scoped to accessible companies
CREATE POLICY "company_chunks" ON document_chunks
  FOR ALL USING (company_id IN (SELECT get_accessible_company_ids()));

-- CONVERSATIONS: scoped to accessible companies
CREATE POLICY "company_conversations" ON conversations
  FOR ALL USING (company_id IN (SELECT get_accessible_company_ids()));

-- MESSAGES: scoped to accessible companies
CREATE POLICY "company_messages" ON messages
  FOR ALL USING (company_id IN (SELECT get_accessible_company_ids()));

-- ARTIFACTS: scoped to accessible companies; board_members read-only
CREATE POLICY "company_artifacts_read" ON artifacts
  FOR SELECT USING (company_id IN (SELECT get_accessible_company_ids()));

CREATE POLICY "company_artifacts_write" ON artifacts
  FOR INSERT WITH CHECK (
    company_id IN (SELECT get_accessible_company_ids())
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role NOT IN ('board_member')
    )
  );

-- GOALS: scoped to accessible companies
CREATE POLICY "company_goals" ON goals
  FOR ALL USING (company_id IN (SELECT get_accessible_company_ids()));

-- ACTION ITEMS: scoped to accessible companies
CREATE POLICY "company_action_items" ON action_items
  FOR ALL USING (company_id IN (SELECT get_accessible_company_ids()));

-- RISKS: scoped to accessible companies
CREATE POLICY "company_risks" ON risks
  FOR ALL USING (company_id IN (SELECT get_accessible_company_ids()));

-- AUDIT LOGS: users see their own org's logs; super_admin sees all
CREATE POLICY "org_audit_logs" ON audit_logs
  FOR SELECT USING (
    org_id = get_user_org_id()
    AND (is_super_admin() OR user_id = auth.uid())
  );

CREATE POLICY "append_audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- =============================================================================
-- VECTOR SIMILARITY SEARCH FUNCTION
-- Company-scoped — enforced at DB level, not just application level.
-- =============================================================================

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding    VECTOR(1024),
  match_company_id   UUID,
  match_threshold    FLOAT  DEFAULT 0.7,
  match_count        INT    DEFAULT 10
)
RETURNS TABLE (
  id              UUID,
  document_id     UUID,
  content         TEXT,
  chunk_index     INT,
  metadata        JSONB,
  similarity      FLOAT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Verify caller has access to this company
  IF NOT EXISTS (
    SELECT 1 FROM get_accessible_company_ids() WHERE get_accessible_company_ids = match_company_id
  ) THEN
    RAISE EXCEPTION 'Access denied to company %', match_company_id;
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    dc.company_id = match_company_id
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Full-text fallback when no embeddings configured
CREATE OR REPLACE FUNCTION search_document_chunks_fts(
  query_text       TEXT,
  match_company_id UUID,
  match_count      INT DEFAULT 10
)
RETURNS TABLE (
  id          UUID,
  document_id UUID,
  content     TEXT,
  chunk_index INT,
  metadata    JSONB,
  rank        FLOAT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM get_accessible_company_ids() WHERE get_accessible_company_ids = match_company_id
  ) THEN
    RAISE EXCEPTION 'Access denied to company %', match_company_id;
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.metadata,
    ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', query_text)) AS rank
  FROM document_chunks dc
  WHERE
    dc.company_id = match_company_id
    AND to_tsvector('english', dc.content) @@ plainto_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_companies_updated_at       BEFORE UPDATE ON companies       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_user_profiles_updated_at   BEFORE UPDATE ON user_profiles   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_conversations_updated_at   BEFORE UPDATE ON conversations   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_artifacts_updated_at       BEFORE UPDATE ON artifacts       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_goals_updated_at           BEFORE UPDATE ON goals           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_action_items_updated_at    BEFORE UPDATE ON action_items    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_risks_updated_at           BEFORE UPDATE ON risks           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
