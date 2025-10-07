// src/routes/auth.ts
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { dbInstance } from '../config/database';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ✅ Signup route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const db = await dbInstance;
    const usersCollection = db.collection('users');

    console.log('Received signup request:', req.body);

    const { email, password, fullName, role = 'student' } = req.body;
    
    // Validate required fields
    if (!email || !password || !fullName) {
      console.log('Missing required fields:', { email: !!email, password: !!password, fullName: !!fullName });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          email: !email ? 'Email is required' : null,
          fullName: !fullName ? 'Full name is required' : null,
          password: !password ? 'Password is required' : null,
        }
      });
    }

    // Check if user already exists
    const existing = await usersCollection.findOne({ email });
    if (existing) {
      console.log('User already exists:', email);
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      email,
      password: hashedPassword,
      fullName,
      role,
      points: 0,
      level: 1,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    
    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = newUser;
    console.log('User created successfully:', userWithoutPassword);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertedId.toString(), email, role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ 
      user: { 
        ...userWithoutPassword,
        id: result.insertedId
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const db = await dbInstance;
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
