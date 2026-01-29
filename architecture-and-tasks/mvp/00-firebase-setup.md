# Task: Firebase Setup

## Description
Configure Firebase project and integrate the SDK into the iOS app. This is the foundation for all backend functionality.

## Prerequisites
- Xcode installed with the dispo project
- Firebase project created at console.firebase.google.com
- Bundle ID: `schallau.dispo`

## Implementation

### Step 1: Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select or create the project "dispo"
3. Add an iOS app with bundle ID `schallau.dispo`
4. Download `GoogleService-Info.plist`

### Step 2: Enable Firestore
1. In Firebase Console → Build → Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (for MVP development)
4. Select a region (us-east1 recommended for East Coast)

### Step 3: Enable Storage
1. In Firebase Console → Build → Storage
2. Click "Get started"
3. Start in test mode
4. Note the storage bucket URL

### Step 4: Add Firebase SDK to Xcode
1. Open `dispo.xcodeproj` in Xcode
2. File → Add Package Dependencies
3. Enter URL: `https://github.com/firebase/firebase-ios-sdk.git`
4. Select version (latest stable)
5. Choose packages to add:
   - FirebaseCore
   - FirebaseFirestore
   - FirebaseStorage
   - FirebaseAuth (for later use)

### Step 5: Add Config File
1. Drag `GoogleService-Info.plist` into the Xcode project
2. Ensure "Copy items if needed" is checked
3. Ensure target membership includes "dispo"

### Step 6: Initialize Firebase
Create or update `DispoApp.swift`:

```swift
import SwiftUI
import Firebase

@main
struct DispoApp: App {
    init() {
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

### Step 7: Verify Connection
Add a temporary test in ContentView:

```swift
import SwiftUI
import FirebaseFirestore

struct ContentView: View {
    @State private var testResult = "Testing..."
    
    var body: some View {
        VStack {
            Text("Firebase Test")
            Text(testResult)
            Button("Test Firestore") {
                testFirestore()
            }
        }
    }
    
    func testFirestore() {
        let db = Firestore.firestore()
        db.collection("_test").document("connection").setData([
            "timestamp": FieldValue.serverTimestamp(),
            "message": "Connection successful"
        ]) { error in
            if let error = error {
                testResult = "Error: \(error.localizedDescription)"
            } else {
                testResult = "✅ Firestore connected!"
            }
        }
    }
}
```

### Step 8: Verify in Console
1. Run the app in Simulator
2. Tap "Test Firestore"
3. Check Firebase Console → Firestore
4. Verify `_test/connection` document exists

### Step 9: Clean Up
1. Remove the test button/code from ContentView
2. Delete `_test` collection from Firestore Console

## Acceptance Criteria
- [ ] Firebase SDK packages added to Xcode project
- [ ] `GoogleService-Info.plist` present in project
- [ ] `FirebaseApp.configure()` called on app launch
- [ ] Test write to Firestore succeeds
- [ ] No build errors related to Firebase

## Test Schema
After verifying connection, run the test schema tasks from the `schemas/` folder to populate initial data.

## Notes
- **Do NOT commit** `GoogleService-Info.plist` to public repositories
- Add it to `.gitignore` if repo is public
- For MVP, test mode rules are acceptable; production requires proper security rules
