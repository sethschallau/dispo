# Task: Calendar View

## Description
Add a calendar view as an alternative way to browse events organized by date.

## Prerequisites
- Task `05-feed-view` complete
- EventsService functioning

## Implementation

### Step 1: Add Calendar Tab
Update `Views/MainTabView.swift` to include calendar:

```swift
import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            FeedView()
                .tabItem {
                    Label("Feed", systemImage: "house.fill")
                }
                .tag(0)
            
            CalendarView()
                .tabItem {
                    Label("Calendar", systemImage: "calendar")
                }
                .tag(1)
            
            GroupsView()
                .tabItem {
                    Label("Groups", systemImage: "person.3.fill")
                }
                .tag(2)
            
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle.fill")
                }
                .tag(3)
        }
        .environmentObject(authService)
    }
}
```

### Step 2: Create CalendarView
Create `Views/Calendar/CalendarView.swift`:

```swift
import SwiftUI

struct CalendarView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var eventsService = EventsService()
    @StateObject private var groupsService = GroupsService()
    
    @State private var selectedDate = Date()
    @State private var displayedMonth = Date()
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Month Header
                monthHeader
                
                // Calendar Grid
                calendarGrid
                
                Divider()
                
                // Events for Selected Date
                eventsForSelectedDate
            }
            .navigationTitle("Calendar")
            .onAppear {
                loadData()
            }
        }
    }
    
    // MARK: - Month Header
    private var monthHeader: some View {
        HStack {
            Button(action: previousMonth) {
                Image(systemName: "chevron.left")
            }
            
            Spacer()
            
            Text(displayedMonth, format: .dateTime.month(.wide).year())
                .font(.headline)
            
            Spacer()
            
            Button(action: nextMonth) {
                Image(systemName: "chevron.right")
            }
        }
        .padding()
    }
    
    // MARK: - Calendar Grid
    private var calendarGrid: some View {
        let days = generateDaysInMonth()
        let columns = Array(repeating: GridItem(.flexible()), count: 7)
        
        return VStack {
            // Weekday Headers
            HStack {
                ForEach(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], id: \.self) { day in
                    Text(day)
                        .font(.caption)
                        .frame(maxWidth: .infinity)
                        .foregroundColor(.secondary)
                }
            }
            
            // Days Grid
            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(days, id: \.self) { date in
                    if let date = date {
                        DayCell(
                            date: date,
                            isSelected: Calendar.current.isDate(date, inSameDayAs: selectedDate),
                            hasEvents: hasEvents(on: date)
                        )
                        .onTapGesture {
                            selectedDate = date
                        }
                    } else {
                        Text("")
                            .frame(height: 40)
                    }
                }
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - Events List
    private var eventsForSelectedDate: some View {
        let dayEvents = events(for: selectedDate)
        
        return VStack(alignment: .leading, spacing: 8) {
            Text(selectedDate, format: .dateTime.weekday(.wide).month().day())
                .font(.headline)
                .padding(.horizontal)
                .padding(.top, 8)
            
            if dayEvents.isEmpty {
                Text("No events")
                    .foregroundColor(.secondary)
                    .padding()
                Spacer()
            } else {
                List(dayEvents) { event in
                    NavigationLink(destination: EventDetailView(event: event)) {
                        EventRowView(event: event)
                    }
                }
                .listStyle(.plain)
            }
        }
    }
    
    // MARK: - Helpers
    private func loadData() {
        guard let userId = authService.currentUserId else { return }
        groupsService.loadGroups(for: userId)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            let groupIds = groupsService.userGroups.compactMap { $0.id }
            eventsService.loadFeed(userId: userId, userGroups: groupIds)
        }
    }
    
    private func previousMonth() {
        displayedMonth = Calendar.current.date(byAdding: .month, value: -1, to: displayedMonth) ?? displayedMonth
    }
    
    private func nextMonth() {
        displayedMonth = Calendar.current.date(byAdding: .month, value: 1, to: displayedMonth) ?? displayedMonth
    }
    
    private func generateDaysInMonth() -> [Date?] {
        let calendar = Calendar.current
        
        guard let monthInterval = calendar.dateInterval(of: .month, for: displayedMonth),
              let firstWeekday = calendar.dateComponents([.weekday], from: monthInterval.start).weekday else {
            return []
        }
        
        var days: [Date?] = []
        
        // Add empty cells for days before month starts
        for _ in 1..<firstWeekday {
            days.append(nil)
        }
        
        // Add days in month
        var currentDate = monthInterval.start
        while currentDate < monthInterval.end {
            days.append(currentDate)
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate) ?? currentDate
        }
        
        return days
    }
    
    private func hasEvents(on date: Date) -> Bool {
        guard let userId = authService.currentUserId else { return false }
        return !eventsService.filterEvents(for: userId)
            .filter { Calendar.current.isDate($0.eventDate, inSameDayAs: date) }
            .isEmpty
    }
    
    private func events(for date: Date) -> [Event] {
        guard let userId = authService.currentUserId else { return [] }
        return eventsService.filterEvents(for: userId)
            .filter { Calendar.current.isDate($0.eventDate, inSameDayAs: date) }
            .sorted { $0.eventDate < $1.eventDate }
    }
}

struct DayCell: View {
    let date: Date
    let isSelected: Bool
    let hasEvents: Bool
    
    var body: some View {
        VStack(spacing: 2) {
            Text("\(Calendar.current.component(.day, from: date))")
                .font(.system(size: 16, weight: isSelected ? .bold : .regular))
                .foregroundColor(isSelected ? .white : isToday ? .blue : .primary)
            
            if hasEvents {
                Circle()
                    .fill(isSelected ? Color.white : Color.blue)
                    .frame(width: 6, height: 6)
            }
        }
        .frame(height: 40)
        .frame(maxWidth: .infinity)
        .background(
            Circle()
                .fill(isSelected ? Color.blue : Color.clear)
                .frame(width: 36, height: 36)
        )
    }
    
    private var isToday: Bool {
        Calendar.current.isDateInToday(date)
    }
}
```

## Acceptance Criteria
- [ ] Calendar tab appears in tab bar
- [ ] Month/year header displays current month
- [ ] Can navigate to previous/next months
- [ ] Days with events show indicator dot
- [ ] Tapping a day selects it
- [ ] Events for selected day shown below calendar
- [ ] Tapping event navigates to detail view

## Test Schema
1. Create events on different dates
2. Open Calendar tab
3. Navigate to months with events
4. Verify dots appear on dates with events
5. Tap date to see events listed
6. Tap event to view details

## Notes
- Simple custom calendar implementation
- Could use UICalendarView for more features (iOS 16+)
- Events filtered same as feed (respects visibility)
