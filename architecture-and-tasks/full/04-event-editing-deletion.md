# Task: Event Editing & Deletion

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes - code only |
| **Human tasks** | None |
| **Agent tasks** | Add edit view, delete function, update EventDetailView |
| **Estimated complexity** | Low |
| **Dependencies** | MVP complete |

## What Needs to Happen

### Agent Will Do (No Human Needed)
1. Create `EditEventView.swift` (reuse CreateEventView logic)
2. Add edit/delete methods to EventsService
3. Update EventDetailView with edit/delete buttons (only for creator)
4. Add confirmation dialog for deletion
5. Handle cascade delete of subcollections (comments, rsvps)

## Implementation

### 1. Add to Services/EventsService.swift
```swift
// MARK: - Update & Delete

func updateEvent(_ event: Event) async throws {
    guard let eventId = event.id else { 
        throw EventError.missingId 
    }
    try db.collection("events").document(eventId).setData(from: event, merge: true)
}

func deleteEvent(_ eventId: String) async throws {
    let eventRef = db.collection("events").document(eventId)
    
    // Delete comments subcollection
    let comments = try await eventRef.collection("comments").getDocuments()
    for doc in comments.documents {
        try await doc.reference.delete()
    }
    
    // Delete rsvps subcollection
    let rsvps = try await eventRef.collection("rsvps").getDocuments()
    for doc in rsvps.documents {
        try await doc.reference.delete()
    }
    
    // Delete event image from Storage if exists
    // (fetch event first to get imageUrl, then delete from Storage)
    let eventDoc = try await eventRef.getDocument()
    if let event = try? eventDoc.data(as: Event.self),
       let imageUrl = event.imageUrl,
       !imageUrl.isEmpty {
        try? await Storage.storage().reference(forURL: imageUrl).delete()
    }
    
    // Delete event document
    try await eventRef.delete()
}

enum EventError: Error {
    case missingId
}
```

### 2. Create Views/EditEventView.swift
```swift
import SwiftUI

struct EditEventView: View {
    @Environment(\.dismiss) private var dismiss
    @State var event: Event
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section("Details") {
                    TextField("Title", text: $event.title)
                    TextField("Description", text: Binding(
                        get: { event.description ?? "" },
                        set: { event.description = $0.isEmpty ? nil : $0 }
                    ), axis: .vertical)
                    .lineLimit(3...6)
                }
                
                Section("Date & Time") {
                    DatePicker("When", selection: $event.eventDate, 
                               in: Date()..., displayedComponents: [.date, .hourAndMinute])
                }
                
                // Note: Visibility/group changes could be complex
                // For MVP, might disable changing visibility after creation
                Section("Visibility") {
                    Text(event.visibility.capitalized)
                        .foregroundColor(.secondary)
                    if event.visibility == "group", let groupId = event.groupId {
                        Text("Group: \(groupId)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Edit Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { saveChanges() }
                        .disabled(event.title.isEmpty || isLoading)
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    private func saveChanges() {
        isLoading = true
        Task {
            do {
                try await EventsService.shared.updateEvent(event)
                await MainActor.run { dismiss() }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                    isLoading = false
                }
            }
        }
    }
}
```

### 3. Update EventDetailView
```swift
// Add state
@State private var showEditSheet = false
@State private var showDeleteConfirmation = false
@Environment(\.dismiss) private var dismiss

// Add toolbar (only show if user is creator)
.toolbar {
    if event.creatorId == currentUserId {
        ToolbarItem(placement: .primaryAction) {
            Menu {
                Button(action: { showEditSheet = true }) {
                    Label("Edit", systemImage: "pencil")
                }
                Button(role: .destructive, action: { showDeleteConfirmation = true }) {
                    Label("Delete", systemImage: "trash")
                }
            } label: {
                Image(systemName: "ellipsis.circle")
            }
        }
    }
}
.sheet(isPresented: $showEditSheet) {
    EditEventView(event: event)
}
.confirmationDialog("Delete Event?", isPresented: $showDeleteConfirmation, titleVisibility: .visible) {
    Button("Delete", role: .destructive) { deleteEvent() }
    Button("Cancel", role: .cancel) { }
} message: {
    Text("This will permanently delete the event and all comments. This cannot be undone.")
}

private func deleteEvent() {
    Task {
        do {
            try await EventsService.shared.deleteEvent(event.id!)
            await MainActor.run { dismiss() }
        } catch {
            // Show error
        }
    }
}
```

## Files to Create/Modify
- [ ] `Services/EventsService.swift` - Add update/delete methods
- [ ] `Views/EditEventView.swift` - Create new
- [ ] `Views/EventDetailView.swift` - Add edit/delete UI

## Acceptance Criteria
- [ ] Edit button only visible to event creator
- [ ] Can edit title, description, date
- [ ] Changes persist to Firestore
- [ ] Delete shows confirmation dialog
- [ ] Delete removes event, comments, RSVPs, and image
- [ ] After delete, navigates back to feed

## Test Cases
1. Edit event → changes appear in feed and detail
2. Delete event → removed from feed
3. Delete event with comments → comments also deleted
4. Non-creator → no edit/delete buttons shown
