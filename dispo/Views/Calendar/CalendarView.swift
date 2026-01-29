//
//  CalendarView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI
import Combine

struct CalendarView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var eventsService = EventsService()
    @StateObject private var groupsService = GroupsService()
    
    @State private var selectedDate = Date()
    @State private var hasLoaded = false
    
    private let calendar = Calendar.current
    
    var body: some View {
        VStack(spacing: 0) {
            // Calendar Picker
            DatePicker(
                "Select Date",
                selection: $selectedDate,
                displayedComponents: [.date]
            )
            .datePickerStyle(.graphical)
            .padding(.horizontal)
            
            Divider()
            
            // Events for selected date
            eventsForSelectedDate
        }
        .navigationTitle("Calendar")
        .onAppear {
            loadData()
        }
    }
    
    private var eventsForSelectedDate: some View {
        let dayEvents = eventsService.events.filter { event in
            calendar.isDate(event.eventDate, inSameDayAs: selectedDate)
        }
        
        return Group {
            if dayEvents.isEmpty {
                VStack(spacing: 12) {
                    Spacer()
                    Image(systemName: "calendar.badge.minus")
                        .font(.system(size: 40))
                        .foregroundColor(.secondary)
                    Text("No events on this day")
                        .foregroundColor(.secondary)
                    Spacer()
                }
            } else {
                List {
                    ForEach(dayEvents) { event in
                        NavigationLink(destination: EventDetailView(event: event)) {
                            CalendarEventRow(event: event)
                        }
                    }
                }
                .listStyle(.plain)
            }
        }
    }
    
    private func loadData() {
        guard let userId = authService.currentUserId, !hasLoaded else { return }
        hasLoaded = true
        
        groupsService.loadGroups(for: userId)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            let groupIds = groupsService.userGroupIds
            eventsService.loadFeed(userId: userId, userGroups: groupIds)
        }
    }
}

struct CalendarEventRow: View {
    let event: Event
    
    var body: some View {
        HStack(spacing: 12) {
            // Time
            VStack(alignment: .trailing, spacing: 2) {
                Text(event.eventDate, format: .dateTime.hour().minute())
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            .frame(width: 60)
            
            // Color bar
            Rectangle()
                .fill(visibilityColor)
                .frame(width: 4)
                .cornerRadius(2)
            
            // Event info
            VStack(alignment: .leading, spacing: 2) {
                Text(event.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if let location = event.location, !location.isEmpty {
                    Text(location)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
    
    private var visibilityColor: Color {
        switch event.visibility {
        case "public": return .green
        case "group": return .blue
        case "private": return .orange
        default: return .gray
        }
    }
}

#Preview {
    NavigationView {
        CalendarView()
            .environmentObject(AuthService.shared)
    }
}
