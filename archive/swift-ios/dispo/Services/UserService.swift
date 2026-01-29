//
//  UserService.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import Foundation
import FirebaseFirestore

class UserService {
    static let shared = UserService()
    private let db = Firestore.firestore()
    
    private init() {}
    
    /// Search users by username (prefix match)
    func searchUsers(query: String, limit: Int = 10) async throws -> [User] {
        let lowercased = query.lowercased()
        
        // Search by username prefix
        let snapshot = try await db.collection("users")
            .whereField("username", isGreaterThanOrEqualTo: lowercased)
            .whereField("username", isLessThan: lowercased + "\u{f8ff}")
            .limit(to: limit)
            .getDocuments()
        
        return snapshot.documents.compactMap { try? $0.data(as: User.self) }
    }
    
    /// Search users by full name (prefix match)
    func searchUsersByName(query: String, limit: Int = 10) async throws -> [User] {
        let lowercased = query.lowercased()
        
        let snapshot = try await db.collection("users")
            .whereField("fullNameLower", isGreaterThanOrEqualTo: lowercased)
            .whereField("fullNameLower", isLessThan: lowercased + "\u{f8ff}")
            .limit(to: limit)
            .getDocuments()
        
        return snapshot.documents.compactMap { try? $0.data(as: User.self) }
    }
    
    /// Get a user by ID
    func getUser(id: String) async throws -> User? {
        let doc = try await db.collection("users").document(id).getDocument()
        return try? doc.data(as: User.self)
    }
    
    /// Get multiple users by IDs
    func getUsers(ids: [String]) async throws -> [User] {
        guard !ids.isEmpty else { return [] }
        
        // Firestore 'in' query supports max 10 items
        var allUsers: [User] = []
        
        for chunk in ids.chunked(into: 10) {
            let snapshot = try await db.collection("users")
                .whereField(FieldPath.documentID(), in: chunk)
                .getDocuments()
            
            let users = snapshot.documents.compactMap { try? $0.data(as: User.self) }
            allUsers.append(contentsOf: users)
        }
        
        return allUsers
    }
    
    /// Update username
    func updateUsername(_ username: String, for userId: String) async throws {
        try await db.collection("users").document(userId).updateData([
            "username": username.lowercased()
        ])
    }
}

// MARK: - Array Extension

extension Array {
    func chunked(into size: Int) -> [[Element]] {
        stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}
