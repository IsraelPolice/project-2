export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type ArticleCategory = 'products' | 'procedures' | 'faq' | 'support' | 'general';
export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  category: ArticleCategory;
  status: ArticleStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ProcedureStatus = 'draft' | 'active' | 'archived';

export interface Procedure {
  id: string;
  title: string;
  description: string;
  content: string;
  version: string;
  status: ProcedureStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationScript {
  id: string;
  title: string;
  scenario: string;
  script_content: string;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SimulationQuestion {
  question: string;
  options: string[];
  correct_answer: number;
}

export interface Simulation {
  id: string;
  title: string;
  description: string;
  scenario_type: string;
  questions: SimulationQuestion[];
  passing_score: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SimulationResult {
  id: string;
  simulation_id: string;
  user_id: string;
  score: number;
  answers: Record<string, number>;
  completed_at: string;
}

export interface System {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  instructions: string;
  keywords: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}
