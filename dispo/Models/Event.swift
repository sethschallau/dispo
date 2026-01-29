//
//  Event.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import Foundation
import FirebaseFirestore

struct Event: Codable, Identifiable {
    @DocumentID var id: String?
    var title: String
    var description: String?
    var eventDate: Date
    var creatorId: String
    @ServerTimestamp var createdAt: Timestamp?
    var groupId: String?
    var visibility: String  // "public", "group", "private", "friends"
    var location: String?
    var imageUrl: String?
    var excludedUserIds: [String]?
    var friendIds: [String]?
    var groupIds: [String]?
}

enum EventVisibility: String, Codable, CaseIterable {
    case `public` = "public"
    case group = "group"
    case `private` = "private"
    case friends = "friends"
    
    var displayName: String {
        switch self {
        case .public: return "Public"
        case .group: return "Group"
        case .private: return "Private"
        case .friends: return "Friends"
        }
    }
    
    var icon: String {
        switch self {
        case .public: return "globe"
        case .group: return "person.3"
        case .private: return "lock"
        case .friends: return "person.2"
        }
    }
}
