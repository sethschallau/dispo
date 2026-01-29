//
//  NotificationsView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI
import Combine
import FirebaseCore

struct NotificationsView: View {
    @EnvironmentObject var authService: AuthService
    @StateObject private var notificationsService = NotificationsService()
    
    var body: some View {
        Group {
            if notificationsService.isLoading && notificationsService.notifications.isEmpty {
                ProgressView("Loading...")
            } else if notificationsService.notifications.isEmpty {
                emptyState
            } else {
                notificationsList
            }
        }
        .navigationTitle("Notifications")
        .toolbar {
            if notificationsService.unreadCount > 0 {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Mark All Read") {
                        markAllRead()
                    }
                    .font(.caption)
                }
            }
        }
        .onAppear {
            if let userId = authService.currentUserId {
                notificationsService.loadNotifications(for: userId)
            }
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "bell.slash")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("No notifications yet")
                .font(.headline)
            
            Text("You'll see updates about events and groups here")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var notificationsList: some View {
        List {
            ForEach(notificationsService.notifications) { notification in
                NotificationRowView(notification: notification)
                    .listRowBackground(notification.read ? Color.clear : Color.blue.opacity(0.05))
                    .onTapGesture {
                        markAsRead(notification)
                    }
            }
        }
        .listStyle(.plain)
    }
    
    private func markAsRead(_ notification: AppNotification) {
        guard let userId = authService.currentUserId,
              let notifId = notification.id,
              !notification.read else { return }
        
        Task {
            try? await notificationsService.markAsRead(notificationId: notifId, userId: userId)
        }
    }
    
    private func markAllRead() {
        guard let userId = authService.currentUserId else { return }
        
        Task {
            try? await notificationsService.markAllAsRead(userId: userId)
        }
    }
}

struct NotificationRowView: View {
    let notification: AppNotification
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Icon
            Image(systemName: iconName)
                .font(.title3)
                .foregroundColor(iconColor)
                .frame(width: 32, height: 32)
                .background(iconColor.opacity(0.1))
                .clipShape(Circle())
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(notification.message)
                    .font(.subheadline)
                    .fontWeight(notification.read ? .regular : .medium)
                
                if let timestamp = notification.timestamp?.dateValue() {
                    Text(timestamp, style: .relative)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            // Unread indicator
            if !notification.read {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 8)
    }
    
    private var iconName: String {
        guard let type = NotificationType(rawValue: notification.type) else {
            return "bell"
        }
        return type.icon
    }
    
    private var iconColor: Color {
        switch notification.type {
        case "new_event": return .blue
        case "new_comment": return .green
        case "group_invite": return .purple
        case "event_reminder": return .orange
        default: return .gray
        }
    }
}

#Preview {
    NavigationView {
        NotificationsView()
            .environmentObject(AuthService.shared)
    }
}
