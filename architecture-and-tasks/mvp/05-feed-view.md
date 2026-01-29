# Task: Feed View

## Description
Implement the main feed displaying events visible to the current user (public events + events from their groups). Tapping an event navigates to detail view.

## Prerequisites
- Task `04-event-creation` complete
- EventsService exists

## Implementation

### Step 1: Create EventRowView
Create `Views/Events/EventRowView.swift`:

```swift
import SwiftUI

struct EventRowView: View {
    let event: Event
    
    private var dateFormatter: DateFormatter {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        return f
    }
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Date Badge
            VStack {
                Text(event.eventDate, format: .dateTime.month(.abbreviated))
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(event.eventDate, format: .dateTime.day())
                    .font(.title2)
                    .fontWeight(.bold)
            }
            .frame(width: 50)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.headline)
                
                if let location = event.location, !location.isEmpty {
                    Label(location, systemImage: "mappin")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Text(event.eventDate, format: .dateTime.hour().minute())
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    // Visibility Badge
                    Text(event.visibility.capitalized)
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(visibilityColor.opacity(0.2))
                        .foregroundColor(visibilityColor)
                        .cornerRadius(4)
                }
            }
            
            Spacer()
            
            // Thumbnail if image exists
            if let imageUrl = event.imageUrl, let url = URL(string: imageUrl) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    Color.gray.opacity(0.2)
                }
                .frame(width: 50, height: 50)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding(.vertical, 8)
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
```

### Step 2: Update FeedView
Replace `Views/Feed/FeedView.swift`:

```swift
import SwiftUI

struct FeedView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var eventsService = EventsService()
    @StateObject private var groupsService = GroupsService()
    
    @State private var showCreateEvent = false
    
    var body: some View {
        NavigationView {
            Group {
                if eventsService.isLoading && eventsService.events.isEmpty {
                    ProgressView("Loading events...")
                } else if filteredEvents.isEmpty {
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
                loadData()
            }
        }
    }
    
    private var filteredEvents: [Event] {
        guard let userId = authService.currentUserId else { return [] }
        return eventsService.filterEvents(for: userId)
    }
    
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
            Button("Create Event") {
                showCreateEvent = true
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
    
    private var eventsList: some View {
        List {
            ForEach(filteredEvents) { event in
                NavigationLink(destination: EventDetailView(event: event)) {
                    EventRowView(event: event)
                }
            }
        }
        .listStyle(.plain)
    }
    
    private func loadData() {
        guard let userId = authService.currentUserId else { return }
        
        // Load groups first, then events
        groupsService.loadGroups(for: userId)
        
        // Wait a bit for groups to load, then load events
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            let groupIds = groupsService.userGroups.compactMap { $0.id }
            eventsService.loadFeed(userId: userId, userGroups: groupIds)
        }
    }
}
```

### Step 3: Create EventDetailView Placeholder
Create `Views/Events/EventDetailView.swift`:

```swift
import SwiftUI

struct EventDetailView: View {
    let event: Event
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Header Image
                if let imageUrl = event.imageUrl, let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        Color.gray.opacity(0.2)
                    }
                    .frame(height: 200)
                    .clipped()
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    // Title
                    Text(event.title)
                        .font(.title)
                        .fontWeight(.bold)
                    
                    // Date & Time
                    Label {
                        Text(event.eventDate, format: .dateTime.weekday().month().day().hour().minute())
                    } icon: {
                        Image(systemName: "calendar")
                    }
                    .foregroundColor(.secondary)
                    
                    // Location
                    if let location = event.location, !location.isEmpty {
                        Label(location, systemImage: "mappin.circle")
                            .foregroundColor(.secondary)
                    }
                    
                    // Description
                    if let description = event.description, !description.isEmpty {
                        Divider()
                        Text(description)
                            .foregroundColor(.secondary)
                    }
                    
                    Divider()
                    
                    // Comments placeholder
                    Text("Comments")
                        .font(.headline)
                    Text("Coming in task 06")
                        .foregroundColor(.secondary)
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}
```

## Acceptance Criteria
- [ ] Feed loads and displays events visible to user
- [ ] Public events appear for all users
- [ ] Group events appear only for group members
- [ ] Private events appear only for creator
- [ ] Excluded users don't see events with their ID in excludedUserIds
- [ ] Events sorted by date
- [ ] Pull-to-refresh works
- [ ] Empty state shows when no events
- [ ] Tapping event navigates to detail view
- [ ] Real-time updates when new events created

## Test Schema
1. Create public event with User A
2. Create group event in shared group
3. Create private event with User A
4. Log in as User B (same group)
5. Verify: sees public event ✓, sees group event ✓, doesn't see private ✗

## Notes
- Multiple Firestore listeners are used (one per query type)
- Events deduplicated client-side to handle overlaps
- AsyncImage used for loading event images
