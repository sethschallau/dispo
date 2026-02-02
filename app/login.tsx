/**
 * Login Screen
 *
 * Simple phone + name input for MVP "fake auth"
 * No SMS verification - just stores phone as user ID
 */

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const [countryCode, setCountryCode] = useState('1');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}: ${message}`);
    }
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If already authenticated, redirect to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    // Basic validation
    if (!phone.trim()) {
      showAlert('Error', 'Please enter your phone number');
      return;
    }
    if (!fullName.trim()) {
      showAlert('Error', 'Please enter your name');
      return;
    }

    // Combine country code with phone number
    const fullPhone = `${countryCode.replace(/\D/g, '')}${phone.replace(/\D/g, '')}`;

    setIsSubmitting(true);
    try {
      await login(fullPhone, fullName);
      // Navigate to main app after successful login
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login failed:', error);
      showAlert('Error', 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
      <View style={styles.content}>
        {/* Logo/Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Dispo</Text>
          <Text style={styles.subtitle}>Let's hang out</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Country Code + Phone Number Row */}
          <View style={styles.phoneRow}>
            <View style={styles.countryCodeContainer}>
              <Text style={styles.plusSign}>+</Text>
              <TextInput
                style={styles.countryCodeInput}
                placeholder="1"
                placeholderTextColor="#999"
                value={countryCode}
                onChangeText={setCountryCode}
                keyboardType="number-pad"
                maxLength={3}
                editable={!isSubmitting}
              />
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone Number"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoComplete="tel"
              autoCorrect={false}
              editable={!isSubmitting}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
            autoCorrect={false}
            editable={!isSubmitting}
          />

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.infoText}>
            No verification needed. Just enter any phone number to get started.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  form: {
    gap: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  plusSign: {
    fontSize: 16,
    color: '#333',
  },
  countryCodeInput: {
    width: 40,
    height: 56,
    fontSize: 16,
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    marginTop: 32,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
