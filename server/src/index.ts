import express from 'express';
import dotenv from 'dotenv';
import { connectToDatabase, getDb } from './config/database';
import { initializeSchema } from './config/schema';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

app.use(express.json());

async function startServer() {
  try {
    await connectToDatabase();
    await initializeSchema(getDb());

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

startServer();
