/**
 * Firebase Configuration
 * 
 * Uses Firebase JS SDK (not React Native Firebase) for Expo compatibility.
 * Works with Expo Go without native modules.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDSOdRArTC5rKuqQgQYgITDcTOTtOb4ULg",
  authDomain: "dispo-2faf1.firebaseapp.com",
  projectId: "dispo-2faf1",
  storageBucket: "dispo-2faf1.firebasestorage.app",
  messagingSenderId: "907771501214",
  appId: "1:907771501214:ios:cafe945f824e8199c6798f"
};

// Initialize Firebase (prevent multiple instances in hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
