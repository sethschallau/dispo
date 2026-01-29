//
//  CommentsService.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import Foundation
import Combine
import FirebaseFirestore

@MainActor
class CommentsService: ObservableObject {
    @Published var comments: [Comment] = []
    @Published var isLoading = false
    
    private let db = Firestore.firestore()
    private var listener: ListenerRegistration?
    
    /// Load comments for an event with real-time updates
    func loadComments(for eventId: String) {
        isLoading = true
        
        listener?.remove()
        listener = db.collection("events")
            .document(eventId)
            .collection("comments")
            .order(by: "timestamp", descending: false)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self = self else { return }
                self.isLoading = false
                
                if let error = error {
                    print("Error loading comments: \(error)")
                    return
                }
                
                guard let documents = snapshot?.documents else { return }
                
                self.comments = documents.compactMap { doc in
                    try? doc.data(as: Comment.self)
                }
            }
    }
    
    /// Add a new comment to an event
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
    
    /// Delete a comment
    func deleteComment(eventId: String, commentId: String) async throws {
        try await db.collection("events")
            .document(eventId)
            .collection("comments")
            .document(commentId)
            .delete()
    }
    
    /// Stop listening to comments
    func stopListening() {
        listener?.remove()
        listener = nil
    }
    
    deinit {
        listener?.remove()
    }
}

