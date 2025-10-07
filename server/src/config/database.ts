import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = 'tamil_word_game';

const client = new MongoClient(uri);
let database: Db | null = null;

// Connect to MongoDB
export async function connectToDatabase(): Promise<Db> {
  if (!database) {
    await client.connect();
    database = client.db(dbName);
    console.log(`✅ Connected to MongoDB: ${dbName}`);
  }
  return database;
}

// Getter for already connected DB
export function getDb(): Db {
  if (!database) {
    throw new Error('❌ Database not initialized. Call connectToDatabase() first.');
  }
  return database;
}

// Optional: export a "dbInstance" for convenience
export const dbInstance = connectToDatabase();
