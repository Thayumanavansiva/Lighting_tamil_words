import { Collection } from 'mongodb';
import { dbInstance } from './database';

// Collection schemas
export interface User {
  _id?: string;
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'teacher';
  points: number;
  level: number;
  avatarUrl?: string;
  schoolName?: string;
  grade?: string;
  teacherId?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Word {
  _id?: string;
  word: string;
  meaning_ta: string;
  meaning_en?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  domain?: string;
  period?: string;
  modern_equivalent?: string;
  notes?: string;
  created_by: string;
  created_at: Date;
  approved: boolean;
}

export interface GameSession {
  _id?: string;
  user_id: string;
  game_type: 'match' | 'mcq' | 'jumbled' | 'hints';
  score: number;
  max_score: number;
  questions_answered: number;
  correct_answers: number;
  duration_seconds: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  completed_at: Date;
}

export interface Assignment {
  _id?: string;
  teacher_id: string;
  title: string;
  description?: string;
  word_ids: string[];
  game_types: ('match' | 'mcq' | 'jumbled' | 'hints')[];
  assigned_students: string[];
  due_date?: Date;
  status: 'active' | 'completed' | 'expired';
  created_at: Date;
}

export interface WordRequest {
  _id?: string;
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
  created_at: Date;
  reviewed_at?: Date;
  reviewed_by?: string;
}

interface Collections {
  users: Collection<User>;
  words: Collection<Word>;
  game_sessions: Collection<GameSession>;
  assignments: Collection<Assignment>;
  word_requests: Collection<WordRequest>;
}

let collections: Collections | null = null;