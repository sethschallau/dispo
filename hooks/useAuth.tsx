/**
 * Auth Context and Hook
 * 
 * Provides authentication state management across the app.
 * Ported from Swift: archive/swift-ios/dispo/Services/AuthService.swift (@MainActor pattern)
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authService } from '@/services/auth';
import { User } from '@/types';

interface AuthContextType {
  /** Current user object (null if not logged in) */
  user: User | null;
  /** Current user ID (null if not logged in) */
  userId: string | null;
  /** Whether auth state is being loaded */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Log in with phone and name */
  login: (phone: string, fullName: string) => Promise<void>;
  /** Log out */
  logout: () => Promise<void>;
  /** Update user profile */
  updateProfile: (data: Partial<User>) => Promise<void>;
  /** Refresh user data from Firestore */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check for existing auth session on app start
   */
  const checkAuth = async () => {
    try {
      const storedId = await authService.getStoredUserId();
      if (storedId) {
        const userData = await authService.getUser(storedId);
        if (userData) {
          setUser(userData);
          setUserId(storedId);
        } else {
          // User document doesn't exist anymore, clear local session
          await authService.clearUserId();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Log in with phone number and name
   */
  const login = useCallback(async (phone: string, fullName: string) => {
    setIsLoading(true);
    try {
      const userData = await authService.login(phone, fullName);
      setUser(userData);
      setUserId(userData.id || null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Log out and clear session
   */
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setUserId(null);
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!userId) {
      throw new Error('No user logged in');
    }
    await authService.updateProfile(userId, data);
    await refreshUser();
  }, [userId]);

  /**
   * Refresh user data from Firestore
   */
  const refreshUser = useCallback(async () => {
    if (!userId) return;

    const userData = await authService.getUser(userId);
    if (userData) {
      setUser(userData);
    }
  }, [userId]);

  const value: AuthContextType = {
    user,
    userId,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
