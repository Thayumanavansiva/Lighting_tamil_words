import express from 'express';
import dotenv from 'dotenv';
import { connectToDatabase, getDb } from './config/database';
import { initializeSchema } from './config/schema';
import authRoutes from './routes/auth';
import gamesRoutes from './routes/games';
import { corsMiddleware } from './middleware/cors';

dotenv.config();

const app = express();
export { app }; // Export the app for testing

const PORT = process.env.PORT || 8081;

app.use(express.json());
app.use(corsMiddleware);
app.use('/auth', authRoutes);
app.use('/games', gamesRoutes);

async function startServer() {
  dotenv.config({
    path:"./.env",
  });
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
