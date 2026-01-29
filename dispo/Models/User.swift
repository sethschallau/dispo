//
//  User.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import FirebaseFirestore

struct User: Codable, Identifiable {
    @DocumentID var id: String?
    var username: String
    var fullName: String
    var phone: String?
    var profilePicUrl: String?
    var groupIds: [String]?
    var bio: String?
    @ServerTimestamp var createdAt: Timestamp?
}
