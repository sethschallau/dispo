//
//  MainTabView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Feed Tab
            NavigationView {
                FeedView()
                    .environmentObject(authService)
            }
            .tabItem {
                Label("Feed", systemImage: "house.fill")
            }
            .tag(0)
            
            // Calendar Tab
            NavigationView {
                CalendarView()
                    .environmentObject(authService)
            }
            .tabItem {
                Label("Calendar", systemImage: "calendar")
            }
            .tag(1)
            
            // Groups Tab
            NavigationView {
                GroupsView()
                    .environmentObject(authService)
            }
            .tabItem {
                Label("Groups", systemImage: "person.3.fill")
            }
            .tag(2)
            
            // Profile Tab
            NavigationView {
                ProfileView()
                    .environmentObject(authService)
            }
            .tabItem {
                Label("Profile", systemImage: "person.circle.fill")
            }
            .tag(3)
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthService.shared)
}
