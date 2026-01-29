# Schema: Users Collection

## Collection Path
`users/{userId}`

## Description
Stores user profiles and basic information. In the MVP, `userId` is the phone number or a generated UUID. In production, this will match the Firebase Auth UID.

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | String | Yes | Unique handle or display name |
| `fullName` | String | Yes | User's full name |
| `phone` | String | No | Phone number (may duplicate ID) |
| `profilePicUrl` | String | No | URL to profile photo |
| `groups` | Array\<String\> | No | List of group IDs user belongs to |
| `bio` | String | No | Short bio or description |
| `createdAt` | Timestamp | Yes | Account creation date |

## Example Document

```json
// users/user_alice_123
{
  "username": "alice_wonder",
  "fullName": "Alice Johnson",
  "phone": "5551234567",
  "profilePicUrl": "https://firebasestorage.googleapis.com/.../alice.jpg",
  "groups": ["group_hiking_456", "group_gamenight_789"],
  "bio": "Love hiking and board games!",
  "createdAt": "2026-01-28T15:45:00Z"
}
```

## Swift Model

```swift
import FirebaseFirestore

struct User: Codable, Identifiable {
    @DocumentID var id: String?
    var username: String
    var fullName: String
    var phone: String?
    var profilePicUrl: String?
    var groups: [String]?
    var bio: String?
    @ServerTimestamp var createdAt: Timestamp?
}
```

## Queries

### Get user by ID
```swift
db.collection("users").document(userId).getDocument()
```

### Get users in a group
```swift
db.collection("users").whereField("groups", arrayContains: groupId)
```

## Test Schema Task

**Objective**: Create test user documents to verify the schema works.

### Steps
1. Open Firebase Console → Firestore Database
2. Create collection `users` if it doesn't exist
3. Add the following test documents:

**Document 1**: `users/test_user_001`
```json
{
  "username": "testuser1",
  "fullName": "Test User One",
  "phone": "5550001111",
  "groups": [],
  "bio": "First test user",
  "createdAt": SERVER_TIMESTAMP
}
```

**Document 2**: `users/test_user_002`
```json
{
  "username": "testuser2",
  "fullName": "Test User Two",
  "phone": "5550002222",
  "groups": [],
  "bio": "Second test user",
  "createdAt": SERVER_TIMESTAMP
}
```

### Verification
- [ ] Documents appear in Firestore Console
- [ ] All fields have correct types
- [ ] `createdAt` is populated with server timestamp

### CLI Alternative (Firebase CLI)
```bash
# Using firebase CLI with a seed script
firebase firestore:delete users/test_user_001 --force 2>/dev/null
firebase firestore:delete users/test_user_002 --force 2>/dev/null

# Then use a Node.js script or the Firebase Admin SDK to seed
```
