export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  points: number;
  level: number;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  school_name?: string;
  grade?: string;
  teacher_id?: string; // For students assigned to teachers
}

export interface Word {
  id: number;
  word: string;
  meaning_ta: string | null;
  meaning_en: string | null;
  domain: string | null;
  period: string | null;
  modern_equivalent: string | null;
  status: string | null;
  notes: string | null;
  created_by: string; // Admin/Teacher who added the word
  created_at: string;
  approved: boolean;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_type: 'match' | 'mcq' | 'jumbled' | 'hints';
  score: number;
  max_score: number;
  questions_answered: number;
  correct_answers: number;
  duration_seconds: number;
  completed_at: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
}

export interface Assignment {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  word_ids: number[];
  game_types: string[];
  assigned_students: string[];
  due_date: string;
  created_at: string;
  status: 'active' | 'completed' | 'expired';
}

export interface WordRequest {
  id: string;
  teacher_id: string;
  word: string;
  meaning_ta: string;
  meaning_en?: string;
  domain?: string;
  period?: string;
  modern_equivalent?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_response?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  title: string;
  description: string;
  points_awarded: number;
  unlocked_at: string;
  category: 'games' | 'learning' | 'social' | 'special';
}

export interface Leaderboard {
  user_id: string;
  full_name: string;
  total_points: number;
  games_played: number;
  average_score: number;
  rank: number;
  avatar_url?: string;
}