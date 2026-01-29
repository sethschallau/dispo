# Task: Group Admin Features

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes - code only |
| **Human tasks** | None |
| **Agent tasks** | Add admin controls to GroupDetailView, ownership transfer, member removal |
| **Estimated complexity** | Low-Medium |
| **Dependencies** | MVP complete |

## What Needs to Happen

### Agent Will Do (No Human Needed)
1. Update Group model with admin/owner fields
2. Add remove member functionality
3. Add transfer ownership functionality
4. Add delete group functionality
5. Update GroupDetailView with admin controls
6. Handle cascade effects (remove from user's groups, delete group events?)

## Implementation

### 1. Verify/Update Models/Group.swift
```swift
struct Group: Codable, Identifiable {
    @DocumentID var id: String?
    var name: String
    var description: String?
    var members: [String]
    var createdBy: String      // Owner - can do everything
    var admins: [String]?      // Optional: users who can add/remove members
    var createdAt: Date
    var code: String?          // Join code (could be short alphanumeric)
    
    func isOwner(_ userId: String) -> Bool {
        createdBy == userId
    }
    
    func isAdmin(_ userId: String) -> Bool {
        createdBy == userId || (admins?.contains(userId) ?? false)
    }
    
    func canRemoveMember(_ userId: String, removerId: String) -> Bool {
        // Owner can remove anyone except themselves
        // Admins can remove non-admins
        // Can't remove the owner
        guard removerId != userId else { return false }  // Can't remove self this way (use leave)
        guard userId != createdBy else { return false }   // Can't remove owner
        if removerId == createdBy { return true }         // Owner can remove anyone
        if admins?.contains(removerId) ?? false {
            return !(admins?.contains(userId) ?? false)   // Admin can't remove other admins
        }
        return false
    }
}
```

### 2. Add to Services/GroupsService.swift
```swift
// MARK: - Admin Functions

func removeMember(userId: String, from groupId: String) async throws {
    try await db.collection("groups").document(groupId).updateData([
        "members": FieldValue.arrayRemove([userId]),
        "admins": FieldValue.arrayRemove([userId])  // Also remove from admins if present
    ])
}

func leaveGroup(userId: String, groupId: String) async throws {
    // Check if user is owner
    let groupDoc = try await db.collection("groups").document(groupId).getDocument()
    guard let group = try? groupDoc.data(as: Group.self) else { return }
    
    if group.createdBy == userId {
        throw GroupError.ownerCannotLeave
    }
    
    try await removeMember(userId: userId, from: groupId)
}

func transferOwnership(groupId: String, to newOwnerId: String) async throws {
    // Verify new owner is a member
    let groupDoc = try await db.collection("groups").document(groupId).getDocument()
    guard let group = try? groupDoc.data(as: Group.self),
          group.members.contains(newOwnerId) else {
        throw GroupError.userNotMember
    }
    
    try await db.collection("groups").document(groupId).updateData([
        "createdBy": newOwnerId
    ])
}

func promoteToAdmin(userId: String, in groupId: String) async throws {
    try await db.collection("groups").document(groupId).updateData([
        "admins": FieldValue.arrayUnion([userId])
    ])
}

func demoteAdmin(userId: String, in groupId: String) async throws {
    try await db.collection("groups").document(groupId).updateData([
        "admins": FieldValue.arrayRemove([userId])
    ])
}

func deleteGroup(_ groupId: String) async throws {
    // Option 1: Just delete the group (events remain but orphaned)
    // Option 2: Delete group AND all its events
    // Going with Option 1 for safety - events can be reassigned or kept
    
    try await db.collection("groups").document(groupId).delete()
    
    // Optionally: Update all events with this groupId to be public or deleted
    // For now, leaving them as-is (they'll just have an invalid groupId)
}

enum GroupError: Error, LocalizedError {
    case ownerCannotLeave
    case userNotMember
    
    var errorDescription: String? {
        switch self {
        case .ownerCannotLeave:
            return "Transfer ownership before leaving the group"
        case .userNotMember:
            return "User is not a member of this group"
        }
    }
}
```

### 3. Update Views/GroupDetailView.swift
```swift
import SwiftUI

struct GroupDetailView: View {
    @Environment(\.dismiss) private var dismiss
    let group: Group
    let currentUserId: String
    
    @State private var members: [User] = []
    @State private var showTransferSheet = false
    @State private var showDeleteConfirm = false
    @State private var showLeaveConfirm = false
    @State private var memberToRemove: User?
    
    var isOwner: Bool { group.isOwner(currentUserId) }
    var isAdmin: Bool { group.isAdmin(currentUserId) }
    
    var body: some View {
        List {
            // Group info section
            Section {
                if let description = group.description, !description.isEmpty {
                    Text(description)
                }
                if let code = group.code {
                    HStack {
                        Text("Join Code")
                        Spacer()
                        Text(code)
                            .font(.system(.body, design: .monospaced))
                            .foregroundColor(.secondary)
                        Button(action: { copyCode(code) }) {
                            Image(systemName: "doc.on.doc")
                        }
                    }
                }
            }
            
            // Members section
            Section("Members (\(group.members.count))") {
                ForEach(members) { member in
                    HStack {
                        // Avatar
                        Circle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(width: 36, height: 36)
                            .overlay(Text(member.name.prefix(1).uppercased()))
                        
                        VStack(alignment: .leading) {
                            Text(member.displayName)
                            if member.id == group.createdBy {
                                Text("Owner")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                            } else if group.admins?.contains(member.id ?? "") ?? false {
                                Text("Admin")
                                    .font(.caption)
                                    .foregroundColor(.blue)
                            }
                        }
                        
                        Spacer()
                        
                        // Admin actions
                        if isAdmin && member.id != currentUserId && member.id != group.createdBy {
                            Menu {
                                if isOwner {
                                    if group.admins?.contains(member.id ?? "") ?? false {
                                        Button("Remove Admin") { demoteAdmin(member) }
                                    } else {
                                        Button("Make Admin") { promoteAdmin(member) }
                                    }
                                    Button("Transfer Ownership") { transferTo(member) }
                                }
                                Button("Remove from Group", role: .destructive) {
                                    memberToRemove = member
                                }
                            } label: {
                                Image(systemName: "ellipsis.circle")
                            }
                        }
                    }
                }
                
                // Add member button
                if isAdmin {
                    Button(action: { /* show user search */ }) {
                        Label("Add Member", systemImage: "person.badge.plus")
                    }
                }
            }
            
            // Danger zone
            Section {
                if !isOwner {
                    Button("Leave Group", role: .destructive) {
                        showLeaveConfirm = true
                    }
                }
                
                if isOwner {
                    Button("Transfer Ownership", role: .destructive) {
                        showTransferSheet = true
                    }
                    Button("Delete Group", role: .destructive) {
                        showDeleteConfirm = true
                    }
                }
            }
        }
        .navigationTitle(group.name)
        .task { await loadMembers() }
        .confirmationDialog("Remove Member?", isPresented: .init(
            get: { memberToRemove != nil },
            set: { if !$0 { memberToRemove = nil } }
        )) {
            Button("Remove", role: .destructive) {
                if let member = memberToRemove {
                    removeMember(member)
                }
            }
        } message: {
            Text("Remove \(memberToRemove?.displayName ?? "this member") from the group?")
        }
        .confirmationDialog("Leave Group?", isPresented: $showLeaveConfirm) {
            Button("Leave", role: .destructive) { leaveGroup() }
        }
        .confirmationDialog("Delete Group?", isPresented: $showDeleteConfirm, titleVisibility: .visible) {
            Button("Delete", role: .destructive) { deleteGroup() }
        } message: {
            Text("This will permanently delete the group. Events will remain but won't be associated with any group.")
        }
        .sheet(isPresented: $showTransferSheet) {
            TransferOwnershipView(group: group, members: members) { newOwner in
                transferOwnership(to: newOwner)
            }
        }
    }
    
    // MARK: - Actions
    
    private func loadMembers() async {
        // Fetch user details for all member IDs
        for memberId in group.members {
            if let user = try? await UserService.shared.getUser(id: memberId) {
                await MainActor.run { members.append(user) }
            }
        }
    }
    
    private func removeMember(_ member: User) {
        guard let userId = member.id, let groupId = group.id else { return }
        Task {
            try? await GroupsService.shared.removeMember(userId: userId, from: groupId)
            await MainActor.run { members.removeAll { $0.id == userId } }
        }
        memberToRemove = nil
    }
    
    private func leaveGroup() {
        guard let groupId = group.id else { return }
        Task {
            try? await GroupsService.shared.leaveGroup(userId: currentUserId, groupId: groupId)
            await MainActor.run { dismiss() }
        }
    }
    
    private func promoteAdmin(_ member: User) {
        guard let userId = member.id, let groupId = group.id else { return }
        Task {
            try? await GroupsService.shared.promoteToAdmin(userId: userId, in: groupId)
        }
    }
    
    private func demoteAdmin(_ member: User) {
        guard let userId = member.id, let groupId = group.id else { return }
        Task {
            try? await GroupsService.shared.demoteAdmin(userId: userId, in: groupId)
        }
    }
    
    private func transferOwnership(to member: User) {
        guard let userId = member.id, let groupId = group.id else { return }
        Task {
            try? await GroupsService.shared.transferOwnership(groupId: groupId, to: userId)
        }
    }
    
    private func deleteGroup() {
        guard let groupId = group.id else { return }
        Task {
            try? await GroupsService.shared.deleteGroup(groupId)
            await MainActor.run { dismiss() }
        }
    }
    
    private func copyCode(_ code: String) {
        UIPasteboard.general.string = code
    }
}

struct TransferOwnershipView: View {
    let group: Group
    let members: [User]
    let onTransfer: (User) -> Void
    @Environment(\.dismiss) private var dismiss
    
    var eligibleMembers: [User] {
        members.filter { $0.id != group.createdBy }
    }
    
    var body: some View {
        NavigationView {
            List(eligibleMembers) { member in
                Button(action: {
                    onTransfer(member)
                    dismiss()
                }) {
                    Text(member.displayName)
                }
            }
            .navigationTitle("Transfer To")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
```

## Files to Create/Modify
- [ ] `Models/Group.swift` - Add admin helpers
- [ ] `Services/GroupsService.swift` - Add admin functions
- [ ] `Views/GroupDetailView.swift` - Add admin UI

## Acceptance Criteria
- [ ] Owner can remove any member (except self)
- [ ] Owner can promote/demote admins
- [ ] Owner can transfer ownership
- [ ] Owner can delete group
- [ ] Admins can remove non-admin members
- [ ] Non-owner members can leave group
- [ ] Owner must transfer ownership before leaving
- [ ] Confirmations for destructive actions

## Test Cases
1. Owner removes member → member gone from group
2. Owner promotes member to admin → shows "Admin" badge
3. Owner transfers ownership → new owner has controls
4. Member leaves group → removed from members list
5. Owner tries to leave → error, must transfer first
6. Delete group → group removed, events remain
