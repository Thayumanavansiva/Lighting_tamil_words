import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import db from '@/lib/db';
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
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Function to validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Function to validate password strength
  const isValidPassword = (password: string): boolean => {
    // At least 6 characters, 1 letter, and 1 number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    return passwordRegex.test(password);
  };

  const handleSignup = async (): Promise<void> => {
    console.log('Button clicked - Starting signup validation...');
    Alert.alert('Debug', 'Signup process started');
    
    // Validation checks
    const validationErrors = [];

    // 1. Full Name Validation
    if (!formData.fullName?.trim()) {
      validationErrors.push('Full Name is required');
    } else if (formData.fullName.trim().length < 2) {
      validationErrors.push('Full Name must be at least 2 characters long');
    }

    // 2. Email Validation
    if (!formData.email?.trim()) {
      validationErrors.push('Email is required');
    } else if (!isValidEmail(formData.email)) {
      validationErrors.push('Please enter a valid email address');
    }

    // 3. Password Validation
    if (!formData.password) {
      validationErrors.push('Password is required');
    } else if (!isValidPassword(formData.password)) {
      validationErrors.push('Password must be at least 6 characters long and contain at least one letter and one number');
    }

    // 4. Confirm Password Validation
    if (formData.password !== formData.confirmPassword) {
      validationErrors.push('Passwords do not match');
    }

    // 5. Role Validation (optional)
    if (!['student', 'teacher'].includes(formData.role)) {
      validationErrors.push('Please select a valid role');
    }

    console.log('Validation complete. Errors found:', validationErrors.length);

    // If there are any validation errors, show them all
    if (validationErrors.length > 0) {
      Alert.alert(
        'Signup Error',
        validationErrors.join('\n\n'),
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setLoading(true);
    console.log('Starting signup process...');
    try {
      Alert.alert('Debug', 'Starting signup request...');
      console.log('Validation passed, form data:', {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        schoolName: formData.schoolName,
        grade: formData.grade,
        passwordLength: formData.password.length
      });
      
      console.log('Attempting to sign up with:', { 
        email: formData.email, 
        fullName: formData.fullName, 
        role: formData.role 
      });
      
      const result = await db.signUp(formData.email, formData.password, formData.fullName, formData.role);
      Alert.alert('Debug', 'Signup API response received');
      console.log('Signup response:', result);
      
      console.log('Checking signup result:', result);
      Alert.alert('Debug', 'Processing signup response: ' + JSON.stringify(result));
      
      if (result?.user) {
        console.log('Successfully created account, navigating to login...');
        Alert.alert(
          'Success!', 
          'Account created successfully! Please sign in to continue.',
          [
            {
              text: 'Sign In',
              onPress: () => {
                console.log('Navigating to login screen...');
                router.replace('/auth/login');
              },
            }
          ]
        );
      } else {
        console.log('Invalid signup response:', result);
        throw new Error('Failed to create account: Invalid response format');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert(
        'Signup Failed', 
        `Error: ${error.message || 'An unknown error occurred during signup.'}\n\nPlease try again.`
      );
    } finally {
      console.log('Signup process completed, loading:', loading);
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
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder="Full Name *"
                placeholderTextColor="#999"
                value={formData.fullName}
                onChangeText={(text) => {
                  console.log('Updating fullName:', text);
                  setFormData({ ...formData, fullName: text });
                  // Validate full name
                  if (text.trim().length < 2) {
                    setErrors(prev => ({ ...prev, fullName: 'Full name must be at least 2 characters' }));
                  } else {
                    setErrors(prev => ({ ...prev, fullName: undefined }));
                  }
                }}
                autoCapitalize="words"
              />
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(text) => {
                  console.log('Updating email:', text);
                  setFormData({ ...formData, email: text });
                  // Validate email
                  if (!isValidEmail(text)) {
                    setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
                  } else {
                    setErrors(prev => ({ ...prev, email: undefined }));
                  }
                }}
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
              onPress={() => {
                console.log('Signup button pressed');
                handleSignup().catch(error => {
                  console.error('Error in handleSignup:', error);
                  Alert.alert('Error', 'Failed to process signup: ' + error.message);
                });
              }}
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
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 15,
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