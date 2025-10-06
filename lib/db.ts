import { User, GameSession, LeaderboardEntry } from '../types/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';

class DatabaseService {
  private static instance: DatabaseService;
  private currentUser: User | null = null;
  getUserById: any;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async getUser(): Promise<{ data: { user: User | null } }> {
    if (this.currentUser) {
      return { data: { user: this.currentUser } };
    }
    
    try {
  const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { data: { user: null } };
      }

      const data = await response.json();
      this.currentUser = data;
      return { data: { user: data } };
    } catch (error) {
      console.error('Error getting user:', error);
      return { data: { user: null } };
    }
  }

  async signUp(email: string, password: string, fullName: string, role: 'student' | 'teacher' = 'student'): Promise<{ user: User }> {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        fullName,
        role,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sign up');
    }

    const data = await response.json();
    this.currentUser = data;
    return { user: data };
  }

  async signIn(email: string, password: string): Promise<{ data: { user: User } }> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sign in');
    }

    const data = await response.json();
    this.currentUser = data;
    return { data: { user: data } };
  }

  async signOut() {
    this.currentUser = null;
  }

  async from(table: string) {
    return {
      select: (columns: string) => ({
        eq: async (field: string, value: any) => {
          const response = await fetch(`${API_URL}/api/${table}?${field}=${value}`);
          if (!response.ok) {
            throw new Error('Failed to fetch data');
          }
          const data = await response.json();
          return { data };
        },
        order: (field: string, { ascending = true } = {}) => ({
          limit: async (limit: number) => {
            const response = await fetch(
              `${API_URL}/api/${table}?sort=${field}&order=${ascending ? 'asc' : 'desc'}&limit=${limit}`
            );
            if (!response.ok) {
              throw new Error('Failed to fetch data');
            }
            const data = await response.json();
            return { data };
          }
        })
      })
    };
  }

  async getLeaderboard(options: { timeFilter?: 'all' | 'week' | 'month', limit?: number } = {}): Promise<LeaderboardEntry[]> {
    const { timeFilter = 'all', limit = 50 } = options;
    const response = await fetch(
      `${API_URL}/api/games/leaderboard?timeFilter=${timeFilter}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    
    return response.json();
  }

  async getUserStats(userId: string) {
  const response = await fetch(`${API_URL}/api/users/${userId}/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch user stats');
    }
    return response.json();
  }
}

const db = DatabaseService.getInstance();
export default db;

export const signOut = async () => {
  // For basic systems without JWT/sessions, sign out is a front-end operation.
  return;
};

// Game helpers
export const getRandomWords = async (count: number = 10, difficulty: string = 'easy') => {
  const response = await fetch(`${API_URL}/api/games/words?count=${count}&difficulty=${difficulty}`);
  if (!response.ok) {
    throw new Error('Failed to fetch words');
  }
  return response.json();
};

export const saveGameSession = async (sessionData: Omit<GameSession, 'id' | 'completed_at'>) => {
  const response = await fetch(`${API_URL}/api/games/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    throw new Error('Failed to save game session');
  }

  return response.json();
};

export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  const response = await fetch(`${API_URL}/api/games/leaderboard?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }
  return response.json();
}
