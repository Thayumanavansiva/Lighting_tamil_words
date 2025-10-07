import { User, Word as ApiWord, GameSession as ApiGameSession, LeaderboardEntry as ApiLeaderboardEntry } from '../types/api';
import { getItem, setItem, deleteItem } from '@/lib/storage';

// Fallback declaration to satisfy environments missing Promise typings in lint checks
// This does not alter runtime, only prevents linter complaints in ES5-targeted configs
declare var Promise: any;

interface SignupResponse {
  user: User;
  token: string;
}

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'teacher';
  schoolName: string;
  grade?: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

// Base URL for the backend server. Normalize value and strip trailing /api or slashes.
function normalizeBaseUrl(input?: string): string {
  const fallback = 'http://127.0.0.1:8081';
  let base = (input || fallback).trim();
  // Remove trailing slashes
  base = base.replace(/\/+$/, '');
  // Remove trailing /api
  base = base.replace(/\/api$/, '');
  return base;
}

const API_URL = normalizeBaseUrl(((globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL as string) || undefined);

// Helper function to handle API responses
async function handleResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    throw new Error(data.error || 'An error occurred');
  }
  return data;
}

class DatabaseService {
  private static instance: DatabaseService;
  private currentUser: User | null = null;
  private authToken: string | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async signUp(data: SignupData): Promise<SignupResponse> {
    console.log('DatabaseService: Attempting signup with:', {
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      schoolName: data.schoolName,
      grade: data.grade
    });
    
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('DatabaseService: Signup response status:', response.status);
      return handleResponse(response);
    } catch (error) {
      console.error('DatabaseService: Signup error:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<LoginResponse> {
    console.log('DatabaseService: Attempting signin with:', { email });
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('DatabaseService: Signin response status:', response.status);
      const data = await handleResponse(response);

      // Persist user and token for subsequent calls
      const { user, token } = data as LoginResponse;
      this.currentUser = user;
      this.authToken = token;
      try {
        await setItem('user', JSON.stringify(user));
        await setItem('token', token);
      } catch (e) {
        console.warn('Failed to persist auth to secure storage:', e);
      }
      return data;
    } catch (error) {
      console.error('DatabaseService: Signin error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  // Retrieve user and token from secure storage. Matches callers expecting { data: { user } }
  async getUser(): Promise<{ data: { user: User | null } }> {
    if (this.currentUser) {
      return { data: { user: this.currentUser } };
    }
    try {
      const stored = await getItem('user');
      const token = await getItem('token');
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        this.currentUser = parsed;
        this.authToken = token || null;
        return { data: { user: parsed } };
      }
    } catch (e) {
      console.warn('Failed to read user from storage:', e);
    }
    return { data: { user: null } };
  }

  private authHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  // Words: fetch a set of words for games. Maps server shape to frontend ApiWord
  async getRandomWords(limit: number = 10): Promise<ApiWord[]> {
    // Ensure auth present
    if (!this.authToken) {
      await this.getUser();
    }
    const response = await fetch(`${API_URL}/games/words`, {
      method: 'GET',
      headers: this.authHeaders(),
    });
    const payload = await handleResponse(response);
    const words = (payload.words || []) as Array<{ id: string; tamil: string; hint?: string }>;
    // Map to expected ApiWord
    return words.slice(0, limit).map((w) => ({
      id: String(w.id),
      word: w.tamil,
      meaning_ta: '',
      notes: w.hint,
      approved: true,
      difficulty: 'medium',
    }));
  }

  // Save game session results
  async saveGameSession(session: Omit<ApiGameSession, 'id' | 'completed_at'>): Promise<ApiGameSession> {
    const response = await fetch(`${API_URL}/games/sessions`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(session),
    });
    const data = await handleResponse(response);
    // Ensure types line up
    return {
      id: data.id,
      user_id: session.user_id,
      game_type: session.game_type,
      score: session.score,
      max_score: session.max_score,
      questions_answered: session.questions_answered,
      correct_answers: session.correct_answers,
      duration_seconds: session.duration_seconds,
      difficulty_level: session.difficulty_level,
      completed_at: data.completed_at || new Date().toISOString(),
    };
  }

  // Leaderboard
  async getLeaderboard(params: { timeFilter?: 'all' | 'week' | 'month'; limit?: number } = {}): Promise<ApiLeaderboardEntry[]> {
    const url = new URL(`${API_URL}/games/leaderboard`);
    if (params.timeFilter && params.timeFilter !== 'all') url.searchParams.set('timeFilter', params.timeFilter);
    if (params.limit) url.searchParams.set('limit', String(params.limit));
    const response = await fetch(url.toString(), { headers: this.authHeaders() });
    const list = await handleResponse(response);
    // Map server's fullName -> full_name expected by some screens
    return (list as any[]).map((u) => ({
      id: u.id,
      full_name: u.fullName || u.full_name,
      points: u.points || 0,
      avatar_url: u.avatar_url,
      rank: u.rank || 0,
    }));
  }

  // Minimal user lookup; falls back to stored user
  async getUserById(id: string): Promise<User | null> {
    const stored = await this.getUser();
    if (stored.data.user && stored.data.user.id === id) return stored.data.user;
    // No backend endpoint yet; return null to avoid crashes
    return null;
  }

  // Basic stats placeholder until backend exposes metrics endpoints
  async getUserStats(id: string): Promise<{ totalPoints: number; gamesPlayed: number; currentStreak: number; rank: number }> {
    const leaderboard = await this.getLeaderboard({ limit: 50 });
    let entry: ApiLeaderboardEntry | undefined = undefined;
    for (let i = 0; i < leaderboard.length; i += 1) {
      if (leaderboard[i].id === id) {
        entry = leaderboard[i];
        break;
      }
    }
    return {
      totalPoints: entry?.points || 0,
      gamesPlayed: 0,
      currentStreak: 0,
      rank: entry?.rank || 0,
    };
  }
}

const dbSingleton = DatabaseService.getInstance();
export default dbSingleton;

// Named exports used in some screens
export const getRandomWords = (limit?: number) => dbSingleton.getRandomWords(limit);
export const saveGameSession = (session: Omit<ApiGameSession, 'id' | 'completed_at'>) => dbSingleton.saveGameSession(session);