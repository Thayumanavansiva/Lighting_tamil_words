import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import db from '@/lib/db';
import { Eye, EyeOff, Mail, Lock, User, GraduationCap } from 'lucide-react-native';

type Role = 'student' | 'teacher';

interface LocalSignupResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    schoolName: string;
    grade?: string;
  };
  token: string;
}

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as Role,
    schoolName: '',
    grade: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ 
    fullName?: string; 
    email?: string; 
    password?: string; 
    confirmPassword?: string; 
  }>({});

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    return passwordRegex.test(password);
  };

  const handleSignup = async () => {
    const validationErrors: string[] = [];

    if (!formData.fullName.trim()) {
      validationErrors.push('Full Name is required');
    } else if (formData.fullName.trim().length < 2) {
      validationErrors.push('Full Name must be at least 2 characters long');
    }
    if (!formData.email.trim()) {
      validationErrors.push('Email is required');
    } else if (!isValidEmail(formData.email)) {
      validationErrors.push('Please enter a valid email address');
    }
    if (!formData.password) {
      validationErrors.push('Password is required');
    } else if (!isValidPassword(formData.password)) {
      validationErrors.push('Password must be at least 6 characters long and contain at least one letter and one number');
    }
    if (formData.password !== formData.confirmPassword) {
      validationErrors.push('Passwords do not match');
    }
    if (!['student', 'teacher'].includes(formData.role)) {
      validationErrors.push('Please select a valid role');
    }
    if (!formData.schoolName.trim()) {
      validationErrors.push('School/Institution Name is required');
    }
    if (formData.role === 'student' && !formData.grade.trim()) {
      validationErrors.push('Grade/Class is required for students');
    }

    if (validationErrors.length > 0) {
      Alert.alert(
        'Signup Error',
        validationErrors.join('\n\n'),
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setLoading(true);
    try {
      // Pass form data as a single object
      const response = await db.signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
        schoolName: formData.schoolName,
        grade: formData.role === 'student' ? formData.grade : undefined
      });

      // Transform the response to match LocalSignupResponse
      const dbResult: LocalSignupResponse = {
        user: {
          ...response.user,
          schoolName: formData.schoolName,
          grade: formData.role === 'student' ? formData.grade : undefined
        },
        token: response.token
      };

      if (!dbResult || !dbResult.user || !dbResult.token) {
        throw new Error('Invalid server response');
      }

      await AsyncStorage.setItem('userToken', dbResult.token);

      Alert.alert('Success!', 'Account created successfully!', [
        { text: 'Continue', onPress: () => router.replace('/auth/login') }
      ]);
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred.';
      if (error?.message?.includes('Network')) {
        errorMessage = 'Please check your internet connection.';
      } else if (error?.message?.includes('already exists')) {
        errorMessage = 'An account with this email already exists.';
      } else if (error?.message?.includes('Invalid server response')) {
        errorMessage = 'Server error. Please try again later.';
      }
      Alert.alert('Signup Failed', errorMessage, [{ text: 'Try Again', onPress: () => setLoading(false) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
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
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder="Full Name *"
                placeholderTextColor="#999"
                value={formData.fullName}
                onChangeText={text => {
                  setFormData({ ...formData, fullName: text });
                  setErrors(prev => ({
                    ...prev,
                    fullName: text.trim().length < 2 ? 'Full name must be at least 2 characters' : undefined
                  }));
                }}
                autoCapitalize="words"
              />
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={text => {
                  setFormData({ ...formData, email: text });
                  setErrors(prev => ({
                    ...prev,
                    email: !isValidEmail(text) ? 'Please enter a valid email address' : undefined
                  }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password *"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={text => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password *"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={text => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
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
                onChangeText={text =>
                  setFormData({ ...formData, schoolName: text })
                }
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
                  onChangeText={text => setFormData({ ...formData, grade: text })}
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
  container: { flex: 1, paddingTop: 40 },
  scrollView: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#e0e0e0' },
  formContainer: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 20, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  inputContainer: { marginBottom: 16, position: 'relative' },
  input: { height: 48, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingLeft: 40, paddingRight: 40, fontSize: 16, backgroundColor: '#fff', color: '#333' },
  inputIcon: { position: 'absolute', left: 10, top: 14, zIndex: 1 },
  eyeIcon: { position: 'absolute', right: 10, top: 14, zIndex: 1 },
  inputError: { borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: 12, marginTop: 4, marginLeft: 4 },
  roleContainer: { marginBottom: 16 },
  roleLabel: { fontSize: 16, color: '#333', marginBottom: 8 },
  roleButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  roleButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginRight: 8, backgroundColor: '#f5f5f5' },
  roleButtonActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  roleButtonText: { textAlign: 'center', color: '#333', fontWeight: '500' },
  roleButtonTextActive: { color: '#fff', fontWeight: 'bold' },
  signupButton: { backgroundColor: '#667eea', paddingVertical: 14, borderRadius: 8, marginTop: 16, alignItems: 'center' },
  signupButtonDisabled: { backgroundColor: '#a3bffa' },
  signupButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  loginText: { color: '#333', fontSize: 15 },
  loginLink: { marginLeft: 4 },
  loginLinkText: { color: '#667eea', fontWeight: 'bold', fontSize: 15 },
});
