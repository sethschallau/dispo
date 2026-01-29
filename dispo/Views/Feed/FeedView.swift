//
//  FeedView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI
import Combine

struct FeedView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var eventsService = EventsService()
    @StateObject private var groupsService = GroupsService()
    
    @State private var hasLoadedGroups = false
    @State private var showCreateEvent = false
    
    var body: some View {
        Group {
            if eventsService.isLoading && eventsService.events.isEmpty {
                loadingView
            } else if eventsService.events.isEmpty {
                emptyState
            } else {
                eventsList
            }
        }
        .navigationTitle("Feed")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showCreateEvent = true }) {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showCreateEvent) {
            CreateEventView()
                .environmentObject(authService)
        }
        .onAppear {
            loadData()
        }
        .refreshable {
            await refreshData()
        }
        .onDisappear {
            // Keep listeners alive for tab switching
        }
    }
    
    // MARK: - Loading View
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
            Text("Loading events...")
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - Empty State
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.badge.plus")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("No events yet")
                .font(.headline)
            
            Text("Create an event or join a group to see events here")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - Events List
    
    private var eventsList: some View {
        List {
            // Upcoming section
            if !upcomingEvents.isEmpty {
                Section("Upcoming") {
                    ForEach(upcomingEvents) { event in
                        NavigationLink(destination: EventDetailView(event: event)) {
                            EventRowView(event: event)
                        }
                    }
                }
            }
            
            // Past section
            if !pastEvents.isEmpty {
                Section("Past") {
                    ForEach(pastEvents) { event in
                        NavigationLink(destination: EventDetailView(event: event)) {
                            EventRowView(event: event)
                                .opacity(0.6)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }
    
    // MARK: - Filtered Events
    
    private var upcomingEvents: [Event] {
        eventsService.events.filter { $0.eventDate >= Date() }
    }
    
    private var pastEvents: [Event] {
        eventsService.events
            .filter { $0.eventDate < Date() }
            .sorted { $0.eventDate > $1.eventDate } // Most recent past first
    }
    
    // MARK: - Data Loading
    
    private func loadData() {
        guard let userId = authService.currentUserId else { return }
        
        // First load groups, then load events
        if !hasLoadedGroups {
            groupsService.loadGroups(for: userId)
            hasLoadedGroups = true
        }
        
        // Wait briefly for groups to load, then load events
        // In a real app, we'd use Combine or async/await properly here
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            let groupIds = groupsService.userGroupIds
            eventsService.loadFeed(userId: userId, userGroups: groupIds)
        }
    }
    
    private func refreshData() async {
        guard let userId = authService.currentUserId else { return }
        
        // Reload groups
        groupsService.loadGroups(for: userId)
        
        // Wait a moment for groups to update
        try? await Task.sleep(nanoseconds: 300_000_000) // 0.3 seconds
        
        // Reload events with updated group list
        let groupIds = groupsService.userGroupIds
        eventsService.loadFeed(userId: userId, userGroups: groupIds)
    }
}

// MARK: - Preview

#Preview {
    NavigationView {
        FeedView()
            .environmentObject(AuthService.shared)
    }
}
