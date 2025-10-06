import { Router } from 'express';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { getCollections } from '../config/schema';
import type { User } from '../config/schema';

const router = Router();

// Friendly GET root (for browser visits)
router.get('/', (_req, res) => {
  res.json({
    message:
      'Auth API root. Use POST /api/auth/signup and POST /api/auth/login to authenticate.',
  });
});

// Prevent blank screen when browser navigates directly
router.get('/login', (_req, res) => {
  res.status(200).json({
    message:
      'This endpoint accepts POST requests to authenticate. Use POST /api/auth/login with { email, password }.',
  });
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
      updated_at: now,
    };

    const result = await collections.users.insertOne(newUser);

    // Remove password from response
    const { password: _, ...userResponse } = newUser;
    res.status(201).json({
      id: result.insertedId.toString(), // ensure string ID
      ...userResponse,
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
      id: user._id.toString(),
      ...userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
