//
//  Comment.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import FirebaseFirestore

struct Comment: Codable, Identifiable {
    @DocumentID var id: String?
    var authorId: String
    var text: String
    @ServerTimestamp var timestamp: Timestamp?
    var authorName: String?
}
