/**
 * Login Screen
 *
 * Industrial ethereal aesthetic with chrome accents
 */

import Theme from '@/constants/Theme';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.accent} />
      </View>
    );
  }

  // If already authenticated, redirect to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    if (!phone.trim()) {
      showAlert('Error', 'Please enter your phone number');
      return;
    }
    if (!fullName.trim()) {
      showAlert('Error', 'Please enter your name');
      return;
    }

    const fullPhone = `${countryCode.replace(/\D/g, '')}${phone.replace(/\D/g, '')}`;

    setIsSubmitting(true);
    try {
      await login(fullPhone, fullName);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login failed:', error);
      showAlert('Error', 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[Theme.colors.background, Theme.colors.backgroundElevated, Theme.colors.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Accent glow */}
      <View style={styles.glowOrb} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Logo/Title */}
            <View style={styles.header}>
              <Text style={styles.title}>Dispo</Text>
              <View style={styles.titleAccent} />
              <Text style={styles.subtitle}>Let's hang out</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Phone Row */}
              <View style={styles.phoneRow}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.plusSign}>+</Text>
                  <TextInput
                    style={styles.countryCodeInput}
                    placeholder="1"
                    placeholderTextColor={Theme.colors.textMuted}
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
                  placeholderTextColor={Theme.colors.textMuted}
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
                placeholderTextColor={Theme.colors.textMuted}
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
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[Theme.colors.accent, Theme.colors.accentMuted]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </LinearGradient>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  glowOrb: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    width: 300,
    height: 300,
    marginLeft: -150,
    borderRadius: 150,
    backgroundColor: Theme.colors.accent,
    opacity: 0.06,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 100,
      },
    }),
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
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
    fontSize: 52,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -1,
  },
  titleAccent: {
    width: 60,
    height: 3,
    backgroundColor: Theme.colors.accent,
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  form: {
    gap: 14,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 14,
    backgroundColor: Theme.colors.backgroundCard,
  },
  plusSign: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
  },
  countryCodeInput: {
    width: 36,
    height: 56,
    fontSize: 16,
    textAlign: 'center',
    color: Theme.colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Theme.colors.backgroundCard,
    color: Theme.colors.textPrimary,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Theme.colors.backgroundCard,
    color: Theme.colors.textPrimary,
  },
  button: {
    height: 56,
    borderRadius: Theme.radius.md,
    overflow: 'hidden',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  info: {
    marginTop: 36,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
