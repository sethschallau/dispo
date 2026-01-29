//
//  GroupsService.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import Foundation
import Combine
import FirebaseFirestore

struct AppGroup: Codable, Identifiable {
    @DocumentID var id: String?
    var name: String
    var description: String?
    var members: [String]
    var ownerId: String
    var joinCode: String?
    @ServerTimestamp var createdAt: Timestamp?
}

@MainActor
class GroupsService: ObservableObject {
    @Published var userGroups: [AppGroup] = []
    @Published var isLoading = false
    
    private let db = Firestore.firestore()
    private var listener: ListenerRegistration?
    
    /// Load groups that the user belongs to
    func loadGroups(for userId: String) {
        isLoading = true
        
        listener?.remove()
        listener = db.collection("groups")
            .whereField("members", arrayContains: userId)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self = self else { return }
                self.isLoading = false
                
                if let error = error {
                    print("Error loading groups: \(error)")
                    return
                }
                
                guard let documents = snapshot?.documents else { return }
                
                self.userGroups = documents.compactMap { doc in
                    try? doc.data(as: AppGroup.self)
                }
            }
    }
    
    /// Get user's group IDs (for querying events)
    var userGroupIds: [String] {
        userGroups.compactMap { $0.id }
    }
    
    func stopListening() {
        listener?.remove()
        listener = nil
    }
    
    deinit {
        listener?.remove()
    }
}
