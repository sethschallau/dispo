//
//  AppNotification.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import FirebaseFirestore

struct AppNotification: Codable, Identifiable {
    @DocumentID var id: String?
    var type: String
    var message: String
    var relatedId: String?
    var relatedType: String?
    @ServerTimestamp var timestamp: Timestamp?
    var read: Bool
    var fromUserId: String?
}

enum NotificationType: String {
    case newEvent = "new_event"
    case newComment = "new_comment"
    case groupInvite = "group_invite"
    case eventReminder = "event_reminder"
    
    var icon: String {
        switch self {
        case .newEvent: return "calendar.badge.plus"
        case .newComment: return "bubble.left"
        case .groupInvite: return "person.badge.plus"
        case .eventReminder: return "bell"
        }
    }
}
