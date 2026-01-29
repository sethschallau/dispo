# Schema: Comments Subcollection

## Collection Path
`events/{eventId}/comments/{commentId}`

## Description
Comments are user responses or discussions on events. Stored as a subcollection under each event to maintain clear hierarchy and enable efficient real-time updates.

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `authorId` | String | Yes | User ID of commenter |
| `text` | String | Yes | Comment content |
| `timestamp` | Timestamp | Yes | When posted |
| `authorName` | String | No | Cached author name (optional, for display without lookup) |

## Example Document

```json
// events/event_boardgame_123/comments/comment_abc123
{
  "authorId": "user_bob_456",
  "text": "Looking forward to this! I'll bring Catan.",
  "timestamp": "2026-01-30T15:00:00Z",
  "authorName": "Bob Smith"
}
```

## Swift Model

```swift
import FirebaseFirestore

struct Comment: Codable, Identifiable {
    @DocumentID var id: String?
    var authorId: String
    var text: String
    @ServerTimestamp var timestamp: Timestamp?
    var authorName: String?  // Optional cached name
}
```

## Queries

### Get all comments for an event (ordered)
```swift
db.collection("events")
    .document(eventId)
    .collection("comments")
    .order(by: "timestamp", descending: false)
    .getDocuments()
```

### Real-time listener for comments
```swift
db.collection("events")
    .document(eventId)
    .collection("comments")
    .order(by: "timestamp")
    .addSnapshotListener { snapshot, error in
        // Handle updates
    }
```

### Add a comment
```swift
db.collection("events")
    .document(eventId)
    .collection("comments")
    .addDocument(data: [
        "authorId": currentUserId,
        "text": commentText,
        "timestamp": FieldValue.serverTimestamp(),
        "authorName": currentUserName  // optional
    ])
```

### Delete a comment (owner only)
```swift
db.collection("events")
    .document(eventId)
    .collection("comments")
    .document(commentId)
    .delete()
```

## Visibility Rules

Comments inherit visibility from their parent event:
- Only users who can read the event can read its comments
- Only users who can read the event can write comments
- Only the comment author (or event creator) should be able to delete

## Test Schema Task

**Objective**: Create test comment documents to verify the schema works.

### Steps
1. Open Firebase Console → Firestore Database
2. Navigate to `events/test_event_public`
3. Create subcollection `comments`
4. Add the following test documents:

**Document 1**: `events/test_event_public/comments/test_comment_001`
```json
{
  "authorId": "test_user_001",
  "text": "Excited to meet everyone!",
  "timestamp": SERVER_TIMESTAMP,
  "authorName": "Test User One"
}
```

**Document 2**: `events/test_event_public/comments/test_comment_002`
```json
{
  "authorId": "test_user_002",
  "text": "What time should we arrive?",
  "timestamp": SERVER_TIMESTAMP,
  "authorName": "Test User Two"
}
```

**Document 3**: `events/test_event_public/comments/test_comment_003`
```json
{
  "authorId": "test_user_001",
  "text": "Come anytime after 5:30!",
  "timestamp": SERVER_TIMESTAMP,
  "authorName": "Test User One"
}
```

5. Add comments to the group event as well:

**Document**: `events/test_event_group/comments/test_comment_004`
```json
{
  "authorId": "test_user_002",
  "text": "I'll bring the trail mix!",
  "timestamp": SERVER_TIMESTAMP,
  "authorName": "Test User Two"
}
```

### Verification
- [ ] Comments appear as subcollection under events
- [ ] Query ordered by timestamp returns comments in correct order
- [ ] Real-time listener fires when new comment is added
- [ ] Comment count can be retrieved (may need aggregation or client-side count)
