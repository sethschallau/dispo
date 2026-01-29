# Task: Post-Event Photo Sharing

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes - code only |
| **Human tasks** | None |
| **Agent tasks** | Create EventPhoto model, photo upload UI, gallery view |
| **Estimated complexity** | Medium |
| **Dependencies** | MVP complete |

## What Needs to Happen

### Agent Will Do (No Human Needed)
1. Create `EventPhoto.swift` model
2. Add photo upload methods to EventsService
3. Create photo gallery section in EventDetailView
4. Add photo upload button (only for attendees/past events)
5. Update storage.rules if needed

## Implementation

### 1. Create Models/EventPhoto.swift
```swift
import FirebaseFirestore

struct EventPhoto: Codable, Identifiable {
    @DocumentID var id: String?
    var uploaderId: String
    var uploaderName: String?
    var imageUrl: String
    var caption: String?
    var timestamp: Date
}
```

### 2. Add to Services/EventsService.swift
```swift
// MARK: - Event Photos

func uploadEventPhoto(eventId: String, imageData: Data, userId: String, userName: String?, caption: String?) async throws -> EventPhoto {
    // Generate unique filename
    let filename = "\(UUID().uuidString).jpg"
    let storageRef = Storage.storage().reference()
        .child("events/\(eventId)/photos/\(filename)")
    
    // Upload image
    let metadata = StorageMetadata()
    metadata.contentType = "image/jpeg"
    
    _ = try await storageRef.putDataAsync(imageData, metadata: metadata)
    let downloadUrl = try await storageRef.downloadURL()
    
    // Create photo document
    let photo = EventPhoto(
        uploaderId: userId,
        uploaderName: userName,
        imageUrl: downloadUrl.absoluteString,
        caption: caption,
        timestamp: Date()
    )
    
    let docRef = try db.collection("events").document(eventId)
        .collection("photos").addDocument(from: photo)
    
    var savedPhoto = photo
    savedPhoto.id = docRef.documentID
    return savedPhoto
}

func getEventPhotos(eventId: String) async throws -> [EventPhoto] {
    let snapshot = try await db.collection("events").document(eventId)
        .collection("photos")
        .order(by: "timestamp", descending: false)
        .getDocuments()
    
    return snapshot.documents.compactMap { try? $0.data(as: EventPhoto.self) }
}

func deleteEventPhoto(eventId: String, photo: EventPhoto) async throws {
    guard let photoId = photo.id else { return }
    
    // Delete from storage
    if let url = URL(string: photo.imageUrl) {
        try? await Storage.storage().reference(forURL: photo.imageUrl).delete()
    }
    
    // Delete document
    try await db.collection("events").document(eventId)
        .collection("photos").document(photoId).delete()
}
```

### 3. Create Views/EventPhotosSection.swift
```swift
import SwiftUI
import PhotosUI

struct EventPhotosSection: View {
    let event: Event
    let currentUserId: String
    let currentUserName: String?
    
    @State private var photos: [EventPhoto] = []
    @State private var isLoading = true
    @State private var showPhotoPicker = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var isUploading = false
    @State private var selectedPhoto: EventPhoto?
    
    // Only allow uploads if event has passed
    var canUploadPhotos: Bool {
        event.eventDate < Date()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Photos")
                    .font(.headline)
                Spacer()
                if canUploadPhotos {
                    PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                        Label("Add", systemImage: "plus.circle")
                            .font(.subheadline)
                    }
                    .disabled(isUploading)
                }
            }
            
            if isLoading {
                ProgressView()
            } else if photos.isEmpty {
                Text(canUploadPhotos ? "No photos yet. Be the first to share!" : "Photos can be added after the event.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                // Photo grid
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 8) {
                    ForEach(photos) { photo in
                        AsyncImage(url: URL(string: photo.imageUrl)) { phase in
                            switch phase {
                            case .success(let image):
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(width: 100, height: 100)
                                    .clipped()
                                    .cornerRadius(8)
                                    .onTapGesture { selectedPhoto = photo }
                            case .failure:
                                Rectangle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 100, height: 100)
                                    .cornerRadius(8)
                            default:
                                Rectangle()
                                    .fill(Color.gray.opacity(0.1))
                                    .frame(width: 100, height: 100)
                                    .cornerRadius(8)
                                    .overlay(ProgressView())
                            }
                        }
                    }
                }
            }
            
            if isUploading {
                HStack {
                    ProgressView()
                    Text("Uploading...")
                        .font(.caption)
                }
            }
        }
        .task { await loadPhotos() }
        .onChange(of: selectedPhotoItem) { _, newItem in
            if let item = newItem {
                Task { await uploadPhoto(item: item) }
            }
        }
        .sheet(item: $selectedPhoto) { photo in
            PhotoDetailView(photo: photo, eventId: event.id!, currentUserId: currentUserId) {
                photos.removeAll { $0.id == photo.id }
            }
        }
    }
    
    private func loadPhotos() async {
        guard let eventId = event.id else { return }
        do {
            photos = try await EventsService.shared.getEventPhotos(eventId: eventId)
        } catch {
            print("Error loading photos: \(error)")
        }
        isLoading = false
    }
    
    private func uploadPhoto(item: PhotosPickerItem) async {
        isUploading = true
        defer { 
            isUploading = false 
            selectedPhotoItem = nil
        }
        
        guard let eventId = event.id,
              let data = try? await item.loadTransferable(type: Data.self) else { return }
        
        // Compress image
        guard let uiImage = UIImage(data: data),
              let compressed = uiImage.jpegData(compressionQuality: 0.7) else { return }
        
        do {
            let photo = try await EventsService.shared.uploadEventPhoto(
                eventId: eventId,
                imageData: compressed,
                userId: currentUserId,
                userName: currentUserName,
                caption: nil
            )
            await MainActor.run {
                photos.append(photo)
            }
        } catch {
            print("Upload error: \(error)")
        }
    }
}

struct PhotoDetailView: View {
    let photo: EventPhoto
    let eventId: String
    let currentUserId: String
    let onDelete: () -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteConfirm = false
    
    var body: some View {
        NavigationView {
            VStack {
                AsyncImage(url: URL(string: photo.imageUrl)) { phase in
                    if let image = phase.image {
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    }
                }
                
                if let caption = photo.caption {
                    Text(caption)
                        .padding()
                }
                
                if let name = photo.uploaderName {
                    Text("Uploaded by \(name)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                if photo.uploaderId == currentUserId {
                    ToolbarItem(placement: .destructiveAction) {
                        Button(role: .destructive) { showDeleteConfirm = true } label: {
                            Image(systemName: "trash")
                        }
                    }
                }
            }
            .confirmationDialog("Delete Photo?", isPresented: $showDeleteConfirm) {
                Button("Delete", role: .destructive) {
                    Task {
                        try? await EventsService.shared.deleteEventPhoto(eventId: eventId, photo: photo)
                        onDelete()
                        dismiss()
                    }
                }
            }
        }
    }
}
```

### 4. Update EventDetailView
```swift
// Add photos section after comments
EventPhotosSection(
    event: event,
    currentUserId: currentUserId,
    currentUserName: currentUserName
)
```

## Files to Create/Modify
- [ ] `Models/EventPhoto.swift` - Create new
- [ ] `Services/EventsService.swift` - Add photo methods
- [ ] `Views/EventPhotosSection.swift` - Create new
- [ ] `Views/EventDetailView.swift` - Add photos section

## Acceptance Criteria
- [ ] Photo upload available only after event date
- [ ] Photos display in grid on event detail
- [ ] Can tap to view full photo
- [ ] Uploader can delete their own photos
- [ ] Photos stored in Firebase Storage under event path
- [ ] Photo documents in events/{id}/photos subcollection

## Test Cases
1. Future event → "Photos can be added after the event"
2. Past event → can upload photo
3. Upload photo → appears in grid
4. Tap photo → full view opens
5. Delete own photo → removed from grid
6. Can't delete others' photos
