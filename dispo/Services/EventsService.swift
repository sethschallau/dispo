//
//  EventsService.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import Foundation
import Combine
import FirebaseFirestore

@MainActor
class EventsService: ObservableObject {
    @Published var events: [Event] = []
    @Published var isLoading = false
    @Published var error: String?
    
    private let db = Firestore.firestore()
    private var listeners: [ListenerRegistration] = []
    
    /// Load events visible to the current user
    /// - Parameters:
    ///   - userId: Current user's ID
    ///   - userGroups: Group IDs the user belongs to
    func loadFeed(userId: String, userGroups: [String]) {
        isLoading = true
        error = nil
        events = []
        
        // Remove existing listeners
        stopListening()
        
        var allEvents: [Event] = []
        var pendingQueries = 0
        
        // Query 1: Public events
        pendingQueries += 1
        let publicListener = db.collection("events")
            .whereField("visibility", isEqualTo: "public")
            .order(by: "eventDate")
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self = self else { return }
                
                if let error = error {
                    print("Error loading public events: \(error)")
                } else if let documents = snapshot?.documents {
                    let publicEvents = documents.compactMap { try? $0.data(as: Event.self) }
                    allEvents = self.mergeEvents(existing: allEvents, new: publicEvents)
                    self.updateEvents(allEvents, userId: userId)
                }
                
                pendingQueries -= 1
                if pendingQueries == 0 {
                    self.isLoading = false
                }
            }
        listeners.append(publicListener)
        
        // Query 2: User's private events
        pendingQueries += 1
        let privateListener = db.collection("events")
            .whereField("visibility", isEqualTo: "private")
            .whereField("creatorId", isEqualTo: userId)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self = self else { return }
                
                if let error = error {
                    print("Error loading private events: \(error)")
                } else if let documents = snapshot?.documents {
                    let privateEvents = documents.compactMap { try? $0.data(as: Event.self) }
                    allEvents = self.mergeEvents(existing: allEvents, new: privateEvents)
                    self.updateEvents(allEvents, userId: userId)
                }
                
                pendingQueries -= 1
                if pendingQueries == 0 {
                    self.isLoading = false
                }
            }
        listeners.append(privateListener)
        
        // Query 3: Group events for each group
        for groupId in userGroups {
            pendingQueries += 1
            let groupListener = db.collection("events")
                .whereField("visibility", isEqualTo: "group")
                .whereField("groupId", isEqualTo: groupId)
                .addSnapshotListener { [weak self] snapshot, error in
                    guard let self = self else { return }
                    
                    if let error = error {
                        print("Error loading group events for \(groupId): \(error)")
                    } else if let documents = snapshot?.documents {
                        let groupEvents = documents.compactMap { try? $0.data(as: Event.self) }
                        allEvents = self.mergeEvents(existing: allEvents, new: groupEvents)
                        self.updateEvents(allEvents, userId: userId)
                    }
                    
                    pendingQueries -= 1
                    if pendingQueries == 0 {
                        self.isLoading = false
                    }
                }
            listeners.append(groupListener)
        }
        
        // Handle case with no groups
        if userGroups.isEmpty && pendingQueries == 0 {
            isLoading = false
        }
    }
    
    /// Merge events, avoiding duplicates by ID
    private func mergeEvents(existing: [Event], new: [Event]) -> [Event] {
        var merged = existing
        for event in new {
            if let id = event.id, !merged.contains(where: { $0.id == id }) {
                merged.append(event)
            }
        }
        return merged
    }
    
    /// Update published events, filtering out excluded users and sorting by date
    private func updateEvents(_ allEvents: [Event], userId: String) {
        events = allEvents
            .filter { event in
                // Filter out events where current user is excluded
                !(event.excludedUserIds?.contains(userId) ?? false)
            }
            .sorted { $0.eventDate < $1.eventDate }
    }
    
    /// Filter events visible to a specific user (client-side helper)
    func filterEvents(for userId: String) -> [Event] {
        return events.filter { event in
            !(event.excludedUserIds?.contains(userId) ?? false)
        }
    }
    
    /// Stop all listeners
    func stopListening() {
        for listener in listeners {
            listener.remove()
        }
        listeners.removeAll()
    }
    
    deinit {
        for listener in listeners {
            listener.remove()
        }
    }
    
    // MARK: - Create Event
    
    /// Create a new event
    func createEvent(_ event: Event) async throws -> String {
        let docRef = try db.collection("events").addDocument(from: event)
        return docRef.documentID
    }
    
    // MARK: - Update & Delete
    
    /// Update an existing event
    func updateEvent(_ event: Event) async throws {
        guard let eventId = event.id else {
            throw EventError.missingId
        }
        try db.collection("events").document(eventId).setData(from: event, merge: true)
    }
    
    /// Delete an event and all its subcollections
    func deleteEvent(_ eventId: String) async throws {
        let eventRef = db.collection("events").document(eventId)
        
        // Delete comments subcollection
        let comments = try await eventRef.collection("comments").getDocuments()
        for doc in comments.documents {
            try await doc.reference.delete()
        }
        
        // Delete rsvps subcollection (if exists)
        let rsvps = try await eventRef.collection("rsvps").getDocuments()
        for doc in rsvps.documents {
            try await doc.reference.delete()
        }
        
        // Delete photos subcollection (if exists)
        let photos = try await eventRef.collection("photos").getDocuments()
        for doc in photos.documents {
            try await doc.reference.delete()
        }
        
        // Delete event document
        try await eventRef.delete()
    }
    
    /// Get a single event by ID
    func getEvent(_ eventId: String) async throws -> Event? {
        let doc = try await db.collection("events").document(eventId).getDocument()
        return try? doc.data(as: Event.self)
    }
}

// MARK: - Errors

enum EventError: LocalizedError {
    case missingId
    case notFound
    case unauthorized
    
    var errorDescription: String? {
        switch self {
        case .missingId:
            return "Event ID is missing"
        case .notFound:
            return "Event not found"
        case .unauthorized:
            return "You don't have permission to modify this event"
        }
    }
}

