# Task: Calendar Integration

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ⚠️ Partial - code yes, but needs Info.plist edit in Xcode |
| **Human tasks** | Add calendar permission strings to Info.plist via Xcode |
| **Agent tasks** | Create CalendarService, add UI buttons, integrate with events |
| **Estimated complexity** | Medium |
| **Dependencies** | MVP complete |

## What Needs to Happen

### Human Must Do (Seth)
1. Add to Info.plist via Xcode:
   - `NSCalendarsUsageDescription` = "Dispo needs calendar access to sync events and check your availability."
   - `NSCalendarsFullAccessUsageDescription` = "Dispo needs full calendar access to add events and check availability."

### Agent Can Do
1. Create `CalendarService.swift` using EventKit
2. Add "Add to Calendar" button on EventDetailView
3. Show availability conflicts when creating events (optional)
4. Handle permission request flow

## Implementation

### 1. Create Services/CalendarService.swift
```swift
import EventKit

class CalendarService: ObservableObject {
    private let eventStore = EKEventStore()
    @Published var hasAccess = false
    
    func requestAccess() async -> Bool {
        do {
            let granted = try await eventStore.requestFullAccessToEvents()
            await MainActor.run { hasAccess = granted }
            return granted
        } catch {
            print("Calendar access error: \(error)")
            return false
        }
    }
    
    func addToCalendar(event: Event) throws -> String {
        guard hasAccess else { throw CalendarError.noAccess }
        
        let ekEvent = EKEvent(eventStore: eventStore)
        ekEvent.title = event.title
        ekEvent.startDate = event.eventDate
        ekEvent.endDate = event.eventDate.addingTimeInterval(3600) // 1 hour default
        ekEvent.notes = event.description
        ekEvent.calendar = eventStore.defaultCalendarForNewEvents
        
        try eventStore.save(ekEvent, span: .thisEvent)
        return ekEvent.eventIdentifier
    }
    
    func checkAvailability(for date: Date) -> [EKEvent] {
        let start = Calendar.current.startOfDay(for: date)
        let end = Calendar.current.date(byAdding: .day, value: 1, to: start)!
        
        let predicate = eventStore.predicateForEvents(
            withStart: start,
            end: end,
            calendars: nil
        )
        return eventStore.events(matching: predicate)
    }
    
    enum CalendarError: Error {
        case noAccess
    }
}
```

### 2. Update EventDetailView
- Add "Add to Calendar" button
- Show success/failure feedback
- Track if already added (store ekEventIdentifier in UserDefaults or local state)

### 3. Optional: Availability in CreateEventView
- When selecting date, show existing calendar events
- Visual indicator of busy times

## Acceptance Criteria
- [ ] Calendar permission requested on first use
- [ ] "Add to Calendar" button on event detail
- [ ] Events successfully added to iOS Calendar
- [ ] Handles permission denied gracefully
- [ ] (Optional) Shows availability when creating events

## Notes
- EventKit requires iOS permission - can't test in Simulator without granting
- Google Calendar integration is separate (requires OAuth) - skip for now
- Consider storing calendar event ID to prevent duplicates
