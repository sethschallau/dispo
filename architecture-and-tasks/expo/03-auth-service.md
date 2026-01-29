# Task 03: Auth Service & Context

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Tasks 00-02 complete |
| **Estimated time** | 15 minutes |

## What Needs to Happen

Create authentication service and React context for managing user state. MVP uses fake auth (phone number as ID), same as iOS version.

## Implementation

### 1. Create Auth Service
Create `services/auth.ts`:
```typescript
import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

const USER_ID_KEY = '@dispo_user_id';

export const authService = {
  /** Get stored user ID */
  async getStoredUserId(): Promise<string | null> {
    return AsyncStorage.getItem(USER_ID_KEY);
  },

  /** Store user ID locally */
  async storeUserId(userId: string): Promise<void> {
    await AsyncStorage.setItem(USER_ID_KEY, userId);
  },

  /** Clear stored user ID (logout) */
  async clearUserId(): Promise<void> {
    await AsyncStorage.removeItem(USER_ID_KEY);
  },

  /** Get user from Firestore */
  async getUser(userId: string): Promise<User | null> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  },

  /** Create or update user in Firestore */
  async createUser(userId: string, data: Partial<User>): Promise<User> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // User exists, return existing
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    
    // Create new user
    const newUser: Omit<User, 'id'> = {
      username: data.username || userId,
      fullName: data.fullName || '',
      phone: data.phone || userId,
      bio: '',
      groupIds: [],
      createdAt: serverTimestamp() as any,
      ...data,
    };
    
    await setDoc(docRef, newUser);
    return { id: userId, ...newUser };
  },

  /** Update user profile */
  async updateProfile(userId: string, data: Partial<User>): Promise<void> {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, data);
  },

  /** Fake login - use phone as user ID */
  async login(phone: string, fullName: string): Promise<User> {
    // Normalize phone (remove non-digits)
    const userId = phone.replace(/\D/g, '');
    
    // Create or get user
    const user = await this.createUser(userId, {
      phone: userId,
      fullName,
      username: userId,
    });
    
    // Store locally
    await this.storeUserId(userId);
    
    return user;
  },

  /** Logout */
  async logout(): Promise<void> {
    await this.clearUserId();
  },
};
```

### 2. Create Auth Context
Create `hooks/useAuth.tsx`:
```typescript
import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { authService } from '@/services/auth';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedId = await authService.getStoredUserId();
      if (storedId) {
        const userData = await authService.getUser(storedId);
        if (userData) {
          setUser(userData);
          setUserId(storedId);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, fullName: string) => {
    setIsLoading(true);
    try {
      const userData = await authService.login(phone, fullName);
      setUser(userData);
      setUserId(userData.id || null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setUserId(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!userId) return;
    await authService.updateProfile(userId, data);
    await refreshUser();
  };

  const refreshUser = async () => {
    if (!userId) return;
    const userData = await authService.getUser(userId);
    if (userData) {
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 3. Add Provider to App
Update `app/_layout.tsx`:
```typescript
import { AuthProvider } from '@/hooks/useAuth';

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* existing layout content */}
    </AuthProvider>
  );
}
```

## Files to Create
- [ ] `services/auth.ts`
- [ ] `hooks/useAuth.tsx`
- [ ] Update `app/_layout.tsx`

## Acceptance Criteria
- [ ] Auth context provides user state
- [ ] Login creates/fetches user from Firestore
- [ ] User ID persists across app restarts
- [ ] Logout clears local storage
- [ ] `useAuth()` hook works in components

## Test
```typescript
// In any component:
import { useAuth } from '@/hooks/useAuth';

function TestComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  console.log('Authenticated:', isAuthenticated);
  console.log('User:', user);
  
  // Test login
  // await login('9195551234', 'Test User');
}
```

## Commit
```bash
git add .
git commit -m "🍐 PearGuy: Add auth service and context"
```
