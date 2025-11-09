/*
  # מערכת מנהלת ידע כתר - Keter Knowledge Management System

  ## טבלאות חדשות
  
  ### 1. users - משתמשים
  - id (uuid, primary key)
  - email (text, unique)
  - full_name (text)
  - role (text) - 'admin', 'editor', 'viewer'
  - created_at (timestamp)
  - updated_at (timestamp)
  
  ### 2. knowledge_articles - מאגר ידע
  - id (uuid, primary key)
  - title (text)
  - content (text)
  - keywords (text array) - מילות מפתח לחיפוש
  - category (text) - קטגוריה: 'products', 'procedures', 'faq', 'support'
  - status (text) - 'draft', 'published', 'archived'
  - created_by (uuid, foreign key)
  - created_at (timestamp)
  - updated_at (timestamp)
  
  ### 3. procedures - נהלים
  - id (uuid, primary key)
  - title (text)
  - description (text)
  - content (text)
  - version (text)
  - status (text) - 'draft', 'active', 'archived'
  - created_by (uuid, foreign key)
  - created_at (timestamp)
  - updated_at (timestamp)
  
  ### 4. conversation_scripts - תסריטי שיחה
  - id (uuid, primary key)
  - title (text)
  - scenario (text) - סוג התרחיש
  - script_content (text)
  - tags (text array)
  - created_by (uuid, foreign key)
  - created_at (timestamp)
  - updated_at (timestamp)
  
  ### 5. simulations - סימולציות
  - id (uuid, primary key)
  - title (text)
  - description (text)
  - scenario_type (text)
  - questions (jsonb) - שאלות ותשובות
  - passing_score (integer)
  - created_by (uuid, foreign key)
  - created_at (timestamp)
  - updated_at (timestamp)
  
  ### 6. simulation_results - תוצאות סימולציות
  - id (uuid, primary key)
  - simulation_id (uuid, foreign key)
  - user_id (uuid, foreign key)
  - score (integer)
  - answers (jsonb)
  - completed_at (timestamp)
  
  ## אבטחה
  - מופעל RLS על כל הטבלאות
  - נוצרו מדיניות גישה לפי תפקידים
*/

-- יצירת טבלת משתמשים
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- יצירת טבלת מאגר ידע
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  keywords text[] DEFAULT '{}',
  category text NOT NULL CHECK (category IN ('products', 'procedures', 'faq', 'support', 'general')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- יצירת טבלת נהלים
CREATE TABLE IF NOT EXISTS procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  content text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- יצירת טבלת תסריטי שיחה
CREATE TABLE IF NOT EXISTS conversation_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  scenario text NOT NULL,
  script_content text NOT NULL,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- יצירת טבלת סימולציות
CREATE TABLE IF NOT EXISTS simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  scenario_type text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]',
  passing_score integer NOT NULL DEFAULT 70,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- יצירת טבלת תוצאות סימולציות
CREATE TABLE IF NOT EXISTS simulation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid REFERENCES simulations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  score integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz DEFAULT now()
);

-- הפעלת RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;

-- מדיניות גישה למשתמשים
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- מדיניות גישה למאגר ידע
CREATE POLICY "Everyone can view published articles"
  ON knowledge_articles FOR SELECT
  TO authenticated
  USING (status = 'published' OR created_by = auth.uid());

CREATE POLICY "Editors and admins can insert articles"
  ON knowledge_articles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Editors and admins can update articles"
  ON knowledge_articles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can delete articles"
  ON knowledge_articles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- מדיניות גישה לנהלים
CREATE POLICY "Everyone can view active procedures"
  ON procedures FOR SELECT
  TO authenticated
  USING (status = 'active' OR created_by = auth.uid());

CREATE POLICY "Editors and admins can insert procedures"
  ON procedures FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Editors and admins can update procedures"
  ON procedures FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- מדיניות גישה לתסריטי שיחה
CREATE POLICY "Everyone can view conversation scripts"
  ON conversation_scripts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Editors and admins can insert conversation scripts"
  ON conversation_scripts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Editors and admins can update conversation scripts"
  ON conversation_scripts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- מדיניות גישה לסימולציות
CREATE POLICY "Everyone can view simulations"
  ON simulations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Editors and admins can insert simulations"
  ON simulations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Editors and admins can update simulations"
  ON simulations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- מדיניות גישה לתוצאות סימולציות
CREATE POLICY "Users can view own simulation results"
  ON simulation_results FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can insert own simulation results"
  ON simulation_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- יצירת אינדקסים לשיפור ביצועים
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_keywords ON knowledge_articles USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_status ON knowledge_articles(status);
CREATE INDEX IF NOT EXISTS idx_procedures_status ON procedures(status);
CREATE INDEX IF NOT EXISTS idx_conversation_scripts_tags ON conversation_scripts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_simulation_results_user ON simulation_results(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_results_simulation ON simulation_results(simulation_id);
