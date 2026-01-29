# Task: Real Authentication (Post-MVP)

## Description
Replace the fake login with Firebase Authentication using phone number verification.

## Prerequisites
- MVP complete and tested
- Firebase Auth enabled in console

## Implementation Overview

### 1. Enable Phone Auth in Firebase
1. Firebase Console → Authentication → Sign-in method
2. Enable "Phone"
3. Add test phone numbers for development

### 2. Update AuthService
- Replace fake login with Firebase Auth
- Use `PhoneAuthProvider` for verification
- Link anonymous accounts if used

### 3. Update Security Rules
- Change `if true` to `if request.auth != null`
- Use `request.auth.uid` for ownership checks

### 4. Migration Path
If users have existing data:
- Keep same userId (phone number)
- Or implement account linking

## Key Code Changes

```swift
// AuthService additions
import FirebaseAuth

func sendVerificationCode(to phone: String) async throws -> String {
    let verificationID = try await PhoneAuthProvider.provider().verifyPhoneNumber(
        phone,
        uiDelegate: nil
    )
    return verificationID
}

func verifyCode(_ code: String, verificationID: String) async throws {
    let credential = PhoneAuthProvider.provider().credential(
        withVerificationID: verificationID,
        verificationCode: code
    )
    let result = try await Auth.auth().signIn(with: credential)
    // Create/update user document
}
```

## Acceptance Criteria
- [ ] Phone verification SMS sent
- [ ] Code entry and verification works
- [ ] User authenticated with Firebase Auth
- [ ] Security rules enforce authentication
- [ ] Existing users can still access their data

## Notes
- Requires Apple Push certificate for iOS
- Test phone numbers bypass actual SMS in dev
- Consider account linking for anonymous → phone upgrade
