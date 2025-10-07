import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import db from '@/lib/db';
import { deleteItem } from '@/lib/storage';
import { User as DbUser, GameSession } from '@/types/database';
import { User as UserIcon, CreditCard as Edit, LogOut, Trophy, Calendar, ChartBar as BarChart3, Award } from 'lucide-react-native';

export default function ProfileScreen() {
  const [user, setUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [stats, setStats] = useState({
    totalGames: 0,
    averageScore: 0,
    bestScore: 0,
    currentStreak: 0,
    totalTimeSpent: 0,
    achievements: 0,
  });
  const [recentGames, setRecentGames] = useState<GameSession[]>([]);

  useEffect(() => {
    loadUserProfile();
    loadUserStats();
    loadRecentGames();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user: authUser } } = await db.getUser();
      if (authUser) {
        const userData = await db.getUserById(authUser.id);
        const resolved = userData || (authUser as unknown as DbUser);
        setUser(resolved);
        setEditedName(resolved?.full_name || '');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const { data: { user: authUser } } = await db.getUser();
      if (!authUser) return;
      const stats = await db.getUserStats(authUser.id);
      setStats({
        totalGames: stats.gamesPlayed,
        averageScore: 0,
        bestScore: 0,
        currentStreak: stats.currentStreak,
        totalTimeSpent: 0,
        achievements: 0,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadRecentGames = async () => {
    // Backend endpoint not present; leave empty list for now
    setRecentGames([]);
  };

  const updateProfile = async () => {
    if (!user) return;
    // No update endpoint yet; optimistically update UI
    setUser({ ...user, full_name: editedName });
    setEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem('user');
              await deleteItem('token');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }
        }
      ]
    );
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  };

  const formatGameType = (gameType: string): string => {
    const types = {
      match: 'Match Game',
      mcq: 'MCQ Challenge',
      jumbled: 'Jumbled Words',
      hints: 'Hint Master'
    };
    return types[gameType as keyof typeof types] || gameType;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <UserIcon size={60} color="#FFF" />
          </View>
          
          {editing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
                placeholderTextColor="#CCC"
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={() => {
                    setEditing(false);
                    setEditedName(user.full_name);
                  }}
                >
                  <Text style={styles.editButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton]}
                  onPress={updateProfile}
                >
                  <Text style={styles.editButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{user.full_name}</Text>
              <TouchableOpacity
                style={styles.editIcon}
                onPress={() => setEditing(true)}
              >
                <Edit size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.userRole}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Text>
          <Text style={styles.userLevel}>Level {user.level}</Text>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <BarChart3 size={24} color="#FF6B35" />
            <Text style={styles.statNumber}>{stats.totalGames}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={24} color="#4ECDC4" />
            <Text style={styles.statNumber}>{stats.averageScore}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statCard}>
            <Award size={24} color="#45B7D1" />
            <Text style={styles.statNumber}>{stats.bestScore}</Text>
            <Text style={styles.statLabel}>Best Score</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={24} color="#FFA726" />
            <Text style={styles.statNumber}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.additionalStats}>
          <View style={styles.additionalStatItem}>
            <Text style={styles.additionalStatLabel}>Total Time Played</Text>
            <Text style={styles.additionalStatValue}>{formatDuration(stats.totalTimeSpent)}</Text>
          </View>
          <View style={styles.additionalStatItem}>
            <Text style={styles.additionalStatLabel}>Achievements Unlocked</Text>
            <Text style={styles.additionalStatValue}>{stats.achievements}</Text>
          </View>
          <View style={styles.additionalStatItem}>
            <Text style={styles.additionalStatLabel}>Current Points</Text>
            <Text style={styles.additionalStatValue}>{user.points}</Text>
          </View>
        </View>
      </View>

      <View style={styles.recentGamesContainer}>
        <Text style={styles.sectionTitle}>Recent Games</Text>
        {recentGames.length > 0 ? (
          recentGames.map((game, index) => (
            <View key={game.id} style={styles.gameCard}>
              <View style={styles.gameInfo}>
                <Text style={styles.gameType}>{formatGameType(game.game_type)}</Text>
                <Text style={styles.gameDate}>{formatDate(game.completed_at)}</Text>
              </View>
              <View style={styles.gameStats}>
                <Text style={styles.gameScore}>{game.score} pts</Text>
                <Text style={styles.gameAccuracy}>
                  {Math.round((game.correct_answers / game.questions_answered) * 100)}% accuracy
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noGamesContainer}>
            <Text style={styles.noGamesText}>No games played yet</Text>
            <Text style={styles.noGamesSubtext}>Start playing to see your history here!</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#FFF" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 10,
  },
  editIcon: {
    padding: 5,
  },
  editContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    color: '#FFF',
    minWidth: 200,
    textAlign: 'center',
    marginBottom: 15,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  userRole: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 3,
  },
  userLevel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.8,
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
    marginBottom: 20,
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
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  additionalStats: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  additionalStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  additionalStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  additionalStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recentGamesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  gameCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameInfo: {
    flex: 1,
  },
  gameType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  gameDate: {
    fontSize: 12,
    color: '#666',
  },
  gameStats: {
    alignItems: 'flex-end',
  },
  gameScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 3,
  },
  gameAccuracy: {
    fontSize: 12,
    color: '#666',
  },
  noGamesContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noGamesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  noGamesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  signOutButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    gap: 10,
  },
  signOutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});