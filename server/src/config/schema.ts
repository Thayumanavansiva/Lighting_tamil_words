// server/src/config/schema.ts
import { Db } from 'mongodb';
import { getDb } from './database';

// Initialize MongoDB collections and validation schemas
export async function initializeSchema(db: Db = getDb()) {
  // List existing collections so we don't try to recreate them
  const existing = await db.listCollections({}, { nameOnly: true }).toArray();
  const existingNames = new Set(existing.map((c) => c.name));

  async function createIfMissing(name: string, options: any) {
    if (!existingNames.has(name)) {
      console.log(`📘 Creating collection: ${name}`);
      await db.createCollection(name, options);
    } else {
      console.log(`✅ Collection already exists: ${name}`);
    }
  }

  // Create collections with validation schemas (only if missing)
  await createIfMissing('users', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['email', 'password', 'fullName', 'role', 'points', 'level', 'created_at', 'updated_at'],
        properties: {
          email: { bsonType: 'string' },
          password: { bsonType: 'string' },
          fullName: { bsonType: 'string' },
          role: { enum: ['student', 'teacher', 'admin'] },
          points: { bsonType: 'number' },
          level: { bsonType: 'number' },
          created_at: { bsonType: 'date' },
          updated_at: { bsonType: 'date' }
        }
      }
    }
  });

  await createIfMissing('words', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['word', 'meaning_ta', 'meaning_en', 'approved'],
        properties: {
          word: { bsonType: 'string' },
          meaning_ta: { bsonType: 'string' },
          meaning_en: { bsonType: 'string' },
          domain: { bsonType: 'string' },
          period: { bsonType: 'string' },
          modern_equivalent: { bsonType: ['string', 'null'] },
          status: { bsonType: 'string' },
          notes: { bsonType: 'string' },
          created_at: { bsonType: 'date' },
          slug: { bsonType: ['string', 'null'] },
          created_by: { bsonType: 'string' },
          approved: { bsonType: 'bool' }
        }
      }
    }
  });

  await createIfMissing('game_sessions', {
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
  });

  await createIfMissing('assignments', {
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
  });

  await createIfMissing('word_requests', {
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
  });

  await createIfMissing('achievements', {
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
  });

  try {
    // Create indexes
    await Promise.all([
      db.collection('users').createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { role: 1 } },
        { key: { teacherId: 1 } }
      ]),
      db.collection('words').createIndexes([
        { key: { word: 1 }, unique: true },
        { key: { approved: 1 } },
        { key: { created_by: 1 } }
      ]),
      db.collection('game_sessions').createIndexes([
        { key: { user_id: 1 } },
        { key: { completed_at: -1 } },
        { key: { game_type: 1 } }
      ]),
      db.collection('assignments').createIndexes([
        { key: { teacher_id: 1 } },
        { key: { status: 1 } },
        { key: { due_date: 1 } }
      ]),
      db.collection('word_requests').createIndexes([
        { key: { teacher_id: 1 } },
        { key: { status: 1 } },
        { key: { created_at: -1 } }
      ]),
      db.collection('achievements').createIndexes([
        { key: { user_id: 1 } },
        { key: { category: 1 } }
      ])
    ]);

    console.log('✅ MongoDB indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating MongoDB indexes:', error);
    throw error;
  }
}

// ==========================
// 📘 TypeScript Interfaces
// ==========================
export interface User {
  _id?: string;
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  avatar_url?: string;
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

// ==========================
// 📘 Helper: Typed collections
// ==========================
export function getCollections(db: Db = getDb()) {
  return {
    users: db.collection<User>('users'),
    words: db.collection<Word>('words'),
    gameSessions: db.collection<GameSession>('game_sessions'),
    assignments: db.collection<Assignment>('assignments'),
    wordRequests: db.collection<WordRequest>('word_requests'),
    achievements: db.collection<Achievement>('achievements')
  };
}
