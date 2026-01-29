# Task: Real Authentication

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ❌ No - requires Apple Developer & Firebase Console setup |
| **Human tasks** | Enable Phone Auth in Firebase Console, configure APNs if needed |
| **Agent tasks** | Update AuthService, LoginView, security rules |
| **Estimated complexity** | Medium |
| **Dependencies** | MVP complete |

## What Needs to Happen

### Human Must Do (Seth)
1. Firebase Console → Authentication → Sign-in method → Enable "Phone"
2. Add test phone numbers for development (optional but helpful)
3. If using real devices: configure APNs certificate in Firebase

### Agent Can Do
1. Update `AuthService.swift` to use `FirebaseAuth`
2. Update `LoginView.swift` for verification code flow
3. Update `firestore.rules` to use `request.auth.uid`
4. Update `storage.rules` for authenticated access
5. Migration logic for existing fake-auth users (if needed)

## Implementation

### 1. Update AuthService.swift
```swift
import FirebaseAuth

// Add to AuthService:
func sendVerificationCode(to phone: String) async throws -> String {
    let verificationID = try await PhoneAuthProvider.provider().verifyPhoneNumber(
        phone,
        uiDelegate: nil
    )
    return verificationID
}

func verifyCode(_ code: String, verificationID: String) async throws -> User {
    let credential = PhoneAuthProvider.provider().credential(
        withVerificationID: verificationID,
        verificationCode: code
    )
    let result = try await Auth.auth().signIn(with: credential)
    // Create/update user document using result.user.uid
    return user
}

func signOut() throws {
    try Auth.auth().signOut()
    // Clear local state
}
```

### 2. Update LoginView.swift
- Add two-step flow: phone entry → code verification
- Show loading state during verification
- Handle errors (invalid code, too many attempts)

### 3. Update Security Rules
```javascript
// firestore.rules - replace permissive rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    // ... similar for subcollections
  }
}
```

## Acceptance Criteria
- [ ] Phone verification SMS sent (or test number works)
- [ ] Code entry and verification works
- [ ] User authenticated with Firebase Auth
- [ ] Security rules enforce authentication
- [ ] Existing app flows work with real auth
- [ ] Logout clears Firebase Auth session

## Notes
- Test phone numbers bypass SMS in development
- Consider graceful migration from fake-auth user IDs
- Rate limiting is built into Firebase Phone Auth
