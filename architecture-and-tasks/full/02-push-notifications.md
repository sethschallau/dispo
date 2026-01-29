# Task: Push Notifications (Post-MVP)

## Description
Implement remote push notifications using Firebase Cloud Messaging (FCM) to notify users even when the app is closed.

## Prerequisites
- Real authentication implemented
- Apple Developer account with push certificates

## Features

1. **New Event Notifications**: When someone creates an event in your group
2. **Comment Notifications**: When someone comments on your event
3. **Reminder Notifications**: Event reminders (1 hour before, etc.)
4. **Group Invites**: When invited to join a group

## Implementation Overview

### 1. Apple Push Configuration
1. Create APNs key in Apple Developer portal
2. Upload to Firebase Console → Project Settings → Cloud Messaging

### 2. Add FCM to Project
Add `FirebaseMessaging` to Swift Package dependencies.

### 3. Register for Notifications
```swift
import UserNotifications
import FirebaseMessaging

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        FirebaseApp.configure()
        
        UNUserNotificationCenter.current().delegate = self
        
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(options: authOptions) { _, _ in }
        
        application.registerForRemoteNotifications()
        
        Messaging.messaging().delegate = self
        
        return true
    }
}

extension AppDelegate: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        return [[.banner, .sound]]
    }
}

extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        // Save token to user document for targeting
        guard let token = fcmToken else { return }
        // Store in Firestore: users/{userId}/fcmToken
    }
}
```

### 4. Store FCM Token
```swift
func saveFCMToken(_ token: String, for userId: String) async throws {
    try await db.collection("users").document(userId).updateData([
        "fcmToken": token
    ])
}
```

### 5. Cloud Function for Sending
Create Firebase Cloud Function to send notifications:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendEventNotification = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snap, context) => {
    const event = snap.data();
    
    if (event.visibility !== 'group') return;
    
    const groupDoc = await admin.firestore()
      .collection('groups')
      .doc(event.groupId)
      .get();
    
    const members = groupDoc.data().members;
    
    // Get FCM tokens for members (except creator)
    const userDocs = await admin.firestore()
      .collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', members)
      .get();
    
    const tokens = userDocs.docs
      .filter(doc => doc.id !== event.creatorId && doc.data().fcmToken)
      .map(doc => doc.data().fcmToken);
    
    if (tokens.length === 0) return;
    
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: 'New Event',
        body: `New event in ${groupDoc.data().name}: ${event.title}`
      },
      data: {
        type: 'new_event',
        eventId: context.params.eventId
      }
    });
  });
```

## Acceptance Criteria
- [ ] Permission request shown on first launch
- [ ] FCM token saved to user document
- [ ] Push received when app is backgrounded
- [ ] Tapping notification opens relevant screen
- [ ] Notifications work for new events
- [ ] Notifications work for comments

## Notes
- Requires Apple Developer paid account
- FCM tokens can change - handle refresh
- Consider notification preferences/settings
- Rate limit notifications to avoid spam
