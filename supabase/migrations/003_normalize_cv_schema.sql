-- ============================================================
-- Applio — Normalize CV schema
-- Migrates from monolithic cv_data JSONB to relational tables.
-- ============================================================

-- ============================================================
-- 0. ENSURE HELPER FUNCTIONS EXIST (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. BACKUP: Rename old table
-- ============================================================
ALTER TABLE cvs RENAME TO cvs_legacy;

-- Rename indexes if they exist (names may vary across environments)
ALTER INDEX IF EXISTS idx_cvs_user_id RENAME TO idx_cvs_legacy_user_id;
ALTER INDEX IF EXISTS idx_cvs_slug RENAME TO idx_cvs_legacy_slug;

-- Drop old triggers (they reference the renamed table)
DROP TRIGGER IF EXISTS cvs_updated_at ON cvs_legacy;

-- ============================================================
-- 2. CREATE NEW TABLES
-- ============================================================

-- 2a. CVS (metadata only — no more cv_data JSONB)
CREATE TABLE cvs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT 'Mi CV',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  slug         TEXT UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_cvs_slug ON cvs(slug) WHERE slug IS NOT NULL;

-- 2b. PERSONAL_INFO (1:1 with cvs)
CREATE TABLE personal_info (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id        UUID NOT NULL UNIQUE REFERENCES cvs(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL DEFAULT '',
  title        TEXT NOT NULL DEFAULT '',
  photo_url    TEXT,
  email        TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  location     TEXT NOT NULL DEFAULT '',
  linkedin     TEXT NOT NULL DEFAULT '',
  website      TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT,
  website_url  TEXT,
  summary      TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2c. EXPERIENCES (N:1 with cvs)
CREATE TABLE experiences (
  id           TEXT NOT NULL,
  cv_id        UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  company      TEXT NOT NULL DEFAULT '',
  position     TEXT NOT NULL DEFAULT '',
  start_date   TEXT NOT NULL DEFAULT '',
  end_date     TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cv_id, id)
);

CREATE INDEX idx_experiences_cv_id ON experiences(cv_id);

-- 2d. EDUCATION (N:1 with cvs)
CREATE TABLE education (
  id           TEXT NOT NULL,
  cv_id        UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  institution  TEXT NOT NULL DEFAULT '',
  degree       TEXT NOT NULL DEFAULT '',
  start_date   TEXT NOT NULL DEFAULT '',
  end_date     TEXT NOT NULL DEFAULT '',
  description  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cv_id, id)
);

CREATE INDEX idx_education_cv_id ON education(cv_id);

-- 2e. SKILL_CATEGORIES (N:1 with cvs)
CREATE TABLE skill_categories (
  id           TEXT NOT NULL,
  cv_id        UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  category     TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cv_id, id)
);

CREATE INDEX idx_skill_categories_cv_id ON skill_categories(cv_id);

-- 2f. SKILL_ITEMS (N:1 with skill_categories)
CREATE TABLE skill_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id             UUID NOT NULL,
  skill_category_id TEXT NOT NULL,
  name              TEXT NOT NULL,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (cv_id, skill_category_id) REFERENCES skill_categories(cv_id, id) ON DELETE CASCADE
);

CREATE INDEX idx_skill_items_category ON skill_items(cv_id, skill_category_id);

-- 2g. COURSES (N:1 with cvs)
CREATE TABLE courses (
  id           TEXT NOT NULL,
  cv_id        UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT '',
  institution  TEXT NOT NULL DEFAULT '',
  date         TEXT NOT NULL DEFAULT '',
  description  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cv_id, id)
);

CREATE INDEX idx_courses_cv_id ON courses(cv_id);

-- 2h. CERTIFICATIONS (N:1 with cvs)
CREATE TABLE certifications (
  id           TEXT NOT NULL,
  cv_id        UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT '',
  issuer       TEXT NOT NULL DEFAULT '',
  date         TEXT NOT NULL DEFAULT '',
  description  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cv_id, id)
);

CREATE INDEX idx_certifications_cv_id ON certifications(cv_id);

-- 2i. AWARDS (N:1 with cvs)
CREATE TABLE awards (
  id           TEXT NOT NULL,
  cv_id        UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT '',
  issuer       TEXT NOT NULL DEFAULT '',
  date         TEXT NOT NULL DEFAULT '',
  description  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cv_id, id)
);

CREATE INDEX idx_awards_cv_id ON awards(cv_id);

-- 2j. CV_VISIBILITY (1:1 with cvs)
CREATE TABLE cv_visibility (
  cv_id               UUID PRIMARY KEY REFERENCES cvs(id) ON DELETE CASCADE,
  show_location       BOOLEAN NOT NULL DEFAULT TRUE,
  show_linkedin       BOOLEAN NOT NULL DEFAULT TRUE,
  show_website        BOOLEAN NOT NULL DEFAULT TRUE,
  show_summary        BOOLEAN NOT NULL DEFAULT TRUE,
  show_courses        BOOLEAN NOT NULL DEFAULT FALSE,
  show_certifications BOOLEAN NOT NULL DEFAULT FALSE,
  show_awards         BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2k. CV_SETTINGS (1:1 with cvs)
CREATE TABLE cv_settings (
  cv_id                      UUID PRIMARY KEY REFERENCES cvs(id) ON DELETE CASCADE,
  color_scheme               TEXT NOT NULL DEFAULT 'ivory',
  font_family                TEXT NOT NULL DEFAULT 'inter',
  font_size_level            INTEGER NOT NULL DEFAULT 2,
  theme                      TEXT NOT NULL DEFAULT 'light',
  locale                     TEXT NOT NULL DEFAULT 'en',
  pattern_name               TEXT NOT NULL DEFAULT 'none',
  pattern_sidebar_intensity  INTEGER NOT NULL DEFAULT 3,
  pattern_main_intensity     INTEGER NOT NULL DEFAULT 2,
  pattern_scope              TEXT NOT NULL DEFAULT 'sidebar'
);

-- 2l. CV_SIDEBAR_SECTIONS (N:1 with cvs, ordering table)
CREATE TABLE cv_sidebar_sections (
  cv_id      UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (cv_id, section_id)
);

-- ============================================================
-- 3. TRIGGERS
-- ============================================================

-- Auto-update updated_at (reuses existing function from 001_initial_schema)
CREATE TRIGGER cvs_updated_at
  BEFORE UPDATE ON cvs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER personal_info_updated_at
  BEFORE UPDATE ON personal_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER experiences_updated_at
  BEFORE UPDATE ON experiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER education_updated_at
  BEFORE UPDATE ON education
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER skill_categories_updated_at
  BEFORE UPDATE ON skill_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER certifications_updated_at
  BEFORE UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER awards_updated_at
  BEFORE UPDATE ON awards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Sync cvs.title from personal_info.full_name
CREATE OR REPLACE FUNCTION sync_cv_title_from_personal_info()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    UPDATE cvs
    SET title = 'CV - ' || COALESCE(NULLIF(TRIM(NEW.full_name), ''), 'Mi CV')
    WHERE id = NEW.cv_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER personal_info_sync_title
  AFTER UPDATE OF full_name ON personal_info
  FOR EACH ROW EXECUTE FUNCTION sync_cv_title_from_personal_info();

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_sidebar_sections ENABLE ROW LEVEL SECURITY;

-- Helper: check if user owns a CV
CREATE OR REPLACE FUNCTION user_owns_cv(p_cv_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM cvs WHERE id = p_cv_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if a CV is published
CREATE OR REPLACE FUNCTION cv_is_published(p_cv_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM cvs WHERE id = p_cv_id AND is_published = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- CVs table policies
CREATE POLICY "Users can view own CVs"
  ON cvs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CVs"
  ON cvs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CVs"
  ON cvs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CVs"
  ON cvs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published CVs"
  ON cvs FOR SELECT USING (is_published = TRUE);

-- Macro: child table policies (owner CRUD + public read for published)
-- personal_info
CREATE POLICY "Owner can select personal_info"
  ON personal_info FOR SELECT USING (user_owns_cv(cv_id) OR cv_is_published(cv_id));
CREATE POLICY "Owner can insert personal_info"
  ON personal_info FOR INSERT WITH CHECK (user_owns_cv(cv_id));
CREATE POLICY "Owner can update personal_info"
  ON personal_info FOR UPDATE USING (user_owns_cv(cv_id));
CREATE POLICY "Owner can delete personal_info"
  ON personal_info FOR DELETE USING (user_owns_cv(cv_id));

-- experiences
CREATE POLICY "Owner can select experiences"
  ON experiences FOR SELECT USING (user_owns_cv(cv_id) OR cv_is_published(cv_id));
CREATE POLICY "Owner can insert experiences"
  ON experiences FOR INSERT WITH CHECK (user_owns_cv(cv_id));
CREATE POLICY "Owner can update experiences"
  ON experiences FOR UPDATE USING (user_owns_cv(cv_id));
CREATE POLICY "Owner can delete experiences"
  ON experiences FOR DELETE USING (user_owns_cv(cv_id));

-- education
CREATE POLICY "Owner can select education"
  ON education FOR SELECT USING (user_owns_cv(cv_id) OR cv_is_published(cv_id));
CREATE POLICY "Owner can insert education"
  ON education FOR INSERT WITH CHECK (user_owns_cv(cv_id));
CREATE POLICY "Owner can update education"
  ON education FOR UPDATE USING (user_owns_cv(cv_id));
CREATE POLICY "Owner can delete education"
  ON education FOR DELETE USING (user_owns_cv(cv_id));

-- skill_categories
CREATE POLICY "Owner can select skill_categories"
  ON skill_categories FOR SELECT USING (user_owns_cv(cv_id) OR cv_is_published(cv_id));
CREATE POLICY "Owner can insert skill_categories"
  ON skill_categories FOR INSERT WITH CHECK (user_owns_cv(cv_id));
CREATE POLICY "Owner can update skill_categories"
  ON skill_categories FOR UPDATE USING (user_owns_cv(cv_id));
CREATE POLICY "Owner can delete skill_categories"
  ON skill_categories FOR DELETE USING (user_owns_cv(cv_id));

-- skill_items
CREATE POLICY "Owner can select skill_items"
  ON skill_items FOR SELECT USING (user_owns_cv(cv_id) OR cv_is_published(cv_id));
CREATE POLICY "Owner can insert skill_items"
  ON skill_items FOR INSERT WITH CHECK (user_owns_cv(cv_id));
CREATE POLICY "Owner can update skill_items"
  ON skill_items FOR UPDATE USING (user_owns_cv(cv_id));
CREATE POLICY "Owner can delete skill_items"
  ON skill_items FOR DELETE USING (user_owns_cv(cv_id));

-- courses
CREATE POLICY "Owner can select courses"
  ON courses FOR SELECT USING (user_owns_cv(cv_id) OR cv_is_published(cv_id));
CREATE POLICY "Owner can insert courses"
  ON courses FOR INSERT WITH CHECK (user_owns_cv(cv_id));
CREATE POLICY "Owner can update courses"
  ON courses FOR UPDATE USING (user_owns_cv(cv_id));
CREATE POLICY "Owner can delete courses"
  ON courses FOR DELETE USING (user_owns_cv(cv_id));

-- certifications
CREATE POLICY "Owner can select certifications"
  ON certifications FOR SELECT USING (user_owns_cv(cv_id) OR cv_is_published(cv_id));
CREATE POLICY "Owner can insert certifications"
  ON certifications FOR INSERT WITH CHECK (user_owns_cv(cv_id));
CREATE POLICY "Owner can update certifications"
  ON certifications FOR UPDATE USING (user_owns_cv(cv_id));
CREATE POLICY "Owner can delete certifications"
  ON certifications FOR DELETE USING (user_owns_cv(cv_id));

-- awards
CREATE POLICY "Owner can select awards"
  ON awards FOR SELECT USING (user_owns_cv(cv_id) OR cv_is_published(cv_id));
CREATE POLICY "Owner can insert awards"
  ON awards FOR INSERT WITH CHECK (user_owns_cv(cv_id));
CREATE POLICY "Owner can update awards"
  ON awards FOR UPDATE USING (user_owns_cv(cv_id));
CREATE POLICY "Owner can delete awards"
  ON awards FOR DELETE USING (user_owns_cv(cv_id));

-- cv_visibility
CREATE POLICY "Owner can select cv_visibility"
  ON cv_visibility FOR SELECT USING (user_owns_cv(cv_id) OR cv_is_published(cv_id));
CREATE POLICY "Owner can insert cv_visibility"
  ON cv_visibility FOR INSERT WITH CHECK (user_owns_cv(cv_id));
CREATE POLICY "Owner can update cv_visibility"
  ON cv_visibility FOR UPDATE USING (user_owns_cv(cv_id));
CREATE POLICY "Owner can delete cv_visibility"
  ON cv_visibility FOR DELETE USING (user_owns_cv(cv_id));

-- cv_settings
CREATE POLICY "Owner can select cv_settings"
  ON cv_settings FOR SELECT USING (user_owns_cv(cv_id) OR cv_is_published(cv_id));
CREATE POLICY "Owner can insert cv_settings"
  ON cv_settings FOR INSERT WITH CHECK (user_owns_cv(cv_id));
CREATE POLICY "Owner can update cv_settings"
  ON cv_settings FOR UPDATE USING (user_owns_cv(cv_id));
CREATE POLICY "Owner can delete cv_settings"
  ON cv_settings FOR DELETE USING (user_owns_cv(cv_id));

-- cv_sidebar_sections
CREATE POLICY "Owner can select cv_sidebar_sections"
  ON cv_sidebar_sections FOR SELECT USING (user_owns_cv(cv_id) OR cv_is_published(cv_id));
CREATE POLICY "Owner can insert cv_sidebar_sections"
  ON cv_sidebar_sections FOR INSERT WITH CHECK (user_owns_cv(cv_id));
CREATE POLICY "Owner can update cv_sidebar_sections"
  ON cv_sidebar_sections FOR UPDATE USING (user_owns_cv(cv_id));
CREATE POLICY "Owner can delete cv_sidebar_sections"
  ON cv_sidebar_sections FOR DELETE USING (user_owns_cv(cv_id));

-- ============================================================
-- 5. PL/pgSQL FUNCTIONS
-- ============================================================

-- 5a. save_cv_data — Atomic upsert of all CV content
CREATE OR REPLACE FUNCTION save_cv_data(
  p_cv_id UUID,
  p_personal_info JSONB,
  p_summary TEXT,
  p_experience JSONB,
  p_education JSONB,
  p_skills JSONB,
  p_courses JSONB,
  p_certifications JSONB,
  p_awards JSONB,
  p_visibility JSONB,
  p_sidebar_order TEXT[]
)
RETURNS VOID AS $$
DECLARE
  v_item JSONB;
  v_skill_item TEXT;
  v_idx INTEGER;
  v_item_idx INTEGER;
  v_section TEXT;
  v_existing_ids TEXT[];
  v_incoming_ids TEXT[];
BEGIN
  -- Verify ownership
  IF NOT EXISTS (SELECT 1 FROM cvs WHERE id = p_cv_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: user does not own this CV';
  END IF;

  -- Touch parent updated_at
  UPDATE cvs SET updated_at = now() WHERE id = p_cv_id;

  -- 1. Personal Info (upsert 1:1)
  INSERT INTO personal_info (cv_id, full_name, title, photo_url, email, phone, location, linkedin, website, linkedin_url, website_url, summary)
  VALUES (
    p_cv_id,
    COALESCE(p_personal_info->>'fullName', ''),
    COALESCE(p_personal_info->>'title', ''),
    p_personal_info->>'photo',
    COALESCE(p_personal_info->>'email', ''),
    COALESCE(p_personal_info->>'phone', ''),
    COALESCE(p_personal_info->>'location', ''),
    COALESCE(p_personal_info->>'linkedin', ''),
    COALESCE(p_personal_info->>'website', ''),
    p_personal_info->>'linkedinUrl',
    p_personal_info->>'websiteUrl',
    COALESCE(p_summary, '')
  )
  ON CONFLICT (cv_id) DO UPDATE SET
    full_name    = EXCLUDED.full_name,
    title        = EXCLUDED.title,
    photo_url    = EXCLUDED.photo_url,
    email        = EXCLUDED.email,
    phone        = EXCLUDED.phone,
    location     = EXCLUDED.location,
    linkedin     = EXCLUDED.linkedin,
    website      = EXCLUDED.website,
    linkedin_url = EXCLUDED.linkedin_url,
    website_url  = EXCLUDED.website_url,
    summary      = EXCLUDED.summary;

  -- 2. Experiences
  SELECT ARRAY(SELECT e->>'id' FROM jsonb_array_elements(COALESCE(p_experience, '[]'::jsonb)) AS e) INTO v_incoming_ids;
  DELETE FROM experiences WHERE cv_id = p_cv_id AND id != ALL(v_incoming_ids);

  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_experience, '[]'::jsonb)) LOOP
    INSERT INTO experiences (id, cv_id, company, position, start_date, end_date, description, sort_order)
    VALUES (
      v_item->>'id', p_cv_id,
      COALESCE(v_item->>'company', ''),
      COALESCE(v_item->>'position', ''),
      COALESCE(v_item->>'startDate', ''),
      COALESCE(v_item->>'endDate', ''),
      COALESCE(v_item->>'description', ''),
      v_idx
    )
    ON CONFLICT (cv_id, id) DO UPDATE SET
      company     = EXCLUDED.company,
      position    = EXCLUDED.position,
      start_date  = EXCLUDED.start_date,
      end_date    = EXCLUDED.end_date,
      description = EXCLUDED.description,
      sort_order  = EXCLUDED.sort_order;
    v_idx := v_idx + 1;
  END LOOP;

  -- 3. Education
  SELECT ARRAY(SELECT e->>'id' FROM jsonb_array_elements(COALESCE(p_education, '[]'::jsonb)) AS e) INTO v_incoming_ids;
  DELETE FROM education WHERE cv_id = p_cv_id AND id != ALL(v_incoming_ids);

  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_education, '[]'::jsonb)) LOOP
    INSERT INTO education (id, cv_id, institution, degree, start_date, end_date, description, sort_order)
    VALUES (
      v_item->>'id', p_cv_id,
      COALESCE(v_item->>'institution', ''),
      COALESCE(v_item->>'degree', ''),
      COALESCE(v_item->>'startDate', ''),
      COALESCE(v_item->>'endDate', ''),
      v_item->>'description',
      v_idx
    )
    ON CONFLICT (cv_id, id) DO UPDATE SET
      institution = EXCLUDED.institution,
      degree      = EXCLUDED.degree,
      start_date  = EXCLUDED.start_date,
      end_date    = EXCLUDED.end_date,
      description = EXCLUDED.description,
      sort_order  = EXCLUDED.sort_order;
    v_idx := v_idx + 1;
  END LOOP;

  -- 4. Skills (categories + items)
  SELECT ARRAY(SELECT s->>'id' FROM jsonb_array_elements(COALESCE(p_skills, '[]'::jsonb)) AS s) INTO v_incoming_ids;
  DELETE FROM skill_categories WHERE cv_id = p_cv_id AND id != ALL(v_incoming_ids);

  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_skills, '[]'::jsonb)) LOOP
    INSERT INTO skill_categories (id, cv_id, category, sort_order)
    VALUES (v_item->>'id', p_cv_id, COALESCE(v_item->>'category', ''), v_idx)
    ON CONFLICT (cv_id, id) DO UPDATE SET
      category   = EXCLUDED.category,
      sort_order = EXCLUDED.sort_order;

    -- Replace items for this category (simpler than diffing strings)
    DELETE FROM skill_items WHERE cv_id = p_cv_id AND skill_category_id = v_item->>'id';
    v_item_idx := 0;
    FOR v_skill_item IN SELECT jsonb_array_elements_text(COALESCE(v_item->'items', '[]'::jsonb)) LOOP
      INSERT INTO skill_items (cv_id, skill_category_id, name, sort_order)
      VALUES (p_cv_id, v_item->>'id', v_skill_item, v_item_idx);
      v_item_idx := v_item_idx + 1;
    END LOOP;

    v_idx := v_idx + 1;
  END LOOP;

  -- 5. Courses
  SELECT ARRAY(SELECT c->>'id' FROM jsonb_array_elements(COALESCE(p_courses, '[]'::jsonb)) AS c) INTO v_incoming_ids;
  DELETE FROM courses WHERE cv_id = p_cv_id AND id != ALL(v_incoming_ids);

  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_courses, '[]'::jsonb)) LOOP
    INSERT INTO courses (id, cv_id, name, institution, date, description, sort_order)
    VALUES (
      v_item->>'id', p_cv_id,
      COALESCE(v_item->>'name', ''),
      COALESCE(v_item->>'institution', ''),
      COALESCE(v_item->>'date', ''),
      v_item->>'description',
      v_idx
    )
    ON CONFLICT (cv_id, id) DO UPDATE SET
      name        = EXCLUDED.name,
      institution = EXCLUDED.institution,
      date        = EXCLUDED.date,
      description = EXCLUDED.description,
      sort_order  = EXCLUDED.sort_order;
    v_idx := v_idx + 1;
  END LOOP;

  -- 6. Certifications
  SELECT ARRAY(SELECT c->>'id' FROM jsonb_array_elements(COALESCE(p_certifications, '[]'::jsonb)) AS c) INTO v_incoming_ids;
  DELETE FROM certifications WHERE cv_id = p_cv_id AND id != ALL(v_incoming_ids);

  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_certifications, '[]'::jsonb)) LOOP
    INSERT INTO certifications (id, cv_id, name, issuer, date, description, sort_order)
    VALUES (
      v_item->>'id', p_cv_id,
      COALESCE(v_item->>'name', ''),
      COALESCE(v_item->>'issuer', ''),
      COALESCE(v_item->>'date', ''),
      v_item->>'description',
      v_idx
    )
    ON CONFLICT (cv_id, id) DO UPDATE SET
      name        = EXCLUDED.name,
      issuer      = EXCLUDED.issuer,
      date        = EXCLUDED.date,
      description = EXCLUDED.description,
      sort_order  = EXCLUDED.sort_order;
    v_idx := v_idx + 1;
  END LOOP;

  -- 7. Awards
  SELECT ARRAY(SELECT a->>'id' FROM jsonb_array_elements(COALESCE(p_awards, '[]'::jsonb)) AS a) INTO v_incoming_ids;
  DELETE FROM awards WHERE cv_id = p_cv_id AND id != ALL(v_incoming_ids);

  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_awards, '[]'::jsonb)) LOOP
    INSERT INTO awards (id, cv_id, name, issuer, date, description, sort_order)
    VALUES (
      v_item->>'id', p_cv_id,
      COALESCE(v_item->>'name', ''),
      COALESCE(v_item->>'issuer', ''),
      COALESCE(v_item->>'date', ''),
      v_item->>'description',
      v_idx
    )
    ON CONFLICT (cv_id, id) DO UPDATE SET
      name        = EXCLUDED.name,
      issuer      = EXCLUDED.issuer,
      date        = EXCLUDED.date,
      description = EXCLUDED.description,
      sort_order  = EXCLUDED.sort_order;
    v_idx := v_idx + 1;
  END LOOP;

  -- 8. Visibility (upsert 1:1)
  INSERT INTO cv_visibility (cv_id, show_location, show_linkedin, show_website, show_summary, show_courses, show_certifications, show_awards)
  VALUES (
    p_cv_id,
    COALESCE((p_visibility->>'location')::boolean, TRUE),
    COALESCE((p_visibility->>'linkedin')::boolean, TRUE),
    COALESCE((p_visibility->>'website')::boolean, TRUE),
    COALESCE((p_visibility->>'summary')::boolean, TRUE),
    COALESCE((p_visibility->>'courses')::boolean, FALSE),
    COALESCE((p_visibility->>'certifications')::boolean, FALSE),
    COALESCE((p_visibility->>'awards')::boolean, FALSE)
  )
  ON CONFLICT (cv_id) DO UPDATE SET
    show_location       = EXCLUDED.show_location,
    show_linkedin       = EXCLUDED.show_linkedin,
    show_website        = EXCLUDED.show_website,
    show_summary        = EXCLUDED.show_summary,
    show_courses        = EXCLUDED.show_courses,
    show_certifications = EXCLUDED.show_certifications,
    show_awards         = EXCLUDED.show_awards;

  -- 9. Sidebar Order (replace all)
  DELETE FROM cv_sidebar_sections WHERE cv_id = p_cv_id;
  v_idx := 0;
  FOREACH v_section IN ARRAY COALESCE(p_sidebar_order, ARRAY['contact','summary','skills']) LOOP
    INSERT INTO cv_sidebar_sections (cv_id, section_id, sort_order)
    VALUES (p_cv_id, v_section, v_idx);
    v_idx := v_idx + 1;
  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5b. save_cv_settings — Save visual settings separately
CREATE OR REPLACE FUNCTION save_cv_settings(
  p_cv_id UUID,
  p_color_scheme TEXT,
  p_font_family TEXT,
  p_font_size_level INTEGER,
  p_theme TEXT,
  p_locale TEXT,
  p_pattern_name TEXT,
  p_pattern_sidebar_intensity INTEGER,
  p_pattern_main_intensity INTEGER,
  p_pattern_scope TEXT
)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cvs WHERE id = p_cv_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: user does not own this CV';
  END IF;

  INSERT INTO cv_settings (cv_id, color_scheme, font_family, font_size_level, theme, locale, pattern_name, pattern_sidebar_intensity, pattern_main_intensity, pattern_scope)
  VALUES (p_cv_id, p_color_scheme, p_font_family, p_font_size_level, p_theme, p_locale, p_pattern_name, p_pattern_sidebar_intensity, p_pattern_main_intensity, p_pattern_scope)
  ON CONFLICT (cv_id) DO UPDATE SET
    color_scheme              = EXCLUDED.color_scheme,
    font_family               = EXCLUDED.font_family,
    font_size_level           = EXCLUDED.font_size_level,
    theme                     = EXCLUDED.theme,
    locale                    = EXCLUDED.locale,
    pattern_name              = EXCLUDED.pattern_name,
    pattern_sidebar_intensity = EXCLUDED.pattern_sidebar_intensity,
    pattern_main_intensity    = EXCLUDED.pattern_main_intensity,
    pattern_scope             = EXCLUDED.pattern_scope;

  UPDATE cvs SET updated_at = now() WHERE id = p_cv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5c. load_full_cv — Assemble all tables into CVRow-compatible JSONB
CREATE OR REPLACE FUNCTION load_full_cv(p_cv_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_cv RECORD;
  v_pi RECORD;
  v_vis RECORD;
  v_set RECORD;
  v_experience JSONB;
  v_education JSONB;
  v_skills JSONB;
  v_courses JSONB;
  v_certifications JSONB;
  v_awards JSONB;
  v_sidebar_order JSONB;
BEGIN
  SELECT * INTO v_cv FROM cvs WHERE id = p_cv_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Personal info
  SELECT * INTO v_pi FROM personal_info WHERE cv_id = p_cv_id;

  -- Experience
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'company', e.company,
      'position', e.position,
      'startDate', e.start_date,
      'endDate', e.end_date,
      'description', e.description
    ) ORDER BY e.sort_order
  ), '[]'::jsonb)
  INTO v_experience
  FROM experiences e WHERE e.cv_id = p_cv_id;

  -- Education
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'institution', e.institution,
      'degree', e.degree,
      'startDate', e.start_date,
      'endDate', e.end_date,
      'description', e.description
    ) ORDER BY e.sort_order
  ), '[]'::jsonb)
  INTO v_education
  FROM education e WHERE e.cv_id = p_cv_id;

  -- Skills (with nested items)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', sc.id,
      'category', sc.category,
      'items', COALESCE((
        SELECT jsonb_agg(si.name ORDER BY si.sort_order)
        FROM skill_items si
        WHERE si.cv_id = p_cv_id AND si.skill_category_id = sc.id
      ), '[]'::jsonb)
    ) ORDER BY sc.sort_order
  ), '[]'::jsonb)
  INTO v_skills
  FROM skill_categories sc WHERE sc.cv_id = p_cv_id;

  -- Courses
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'institution', c.institution,
      'date', c.date,
      'description', c.description
    ) ORDER BY c.sort_order
  ), '[]'::jsonb)
  INTO v_courses
  FROM courses c WHERE c.cv_id = p_cv_id;

  -- Certifications
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'issuer', c.issuer,
      'date', c.date,
      'description', c.description
    ) ORDER BY c.sort_order
  ), '[]'::jsonb)
  INTO v_certifications
  FROM certifications c WHERE c.cv_id = p_cv_id;

  -- Awards
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'name', a.name,
      'issuer', a.issuer,
      'date', a.date,
      'description', a.description
    ) ORDER BY a.sort_order
  ), '[]'::jsonb)
  INTO v_awards
  FROM awards a WHERE a.cv_id = p_cv_id;

  -- Visibility
  SELECT * INTO v_vis FROM cv_visibility WHERE cv_id = p_cv_id;

  -- Settings
  SELECT * INTO v_set FROM cv_settings WHERE cv_id = p_cv_id;

  -- Sidebar order
  SELECT COALESCE(jsonb_agg(ss.section_id ORDER BY ss.sort_order), '[]'::jsonb)
  INTO v_sidebar_order
  FROM cv_sidebar_sections ss WHERE ss.cv_id = p_cv_id;

  -- Assemble into CVRow-compatible shape
  RETURN jsonb_build_object(
    'id', v_cv.id,
    'user_id', v_cv.user_id,
    'title', v_cv.title,
    'is_published', v_cv.is_published,
    'slug', v_cv.slug,
    'created_at', v_cv.created_at,
    'updated_at', v_cv.updated_at,
    'cv_data', jsonb_build_object(
      'personalInfo', jsonb_build_object(
        'fullName', COALESCE(v_pi.full_name, ''),
        'title', COALESCE(v_pi.title, ''),
        'photo', v_pi.photo_url,
        'email', COALESCE(v_pi.email, ''),
        'phone', COALESCE(v_pi.phone, ''),
        'location', COALESCE(v_pi.location, ''),
        'linkedin', COALESCE(v_pi.linkedin, ''),
        'website', COALESCE(v_pi.website, ''),
        'linkedinUrl', v_pi.linkedin_url,
        'websiteUrl', v_pi.website_url
      ),
      'summary', COALESCE(v_pi.summary, ''),
      'experience', v_experience,
      'education', v_education,
      'skills', v_skills,
      'courses', v_courses,
      'certifications', v_certifications,
      'awards', v_awards,
      'visibility', jsonb_build_object(
        'location', COALESCE(v_vis.show_location, TRUE),
        'linkedin', COALESCE(v_vis.show_linkedin, TRUE),
        'website', COALESCE(v_vis.show_website, TRUE),
        'summary', COALESCE(v_vis.show_summary, TRUE),
        'courses', COALESCE(v_vis.show_courses, FALSE),
        'certifications', COALESCE(v_vis.show_certifications, FALSE),
        'awards', COALESCE(v_vis.show_awards, FALSE)
      ),
      'sidebarOrder', v_sidebar_order
    ),
    'settings', CASE WHEN v_set IS NULL THEN '{}'::jsonb ELSE jsonb_build_object(
      'colorScheme', v_set.color_scheme,
      'fontFamily', v_set.font_family,
      'fontSizeLevel', v_set.font_size_level,
      'theme', v_set.theme,
      'locale', v_set.locale,
      'pattern', jsonb_build_object(
        'name', v_set.pattern_name,
        'sidebarIntensity', v_set.pattern_sidebar_intensity,
        'mainIntensity', v_set.pattern_main_intensity,
        'scope', v_set.pattern_scope
      )
    ) END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5d. create_cv_full — Atomic create of new CV with all data
CREATE OR REPLACE FUNCTION create_cv_full(
  p_user_id UUID,
  p_title TEXT,
  p_personal_info JSONB,
  p_summary TEXT,
  p_experience JSONB,
  p_education JSONB,
  p_skills JSONB,
  p_courses JSONB,
  p_certifications JSONB,
  p_awards JSONB,
  p_visibility JSONB,
  p_sidebar_order TEXT[],
  p_settings JSONB
)
RETURNS UUID AS $$
DECLARE
  v_cv_id UUID;
BEGIN
  -- Create the CV row
  INSERT INTO cvs (user_id, title)
  VALUES (p_user_id, COALESCE(p_title, 'Mi CV'))
  RETURNING id INTO v_cv_id;

  -- Save all data using the existing function
  PERFORM save_cv_data(
    v_cv_id, p_personal_info, p_summary,
    p_experience, p_education, p_skills,
    p_courses, p_certifications, p_awards,
    p_visibility, p_sidebar_order
  );

  -- Save settings if provided
  IF p_settings IS NOT NULL AND p_settings != '{}'::jsonb THEN
    PERFORM save_cv_settings(
      v_cv_id,
      COALESCE(p_settings->>'colorScheme', 'ivory'),
      COALESCE(p_settings->>'fontFamily', 'inter'),
      COALESCE((p_settings->>'fontSizeLevel')::integer, 2),
      COALESCE(p_settings->>'theme', 'light'),
      COALESCE(p_settings->>'locale', 'en'),
      COALESCE(p_settings->'pattern'->>'name', 'none'),
      COALESCE((p_settings->'pattern'->>'sidebarIntensity')::integer, 3),
      COALESCE((p_settings->'pattern'->>'mainIntensity')::integer, 2),
      COALESCE(p_settings->'pattern'->>'scope', 'sidebar')
    );
  END IF;

  RETURN v_cv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. DATA MIGRATION — Move cvs_legacy → normalized tables
-- ============================================================
DO $$
DECLARE
  r RECORD;
  v_item JSONB;
  v_skill_item TEXT;
  v_section TEXT;
  v_idx INTEGER;
  v_item_idx INTEGER;
BEGIN
  FOR r IN SELECT * FROM cvs_legacy LOOP

    -- Create new cv row (preserve original id, slug, timestamps)
    INSERT INTO cvs (id, user_id, title, is_published, slug, created_at, updated_at)
    VALUES (r.id, r.user_id, r.title, r.is_published, r.slug, r.created_at, r.updated_at);

    -- Personal info + summary
    INSERT INTO personal_info (cv_id, full_name, title, photo_url, email, phone, location, linkedin, website, linkedin_url, website_url, summary)
    VALUES (
      r.id,
      COALESCE(r.cv_data->'personalInfo'->>'fullName', ''),
      COALESCE(r.cv_data->'personalInfo'->>'title', ''),
      CASE
        WHEN (r.cv_data->'personalInfo'->>'photo') LIKE 'data:%' THEN NULL
        ELSE r.cv_data->'personalInfo'->>'photo'
      END,
      COALESCE(r.cv_data->'personalInfo'->>'email', ''),
      COALESCE(r.cv_data->'personalInfo'->>'phone', ''),
      COALESCE(r.cv_data->'personalInfo'->>'location', ''),
      COALESCE(r.cv_data->'personalInfo'->>'linkedin', ''),
      COALESCE(r.cv_data->'personalInfo'->>'website', ''),
      r.cv_data->'personalInfo'->>'linkedinUrl',
      r.cv_data->'personalInfo'->>'websiteUrl',
      COALESCE(r.cv_data->>'summary', '')
    );

    -- Update cvs.title with actual name
    UPDATE cvs
    SET title = 'CV - ' || COALESCE(NULLIF(TRIM(r.cv_data->'personalInfo'->>'fullName'), ''), 'Mi CV')
    WHERE id = r.id;

    -- Experiences
    v_idx := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(r.cv_data->'experience', '[]'::jsonb)) LOOP
      INSERT INTO experiences (id, cv_id, company, position, start_date, end_date, description, sort_order)
      VALUES (
        v_item->>'id', r.id,
        COALESCE(v_item->>'company', ''),
        COALESCE(v_item->>'position', ''),
        COALESCE(v_item->>'startDate', ''),
        COALESCE(v_item->>'endDate', ''),
        COALESCE(v_item->>'description', ''),
        v_idx
      );
      v_idx := v_idx + 1;
    END LOOP;

    -- Education
    v_idx := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(r.cv_data->'education', '[]'::jsonb)) LOOP
      INSERT INTO education (id, cv_id, institution, degree, start_date, end_date, description, sort_order)
      VALUES (
        v_item->>'id', r.id,
        COALESCE(v_item->>'institution', ''),
        COALESCE(v_item->>'degree', ''),
        COALESCE(v_item->>'startDate', ''),
        COALESCE(v_item->>'endDate', ''),
        v_item->>'description',
        v_idx
      );
      v_idx := v_idx + 1;
    END LOOP;

    -- Skill categories + items
    v_idx := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(r.cv_data->'skills', '[]'::jsonb)) LOOP
      INSERT INTO skill_categories (id, cv_id, category, sort_order)
      VALUES (v_item->>'id', r.id, COALESCE(v_item->>'category', ''), v_idx);

      v_item_idx := 0;
      FOR v_skill_item IN SELECT jsonb_array_elements_text(COALESCE(v_item->'items', '[]'::jsonb)) LOOP
        INSERT INTO skill_items (cv_id, skill_category_id, name, sort_order)
        VALUES (r.id, v_item->>'id', v_skill_item, v_item_idx);
        v_item_idx := v_item_idx + 1;
      END LOOP;

      v_idx := v_idx + 1;
    END LOOP;

    -- Courses
    v_idx := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(r.cv_data->'courses', '[]'::jsonb)) LOOP
      INSERT INTO courses (id, cv_id, name, institution, date, description, sort_order)
      VALUES (
        v_item->>'id', r.id,
        COALESCE(v_item->>'name', ''),
        COALESCE(v_item->>'institution', ''),
        COALESCE(v_item->>'date', ''),
        v_item->>'description',
        v_idx
      );
      v_idx := v_idx + 1;
    END LOOP;

    -- Certifications
    v_idx := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(r.cv_data->'certifications', '[]'::jsonb)) LOOP
      INSERT INTO certifications (id, cv_id, name, issuer, date, description, sort_order)
      VALUES (
        v_item->>'id', r.id,
        COALESCE(v_item->>'name', ''),
        COALESCE(v_item->>'issuer', ''),
        COALESCE(v_item->>'date', ''),
        v_item->>'description',
        v_idx
      );
      v_idx := v_idx + 1;
    END LOOP;

    -- Awards
    v_idx := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(r.cv_data->'awards', '[]'::jsonb)) LOOP
      INSERT INTO awards (id, cv_id, name, issuer, date, description, sort_order)
      VALUES (
        v_item->>'id', r.id,
        COALESCE(v_item->>'name', ''),
        COALESCE(v_item->>'issuer', ''),
        COALESCE(v_item->>'date', ''),
        v_item->>'description',
        v_idx
      );
      v_idx := v_idx + 1;
    END LOOP;

    -- Visibility
    INSERT INTO cv_visibility (cv_id, show_location, show_linkedin, show_website, show_summary, show_courses, show_certifications, show_awards)
    VALUES (
      r.id,
      COALESCE((r.cv_data->'visibility'->>'location')::boolean, TRUE),
      COALESCE((r.cv_data->'visibility'->>'linkedin')::boolean, TRUE),
      COALESCE((r.cv_data->'visibility'->>'website')::boolean, TRUE),
      COALESCE((r.cv_data->'visibility'->>'summary')::boolean, TRUE),
      COALESCE((r.cv_data->'visibility'->>'courses')::boolean, FALSE),
      COALESCE((r.cv_data->'visibility'->>'certifications')::boolean, FALSE),
      COALESCE((r.cv_data->'visibility'->>'awards')::boolean, FALSE)
    );

    -- Settings
    IF r.settings IS NOT NULL AND r.settings != '{}'::jsonb THEN
      INSERT INTO cv_settings (cv_id, color_scheme, font_family, font_size_level, theme, locale, pattern_name, pattern_sidebar_intensity, pattern_main_intensity, pattern_scope)
      VALUES (
        r.id,
        COALESCE(r.settings->>'colorScheme', 'ivory'),
        COALESCE(r.settings->>'fontFamily', 'inter'),
        COALESCE((r.settings->>'fontSizeLevel')::integer, 2),
        COALESCE(r.settings->>'theme', 'light'),
        COALESCE(r.settings->>'locale', 'en'),
        COALESCE(r.settings->'pattern'->>'name', 'none'),
        COALESCE((r.settings->'pattern'->>'sidebarIntensity')::integer, 3),
        COALESCE((r.settings->'pattern'->>'mainIntensity')::integer, 2),
        COALESCE(r.settings->'pattern'->>'scope', 'sidebar')
      );
    END IF;

    -- Sidebar order
    v_idx := 0;
    FOR v_section IN SELECT jsonb_array_elements_text(COALESCE(r.cv_data->'sidebarOrder', '["contact","summary","skills"]'::jsonb)) LOOP
      INSERT INTO cv_sidebar_sections (cv_id, section_id, sort_order)
      VALUES (r.id, v_section, v_idx);
      v_idx := v_idx + 1;
    END LOOP;

  END LOOP;

  RAISE NOTICE 'Migration complete. Legacy data preserved in cvs_legacy table.';
END $$;
