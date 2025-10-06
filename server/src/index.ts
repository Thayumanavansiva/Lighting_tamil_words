import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbInstance } from './config/database';
import authRoutes from './routes/auth';
import gameRoutes from './routes/games';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8081;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);

// Start server
dbInstance.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });