# Task: Firestore Security Rules

## Description
Define Firestore security rules for MVP. Since there's no real authentication, rules will be permissive but structured for future auth integration.

## Prerequisites
- Firebase project configured
- All collections defined and in use

## Implementation

### Step 1: MVP Rules (Open for Development)
Create `firestore.rules` in project root:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // MVP: Open rules for development
    // WARNING: Not secure - replace before production
    
    // Users collection
    match /users/{userId} {
      allow read, write: if true;
      
      // User's notifications
      match /notifications/{notifId} {
        allow read, write: if true;
      }
    }
    
    // Groups collection
    match /groups/{groupId} {
      allow read, write: if true;
      
      // Group members subcollection
      match /members/{memberId} {
        allow read, write: if true;
      }
    }
    
    // Events collection
    match /events/{eventId} {
      allow read, write: if true;
      
      // Event comments
      match /comments/{commentId} {
        allow read, write: if true;
      }
      
      // Event RSVPs
      match /rsvps/{rsvpId} {
        allow read, write: if true;
      }
      
      // Event denied users (for exclusions)
      match /denied/{userId} {
        allow read, write: if true;
      }
    }
  }
}
```

### Step 2: Deploy MVP Rules
```bash
# Using Firebase CLI
firebase deploy --only firestore:rules
```

Or manually copy rules to Firebase Console → Firestore → Rules.

### Step 3: Production-Ready Rules (For Future)
These rules assume Firebase Auth is enabled:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function isGroupMember(groupId) {
      return isSignedIn() && 
        exists(/databases/$(database)/documents/groups/$(groupId)/members/$(request.auth.uid));
    }
    
    function isDenied(eventId) {
      return exists(/databases/$(database)/documents/events/$(eventId)/denied/$(request.auth.uid));
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwner(userId);
      
      // User's notifications - only owner can access
      match /notifications/{notifId} {
        allow read, delete: if isOwner(userId);
        allow create: if isSignedIn();  // Any user can create notifications for others
        allow update: if isOwner(userId);  // Only owner can mark as read
      }
    }
    
    // Groups collection
    match /groups/{groupId} {
      allow read: if isSignedIn() && isGroupMember(groupId);
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && 
        request.auth.uid == resource.data.ownerId;
      
      // Group members
      match /members/{memberId} {
        allow read: if isGroupMember(groupId);
        allow write: if isSignedIn() && 
          request.auth.uid == get(/databases/$(database)/documents/groups/$(groupId)).data.ownerId;
      }
    }
    
    // Events collection
    match /events/{eventId} {
      // Read rules based on visibility
      allow read: if isSignedIn() && !isDenied(eventId) && (
        // Public events
        resource.data.visibility == "public" ||
        // Private events - only creator
        (resource.data.visibility == "private" && 
         request.auth.uid == resource.data.creatorId) ||
        // Group events - only members
        (resource.data.visibility == "group" && 
         isGroupMember(resource.data.groupId))
      );
      
      // Create: any authenticated user
      allow create: if isSignedIn() && 
        request.resource.data.creatorId == request.auth.uid;
      
      // Update/Delete: only creator
      allow update, delete: if isSignedIn() && 
        request.auth.uid == resource.data.creatorId;
      
      // Comments - inherit event visibility
      match /comments/{commentId} {
        allow read: if isSignedIn() && !isDenied(eventId);
        allow create: if isSignedIn() && 
          request.resource.data.authorId == request.auth.uid;
        allow delete: if isSignedIn() && 
          (request.auth.uid == resource.data.authorId || 
           request.auth.uid == get(/databases/$(database)/documents/events/$(eventId)).data.creatorId);
      }
      
      // RSVPs
      match /rsvps/{userId} {
        allow read: if isSignedIn();
        allow write: if isOwner(userId);
      }
      
      // Denied list - only event creator can manage
      match /denied/{userId} {
        allow read: if isSignedIn() && 
          request.auth.uid == get(/databases/$(database)/documents/events/$(eventId)).data.creatorId;
        allow write: if isSignedIn() && 
          request.auth.uid == get(/databases/$(database)/documents/events/$(eventId)).data.creatorId;
      }
    }
  }
}
```

### Step 4: Storage Rules
Create `storage.rules`:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // MVP: Open for development
    match /{allPaths=**} {
      allow read, write: if true;
    }
    
    // Production rules (with auth):
    // match /events/{eventId}/{fileName} {
    //   allow read: if true;  // Public read for images
    //   allow write: if request.auth != null;  // Authenticated write
    // }
  }
}
```

## Acceptance Criteria
- [ ] MVP rules deployed to Firebase
- [ ] All CRUD operations work without permission errors
- [ ] Production rules documented for future use
- [ ] Storage rules allow image uploads

## Test Schema
1. Deploy MVP rules
2. Test all operations:
   - Create/read/update user
   - Create/join group
   - Create/read event
   - Add comment
   - Create notification
3. Verify no permission errors in console

## Notes
- MVP rules are intentionally open
- Production rules require Firebase Auth
- Document paths must match exactly
- Rules are evaluated for every read/write
