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
            
            // Leave Group Section
            if authService.currentUserId != group.ownerId {
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
                // Refresh members
                await loadMembers()
            } catch {
                print("Error adding member: \(error)")
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
