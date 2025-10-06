import { Router } from 'express';
import bcrypt from 'bcrypt';
import { getCollections } from '../config/schema';
import type { User } from '../config/schema';

const router = Router();

// Root GET route
router.get('/', (_req, res) => {
  return res.json({
    message:
      'Auth API root. Use POST /api/auth/signup and POST /api/auth/login to authenticate.',
  });
});

// Friendly GET for /login endpoint
router.get('/login', (_req, res) => {
  return res.status(200).json({
    message:
      'This endpoint accepts POST requests to authenticate. Use POST /api/auth/login with { email, password }.',
  });
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, role = 'student' } = req.body || {};

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
      updated_at: now,
    };

    const result = await collections.users.insertOne(newUser);

    // Remove password before sending response
    const { password: _, ...userResponse } = newUser;

    return res.status(201).json({
      id: result.insertedId.toString(), // stringified MongoDB ObjectId
      ...userResponse,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const collections = getCollections();

    const user = await collections.users.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove password from user before sending response
    const { password: _, ...userResponse } = user;

    res.json({
      id: user._id.toString(),
      ...userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
