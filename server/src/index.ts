import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { dbInstance } from './config/database';
import authRoutes from './routes/auth';
import gameRoutes from './routes/games';

dotenv.config();

const app = express();

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS with explicit allowed origins to avoid browser blocks during dev
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000', // React dev
  process.env.EXPO_WEB_URL || 'http://localhost:19006', // Expo web
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: origin not allowed'));
      }
    },
    credentials: true,
  })
);

const PORT = process.env.PORT || 8081;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);

// Optional: serve a built frontend and fallback to index.html for client-side routing
if (process.env.SERVE_FRONTEND === 'true') {
  const frontendBuildPath =
    process.env.FRONTEND_BUILD_PATH ||
    path.join(__dirname, '..', '..', 'web-build');
  console.log('Serving frontend from', frontendBuildPath);
  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Start server
dbInstance
  .connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
