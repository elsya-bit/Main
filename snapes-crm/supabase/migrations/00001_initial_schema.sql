-- ============================================================
-- Snapes CRM – Initial Schema
-- Supabase (PostgreSQL) with Row-Level Security
-- ============================================================

-- -----------------------------------------------------------
-- 1. Custom enum types
-- -----------------------------------------------------------

CREATE TYPE user_role     AS ENUM ('Sales', 'MD');
CREATE TYPE lead_status   AS ENUM ('New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost');
CREATE TYPE activity_type AS ENUM ('Call', 'Email');

-- -----------------------------------------------------------
-- 2. Users
-- -----------------------------------------------------------

CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id    UUID UNIQUE NOT NULL,              -- links to auth.users.id
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  role       user_role NOT NULL DEFAULT 'Sales',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_auth_id ON users (auth_id);
CREATE INDEX idx_users_role    ON users (role);

-- -----------------------------------------------------------
-- 3. Leads
-- -----------------------------------------------------------

CREATE TABLE leads (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name       TEXT NOT NULL,
  contact_person     TEXT NOT NULL,
  status             lead_status NOT NULL DEFAULT 'New',
  assigned_to_user_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_assigned  ON leads (assigned_to_user_id);
CREATE INDEX idx_leads_status    ON leads (status);

-- -----------------------------------------------------------
-- 4. Activities
-- -----------------------------------------------------------

CREATE TABLE activities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  type       activity_type NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_lead ON activities (lead_id);

-- -----------------------------------------------------------
-- 5. Automatic updated_at trigger
-- -----------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------------------
-- 6. Row-Level Security
--
-- Policy logic:
--   • MD role  → full access to all rows
--   • Sales    → can only see/modify rows assigned to them
-- -----------------------------------------------------------

-- Helper: look up the app role for the current auth user
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: look up the app user id for the current auth user
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- Users table RLS ----

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select ON users
  FOR SELECT USING (
    get_user_role() = 'MD'              -- MD sees everyone
    OR auth_id = auth.uid()             -- users see themselves
  );

CREATE POLICY users_update ON users
  FOR UPDATE USING (
    auth_id = auth.uid()                -- users update themselves only
  );

-- ---- Leads table RLS ----

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_select ON leads
  FOR SELECT USING (
    get_user_role() = 'MD'
    OR assigned_to_user_id = get_user_id()
  );

CREATE POLICY leads_insert ON leads
  FOR INSERT WITH CHECK (
    get_user_role() = 'MD'
    OR assigned_to_user_id = get_user_id()
  );

CREATE POLICY leads_update ON leads
  FOR UPDATE USING (
    get_user_role() = 'MD'
    OR assigned_to_user_id = get_user_id()
  );

CREATE POLICY leads_delete ON leads
  FOR DELETE USING (
    get_user_role() = 'MD'              -- only MD can delete leads
  );

-- ---- Activities table RLS ----

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Activities inherit visibility from their parent lead.
-- If you can see the lead, you can see/create its activities.

CREATE POLICY activities_select ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = activities.lead_id
        AND (
          get_user_role() = 'MD'
          OR leads.assigned_to_user_id = get_user_id()
        )
    )
  );

CREATE POLICY activities_insert ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = activities.lead_id
        AND (
          get_user_role() = 'MD'
          OR leads.assigned_to_user_id = get_user_id()
        )
    )
  );

CREATE POLICY activities_delete ON activities
  FOR DELETE USING (
    get_user_role() = 'MD'
  );
