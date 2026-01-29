# Task: Notifications View

## Description
Implement in-app notifications for new events and comments. Notifications are created when events are added to groups or comments are posted.

## Prerequisites
- Task `04-event-creation` complete
- Task `06-event-detail` complete

## Implementation

### Step 1: Create Notification Model
Create `Models/Notification.swift`:

```swift
import FirebaseFirestore

struct Notification: Codable, Identifiable {
    @DocumentID var id: String?
    var type: String
    var message: String
    var relatedId: String?
    var relatedType: String?
    @ServerTimestamp var timestamp: Timestamp?
    var read: Bool
    var fromUserId: String?
}

enum NotificationType: String {
    case newEvent = "new_event"
    case newComment = "new_comment"
    case groupInvite = "group_invite"
}
```

### Step 2: Create Notifications Service
Create `Services/NotificationsService.swift`:

```swift
import Foundation
import FirebaseFirestore

class NotificationsService: ObservableObject {
    @Published var notifications: [Notification] = []
    @Published var unreadCount: Int = 0
    @Published var isLoading = false
    
    private let db = Firestore.firestore()
    private var listener: ListenerRegistration?
    
    func loadNotifications(for userId: String) {
        isLoading = true
        
        listener?.remove()
        listener = db.collection("users")
            .document(userId)
            .collection("notifications")
            .order(by: "timestamp", descending: true)
            .limit(to: 50)
            .addSnapshotListener { [weak self] snapshot, error in
                self?.isLoading = false
                
                guard let documents = snapshot?.documents else { return }
                
                self?.notifications = documents.compactMap { doc in
                    try? doc.data(as: Notification.self)
                }
                
                self?.unreadCount = self?.notifications.filter { !$0.read }.count ?? 0
            }
    }
    
    func markAsRead(_ notification: Notification, userId: String) async throws {
        guard let notifId = notification.id else { return }
        
        try await db.collection("users")
            .document(userId)
            .collection("notifications")
            .document(notifId)
            .updateData(["read": true])
    }
    
    func markAllAsRead(userId: String) async throws {
        let unread = notifications.filter { !$0.read }
        let batch = db.batch()
        
        for notification in unread {
            guard let notifId = notification.id else { continue }
            let ref = db.collection("users")
                .document(userId)
                .collection("notifications")
                .document(notifId)
            batch.updateData(["read": true], forDocument: ref)
        }
        
        try await batch.commit()
    }
    
    // Called when creating an event to notify group members
    static func notifyGroupMembers(
        event: Event,
        group: Group,
        creatorName: String,
        db: Firestore = Firestore.firestore()
    ) async throws {
        guard let eventId = event.id else { return }
        
        let batch = db.batch()
        
        for memberId in group.members where memberId != event.creatorId {
            let notifRef = db.collection("users")
                .document(memberId)
                .collection("notifications")
                .document()
            
            batch.setData([
                "type": NotificationType.newEvent.rawValue,
                "message": "\(creatorName) created '\(event.title)' in \(group.name)",
                "relatedId": eventId,
                "relatedType": "event",
                "timestamp": FieldValue.serverTimestamp(),
                "read": false,
                "fromUserId": event.creatorId
            ], forDocument: notifRef)
        }
        
        try await batch.commit()
    }
    
    // Called when posting a comment to notify event creator
    static func notifyEventCreator(
        event: Event,
        comment: Comment,
        commenterName: String,
        db: Firestore = Firestore.firestore()
    ) async throws {
        guard let eventId = event.id,
              comment.authorId != event.creatorId else { return }
        
        try await db.collection("users")
            .document(event.creatorId)
            .collection("notifications")
            .addDocument(data: [
                "type": NotificationType.newComment.rawValue,
                "message": "\(commenterName) commented on '\(event.title)'",
                "relatedId": eventId,
                "relatedType": "event",
                "timestamp": FieldValue.serverTimestamp(),
                "read": false,
                "fromUserId": comment.authorId
            ])
    }
    
    deinit {
        listener?.remove()
    }
}
```

### Step 3: Create NotificationsView
Create `Views/Notifications/NotificationsView.swift`:

```swift
import SwiftUI

struct NotificationsView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var notificationsService = NotificationsService()
    
    var body: some View {
        NavigationView {
            Group {
                if notificationsService.isLoading {
                    ProgressView()
                } else if notificationsService.notifications.isEmpty {
                    emptyState
                } else {
                    notificationsList
                }
            }
            .navigationTitle("Notifications")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    if notificationsService.unreadCount > 0 {
                        Button("Mark All Read") {
                            markAllRead()
                        }
                    }
                }
            }
            .onAppear {
                if let userId = authService.currentUserId {
                    notificationsService.loadNotifications(for: userId)
                }
            }
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "bell.slash")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            Text("No notifications")
                .font(.headline)
            Text("You'll see updates here when things happen")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
    
    private var notificationsList: some View {
        List {
            ForEach(notificationsService.notifications) { notification in
                NotificationRowView(notification: notification)
                    .onTapGesture {
                        handleTap(notification)
                    }
            }
        }
        .listStyle(.plain)
    }
    
    private func handleTap(_ notification: Notification) {
        guard let userId = authService.currentUserId else { return }
        
        // Mark as read
        Task {
            try? await notificationsService.markAsRead(notification, userId: userId)
        }
        
        // TODO: Navigate to related item
        // This would require a navigation coordinator or similar pattern
    }
    
    private func markAllRead() {
        guard let userId = authService.currentUserId else { return }
        Task {
            try? await notificationsService.markAllAsRead(userId: userId)
        }
    }
}

struct NotificationRowView: View {
    let notification: Notification
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Icon
            Image(systemName: iconName)
                .font(.title3)
                .foregroundColor(iconColor)
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(notification.message)
                    .font(.subheadline)
                    .fontWeight(notification.read ? .regular : .semibold)
                
                if let timestamp = notification.timestamp?.dateValue() {
                    Text(timestamp, style: .relative)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            if !notification.read {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 4)
        .opacity(notification.read ? 0.7 : 1.0)
    }
    
    private var iconName: String {
        switch notification.type {
        case "new_event": return "calendar.badge.plus"
        case "new_comment": return "bubble.left"
        case "group_invite": return "person.badge.plus"
        default: return "bell"
        }
    }
    
    private var iconColor: Color {
        switch notification.type {
        case "new_event": return .blue
        case "new_comment": return .green
        case "group_invite": return .orange
        default: return .gray
        }
    }
}
```

### Step 4: Update EventsService to Send Notifications
In `Services/EventsService.swift`, update `createEvent`:

```swift
func createEvent(_ event: Event, image: Data? = nil, group: Group? = nil, creatorName: String? = nil) async throws -> String {
    let eventRef = db.collection("events").document()
    var eventData = event
    
    if let imageData = image {
        let imageUrl = try await uploadImage(eventId: eventRef.documentID, data: imageData)
        eventData.imageUrl = imageUrl
    }
    
    try eventRef.setData(from: eventData)
    
    // Send notifications to group members
    if let group = group, let creatorName = creatorName, event.visibility == "group" {
        var eventWithId = eventData
        eventWithId.id = eventRef.documentID
        try await NotificationsService.notifyGroupMembers(
            event: eventWithId,
            group: group,
            creatorName: creatorName
        )
    }
    
    return eventRef.documentID
}
```

### Step 5: Add Badge to Tab
Update `MainTabView.swift` to show notification badge:

```swift
// Add to MainTabView
@StateObject private var notificationsService = NotificationsService()

// In TabView, update notifications tab item:
NotificationsView()
    .tabItem {
        Label("Alerts", systemImage: "bell.fill")
    }
    .badge(notificationsService.unreadCount)
    .tag(4)

// In .onAppear:
if let userId = authService.currentUserId {
    notificationsService.loadNotifications(for: userId)
}
```

## Acceptance Criteria
- [ ] Notifications tab shows in tab bar (5th tab or accessible from profile)
- [ ] Badge shows unread count
- [ ] List shows notifications with type icon
- [ ] Unread notifications appear bold with blue dot
- [ ] Mark all read button clears unread count
- [ ] Creating group event sends notification to members
- [ ] Posting comment sends notification to event creator

## Test Schema
1. Create group event with User A
2. Check User B's notifications for "new_event"
3. Post comment as User B
4. Check User A's notifications for "new_comment"
5. Mark notifications as read
6. Verify read state persists

## Notes
- Push notifications not in MVP (in-app only)
- Navigation to related item can be added as enhancement
- Notifications create Firestore documents (cost consideration for production)
