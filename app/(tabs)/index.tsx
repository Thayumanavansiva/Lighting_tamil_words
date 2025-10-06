import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import db from '@/lib/db';
import { User } from '@/types/database';
import { BookOpen, Trophy, Star, TrendingUp } from 'lucide-react-native';

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPoints: 0,
    gamesPlayed: 0,
    currentStreak: 0,
    rank: 0,
  });

  useEffect(() => {
    loadUserData();
    loadStats();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await db.getUser();
      if (authUser) {
        const userData = await db.getUserById(authUser.id);
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user: authUser } } = await db.getUser();
      if (!authUser) return;

      const stats = await db.getUserStats(authUser.id);
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const quickActions = [
    {
      title: 'Match Game',
      description: 'Match words with meanings',
      icon: BookOpen,
      color: '#FF6B35',
      action: () => console.log('Navigate to match game'),
    },
    {
      title: 'MCQ Challenge',
      description: 'Test your knowledge',
      icon: Star,
      color: '#4ECDC4',
      action: () => console.log('Navigate to MCQ'),
    },
    {
      title: 'Jumbled Words',
      description: 'Unscramble Tamil words',
      icon: TrendingUp,
      color: '#45B7D1',
      action: () => console.log('Navigate to jumbled game'),
    },
    {
      title: 'View Leaderboard',
      description: 'See your ranking',
      icon: Trophy,
      color: '#FFA726',
      action: () => console.log('Navigate to leaderboard'),
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>வணக்கம்! Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E', '#FFB74D']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>வணக்கம், {user?.full_name}!</Text>
          <Text style={styles.subtitle}>Ready to learn Tamil words?</Text>
          
          <View style={styles.pointsContainer}>
            <Star size={24} color="#FFF" />
            <Text style={styles.points}>{stats.totalPoints} Points</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.gamesPlayed}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>#{stats.rank}</Text>
            <Text style={styles.statLabel}>Global Rank</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user?.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { borderLeftColor: action.color }]}
              onPress={action.action}
            >
              <View style={styles.actionIcon}>
                <action.icon size={24} color={action.color} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.motivationContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.motivationCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.motivationText}>
            "மொழியை அறிவது கலாச்சாரத்தை அறிவது"
          </Text>
          <Text style={styles.motivationSubtext}>
            Learning language is learning culture
          </Text>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  points: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  actionsGrid: {
    gap: 15,
  },
  actionCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  actionIcon: {
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  motivationContainer: {
    padding: 20,
    paddingTop: 0,
  },
  motivationCard: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
  },
  motivationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  motivationSubtext: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});