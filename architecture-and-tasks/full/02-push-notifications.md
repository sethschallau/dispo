# Task: Push Notifications

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ❌ No - requires Apple Developer account & Firebase Console |
| **Human tasks** | Create APNs key, upload to Firebase, deploy Cloud Functions |
| **Agent tasks** | Write AppDelegate code, Cloud Function code, update User model |
| **Estimated complexity** | High |
| **Dependencies** | Real Authentication (00-authentication.md) |

## What Needs to Happen

### Human Must Do (Seth)
1. Apple Developer Portal:
   - Create APNs Authentication Key (Keys → + → Apple Push Notifications service)
   - Download the .p8 file
2. Firebase Console:
   - Project Settings → Cloud Messaging → Upload APNs key
3. Deploy Cloud Functions:
   - `cd functions && npm install && firebase deploy --only functions`
4. Enable Cloud Functions in Firebase (may require Blaze plan)

### Agent Can Do
1. Update `dispoApp.swift` with AppDelegate for push registration
2. Create notification handling code
3. Write Cloud Functions for sending notifications
4. Update User model to store FCM token
5. Update Firestore writes to trigger notifications

## Implementation

### 1. Update dispoApp.swift
```swift
import FirebaseMessaging
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, 
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(options: authOptions) { _, _ in }
        
        application.registerForRemoteNotifications()
        Messaging.messaging().delegate = self
        
        return true
    }
    
    func application(_ application: UIApplication, 
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }
}

extension AppDelegate: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        return [[.banner, .sound]]
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse) async {
        let userInfo = response.notification.request.content.userInfo
        // Handle notification tap - navigate to relevant screen
    }
}

extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        Task {
            try? await saveFCMToken(token)
        }
    }
}
```

### 2. Create functions/index.js
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Notify group members when new event created
exports.onEventCreated = functions.firestore
    .document('events/{eventId}')
    .onCreate(async (snap, context) => {
        const event = snap.data();
        if (event.visibility !== 'group' || !event.groupId) return;
        
        const groupDoc = await admin.firestore()
            .collection('groups').doc(event.groupId).get();
        const members = groupDoc.data()?.members || [];
        
        const tokens = await getTokensForUsers(
            members.filter(id => id !== event.creatorId)
        );
        
        if (tokens.length === 0) return;
        
        await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
                title: 'New Event',
                body: `${event.title} in ${groupDoc.data()?.name}`
            },
            data: { type: 'new_event', eventId: context.params.eventId }
        });
    });

// Notify event creator when someone comments
exports.onCommentCreated = functions.firestore
    .document('events/{eventId}/comments/{commentId}')
    .onCreate(async (snap, context) => {
        const comment = snap.data();
        const eventDoc = await admin.firestore()
            .collection('events').doc(context.params.eventId).get();
        const event = eventDoc.data();
        
        if (comment.authorId === event.creatorId) return;
        
        const tokens = await getTokensForUsers([event.creatorId]);
        if (tokens.length === 0) return;
        
        await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
                title: 'New Comment',
                body: `Someone commented on ${event.title}`
            },
            data: { type: 'comment', eventId: context.params.eventId }
        });
    });

async function getTokensForUsers(userIds) {
    if (userIds.length === 0) return [];
    const userDocs = await admin.firestore()
        .collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', userIds.slice(0, 10))
        .get();
    return userDocs.docs
        .map(doc => doc.data().fcmToken)
        .filter(token => token);
}
```

### 3. Update User model
Add `fcmToken: String?` field and save on token refresh.

## Acceptance Criteria
- [ ] Permission request shown on first launch
- [ ] FCM token saved to user document
- [ ] Push received when app is backgrounded
- [ ] Notification for new group events
- [ ] Notification for comments on your events
- [ ] Tapping notification opens relevant screen

## Notes
- Requires Apple Developer paid account ($99/year)
- FCM tokens can change - handle refresh
- Cloud Functions require Firebase Blaze plan (pay-as-you-go)
- Test with real device (Simulator doesn't support push)
