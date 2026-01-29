# Task: Event Detail with Comments

## Description
Complete the event detail view with full information display and a functional comments section.

## Prerequisites
- Task `05-feed-view` complete
- EventDetailView placeholder exists

## Implementation

### Step 1: Create Comment Model
Create `Models/Comment.swift`:

```swift
import FirebaseFirestore

struct Comment: Codable, Identifiable {
    @DocumentID var id: String?
    var authorId: String
    var text: String
    @ServerTimestamp var timestamp: Timestamp?
    var authorName: String?
}
```

### Step 2: Create Comments Service
Create `Services/CommentsService.swift`:

```swift
import Foundation
import FirebaseFirestore

class CommentsService: ObservableObject {
    @Published var comments: [Comment] = []
    @Published var isLoading = false
    
    private let db = Firestore.firestore()
    private var listener: ListenerRegistration?
    
    func loadComments(for eventId: String) {
        isLoading = true
        
        listener?.remove()
        listener = db.collection("events")
            .document(eventId)
            .collection("comments")
            .order(by: "timestamp", descending: false)
            .addSnapshotListener { [weak self] snapshot, error in
                self?.isLoading = false
                
                guard let documents = snapshot?.documents else { return }
                
                self?.comments = documents.compactMap { doc in
                    try? doc.data(as: Comment.self)
                }
            }
    }
    
    func addComment(to eventId: String, authorId: String, authorName: String, text: String) async throws {
        let comment = Comment(
            authorId: authorId,
            text: text,
            authorName: authorName
        )
        
        try db.collection("events")
            .document(eventId)
            .collection("comments")
            .addDocument(from: comment)
    }
    
    func deleteComment(eventId: String, commentId: String) async throws {
        try await db.collection("events")
            .document(eventId)
            .collection("comments")
            .document(commentId)
            .delete()
    }
    
    deinit {
        listener?.remove()
    }
}
```

### Step 3: Update EventDetailView
Replace `Views/Events/EventDetailView.swift`:

```swift
import SwiftUI

struct EventDetailView: View {
    let event: Event
    
    @EnvironmentObject var authService: AuthService
    @StateObject private var commentsService = CommentsService()
    
    @State private var newComment = ""
    @State private var isSubmitting = false
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Header Image
                if let imageUrl = event.imageUrl, let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                        case .failure:
                            Color.gray.opacity(0.2)
                                .overlay(Image(systemName: "photo"))
                        default:
                            Color.gray.opacity(0.2)
                                .overlay(ProgressView())
                        }
                    }
                    .frame(height: 200)
                    .clipped()
                }
                
                // Event Info
                VStack(alignment: .leading, spacing: 16) {
                    // Title
                    Text(event.title)
                        .font(.title)
                        .fontWeight(.bold)
                    
                    // Meta Info
                    VStack(alignment: .leading, spacing: 8) {
                        Label {
                            Text(event.eventDate, format: .dateTime.weekday(.wide).month(.wide).day().hour().minute())
                        } icon: {
                            Image(systemName: "calendar")
                        }
                        
                        if let location = event.location, !location.isEmpty {
                            Label(location, systemImage: "mappin.circle")
                        }
                        
                        Label(event.visibility.capitalized, systemImage: visibilityIcon)
                    }
                    .foregroundColor(.secondary)
                    
                    // Description
                    if let description = event.description, !description.isEmpty {
                        Divider()
                        Text(description)
                    }
                    
                    Divider()
                    
                    // Comments Section
                    commentsSection
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if let eventId = event.id {
                commentsService.loadComments(for: eventId)
            }
        }
    }
    
    private var visibilityIcon: String {
        switch event.visibility {
        case "public": return "globe"
        case "group": return "person.3"
        case "private": return "lock"
        default: return "eye"
        }
    }
    
    private var commentsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Comments (\(commentsService.comments.count))")
                .font(.headline)
            
            // Comments List
            if commentsService.isLoading {
                ProgressView()
            } else if commentsService.comments.isEmpty {
                Text("No comments yet")
                    .foregroundColor(.secondary)
                    .padding(.vertical, 8)
            } else {
                ForEach(commentsService.comments) { comment in
                    CommentRowView(comment: comment)
                }
            }
            
            // Add Comment
            HStack {
                TextField("Add a comment...", text: $newComment)
                    .textFieldStyle(.roundedBorder)
                
                Button(action: submitComment) {
                    if isSubmitting {
                        ProgressView()
                    } else {
                        Image(systemName: "paperplane.fill")
                    }
                }
                .disabled(newComment.isEmpty || isSubmitting)
            }
            .padding(.top, 8)
        }
    }
    
    private func submitComment() {
        guard let eventId = event.id,
              let userId = authService.currentUserId,
              let userName = authService.currentUser?.fullName,
              !newComment.isEmpty else { return }
        
        isSubmitting = true
        let commentText = newComment
        newComment = ""
        
        Task {
            do {
                try await commentsService.addComment(
                    to: eventId,
                    authorId: userId,
                    authorName: userName,
                    text: commentText
                )
            } catch {
                newComment = commentText  // Restore on error
                print("Error posting comment: \(error)")
            }
            isSubmitting = false
        }
    }
}

struct CommentRowView: View {
    let comment: Comment
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(comment.authorName ?? comment.authorId)
                    .font(.caption)
                    .fontWeight(.semibold)
                
                Spacer()
                
                if let timestamp = comment.timestamp?.dateValue() {
                    Text(timestamp, style: .relative)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            Text(comment.text)
                .font(.subheadline)
        }
        .padding(.vertical, 4)
    }
}
```

## Acceptance Criteria
- [ ] Event detail shows all event information
- [ ] Header image loads asynchronously
- [ ] Comments load in real-time
- [ ] Can post new comments
- [ ] Comments appear immediately after posting
- [ ] Comment shows author name and relative timestamp
- [ ] Visibility icon matches event type

## Test Schema
1. Navigate to an existing event
2. Post a comment "Test comment"
3. Verify comment appears in list
4. Check Firestore Console for comment document
5. Open same event on another device/simulator
6. Verify comment appears there too (real-time)

## Notes
- Comments stored as subcollection under event
- Real-time listener updates comments automatically
- Author name cached in comment for display efficiency
