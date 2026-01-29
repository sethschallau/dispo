# Task: Profile View

## Description
Complete the profile view with user information display and edit functionality.

## Prerequisites
- Task `02-main-navigation` complete

## Implementation

### Step 1: Update AuthService for Profile Updates
Add to `Services/AuthService.swift`:

```swift
func updateProfile(name: String?, bio: String?) async throws {
    guard let userId = currentUserId else { return }
    
    var updates: [String: Any] = [:]
    if let name = name { updates["fullName"] = name }
    if let bio = bio { updates["bio"] = bio }
    
    guard !updates.isEmpty else { return }
    
    try await db.collection("users").document(userId).updateData(updates)
    
    // Update local user
    if let name = name { currentUser?.fullName = name }
    if let bio = bio { currentUser?.bio = bio }
}
```

### Step 2: Update ProfileView
Replace `Views/Profile/ProfileView.swift`:

```swift
import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var groupsService = GroupsService()
    @StateObject private var eventsService = EventsService()
    
    @State private var showEditProfile = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Profile Header
                    profileHeader
                    
                    // Stats
                    statsSection
                    
                    // Groups Preview
                    groupsPreview
                    
                    // Logout
                    logoutButton
                }
                .padding()
            }
            .navigationTitle("Profile")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Edit") {
                        showEditProfile = true
                    }
                }
            }
            .sheet(isPresented: $showEditProfile) {
                EditProfileView()
            }
            .onAppear {
                if let userId = authService.currentUserId {
                    groupsService.loadGroups(for: userId)
                    eventsService.loadFeed(userId: userId, userGroups: [])
                }
            }
        }
    }
    
    private var profileHeader: some View {
        VStack(spacing: 12) {
            // Avatar
            Circle()
                .fill(Color.blue.opacity(0.2))
                .frame(width: 100, height: 100)
                .overlay(
                    Text(initials)
                        .font(.system(size: 36, weight: .semibold))
                        .foregroundColor(.blue)
                )
            
            // Name
            Text(authService.currentUser?.fullName ?? "Unknown")
                .font(.title2)
                .fontWeight(.semibold)
            
            // Username
            Text("@\(authService.currentUser?.username ?? "user")")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            // Bio
            if let bio = authService.currentUser?.bio, !bio.isEmpty {
                Text(bio)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            // User ID (for sharing)
            if let phone = authService.currentUser?.phone {
                HStack {
                    Text("ID: \(phone)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Button(action: { copyUserId() }) {
                        Image(systemName: "doc.on.doc")
                            .font(.caption)
                    }
                }
            }
        }
    }
    
    private var statsSection: some View {
        HStack(spacing: 32) {
            StatBox(value: "\(eventsCreatedCount)", label: "Events")
            StatBox(value: "\(groupsService.userGroups.count)", label: "Groups")
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private var groupsPreview: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Groups")
                .font(.headline)
            
            if groupsService.userGroups.isEmpty {
                Text("No groups yet")
                    .foregroundColor(.secondary)
            } else {
                ForEach(groupsService.userGroups.prefix(3)) { group in
                    HStack {
                        Circle()
                            .fill(Color.blue.opacity(0.2))
                            .frame(width: 32, height: 32)
                            .overlay(
                                Text(String(group.name.prefix(1)))
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.blue)
                            )
                        
                        Text(group.name)
                            .font(.subheadline)
                        
                        Spacer()
                    }
                }
                
                if groupsService.userGroups.count > 3 {
                    Text("+\(groupsService.userGroups.count - 3) more")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private var logoutButton: some View {
        Button(action: { authService.logout() }) {
            Text("Logout")
                .foregroundColor(.red)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
        }
    }
    
    private var initials: String {
        guard let name = authService.currentUser?.fullName else { return "?" }
        return name.split(separator: " ")
            .compactMap { $0.first }
            .map { String($0) }
            .prefix(2)
            .joined()
    }
    
    private var eventsCreatedCount: Int {
        guard let userId = authService.currentUserId else { return 0 }
        return eventsService.events.filter { $0.creatorId == userId }.count
    }
    
    private func copyUserId() {
        if let phone = authService.currentUser?.phone {
            UIPasteboard.general.string = phone
        }
    }
}

struct StatBox: View {
    let value: String
    let label: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}
```

### Step 3: Create EditProfileView
Create `Views/Profile/EditProfileView.swift`:

```swift
import SwiftUI

struct EditProfileView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authService: AuthService
    
    @State private var fullName: String = ""
    @State private var bio: String = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                Section("Display Name") {
                    TextField("Full Name", text: $fullName)
                }
                
                Section("Bio") {
                    TextField("Tell us about yourself", text: $bio, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { saveProfile() }
                        .disabled(isLoading)
                }
            }
            .onAppear {
                fullName = authService.currentUser?.fullName ?? ""
                bio = authService.currentUser?.bio ?? ""
            }
        }
    }
    
    private func saveProfile() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await authService.updateProfile(
                    name: fullName.isEmpty ? nil : fullName,
                    bio: bio
                )
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
```

## Acceptance Criteria
- [ ] Profile shows user's name, username, and bio
- [ ] Initials displayed in avatar circle
- [ ] Stats show events created and groups count
- [ ] Groups preview shows up to 3 groups
- [ ] User ID can be copied (for sharing with friends)
- [ ] Edit button opens edit form
- [ ] Can update name and bio
- [ ] Logout button works

## Test Schema
1. View profile after login
2. Verify name and username display
3. Tap Edit, change bio
4. Save and verify update persists
5. Check Firestore for updated document

## Notes
- Profile picture upload not in MVP scope
- Stats calculated from loaded events/groups
