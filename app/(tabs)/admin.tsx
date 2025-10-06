import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import db from '@/lib/db';
import { User, Word } from '@/types/api';

interface WordRequest {
  id: string;
  word: string;
  meaning_ta: string;
  meaning_en?: string;
  domain?: string;
  period?: string;
  modern_equivalent?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_response?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  users?: {
    full_name: string;
  };
}
import { Plus, Eye, Check, X, Users, BookOpen, Settings, Search } from 'lucide-react-native';

export default function AdminScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'words' | 'users' | 'requests'>('dashboard');
  const [words, setWords] = useState<Word[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [wordRequests, setWordRequests] = useState<WordRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [newWord, setNewWord] = useState({
    word: '',
    meaning_ta: '',
    meaning_en: '',
    domain: '',
    period: '',
    modern_equivalent: '',
    notes: '',
  });

  useEffect(() => {
    loadUserData();
    loadDashboardData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await db.getUser();
      if (user) {
        setUser(user);
        
        // Check if user is a teacher (assuming teachers have admin access)
        if (user?.role !== 'teacher') {
          Alert.alert('Access Denied', 'You do not have admin privileges.');
          return;
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [wordsRes, usersRes, requestsRes] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/words`),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users`),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/word-requests`)
      ]);

      if (!wordsRes.ok || !usersRes.ok || !requestsRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const [words, users, requests] = await Promise.all([
        wordsRes.json(),
        usersRes.json(),
        requestsRes.json()
      ]);

      setWords(words || []);
      setUsers(users || []);
      setWordRequests(requests || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const addNewWord = async () => {
    if (!newWord.word || !newWord.meaning_ta) {
      Alert.alert('Error', 'Word and Tamil meaning are required.');
      return;
    }

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newWord,
          difficulty: 'medium', // Default difficulty
          approved: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add word');
      }

      Alert.alert('Success', 'Word added successfully!');
      setShowAddWordModal(false);
      setNewWord({
        word: '',
        meaning_ta: '',
        meaning_en: '',
        domain: '',
        period: '',
        modern_equivalent: '',
        notes: '',
      });
      loadDashboardData();
    } catch (error) {
      console.error('Error adding word:', error);
      Alert.alert('Error', 'Failed to add word. Please try again.');
    }
  };

  const handleWordRequest = async (requestId: string, action: 'approve' | 'reject', adminResponse?: string) => {
    try {
      if (action === 'approve') {
        // First approve the word request
        const request = wordRequests.find(r => r.id === requestId);
        if (!request) return;

        // Add word to words table
        const addWordResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/words`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            word: request.word,
            meaning_ta: request.meaning_ta,
            notes: request.notes,
            difficulty: 'medium', // Default difficulty
            approved: true,
          }),
        });

        if (!addWordResponse.ok) {
          throw new Error('Failed to add word');
        }
      }

      // Update request status
      const updateResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/word-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_response: adminResponse,
          reviewed_at: new Date().toISOString(),
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update request');
      }

      Alert.alert('Success', `Request ${action}d successfully!`);
      loadDashboardData();
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      Alert.alert('Error', `Failed to ${action} request. Please try again.`);
    }
  };

  const toggleWordApproval = async (wordId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/words/${wordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update word status');
      }

      loadDashboardData();
    } catch (error) {
      console.error('Error updating word approval:', error);
      Alert.alert('Error', 'Failed to update word status.');
    }
  };

  const filteredWords = words.filter(word =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    word.meaning_ta?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading admin panel...</Text>
      </View>
    );
  }

  if (!user || user.role !== 'teacher') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSubtext}>Teacher privileges required</Text>
      </View>
    );
  }

  const dashboardStats = {
    totalWords: words.length,
    approvedWords: words.filter(w => w.approved).length,
    totalUsers: users.length,
    pendingRequests: wordRequests.filter(r => r.status === 'pending').length,
    students: users.filter(u => u.role === 'student').length,
    teachers: users.filter(u => u.role === 'teacher').length,
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <Text style={styles.headerSubtitle}>Manage Tamil Word Game</Text>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        {[
          { key: 'dashboard', label: 'Dashboard', icon: Settings },
          { key: 'words', label: 'Words', icon: BookOpen },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'requests', label: 'Requests', icon: Eye },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <tab.icon size={20} color={activeTab === tab.key ? '#FF6B35' : '#666'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'dashboard' && (
          <View style={styles.dashboardContainer}>
            <Text style={styles.sectionTitle}>System Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <BookOpen size={24} color="#FF6B35" />
                <Text style={styles.statNumber}>{dashboardStats.totalWords}</Text>
                <Text style={styles.statLabel}>Total Words</Text>
              </View>
              <View style={styles.statCard}>
                <Check size={24} color="#4ECDC4" />
                <Text style={styles.statNumber}>{dashboardStats.approvedWords}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>
              <View style={styles.statCard}>
                <Users size={24} color="#45B7D1" />
                <Text style={styles.statNumber}>{dashboardStats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statCard}>
                <Eye size={24} color="#FFA726" />
                <Text style={styles.statNumber}>{dashboardStats.pendingRequests}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            <View style={styles.userBreakdown}>
              <Text style={styles.sectionTitle}>User Breakdown</Text>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Students</Text>
                <Text style={styles.breakdownValue}>{dashboardStats.students}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Teachers</Text>
                <Text style={styles.breakdownValue}>{dashboardStats.teachers}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Admins</Text>
                <Text style={styles.breakdownValue}>1</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'words' && (
          <View style={styles.wordsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Words Management</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddWordModal(true)}
              >
                <Plus size={20} color="#FFF" />
                <Text style={styles.addButtonText}>Add Word</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search words..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {filteredWords.map((word) => (
              <View key={word.id} style={styles.wordCard}>
                <View style={styles.wordHeader}>
                  <Text style={styles.wordTitle}>{word.word}</Text>
                  <TouchableOpacity
                    style={[styles.statusBadge, word.approved ? styles.approvedBadge : styles.pendingBadge]}
                    onPress={() => toggleWordApproval(word.id, word.approved)}
                  >
                    <Text style={styles.statusText}>
                      {word.approved ? 'Approved' : 'Pending'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.wordMeaning}>Tamil: {word.meaning_ta}</Text>
                {word.notes && (
                  <Text style={styles.wordDetail}>Notes: {word.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.usersContainer}>
            <Text style={styles.sectionTitle}>Users Management</Text>
            
            <View style={styles.searchContainer}>
              <Search size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {filteredUsers.map((userData) => (
              <View key={userData.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userData.fullName}</Text>
                  <Text style={styles.userEmail}>{userData.email}</Text>
                  <View style={styles.userStats}>
                    <Text style={styles.userRole}>{userData.role.toUpperCase()}</Text>
                    <Text style={styles.userPoints}>{userData.points || 0} points</Text>
                    <Text style={styles.userLevel}>Level {userData.level || 1}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'requests' && (
          <View style={styles.requestsContainer}>
            <Text style={styles.sectionTitle}>Word Requests</Text>
            
            {wordRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestWord}>{request.word}</Text>
                  <View style={[
                    styles.requestStatusBadge,
                    request.status === 'approved' ? styles.approvedBadge :
                    request.status === 'rejected' ? styles.rejectedBadge : styles.pendingBadge
                  ]}>
                    <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
                  </View>
                </View>
                
                <Text style={styles.requestTeacher}>
                  Requested by: {(request as any).users?.full_name}
                </Text>
                <Text style={styles.requestMeaning}>Tamil: {request.meaning_ta}</Text>
                {request.meaning_en && (
                  <Text style={styles.requestMeaning}>English: {request.meaning_en}</Text>
                )}
                
                {request.status === 'pending' && (
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.approveButton]}
                      onPress={() => handleWordRequest(request.id, 'approve')}
                    >
                      <Check size={16} color="#FFF" />
                      <Text style={styles.requestButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.rejectButton]}
                      onPress={() => handleWordRequest(request.id, 'reject', 'Request rejected by admin')}
                    >
                      <X size={16} color="#FFF" />
                      <Text style={styles.requestButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Word Modal */}
      <Modal
        visible={showAddWordModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Word</Text>
            <TouchableOpacity onPress={() => setShowAddWordModal(false)}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Tamil Word *"
              value={newWord.word}
              onChangeText={(text) => setNewWord({ ...newWord, word: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Tamil Meaning *"
              value={newWord.meaning_ta}
              onChangeText={(text) => setNewWord({ ...newWord, meaning_ta: text })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="English Meaning"
              value={newWord.meaning_en}
              onChangeText={(text) => setNewWord({ ...newWord, meaning_en: text })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Domain (e.g., Volume, Time)"
              value={newWord.domain}
              onChangeText={(text) => setNewWord({ ...newWord, domain: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Period (e.g., Classical, Medieval)"
              value={newWord.period}
              onChangeText={(text) => setNewWord({ ...newWord, period: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Modern Equivalent"
              value={newWord.modern_equivalent}
              onChangeText={(text) => setNewWord({ ...newWord, modern_equivalent: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Notes"
              value={newWord.notes}
              onChangeText={(text) => setNewWord({ ...newWord, notes: text })}
              multiline
            />

            <TouchableOpacity style={styles.submitButton} onPress={addNewWord}>
              <Text style={styles.submitButtonText}>Add Word</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 5,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
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
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 5,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 10,
    gap: 5,
  },
  activeTab: {
    backgroundColor: '#FF6B3520',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  // Dashboard styles
  dashboardContainer: {},
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
  userBreakdown: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // Words styles
  wordsContainer: {},
  wordCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wordTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  wordMeaning: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  wordDetail: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  approvedBadge: {
    backgroundColor: '#4ECDC4',
  },
  pendingBadge: {
    backgroundColor: '#FFA726',
  },
  rejectedBadge: {
    backgroundColor: '#FF6B6B',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  // Users styles
  usersContainer: {},
  userCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {},
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userStats: {
    flexDirection: 'row',
    gap: 15,
  },
  userRole: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  userPoints: {
    fontSize: 12,
    color: '#4ECDC4',
  },
  userLevel: {
    fontSize: 12,
    color: '#45B7D1',
  },
  // Requests styles
  requestsContainer: {},
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  requestWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  requestStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  requestTeacher: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  requestMeaning: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  requestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  approveButton: {
    backgroundColor: '#4ECDC4',
  },
  rejectButton: {
    backgroundColor: '#FF6B6B',
  },
  requestButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});