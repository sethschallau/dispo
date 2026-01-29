//
//  GroupRowView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI

struct GroupRowView: View {
    let group: AppGroup
    
    var body: some View {
        HStack(spacing: 12) {
            // Group Avatar
            Circle()
                .fill(avatarColor.opacity(0.2))
                .frame(width: 44, height: 44)
                .overlay(
                    Text(String(group.name.prefix(1)).uppercased())
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(avatarColor)
                )
            
            VStack(alignment: .leading, spacing: 4) {
                Text(group.name)
                    .fontWeight(.medium)
                
                HStack(spacing: 4) {
                    Image(systemName: "person.2")
                        .font(.caption2)
                    Text("\(group.members.count)")
                        .font(.caption)
                }
                .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Join code badge
            if let code = group.joinCode {
                Text(code)
                    .font(.caption2)
                    .fontWeight(.medium)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(4)
            }
        }
        .padding(.vertical, 4)
    }
    
    private var avatarColor: Color {
        // Simple deterministic color based on name
        let colors: [Color] = [.blue, .green, .orange, .purple, .pink, .teal]
        let index = abs(group.name.hashValue) % colors.count
        return colors[index]
    }
}

#Preview {
    List {
        GroupRowView(group: AppGroup(
            id: "1",
            name: "Charleston Race Crew",
            members: ["user1", "user2", "user3"],
            ownerId: "user1",
            joinCode: "RACE26"
        ))
        GroupRowView(group: AppGroup(
            id: "2",
            name: "NC Hikers",
            members: ["user1", "user2"],
            ownerId: "user1",
            joinCode: "HIKE26"
        ))
    }
}
