# Task 05: Login Screen

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Tasks 00-04 complete |
| **Estimated time** | 15 minutes |

## What Needs to Happen

Create the fake login screen where users enter phone number and name. Same as iOS MVP - no real auth verification.

## Implementation

### Create `app/login.tsx`
```typescript
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = phone.replace(/\D/g, '').length >= 10 && fullName.trim().length > 0;

  const handleLogin = async () => {
    if (!isValid) {
      Alert.alert('Invalid Input', 'Please enter a valid phone number and name.');
      return;
    }

    setIsLoading(true);
    try {
      await login(phone, fullName.trim());
      // Navigation happens automatically via auth context
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (text: string) => {
    // Remove non-digits
    const digits = text.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🗓️</Text>
          <Text style={styles.title}>Dispo</Text>
          <Text style={styles.subtitle}>Plan events with friends</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(text) => setPhone(formatPhone(text))}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={14}
          />

          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
            autoComplete="name"
            autoCapitalize="words"
          />

          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
});
```

## Files to Create
- [ ] `app/login.tsx`

## Acceptance Criteria
- [ ] Phone input formats as user types
- [ ] Validation requires 10+ digits and non-empty name
- [ ] Button disabled when invalid
- [ ] Loading state during login
- [ ] Successful login redirects to main app
- [ ] User appears in Firestore

## Test Flow
1. Start app (should redirect to login)
2. Enter phone: `9195551234`
3. Enter name: `Test User`
4. Tap Continue
5. Should redirect to Feed tab
6. Check Firestore - user document should exist

## Commit
```bash
git add .
git commit -m "🍐 PearGuy: Add login screen"
```
