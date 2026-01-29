# Schema: Events Collection

## Collection Path
`events/{eventId}`

## Subcollections
- `events/{eventId}/comments/{commentId}` - Comments on the event
- `events/{eventId}/rsvps/{userId}` - RSVP responses
- `events/{eventId}/denied/{userId}` - Excluded users (for security rules)

## Description
Events are gatherings, activities, or availability posts that can be shared publicly, within a group, or kept private. This is the core content of the app.

## Fields (Event Document)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | Yes | Event title |
| `description` | String | No | Detailed description |
| `eventDate` | Timestamp | Yes | When the event occurs |
| `creatorId` | String | Yes | User ID of creator |
| `createdAt` | Timestamp | Yes | Creation timestamp |
| `groupId` | String | No | Group ID if group-only event |
| `visibility` | String | Yes | "public", "group", "private", or "friends" |
| `location` | String | No | Text location/venue |
| `imageUrl` | String | No | URL to event image |
| `excludedUserIds` | Array\<String\> | No | Users who cannot see this event |
| `friendIds` | Array\<String\> | No | For "friends" visibility - explicit allowlist |
| `groupIds` | Array\<String\> | No | For multi-group events |

## Visibility Logic

| Visibility | groupId | Who Can See |
|------------|---------|-------------|
| `public` | null | Everyone (except excludedUserIds) |
| `group` | set | Members of that group (except excludedUserIds) |
| `private` | null | Only the creator |
| `friends` | null | Users in friendIds array |

## Example Document

```json
// events/event_boardgame_123
{
  "title": "Board Game Night",
  "description": "Bring snacks and your favorite games. We'll start at 7 PM.",
  "eventDate": "2026-02-10T19:00:00Z",
  "creatorId": "user_alice_123",
  "createdAt": "2026-01-30T14:30:00Z",
  "groupId": "group_games_789",
  "visibility": "group",
  "location": "Alice's apartment",
  "imageUrl": "https://firebasestorage.googleapis.com/.../boardgames.jpg",
  "excludedUserIds": []
}
```

## Swift Model

```swift
import FirebaseFirestore

struct Event: Codable, Identifiable {
    @DocumentID var id: String?
    var title: String
    var description: String?
    var eventDate: Date
    var creatorId: String
    @ServerTimestamp var createdAt: Timestamp?
    var groupId: String?
    var visibility: String  // "public", "group", "private", "friends"
    var location: String?
    var imageUrl: String?
    var excludedUserIds: [String]?
    var friendIds: [String]?
    var groupIds: [String]?
}

enum EventVisibility: String, Codable {
    case `public` = "public"
    case group = "group"
    case `private` = "private"
    case friends = "friends"
}
```

## Queries

### Get public events
```swift
db.collection("events")
    .whereField("visibility", isEqualTo: "public")
    .order(by: "eventDate")
    .getDocuments()
```

### Get events for a specific group
```swift
db.collection("events")
    .whereField("groupId", isEqualTo: groupId)
    .order(by: "eventDate")
    .getDocuments()
```

### Get events for user's groups (multiple queries)
```swift
// For each groupId the user belongs to:
for groupId in userGroups {
    db.collection("events")
        .whereField("groupId", isEqualTo: groupId)
        .getDocuments()
}
// Then merge and filter out excludedUserIds client-side
```

### Get events created by a user
```swift
db.collection("events")
    .whereField("creatorId", isEqualTo: userId)
    .order(by: "createdAt", descending: true)
    .getDocuments()
```

## Test Schema Task

**Objective**: Create test event documents to verify the schema works.

### Steps
1. Open Firebase Console → Firestore Database
2. Create collection `events` if it doesn't exist
3. Add the following test documents:

**Document 1**: `events/test_event_public`
```json
{
  "title": "Public Meetup",
  "description": "Open to everyone - come say hi!",
  "eventDate": "2026-02-15T18:00:00Z",
  "creatorId": "test_user_001",
  "createdAt": SERVER_TIMESTAMP,
  "groupId": null,
  "visibility": "public",
  "location": "Downtown Coffee Shop",
  "imageUrl": null,
  "excludedUserIds": []
}
```

**Document 2**: `events/test_event_group`
```json
{
  "title": "Hiking Trip",
  "description": "Trail hike - bring water and snacks",
  "eventDate": "2026-02-20T09:00:00Z",
  "creatorId": "test_user_001",
  "createdAt": SERVER_TIMESTAMP,
  "groupId": "test_group_hiking",
  "visibility": "group",
  "location": "Umstead State Park",
  "imageUrl": null,
  "excludedUserIds": []
}
```

**Document 3**: `events/test_event_private`
```json
{
  "title": "Personal Reminder",
  "description": "Dentist appointment",
  "eventDate": "2026-02-18T14:00:00Z",
  "creatorId": "test_user_001",
  "createdAt": SERVER_TIMESTAMP,
  "groupId": null,
  "visibility": "private",
  "location": "Dental Office",
  "imageUrl": null,
  "excludedUserIds": []
}
```

**Document 4**: `events/test_event_excluded`
```json
{
  "title": "Surprise Party",
  "description": "Shhh! Don't tell Bob!",
  "eventDate": "2026-03-01T19:00:00Z",
  "creatorId": "test_user_001",
  "createdAt": SERVER_TIMESTAMP,
  "groupId": "test_group_hiking",
  "visibility": "group",
  "location": "Alice's House",
  "imageUrl": null,
  "excludedUserIds": ["test_user_002"]
}
```

### Verification
- [ ] All event documents created successfully
- [ ] Query for public events returns `test_event_public`
- [ ] Query for group events with `groupId=test_group_hiking` returns appropriate events
- [ ] Client-side filtering correctly excludes `test_user_002` from `test_event_excluded`
