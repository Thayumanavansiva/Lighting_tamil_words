import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { dbInstance } from './config/database';
import authRoutes from './routes/auth';
import gameRoutes from './routes/games';
import { initializeSchema } from './config/schema';

dotenv.config();

const app = express();

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all origins in development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

const PORT = process.env.PORT || 8081;

// Routes
app.use('/auth', authRoutes);
app.use('/games', gameRoutes);

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
(async () => {
  try {
    // If dbInstance is synchronous, just use it directly
    // If it's a promise, await it: await dbInstance;
    await initializeSchema();
    // await initSampleData(); // Call initSampleData after schema initialization
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
