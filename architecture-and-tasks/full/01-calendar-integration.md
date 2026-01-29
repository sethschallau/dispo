# Task: Calendar Integration (Post-MVP)

## Description
Integrate with device calendar (EventKit) and optionally Google Calendar to sync events.

## Prerequisites
- MVP complete
- Real authentication implemented

## Features

### Device Calendar (EventKit)
1. Add events to iOS Calendar
2. Check availability against calendar
3. Request calendar permissions

### Google Calendar API
1. OAuth authentication
2. Fetch user's calendar events
3. Create events in Google Calendar
4. Show availability from Google Calendar

## Implementation Overview

### 1. EventKit Integration
```swift
import EventKit

class CalendarService {
    let eventStore = EKEventStore()
    
    func requestAccess() async -> Bool {
        do {
            return try await eventStore.requestFullAccessToEvents()
        } catch {
            return false
        }
    }
    
    func addToCalendar(event: Event) throws {
        let ekEvent = EKEvent(eventStore: eventStore)
        ekEvent.title = event.title
        ekEvent.startDate = event.eventDate
        ekEvent.endDate = event.eventDate.addingTimeInterval(3600) // 1 hour
        ekEvent.notes = event.description
        ekEvent.calendar = eventStore.defaultCalendarForNewEvents
        
        try eventStore.save(ekEvent, span: .thisEvent)
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
}
```

### 2. Info.plist Entries
```xml
<key>NSCalendarsUsageDescription</key>
<string>Dispo needs calendar access to sync events and check your availability.</string>
<key>NSCalendarsFullAccessUsageDescription</key>
<string>Dispo needs full calendar access to add events and check availability.</string>
```

### 3. Google Calendar API
- Set up OAuth 2.0 credentials
- Use Google Sign-In SDK
- Make API calls to Google Calendar API

## Acceptance Criteria
- [ ] Request and handle calendar permissions
- [ ] "Add to Calendar" button on event detail
- [ ] Events added to device calendar
- [ ] Availability shown when creating events
- [ ] (Optional) Google Calendar sync works

## Notes
- EventKit requires iOS permission request
- Google Calendar requires separate OAuth flow
- Consider showing busy times without revealing event details
