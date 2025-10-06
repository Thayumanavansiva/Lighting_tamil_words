import { Collection } from 'mongodb';
import { dbInstance } from './database';

export async function initializeSchema() {
  const db = dbInstance.getDb();

  // Create collections with validation schemas
  await Promise.all([
    db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'password', 'fullName', 'role', 'points', 'level', 'created_at', 'updated_at'],
          properties: {
            email: { bsonType: 'string' },
            password: { bsonType: 'string' },
            fullName: { bsonType: 'string' },
            role: { enum: ['student', 'teacher'] },
            points: { bsonType: 'number' },
            level: { bsonType: 'number' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' }
          }
        }
      }
    }),
    db.createCollection('words', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['word', 'meaning_ta', 'created_by', 'created_at', 'approved'],
          properties: {
            word: { bsonType: 'string' },
            meaning_ta: { bsonType: 'string' },
            meaning_en: { bsonType: 'string' },
            domain: { bsonType: 'string' },
            period: { bsonType: 'string' },
            modern_equivalent: { bsonType: 'string' },
            notes: { bsonType: 'string' },
            created_by: { bsonType: 'string' },
            created_at: { bsonType: 'date' },
            approved: { bsonType: 'bool' }
          }
        }
      }
    }),
    db.createCollection('game_sessions', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['user_id', 'game_type', 'score', 'max_score', 'questions_answered', 
                    'correct_answers', 'duration_seconds', 'difficulty_level', 'completed_at'],
          properties: {
            user_id: { bsonType: 'string' },
            game_type: { enum: ['match', 'mcq', 'jumbled', 'hints'] },
            score: { bsonType: 'number' },
            max_score: { bsonType: 'number' },
            questions_answered: { bsonType: 'number' },
            correct_answers: { bsonType: 'number' },
            duration_seconds: { bsonType: 'number' },
            difficulty_level: { enum: ['easy', 'medium', 'hard'] },
            completed_at: { bsonType: 'date' }
          }
        }
      }
    }),
    db.createCollection('assignments', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['teacher_id', 'title', 'word_ids', 'game_types', 
                    'assigned_students', 'status', 'created_at'],
          properties: {
            teacher_id: { bsonType: 'string' },
            title: { bsonType: 'string' },
            description: { bsonType: 'string' },
            word_ids: { bsonType: 'array', items: { bsonType: 'string' } },
            game_types: { bsonType: 'array', items: { enum: ['match', 'mcq', 'jumbled', 'hints'] } },
            assigned_students: { bsonType: 'array', items: { bsonType: 'string' } },
            due_date: { bsonType: 'date' },
            status: { enum: ['active', 'completed', 'expired'] },
            created_at: { bsonType: 'date' }
          }
        }
      }
    }),
    db.createCollection('word_requests', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['teacher_id', 'word', 'meaning_ta', 'status', 'created_at'],
          properties: {
            teacher_id: { bsonType: 'string' },
            word: { bsonType: 'string' },
            meaning_ta: { bsonType: 'string' },
            meaning_en: { bsonType: 'string' },
            domain: { bsonType: 'string' },
            period: { bsonType: 'string' },
            modern_equivalent: { bsonType: 'string' },
            notes: { bsonType: 'string' },
            status: { enum: ['pending', 'approved', 'rejected'] },
            admin_response: { bsonType: 'string' },
            created_at: { bsonType: 'date' },
            reviewed_at: { bsonType: 'date' },
            reviewed_by: { bsonType: 'string' }
          }
        }
      }
    }),
    db.createCollection('achievements', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['user_id', 'title', 'points_awarded', 'category', 'unlocked_at'],
          properties: {
            user_id: { bsonType: 'string' },
            title: { bsonType: 'string' },
            description: { bsonType: 'string' },
            points_awarded: { bsonType: 'number' },
            category: { enum: ['games', 'learning', 'social', 'special'] },
            unlocked_at: { bsonType: 'date' }
          }
        }
      }
    })
  ]);

  try {
    // Create indexes
    await Promise.all([
      // Users indexes
      db.collection('users').createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { role: 1 } },
        { key: { teacherId: 1 } }
      ]),

      // Words indexes
      db.collection('words').createIndexes([
        { key: { word: 1 }, unique: true },
        { key: { approved: 1 } },
        { key: { created_by: 1 } }
      ]),

      // Game sessions indexes
      db.collection('game_sessions').createIndexes([
        { key: { user_id: 1 } },
        { key: { completed_at: -1 } },
        { key: { game_type: 1 } }
      ]),

      // Assignments indexes
      db.collection('assignments').createIndexes([
        { key: { teacher_id: 1 } },
        { key: { status: 1 } },
        { key: { due_date: 1 } }
      ]),

      // Word requests indexes
      db.collection('word_requests').createIndexes([
        { key: { teacher_id: 1 } },
        { key: { status: 1 } },
        { key: { created_at: -1 } }
      ]),

      // Achievements indexes
      db.collection('achievements').createIndexes([
        { key: { user_id: 1 } },
        { key: { category: 1 } }
      ])
    ]);

    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
    throw error;
  }
}

// Collection schemas (for TypeScript)
export interface User {
  _id?: string;
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'teacher';
  points: number;
  level: number;
  created_at: Date;
  updated_at: Date;
}

export interface Word {
  _id?: string;
  word: string;
  meaning_ta: string;
  meaning_en?: string;
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

export interface Achievement {
  _id?: string;
  user_id: string;
  title: string;
  description?: string;
  points_awarded: number;
  category: 'games' | 'learning' | 'social' | 'special';
  unlocked_at: Date;
}

// Helper function to get typed collections
export function getCollections(db = dbInstance.getDb()) {
  return {
    users: db.collection<User>('users'),
    words: db.collection<Word>('words'),
    gameSessions: db.collection<GameSession>('game_sessions'),
    assignments: db.collection<Assignment>('assignments'),
    wordRequests: db.collection<WordRequest>('word_requests'),
    achievements: db.collection<Achievement>('achievements')
  };
}