# Task: Fake Login Flow

## Description
Implement a simple login screen where users enter a phone number (or identifier) to simulate authentication. No actual verification — just creates/retrieves a user document in Firestore.

## Prerequisites
- Task `00-firebase-setup` complete
- Firebase connected and working

## Implementation

### Step 1: Create User Model
Create `Models/User.swift`:

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

### Step 2: Create Auth Service
Create `Services/AuthService.swift`:

```swift
import Foundation
import FirebaseFirestore

class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var currentUser: User?
    @Published var isLoggedIn: Bool = false
    
    private let db = Firestore.firestore()
    private let userIdKey = "currentUserId"
    
    var currentUserId: String? {
        get { UserDefaults.standard.string(forKey: userIdKey) }
        set { 
            UserDefaults.standard.set(newValue, forKey: userIdKey)
            isLoggedIn = newValue != nil
        }
    }
    
    init() {
        if let userId = currentUserId {
            Task { await loadUser(id: userId) }
        }
    }
    
    func login(phone: String, name: String) async throws {
        // Use phone as userId (simplified for MVP)
        let userId = phone.replacingOccurrences(of: "-", with: "")
                         .replacingOccurrences(of: " ", with: "")
        
        let userRef = db.collection("users").document(userId)
        
        // Check if user exists
        let doc = try await userRef.getDocument()
        
        if doc.exists {
            // Load existing user
            currentUser = try doc.data(as: User.self)
        } else {
            // Create new user
            let newUser = User(
                username: name.lowercased().replacingOccurrences(of: " ", with: "_"),
                fullName: name,
                phone: phone,
                groups: [],
                bio: ""
            )
            try userRef.setData(from: newUser)
            currentUser = newUser
            currentUser?.id = userId
        }
        
        currentUserId = userId
    }
    
    func loadUser(id: String) async {
        do {
            let doc = try await db.collection("users").document(id).getDocument()
            if doc.exists {
                currentUser = try doc.data(as: User.self)
                isLoggedIn = true
            }
        } catch {
            print("Error loading user: \(error)")
        }
    }
    
    func logout() {
        currentUserId = nil
        currentUser = nil
    }
}
```

### Step 3: Create Login View
Create `Views/LoginView.swift`:

```swift
import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    
    @State private var phoneNumber = ""
    @State private var displayName = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Spacer()
                
                // App Title
                VStack(spacing: 8) {
                    Text("Dispo")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    Text("Share your availability")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Input Fields
                VStack(spacing: 16) {
                    TextField("Phone Number", text: $phoneNumber)
                        .keyboardType(.phonePad)
                        .textFieldStyle(.roundedBorder)
                    
                    TextField("Display Name", text: $displayName)
                        .textFieldStyle(.roundedBorder)
                }
                .padding(.horizontal)
                
                // Error Message
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                
                // Continue Button
                Button(action: login) {
                    if isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Continue")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(isValid ? Color.blue : Color.gray)
                .foregroundColor(.white)
                .cornerRadius(12)
                .padding(.horizontal)
                .disabled(!isValid || isLoading)
                
                Spacer()
                
                // MVP Notice
                Text("MVP: No SMS verification")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .navigationBarHidden(true)
        }
    }
    
    private var isValid: Bool {
        phoneNumber.count >= 10 && !displayName.isEmpty
    }
    
    private func login() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await authService.login(phone: phoneNumber, name: displayName)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
```

### Step 4: Update App Entry Point
Update `DispoApp.swift`:

```swift
import SwiftUI
import Firebase

@main
struct DispoApp: App {
    @StateObject private var authService = AuthService.shared
    
    init() {
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            if authService.isLoggedIn {
                MainTabView()
                    .environmentObject(authService)
            } else {
                LoginView()
                    .environmentObject(authService)
            }
        }
    }
}
```

### Step 5: Create Placeholder Main View
Create `Views/MainTabView.swift` (placeholder):

```swift
import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService
    
    var body: some View {
        VStack {
            Text("Welcome, \(authService.currentUser?.fullName ?? "User")!")
            Button("Logout") {
                authService.logout()
            }
        }
    }
}
```

## Acceptance Criteria
- [ ] Login screen appears on first launch
- [ ] Phone number and name fields validate (10+ digits, non-empty name)
- [ ] Tapping Continue creates user document in Firestore
- [ ] User ID persists across app launches (UserDefaults)
- [ ] Returning users load existing profile
- [ ] Logout clears stored credentials and returns to login

## Test Schema
After implementing, create a test user:
1. Run the app
2. Enter phone: `5551234567`
3. Enter name: `Test User`
4. Tap Continue
5. Verify document exists in `users/5551234567` in Firestore Console

## Notes
- This is intentionally insecure for MVP
- Real authentication (Firebase Auth) will replace this later
- Phone number is used as document ID for simplicity
