import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import db from '@/lib/db';
import { Trophy, Medal, Award, Crown } from 'lucide-react-native';

interface LeaderboardEntry {
  id: string;
  full_name: string;
  points: number;
  rank: number;
  avatar_url?: string;
  games_played: number;
}

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    loadLeaderboard();
    loadCurrentUserRank();
  }, [timeFilter]);

  const loadLeaderboard = async () => {
    try {
      const leaderboardData = await db.getLeaderboard({
        timeFilter,
        limit: 50
      });
      
      setLeaderboard(
        leaderboardData.map((entry: any) => ({
          ...entry,
          games_played: entry.games_played ?? 0,
        }))
      );
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUserRank = async () => {
    try {
      const { data: { user: authUser } } = await db.getUser();
      if (!authUser) return;

      const stats = await db.getUserStats(authUser.id);
      const userData = await db.getUserById(authUser.id);

      if (userData) {
        setCurrentUser({
          id: userData.id,
          full_name: userData.full_name,
          points: userData.points || 0,
          rank: stats.rank,
          avatar_url: userData.avatar_url,
          games_played: stats.gamesPlayed,
        });
      }
    } catch (error) {
      console.error('Error loading current user rank:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={24} color="#FFD700" />;
      case 2:
        return <Medal size={24} color="#C0C0C0" />;
      case 3:
        return <Award size={24} color="#CD7F32" />;
      default:
        return <Trophy size={20} color="#666" />;
    }
  };

  const getRankColor = (rank: number): [string, string] => {
    switch (rank) {
      case 1:
        return ['#FFD700', '#FFA000'];
      case 2:
        return ['#C0C0C0', '#9E9E9E'];
      case 3:
        return ['#CD7F32', '#8D4E2A'];
      default:
        return ['#FFF', '#F5F5F5'];
    }
  };

  const filterButtons = [
    { key: 'all' as const, label: 'All Time' },
    { key: 'month' as const, label: 'This Month' },
    { key: 'week' as const, label: 'This Week' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Top Tamil word masters</Text>
        
        {currentUser && (
          <View style={styles.currentUserCard}>
            <View style={styles.currentUserInfo}>
              <View style={styles.currentUserRank}>
                {getRankIcon(currentUser.rank)}
                <Text style={styles.currentUserRankText}>#{currentUser.rank}</Text>
              </View>
              <View>
                <Text style={styles.currentUserName}>{currentUser.full_name}</Text>
                <Text style={styles.currentUserPoints}>{currentUser.points} points</Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.filterContainer}>
        {filterButtons.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              timeFilter === filter.key && styles.filterButtonActive
            ]}
            onPress={() => setTimeFilter(filter.key)}
          >
            <Text style={[
              styles.filterButtonText,
              timeFilter === filter.key && styles.filterButtonTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.leaderboardContainer}>
        {leaderboard.slice(0, 3).map((user) => (
          <LinearGradient
            key={user.id}
            colors={getRankColor(user.rank)}
            style={[styles.topPlayerCard, user.rank === 1 && styles.topPlayerCardFirst]}
          >
            <View style={styles.topPlayerRank}>
              {getRankIcon(user.rank)}
            </View>
            <View style={styles.topPlayerAvatar}>
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Text style={styles.avatarText}>
                    {user.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[
              styles.topPlayerName,
              user.rank <= 3 && { color: user.rank === 1 ? '#FFF' : '#333' }
            ]}>
              {user.full_name}
            </Text>
            <Text style={[
              styles.topPlayerPoints,
              user.rank <= 3 && { color: user.rank === 1 ? '#FFF' : '#666' }
            ]}>
              {user.points} points
            </Text>
            <Text style={[
              styles.topPlayerGames,
              user.rank <= 3 && { color: user.rank === 1 ? '#FFF' : '#666' }
            ]}>
              {user.games_played} games
            </Text>
          </LinearGradient>
        ))}

        <View style={styles.otherPlayersContainer}>
          <Text style={styles.otherPlayersTitle}>Other Players</Text>
          {leaderboard.slice(3).map((user) => (
            <View key={user.id} style={styles.playerCard}>
              <View style={styles.playerRank}>
                <Text style={styles.rankNumber}>#{user.rank}</Text>
              </View>
              <View style={styles.playerAvatar}>
                {user.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.smallAvatarImage} />
                ) : (
                  <View style={styles.smallDefaultAvatar}>
                    <Text style={styles.smallAvatarText}>
                      {user.full_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{user.full_name}</Text>
                <Text style={styles.playerStats}>
                  {user.points} points • {user.games_played} games
                </Text>
              </View>
            </View>
          ))}
        </View>
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
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20,
  },
  currentUserCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
  },
  currentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserRank: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  currentUserRankText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  currentUserName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentUserPoints: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  leaderboardContainer: {
    padding: 20,
    paddingTop: 0,
  },
  topPlayerCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  topPlayerCardFirst: {
    marginTop: 10,
    transform: [{ scale: 1.05 }],
  },
  topPlayerRank: {
    marginBottom: 10,
  },
  topPlayerAvatar: {
    marginBottom: 10,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  topPlayerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  topPlayerPoints: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  topPlayerGames: {
    fontSize: 14,
    opacity: 0.8,
  },
  otherPlayersContainer: {
    marginTop: 20,
  },
  otherPlayersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  playerCard: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerRank: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  playerAvatar: {
    marginHorizontal: 15,
  },
  smallAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  smallDefaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  playerStats: {
    fontSize: 14,
    color: '#666',
  },
});