export interface User {
  updated_at: string;
  created_at: string;
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher';
  points?: number;
  level?: number;
}

export interface Word {
  id: string;
  word: string;
  meaning_ta: string;
  notes?: string;
  approved: boolean;
  difficulty: string;
}

export interface GameSession {
  id?: string;
  user_id: string;
  game_type: 'match' | 'mcq' | 'jumbled' | 'hints';
  score: number;
  max_score: number;
  questions_answered: number;
  correct_answers: number;
  duration_seconds: number;
  difficulty_level: string;
  completed_at?: string;
}

export interface LeaderboardEntry {
  id: string;
  full_name: string;
  points: number;
  avatar_url?: string;
  rank: number;
}