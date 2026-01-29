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
                ForEach(group.members, id: \.self) { memberId in
                    HStack {
                        Circle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(width: 32, height: 32)
                            .overlay(
                                Image(systemName: "person.fill")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            )
                        
                        Text(memberId)
                            .font(.subheadline)
                        
                        Spacer()
                        
                        if memberId == group.ownerId {
                            Text("Owner")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.secondary.opacity(0.1))
                                .cornerRadius(4)
                        }
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
