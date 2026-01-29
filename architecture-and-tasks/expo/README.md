# Dispo - Expo/React Native Rebuild

This folder contains agent-ready task files for rebuilding Dispo as an Expo (React Native) app.

## Why Expo?
- Cross-platform (iOS + Android) from one codebase
- No Xcode required for development
- Agent can run/test JS code directly
- Hot reload for fast iteration
- Same Firebase backend (schemas unchanged)

## Project Structure (Target)

```
dispo-expo/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Feed
│   │   ├── groups.tsx     # Groups
│   │   ├── profile.tsx    # Profile
│   │   └── _layout.tsx    # Tab layout
│   ├── event/
│   │   ├── [id].tsx       # Event detail
│   │   └── create.tsx     # Create event
│   ├── group/
│   │   ├── [id].tsx       # Group detail
│   │   └── create.tsx     # Create group
│   ├── login.tsx          # Login screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── EventCard.tsx
│   ├── CommentList.tsx
│   ├── RSVPButtons.tsx
│   └── ...
├── services/              # Firebase services
│   ├── firebase.ts        # Firebase config
│   ├── auth.ts
│   ├── events.ts
│   ├── groups.ts
│   └── ...
├── hooks/                 # Custom hooks
│   ├── useAuth.ts
│   ├── useEvents.ts
│   └── ...
├── types/                 # TypeScript types
│   └── index.ts
├── app.json              # Expo config
├── package.json
└── tsconfig.json
```

## Task Execution Order

### Phase 1: Foundation (Do First)
1. `00-project-setup.md` - Create Expo project
2. `01-firebase-config.md` - Configure Firebase
3. `02-types-and-models.md` - TypeScript types
4. `03-auth-service.md` - Auth context/hooks
5. `04-navigation.md` - Expo Router setup

### Phase 2: Core Screens
6. `05-login-screen.md` - Fake login flow
7. `06-feed-screen.md` - Events feed
8. `07-event-detail.md` - Event detail + comments
9. `08-create-event.md` - Event creation
10. `09-groups-screen.md` - Groups list
11. `10-group-detail.md` - Group detail
12. `11-profile-screen.md` - User profile

### Phase 3: Features
13. `12-rsvp-system.md` - RSVP functionality
14. `13-notifications.md` - In-app notifications
15. `14-event-reminders.md` - Local push notifications
16. `15-photo-sharing.md` - Post-event photos
17. `16-event-invites.md` - Share via codes
18. `17-user-search.md` - Find users
19. `18-group-admin.md` - Admin controls

### Phase 4: Polish & Production
20. `19-real-auth.md` - Firebase Auth
21. `20-push-notifications.md` - FCM
22. `21-production-build.md` - EAS Build setup

## Firebase Backend

**No changes needed** - the existing Firestore schema and security rules work as-is:
- `users/{userId}`
- `groups/{groupId}`
- `events/{eventId}`
  - `comments/{commentId}`
  - `rsvps/{userId}`
  - `photos/{photoId}`
- `users/{userId}/notifications/{notificationId}`

## Agent Instructions

Each task file contains:
- **Agent Summary** - Can it be done autonomously?
- **Prerequisites** - What must be done first
- **Implementation** - Step-by-step with code
- **Files to Create/Modify** - Checklist
- **Acceptance Criteria** - How to verify
- **Test Instructions** - How to test

When executing:
1. Read the task file completely
2. Check prerequisites are met
3. Create/modify files as specified
4. Test using provided instructions
5. Commit with message: `🍐 PearGuy: [Task Name]`

## Development Workflow

```bash
# Start development
cd dispo-expo
npx expo start

# Test on phone
# - Install Expo Go app
# - Scan QR code

# Build for production
npx eas build --platform ios
npx eas build --platform android
```
