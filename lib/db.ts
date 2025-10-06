import { User, GameSession, LeaderboardEntry } from '../types/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:3000';

// Add request timeout and better error handling
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server not responding');
    }
    throw error;
  }
};

// Add error handling for fetch operations
const handleFetchError = (error: any) => {
  if (error.message === 'Failed to fetch') {
    throw new Error('Unable to connect to server. Please check if the server is running.');
  }
  throw error;
};

interface SignUpResponse {
  user: User;
}

interface SignInResponse {
  data: {
    user: User;
  };
}

class DatabaseService {
  private static instance: DatabaseService;
  private currentUser: User | null = null;
  
  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/api/users/${id}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Error getting user by id:', error);
      return null;
    }
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

  async signUp(email: string, password: string, fullName: string, role: 'student' | 'teacher' = 'student'): Promise<SignUpResponse> {
    try {
      console.log('Attempting signup with:', { email, fullName, role });
      
      const response = await fetchWithTimeout(
        `${API_URL}/api/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            fullName,
            role,
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Signup failed:', data);
        throw new Error(data.error || 'Failed to sign up');
      }

      console.log('Signup successful:', { userId: data.id });
      this.currentUser = data;
      return { user: data };
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.message.includes('timeout')) {
        throw new Error('Server not responding. Please try again later.');
      }
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<SignInResponse> {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Sign in failed:', data);
        throw new Error(data.error || 'Failed to sign in');
      }

      this.currentUser = data;
      return { data: { user: data } };
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.message.includes('timeout')) {
        throw new Error('Server not responding. Please try again later.');
      }
      throw error;
    }
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
  }

  async from(table: string): Promise<any> {
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
    try {
      const { timeFilter = 'all', limit = 50 } = options;
      const response = await fetchWithTimeout(
        `${API_URL}/api/games/leaderboard?timeFilter=${timeFilter}&limit=${limit}`
      );
      
      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to fetch leaderboard:', data);
        throw new Error('Failed to fetch leaderboard');
      }
      
      return data;
    } catch (error: any) {
      console.error('Leaderboard error:', error);
      if (error.message.includes('timeout')) {
        throw new Error('Server not responding. Please try again later.');
      }
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<any> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/users/${userId}/stats`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to fetch user stats:', data);
        throw new Error('Failed to fetch user stats');
      }
      
      return data;
    } catch (error: any) {
      console.error('User stats error:', error);
      if (error.message.includes('timeout')) {
        throw new Error('Server not responding. Please try again later.');
      }
      throw error;
    }
  }
}

const db = DatabaseService.getInstance();
export default db;

export const signOut = async () => {
  // For basic systems without JWT/sessions, sign out is a front-end operation.
  return;
};

// Game helpers
export const getRandomWords = async (count: number = 10, difficulty: string = 'easy'): Promise<any> => {
  try {
    const response = await fetchWithTimeout(
      `${API_URL}/api/games/words?count=${count}&difficulty=${difficulty}`
    );
    
    const data = await response.json();
    if (!response.ok) {
      console.error('Failed to fetch words:', data);
      throw new Error('Failed to fetch words');
    }
    
    return data;
  } catch (error: any) {
    console.error('Get words error:', error);
    if (error.message.includes('timeout')) {
      throw new Error('Server not responding. Please try again later.');
    }
    throw error;
  }
};

export const saveGameSession = async (sessionData: Omit<GameSession, 'id' | 'completed_at'>): Promise<GameSession> => {
  try {
    const response = await fetchWithTimeout(
      `${API_URL}/api/games/sessions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(sessionData),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('Failed to save game session:', data);
      throw new Error('Failed to save game session');
    }

    return data;
  } catch (error: any) {
    console.error('Save game session error:', error);
    if (error.message.includes('timeout')) {
      throw new Error('Server not responding. Please try again later.');
    }
    throw error;
  }
};

export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  const response = await fetch(`${API_URL}/api/games/leaderboard?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }
  return response.json();
}
