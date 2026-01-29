# Schema: Groups Collection

## Collection Path
`groups/{groupId}`

## Subcollections
- `groups/{groupId}/members/{userId}` (recommended for security rules)

## Description
Groups allow sets of users to share events exclusively with each other. A group is like a friend circle or themed community (e.g., "Hiking Buddies", "College Friends").

## Fields (Group Document)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Name of the group |
| `description` | String | No | Purpose or description |
| `members` | Array\<String\> | Yes | User IDs of members |
| `ownerId` | String | Yes | User ID of creator/admin |
| `createdAt` | Timestamp | Yes | Creation timestamp |

## Fields (Member Subcollection Document)
For enhanced security rules, store membership in a subcollection:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | String | No | "owner", "admin", "member" |
| `joinedAt` | Timestamp | Yes | When user joined |

## Example Document

```json
// groups/group_hiking_456
{
  "name": "Hiking Buddies",
  "description": "Weekend hiking trips around NC",
  "members": ["user_alice_123", "user_bob_456", "user_charlie_789"],
  "ownerId": "user_alice_123",
  "createdAt": "2026-01-20T09:30:00Z"
}

// groups/group_hiking_456/members/user_alice_123
{
  "role": "owner",
  "joinedAt": "2026-01-20T09:30:00Z"
}
```

## Swift Model

```swift
import FirebaseFirestore

struct Group: Codable, Identifiable {
    @DocumentID var id: String?
    var name: String
    var description: String?
    var members: [String]
    var ownerId: String
    @ServerTimestamp var createdAt: Timestamp?
}

struct GroupMember: Codable, Identifiable {
    @DocumentID var id: String?  // userId
    var role: String?
    @ServerTimestamp var joinedAt: Timestamp?
}
```

## Queries

### Get groups for a user
```swift
db.collection("groups").whereField("members", arrayContains: userId)
```

### Get all members of a group
```swift
// Option A: From group document
let group = try await db.collection("groups").document(groupId).getDocument(as: Group.self)
let memberIds = group.members

// Option B: From subcollection (if using)
db.collection("groups").document(groupId).collection("members").getDocuments()
```

### Add member to group
```swift
// Update members array
db.collection("groups").document(groupId).updateData([
    "members": FieldValue.arrayUnion([newUserId])
])

// Also add to subcollection (if using)
db.collection("groups").document(groupId).collection("members").document(newUserId).setData([
    "role": "member",
    "joinedAt": FieldValue.serverTimestamp()
])
```

## Test Schema Task

**Objective**: Create test group documents to verify the schema works.

### Steps
1. Open Firebase Console → Firestore Database
2. Create collection `groups` if it doesn't exist
3. Add the following test documents:

**Document 1**: `groups/test_group_hiking`
```json
{
  "name": "Test Hiking Group",
  "description": "A test group for hiking enthusiasts",
  "members": ["test_user_001", "test_user_002"],
  "ownerId": "test_user_001",
  "createdAt": SERVER_TIMESTAMP
}
```

**Document 2**: `groups/test_group_games`
```json
{
  "name": "Test Game Night",
  "description": "Board games every Friday",
  "members": ["test_user_001"],
  "ownerId": "test_user_001",
  "createdAt": SERVER_TIMESTAMP
}
```

4. Add member subcollection documents:

**Subcollection**: `groups/test_group_hiking/members/test_user_001`
```json
{
  "role": "owner",
  "joinedAt": SERVER_TIMESTAMP
}
```

**Subcollection**: `groups/test_group_hiking/members/test_user_002`
```json
{
  "role": "member",
  "joinedAt": SERVER_TIMESTAMP
}
```

5. Update test users' `groups` arrays:
```json
// users/test_user_001
{ "groups": ["test_group_hiking", "test_group_games"] }

// users/test_user_002
{ "groups": ["test_group_hiking"] }
```

### Verification
- [ ] Group documents appear in Firestore Console
- [ ] Member subcollection documents created
- [ ] User documents updated with group references
- [ ] `arrayContains` query returns correct groups for each user
