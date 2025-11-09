/*
  # הוספת טבלת מערכות ושיפורי חיפוש
  
  1. טבלה חדשה
    - `systems` - מערכות
      - `id` (uuid, primary key)
      - `name` (text) - שם המערכת
      - `description` (text) - תיאור המערכת
      - `url` (text) - כתובת למערכת (אופציונלי)
      - `category` (text) - קטגוריה
      - `instructions` (text) - הוראות שימוש
      - `keywords` (text array) - מילות מפתח
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. שיפורי חיפוש
    - הוספת אינדקסי full-text search לכל הטבלאות
  
  3. אבטחה
    - הפעלת RLS על טבלת systems
    - מדיניות גישה לפי תפקידים
*/

-- יצירת טבלת מערכות
CREATE TABLE IF NOT EXISTS systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  url text DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  instructions text NOT NULL DEFAULT '',
  keywords text[] DEFAULT '{}',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- הפעלת RLS על טבלת מערכות
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;

-- מדיניות גישה למערכות
CREATE POLICY "Everyone can view systems"
  ON systems FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Editors and admins can insert systems"
  ON systems FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Editors and admins can update systems"
  ON systems FOR UPDATE
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

CREATE POLICY "Admins can delete systems"
  ON systems FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- יצירת אינדקסים לחיפוש משופר
CREATE INDEX IF NOT EXISTS idx_systems_keywords ON systems USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_systems_name ON systems(name);

-- הוספת אינדקסי full-text search
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_search 
  ON knowledge_articles USING gin(to_tsvector('simple', title || ' ' || content));

CREATE INDEX IF NOT EXISTS idx_procedures_search 
  ON procedures USING gin(to_tsvector('simple', title || ' ' || content));

CREATE INDEX IF NOT EXISTS idx_conversation_scripts_search 
  ON conversation_scripts USING gin(to_tsvector('simple', title || ' ' || script_content));

CREATE INDEX IF NOT EXISTS idx_simulations_search 
  ON simulations USING gin(to_tsvector('simple', title || ' ' || description));

CREATE INDEX IF NOT EXISTS idx_systems_search 
  ON systems USING gin(to_tsvector('simple', name || ' ' || description || ' ' || instructions));
