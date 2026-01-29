# Task 04: Navigation Setup

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Tasks 00-03 complete |
| **Estimated time** | 15 minutes |

## What Needs to Happen

Set up Expo Router navigation with tabs, auth redirect, and nested screens.

## Implementation

### 1. Update Root Layout
Update `app/_layout.tsx`:
```typescript
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import '../services/firebase';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="event" />
        <Stack.Screen name="group" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
```

### 2. Create Tabs Layout
Create/update `app/(tabs)/_layout.tsx`:
```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### 3. Create Tab Screens (Placeholders)
Create `app/(tabs)/index.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Feed Screen</Text>
      <Text style={styles.subtext}>Events will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
```

Create `app/(tabs)/groups.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';

export default function GroupsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Groups Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 24, fontWeight: 'bold' },
});
```

Create `app/(tabs)/profile.tsx`:
```typescript
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
      <Text style={styles.subtext}>{user?.fullName}</Text>
      <Text style={styles.subtext}>@{user?.username}</Text>
      <View style={{ marginTop: 20 }}>
        <Button title="Logout" onPress={logout} color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 24, fontWeight: 'bold' },
  subtext: { fontSize: 16, color: '#666', marginTop: 4 },
});
```

### 4. Create Event Routes (Placeholders)
Create `app/event/_layout.tsx`:
```typescript
import { Stack } from 'expo-router';

export default function EventLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: 'Event' }} />
      <Stack.Screen name="create" options={{ title: 'New Event', presentation: 'modal' }} />
    </Stack>
  );
}
```

Create `app/event/[id].tsx`:
```typescript
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Event: {id}</Text>
    </View>
  );
}
```

Create `app/event/create.tsx`:
```typescript
import { View, Text } from 'react-native';

export default function CreateEventScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Create Event</Text>
    </View>
  );
}
```

### 5. Create Group Routes (Placeholders)
Create `app/group/_layout.tsx`:
```typescript
import { Stack } from 'expo-router';

export default function GroupLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: 'Group' }} />
      <Stack.Screen name="create" options={{ title: 'New Group', presentation: 'modal' }} />
    </Stack>
  );
}
```

Create `app/group/[id].tsx` and `app/group/create.tsx` similarly.

## Files to Create/Modify
- [ ] `app/_layout.tsx` - Root layout with auth redirect
- [ ] `app/(tabs)/_layout.tsx` - Tab navigation
- [ ] `app/(tabs)/index.tsx` - Feed placeholder
- [ ] `app/(tabs)/groups.tsx` - Groups placeholder
- [ ] `app/(tabs)/profile.tsx` - Profile placeholder
- [ ] `app/event/_layout.tsx` - Event stack
- [ ] `app/event/[id].tsx` - Event detail placeholder
- [ ] `app/event/create.tsx` - Create event placeholder
- [ ] `app/group/_layout.tsx` - Group stack
- [ ] `app/group/[id].tsx` - Group detail placeholder
- [ ] `app/group/create.tsx` - Create group placeholder

## Acceptance Criteria
- [ ] Unauthenticated users see login screen
- [ ] Authenticated users see tab navigation
- [ ] Three tabs: Feed, Groups, Profile
- [ ] Can navigate to event detail and create screens
- [ ] Logout returns to login screen

## Commit
```bash
git add .
git commit -m "🍐 PearGuy: Set up navigation structure"
```
