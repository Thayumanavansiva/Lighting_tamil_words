import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { dbInstance } from '../config/database';
// import { getCollections } from '../config/database';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Auth middleware
const authenticateToken = (req: AuthRequest, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user as { id: string; email: string; role: string };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get words for current level
router.get('/words', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = await dbInstance;
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(req.user!.id) 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const words = await db.collection('words')
      .find({ level: user.level })
      .limit(10)
      .toArray();

    res.json({
      level: user.level,
      words: words.map(w => ({
        id: w._id,
        tamil: w.tamil,
        // Don't send the english translation directly
        hint: w.hint
      }))
    });
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit word answer
router.post('/submit', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { wordId, answer, timeSpent } = req.body;
    const db = await dbInstance;

    const word = await db.collection('words').findOne({ 
      _id: new ObjectId(wordId) 
    });

    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }

    const isCorrect = word.english.toLowerCase() === answer.toLowerCase();
    let pointsEarned = 0;

    if (isCorrect) {
      // Calculate points based on time spent
      pointsEarned = Math.max(100 - Math.floor(timeSpent / 1000) * 5, 10);

      // Update user points and check for level up
      const result = await db.collection('users').findOneAndUpdate(
        { _id: new ObjectId(req.user!.id) },
        { 
          $inc: { 
            points: pointsEarned,
            'levelProgress.correct': 1
          }
        },
        { returnDocument: 'after' }
      );

      const user = result?.value;
      if (user && user.levelProgress?.correct >= 5) {
        // Level up!
        await db.collection('users').updateOne(
          { _id: new ObjectId(req.user!.id) },
          {
            $inc: { level: 1 },
            $set: { 'levelProgress.correct': 0 }
          }
        );
      }
    }

    res.json({
      correct: isCorrect,
      points: pointsEarned,
      correctAnswer: isCorrect ? word.english : undefined
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
    

// Define GameSession interface
interface GameSession {
  _id?: ObjectId;
  user_id: ObjectId;
  score: number;
  completed_at: Date;
  // Add other fields as needed from your game session schema
}

// Save game session
router.post('/sessions', async (req, res) => {
  try {
    const sessionData: Omit<GameSession, '_id'> = {
      ...req.body,
      completed_at: new Date()
    };
    const db = await dbInstance;

    // Save game session
    const result = await db.collection('game_sessions').insertOne(sessionData);

    // Update user points
    await db.collection('users').updateOne(
      { _id: sessionData.user_id },
      { $inc: { points: sessionData.score } }
    );

    res.json({
      id: result.insertedId.toString(),
      ...sessionData
    });
  } catch (error) {
    console.error('Error saving game session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LeaderboardUser interface
interface LeaderboardUser {
  _id?: ObjectId;
  fullName?: string;
  points: number;
  avatar_url?: string;
  games_played: number;
}

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10, timeFilter } = req.query;
    const db = await dbInstance;
    
    // Create match stage for time filtering
    const matchStage: any = { role: 'student' };
    if (timeFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchStage.created_at = { $gte: weekAgo };
    } else if (timeFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchStage.created_at = { $gte: monthAgo };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'game_sessions',
          localField: '_id',
          foreignField: 'user_id',
          as: 'sessions'
        }
      },
      {
        $project: {
          _id: 1,
          fullName: '$fullName',
          points: 1,
          avatar_url: 1,
          games_played: { $size: '$sessions' }
        }
      },
      { $sort: { points: -1 } },
      { $limit: Number(limit) }
    ];

    const leaderboard = await db.collection('users').aggregate<LeaderboardUser>(pipeline).toArray();

    res.json(leaderboard.map((user, index) => ({
      id: user._id ? user._id.toString() : '',
      fullName: (user as any).fullName || '',
      points: user.points,
      avatar_url: user.avatar_url,
      games_played: user.games_played,
      rank: index + 1
    })));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;