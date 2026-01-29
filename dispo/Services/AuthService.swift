//
//  AuthService.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import Foundation
import Combine
import FirebaseFirestore

@MainActor
class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var currentUser: User?
    @Published var isLoggedIn: Bool = false
    @Published var isLoading: Bool = false
    
    private let db = Firestore.firestore()
    private let userIdKey = "currentUserId"
    
    var currentUserId: String? {
        get { UserDefaults.standard.string(forKey: userIdKey) }
        set {
            UserDefaults.standard.set(newValue, forKey: userIdKey)
            isLoggedIn = newValue != nil
        }
    }
    
    init() {
        // Check for existing session on launch
        if let userId = currentUserId {
            Task {
                await loadUser(id: userId)
            }
        }
    }
    
    /// Log in with phone number. Creates user if doesn't exist.
    func login(phone: String, name: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        // Normalize phone number (remove formatting)
        let userId = phone
            .replacingOccurrences(of: "-", with: "")
            .replacingOccurrences(of: " ", with: "")
            .replacingOccurrences(of: "(", with: "")
            .replacingOccurrences(of: ")", with: "")
            .replacingOccurrences(of: "+", with: "")
        
        let userRef = db.collection("users").document(userId)
        
        // Check if user exists
        let doc = try await userRef.getDocument()
        
        if doc.exists {
            // Load existing user
            currentUser = try doc.data(as: User.self)
        } else {
            // Create new user
            let newUser = User(
                username: name.lowercased().replacingOccurrences(of: " ", with: "_"),
                fullName: name,
                phone: phone,
                groupIds: [],
                bio: ""
            )
            try userRef.setData(from: newUser)
            currentUser = newUser
            currentUser?.id = userId
        }
        
        currentUserId = userId
    }
    
    /// Load user data from Firestore
    func loadUser(id: String) async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let doc = try await db.collection("users").document(id).getDocument()
            if doc.exists {
                currentUser = try doc.data(as: User.self)
                isLoggedIn = true
            } else {
                // User document doesn't exist anymore, clear local session
                logout()
            }
        } catch {
            print("Error loading user: \(error)")
        }
    }
    
    /// Clear local session
    func logout() {
        currentUserId = nil
        currentUser = nil
        isLoggedIn = false
    }
}

