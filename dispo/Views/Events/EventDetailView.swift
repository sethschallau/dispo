//
//  EventDetailView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI
import FirebaseCore
import FirebaseFirestore
import Combine

struct EventDetailView: View {
    @State var event: Event
    
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var authService: AuthService
    @StateObject private var commentsService = CommentsService()
    
    @State private var newComment = ""
    @State private var isSubmitting = false
    @State private var showReminderPicker = false
    @State private var reminderSet = false
    @State private var showEditSheet = false
    @State private var showDeleteConfirmation = false
    @State private var isDeleting = false
    
    // RSVP state
    @State private var rsvps: [RSVP] = []
    @State private var myRSVP: RSVP?
    @State private var rsvpListener: ListenerRegistration?
    
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
                    
                    // RSVP Section
                    rsvpSection
                    
                    Divider()
                    
                    // Comments Section
                    commentsSection
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: 16) {
                    // Reminder button
                    Button(action: { showReminderPicker = true }) {
                        Image(systemName: reminderSet ? "bell.fill" : "bell")
                            .foregroundColor(reminderSet ? .orange : .blue)
                    }
                    
                    // Edit/Delete menu (only for creator)
                    if event.creatorId == authService.currentUserId {
                        Menu {
                            Button(action: { showEditSheet = true }) {
                                Label("Edit Event", systemImage: "pencil")
                            }
                            Button(role: .destructive, action: { showDeleteConfirmation = true }) {
                                Label("Delete Event", systemImage: "trash")
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showEditSheet) {
            EditEventView(event: event)
                .onDisappear {
                    // Refresh event data after edit
                    refreshEvent()
                }
        }
        .confirmationDialog("Delete Event?", isPresented: $showDeleteConfirmation, titleVisibility: .visible) {
            Button("Delete", role: .destructive) { deleteEvent() }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("This will permanently delete the event and all comments. This cannot be undone.")
        }
        .overlay {
            if isDeleting {
                Color.black.opacity(0.3)
                    .ignoresSafeArea()
                VStack {
                    ProgressView()
                    Text("Deleting...")
                        .font(.caption)
                        .foregroundColor(.white)
                }
            }
        }
        .confirmationDialog("Set Reminder", isPresented: $showReminderPicker, titleVisibility: .visible) {
            ForEach(NotificationsService.reminderOffsets, id: \.seconds) { option in
                Button(option.label) {
                    setReminder(offset: option.seconds)
                }
            }
            if reminderSet {
                Button("Remove Reminder", role: .destructive) {
                    removeReminder()
                }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("When do you want to be reminded?")
        }
        .onAppear {
            if let eventId = event.id {
                commentsService.loadComments(for: eventId)
                loadRSVPs()
            }
            // Request notification permission on first view
            Task {
                _ = await NotificationsService.requestPermission()
            }
        }
        .onDisappear {
            commentsService.stopListening()
            rsvpListener?.remove()
        }
    }
    
    // MARK: - Reminder Actions
    
    private func setReminder(offset: TimeInterval) {
        guard let eventId = event.id else { return }
        
        NotificationsService.scheduleEventReminder(
            eventId: eventId,
            eventTitle: event.title,
            eventDate: event.eventDate,
            reminderOffset: offset
        )
        
        reminderSet = true
    }
    
    private func removeReminder() {
        guard let eventId = event.id else { return }
        NotificationsService.cancelEventReminders(eventId: eventId)
        reminderSet = false
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
    
    // MARK: - RSVP Section
    
    private var rsvpSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Are you going?")
                .font(.headline)
            
            // RSVP Buttons
            HStack(spacing: 12) {
                ForEach(RSVP.RSVPStatus.allCases, id: \.self) { status in
                    rsvpButton(for: status)
                }
            }
            
            // Attendee counts
            let goingCount = rsvps.filter { $0.status == .going }.count
            let maybeCount = rsvps.filter { $0.status == .maybe }.count
            
            if goingCount > 0 || maybeCount > 0 {
                HStack(spacing: 8) {
                    if goingCount > 0 {
                        Label("\(goingCount) going", systemImage: "checkmark.circle.fill")
                            .foregroundColor(.green)
                    }
                    if maybeCount > 0 {
                        Label("\(maybeCount) maybe", systemImage: "questionmark.circle.fill")
                            .foregroundColor(.orange)
                    }
                }
                .font(.subheadline)
            }
        }
    }
    
    private func rsvpButton(for status: RSVP.RSVPStatus) -> some View {
        let isSelected = myRSVP?.status == status
        
        return Button(action: { setRSVP(status) }) {
            VStack(spacing: 4) {
                Image(systemName: status.icon)
                    .font(.title2)
                Text(status.displayName)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(isSelected ? statusColor(status) : Color.gray.opacity(0.15))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(10)
        }
    }
    
    private func statusColor(_ status: RSVP.RSVPStatus) -> Color {
        switch status {
        case .going: return .green
        case .maybe: return .orange
        case .declined: return .red
        }
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
    
    // MARK: - RSVP Actions
    
    private func setRSVP(_ status: RSVP.RSVPStatus) {
        guard let eventId = event.id,
              let userId = authService.currentUserId else { return }
        
        Task {
            let service = EventsService()
            
            // If tapping the same status, remove RSVP
            if myRSVP?.status == status {
                try? await service.removeRSVP(eventId: eventId, userId: userId)
                await MainActor.run { myRSVP = nil }
            } else {
                // Set new RSVP
                let userName = authService.currentUser?.fullName
                try? await service.setRSVP(eventId: eventId, userId: userId, userName: userName, status: status)
                await MainActor.run {
                    myRSVP = RSVP(userId: userId, userName: userName, status: status)
                }
            }
        }
    }
    
    private func loadRSVPs() {
        guard let eventId = event.id else { return }
        let service = EventsService()
        
        // Listen to RSVPs
        rsvpListener = service.listenToRSVPs(eventId: eventId) { [self] rsvps in
            self.rsvps = rsvps
            
            // Find current user's RSVP
            if let userId = authService.currentUserId {
                self.myRSVP = rsvps.first { $0.userId == userId }
            }
        }
    }
    
    // MARK: - Event Actions
    
    private func refreshEvent() {
        guard let eventId = event.id else { return }
        Task {
            let service = EventsService()
            if let updated = try? await service.getEvent(eventId) {
                await MainActor.run {
                    event = updated
                }
            }
        }
    }
    
    private func deleteEvent() {
        guard let eventId = event.id else { return }
        isDeleting = true
        
        Task {
            do {
                let service = EventsService()
                try await service.deleteEvent(eventId)
                await MainActor.run {
                    isDeleting = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isDeleting = false
                    print("Error deleting event: \(error)")
                }
            }
        }
    }
    
    // MARK: - Comment Actions
    
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
