import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.6';
const DB_NAME = process.env.MONGODB_DB_NAME || 'tamil_word_game';

class Database {
  private static instance: Database;
  private client: MongoClient;
  private db: Db | null = null;

  private constructor() {
    this.client = new MongoClient(MONGODB_URI);
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  public async disconnect(): Promise<void> {
    await this.client.close();
    this.db = null;
  }
}

export const dbInstance = Database.getInstance();