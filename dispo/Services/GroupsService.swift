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
    
    /// Create a new group
    func createGroup(name: String, description: String?, ownerId: String) async throws -> String {
        let groupRef = db.collection("groups").document()
        let joinCode = generateJoinCode()
        
        let group = AppGroup(
            name: name,
            description: description,
            members: [ownerId],
            ownerId: ownerId,
            joinCode: joinCode
        )
        
        try groupRef.setData(from: group)
        
        // Update user's groupIds
        try await db.collection("users").document(ownerId).updateData([
            "groupIds": FieldValue.arrayUnion([groupRef.documentID])
        ])
        
        return groupRef.documentID
    }
    
    /// Join a group by join code
    func joinGroup(code: String, userId: String) async throws {
        // Find group by join code
        let snapshot = try await db.collection("groups")
            .whereField("joinCode", isEqualTo: code.uppercased())
            .limit(to: 1)
            .getDocuments()
        
        guard let groupDoc = snapshot.documents.first else {
            throw GroupError.groupNotFound
        }
        
        let groupId = groupDoc.documentID
        
        // Check if already a member
        if let group = try? groupDoc.data(as: AppGroup.self),
           group.members.contains(userId) {
            throw GroupError.alreadyMember
        }
        
        // Add user to group members
        try await db.collection("groups").document(groupId).updateData([
            "members": FieldValue.arrayUnion([userId])
        ])
        
        // Update user's groupIds
        try await db.collection("users").document(userId).updateData([
            "groupIds": FieldValue.arrayUnion([groupId])
        ])
    }
    
    /// Leave a group
    func leaveGroup(groupId: String, userId: String) async throws {
        // Remove user from group members
        try await db.collection("groups").document(groupId).updateData([
            "members": FieldValue.arrayRemove([userId])
        ])
        
        // Update user's groupIds
        try await db.collection("users").document(userId).updateData([
            "groupIds": FieldValue.arrayRemove([groupId])
        ])
    }
    
    /// Get user's group IDs (for querying events)
    var userGroupIds: [String] {
        userGroups.compactMap { $0.id }
    }
    
    func stopListening() {
        listener?.remove()
        listener = nil
    }
    
    /// Generate a random 6-character join code
    private func generateJoinCode() -> String {
        let letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Excluding ambiguous chars
        return String((0..<6).map { _ in letters.randomElement()! })
    }
    
    deinit {
        listener?.remove()
    }
}

enum GroupError: LocalizedError {
    case groupNotFound
    case alreadyMember
    
    var errorDescription: String? {
        switch self {
        case .groupNotFound:
            return "No group found with that code"
        case .alreadyMember:
            return "You're already a member of this group"
        }
    }
}
