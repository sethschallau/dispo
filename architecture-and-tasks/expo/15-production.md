# Task 15: Production Build & Deployment

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ⚠️ Partial - code yes, but needs Expo/Apple accounts |
| **Human tasks** | Create Expo account, Apple Developer, configure EAS |
| **Estimated time** | 1-2 hours |

---

## 15a: EAS Setup

### Human Steps:
1. Create Expo account: https://expo.dev
2. Install EAS CLI: `npm install -g eas-cli`
3. Login: `eas login`
4. Configure: `eas build:configure`

### Agent Creates `eas.json`:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

---

## 15b: Environment Variables

Create `.env`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx
```

Update `services/firebase.ts` to use `process.env.EXPO_PUBLIC_*`.

---

## 15c: Build Commands

```bash
# Development build (for testing with dev client)
eas build --platform ios --profile development

# Preview build (internal testing)
eas build --platform ios --profile preview

# Production build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

---

## 15d: Real Authentication (Optional)

If replacing fake auth with Firebase Auth:

1. Enable Phone Auth in Firebase Console
2. Install: `npx expo install @react-native-firebase/app @react-native-firebase/auth`
3. Update `services/auth.ts` to use Firebase Auth
4. Update security rules to use `request.auth.uid`

---

## 15e: Push Notifications (Optional)

1. Create APNs key in Apple Developer
2. Upload to Firebase Console
3. Install: `npx expo install expo-notifications`
4. Configure in `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#007AFF"
        }
      ]
    ]
  }
}
```

---

## 15f: App Store Checklist

- [ ] App icons (all sizes)
- [ ] Splash screen
- [ ] Privacy policy URL
- [ ] App description
- [ ] Screenshots (6.7", 6.5", 5.5")
- [ ] Keywords
- [ ] Age rating

---

## Acceptance Criteria
- [ ] EAS configured
- [ ] Can build preview IPA
- [ ] Can build production IPA
- [ ] Can submit to TestFlight

## Notes
- EAS builds in cloud - no Mac needed
- First build takes longer (provisions certificates)
- Keep `.env` out of git
