import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/schema';
import type { GameSession, User } from '../config/schema';

interface LeaderboardUser extends Pick<User, '_id' | 'full_name' | 'points' | 'avatar_url'> {
  games_played: number;
}

const router = Router();

// Get random words
router.get('/words', async (req, res) => {
  try {
    const { count = 10, difficulty = 'easy' } = req.query;
    const collections = getCollections();
    
    // Using MongoDB aggregation for better randomization
    const words = await collections.words.aggregate([
      { $match: { approved: true, difficulty_level: difficulty } },
      { $sample: { size: Number(count) } }
    ]).toArray();
    
    res.json(words);
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save game session
router.post('/sessions', async (req, res) => {
  try {
    const sessionData: Omit<GameSession, '_id'> = {
      ...req.body,
      completed_at: new Date()
    };
    const collections = getCollections();

    // Save game session
    const result = await collections.gameSessions.insertOne(sessionData);

    // Update user points
    await collections.users.updateOne(
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

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10, timeFilter } = req.query;
    const collections = getCollections();
    
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
          full_name: 1,
          points: 1,
          avatar_url: 1,
          games_played: { $size: '$sessions' }
        }
      },
      { $sort: { points: -1 } },
      { $limit: Number(limit) }
    ];

    const leaderboard = await collections.users.aggregate<LeaderboardUser>(pipeline).toArray();

    res.json(leaderboard.map((user, index) => ({
      id: user._id ? user._id.toString() : '',
      full_name: user.full_name,
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