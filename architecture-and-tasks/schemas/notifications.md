# Schema: Notifications Subcollection

## Collection Path
`users/{userId}/notifications/{notificationId}`

## Description
Notifications alert users about activities relevant to them: new events in their groups, comments on their events, group invites, etc. Stored per-user as a subcollection for security and efficient access.

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | String | Yes | Type of notification |
| `message` | String | Yes | Human-readable message |
| `relatedId` | String | No | ID of related item (event, group, comment) |
| `relatedType` | String | No | Type of related item ("event", "group", "comment") |
| `timestamp` | Timestamp | Yes | When notification was created |
| `read` | Boolean | Yes | Whether user has seen it |
| `fromUserId` | String | No | User who triggered the notification |

## Notification Types

| Type | Description | RelatedType |
|------|-------------|-------------|
| `new_event` | New event in user's group | event |
| `new_comment` | Someone commented on user's event | event |
| `comment_reply` | Reply to user's comment | comment |
| `group_invite` | Invited to join a group | group |
| `event_reminder` | Upcoming event reminder | event |
| `rsvp_update` | Someone RSVP'd to user's event | event |

## Example Documents

```json
// users/user_bob_456/notifications/notif_001
{
  "type": "new_event",
  "message": "Alice created 'Board Game Night' in Game Night group",
  "relatedId": "event_boardgame_123",
  "relatedType": "event",
  "timestamp": "2026-01-30T14:35:00Z",
  "read": false,
  "fromUserId": "user_alice_123"
}

// users/user_alice_123/notifications/notif_002
{
  "type": "new_comment",
  "message": "Bob commented on 'Board Game Night': Looking forward to this!",
  "relatedId": "event_boardgame_123",
  "relatedType": "event",
  "timestamp": "2026-01-30T15:00:00Z",
  "read": false,
  "fromUserId": "user_bob_456"
}
```

## Swift Model

```swift
import FirebaseFirestore

struct Notification: Codable, Identifiable {
    @DocumentID var id: String?
    var type: String
    var message: String
    var relatedId: String?
    var relatedType: String?
    @ServerTimestamp var timestamp: Timestamp?
    var read: Bool
    var fromUserId: String?
}

enum NotificationType: String, Codable {
    case newEvent = "new_event"
    case newComment = "new_comment"
    case commentReply = "comment_reply"
    case groupInvite = "group_invite"
    case eventReminder = "event_reminder"
    case rsvpUpdate = "rsvp_update"
}
```

## Queries

### Get user's notifications (latest first)
```swift
db.collection("users")
    .document(userId)
    .collection("notifications")
    .order(by: "timestamp", descending: true)
    .limit(to: 50)
    .getDocuments()
```

### Get unread notifications count
```swift
db.collection("users")
    .document(userId)
    .collection("notifications")
    .whereField("read", isEqualTo: false)
    .getDocuments()
// Count results client-side
```

### Mark notification as read
```swift
db.collection("users")
    .document(userId)
    .collection("notifications")
    .document(notificationId)
    .updateData(["read": true])
```

### Mark all as read
```swift
// Get all unread, then batch update
let batch = db.batch()
for doc in unreadDocs {
    batch.updateData(["read": true], forDocument: doc.reference)
}
try await batch.commit()
```

## Creating Notifications

When an event is created, create notifications for all group members:

```swift
func notifyGroupMembers(event: Event, group: Group, creator: User) async {
    let batch = db.batch()
    
    for memberId in group.members where memberId != creator.id {
        let notifRef = db.collection("users")
            .document(memberId)
            .collection("notifications")
            .document()
        
        batch.setData([
            "type": "new_event",
            "message": "\(creator.fullName) created '\(event.title)' in \(group.name)",
            "relatedId": event.id!,
            "relatedType": "event",
            "timestamp": FieldValue.serverTimestamp(),
            "read": false,
            "fromUserId": creator.id!
        ], forDocument: notifRef)
    }
    
    try await batch.commit()
}
```

## Test Schema Task

**Objective**: Create test notification documents to verify the schema works.

### Steps
1. Open Firebase Console → Firestore Database
2. Navigate to `users/test_user_001`
3. Create subcollection `notifications`
4. Add the following test documents:

**Document 1**: `users/test_user_001/notifications/test_notif_001`
```json
{
  "type": "new_event",
  "message": "Test User Two created 'New Group Event' in Test Hiking Group",
  "relatedId": "test_event_group",
  "relatedType": "event",
  "timestamp": SERVER_TIMESTAMP,
  "read": false,
  "fromUserId": "test_user_002"
}
```

**Document 2**: `users/test_user_001/notifications/test_notif_002`
```json
{
  "type": "new_comment",
  "message": "Test User Two commented on 'Public Meetup': What time?",
  "relatedId": "test_event_public",
  "relatedType": "event",
  "timestamp": SERVER_TIMESTAMP,
  "read": true,
  "fromUserId": "test_user_002"
}
```

5. Add notifications for test_user_002:

**Document**: `users/test_user_002/notifications/test_notif_003`
```json
{
  "type": "group_invite",
  "message": "Test User One invited you to join 'Test Game Night'",
  "relatedId": "test_group_games",
  "relatedType": "group",
  "timestamp": SERVER_TIMESTAMP,
  "read": false,
  "fromUserId": "test_user_001"
}
```

### Verification
- [ ] Notifications appear as subcollection under users
- [ ] Query returns notifications sorted by timestamp descending
- [ ] Unread count query works correctly
- [ ] Mark as read updates the document
- [ ] Each user can only see their own notifications (verify in security rules later)
