# Task: Event Invitations (via Event Code)

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes - code only |
| **Human tasks** | None |
| **Agent tasks** | Add event codes, share functionality, join-by-code flow |
| **Estimated complexity** | Medium |
| **Dependencies** | MVP complete |

## What Needs to Happen

### Agent Will Do (No Human Needed)
1. Add `inviteCode` field to Event model (generated on creation)
2. Add share button with iOS share sheet
3. Create "Join Event by Code" UI
4. Create `Invitation.swift` model for tracking responses
5. Update Event visibility logic to include invited users
6. (Optional) In-app invite via User Search

## Sharing Approach (MVP)
- Generate short alphanumeric code per event (e.g., `EVT-XK7M`)
- Share via iOS share sheet: "Join my event on Dispo! Code: EVT-XK7M"
- Recipient enters code in app → finds event → can RSVP

**Note:** Universal Links (proper `https://` deep links) are covered in task 11-production-deployment.md

## Implementation

### 1. Update Models/Event.swift - Add Invite Code
```swift
struct Event: Codable, Identifiable {
    // ... existing fields ...
    
    var inviteCode: String?       // e.g., "EVT-XK7M"
    var invitedUserIds: [String]? // Users who joined via code
    
    // Generate code on creation
    static func generateInviteCode() -> String {
        let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  // No O/0/I/1 for clarity
        let random = (0..<4).map { _ in chars.randomElement()! }
        return "EVT-\(String(random))"
    }
}
```

### 2. Create Models/Invitation.swift (for tracking)
```swift
import FirebaseFirestore

struct Invitation: Codable, Identifiable {
    @DocumentID var id: String?
    var eventId: String
    var eventTitle: String        // Denormalized for display
    var eventDate: Date           // Denormalized for display
    var inviterId: String
    var inviterName: String?      // Denormalized
    var inviteeId: String
    var status: InvitationStatus
    var joinedVia: String?        // "code", "search", "link"
    var createdAt: Date
    var respondedAt: Date?
    
    enum InvitationStatus: String, Codable {
        case pending = "pending"
        case accepted = "accepted"
        case declined = "declined"
    }
}
```

### 2. Create Services/InvitationService.swift
```swift
import FirebaseFirestore

class InvitationService {
    static let shared = InvitationService()
    private let db = Firestore.firestore()
    
    // Send invitation
    func inviteUser(userId: String, to event: Event, inviterName: String?) async throws {
        guard let eventId = event.id else { return }
        
        // Check if already invited
        let existing = try await db.collection("users").document(userId)
            .collection("invitations")
            .whereField("eventId", isEqualTo: eventId)
            .getDocuments()
        
        guard existing.documents.isEmpty else {
            throw InvitationError.alreadyInvited
        }
        
        let invitation = Invitation(
            eventId: eventId,
            eventTitle: event.title,
            eventDate: event.eventDate,
            inviterId: event.creatorId,
            inviterName: inviterName,
            inviteeId: userId,
            status: .pending,
            createdAt: Date(),
            respondedAt: nil
        )
        
        // Store under invitee's collection for easy querying
        try db.collection("users").document(userId)
            .collection("invitations")
            .addDocument(from: invitation)
        
        // Also add to event's invitedUserIds for visibility checks
        try await db.collection("events").document(eventId).updateData([
            "invitedUserIds": FieldValue.arrayUnion([userId])
        ])
    }
    
    // Get pending invitations for user
    func getPendingInvitations(for userId: String) async throws -> [Invitation] {
        let snapshot = try await db.collection("users").document(userId)
            .collection("invitations")
            .whereField("status", isEqualTo: "pending")
            .order(by: "createdAt", descending: true)
            .getDocuments()
        
        return snapshot.documents.compactMap { try? $0.data(as: Invitation.self) }
    }
    
    // Get all invitations for user
    func getInvitations(for userId: String) async throws -> [Invitation] {
        let snapshot = try await db.collection("users").document(userId)
            .collection("invitations")
            .order(by: "createdAt", descending: true)
            .getDocuments()
        
        return snapshot.documents.compactMap { try? $0.data(as: Invitation.self) }
    }
    
    // Respond to invitation
    func respond(to invitationId: String, userId: String, accept: Bool) async throws {
        let invitationRef = db.collection("users").document(userId)
            .collection("invitations").document(invitationId)
        
        let newStatus: Invitation.InvitationStatus = accept ? .accepted : .declined
        
        try await invitationRef.updateData([
            "status": newStatus.rawValue,
            "respondedAt": FieldValue.serverTimestamp()
        ])
        
        // If declined, optionally remove from event's invitedUserIds
        if !accept {
            let doc = try await invitationRef.getDocument()
            if let invitation = try? doc.data(as: Invitation.self) {
                try await db.collection("events").document(invitation.eventId).updateData([
                    "invitedUserIds": FieldValue.arrayRemove([userId])
                ])
            }
        }
    }
    
    // Get invited users for an event
    func getInvitedUsers(for eventId: String) async throws -> [String] {
        let doc = try await db.collection("events").document(eventId).getDocument()
        guard let event = try? doc.data(as: Event.self) else { return [] }
        return event.invitedUserIds ?? []
    }
    
    // Cancel/revoke invitation
    func revokeInvitation(userId: String, from eventId: String) async throws {
        // Find and delete the invitation
        let snapshot = try await db.collection("users").document(userId)
            .collection("invitations")
            .whereField("eventId", isEqualTo: eventId)
            .getDocuments()
        
        for doc in snapshot.documents {
            try await doc.reference.delete()
        }
        
        // Remove from event's invitedUserIds
        try await db.collection("events").document(eventId).updateData([
            "invitedUserIds": FieldValue.arrayRemove([userId])
        ])
    }
    
    enum InvitationError: Error, LocalizedError {
        case alreadyInvited
        
        var errorDescription: String? {
            switch self {
            case .alreadyInvited:
                return "User has already been invited to this event"
            }
        }
    }
}
```

### 3. Update Models/Event.swift
```swift
// Add field
var invitedUserIds: [String]?

// Update visibility check helper
func isVisibleTo(userId: String, userGroupIds: [String]) -> Bool {
    // Creator always sees their events
    if creatorId == userId { return true }
    
    // Check exclusion first
    if excludedUserIds?.contains(userId) ?? false { return false }
    
    switch visibility {
    case "public":
        return true
    case "group":
        guard let groupId = groupId else { return false }
        return userGroupIds.contains(groupId)
    case "private":
        // Private events visible to creator and invited users
        return invitedUserIds?.contains(userId) ?? false
    default:
        return false
    }
}
```

### 4. Create Views/InvitationsView.swift
```swift
import SwiftUI

struct InvitationsView: View {
    let currentUserId: String
    @State private var invitations: [Invitation] = []
    @State private var isLoading = true
    
    var pendingInvitations: [Invitation] {
        invitations.filter { $0.status == .pending }
    }
    
    var pastInvitations: [Invitation] {
        invitations.filter { $0.status != .pending }
    }
    
    var body: some View {
        List {
            if pendingInvitations.isEmpty && pastInvitations.isEmpty && !isLoading {
                Text("No invitations")
                    .foregroundColor(.secondary)
            }
            
            if !pendingInvitations.isEmpty {
                Section("Pending") {
                    ForEach(pendingInvitations) { invitation in
                        InvitationRow(invitation: invitation) { accept in
                            respond(to: invitation, accept: accept)
                        }
                    }
                }
            }
            
            if !pastInvitations.isEmpty {
                Section("Past") {
                    ForEach(pastInvitations) { invitation in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(invitation.eventTitle)
                                Text(invitation.inviterName ?? "Someone")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            Text(invitation.status.rawValue.capitalized)
                                .font(.caption)
                                .foregroundColor(invitation.status == .accepted ? .green : .red)
                        }
                    }
                }
            }
        }
        .navigationTitle("Invitations")
        .overlay {
            if isLoading {
                ProgressView()
            }
        }
        .task { await loadInvitations() }
    }
    
    private func loadInvitations() async {
        do {
            invitations = try await InvitationService.shared.getInvitations(for: currentUserId)
        } catch {
            print("Error loading invitations: \(error)")
        }
        isLoading = false
    }
    
    private func respond(to invitation: Invitation, accept: Bool) {
        guard let id = invitation.id else { return }
        Task {
            try? await InvitationService.shared.respond(to: id, userId: currentUserId, accept: accept)
            // Update local state
            if let index = invitations.firstIndex(where: { $0.id == id }) {
                await MainActor.run {
                    invitations[index].status = accept ? .accepted : .declined
                }
            }
        }
    }
}

struct InvitationRow: View {
    let invitation: Invitation
    let onRespond: (Bool) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(invitation.eventTitle)
                .font(.headline)
            
            HStack {
                if let inviter = invitation.inviterName {
                    Text("From \(inviter)")
                }
                Spacer()
                Text(invitation.eventDate, style: .date)
            }
            .font(.caption)
            .foregroundColor(.secondary)
            
            HStack(spacing: 12) {
                Button(action: { onRespond(true) }) {
                    Text("Accept")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                
                Button(action: { onRespond(false) }) {
                    Text("Decline")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(.vertical, 4)
    }
}
```

### 5. Add Share Button to EventDetailView
```swift
// Add state
@State private var showShareSheet = false

// Share button (for event creator)
if event.creatorId == currentUserId, let code = event.inviteCode {
    Section("Invite Friends") {
        HStack {
            Text("Event Code")
            Spacer()
            Text(code)
                .font(.system(.body, design: .monospaced))
                .foregroundColor(.secondary)
            Button(action: { copyCode(code) }) {
                Image(systemName: "doc.on.doc")
            }
        }
        
        Button(action: { showShareSheet = true }) {
            Label("Share Event", systemImage: "square.and.arrow.up")
        }
    }
}

.sheet(isPresented: $showShareSheet) {
    if let code = event.inviteCode {
        ShareSheet(items: [
            "Join my event on Dispo!\n\n\(event.title)\n\(event.eventDate.formatted(date: .abbreviated, time: .shortened))\n\nEvent code: \(code)"
        ])
    }
}

// ShareSheet helper
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
```

### 6. Create JoinEventView (or add to FeedView)
```swift
struct JoinEventView: View {
    @State private var code = ""
    @State private var isSearching = false
    @State private var foundEvent: Event?
    @State private var errorMessage: String?
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("Event Code (e.g., EVT-XK7M)", text: $code)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                    
                    Button(action: searchEvent) {
                        if isSearching {
                            ProgressView()
                        } else {
                            Text("Find Event")
                        }
                    }
                    .disabled(code.count < 4 || isSearching)
                }
                
                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
                
                if let event = foundEvent {
                    Section("Found Event") {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(event.title)
                                .font(.headline)
                            Text(event.eventDate.formatted())
                                .foregroundColor(.secondary)
                            if let desc = event.description {
                                Text(desc)
                                    .font(.subheadline)
                            }
                        }
                        
                        Button("Join Event") {
                            joinEvent(event)
                        }
                        .buttonStyle(.borderedProminent)
                    }
                }
            }
            .navigationTitle("Join Event")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
    
    private func searchEvent() {
        isSearching = true
        errorMessage = nil
        foundEvent = nil
        
        Task {
            do {
                if let event = try await EventsService.shared.findEvent(byCode: code.uppercased()) {
                    await MainActor.run { foundEvent = event }
                } else {
                    await MainActor.run { errorMessage = "No event found with that code" }
                }
            } catch {
                await MainActor.run { errorMessage = error.localizedDescription }
            }
            await MainActor.run { isSearching = false }
        }
    }
    
    private func joinEvent(_ event: Event) {
        // Add user to invitedUserIds and navigate to event
        Task {
            try? await EventsService.shared.joinEventByCode(event.id!, userId: currentUserId)
            await MainActor.run { dismiss() }
        }
    }
}
```

### 7. Add to EventsService
```swift
func findEvent(byCode code: String) async throws -> Event? {
    let snapshot = try await db.collection("events")
        .whereField("inviteCode", isEqualTo: code)
        .limit(to: 1)
        .getDocuments()
    
    return snapshot.documents.first.flatMap { try? $0.data(as: Event.self) }
}

func joinEventByCode(_ eventId: String, userId: String) async throws {
    try await db.collection("events").document(eventId).updateData([
        "invitedUserIds": FieldValue.arrayUnion([userId])
    ])
}
```

### 8. Add "Join Event" Button to FeedView
```swift
.toolbar {
    ToolbarItem(placement: .primaryAction) {
        Menu {
            Button(action: { showCreateEvent = true }) {
                Label("Create Event", systemImage: "plus")
            }
            Button(action: { showJoinEvent = true }) {
                Label("Join by Code", systemImage: "ticket")
            }
        } label: {
            Image(systemName: "plus")
        }
    }
}
```

### 9. Update CreateEventView
```swift
// Generate invite code on creation
let inviteCode = Event.generateInviteCode()
// Include in event data when saving
```

## Files to Create/Modify
- [ ] `Models/Event.swift` - Add inviteCode, invitedUserIds fields
- [ ] `Models/Invitation.swift` - Create new (optional, for tracking)
- [ ] `Services/EventsService.swift` - Add findEvent(byCode:), joinEventByCode()
- [ ] `Views/EventDetailView.swift` - Add share section
- [ ] `Views/JoinEventView.swift` - Create new
- [ ] `Views/FeedView.swift` - Add "Join by Code" menu option
- [ ] `Views/CreateEventView.swift` - Generate inviteCode on creation

## Acceptance Criteria
- [ ] Events get invite code on creation
- [ ] Creator can see and copy event code
- [ ] Share sheet sends formatted invite message
- [ ] "Join by Code" finds event and adds user
- [ ] Joined users can see event in feed
- [ ] Code search is case-insensitive

## Test Cases
1. Create event → has invite code
2. Copy code → on clipboard
3. Share → opens iOS share sheet with event details
4. Enter valid code → event found, can join
5. Enter invalid code → "No event found"
6. Join event → appears in feed
