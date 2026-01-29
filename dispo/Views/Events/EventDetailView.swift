//
//  EventDetailView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

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
                headerImage
                
                // Event Info
                VStack(alignment: .leading, spacing: 16) {
                    // Title
                    Text(event.title)
                        .font(.title)
                        .fontWeight(.bold)
                    
                    // Meta Info
                    metaInfo
                    
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
        .onDisappear {
            commentsService.stopListening()
        }
    }
    
    // MARK: - Header Image
    
    @ViewBuilder
    private var headerImage: some View {
        if let imageUrl = event.imageUrl, let url = URL(string: imageUrl) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFill()
                case .failure:
                    imagePlaceholder
                        .overlay(Image(systemName: "photo"))
                default:
                    imagePlaceholder
                        .overlay(ProgressView())
                }
            }
            .frame(height: 200)
            .clipped()
        }
    }
    
    private var imagePlaceholder: some View {
        Rectangle()
            .fill(Color.gray.opacity(0.2))
            .frame(height: 200)
    }
    
    // MARK: - Meta Info
    
    private var metaInfo: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Date & Time
            Label {
                Text(event.eventDate, format: .dateTime.weekday(.wide).month(.wide).day().hour().minute())
            } icon: {
                Image(systemName: "calendar")
            }
            
            // Location
            if let location = event.location, !location.isEmpty {
                Label(location, systemImage: "mappin.circle")
            }
            
            // Visibility
            Label {
                Text(event.visibility.capitalized)
            } icon: {
                Image(systemName: visibilityIcon)
            }
        }
        .foregroundColor(.secondary)
    }
    
    private var visibilityIcon: String {
        switch event.visibility {
        case "public": return "globe"
        case "group": return "person.3"
        case "private": return "lock"
        default: return "eye"
        }
    }
    
    // MARK: - Comments Section
    
    private var commentsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Comments (\(commentsService.comments.count))")
                .font(.headline)
            
            // Comments List
            if commentsService.isLoading {
                HStack {
                    Spacer()
                    ProgressView()
                    Spacer()
                }
                .padding()
            } else if commentsService.comments.isEmpty {
                Text("No comments yet. Be the first!")
                    .foregroundColor(.secondary)
                    .padding(.vertical, 8)
            } else {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(commentsService.comments) { comment in
                        CommentRowView(comment: comment)
                    }
                }
            }
            
            // Add Comment Input
            commentInput
        }
    }
    
    private var commentInput: some View {
        HStack(spacing: 12) {
            TextField("Add a comment...", text: $newComment)
                .textFieldStyle(.roundedBorder)
            
            Button(action: submitComment) {
                if isSubmitting {
                    ProgressView()
                        .frame(width: 24, height: 24)
                } else {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(.blue)
                }
            }
            .disabled(newComment.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
        }
        .padding(.top, 8)
    }
    
    // MARK: - Actions
    
    private func submitComment() {
        guard let eventId = event.id,
              let userId = authService.currentUserId,
              let userName = authService.currentUser?.fullName,
              !newComment.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        isSubmitting = true
        let commentText = newComment.trimmingCharacters(in: .whitespaces)
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
                // Restore comment on error
                newComment = commentText
                print("Error posting comment: \(error)")
            }
            isSubmitting = false
        }
    }
}

// MARK: - Comment Row

struct CommentRowView: View {
    let comment: Comment
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(comment.authorName ?? "Unknown")
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

// MARK: - Preview

#Preview {
    NavigationView {
        EventDetailView(event: Event(
            id: "preview",
            title: "Test Event",
            description: "This is a test event description that spans multiple lines to show how the layout handles longer text content.",
            eventDate: Date().addingTimeInterval(86400 * 3),
            creatorId: "user1",
            visibility: "public",
            location: "Downtown Raleigh"
        ))
        .environmentObject(AuthService.shared)
    }
}
