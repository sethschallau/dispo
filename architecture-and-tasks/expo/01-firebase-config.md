# Task 01: Firebase Configuration

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes (config already exists) |
| **Prerequisites** | Task 00 complete |
| **Estimated time** | 10 minutes |

## What Needs to Happen

Configure Firebase SDK for the Expo app using the existing Firebase project.

## Implementation

### 1. Create Firebase Config
Create `services/firebase.ts`:
```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// import { getAuth } from 'firebase/auth'; // For later

const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "dispo-2faf1.firebaseapp.com",
  projectId: "dispo-2faf1",
  storageBucket: "dispo-2faf1.firebasestorage.app",
  messagingSenderId: "xxxxxxxxxx",
  appId: "1:xxxxxxxxxx:web:xxxxxxxxxx"
};

// Initialize Firebase (prevent multiple instances)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
// export const auth = getAuth(app); // For later

export default app;
```

### 2. Get Firebase Config Values
The config values can be found in:
- Firebase Console → Project Settings → Your apps → Web app
- Or from the existing `GoogleService-Info.plist` in the iOS project

**From existing project:**
```bash
# Check existing config
cat ~/dispo/dispo/GoogleService-Info.plist
```

### 3. Create Environment Config (Optional but Recommended)
Create `config.ts`:
```typescript
export const CONFIG = {
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
    authDomain: "dispo-2faf1.firebaseapp.com",
    projectId: "dispo-2faf1",
    storageBucket: "dispo-2faf1.firebasestorage.app",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
  }
};
```

### 4. Test Firebase Connection
Create `services/__tests__/firebase.test.ts` (or test manually):
```typescript
import { db } from '../firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function testConnection() {
  try {
    const q = query(collection(db, 'users'), limit(1));
    const snapshot = await getDocs(q);
    console.log('Firebase connected! Docs:', snapshot.size);
    return true;
  } catch (error) {
    console.error('Firebase error:', error);
    return false;
  }
}

testConnection();
```

### 5. Add Firebase to App Entry
Update `app/_layout.tsx` to ensure Firebase initializes:
```typescript
import '../services/firebase'; // Initialize on app start

export default function RootLayout() {
  // ... existing code
}
```

## Files to Create
- [ ] `services/firebase.ts` - Firebase initialization
- [ ] `config.ts` - Environment config (optional)

## Getting Config from Existing Project

```bash
# The existing iOS project has the config in GoogleService-Info.plist
# Extract these values:
# - API_KEY
# - GCM_SENDER_ID  
# - PROJECT_ID
# - STORAGE_BUCKET
# - GOOGLE_APP_ID

# Or get from Firebase Console:
# https://console.firebase.google.com/project/dispo-2faf1/settings/general
```

## Acceptance Criteria
- [ ] Firebase initializes without errors
- [ ] Can read from Firestore (test with existing data)
- [ ] No duplicate app initialization warnings

## Notes
- Using Firebase JS SDK (not React Native Firebase) for simplicity
- Works with Expo Go without native modules
- For production, consider `@react-native-firebase/*` packages

## Commit
```bash
git add .
git commit -m "🍐 PearGuy: Configure Firebase"
```
