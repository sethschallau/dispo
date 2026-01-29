//
//  GroupsView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI
import Combine

struct GroupsView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var groupsService = GroupsService()
    
    @State private var showCreateGroup = false
    @State private var joinCode = ""
    @State private var isJoining = false
    @State private var errorMessage: String?
    @State private var successMessage: String?
    
    var body: some View {
        List {
            // Join Group Section
            Section {
                HStack(spacing: 12) {
                    TextField("Group Code", text: $joinCode)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                    
                    Button(action: joinGroup) {
                        if isJoining {
                            ProgressView()
                                .frame(width: 50)
                        } else {
                            Text("Join")
                                .frame(width: 50)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(joinCode.isEmpty || isJoining)
                }
            } header: {
                Text("Join a Group")
            } footer: {
                if let error = errorMessage {
                    Text(error).foregroundColor(.red)
                } else if let success = successMessage {
                    Text(success).foregroundColor(.green)
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
                    VStack(spacing: 8) {
                        Text("No groups yet")
                            .foregroundColor(.secondary)
                        Text("Create one or join with a code")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                } else {
                    ForEach(groupsService.userGroups) { group in
                        NavigationLink(destination: GroupDetailView(group: group, groupsService: groupsService)) {
                            GroupRowView(group: group)
                        }
                    }
                }
            } header: {
                Text("My Groups (\(groupsService.userGroups.count))")
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
                .environmentObject(authService)
        }
        .onAppear {
            if let userId = authService.currentUserId {
                groupsService.loadGroups(for: userId)
            }
        }
    }
    
    private func joinGroup() {
        guard let userId = authService.currentUserId else { return }
        
        isJoining = true
        errorMessage = nil
        successMessage = nil
        
        Task {
            do {
                try await groupsService.joinGroup(code: joinCode.uppercased(), userId: userId)
                successMessage = "Joined group!"
                joinCode = ""
            } catch {
                errorMessage = error.localizedDescription
            }
            isJoining = false
        }
    }
}

#Preview {
    NavigationView {
        GroupsView()
            .environmentObject(AuthService.shared)
    }
}
