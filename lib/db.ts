import { User } from '../types/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8081/api';

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

  async signIn(email: string, password: string): Promise<SignInResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Sign in failed:', data);
        throw new Error(data.error || 'Failed to sign in');
      }

      this.currentUser = data;
      return { data: { user: data } };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string, fullName: string, role: 'student' | 'teacher' = 'student'): Promise<{ user: User }> {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
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
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Signup failed:', data);
        throw new Error(data.error || 'Failed to sign up');
      }

      this.currentUser = data;
      return { user: data };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }
}

// Export a singleton instance
const db = DatabaseService.getInstance();
export default db;
