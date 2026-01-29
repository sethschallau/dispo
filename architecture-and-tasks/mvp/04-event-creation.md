# Task: Event Creation

## Description
Implement the event creation form allowing users to create public or group events with title, description, date/time, location, and optional image.

## Prerequisites
- Task `03-group-management` complete
- User can view their groups

## Implementation

### Step 1: Create Event Model
Create `Models/Event.swift`:

```swift
import FirebaseFirestore

struct Event: Codable, Identifiable {
    @DocumentID var id: String?
    var title: String
    var description: String?
    var eventDate: Date
    var creatorId: String
    @ServerTimestamp var createdAt: Timestamp?
    var groupId: String?
    var visibility: String  // "public", "group", "private"
    var location: String?
    var imageUrl: String?
    var excludedUserIds: [String]?
}

enum EventVisibility: String, CaseIterable {
    case `public` = "public"
    case group = "group"
    case `private` = "private"
    
    var displayName: String {
        switch self {
        case .public: return "Public"
        case .group: return "Group Only"
        case .private: return "Private"
        }
    }
}
```

### Step 2: Create Events Service
Create `Services/EventsService.swift`:

```swift
import Foundation
import FirebaseFirestore
import FirebaseStorage

class EventsService: ObservableObject {
    @Published var events: [Event] = []
    @Published var isLoading = false
    
    private let db = Firestore.firestore()
    private let storage = Storage.storage()
    private var listeners: [ListenerRegistration] = []
    
    func createEvent(_ event: Event, image: Data? = nil) async throws -> String {
        let eventRef = db.collection("events").document()
        var eventData = event
        
        // Upload image if provided
        if let imageData = image {
            let imageUrl = try await uploadImage(eventId: eventRef.documentID, data: imageData)
            eventData.imageUrl = imageUrl
        }
        
        try eventRef.setData(from: eventData)
        return eventRef.documentID
    }
    
    private func uploadImage(eventId: String, data: Data) async throws -> String {
        let ref = storage.reference().child("events/\(eventId)/image.jpg")
        _ = try await ref.putDataAsync(data)
        return try await ref.downloadURL().absoluteString
    }
    
    func loadFeed(userId: String, userGroups: [String]) {
        isLoading = true
        removeListeners()
        
        // Listen to public events
        let publicListener = db.collection("events")
            .whereField("visibility", isEqualTo: "public")
            .order(by: "eventDate")
            .addSnapshotListener { [weak self] snapshot, _ in
                self?.handleSnapshot(snapshot, tag: "public")
            }
        listeners.append(publicListener)
        
        // Listen to each group's events
        for groupId in userGroups {
            let groupListener = db.collection("events")
                .whereField("groupId", isEqualTo: groupId)
                .order(by: "eventDate")
                .addSnapshotListener { [weak self] snapshot, _ in
                    self?.handleSnapshot(snapshot, tag: groupId)
                }
            listeners.append(groupListener)
        }
        
        // Listen to user's private events
        let privateListener = db.collection("events")
            .whereField("creatorId", isEqualTo: userId)
            .whereField("visibility", isEqualTo: "private")
            .addSnapshotListener { [weak self] snapshot, _ in
                self?.handleSnapshot(snapshot, tag: "private")
            }
        listeners.append(privateListener)
    }
    
    private var eventsByTag: [String: [Event]] = [:]
    
    private func handleSnapshot(_ snapshot: QuerySnapshot?, tag: String) {
        guard let documents = snapshot?.documents else { return }
        
        let tagEvents = documents.compactMap { try? $0.data(as: Event.self) }
        eventsByTag[tag] = tagEvents
        
        // Merge all events, remove duplicates, sort by date
        var allEvents: [Event] = []
        for events in eventsByTag.values {
            allEvents.append(contentsOf: events)
        }
        
        // Remove duplicates by ID
        var seen = Set<String>()
        events = allEvents.filter { event in
            guard let id = event.id else { return false }
            if seen.contains(id) { return false }
            seen.insert(id)
            return true
        }
        .sorted { $0.eventDate < $1.eventDate }
        
        isLoading = false
    }
    
    func filterEvents(for userId: String) -> [Event] {
        events.filter { event in
            // Exclude events where user is in excludedUserIds
            if let excluded = event.excludedUserIds, excluded.contains(userId) {
                return false
            }
            return true
        }
    }
    
    func removeListeners() {
        listeners.forEach { $0.remove() }
        listeners.removeAll()
        eventsByTag.removeAll()
    }
    
    deinit {
        removeListeners()
    }
}
```

### Step 3: Update CreateEventView
Replace `Views/Events/CreateEventView.swift`:

```swift
import SwiftUI
import PhotosUI

struct CreateEventView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authService: AuthService
    @StateObject private var groupsService = GroupsService()
    
    @State private var title = ""
    @State private var description = ""
    @State private var eventDate = Date()
    @State private var location = ""
    @State private var visibility: EventVisibility = .public
    @State private var selectedGroupId: String?
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var selectedImageData: Data?
    
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                // Basic Info
                Section("Event Details") {
                    TextField("Title", text: $title)
                    TextField("Description", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                    DatePicker("Date & Time", selection: $eventDate, in: Date()...)
                    TextField("Location", text: $location)
                }
                
                // Visibility
                Section("Visibility") {
                    Picker("Who can see this?", selection: $visibility) {
                        ForEach(EventVisibility.allCases, id: \.self) { v in
                            Text(v.displayName).tag(v)
                        }
                    }
                    
                    if visibility == .group {
                        if groupsService.userGroups.isEmpty {
                            Text("You need to join a group first")
                                .foregroundColor(.secondary)
                        } else {
                            Picker("Select Group", selection: $selectedGroupId) {
                                Text("Select...").tag(nil as String?)
                                ForEach(groupsService.userGroups) { group in
                                    Text(group.name).tag(group.id as String?)
                                }
                            }
                        }
                    }
                }
                
                // Photo
                Section("Photo (Optional)") {
                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        HStack {
                            if let data = selectedImageData,
                               let uiImage = UIImage(data: data) {
                                Image(uiImage: uiImage)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 60, height: 60)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                Text("Change Photo")
                            } else {
                                Image(systemName: "photo")
                                Text("Add Photo")
                            }
                        }
                    }
                    .onChange(of: selectedPhoto) { _, newValue in
                        Task {
                            if let data = try? await newValue?.loadTransferable(type: Data.self) {
                                selectedImageData = data
                            }
                        }
                    }
                }
                
                // Error
                if let error = errorMessage {
                    Section {
                        Text(error).foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("New Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") { createEvent() }
                        .disabled(!isValid || isLoading)
                }
            }
            .onAppear {
                if let userId = authService.currentUserId {
                    groupsService.loadGroups(for: userId)
                }
            }
        }
    }
    
    private var isValid: Bool {
        !title.isEmpty && 
        (visibility != .group || selectedGroupId != nil)
    }
    
    private func createEvent() {
        guard let userId = authService.currentUserId else { return }
        isLoading = true
        errorMessage = nil
        
        let event = Event(
            title: title,
            description: description.isEmpty ? nil : description,
            eventDate: eventDate,
            creatorId: userId,
            groupId: visibility == .group ? selectedGroupId : nil,
            visibility: visibility.rawValue,
            location: location.isEmpty ? nil : location,
            excludedUserIds: []
        )
        
        Task {
            do {
                let eventsService = EventsService()
                _ = try await eventsService.createEvent(event, image: selectedImageData)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
```

## Acceptance Criteria
- [ ] Event creation form has all required fields
- [ ] Date picker restricts to future dates
- [ ] Visibility selector shows Public/Group/Private options
- [ ] Group picker only appears when visibility is "Group"
- [ ] Photo picker allows selecting image from library
- [ ] Create button disabled until form is valid
- [ ] Event document created in Firestore with correct fields
- [ ] Image uploaded to Storage (if provided)

## Test Schema
1. Create a public event "Test Public Event" for tomorrow
2. Create a group event in "Test Friends" group
3. Create a private event
4. Verify all events appear in Firestore Console
5. Verify image uploads to Storage

## Notes
- PhotosPicker requires iOS 16+
- Image compression can be added for production
- Notifications to group members implemented in task 09
