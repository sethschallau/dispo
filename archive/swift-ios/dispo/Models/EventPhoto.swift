//
//  EventPhoto.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import FirebaseFirestore

struct EventPhoto: Codable, Identifiable {
    @DocumentID var id: String?
    var uploaderId: String
    var uploaderName: String?
    var imageUrl: String
    var caption: String?
    @ServerTimestamp var timestamp: Timestamp?
}
