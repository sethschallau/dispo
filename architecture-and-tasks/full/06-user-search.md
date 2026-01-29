# Task: User Search

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes - code only |
| **Human tasks** | None |
| **Agent tasks** | Add search to User model, create search UI, integrate with groups |
| **Estimated complexity** | Low-Medium |
| **Dependencies** | MVP complete |

## What Needs to Happen

### Agent Will Do (No Human Needed)
1. Add `username` field to User model (if not present)
2. Add search method to a UserService
3. Create `UserSearchView.swift`
4. Integrate search into GroupDetailView for adding members
5. (Optional) Add Firestore index for username queries

## Implementation

### 1. Update Models/User.swift
```swift
struct User: Codable, Identifiable {
    @DocumentID var id: String?
    var name: String
    var phone: String
    var username: String?  // Add this - lowercased for searching
    var bio: String?
    var createdAt: Date
    var groups: [String]?
    var fcmToken: String?
    
    // Computed display name
    var displayName: String {
        name.isEmpty ? (username ?? phone) : name
    }
}
```

### 2. Create Services/UserService.swift
```swift
import FirebaseFirestore

class UserService {
    static let shared = UserService()
    private let db = Firestore.firestore()
    
    func searchUsers(query: String, limit: Int = 10) async throws -> [User] {
        let lowercased = query.lowercased()
        
        // Search by username prefix
        let snapshot = try await db.collection("users")
            .whereField("username", isGreaterThanOrEqualTo: lowercased)
            .whereField("username", isLessThan: lowercased + "\u{f8ff}")
            .limit(to: limit)
            .getDocuments()
        
        return snapshot.documents.compactMap { try? $0.data(as: User.self) }
    }
    
    func getUser(id: String) async throws -> User? {
        let doc = try await db.collection("users").document(id).getDocument()
        return try? doc.data(as: User.self)
    }
    
    func updateUsername(_ username: String, for userId: String) async throws {
        try await db.collection("users").document(userId).updateData([
            "username": username.lowercased()
        ])
    }
}
```

### 3. Create Views/UserSearchView.swift
```swift
import SwiftUI

struct UserSearchView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""
    @State private var results: [User] = []
    @State private var isSearching = false
    
    let onSelect: (User) -> Void
    var excludeUserIds: [String] = []
    
    var body: some View {
        NavigationView {
            List {
                if isSearching {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                } else if results.isEmpty && !searchText.isEmpty {
                    Text("No users found")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(results.filter { !excludeUserIds.contains($0.id ?? "") }) { user in
                        Button(action: { selectUser(user) }) {
                            HStack {
                                // Avatar placeholder
                                Circle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 40, height: 40)
                                    .overlay(
                                        Text(user.name.prefix(1).uppercased())
                                            .font(.headline)
                                    )
                                
                                VStack(alignment: .leading) {
                                    Text(user.displayName)
                                        .font(.headline)
                                    if let username = user.username {
                                        Text("@\(username)")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                
                                Spacer()
                            }
                        }
                        .foregroundColor(.primary)
                    }
                }
            }
            .searchable(text: $searchText, prompt: "Search by username")
            .onChange(of: searchText) { _, newValue in
                performSearch(query: newValue)
            }
            .navigationTitle("Find Users")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
    
    private func performSearch(query: String) {
        guard query.count >= 2 else {
            results = []
            return
        }
        
        isSearching = true
        Task {
            do {
                let users = try await UserService.shared.searchUsers(query: query)
                await MainActor.run {
                    results = users
                    isSearching = false
                }
            } catch {
                await MainActor.run {
                    results = []
                    isSearching = false
                }
            }
        }
    }
    
    private func selectUser(_ user: User) {
        onSelect(user)
        dismiss()
    }
}
```

### 4. Update GroupDetailView
```swift
// Add state
@State private var showUserSearch = false

// Add button in view
Button(action: { showUserSearch = true }) {
    Label("Add Member", systemImage: "person.badge.plus")
}
.sheet(isPresented: $showUserSearch) {
    UserSearchView(
        onSelect: { user in addMember(user) },
        excludeUserIds: group.members
    )
}

private func addMember(_ user: User) {
    guard let userId = user.id, let groupId = group.id else { return }
    Task {
        try? await GroupsService.shared.addMember(userId: userId, to: groupId)
    }
}
```

### 5. Update ProfileView for Setting Username
```swift
// Add section in EditProfileView
Section("Username") {
    TextField("username", text: $username)
        .textInputAutocapitalization(.never)
        .autocorrectionDisabled()
    Text("Others can find you by your username")
        .font(.caption)
        .foregroundColor(.secondary)
}
```

## Firestore Index (Optional)
If queries are slow, create a composite index in Firebase Console:
- Collection: `users`
- Field: `username` (Ascending)

## Files to Create/Modify
- [ ] `Models/User.swift` - Add username field
- [ ] `Services/UserService.swift` - Create new
- [ ] `Views/UserSearchView.swift` - Create new
- [ ] `Views/GroupDetailView.swift` - Add member search
- [ ] `Views/EditProfileView.swift` - Add username editing

## Acceptance Criteria
- [ ] Can search users by username
- [ ] Search results appear as user types (debounced)
- [ ] Can add user to group from search results
- [ ] Already-members excluded from results
- [ ] Can set own username in profile
- [ ] Username stored lowercase for case-insensitive search

## Test Cases
1. Search for existing user → appears in results
2. Search for non-existent user → "No users found"
3. Add user to group → they appear in members list
4. Search with <2 chars → no search performed
