import { Router } from 'express';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { getCollections } from '../config/schema';
import type { User } from '../config/schema';

const router = Router();

// Provide a friendly GET response for browsers that navigate to auth paths
// This prevents a blank "Loading..." page when the frontend (web) navigates
// to /auth/login instead of performing a POST API call. It returns a small
// JSON payload and a helpful HTML fallback for browsers requesting the route.
router.get('/', (_req, res) => {
  // Basic JSON to indicate this is an API endpoint
  res.json({ message: 'Auth API root. Use POST /signup and POST /login to authenticate.' });
});

router.get('/login', (_req, res) => {
  // Provide a clear JSON message for direct browser/API access.
  res.status(200).json({ message: 'This endpoint accepts POST requests to authenticate. Use POST /api/auth/login with { email, password }.' });
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, role = 'student' } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const collections = getCollections();
    const existing = await collections.users.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();
    
    const newUser: Omit<User, '_id'> = {
      email,
      password: hashedPassword,
      fullName,
      role,
      points: 0,
      level: 1,
      created_at: now,
      updated_at: now
    };

    const result = await collections.users.insertOne(newUser);

    // Remove password from response
    const { password: _, ...userResponse } = newUser;
    res.status(201).json({
      id: result.insertedId,
      ...userResponse
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const collections = getCollections();
    
    const user = await collections.users.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove password from response
    const { password: _, ...userResponse } = user;
    res.json({
      id: user._id,
      ...userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;