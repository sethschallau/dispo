# Task: Group Management

## Description
Implement group listing, creation, and joining functionality. Groups allow users to share events with specific circles of friends.

## Prerequisites
- Task `02-main-navigation` complete
- GroupsView placeholder exists

## Implementation

### Step 1: Create Group Model
Create `Models/Group.swift`:

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
```

### Step 2: Create Groups Service
Create `Services/GroupsService.swift`:

```swift
import Foundation
import FirebaseFirestore

class GroupsService: ObservableObject {
    @Published var userGroups: [Group] = []
    @Published var isLoading = false
    
    private let db = Firestore.firestore()
    private var listener: ListenerRegistration?
    
    func loadGroups(for userId: String) {
        isLoading = true
        
        listener?.remove()
        listener = db.collection("groups")
            .whereField("members", arrayContains: userId)
            .addSnapshotListener { [weak self] snapshot, error in
                self?.isLoading = false
                
                guard let documents = snapshot?.documents else {
                    print("Error fetching groups: \(error?.localizedDescription ?? "Unknown")")
                    return
                }
                
                self?.userGroups = documents.compactMap { doc in
                    try? doc.data(as: Group.self)
                }
            }
    }
    
    func createGroup(name: String, description: String?, ownerId: String) async throws -> String {
        let groupRef = db.collection("groups").document()
        
        let group = Group(
            name: name,
            description: description,
            members: [ownerId],
            ownerId: ownerId
        )
        
        try groupRef.setData(from: group)
        
        // Also add to user's groups array
        try await db.collection("users").document(ownerId).updateData([
            "groups": FieldValue.arrayUnion([groupRef.documentID])
        ])
        
        // Create member subcollection entry
        try await groupRef.collection("members").document(ownerId).setData([
            "role": "owner",
            "joinedAt": FieldValue.serverTimestamp()
        ])
        
        return groupRef.documentID
    }
    
    func joinGroup(groupId: String, userId: String) async throws {
        let groupRef = db.collection("groups").document(groupId)
        
        // Verify group exists
        let doc = try await groupRef.getDocument()
        guard doc.exists else {
            throw NSError(domain: "GroupsService", code: 404, 
                         userInfo: [NSLocalizedDescriptionKey: "Group not found"])
        }
        
        // Add user to members array
        try await groupRef.updateData([
            "members": FieldValue.arrayUnion([userId])
        ])
        
        // Update user's groups
        try await db.collection("users").document(userId).updateData([
            "groups": FieldValue.arrayUnion([groupId])
        ])
        
        // Add member subcollection entry
        try await groupRef.collection("members").document(userId).setData([
            "role": "member",
            "joinedAt": FieldValue.serverTimestamp()
        ])
    }
    
    func leaveGroup(groupId: String, userId: String) async throws {
        let groupRef = db.collection("groups").document(groupId)
        
        try await groupRef.updateData([
            "members": FieldValue.arrayRemove([userId])
        ])
        
        try await db.collection("users").document(userId).updateData([
            "groups": FieldValue.arrayRemove([groupId])
        ])
        
        try await groupRef.collection("members").document(userId).delete()
    }
    
    deinit {
        listener?.remove()
    }
}
```

### Step 3: Update GroupsView
Replace `Views/Groups/GroupsView.swift`:

```swift
import SwiftUI

struct GroupsView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var groupsService = GroupsService()
    
    @State private var showCreateGroup = false
    @State private var showJoinGroup = false
    @State private var joinGroupCode = ""
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            List {
                // Join Group Section
                Section {
                    HStack {
                        TextField("Group Code", text: $joinGroupCode)
                            .textFieldStyle(.roundedBorder)
                        
                        Button("Join") {
                            joinGroup()
                        }
                        .disabled(joinGroupCode.isEmpty)
                    }
                } header: {
                    Text("Join a Group")
                }
                
                // Error Message
                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
                
                // My Groups Section
                Section {
                    if groupsService.isLoading {
                        HStack {
                            Spacer()
                            ProgressView()
                            Spacer()
                        }
                    } else if groupsService.userGroups.isEmpty {
                        Text("No groups yet")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(groupsService.userGroups) { group in
                            NavigationLink(destination: GroupDetailView(group: group)) {
                                GroupRowView(group: group)
                            }
                        }
                    }
                } header: {
                    Text("My Groups")
                }
            }
            .navigationTitle("Groups")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showCreateGroup = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showCreateGroup) {
                CreateGroupView(groupsService: groupsService)
            }
            .onAppear {
                if let userId = authService.currentUserId {
                    groupsService.loadGroups(for: userId)
                }
            }
        }
    }
    
    private func joinGroup() {
        errorMessage = nil
        guard let userId = authService.currentUserId else { return }
        
        Task {
            do {
                try await groupsService.joinGroup(groupId: joinGroupCode, userId: userId)
                joinGroupCode = ""
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
```

### Step 4: Create GroupRowView
Create `Views/Groups/GroupRowView.swift`:

```swift
import SwiftUI

struct GroupRowView: View {
    let group: Group
    
    var body: some View {
        HStack {
            Circle()
                .fill(Color.blue.opacity(0.2))
                .frame(width: 44, height: 44)
                .overlay(
                    Text(String(group.name.prefix(1)).uppercased())
                        .fontWeight(.semibold)
                        .foregroundColor(.blue)
                )
            
            VStack(alignment: .leading, spacing: 4) {
                Text(group.name)
                    .fontWeight(.medium)
                
                Text("\(group.members.count) member\(group.members.count == 1 ? "" : "s")")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}
```

### Step 5: Create CreateGroupView
Create `Views/Groups/CreateGroupView.swift`:

```swift
import SwiftUI

struct CreateGroupView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authService: AuthService
    @ObservedObject var groupsService: GroupsService
    
    @State private var name = ""
    @State private var description = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("Group Name", text: $name)
                    TextField("Description (optional)", text: $description)
                }
                
                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("New Group")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") { createGroup() }
                        .disabled(name.isEmpty || isLoading)
                }
            }
        }
    }
    
    private func createGroup() {
        guard let userId = authService.currentUserId else { return }
        isLoading = true
        
        Task {
            do {
                _ = try await groupsService.createGroup(
                    name: name,
                    description: description.isEmpty ? nil : description,
                    ownerId: userId
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

### Step 6: Create GroupDetailView
Create `Views/Groups/GroupDetailView.swift`:

```swift
import SwiftUI

struct GroupDetailView: View {
    let group: Group
    @EnvironmentObject var authService: AuthService
    
    var body: some View {
        List {
            Section {
                if let description = group.description, !description.isEmpty {
                    Text(description)
                        .foregroundColor(.secondary)
                }
                
                // Share Code
                HStack {
                    Text("Group Code")
                    Spacer()
                    Text(group.id ?? "")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Button(action: copyCode) {
                        Image(systemName: "doc.on.doc")
                    }
                }
            }
            
            Section {
                ForEach(group.members, id: \.self) { memberId in
                    HStack {
                        Text(memberId)
                            .font(.caption)
                        Spacer()
                        if memberId == group.ownerId {
                            Text("Owner")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            } header: {
                Text("Members (\(group.members.count))")
            }
        }
        .navigationTitle(group.name)
    }
    
    private func copyCode() {
        if let id = group.id {
            UIPasteboard.general.string = id
        }
    }
}
```

## Acceptance Criteria
- [ ] Groups list shows all groups user belongs to
- [ ] Create Group form creates new group in Firestore
- [ ] User is automatically added as owner and member
- [ ] Join Group with code adds user to existing group
- [ ] Group detail shows members and group code
- [ ] Real-time updates when groups change

## Test Schema
1. Create a group named "Test Friends"
2. Verify group appears in list
3. Copy group code
4. Log out, create new user
5. Join group using copied code
6. Verify both users see the group with 2 members

## Notes
- Member names display as IDs for now (lookup can be added later)
- Group deletion not implemented in MVP
- Member removal not implemented in MVP
