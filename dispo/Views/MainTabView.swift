//
//  MainTabView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService
    
    var body: some View {
        TabView {
            // Feed Tab
            NavigationView {
                FeedView()
                    .environmentObject(authService)
            }
            .tabItem {
                Label("Feed", systemImage: "list.bullet")
            }
            
            // Groups Tab (placeholder)
            NavigationView {
                groupsPlaceholder
                    .navigationTitle("Groups")
            }
            .tabItem {
                Label("Groups", systemImage: "person.3")
            }
            
            // Calendar Tab (placeholder)
            NavigationView {
                calendarPlaceholder
                    .navigationTitle("Calendar")
            }
            .tabItem {
                Label("Calendar", systemImage: "calendar")
            }
            
            // Profile Tab
            NavigationView {
                profileView
                    .navigationTitle("Profile")
            }
            .tabItem {
                Label("Profile", systemImage: "person")
            }
        }
    }
    
    // MARK: - Groups Placeholder
    
    private var groupsPlaceholder: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.3")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            Text("Groups")
                .font(.headline)
            Text("Coming soon...")
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Calendar Placeholder
    
    private var calendarPlaceholder: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            Text("Calendar")
                .font(.headline)
            Text("Coming soon...")
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Profile View
    
    private var profileView: some View {
        VStack(spacing: 16) {
            Spacer()
            
            Image(systemName: "person.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.gray)
            
            Text(authService.currentUser?.fullName ?? "User")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("@\(authService.currentUser?.username ?? "username")")
                .foregroundColor(.secondary)
            
            if let bio = authService.currentUser?.bio, !bio.isEmpty {
                Text(bio)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.top, 8)
            }
            
            Spacer()
            
            Button(action: { authService.logout() }) {
                Text("Logout")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red.opacity(0.1))
                    .foregroundColor(.red)
                    .cornerRadius(12)
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 32)
        }
        .padding()
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthService.shared)
}
