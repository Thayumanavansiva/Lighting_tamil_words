// src/routes/auth.ts
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { dbInstance } from '../config/database';

const router = express.Router();

// ✅ Signup route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const db = await dbInstance;
    const usersCollection = db.collection('users');

    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    const existing = await usersCollection.findOne({ username });
    if (existing)
      return res.status(409).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ username, password: hashedPassword });

    res.status(201).json({ message: 'Signup successful' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const db = await dbInstance;
    const usersCollection = db.collection('users');

    const { username, password } = req.body;
    const user = await usersCollection.findOne({ username });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
