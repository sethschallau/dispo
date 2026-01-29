//
//  CreateEventView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI
import PhotosUI
import Combine
import FirebaseFirestore
import FirebaseStorage

struct CreateEventView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authService: AuthService
    @StateObject private var groupsService = GroupsService()
    
    // Form fields
    @State private var title = ""
    @State private var description = ""
    @State private var eventDate = Date().addingTimeInterval(3600) // Default 1 hour from now
    @State private var location = ""
    @State private var visibility: EventVisibility = .public
    @State private var selectedGroupId: String?
    
    // Photo
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var selectedImageData: Data?
    
    // State
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                // Basic Info
                Section("Event Details") {
                    TextField("Title", text: $title)
                    
                    TextField("Description (optional)", text: $description, axis: .vertical)
                        .lineLimit(2...5)
                    
                    DatePicker("Date & Time", selection: $eventDate, in: Date()...)
                    
                    TextField("Location (optional)", text: $location)
                }
                
                // Visibility
                Section("Who can see this?") {
                    Picker("Visibility", selection: $visibility) {
                        ForEach([EventVisibility.public, .group, .private], id: \.self) { v in
                            Label(v.displayName, systemImage: v.icon)
                                .tag(v)
                        }
                    }
                    .pickerStyle(.segmented)
                    
                    if visibility == .group {
                        if groupsService.isLoading {
                            HStack {
                                ProgressView()
                                Text("Loading groups...")
                                    .foregroundColor(.secondary)
                            }
                        } else if groupsService.userGroups.isEmpty {
                            HStack {
                                Image(systemName: "exclamationmark.triangle")
                                    .foregroundColor(.orange)
                                Text("Join a group first to create group events")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        } else {
                            Picker("Select Group", selection: $selectedGroupId) {
                                Text("Choose a group...").tag(nil as String?)
                                ForEach(groupsService.userGroups) { group in
                                    Text(group.name).tag(group.id as String?)
                                }
                            }
                        }
                    }
                }
                
                // Photo
                Section {
                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        HStack {
                            if let data = selectedImageData,
                               let uiImage = UIImage(data: data) {
                                Image(uiImage: uiImage)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 60, height: 60)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                
                                VStack(alignment: .leading) {
                                    Text("Photo selected")
                                        .font(.subheadline)
                                    Text("Tap to change")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            } else {
                                Image(systemName: "photo.badge.plus")
                                    .font(.title2)
                                    .foregroundColor(.blue)
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
                    
                    if selectedImageData != nil {
                        Button("Remove Photo", role: .destructive) {
                            selectedPhoto = nil
                            selectedImageData = nil
                        }
                    }
                } header: {
                    Text("Photo (Optional)")
                }
                
                // Error
                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("New Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .disabled(isLoading)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") { createEvent() }
                        .fontWeight(.semibold)
                        .disabled(!isValid || isLoading)
                }
            }
            .onAppear {
                if let userId = authService.currentUserId {
                    groupsService.loadGroups(for: userId)
                }
            }
            .interactiveDismissDisabled(isLoading)
        }
    }
    
    private var isValid: Bool {
        let hasTitle = !title.trimmingCharacters(in: .whitespaces).isEmpty
        let hasGroup = visibility != .group || selectedGroupId != nil
        return hasTitle && hasGroup
    }
    
    private func createEvent() {
        guard let userId = authService.currentUserId else { return }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let db = Firestore.firestore()
                let eventRef = db.collection("events").document()
                var imageUrl: String? = nil
                
                // Upload image if provided
                if let imageData = selectedImageData {
                    let storage = Storage.storage()
                    let ref = storage.reference().child("events/\(eventRef.documentID)/image.jpg")
                    _ = try await ref.putDataAsync(imageData)
                    imageUrl = try await ref.downloadURL().absoluteString
                }
                
                // Create event
                let event = Event(
                    title: title.trimmingCharacters(in: .whitespaces),
                    description: description.trimmingCharacters(in: .whitespaces).isEmpty ? nil : description.trimmingCharacters(in: .whitespaces),
                    eventDate: eventDate,
                    creatorId: userId,
                    groupId: visibility == .group ? selectedGroupId : nil,
                    visibility: visibility.rawValue,
                    location: location.trimmingCharacters(in: .whitespaces).isEmpty ? nil : location.trimmingCharacters(in: .whitespaces),
                    imageUrl: imageUrl,
                    excludedUserIds: []
                )
                
                try eventRef.setData(from: event)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    CreateEventView()
        .environmentObject(AuthService.shared)
}
