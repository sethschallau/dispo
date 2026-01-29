//
//  GroupDetailView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI
import Combine

struct GroupDetailView: View {
    let group: AppGroup
    @ObservedObject var groupsService: GroupsService
    
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss
    
    @State private var showCopiedToast = false
    @State private var showLeaveConfirm = false
    @State private var isLeaving = false
    @State private var showAddMember = false
    @State private var members: [User] = []
    @State private var isLoadingMembers = true
    @State private var showDeleteConfirm = false
    @State private var showTransferSheet = false
    @State private var memberToRemove: User?
    @State private var isDeleting = false
    
    private var isOwner: Bool {
        authService.currentUserId == group.ownerId
    }
    
    var body: some View {
        List {
            // Group Info Section
            Section {
                if let description = group.description, !description.isEmpty {
                    Text(description)
                        .foregroundColor(.secondary)
                }
                
                // Join Code Row
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Join Code")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(group.joinCode ?? group.id ?? "N/A")
                            .font(.title3)
                            .fontWeight(.semibold)
                            .fontDesign(.monospaced)
                    }
                    
                    Spacer()
                    
                    Button(action: copyCode) {
                        Image(systemName: showCopiedToast ? "checkmark" : "doc.on.doc")
                            .foregroundColor(showCopiedToast ? .green : .blue)
                    }
                }
            }
            
            // Members Section
            Section {
                if isLoadingMembers {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                } else {
                    ForEach(members) { member in
                        HStack {
                            Circle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(width: 36, height: 36)
                                .overlay(
                                    Text(member.fullName.prefix(1).uppercased())
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                        .foregroundColor(.secondary)
                                )
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(member.fullName)
                                    .font(.subheadline)
                                Text("@\(member.username)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            if member.id == group.ownerId {
                                Text("Owner")
                                    .font(.caption2)
                                    .foregroundColor(.orange)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 2)
                                    .background(Color.orange.opacity(0.1))
                                    .cornerRadius(4)
                            } else if isOwner {
                                // Admin actions for non-owner members
                                Menu {
                                    Button(action: { transferOwnership(to: member) }) {
                                        Label("Make Owner", systemImage: "crown")
                                    }
                                    Button(role: .destructive, action: { memberToRemove = member }) {
                                        Label("Remove", systemImage: "person.badge.minus")
                                    }
                                } label: {
                                    Image(systemName: "ellipsis.circle")
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }
                
                // Add Member button (for owner)
                if isOwner {
                    Button(action: { showAddMember = true }) {
                        Label("Add Member", systemImage: "person.badge.plus")
                    }
                }
            } header: {
                Text("Members (\(group.members.count))")
            }
            
            // Leave Group Section (for non-owners)
            if !isOwner {
                Section {
                    Button(role: .destructive, action: { showLeaveConfirm = true }) {
                        HStack {
                            Spacer()
                            if isLeaving {
                                ProgressView()
                            } else {
                                Text("Leave Group")
                            }
                            Spacer()
                        }
                    }
                    .disabled(isLeaving)
                }
            }
            
            // Owner Actions Section
            if isOwner {
                Section {
                    Button(action: { showTransferSheet = true }) {
                        Label("Transfer Ownership", systemImage: "crown")
                    }
                    
                    Button(role: .destructive, action: { showDeleteConfirm = true }) {
                        Label("Delete Group", systemImage: "trash")
                    }
                } header: {
                    Text("Owner Actions")
                } footer: {
                    Text("Deleting the group will remove it for all members")
                }
            }
        }
        .navigationTitle(group.name)
        .confirmationDialog("Leave Group?", isPresented: $showLeaveConfirm, titleVisibility: .visible) {
            Button("Leave", role: .destructive) { leaveGroup() }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("You'll no longer see events from this group")
        }
        .sheet(isPresented: $showAddMember) {
            UserSearchView(
                onSelect: { user in addMember(user) },
                excludeUserIds: group.members,
                title: "Add Member"
            )
        }
        .sheet(isPresented: $showTransferSheet) {
            TransferOwnershipSheet(
                members: members.filter { $0.id != group.ownerId },
                onTransfer: { user in transferOwnership(to: user) }
            )
        }
        .confirmationDialog("Remove Member?", isPresented: .init(
            get: { memberToRemove != nil },
            set: { if !$0 { memberToRemove = nil } }
        ), titleVisibility: .visible) {
            Button("Remove", role: .destructive) {
                if let member = memberToRemove {
                    removeMember(member)
                }
            }
            Button("Cancel", role: .cancel) { memberToRemove = nil }
        } message: {
            Text("Remove \(memberToRemove?.fullName ?? "this member") from the group?")
        }
        .confirmationDialog("Delete Group?", isPresented: $showDeleteConfirm, titleVisibility: .visible) {
            Button("Delete", role: .destructive) { deleteGroup() }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("This will permanently delete the group. All members will be removed. Events will remain but won't be associated with this group.")
        }
        .overlay {
            if isDeleting {
                Color.black.opacity(0.3)
                    .ignoresSafeArea()
                VStack {
                    ProgressView()
                    Text("Deleting...")
                        .font(.caption)
                        .foregroundColor(.white)
                }
            }
        }
        .task {
            await loadMembers()
        }
    }
    
    private func loadMembers() async {
        isLoadingMembers = true
        do {
            members = try await UserService.shared.getUsers(ids: group.members)
            // Sort to put owner first
            members.sort { user1, user2 in
                if user1.id == group.ownerId { return true }
                if user2.id == group.ownerId { return false }
                return user1.fullName < user2.fullName
            }
        } catch {
            print("Error loading members: \(error)")
        }
        isLoadingMembers = false
    }
    
    private func addMember(_ user: User) {
        guard let userId = user.id, let groupId = group.id else { return }
        
        Task {
            do {
                try await groupsService.addMember(userId: userId, to: groupId)
                await loadMembers()
            } catch {
                print("Error adding member: \(error)")
            }
        }
    }
    
    private func removeMember(_ user: User) {
        guard let userId = user.id, let groupId = group.id else { return }
        
        Task {
            do {
                try await groupsService.removeMember(userId: userId, from: groupId)
                await MainActor.run {
                    members.removeAll { $0.id == userId }
                }
            } catch {
                print("Error removing member: \(error)")
            }
        }
        memberToRemove = nil
    }
    
    private func transferOwnership(to user: User) {
        guard let userId = user.id, let groupId = group.id else { return }
        
        Task {
            do {
                try await groupsService.transferOwnership(groupId: groupId, to: userId)
                // Dismiss or refresh - the view will show stale data since group is let
                dismiss()
            } catch {
                print("Error transferring ownership: \(error)")
            }
        }
    }
    
    private func deleteGroup() {
        guard let groupId = group.id else { return }
        isDeleting = true
        
        Task {
            do {
                try await groupsService.deleteGroup(groupId)
                await MainActor.run {
                    isDeleting = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isDeleting = false
                    print("Error deleting group: \(error)")
                }
            }
        }
    }
    
    private func copyCode() {
        let code = group.joinCode ?? group.id ?? ""
        UIPasteboard.general.string = code
        
        withAnimation {
            showCopiedToast = true
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation {
                showCopiedToast = false
            }
        }
    }
    
    private func leaveGroup() {
        guard let userId = authService.currentUserId,
              let groupId = group.id else { return }
        
        isLeaving = true
        
        Task {
            do {
                try await groupsService.leaveGroup(groupId: groupId, userId: userId)
                dismiss()
            } catch {
                print("Error leaving group: \(error)")
            }
            isLeaving = false
        }
    }
}

// MARK: - Transfer Ownership Sheet

struct TransferOwnershipSheet: View {
    let members: [User]
    let onTransfer: (User) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var showConfirm = false
    @State private var selectedMember: User?
    
    var body: some View {
        NavigationView {
            List {
                if members.isEmpty {
                    Text("No other members to transfer to")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(members) { member in
                        Button(action: {
                            selectedMember = member
                            showConfirm = true
                        }) {
                            HStack {
                                Circle()
                                    .fill(Color.gray.opacity(0.2))
                                    .frame(width: 36, height: 36)
                                    .overlay(
                                        Text(member.fullName.prefix(1).uppercased())
                                            .font(.subheadline)
                                            .fontWeight(.medium)
                                            .foregroundColor(.secondary)
                                    )
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(member.fullName)
                                        .font(.subheadline)
                                    Text("@\(member.username)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                            }
                        }
                        .foregroundColor(.primary)
                    }
                }
            }
            .navigationTitle("Transfer Ownership")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .confirmationDialog("Transfer Ownership?", isPresented: $showConfirm, titleVisibility: .visible) {
                Button("Transfer", role: .destructive) {
                    if let member = selectedMember {
                        onTransfer(member)
                        dismiss()
                    }
                }
                Button("Cancel", role: .cancel) { selectedMember = nil }
            } message: {
                Text("Make \(selectedMember?.fullName ?? "this person") the new owner? You will lose owner privileges.")
            }
        }
    }
}

#Preview {
    NavigationView {
        GroupDetailView(
            group: AppGroup(
                id: "charleston_crew",
                name: "Charleston Race Crew",
                description: "Half marathon squad",
                members: ["9195551234", "9195552345", "9195553456"],
                ownerId: "9195551234",
                joinCode: "RACE26"
            ),
            groupsService: GroupsService()
        )
        .environmentObject(AuthService.shared)
    }
}
