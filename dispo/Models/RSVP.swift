//
//  RSVP.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import FirebaseFirestore

struct RSVP: Codable, Identifiable {
    @DocumentID var id: String?
    var userId: String
    var userName: String?
    var status: RSVPStatus
    @ServerTimestamp var timestamp: Timestamp?
    
    enum RSVPStatus: String, Codable, CaseIterable {
        case going = "going"
        case maybe = "maybe"
        case declined = "declined"
        
        var displayName: String {
            switch self {
            case .going: return "Going"
            case .maybe: return "Maybe"
            case .declined: return "Can't Go"
            }
        }
        
        var icon: String {
            switch self {
            case .going: return "checkmark.circle.fill"
            case .maybe: return "questionmark.circle.fill"
            case .declined: return "xmark.circle.fill"
            }
        }
        
        var color: String {
            switch self {
            case .going: return "green"
            case .maybe: return "orange"
            case .declined: return "red"
            }
        }
    }
}
