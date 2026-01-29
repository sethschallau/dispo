//
//  ProfileView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI
import Combine

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var groupsService = GroupsService()
    
    @State private var showEditProfile = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Profile Header
                profileHeader
                
                Divider()
                    .padding(.horizontal)
                
                // Stats
                statsSection
                
                Divider()
                    .padding(.horizontal)
                
                // Groups Preview
                groupsSection
                
                Spacer(minLength: 40)
                
                // Logout Button
                Button(action: { authService.logout() }) {
                    Text("Logout")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.red.opacity(0.1))
                        .foregroundColor(.red)
                        .cornerRadius(12)
                }
                .padding(.horizontal, 32)
            }
            .padding(.vertical)
        }
        .navigationTitle("Profile")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Edit") { showEditProfile = true }
            }
        }
        .sheet(isPresented: $showEditProfile) {
            EditProfileView()
                .environmentObject(authService)
        }
        .onAppear {
            if let userId = authService.currentUserId {
                groupsService.loadGroups(for: userId)
            }
        }
    }
    
    // MARK: - Profile Header
    
    private var profileHeader: some View {
        VStack(spacing: 16) {
            // Avatar
            Circle()
                .fill(Color.blue.opacity(0.1))
                .frame(width: 100, height: 100)
                .overlay(
                    Text(String(authService.currentUser?.fullName.prefix(1) ?? "?").uppercased())
                        .font(.system(size: 40, weight: .semibold))
                        .foregroundColor(.blue)
                )
            
            // Name
            Text(authService.currentUser?.fullName ?? "User")
                .font(.title2)
                .fontWeight(.semibold)
            
            // Username
            Text("@\(authService.currentUser?.username ?? "username")")
                .foregroundColor(.secondary)
            
            // Bio
            if let bio = authService.currentUser?.bio, !bio.isEmpty {
                Text(bio)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
        }
    }
    
    // MARK: - Stats Section
    
    private var statsSection: some View {
        HStack(spacing: 40) {
            statItem(count: groupsService.userGroups.count, label: "Groups")
            // Could add more stats here like events created, etc.
        }
        .padding(.vertical, 8)
    }
    
    private func statItem(count: Int, label: String) -> some View {
        VStack(spacing: 4) {
            Text("\(count)")
                .font(.title2)
                .fontWeight(.bold)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Groups Section
    
    private var groupsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("My Groups")
                .font(.headline)
                .padding(.horizontal)
            
            if groupsService.userGroups.isEmpty {
                Text("No groups yet")
                    .foregroundColor(.secondary)
                    .padding(.horizontal)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(groupsService.userGroups) { group in
                            groupChip(group)
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
    }
    
    private func groupChip(_ group: AppGroup) -> some View {
        HStack(spacing: 8) {
            Circle()
                .fill(Color.blue.opacity(0.2))
                .frame(width: 24, height: 24)
                .overlay(
                    Text(String(group.name.prefix(1)).uppercased())
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundColor(.blue)
                )
            
            Text(group.name)
                .font(.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(20)
    }
}

#Preview {
    NavigationView {
        ProfileView()
            .environmentObject(AuthService.shared)
    }
}
