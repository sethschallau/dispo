# Task: Event Reminders (Local Notifications)

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes - code only (permission request is runtime) |
| **Human tasks** | None |
| **Agent tasks** | Add local notification scheduling, reminder toggle UI |
| **Estimated complexity** | Low |
| **Dependencies** | MVP complete |

## What Needs to Happen

### Agent Will Do (No Human Needed)
1. Create `NotificationManager.swift` for local notifications
2. Add reminder toggle to EventDetailView
3. Schedule notification when user RSVPs or enables reminder
4. Cancel notification if user un-RSVPs or event is deleted
5. Store reminder state locally (UserDefaults) or in Firestore

## Implementation

### 1. Create Services/NotificationManager.swift
```swift
import UserNotifications

class NotificationManager {
    static let shared = NotificationManager()
    
    func requestPermission() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .badge, .sound])
        } catch {
            print("Notification permission error: \(error)")
            return false
        }
    }
    
    func scheduleEventReminder(for event: Event, minutesBefore: Int = 60) async throws {
        guard let eventId = event.id else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "Upcoming Event"
        content.body = event.title
        content.sound = .default
        content.userInfo = ["eventId": eventId]
        
        let triggerDate = event.eventDate.addingTimeInterval(-Double(minutesBefore * 60))
        
        // Don't schedule if trigger is in the past
        guard triggerDate > Date() else { return }
        
        let components = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: triggerDate
        )
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        
        let request = UNNotificationRequest(
            identifier: "event-reminder-\(eventId)",
            content: content,
            trigger: trigger
        )
        
        try await UNUserNotificationCenter.current().add(request)
    }
    
    func cancelEventReminder(eventId: String) {
        UNUserNotificationCenter.current()
            .removePendingNotificationRequests(withIdentifiers: ["event-reminder-\(eventId)"])
    }
    
    func isReminderScheduled(eventId: String) async -> Bool {
        let requests = await UNUserNotificationCenter.current().pendingNotificationRequests()
        return requests.contains { $0.identifier == "event-reminder-\(eventId)" }
    }
}
```

### 2. Update EventDetailView
```swift
// Add state
@State private var reminderEnabled = false
@State private var checkingReminder = true

// Add reminder toggle in view
var reminderSection: some View {
    Section {
        Toggle(isOn: $reminderEnabled) {
            Label("Remind me 1 hour before", systemImage: "bell")
        }
        .disabled(checkingReminder)
        .onChange(of: reminderEnabled) { _, newValue in
            Task {
                if newValue {
                    let granted = await NotificationManager.shared.requestPermission()
                    if granted {
                        try? await NotificationManager.shared.scheduleEventReminder(for: event)
                    } else {
                        await MainActor.run { reminderEnabled = false }
                    }
                } else {
                    NotificationManager.shared.cancelEventReminder(eventId: event.id!)
                }
            }
        }
    }
}

// Check existing reminder on appear
.task {
    if let eventId = event.id {
        reminderEnabled = await NotificationManager.shared.isReminderScheduled(eventId: eventId)
    }
    checkingReminder = false
}
```

### 3. Auto-Schedule on RSVP (Optional Enhancement)
```swift
// In setRSVP function:
func setRSVP(_ status: RSVP.RSVPStatus) {
    Task {
        if myRSVP?.status == status {
            try? await EventsService.shared.removeRSVP(eventId: event.id!, userId: currentUserId)
            NotificationManager.shared.cancelEventReminder(eventId: event.id!)
            reminderEnabled = false
        } else {
            try? await EventsService.shared.setRSVP(eventId: event.id!, userId: currentUserId, status: status)
            // Auto-enable reminder when marking as "going"
            if status == .going {
                let granted = await NotificationManager.shared.requestPermission()
                if granted {
                    try? await NotificationManager.shared.scheduleEventReminder(for: event)
                    reminderEnabled = true
                }
            }
        }
    }
}
```

### 4. Clean Up on Event Deletion
```swift
// In EventsService.deleteEvent:
func deleteEvent(_ eventId: String) async throws {
    // ... existing deletion code ...
    
    // Cancel any scheduled reminders
    NotificationManager.shared.cancelEventReminder(eventId: eventId)
}
```

## Files to Create/Modify
- [ ] `Services/NotificationManager.swift` - Create new
- [ ] `Views/EventDetailView.swift` - Add reminder toggle
- [ ] `Services/EventsService.swift` - Cancel reminder on delete

## Acceptance Criteria
- [ ] Permission requested on first reminder enable
- [ ] Can toggle reminder on/off for any event
- [ ] Notification fires 1 hour before event
- [ ] Reminder state persists (checked via pending notifications)
- [ ] Deleting event cancels its reminder
- [ ] (Optional) Auto-reminder when RSVPing as "going"

## Test Cases
1. Enable reminder → notification scheduled
2. Disable reminder → notification cancelled
3. Delete event → notification cancelled
4. Event in past → no notification scheduled
5. Deny permission → toggle resets to off
