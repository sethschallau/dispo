//
//  EventPhotosSection.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI
import PhotosUI

struct EventPhotosSection: View {
    let event: Event
    let currentUserId: String
    let currentUserName: String?
    
    @State private var photos: [EventPhoto] = []
    @State private var isLoading = true
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var isUploading = false
    @State private var selectedPhoto: EventPhoto?
    
    /// Only allow photo uploads after the event date has passed
    private var canUploadPhotos: Bool {
        event.eventDate < Date()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
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
                HStack {
                    Spacer()
                    ProgressView()
                    Spacer()
                }
                .padding(.vertical)
            } else if photos.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "photo.on.rectangle.angled")
                        .font(.title)
                        .foregroundColor(.secondary)
                    
                    if canUploadPhotos {
                        Text("No photos yet. Be the first to share!")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    } else {
                        Text("Photos can be added after the event")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical)
            } else {
                // Photo grid
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 8)], spacing: 8) {
                    ForEach(photos) { photo in
                        PhotoThumbnail(photo: photo) {
                            selectedPhoto = photo
                        }
                    }
                }
            }
            
            if isUploading {
                HStack(spacing: 8) {
                    ProgressView()
                    Text("Uploading...")
                        .font(.caption)
                        .foregroundColor(.secondary)
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
            PhotoDetailSheet(
                photo: photo,
                eventId: event.id ?? "",
                currentUserId: currentUserId,
                onDelete: {
                    photos.removeAll { $0.id == photo.id }
                }
            )
        }
    }
    
    private func loadPhotos() async {
        guard let eventId = event.id else {
            isLoading = false
            return
        }
        
        do {
            let service = EventsService()
            photos = try await service.getEventPhotos(eventId: eventId)
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
        
        guard let eventId = event.id else { return }
        
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else { return }
            
            // Compress image
            guard let uiImage = UIImage(data: data),
                  let compressed = uiImage.jpegData(compressionQuality: 0.7) else { return }
            
            let service = EventsService()
            let photo = try await service.uploadEventPhoto(
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

// MARK: - Photo Thumbnail

struct PhotoThumbnail: View {
    let photo: EventPhoto
    let onTap: () -> Void
    
    var body: some View {
        AsyncImage(url: URL(string: photo.imageUrl)) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 100, height: 100)
                    .clipped()
                    .cornerRadius(8)
            case .failure:
                placeholder
                    .overlay(
                        Image(systemName: "exclamationmark.triangle")
                            .foregroundColor(.secondary)
                    )
            default:
                placeholder
                    .overlay(ProgressView())
            }
        }
        .onTapGesture { onTap() }
    }
    
    private var placeholder: some View {
        Rectangle()
            .fill(Color.gray.opacity(0.2))
            .frame(width: 100, height: 100)
            .cornerRadius(8)
    }
}

// MARK: - Photo Detail Sheet

struct PhotoDetailSheet: View {
    let photo: EventPhoto
    let eventId: String
    let currentUserId: String
    let onDelete: () -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false
    
    private var canDelete: Bool {
        photo.uploaderId == currentUserId
    }
    
    var body: some View {
        NavigationView {
            VStack {
                // Photo
                AsyncImage(url: URL(string: photo.imageUrl)) { phase in
                    if let image = phase.image {
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    } else if phase.error != nil {
                        VStack {
                            Image(systemName: "photo")
                                .font(.largeTitle)
                            Text("Failed to load image")
                                .font(.caption)
                        }
                        .foregroundColor(.secondary)
                    } else {
                        ProgressView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                // Caption
                if let caption = photo.caption, !caption.isEmpty {
                    Text(caption)
                        .padding()
                }
                
                // Uploader info
                if let name = photo.uploaderName {
                    Text("Uploaded by \(name)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.bottom)
                }
            }
            .navigationTitle("Photo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                if canDelete {
                    ToolbarItem(placement: .destructiveAction) {
                        Button(role: .destructive) {
                            showDeleteConfirm = true
                        } label: {
                            if isDeleting {
                                ProgressView()
                            } else {
                                Image(systemName: "trash")
                            }
                        }
                        .disabled(isDeleting)
                    }
                }
            }
            .confirmationDialog("Delete Photo?", isPresented: $showDeleteConfirm, titleVisibility: .visible) {
                Button("Delete", role: .destructive) { deletePhoto() }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text("This photo will be permanently deleted.")
            }
        }
    }
    
    private func deletePhoto() {
        isDeleting = true
        
        Task {
            do {
                let service = EventsService()
                try await service.deleteEventPhoto(eventId: eventId, photo: photo)
                await MainActor.run {
                    onDelete()
                    dismiss()
                }
            } catch {
                print("Error deleting photo: \(error)")
                await MainActor.run {
                    isDeleting = false
                }
            }
        }
    }
}

// MARK: - Preview

#Preview {
    EventPhotosSection(
        event: Event(
            id: "preview",
            title: "Test Event",
            eventDate: Date().addingTimeInterval(-86400), // Yesterday
            creatorId: "user1",
            visibility: "public"
        ),
        currentUserId: "user1",
        currentUserName: "Test User"
    )
    .padding()
}
