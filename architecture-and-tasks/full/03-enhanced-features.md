# Task: Enhanced Features (Post-MVP)

## Description
Additional features to enhance the app after core functionality is stable.

## Features List

### 1. RSVP System
Allow users to respond to events (Going, Maybe, Can't Go).

```swift
struct RSVP: Codable {
    var userId: String
    var status: String  // "going", "maybe", "declined"
    var timestamp: Date
}

// Store at: events/{eventId}/rsvps/{userId}
```

UI additions:
- RSVP buttons on event detail
- Attendee count/list on event
- "Going" events filter in feed/calendar

### 2. Event Reminders
Schedule local notifications for upcoming events.

```swift
func scheduleReminder(for event: Event) {
    let content = UNMutableNotificationContent()
    content.title = "Upcoming Event"
    content.body = event.title
    
    let trigger = UNCalendarNotificationTrigger(
        dateMatching: Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: event.eventDate.addingTimeInterval(-3600) // 1 hour before
        ),
        repeats: false
    )
    
    let request = UNNotificationRequest(
        identifier: event.id!,
        content: content,
        trigger: trigger
    )
    
    UNUserNotificationCenter.current().add(request)
}
```

### 3. Photo Sharing (Post-Event)
Allow attendees to upload photos after an event.

```swift
// New subcollection: events/{eventId}/photos/{photoId}
struct EventPhoto: Codable {
    var uploaderId: String
    var imageUrl: String
    var caption: String?
    var timestamp: Date
}
```

### 4. Event Editing
Allow event creators to edit event details after creation.

```swift
func updateEvent(_ event: Event) async throws {
    guard let eventId = event.id else { return }
    try db.collection("events").document(eventId).setData(from: event, merge: true)
}
```

### 5. Event Deletion
Allow event creators to delete events (with confirmation).

```swift
func deleteEvent(_ eventId: String) async throws {
    // Delete subcollections first
    let commentsSnapshot = try await db.collection("events").document(eventId)
        .collection("comments").getDocuments()
    for doc in commentsSnapshot.documents {
        try await doc.reference.delete()
    }
    
    // Delete event
    try await db.collection("events").document(eventId).delete()
}
```

### 6. Group Admin Features
- Remove members
- Transfer ownership
- Delete group

### 7. User Search
Find users by username/phone to add to groups.

```swift
func searchUsers(query: String) async throws -> [User] {
    let snapshot = try await db.collection("users")
        .whereField("username", isGreaterThanOrEqualTo: query.lowercased())
        .whereField("username", isLessThan: query.lowercased() + "\u{f8ff}")
        .limit(to: 10)
        .getDocuments()
    
    return snapshot.documents.compactMap { try? $0.data(as: User.self) }
}
```

### 8. Event Invitations
Directly invite users to events (beyond group membership).

```swift
struct Invitation: Codable {
    var eventId: String
    var inviterId: String
    var inviteeId: String
    var status: String  // "pending", "accepted", "declined"
    var timestamp: Date
}

// Store at: users/{userId}/invitations/{invitationId}
```

### 9. Location Integration
Add map view for event locations using MapKit.

```swift
import MapKit

struct EventMapView: View {
    let coordinate: CLLocationCoordinate2D
    
    var body: some View {
        Map(initialPosition: .region(MKCoordinateRegion(
            center: coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        )))
        .frame(height: 200)
    }
}
```

### 10. Dark Mode Support
Ensure all views work well in both light and dark modes.

### 11. Accessibility
- VoiceOver support
- Dynamic Type support
- Sufficient color contrast

### 12. Offline Support
Firestore offline persistence is enabled by default, but:
- Show offline indicator
- Queue writes for sync
- Handle conflicts

## Priority Order
1. RSVP System (high user value)
2. Event Editing/Deletion (core functionality)
3. Event Reminders (engagement)
4. User Search (growth)
5. Photo Sharing (engagement)
6. Location Integration (UX)
7. Everything else

## Notes
- Implement features incrementally
- Test thoroughly before each release
- Gather user feedback to prioritize
