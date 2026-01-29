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
            // Feed Tab (placeholder)
            NavigationView {
                VStack(spacing: 20) {
                    Image(systemName: "calendar")
                        .font(.system(size: 60))
                        .foregroundColor(.blue)
                    
                    Text("Welcome, \(authService.currentUser?.fullName ?? "User")!")
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text("Feed view coming soon...")
                        .foregroundColor(.secondary)
                    
                    Spacer().frame(height: 40)
                    
                    Button(action: { authService.logout() }) {
                        Label("Logout", systemImage: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(.red)
                    }
                }
                .padding()
                .navigationTitle("Feed")
            }
            .tabItem {
                Label("Feed", systemImage: "list.bullet")
            }
            
            // Groups Tab (placeholder)
            NavigationView {
                Text("Groups coming soon...")
                    .foregroundColor(.secondary)
                    .navigationTitle("Groups")
            }
            .tabItem {
                Label("Groups", systemImage: "person.3")
            }
            
            // Calendar Tab (placeholder)
            NavigationView {
                Text("Calendar coming soon...")
                    .foregroundColor(.secondary)
                    .navigationTitle("Calendar")
            }
            .tabItem {
                Label("Calendar", systemImage: "calendar")
            }
            
            // Profile Tab (placeholder)
            NavigationView {
                VStack(spacing: 16) {
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
                .navigationTitle("Profile")
            }
            .tabItem {
                Label("Profile", systemImage: "person")
            }
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthService.shared)
}
