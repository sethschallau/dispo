/**
 * Auth Service
 * 
 * Handles user authentication and profile management.
 * MVP uses "fake auth" - phone number as user ID (same as iOS version).
 * 
 * Ported from Swift: archive/swift-ios/dispo/Services/AuthService.swift
 */

import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, normalizePhone } from '@/types';

const USER_ID_KEY = '@dispo_user_id';

export const authService = {
  /**
   * Get stored user ID from local storage
   */
  async getStoredUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(USER_ID_KEY);
    } catch (error) {
      console.error('Error getting stored user ID:', error);
      return null;
    }
  },

  /**
   * Store user ID locally for session persistence
   */
  async storeUserId(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_ID_KEY, userId);
    } catch (error) {
      console.error('Error storing user ID:', error);
    }
  },

  /**
   * Clear stored user ID (logout)
   */
  async clearUserId(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_ID_KEY);
    } catch (error) {
      console.error('Error clearing user ID:', error);
    }
  },

  /**
   * Get user from Firestore by ID
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  /**
   * Create new user in Firestore
   */
  async createUser(userId: string, data: Partial<User>): Promise<User> {
    const docRef = doc(db, 'users', userId);

    // Check if user already exists
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // User exists, return existing
      return { id: docSnap.id, ...docSnap.data() } as User;
    }

    // Create new user with defaults
    const newUser: Omit<User, 'id'> = {
      username: data.username || data.fullName?.toLowerCase().replace(/\s+/g, '_') || userId,
      fullName: data.fullName || '',
      phone: data.phone || userId,
      bio: data.bio || '',
      groupIds: data.groupIds || [],
      createdAt: serverTimestamp() as any,
      ...data,
    };

    await setDoc(docRef, newUser);
    return { id: userId, ...newUser };
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<User>): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Fake login - use phone number as user ID
   * Creates user if doesn't exist, otherwise returns existing user
   */
  async login(phone: string, fullName: string): Promise<User> {
    // Normalize phone (remove non-digits)
    const userId = normalizePhone(phone);

    if (!userId) {
      throw new Error('Invalid phone number');
    }

    // Create or get user
    const user = await this.createUser(userId, {
      phone: userId,
      fullName,
      username: fullName.toLowerCase().replace(/\s+/g, '_'),
    });

    // Store locally for session persistence
    await this.storeUserId(userId);

    return user;
  },

  /**
   * Logout - clear local session
   */
  async logout(): Promise<void> {
    await this.clearUserId();
  },
};
