import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { signUp } from '@/lib/db';
import { Eye, EyeOff, Mail, Lock, User, GraduationCap } from 'lucide-react-native';

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'teacher',
    schoolName: '',
    grade: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signUp(formData.email, formData.password, formData.fullName, formData.role);
      Alert.alert(
        'Success!', 
        'Account created successfully! Please sign in to continue.',
        [
          {
            text: 'Sign In',
            onPress: () => router.replace('/auth/login'),
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Join the Game!</Text>
            <Text style={styles.subtitle}>Create your Tamil Word Game account</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor="#999"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password *"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password *"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>I am a:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[styles.roleButton, formData.role === 'student' && styles.roleButtonActive]}
                  onPress={() => setFormData({ ...formData, role: 'student' })}
                >
                  <Text style={[styles.roleButtonText, formData.role === 'student' && styles.roleButtonTextActive]}>
                    Student
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, formData.role === 'teacher' && styles.roleButtonActive]}
                  onPress={() => setFormData({ ...formData, role: 'teacher' })}
                >
                  <Text style={[styles.roleButtonText, formData.role === 'teacher' && styles.roleButtonTextActive]}>
                    Teacher
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <GraduationCap size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={formData.role === 'student' ? 'School Name' : 'Institution Name'}
                placeholderTextColor="#999"
                value={formData.schoolName}
                onChangeText={(text) => setFormData({ ...formData, schoolName: text })}
                autoCapitalize="words"
              />
            </View>

            {formData.role === 'student' && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { marginLeft: 30 }]}
                  placeholder="Grade/Class"
                  placeholderTextColor="#999"
                  value={formData.grade}
                  onChangeText={(text) => setFormData({ ...formData, grade: text })}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.signupButton, loading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href="/auth/login" style={styles.loginLink}>
                <Text style={styles.loginLinkText}>Sign In</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 15,
  },
  eyeIcon: {
    padding: 5,
  },
  roleContainer: {
    marginBottom: 15,
  },
  roleLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleButtonActive: {
    backgroundColor: '#667eea20',
    borderColor: '#667eea',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#667eea',
  },
  signupButton: {
    backgroundColor: '#667eea',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {},
  loginLinkText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: 'bold',
  },
});