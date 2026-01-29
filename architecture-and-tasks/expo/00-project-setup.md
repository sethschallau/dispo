# Task 00: Project Setup

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Node.js installed |
| **Estimated time** | 5 minutes |

## What Needs to Happen

Create a new Expo project with TypeScript, Expo Router, and basic configuration.

## Implementation

### 1. Create Project
```bash
cd ~
npx create-expo-app@latest dispo-expo --template tabs
cd dispo-expo
```

### 2. Install Core Dependencies
```bash
# Firebase
npx expo install firebase

# UI Components
npx expo install @expo/vector-icons

# Async Storage (for auth persistence)
npx expo install @react-native-async-storage/async-storage

# Image Picker
npx expo install expo-image-picker

# Date Picker
npx expo install @react-native-community/datetimepicker

# Safe Area
npx expo install react-native-safe-area-context
```

### 3. Update app.json
```json
{
  "expo": {
    "name": "Dispo",
    "slug": "dispo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "dispo",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.schallau.dispo"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.schallau.dispo"
    },
    "plugins": [
      "expo-router"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### 4. Update package.json Scripts
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "expo lint",
    "test": "jest"
  }
}
```

### 5. Create Directory Structure
```bash
mkdir -p services hooks types components
```

### 6. Verify Setup
```bash
npx expo start
# Should show QR code and "Metro waiting on..."
# Press 'w' to open web version to verify it runs
```

## Files Created
- [ ] `dispo-expo/` project directory
- [ ] `app.json` configured
- [ ] `package.json` with dependencies
- [ ] `services/` directory
- [ ] `hooks/` directory
- [ ] `types/` directory
- [ ] `components/` directory

## Acceptance Criteria
- [ ] `npx expo start` runs without errors
- [ ] Can open in Expo Go or web browser
- [ ] TypeScript compilation works
- [ ] All dependencies installed

## Commit
```bash
git init
git add .
git commit -m "🍐 PearGuy: Initialize Expo project"
```
