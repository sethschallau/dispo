//
//  EventRowView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI

struct EventRowView: View {
    let event: Event
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Date Badge
            dateBadge
            
            // Event Info
            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.headline)
                    .lineLimit(1)
                
                if let location = event.location, !location.isEmpty {
                    Label(location, systemImage: "mappin")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
                
                HStack {
                    Text(event.eventDate, format: .dateTime.hour().minute())
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    // Visibility Badge
                    visibilityBadge
                }
            }
            
            Spacer(minLength: 0)
            
            // Thumbnail if image exists
            thumbnail
        }
        .padding(.vertical, 8)
    }
    
    // MARK: - Date Badge
    
    private var dateBadge: some View {
        VStack(spacing: 2) {
            Text(event.eventDate, format: .dateTime.month(.abbreviated))
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
                .textCase(.uppercase)
            Text(event.eventDate, format: .dateTime.day())
                .font(.title2)
                .fontWeight(.bold)
        }
        .frame(width: 50)
    }
    
    // MARK: - Visibility Badge
    
    private var visibilityBadge: some View {
        Text(event.visibility.capitalized)
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(visibilityColor.opacity(0.15))
            .foregroundColor(visibilityColor)
            .cornerRadius(4)
    }
    
    private var visibilityColor: Color {
        switch event.visibility {
        case "public": return .green
        case "group": return .blue
        case "private": return .orange
        case "friends": return .purple
        default: return .gray
        }
    }
    
    // MARK: - Thumbnail
    
    @ViewBuilder
    private var thumbnail: some View {
        if let imageUrl = event.imageUrl, let url = URL(string: imageUrl) {
            AsyncImage(url: url) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                Color.gray.opacity(0.2)
            }
            .frame(width: 50, height: 50)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}

// MARK: - Preview

#Preview {
    List {
        EventRowView(event: Event(
            id: "1",
            title: "Post-Race Beers",
            description: "Celebrating!",
            eventDate: Date().addingTimeInterval(86400),
            creatorId: "user1",
            visibility: "group",
            location: "Downtown Charleston"
        ))
        
        EventRowView(event: Event(
            id: "2",
            title: "Umstead Recovery Run",
            eventDate: Date().addingTimeInterval(86400 * 5),
            creatorId: "user1",
            visibility: "public",
            location: "Umstead State Park"
        ))
        
        EventRowView(event: Event(
            id: "3",
            title: "Private Meeting",
            eventDate: Date().addingTimeInterval(86400 * 10),
            creatorId: "user1",
            visibility: "private"
        ))
    }
    .listStyle(.plain)
}
