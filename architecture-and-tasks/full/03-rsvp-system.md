# Task: RSVP System

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes - code only |
| **Human tasks** | None |
| **Agent tasks** | Create RSVP model, service, update EventDetailView |
| **Estimated complexity** | Low-Medium |
| **Dependencies** | MVP complete |

## What Needs to Happen

### Agent Will Do (No Human Needed)
1. Create `RSVP.swift` model
2. Create `RSVPService.swift` or add to EventsService
3. Update `EventDetailView` with RSVP buttons
4. Show attendee count on events
5. Update `EventRowView` to show RSVP status indicator
6. (Optional) Add "Going" filter to FeedView

## Implementation

### 1. Create Models/RSVP.swift
```swift
import FirebaseFirestore

struct RSVP: Codable, Identifiable {
    @DocumentID var id: String?
    var userId: String
    var status: RSVPStatus
    var timestamp: Date
    
    enum RSVPStatus: String, Codable, CaseIterable {
        case going = "going"
        case maybe = "maybe"
        case declined = "declined"
        
        var icon: String {
            switch self {
            case .going: return "checkmark.circle.fill"
            case .maybe: return "questionmark.circle.fill"
            case .declined: return "xmark.circle.fill"
            }
        }
        
        var color: String {
            switch self {
            case .going: return "green"
            case .maybe: return "orange"
            case .declined: return "red"
            }
        }
    }
}
```

### 2. Add to Services/EventsService.swift
```swift
// MARK: - RSVPs

func setRSVP(eventId: String, userId: String, status: RSVP.RSVPStatus) async throws {
    let rsvp = RSVP(userId: userId, status: status, timestamp: Date())
    try db.collection("events").document(eventId)
        .collection("rsvps").document(userId)
        .setData(from: rsvp)
}

func removeRSVP(eventId: String, userId: String) async throws {
    try await db.collection("events").document(eventId)
        .collection("rsvps").document(userId)
        .delete()
}

func getRSVPs(eventId: String) async throws -> [RSVP] {
    let snapshot = try await db.collection("events").document(eventId)
        .collection("rsvps").getDocuments()
    return snapshot.documents.compactMap { try? $0.data(as: RSVP.self) }
}

func getMyRSVP(eventId: String, userId: String) async throws -> RSVP? {
    let doc = try await db.collection("events").document(eventId)
        .collection("rsvps").document(userId).getDocument()
    return try? doc.data(as: RSVP.self)
}

func listenToRSVPs(eventId: String, completion: @escaping ([RSVP]) -> Void) -> ListenerRegistration {
    return db.collection("events").document(eventId)
        .collection("rsvps")
        .addSnapshotListener { snapshot, error in
            guard let documents = snapshot?.documents else { return }
            let rsvps = documents.compactMap { try? $0.data(as: RSVP.self) }
            completion(rsvps)
        }
}
```

### 3. Update EventDetailView
```swift
// Add state
@State private var rsvps: [RSVP] = []
@State private var myRSVP: RSVP?
@State private var rsvpListener: ListenerRegistration?

// Add RSVP section to view
var rsvpSection: some View {
    VStack(spacing: 12) {
        // RSVP buttons
        HStack(spacing: 16) {
            ForEach(RSVP.RSVPStatus.allCases, id: \.self) { status in
                Button(action: { setRSVP(status) }) {
                    VStack {
                        Image(systemName: status.icon)
                            .font(.title2)
                        Text(status.rawValue.capitalized)
                            .font(.caption)
                    }
                    .foregroundColor(myRSVP?.status == status ? .white : .primary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(myRSVP?.status == status ? statusColor(status) : Color.gray.opacity(0.2))
                    .cornerRadius(8)
                }
            }
        }
        
        // Attendee counts
        HStack {
            let going = rsvps.filter { $0.status == .going }.count
            let maybe = rsvps.filter { $0.status == .maybe }.count
            Text("\(going) going")
            if maybe > 0 {
                Text("• \(maybe) maybe")
                    .foregroundColor(.secondary)
            }
        }
        .font(.subheadline)
    }
}

func setRSVP(_ status: RSVP.RSVPStatus) {
    Task {
        if myRSVP?.status == status {
            try? await EventsService.shared.removeRSVP(eventId: event.id!, userId: currentUserId)
        } else {
            try? await EventsService.shared.setRSVP(eventId: event.id!, userId: currentUserId, status: status)
        }
    }
}
```

### 4. Update EventRowView
Add small indicator showing user's RSVP status or attendee count.

## Files to Create/Modify
- [ ] `Models/RSVP.swift` - Create new
- [ ] `Services/EventsService.swift` - Add RSVP methods
- [ ] `Views/EventDetailView.swift` - Add RSVP UI
- [ ] `Views/EventRowView.swift` - Add status indicator

## Acceptance Criteria
- [ ] Can RSVP as going/maybe/declined
- [ ] Can change or remove RSVP
- [ ] RSVP persists in Firestore subcollection
- [ ] Real-time update of attendee counts
- [ ] Visual indicator of current user's RSVP status
- [ ] Event row shows attendee count or user's status

## Test Cases
1. RSVP to event → appears in Firestore
2. Change RSVP → updates in Firestore
3. Tap same RSVP again → removes it
4. Other user RSVPs → count updates in real-time
